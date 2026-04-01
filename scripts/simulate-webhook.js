require('dotenv').config({ path: '.env.local' });
const { getFirebaseAdmin } = require('../src/lib/firebase-admin');
const { completeCheckoutOnboarding } = require('../src/lib/checkout-onboarding');

async function simulateWebhook() {
  const sessionId = process.argv[2] || 'cs_test_a16EVk1c9jRGHUhjfJUeL0VcDYder0UhAsw3FSWh0JyRsUMsYulfZ4xRmM';
  const slug = process.argv[3] || 'westcovina';
  
  console.log(`🚀 Simulating successful webhook for session: ${sessionId}`);
  
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // 1. Manually call the onboarding logic
    const onboardingResult = await completeCheckoutOnboarding(
      {
        email: 'mail.in.mex@gmail.com',
        fullName: 'quetzal rivas',
        phoneNumber: '6264820848',
        tenantSlug: slug,
        planTitle: 'Strategic Plan',
      },
      {
        appBaseUrl: 'http://localhost:9002',
        requestId: 'manual-simulation-' + Date.now(),
      }
    );

    if (onboardingResult.error) {
      console.error('❌ Onboarding failed:', onboardingResult.error);
      process.exit(1);
    }

    console.log('✅ Onboarding successful:', onboardingResult);

    // 2. Update the session document so the frontend polling logic catches it
    await db.collection('stripe_checkout_sessions').doc(sessionId).set({
      status: 'provisioned',
      redirectPath: onboardingResult.redirectPath,
      tenantSlug: slug,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`✨ stripe_checkout_sessions/${sessionId} updated to 'provisioned'`);
    console.log(`🔗 Redirect path: ${onboardingResult.redirectPath}`);

  } catch (err) {
    console.error('💥 Simulation crashed:', err);
  } finally {
    process.exit(0);
  }
}

simulateWebhook();
