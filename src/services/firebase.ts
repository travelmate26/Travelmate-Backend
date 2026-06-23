import admin from 'firebase-admin';
import { config } from '../config';

export function ensureFirebaseAdmin(): admin.app.App | null {
  if (admin.apps.length > 0) return admin.app();

  const { projectId, clientEmail, privateKey } = config.firebase;
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin credentials missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    console.log('Firebase Admin initialized.');
    return admin.app();
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
    return null;
  }
}

export async function verifyFirebaseIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  ensureFirebaseAdmin();
  return admin.auth().verifyIdToken(idToken);
}
