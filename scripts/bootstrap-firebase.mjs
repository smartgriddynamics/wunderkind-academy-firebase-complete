import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const projectId = 'analyticsbook-c4e8f'
const databaseId = '(default)'
const adminEmail = process.env.FIREBASE_ADMIN_EMAIL?.trim().toLowerCase()
const action = process.env.FIREBASE_ADMIN_ACTION

if (process.env.FIREBASE_BOOTSTRAP_CONFIRM !== projectId) {
  throw new Error(`Set FIREBASE_BOOTSTRAP_CONFIRM=${projectId} to confirm this project.`)
}
if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  throw new Error('Set FIREBASE_ADMIN_EMAIL to the intended administrator email address.')
}
if (!['grant', 'revoke'].includes(action)) {
  throw new Error('Set FIREBASE_ADMIN_ACTION to either "grant" or "revoke".')
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId,
})
const auth = getAuth(app)
const db = getFirestore(app, databaseId)

let adminUser
try {
  adminUser = await auth.getUserByEmail(adminEmail)
} catch (error) {
  if (error.code !== 'auth/user-not-found' || action !== 'grant') throw error

  adminUser = await auth.createUser({
    email: adminEmail,
    displayName: 'Wunderkind Academy Administrator',
    emailVerified: false,
    disabled: false,
  })
  console.log(`Created Firebase Auth account ${adminEmail}; set its password using the site's Forgot password flow.`)
}

if (action === 'grant' && adminUser.disabled) {
  throw new Error(`The Auth account ${adminEmail} is disabled. Enable it before granting admin access.`)
}

const adminRef = db.collection('admins').doc(adminUser.uid)
const existingAdmin = await adminRef.get()

if (action === 'grant') {
  if (!existingAdmin.exists) {
    await adminRef.create({
      active: true,
      email: adminEmail,
      createdAt: FieldValue.serverTimestamp(),
    })
  } else if (existingAdmin.data()?.active !== true) {
    await adminRef.update({ active: true })
  }
} else if (existingAdmin.exists && existingAdmin.data()?.active === true) {
  await adminRef.update({ active: false })
} else if (!existingAdmin.exists) {
  throw new Error(`No admins/${adminUser.uid} record exists; there is no admin grant to revoke.`)
}

console.log(`Completed ${action} for ${adminEmail} in project ${projectId}, Firestore database ${databaseId}.`)
console.log(`Firebase Auth UID: ${adminUser.uid}`)
console.log('This command changes only the admins record and never changes or deletes existing user data.')
