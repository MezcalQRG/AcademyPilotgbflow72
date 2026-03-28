import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createRequestId, logger, serializeError } from '@/lib/logger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const TRASH_BUCKET = process.env.TENANT_TRASH_BUCKET || 'academypilot-tenant-trash';

// ─── Auth helper ───────────────────────────────────────────────────────────────

async function verifyIdToken(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return null;

  const admin = getFirebaseAdmin();
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}

// ─── OTP helpers ──────────────────────────────────────────────────────────────

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string, slug: string): string {
  return crypto.createHash('sha256').update(`${otp}:${slug}`).digest('hex');
}

// ─── S3 helpers ───────────────────────────────────────────────────────────────

function getS3Client() {
  return new S3Client({ region: process.env.AWS_REGION || 'us-east-2' });
}

async function uploadJson(s3: S3Client, bucket: string, key: string, data: unknown) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  }));
}

// ─── Firestore collect helpers ────────────────────────────────────────────────

async function collectSubcollection(ref: FirebaseFirestore.CollectionReference) {
  const snap = await ref.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function collectQuery(query: FirebaseFirestore.Query) {
  const snap = await query.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteInBatches(
  db: FirebaseFirestore.Firestore,
  refs: FirebaseFirestore.DocumentReference[]
) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach(r => batch.delete(r));
    await batch.commit();
  }
}

// ─── Tenant data collect ──────────────────────────────────────────────────────

async function collectTenantData(
  db: FirebaseFirestore.Firestore,
  auth: import('firebase-admin/auth').Auth,
  slug: string,
  uid: string
) {
  const profileDoc = await db.collection('user_profiles').doc(uid).get();
  const profile = profileDoc.exists ? { id: profileDoc.id, ...profileDoc.data() } : {};

  let authUser: object | null = null;
  try {
    const u = await auth.getUser(uid);
    authUser = {
      uid: u.uid, email: u.email, displayName: u.displayName,
      emailVerified: u.emailVerified, disabled: u.disabled,
      providerData: u.providerData,
      metadata: { creationTime: u.metadata.creationTime, lastSignInTime: u.metadata.lastSignInTime },
    };
  } catch { /* user may not exist */ }

  const [integrationConfigs, automationRules, tenantSettings, leads, callbackQueue] = await Promise.all([
    collectSubcollection(db.collection('user_profiles').doc(uid).collection('integration_configs')),
    collectSubcollection(db.collection('user_profiles').doc(uid).collection('automation_rules')),
    collectSubcollection(db.collection('tenants').doc(slug).collection('settings')),
    collectQuery(db.collection('leads').where('tenantSlug', '==', slug)),
    collectQuery(db.collection('callback_queue').where('tenantSlug', '==', slug)),
  ]);

  let elevenlabsSessions: object[] = [];
  try {
    elevenlabsSessions = await collectQuery(
      db.collection('elevenlabs_call_sessions').where('tenantSlug', '==', slug)
    );
  } catch { /* index may not exist */ }

  const [landingPageDoc, tenantDoc] = await Promise.all([
    db.collection('landing_pages').doc(slug).get(),
    db.collection('tenants').doc(slug).get(),
  ]);

  return {
    uid, profile, authUser, integrationConfigs, automationRules,
    landingPage: landingPageDoc.exists ? { id: landingPageDoc.id, ...landingPageDoc.data() } : null,
    tenant: tenantDoc.exists ? { id: tenantDoc.id, ...tenantDoc.data() } : null,
    tenantSettings, leads, callbackQueue, elevenlabsSessions,
  };
}

