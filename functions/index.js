import { getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { onRequest } from 'firebase-functions/v2/https'
import yazl from 'yazl'

const projectId = 'analyticsbook-c4e8f'
const bucketName = `${projectId}.firebasestorage.app`
const allowedOrigins = [
  'https://wunderkindsacademyschool.org',
  'https://www.wunderkindsacademyschool.org',
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:5176',
]
const applicationDocuments = [
  ['passportDocument', 'Student passport', 'student-passport', 'passport'],
  ['birthCertificateFrontDocument', 'Birth certificate front', 'birth-certificate-front', 'birth-certificate-front'],
  ['birthCertificateBackDocument', 'Birth certificate back', 'birth-certificate-back', 'birth-certificate-back'],
  ['birthCertificateDocument', 'Birth certificate', 'birth-certificate', 'birth-certificate'],
  ['mother', 'Mother passport photo', 'mother-passport-photo', 'mother-passport'],
  ['father', 'Father passport photo', 'father-passport-photo', 'father-passport'],
]

const app = getApps().some(existingApp => existingApp.name === '[DEFAULT]')
  ? getApp()
  : initializeApp({ projectId, storageBucket: bucketName })
const auth = getAuth(app)
const db = getFirestore(app, '(default)')
const bucket = getStorage(app).bucket(bucketName)

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function documentPath(application, field) {
  if (field === 'mother' || field === 'father') return application[field]?.passportPhoto || ''
  return application[field] || ''
}

function getExtension(contentType = '') {
  const normalizedType = String(contentType || '').split(';')[0].trim().toLowerCase()
  if (normalizedType === 'application/pdf') return 'pdf'
  if (!normalizedType.startsWith('image/')) return 'bin'
  const imageType = normalizedType.slice('image/'.length).replace(/[^a-z0-9]/g, '')
  return imageType === 'jpeg' ? 'jpg' : imageType || 'image'
}

async function getArchiveEntries(application, applicationId) {
  const ownerUid = application.ownerUid
  if (typeof ownerUid !== 'string' || !ownerUid) {
    throw new HttpError(500, 'The application is missing its document owner.')
  }

  const entries = []
  const missingDocuments = []
  let referencedCount = 0

  for (const [field, label, fileName, documentType] of applicationDocuments) {
    const path = documentPath(application, field)
    if (!path) continue
    referencedCount += 1
    if (path !== `applicationDocuments/${ownerUid}/${applicationId}/${documentType}`) {
      throw new HttpError(500, 'The application contains an invalid document reference.')
    }

    const file = bucket.file(path)
    let metadata
    try {
      ;[metadata] = await file.getMetadata()
    } catch (error) {
      if (error.code === 404 || error.code === '404') {
        missingDocuments.push(label)
        continue
      }
      throw error
    }
    entries.push({
      file,
      label,
      name: `images/${fileName}.${getExtension(metadata.contentType)}`,
    })
  }

  if (referencedCount > 0 && entries.length === 0) {
    throw new HttpError(404, 'None of the application documents referenced by this record were found in Storage.')
  }

  return { entries, missingDocuments }
}

function streamArchive(response, entries, missingDocuments) {
  const archive = new yazl.ZipFile()
  const outputFinished = new Promise((resolve, reject) => {
    archive.outputStream.on('error', reject)
    response.on('finish', resolve)
    response.on('error', reject)
    response.on('close', () => {
      if (!response.writableEnded) reject(new Error('The ZIP download connection closed early.'))
    })
  })

  response.status(200)
  response.set('Content-Type', 'application/zip')
  response.set('Content-Disposition', 'attachment; filename="application-documents.zip"')
  response.set('X-Downloaded-Count', String(entries.length))
  response.set('X-Unavailable-Documents', missingDocuments.join('|'))
  response.set('Access-Control-Expose-Headers', 'X-Downloaded-Count, X-Unavailable-Documents')
  archive.outputStream.pipe(response)

  for (const entry of entries) {
    const stream = entry.file.createReadStream()
    stream.on('error', error => archive.outputStream.destroy(error))
    archive.addReadStream(stream, entry.name, { compress: false })
  }
  if (missingDocuments.length) {
    archive.addBuffer(
      Buffer.from(
        `The following application documents were not found in Storage:\n${missingDocuments.map(label => `- ${label}`).join('\n')}\n`,
      ),
      'download-report.txt',
      { compress: false },
    )
  }

  archive.end()
  return outputFinished
}

export const downloadStudentZip = onRequest(
  {
    region: 'us-central1',
    cors: allowedOrigins,
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 3,
    concurrency: 4,
  },
  async (request, response) => {
    try {
      if (request.method !== 'POST') {
        response.set('Allow', 'POST').status(405).json({ error: 'Use POST to request an application archive.' })
        return
      }

      const authorization = request.get('Authorization') || ''
      const token = authorization.match(/^Bearer (.+)$/i)?.[1]
      if (!token) throw new HttpError(401, 'Sign in as an administrator to download application documents.')

      let decodedToken
      try {
        decodedToken = await auth.verifyIdToken(token, true)
      } catch {
        throw new HttpError(401, 'Your sign-in has expired. Sign in again and retry the download.')
      }

      const adminSnapshot = await db.collection('admins').doc(decodedToken.uid).get()
      if (adminSnapshot.get('active') !== true) {
        throw new HttpError(403, 'An active administrator account is required to download application documents.')
      }

      const applicationId = request.body?.applicationId
      if (typeof applicationId !== 'string' || !/^WA-[A-Z0-9-]{1,100}$/.test(applicationId)) {
        throw new HttpError(400, 'A valid application ID is required.')
      }

      const applicationSnapshot = await db.collection('applications').doc(applicationId).get()
      if (!applicationSnapshot.exists) throw new HttpError(404, 'The selected application was not found.')
      const application = applicationSnapshot.data()
      const { entries, missingDocuments } = await getArchiveEntries(application, applicationId)
      await streamArchive(response, entries, missingDocuments)
    } catch (error) {
      console.error('Unable to generate an application document archive.', error)
      if (response.headersSent) {
        response.destroy(error)
        return
      }
      const status = error instanceof HttpError ? error.status : 500
      const message = error instanceof HttpError
        ? error.message
        : 'The secure download service could not create the ZIP. Please try again or contact the site administrator.'
      response.status(status).json({ error: message })
    }
  },
)
