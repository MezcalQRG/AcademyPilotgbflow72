#!/usr/bin/env node
/**
 * Offboard Tenant CLI
 * Usage:
 *   node scripts/offboard-tenant.js --slug=my-academy --mode=pause [--reason="reason"]
 *   node scripts/offboard-tenant.js --slug=my-academy --mode=cancel [--reason="cancelled"]
 *
 * Modes:
 *   pause  → sets tenants/{slug}.status = 'paused' in Firestore
 *   cancel → exports full snapshot to S3 trash bucket; deletes ALL Firestore docs + Firebase Auth user;
 *            writes deleted_tenants/{slug} tombstone (30-day S3 lifecycle expires objects automatically)
 *
 * ENV required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
 *               AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * ENV optional: TENANT_TRASH_BUCKET (default: academypilot-tenant-trash)
 */

'use strict';

require('dotenv').config();
const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// ─── Firebase ──────────────────────────────────────────────────────────────────

function initAdmin() {
  if (admin.apps.length) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-5472086834-71ab7';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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

// ─── S3 ────────────────────────────────────────────────────────────────────────

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadToS3(s3, bucket, key, data) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  }));
  console.log(`  ✓ s3://${bucket}/${key}`);
}

// ─── Firestore Helpers ─────────────────────────────────────────────────────────

async function collectSubcollection(ref) {
  const snap = await ref.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function collectFlatQuery(query) {
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteInBatches(db, docs) {
  const BATCH_SIZE = 400;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i, i + BATCH_SIZE).forEach(({ ref }) => batch.delete(ref));
    await batch.commit();
  }
}

// ─── Core Export ──────────────────────────────────────────────────────────────

async function collectTenantData(db, auth, slug) {
  console.log('\n[Phase 1] Collecting tenant data from Firestore...');

  // Resolve uid from user_profiles
  const profilesSnap = await db.collection('user_profiles')
    .where('tenantSlug', '==', slug)
    .limit(1)
    .get();

  if (profilesSnap.empty) {
    throw new Error(`No user_profile found for slug: ${slug}`);
  }

  const profileDoc = profilesSnap.docs[0];
  const profile = { id: profileDoc.id, ...profileDoc.data() };
  const uid = profile.uid || profile.id;

  console.log(`  Found owner uid: ${uid}`);

  // Firebase Auth user
  let authUser = null;
  try {
    authUser = await auth.getUser(uid);
    authUser = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      emailVerified: authUser.emailVerified,
      disabled: authUser.disabled,
      providerData: authUser.providerData,
      metadata: { creationTime: authUser.metadata.creationTime, lastSignInTime: authUser.metadata.lastSignInTime },
    };
  } catch (e) {
    console.warn(`  ⚠ Could not fetch Auth user: ${e.message}`);
  }

  // Subcollections under user_profiles/{uid}
  const integrationConfigs = await collectSubcollection(
    db.collection('user_profiles').doc(uid).collection('integration_configs')
  );
  const automationRules = await collectSubcollection(
    db.collection('user_profiles').doc(uid).collection('automation_rules')
  );

  // Top-level docs
  const landingPageDoc = await db.collection('landing_pages').doc(slug).get();
  const tenantDoc = await db.collection('tenants').doc(slug).get();

  // tenants/{slug}/settings subcollection
  const tenantSettings = await collectSubcollection(
    db.collection('tenants').doc(slug).collection('settings')
  );

  // Flat collections filtered by tenantSlug
  const leads = await collectFlatQuery(
    db.collection('leads').where('tenantSlug', '==', slug)
  );
  const callbackQueue = await collectFlatQuery(
    db.collection('callback_queue').where('tenantSlug', '==', slug)
  );

  // elevenlabs sessions — try the field, gracefully skip if not indexed
  let elevenlabsSessions = [];
  try {
    elevenlabsSessions = await collectFlatQuery(
      db.collection('elevenlabs_call_sessions').where('tenantSlug', '==', slug)
    );
  } catch (e) {
    console.warn(`  ⚠ Could not fetch elevenlabs_call_sessions: ${e.message}`);
  }

  const totalDocs = 1 + integrationConfigs.length + automationRules.length + 1 + 1 +
    tenantSettings.length + leads.length + callbackQueue.length + elevenlabsSessions.length;

  console.log(`  Collected ${totalDocs} docs total`);
  console.log(`    user_profile: 1, integration_configs: ${integrationConfigs.length}, automation_rules: ${automationRules.length}`);
  console.log(`    landing_page: 1, tenant: 1, tenant_settings: ${tenantSettings.length}`);
  console.log(`    leads: ${leads.length}, callback_queue: ${callbackQueue.length}, call_sessions: ${elevenlabsSessions.length}`);

  return {
    uid,
    profile,
    authUser,
    integrationConfigs,
    automationRules,
    landingPage: landingPageDoc.exists ? { id: landingPageDoc.id, ...landingPageDoc.data() } : null,
    tenant: tenantDoc.exists ? { id: tenantDoc.id, ...tenantDoc.data() } : null,
    tenantSettings,
    leads,
    callbackQueue,
    elevenlabsSessions,
  };
}

