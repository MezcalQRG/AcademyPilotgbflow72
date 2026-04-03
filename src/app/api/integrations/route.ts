import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createRequestId, logger, serializeError } from '@/lib/logger';

export async function POST(req: Request) {
  const requestId = createRequestId();
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const data = await req.json();
    const { userId, configId, name, ...configData } = data;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    }

    const configRef = db.collection('user_profiles').doc(userId).collection('integration_configs').doc(configId);
    const payload = {
      ...configData,
      id: configId,
      userId,
      name,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };

    await configRef.set(payload, { merge: true });
    
    logger.info('Vendor credential secured', { requestId, userId, configId });
    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    logger.error('Integration handshake failure', { requestId, error: serializeError(error) });
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const requestId = createRequestId();
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const configId = searchParams.get('configId');

    if (!userId || !configId) {
      return NextResponse.json({ error: 'Missing parameters', requestId }, { status: 400 });
    }

    const configRef = db.collection('user_profiles').doc(userId).collection('integration_configs').doc(configId);
    await configRef.delete();
    
    logger.info('Vendor link terminated', { requestId, userId, configId });
    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    logger.error('Integration purge failure', { requestId, error: serializeError(error) });
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}
