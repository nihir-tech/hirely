import { initializeApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId,
)

let db: Database | null = null

if (firebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  db = getDatabase(app)
}

export { db }