import { initializeApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'
import { getAuth, type Auth } from 'firebase/auth'

// Firebase web-app config is public by design — security is enforced by the
// Realtime Database rules (see firebase.rules.json). Env vars override the
// defaults so you can point at a different project without editing code.
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ?? 'AIzaSyCh2PKsKLfDAsA4jkVf-lLOhkTeeN-arqs',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? 'hirelly-cfef6.firebaseapp.com',
  databaseURL: (import.meta.env.VITE_FIREBASE_DB_URL as string | undefined) ?? 'https://hirelly-cfef6-default-rtdb.firebaseio.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? 'hirelly-cfef6',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ?? 'hirelly-cfef6.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ?? '222218842187',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ?? '1:222218842187:web:4b27d896f9685afc461dce',
}

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId,
)

let db: Database | null = null
let auth: Auth | null = null

if (firebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  auth = getAuth(app)
}

export { db, auth }