const admin = require('firebase-admin');

try {
  admin.initializeApp({
    projectId: 'studio-5472086834-71ab7'
  });
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function setupTestTenant() {
  console.log("🌱 Setting up test tenant for prehispanicaztecgod@gmail.com...");

  const email = 'prehispanicaztecgod@gmail.com';
  const tenantSlug = 'prehispanic';
  const tenantName = 'Prehispanic Aztec Academy';

  try {
    // 1. Create the User in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`User already exists with UID: ${userRecord.uid}`);
    } catch (e) {
      userRecord = await auth.createUser({
        email: email,
        password: 'TemporaryPassword123!', // User should change this
        emailVerified: true
      });
      console.log(`Successfully created new user with UID: ${userRecord.uid}`);
    }

    const uid = userRecord.uid;
    const batch = db.batch();

    // 2. Create the Academy Owner Profile
    console.log(`2. Setting up User Profile for ${uid}...`);
    const userRef = db.collection('user_profiles').doc(uid);
    batch.set(userRef, {
      uid: uid,
      email: email,
      role: 'academy_owner',
      tenantSlug: tenantSlug,
      name: 'Aztec God Professor',
      onboardingCompleted: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // 3. Create the Public Landing Page Config
    console.log(`3. Creating Public Tenant Config for slug: /${tenantSlug}...`);
    const landingPageRef = db.collection('landing_pages').doc(tenantSlug);
    batch.set(landingPageRef, {
      slug: tenantSlug,
      branchName: tenantName,
      ownerUid: uid,
      headline: 'Awaken Your Inner Warrior',
      subheadline: 'Ancient discipline meets modern mastery at the Prehispanic Aztec Academy.',
      callToAction: 'Initiate Your Trial',
      contactPhone: '+1 800-AZTEC-JITSU',
      contactEmail: email,
      address: '123 Temple Way, Tenochtitlan Sector',
      heroImage: 'https://graciebarra.com/wp-content/uploads/2025/04/DSC06242bbb_1.png',
      isPublished: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await batch.commit();

    console.log("✅ Test Tenant Setup Completed Successfully!");
    console.log("--------------------------------------------------");
    console.log("🧪 Login Credentials for Testing:");
    console.log(`- Email: ${email}`);
    console.log(`- Password: TemporaryPassword123!`);
    console.log(`- Tenant Slug: /${tenantSlug}`);
    console.log("--------------------------------------------------");

  } catch (error) {
    console.error("❌ Error setting up test tenant:", error);
  }
}

setupTestTenant();