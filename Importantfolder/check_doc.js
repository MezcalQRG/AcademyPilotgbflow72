const admin = require('firebase-admin');
const fs = require('fs');
const id = process.argv[2];
if(!id){console.error('Usage: node check_doc.js <docId>'); process.exit(2)}
const serviceAccount = JSON.parse(fs.readFileSync('serviceAccount.json','utf8'));
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
(async()=>{
  const doc = await db.collection('leads').doc(id).get();
  if(!doc.exists) { console.log('NOT_FOUND'); process.exit(0); }
  console.log(JSON.stringify(doc.data(), null, 2));
})().catch(e=>{console.error(e); process.exit(1)});
