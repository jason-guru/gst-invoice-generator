import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

// Server-only Firebase Admin SDK. Uses a service-account credential that lives
// exclusively on the server (never shipped to the browser). The Admin SDK
// bypasses Firestore security rules, so all client access can be locked down to
// `allow read, write: if false` and routed through authenticated API routes.

let app: App

if (getApps().length === 0) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // Private keys stored in env vars have their newlines escaped as "\n".
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set.'
    )
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
} else {
  app = getApps()[0]
}

export const adminDb: Firestore = getFirestore(app)
