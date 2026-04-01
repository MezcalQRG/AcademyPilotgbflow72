require('dotenv').config({ path: `${__dirname}/.env` });
const admin = require('firebase-admin');

console.log('Testing Firebase Admin SDK initialization...');
const saKeyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!saKeyRaw) {
  console.log('FAIL: FIREBASE_SERVICE_ACCOUNT_KEY is missing from process.env');
  process.exit(1);
}

try {
  const parsed = JSON.parse(saKeyRaw);
  console.log('Successfully parsed FIREBASE_SERVICE_ACCOUNT_KEY JSON. It is valid.');
  
  if (parsed.client_email && parsed.private_key) {
    admin.initializeApp({
      credential: admin.credential.cert(parsed),
      projectId: parsed.project_id
    });
    console.log('App initialized with the service account object.');
  } else {
    console.log('Missing client_email or private_key in parsed JSON object!');
    process.exit(1);
  }
} catch (e) {
  console.error('FAIL: Could not parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON');
  console.error(e.message);
  process.exit(1);
}

const db = admin.firestore();
console.log('Fetching user_profiles...');
db.collection('user_profiles').where('tenantSlug', '==', 'test')
  .limit(1)
  .get()
  .then((snap) => {
    console.log(`Success! Request completed without PERMISSION_DENIED. Found ${snap.size} profiles matching test.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Firestore Error:', err.message);
    process.exit(1);
  });
