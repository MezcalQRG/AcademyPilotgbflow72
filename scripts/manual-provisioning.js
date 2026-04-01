require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialization helper from your codebase concept
function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-5472086834-71ab7';

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } else {
    admin.initializeApp({ projectId });
  }
  return admin;
}

function getDefaultWeeklySchedule() {
  return {
    timezone: 'America/New_York',
    monday: { open: '09:00', close: '20:00', closed: false },
    tuesday: { open: '09:00', close: '20:00', closed: false },
    wednesday: { open: '09:00', close: '20:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '20:00', closed: false },
    saturday: { open: '10:00', close: '14:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: true },
  };
}

async function runSimulation() {
  const email = 'mail.in.mex@gmail.com';
  const fullName = 'quetzal rivas';
  const slug = 'westcovina';
  const phone = '6264820848';
  const sessionId = 'cs_test_a1jCAg5fKwSyFCV7UzTHraWBySZLi9O6Bk58om9cpmsfjIHNqOPLOkPHjZ';

  console.log(`🚀 Manually provisioning tenant: ${slug} (${email})`);

  const sdk = getFirebaseAdmin();
  const db = sdk.firestore();
  const auth = sdk.auth();

  try {
    // 1. Create Auth User
    console.log('  Creating Firebase Auth user...');
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`  ⚠ User already exists with UID: ${user.uid}`);
    } catch (e) {
      user = await auth.createUser({
        email,
        password: 'TemporaryPassword123!',
        displayName: fullName,
      });
      console.log(`  ✓ Created new user with UID: ${user.uid}`);
    }

    // 2. Batch Firestore Writes
    console.log('  Performing Firestore batch provisioning...');
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    batch.set(db.collection('user_profiles').doc(user.uid), {
      id: user.uid,
      uid: user.uid,
      email,
      name: fullName,
      role: 'academy_owner',
      tenantSlug: slug,
      phoneNumber: phone,
      onboardingCompleted: false,
      securitySetupRequired: true,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    batch.set(db.collection('landing_pages').doc(slug), {
      slug,
      userId: user.uid,
      ownerUid: user.uid,
      branchName: fullName,
      headline: `Welcome to ${fullName}`,
      isPublic: false,
      isPublished: false,
      contactPhone: phone,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    batch.set(db.collection('tenants').doc(slug), {
      slug,
      ownerUid: user.uid,
      status: 'active',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    batch.set(db.collection('tenants').doc(slug).collection('settings').doc('schedule'), {
      ...getDefaultWeeklySchedule(),
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    // 3. Mark Stripe Session as Provisioned for Frontend Polling
    batch.set(db.collection('stripe_checkout_sessions').doc(sessionId), {
      status: 'provisioned',
      redirectPath: `/${slug}/dashboard/settings?tab=account&onboarding=1`,
      tenantSlug: slug,
      updatedAt: now,
    }, { merge: true });

    await batch.commit();
    console.log('  ✓ Firestore docs provisioned.');
    console.log('  ✓ Stripe session status updated to \'provisioned\'.');

    console.log('\n✨ PROVISIONED SUCCESSFULLY');
    console.log(`👉 Dashboard Access: http://localhost:9002/${slug}/dashboard`);

  } catch (err) {
    console.error('\n❌ Provisioning failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runSimulation();
