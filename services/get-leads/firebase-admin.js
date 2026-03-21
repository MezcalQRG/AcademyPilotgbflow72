const admin = require('firebase-admin');

let firestore = null;

/**
 * Initializes the Firebase Admin SDK and returns a Firestore instance.
 * 
 * This function uses a singleton pattern to ensure that the Firebase Admin SDK is initialized only once.
 * It retrieves the Firebase service account credentials from the environment variables.
 */
function getFirestore() {
  if (firestore) {
    return firestore;
  }

  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT must be valid JSON');
      throw e;
    }
  } else {
    throw new Error('Firebase service account credentials not found in environment variables.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  firestore = admin.firestore();
  return firestore;
}

module.exports = { getFirestore };