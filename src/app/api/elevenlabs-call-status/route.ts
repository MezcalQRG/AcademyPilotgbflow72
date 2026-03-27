import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { createRequestId, logger, serializeError } from '@/lib/logger';

type SessionStatus = 'dialing' | 'connected' | 'ended' | 'failed';

function normalizeStatus(raw: string): SessionStatus {
  const value = raw.toLowerCase();

  if (
    value.includes('answer') ||
    value.includes('connect') ||
    value.includes('start') ||
    value.includes('in_progress') ||
    value.includes('in-progress')
  ) {
    return 'connected';
  }

  if (
    value.includes('end') ||
    value.includes('complete') ||
    value.includes('hangup') ||
    value.includes('disconnect')
  ) {
    return 'ended';
  }

  if (
    value.includes('fail') ||
    value.includes('error') ||
    value.includes('busy') ||
    value.includes('no_answer') ||
    value.includes('no-answer') ||
    value.includes('cancel')
  ) {
    return 'failed';
  }

  return 'dialing';
}

function extractConversationId(payload: any): string | null {
  return (
    payload?.conversation_id ||
    payload?.conversationId ||
    payload?.call_id ||
    payload?.callId ||
    payload?.data?.conversation_id ||
    payload?.data?.conversationId ||
    payload?.metadata?.conversation_id ||
    payload?.metadata?.conversationId ||
    null
  );
}

function extractStatus(payload: any): SessionStatus {
  const eventLike =
    payload?.event ||
    payload?.event_type ||
    payload?.type ||
    payload?.status ||
    payload?.call_status ||
    payload?.data?.event ||
    payload?.data?.status ||
    payload?.data?.call_status ||
    '';

  if (typeof eventLike === 'string' && eventLike.trim()) {
    return normalizeStatus(eventLike);
  }

  // Post-call transcript payloads imply the conversation has ended.
  if (payload?.transcript || payload?.analysis || payload?.messages) {
    return 'ended';
  }

  return 'dialing';
}

export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') || createRequestId();

  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required', requestId }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const doc = await admin
      .firestore()
      .collection('elevenlabs_call_sessions')
      .doc(conversationId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ status: 'dialing', found: false, requestId }, { status: 200 });
    }

    return NextResponse.json({ found: true, ...(doc.data() || {}), requestId }, { status: 200 });
  } catch (error: any) {
    logger.error('Call status fetch error', {
      requestId,
      scope: 'api.elevenlabs-call-status',
      error: serializeError(error),
    });

    return NextResponse.json({ error: 'Failed to fetch call status', requestId }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') || createRequestId();

  try {
    const authHeader = req.headers.get('authorization') || '';
    const sharedSecret = process.env.ELEVENLABS_WEBHOOK_SECRET || '123456789';
    if (authHeader !== `Bearer ${sharedSecret}` && authHeader !== sharedSecret) {
      return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const conversationId = extractConversationId(payload);

    if (!conversationId) {
      return NextResponse.json({ success: true, skipped: true, reason: 'conversationId missing', requestId }, { status: 200 });
    }

    const status = extractStatus(payload);
    const admin = getFirebaseAdmin();

    await admin
      .firestore()
      .collection('elevenlabs_call_sessions')
      .doc(conversationId)
      .set(
        {
          conversationId,
          status,
          lastWebhookEvent:
            payload?.event || payload?.event_type || payload?.type || payload?.status || payload?.call_status || null,
          webhookPayload: payload,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    logger.info('Call status webhook processed', {
      requestId,
      scope: 'api.elevenlabs-call-status',
      conversationId,
      status,
    });

    return NextResponse.json({ success: true, conversationId, status, requestId }, { status: 200 });
  } catch (error: any) {
    logger.error('Call status webhook error', {
      requestId,
      scope: 'api.elevenlabs-call-status',
      error: serializeError(error),
    });

    // Return 200 to avoid webhook retries on parsing issues.
    return NextResponse.json({ success: true, logged: true, requestId }, { status: 200 });
  }
}