async function exportToS3(
  s3: S3Client,
  bucket: string,
  slug: string,
  mode: string,
  data: Awaited<ReturnType<typeof collectTenantData>>
) {
  const exportedAt = new Date().toISOString();
  const prefix = `${slug}/${exportedAt}`;

  const files: [string, unknown][] = [
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
    slug, mode, exportedAt, exportedBy: 'api/membership',
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

async function deleteAllTenantDocs(
  db: FirebaseFirestore.Firestore,
  auth: import('firebase-admin/auth').Auth,
  slug: string,
  data: Awaited<ReturnType<typeof collectTenantData>>
) {
  const { uid } = data;
  const refs: FirebaseFirestore.DocumentReference[] = [];

  data.integrationConfigs.forEach((d: any) =>
    refs.push(db.collection('user_profiles').doc(uid).collection('integration_configs').doc(d.id))
  );
  data.automationRules.forEach((d: any) =>
    refs.push(db.collection('user_profiles').doc(uid).collection('automation_rules').doc(d.id))
  );
  data.tenantSettings.forEach((d: any) =>
    refs.push(db.collection('tenants').doc(slug).collection('settings').doc(d.id))
  );
  data.leads.forEach((d: any) => refs.push(db.collection('leads').doc(d.id)));
  data.callbackQueue.forEach((d: any) => refs.push(db.collection('callback_queue').doc(d.id)));
  data.elevenlabsSessions.forEach((d: any) => refs.push(db.collection('elevenlabs_call_sessions').doc(d.id)));

  if (data.landingPage) refs.push(db.collection('landing_pages').doc(slug));
  if (data.tenant) refs.push(db.collection('tenants').doc(slug));
  refs.push(db.collection('user_profiles').doc(uid));

  await deleteInBatches(db, refs);

  try { await auth.deleteUser(uid); } catch { /* already deleted */ }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const requestId = createRequestId();

  try {
    const decodedToken = await verifyIdToken(req);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    const body = await req.json();
    const { action, mode, otp, confirmName } = body as {
      action: 'request-otp' | 'execute';
      mode: 'pause' | 'cancel';
      otp?: string;
      confirmName?: string;
    };

    if (!action || !mode || !['pause', 'cancel'].includes(mode)) {
      return NextResponse.json({ error: 'action (request-otp|execute) and mode (pause|cancel) are required' }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // Resolve tenant slug from uid
    const profileDoc = await db.collection('user_profiles').doc(uid).get();
    if (!profileDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profile = profileDoc.data()!;
    const slug: string = profile.tenantSlug;
    const email: string = profile.email;
    const name: string = profile.name;

    if (!slug) {
      return NextResponse.json({ error: 'Tenant slug not found for this user' }, { status: 404 });
    }

    const pendingRef = db.collection('tenants').doc(slug).collection('pending_actions').doc('current');

    // ─── REQUEST OTP ────────────────────────────────────────────────────────

    if (action === 'request-otp') {
      const otpCode = generateOtp();
      const otpHash = hashOtp(otpCode, slug);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      await pendingRef.set({
        type: action,
        mode,
        otpHash,
        expiresAt,
        attempts: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Dispatch OTP email via orchestrator
      try {
        const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'https://hmir4kw9lg.execute-api.us-east-2.amazonaws.com/Prod/orchestrate/';
        const ORCHESTRATOR_AUTH_TOKEN = process.env.ORCHESTRATOR_AUTH_TOKEN || '123456789';

        await fetch(ORCHESTRATOR_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ORCHESTRATOR_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
            'x-request-id': requestId,
          },
          body: JSON.stringify({
            action: 'SEND_EMAIL',
            payload: {
              userEmail: email,
              templateType: 'magic-link',
              userData: {
                user_name: name || email,
                magic_link: `Your verification code is: ${otpCode} — expires in 10 minutes.`,
              },
            },
          }),
        });
      } catch (emailErr) {
        logger.error('OTP email dispatch failed', { requestId, slug, error: serializeError(emailErr) });
        // Don't block — OTP was stored; email failure is non-fatal
      }

      logger.info('OTP requested', { requestId, scope: 'api.membership.request-otp', slug, mode });
      return NextResponse.json({ success: true, expiresAt });
    }

    // ─── EXECUTE (verify OTP + run offboard) ─────────────────────────────────

    if (action === 'execute') {
      if (!otp || otp.trim().length === 0) {
        return NextResponse.json({ error: 'OTP code is required' }, { status: 400 });
      }

      if (mode === 'cancel' && (!confirmName || confirmName.trim() === '')) {
        return NextResponse.json({ error: 'Academy name confirmation is required for cancellation' }, { status: 400 });
      }

      // Verify typed name for cancel
      if (mode === 'cancel') {
        const expectedName = (name || slug).trim().toLowerCase();
        const provided = (confirmName || '').trim().toLowerCase();
        if (provided !== expectedName && provided !== slug.toLowerCase()) {
          return NextResponse.json({ error: 'Academy name does not match. Please type it exactly as shown.' }, { status: 400 });
        }
      }

      // Read and validate pending_action
      const pendingDoc = await pendingRef.get();
      if (!pendingDoc.exists) {
        return NextResponse.json({ error: 'No pending verification found. Please request a new code.' }, { status: 400 });
      }

      const pending = pendingDoc.data()!;

      if (pending.expiresAt < Date.now()) {
        await pendingRef.delete();
        return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
      }

      if (pending.attempts >= 3) {
        await pendingRef.delete();
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 });
      }

      if (pending.mode !== mode) {
        return NextResponse.json({ error: 'Verification code was issued for a different action.' }, { status: 400 });
      }

      const providedHash = hashOtp(otp.trim(), slug);
      if (providedHash !== pending.otpHash) {
        await pendingRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
        const attemptsLeft = 2 - pending.attempts;
        return NextResponse.json({ error: `Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.` }, { status: 400 });
      }

      // OTP is valid — delete it immediately to prevent replay
      await pendingRef.delete();

      if (mode === 'pause') {
        await db.collection('tenants').doc(slug).set(
          {
            status: 'paused',
            pausedAt: admin.firestore.FieldValue.serverTimestamp(),
            pauseReason: 'user-requested',
          },
          { merge: true }
        );

        logger.info('Tenant paused', { requestId, slug, uid });
        return NextResponse.json({ success: true, mode: 'pause' });
      }

      const s3 = getS3Client();
      const auth = admin.auth();

      const data = await collectTenantData(db, auth, slug, uid);
      const { s3Path, exportedAt } = await exportToS3(s3, TRASH_BUCKET, slug, mode, data);

      // cancel: tombstone first, then purge
      const now = admin.firestore.FieldValue.serverTimestamp();
      await db.collection('deleted_tenants').doc(slug).set({
        slug, uid,
        deletedAt: now,
        s3Path,
        reason: 'user-requested-cancel',
        deletedBy: `api/membership/otp`,
      });

      await deleteAllTenantDocs(db, auth, slug, data);

      // Revoke all Firebase Auth sessions for this user
      try { await admin.auth().revokeRefreshTokens(uid); } catch { /* already deleted */ }

      logger.info('Tenant cancelled and deleted', { requestId, slug, uid, s3Path });
      return NextResponse.json({ success: true, mode: 'cancel', s3Path, exportedAt });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    logger.error('Membership action failed', {
      requestId,
      scope: 'api.membership',
      error: serializeError(error),
    });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
