
import * as admin from 'firebase-admin';

/**
 * Tactical Firebase Admin Matrix initialization.
 * Ensures the singleton instance is only initialized once within the server environment.
 */
export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  // Tactical logic: Expecting service account key in environment variables for high-security deployment.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'admin-audit-3f2cd',
    });
  } else {
    // Fallback: This may fail in strict production theaters if no SA key is provided.
    admin.initializeApp();
  }

  return admin;
}
