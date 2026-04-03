import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createRequestId, logger, serializeError } from '@/lib/logger';

export async function POST(req: Request) {
  const requestId = createRequestId();
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const data = await req.json();
    const { userId, ...leadData } = data;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    }

    const leadRef = db.collection('user_profiles').doc(userId).collection('leads').doc();
    
    const payload = {
      ...leadData,
      id: leadRef.id,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await leadRef.set(payload);
    
    logger.info('Lead initialized in registry', { requestId, userId, leadId: leadRef.id });
    return NextResponse.json({ success: true, id: leadRef.id, requestId });
  } catch (error: any) {
    logger.error('Lead initialization failure', { requestId, error: serializeError(error) });
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const requestId = createRequestId();
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const data = await req.json();
    const { userId, leadId, ...updates } = data;

    if (!userId || !leadId) {
      return NextResponse.json({ error: 'Missing parameters', requestId }, { status: 400 });
    }

    const leadRef = db.collection('user_profiles').doc(userId).collection('leads').doc(leadId);
    await leadRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info('Lead matrix updated', { requestId, userId, leadId });
    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    logger.error('Lead update failure', { requestId, error: serializeError(error) });
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}
