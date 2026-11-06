import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const FIRESTORE_DATABASE_ID = '(default)'
export const FUNCTIONS_REGION = 'us-central1'

const firebaseConfig = {
  apiKey: 'AIzaSyD1QVeGY7ZnUWirkKuudvPNUbYbthdyugE',
  authDomain: 'analyticsbook-c4e8f.firebaseapp.com',
  projectId: 'analyticsbook-c4e8f',
  storageBucket: 'analyticsbook-c4e8f.firebasestorage.app',
  messagingSenderId: '847316888383',
  appId: '1:847316888383:web:51585a3945cb7e0296818a',
  measurementId: 'G-PHGWTDDNTL',
}
export const DOWNLOAD_STUDENT_ZIP_URL = `https://${FUNCTIONS_REGION}-${firebaseConfig.projectId}.cloudfunctions.net/downloadStudentZip`
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app, FIRESTORE_DATABASE_ID)
export const storage = getStorage(app)
