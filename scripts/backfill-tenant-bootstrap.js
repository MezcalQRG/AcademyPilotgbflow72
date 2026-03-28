const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps.length) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-5472086834-71ab7';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    admin.initializeApp({ projectId });
  }

  return admin;
}

function getDefaultWeeklySchedule() {
  return {
    timezone: process.env.TZ || 'America/New_York',
    monday: { open: '09:00', close: '20:00', closed: false },
    tuesday: { open: '09:00', close: '20:00', closed: false },
    wednesday: { open: '09:00', close: '20:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '20:00', closed: false },
    saturday: { open: '10:00', close: '14:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: true },
  };
}

async function backfillTenantBootstrap() {
  const sdk = initAdmin();
  const db = sdk.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const profilesSnap = await db.collection('user_profiles').get();

  let processed = 0;
  let skipped = 0;

  for (const profileDoc of profilesSnap.docs) {
    const profile = profileDoc.data() || {};
    const uid = profile.uid || profile.id || profileDoc.id;
    const tenantSlug = profile.tenantSlug;

    if (!tenantSlug || !uid) {
      skipped += 1;
      continue;
    }

    const batch = db.batch();

    const profileRef = db.collection('user_profiles').doc(profileDoc.id);
    const landingRef = db.collection('landing_pages').doc(tenantSlug);
    const tenantRef = db.collection('tenants').doc(tenantSlug);
    const scheduleRef = tenantRef.collection('settings').doc('schedule');

    batch.set(
      profileRef,
      {
        id: uid,
        uid,
        schemaVersion: profile.schemaVersion || 1,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(
      landingRef,
      {
        slug: tenantSlug,
        userId: profileDoc.id,
        ownerUid: profileDoc.id,
        branchName: profile.name || tenantSlug,
        isPublished: false,
        isPublic: false,
        schemaVersion: 1,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(
      tenantRef,
      {
        slug: tenantSlug,
        ownerUid: profileDoc.id,
        status: 'active',
        schemaVersion: 1,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(
      scheduleRef,
      {
        ...getDefaultWeeklySchedule(),
        schemaVersion: 1,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();
    processed += 1;
  }

  console.log('Backfill completed.');
  console.log(`Processed: ${processed}`);
  console.log(`Skipped: ${skipped}`);
}

backfillTenantBootstrap().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
