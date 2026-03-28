'use strict';
/**
 * Offboard Tenant Lambda
 * Invoked from the Next.js /api/membership route after OTP verification.
 *
 * Event payload:
 *   { slug: string, uid: string, mode: 'pause' | 'cancel', reason?: string, verifiedBy: 'otp' }
 *
 * ENV required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
 *               AWS_REGION
 * ENV optional: TENANT_TRASH_BUCKET
 */

const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// ─── Init ──────────────────────────────────────────────────────────────────────

function initAdmin() {
  if (admin.apps.length) return admin;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-5472086834-71ab7';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (clientEmail && privateKey) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }), projectId });
  } else {
    admin.initializeApp({ projectId });
  }
  return admin;
}

function getS3() {
  return new S3Client({ region: process.env.AWS_REGION || 'us-east-2' });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function collectSubcollection(ref) {
  const snap = await ref.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function collectQuery(query) {
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteInBatches(db, refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach(r => batch.delete(r));
    await batch.commit();
  }
}

async function uploadJson(s3, bucket, key, data) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  }));
}

// ─── Collect ──────────────────────────────────────────────────────────────────

async function collectTenantData(db, auth, slug, uid) {
  const profileDoc = await db.collection('user_profiles').doc(uid).get();
  const profile = profileDoc.exists ? { id: profileDoc.id, ...profileDoc.data() } : {};

  let authUser = null;
  try {
    const u = await auth.getUser(uid);
    authUser = {
      uid: u.uid, email: u.email, displayName: u.displayName,
      emailVerified: u.emailVerified, disabled: u.disabled,
      providerData: u.providerData,
      metadata: { creationTime: u.metadata.creationTime, lastSignInTime: u.metadata.lastSignInTime },
    };
  } catch (_) {}

  const [
    integrationConfigs, automationRules, tenantSettings,
    leads, callbackQueue
  ] = await Promise.all([
    collectSubcollection(db.collection('user_profiles').doc(uid).collection('integration_configs')),
    collectSubcollection(db.collection('user_profiles').doc(uid).collection('automation_rules')),
    collectSubcollection(db.collection('tenants').doc(slug).collection('settings')),
    collectQuery(db.collection('leads').where('tenantSlug', '==', slug)),
    collectQuery(db.collection('callback_queue').where('tenantSlug', '==', slug)),
  ]);

  let elevenlabsSessions = [];
  try {
    elevenlabsSessions = await collectQuery(
      db.collection('elevenlabs_call_sessions').where('tenantSlug', '==', slug)
    );
  } catch (_) {}

  const landingPageDoc = await db.collection('landing_pages').doc(slug).get();
  const tenantDoc = await db.collection('tenants').doc(slug).get();

  return {
    uid, profile, authUser, integrationConfigs, automationRules,
    landingPage: landingPageDoc.exists ? { id: landingPageDoc.id, ...landingPageDoc.data() } : null,
    tenant: tenantDoc.exists ? { id: tenantDoc.id, ...tenantDoc.data() } : null,
    tenantSettings, leads, callbackQueue, elevenlabsSessions,
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────

async function exportToS3(s3, bucket, slug, mode, data) {
  const exportedAt = new Date().toISOString();
  const prefix = `${slug}/${exportedAt}`;

  const files = [
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

  await Promise.all(
    files.map(([name, payload]) => uploadJson(s3, bucket, `${prefix}/${name}`, payload))
  );

  const manifest = {
    slug, mode, exportedAt, exportedBy: 'lambda/offboard-tenant',
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
    files: files.map(([name]) => `${prefix}/${name}`),
  };

  await uploadJson(s3, bucket, `${prefix}/manifest.json`, manifest);
  return { s3Path: `${bucket}/${prefix}`, exportedAt };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteAllTenantDocs(db, auth, slug, data) {
  const { uid } = data;
  const refs = [];

  // Subcollections first
  data.integrationConfigs.forEach(d =>
    refs.push(db.collection('user_profiles').doc(uid).collection('integration_configs').doc(d.id))
  );
  data.automationRules.forEach(d =>
    refs.push(db.collection('user_profiles').doc(uid).collection('automation_rules').doc(d.id))
  );
  data.tenantSettings.forEach(d =>
    refs.push(db.collection('tenants').doc(slug).collection('settings').doc(d.id))
  );
  data.leads.forEach(d => refs.push(db.collection('leads').doc(d.id)));
  data.callbackQueue.forEach(d => refs.push(db.collection('callback_queue').doc(d.id)));
  data.elevenlabsSessions.forEach(d => refs.push(db.collection('elevenlabs_call_sessions').doc(d.id)));

  // Parents last
  if (data.landingPage) refs.push(db.collection('landing_pages').doc(slug));
  if (data.tenant) refs.push(db.collection('tenants').doc(slug));
  refs.push(db.collection('user_profiles').doc(uid));

  await deleteInBatches(db, refs);

  try {
    await auth.deleteUser(uid);
  } catch (_) {}
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const { slug, uid, mode, reason, verifiedBy } = event;

  if (!slug || !uid || !['pause', 'cancel'].includes(mode)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'slug, uid, and mode (pause|cancel) are required' }) };
  }

  if (verifiedBy !== 'otp') {
    return { statusCode: 403, body: JSON.stringify({ error: 'OTP verification required' }) };
  }

  const TRASH_BUCKET = process.env.TENANT_TRASH_BUCKET || 'academypilot-tenant-trash';

  const sdk = initAdmin();
  const db = sdk.firestore();
  const auth = sdk.auth();

  if (mode === 'pause') {
    await db.collection('tenants').doc(slug).set(
      { status: 'paused', pausedAt: admin.firestore.FieldValue.serverTimestamp(), pauseReason: reason || 'user-requested' },
      { merge: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, mode: 'pause' }),
    };
  }

  const s3 = getS3();
  const data = await collectTenantData(db, auth, slug, uid);
  const { s3Path, exportedAt } = await exportToS3(s3, TRASH_BUCKET, slug, mode, data);

  // cancel: tombstone first, then delete
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('deleted_tenants').doc(slug).set({
    slug, uid,
    deletedAt: now,
    s3Path,
    reason: reason || 'user-requested',
    deletedBy: `offboard-lambda/otp/${verifiedBy}`,
  });

  await deleteAllTenantDocs(db, auth, slug, data);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, mode: 'cancel', s3Path, exportedAt }),
  };
};
