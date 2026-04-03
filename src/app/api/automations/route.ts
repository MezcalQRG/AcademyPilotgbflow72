import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createRequestId, logger, serializeError } from '@/lib/logger';

export async function POST(req: Request) {
  const requestId = createRequestId();
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const data = await req.json();
    const { userId, ...ruleData } = data;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    }

    const ruleRef = db.collection('user_profiles').doc(userId).collection('automation_rules').doc();
    
    const payload = {
      ...ruleData,
      id: ruleRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await ruleRef.set(payload);
    
    logger.info('Automation protocol deployed', { requestId, userId, ruleId: ruleRef.id });
    return NextResponse.json({ success: true, id: ruleRef.id, requestId });
  } catch (error: any) {
    logger.error('Automation deployment failure', { requestId, error: serializeError(error) });
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const requestId = createRequestId();
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const data = await req.json();
    const { userId, ruleId, ...updates } = data;

    if (!userId || !ruleId) {
      return NextResponse.json({ error: 'Missing parameters', requestId }, { status: 400 });
    }

    const ruleRef = db.collection('user_profiles').doc(userId).collection('automation_rules').doc(ruleId);
    await ruleRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info('Automation protocol updated', { requestId, userId, ruleId });
    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    logger.error('Automation update failure', { requestId, error: serializeError(error) });
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
    const ruleId = searchParams.get('ruleId');

    if (!userId || !ruleId) {
      return NextResponse.json({ error: 'Missing parameters', requestId }, { status: 400 });
    }

    const ruleRef = db.collection('user_profiles').doc(userId).collection('automation_rules').doc(ruleId);
    await ruleRef.delete();
    
    logger.info('Automation protocol decommissioned', { requestId, userId, ruleId });
    return NextResponse.json({ success: true, requestId });
  } catch (error: any) {
    logger.error('Automation purge failure', { requestId, error: serializeError(error) });
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}
