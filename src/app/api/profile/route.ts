import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createRequestId, logger, serializeError } from '@/lib/logger';

export async function PATCH(req: Request) {
  const requestId = createRequestId();
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const data = await req.json();
    const { userId, ...profileUpdates } = data;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    }

    const profileRef = db.collection('user_profiles').doc(userId);
    await profileRef.set({
      ...profileUpdates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    logger.info('Unit profile updated', { requestId, userId });
    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    logger.error('Profile update handshake failure', { requestId, error: serializeError(error) });
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}