// ─── S3 Export ────────────────────────────────────────────────────────────────

async function exportToS3(s3, bucket, slug, mode, data) {
  console.log(`\n[Phase 2] Uploading snapshot to s3://${bucket}...`);

  const deletedAt = new Date().toISOString();
  const prefix = `${slug}/${deletedAt}`;

  const manifest = {
    slug,
    mode,
    exportedAt: deletedAt,
    exportedBy: 'cli/offboard-tenant',
    files: [],
    docCounts: {
      profile: 1,
      integrationConfigs: data.integrationConfigs.length,
      automationRules: data.automationRules.length,
      landingPage: data.landingPage ? 1 : 0,
      tenant: data.tenant ? 1 : 0,
      tenantSettings: data.tenantSettings.length,
      leads: data.leads.length,
      callbackQueue: data.callbackQueue.length,
      elevenlabsSessions: data.elevenlabsSessions.length,
    },
  };

  const uploads = [
    ['user_profile.json', data.profile],
    ['auth_user.json', data.authUser],
    ['landing_page.json', data.landingPage],
    ['tenant.json', data.tenant],
    ['tenant_settings.json', data.tenantSettings],
    ['integration_configs.json', data.integrationConfigs],
    ['automation_rules.json', data.automationRules],
    ['leads.json', data.leads],
    ['callback_queue.json', data.callbackQueue],
    ['elevenlabs_call_sessions.json', data.elevenlabsSessions],
  ];

  for (const [filename, payload] of uploads) {
    const key = `${prefix}/${filename}`;
    await uploadToS3(s3, bucket, key, payload);
    manifest.files.push(key);
  }

  await uploadToS3(s3, bucket, `${prefix}/manifest.json`, manifest);

  return { s3Path: `${bucket}/${prefix}`, deletedAt };
}

// ─── Firestore Delete ─────────────────────────────────────────────────────────

async function deleteAllTenantDocs(db, auth, slug, data) {
  console.log('\n[Phase 3] Deleting from Firestore...');

  const uid = data.uid;
  const docRefs = [];

  // Subcollections first (must delete before parents)
  for (const doc of data.integrationConfigs) {
    docRefs.push({ ref: db.collection('user_profiles').doc(uid).collection('integration_configs').doc(doc.id) });
  }
  for (const doc of data.automationRules) {
    docRefs.push({ ref: db.collection('user_profiles').doc(uid).collection('automation_rules').doc(doc.id) });
  }
  for (const doc of data.tenantSettings) {
    docRefs.push({ ref: db.collection('tenants').doc(slug).collection('settings').doc(doc.id) });
  }

  // Flat collections
  for (const lead of data.leads) {
    docRefs.push({ ref: db.collection('leads').doc(lead.id) });
  }
  for (const item of data.callbackQueue) {
    docRefs.push({ ref: db.collection('callback_queue').doc(item.id) });
  }
  for (const session of data.elevenlabsSessions) {
    docRefs.push({ ref: db.collection('elevenlabs_call_sessions').doc(session.id) });
  }

  // Parent docs last
  if (data.landingPage) {
    docRefs.push({ ref: db.collection('landing_pages').doc(slug) });
  }
  if (data.tenant) {
    docRefs.push({ ref: db.collection('tenants').doc(slug) });
  }
  docRefs.push({ ref: db.collection('user_profiles').doc(uid) });

  await deleteInBatches(db, docRefs);
  console.log(`  Deleted ${docRefs.length} Firestore documents`);

  // Delete Firebase Auth user
  try {
    await auth.deleteUser(uid);
    console.log(`  Deleted Firebase Auth user: ${uid}`);
  } catch (e) {
    console.warn(`  ⚠ Could not delete Auth user (may already be deleted): ${e.message}`);
  }
}

