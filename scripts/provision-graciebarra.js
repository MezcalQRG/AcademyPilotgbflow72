// Uses same auth pattern as scripts/list-tenants.js (which works)
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function provision() {
  const uid   = 'LPx22bcsSCgXwaezR4P22y40Zr22';
  const email = 'mail.in.mex2025@gmail.com';
  const slug  = 'westcovina';
  const name  = 'Quetzal Rivas';
  const now   = admin.firestore.FieldValue.serverTimestamp();

  console.log('🚀 Provisioning tenant:', slug, '→', email);

  const batch = db.batch();

  // user_profiles/{uid}
  batch.set(db.collection('user_profiles').doc(uid), {
    id: uid, uid, email, name,
    role: 'academy_owner',
    tenantSlug: slug,
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // landing_pages/{slug}
  batch.set(db.collection('landing_pages').doc(slug), {
    slug, ownerUid: uid, userId: uid,
    branchName: 'west covina',
    isPublic: true,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // tenants/{slug}
  batch.set(db.collection('tenants').doc(slug), {
    slug, ownerUid: uid,
    status: 'active',
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // tenants/{slug}/settings/schedule
  batch.set(
    db.collection('tenants').doc(slug).collection('settings').doc('schedule'),
    {
      timezone: 'America/Los_Angeles',
      monday:    { open: '09:00', close: '21:00', closed: false },
      tuesday:   { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday:  { open: '09:00', close: '21:00', closed: false },
      friday:    { open: '09:00', close: '21:00', closed: false },
      saturday:  { open: '10:00', close: '15:00', closed: false },
      sunday:    { open: '10:00', close: '14:00', closed: true },
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  await batch.commit();

  console.log('\n✅  Provisioned successfully!');
  console.log('   user_profiles/' + uid);
  console.log('   landing_pages/' + slug);
  console.log('   tenants/' + slug);
  console.log('   tenants/' + slug + '/settings/schedule');
  console.log('\n👉  Dashboard: https://graciebarra.ai/westcovina/dashboard');
}

provision()
  .catch(e => { console.error('\n❌', e.message); process.exit(1); })
  .finally(() => process.exit(0));
