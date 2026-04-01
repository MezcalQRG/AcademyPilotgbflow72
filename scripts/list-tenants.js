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

async function listTenants() {
  try {
    const tenantsRef = db.collection('user_profiles');
    const snapshot = await tenantsRef.get();
    
    if (snapshot.empty) {
      console.log("No tenants found in the user_profiles collection.");
      return;
    }

    console.log(`Found ${snapshot.size} tenants:\n`);
    
    const tenants = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      tenants.push({
        name: data.name || data.fullName,
        email: data.email,
        slug: data.tenantSlug,
        role: data.role
      });
    });

    console.table(tenants);

    console.log("\nChecking full 'tenants' configuration collection:\n");
    const fullTenants = await db.collection('tenants').get();
    const configTenants = [];
    fullTenants.forEach(doc => {
      configTenants.push({
        id: doc.id,
        name: doc.data().name,
        currency: doc.data().currency,
        timezone: doc.data().timezone
      });
    });
    console.table(configTenants);

  } catch (err) {
    console.error("Error fetching tenants:", err);
  } finally {
    process.exit(0);
  }
}

listTenants();