// ─── Tombstone ────────────────────────────────────────────────────────────────

async function writeTombstone(db, slug, uid, s3Path, reason) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('deleted_tenants').doc(slug).set({
    slug,
    uid,
    deletedAt: now,
    s3Path,
    reason: reason || 'manual-offboard',
    deletedBy: 'cli/offboard-tenant',
  });
  console.log(`  Tombstone written: deleted_tenants/${slug}`);
}

// ─── Entry Point ───────────────────────────────────────────────────────────────

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith('--'))
      .map(a => {
        const [k, ...v] = a.slice(2).split('=');
        return [k, v.join('=') || true];
      })
  );

  const slug = args.slug;
  const mode = args.mode;
  const reason = args.reason || 'manual-offboard';

  if (!slug || !['pause', 'cancel'].includes(mode)) {
    console.error('Usage: node scripts/offboard-tenant.js --slug=<slug> --mode=pause|cancel [--reason="..."]');
    process.exit(1);
  }

  const TRASH_BUCKET = process.env.TENANT_TRASH_BUCKET || 'academypilot-tenant-trash';

  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  TENANT OFFBOARD CLI                       ║`);
  console.log(`╚════════════════════════════════════════════╝`);
  console.log(`  slug:   ${slug}`);
  console.log(`  mode:   ${mode.toUpperCase()}`);
  console.log(`  reason: ${reason}`);

  if (mode === 'cancel') {
    console.log('\n⚠  CANCEL mode: This will PERMANENTLY delete all Firestore data and Firebase Auth for this tenant.');
    console.log('   Data will be backed up to S3 for 30 days before automatic expiry.');
    // In CLI context we proceed; in production this is gated by 2-step OTP verification
  }

  const sdk = initAdmin();
  const db = sdk.firestore();
  const auth = sdk.auth();

  if (mode === 'pause') {
    // Pause mode is Firebase-only: keep all tenant data in place.
    console.log('\n[Phase 1] Setting tenant status to paused...');
    await db.collection('tenants').doc(slug).set(
      { status: 'paused', pausedAt: admin.firestore.FieldValue.serverTimestamp(), pauseReason: reason },
      { merge: true }
    );
    console.log(`  tenants/${slug}.status = 'paused'`);
    console.log(`\n✅ PAUSED — Data remains in Firebase`);

  } else {
    const s3 = getS3Client();

    // Phase 1: Collect
    const data = await collectTenantData(db, auth, slug);

    // Phase 2: Export to S3 (cancel only)
    const { s3Path, deletedAt } = await exportToS3(s3, TRASH_BUCKET, slug, mode, data);

    // Phase 3: Write tombstone FIRST (slug reserved even if deletion fails mid-way)
    console.log('\n[Phase 3] Writing deletion tombstone...');
    await writeTombstone(db, slug, data.uid, s3Path, reason);

    // Phase 4: Delete all Firestore docs + Auth user
    await deleteAllTenantDocs(db, auth, slug, data);

    console.log(`\n✅ CANCELLED — All data deleted. Snapshot at s3://${s3Path} (expires 30 days from ${deletedAt})`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Offboard failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
