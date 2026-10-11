import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyD9bt8n5v4b_AyO6iir3PQfFcHy-aOUD4Y',
  authDomain: 'wunderkind-academy.firebaseapp.com',
  projectId: 'wunderkind-academy',
  storageBucket: 'wunderkind-academy.firebasestorage.app',
  messagingSenderId: '778050223647',
  appId: '1:778050223647:web:e7cf7492a50994b24c1f2a',
  measurementId: 'G-HTV26W5PMD',
}
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
