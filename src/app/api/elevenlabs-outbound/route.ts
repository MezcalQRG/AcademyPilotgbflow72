import { NextResponse } from 'next/server';
import { createRequestId, logger, serializeError } from '@/lib/logger';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

type OutboundRequest = {
  tenantSlug: string;
  name: string;
  phone: string;
  email: string;
};

function toE164(rawPhone: string) {
  const digits = rawPhone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') || createRequestId();

  try {
    const body = (await req.json()) as OutboundRequest;
    const { tenantSlug, name, phone, email } = body || ({} as OutboundRequest);

    if (!tenantSlug || !name || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantSlug, name, phone, email', requestId },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

    if (!apiKey || !agentId || !phoneNumberId) {
      logger.error('ElevenLabs outbound config missing', {
        requestId,
        scope: 'api.elevenlabs-outbound',
        hasApiKey: Boolean(apiKey),
        hasAgentId: Boolean(agentId),
        hasPhoneNumberId: Boolean(phoneNumberId),
      });

      return NextResponse.json(
        { error: 'Server configuration error for outbound call.', requestId },
        { status: 500 }
      );
    }

    const payload = {
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: toE164(phone),
      conversation_initiation_client_data: {
        dynamic_variables: {
          tenant_slug: tenantSlug,
          lead_name: name,
          lead_email: email,
          lead_phone: phone,
        },
        metadata: {
          tenantSlug,
          leadName: name,
          leadEmail: email,
          leadPhone: phone,
          source: 'free_trial_dialog',
          requestId,
        },
      },
    };

    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.error('ElevenLabs outbound call failed', {
        requestId,
        scope: 'api.elevenlabs-outbound',
        status: response.status,
        response: data,
      });

      return NextResponse.json(
        {
          error: data?.detail || 'Failed to start outbound call.',
          requestId,
        },
        { status: response.status }
      );
    }

    logger.info('ElevenLabs outbound call started', {
      requestId,
      scope: 'api.elevenlabs-outbound',
      tenantSlug,
      conversationId: data?.conversation_id,
    });

    const conversationId = data?.conversation_id as string | undefined;
    if (conversationId) {
      try {
        const admin = getFirebaseAdmin();
        await admin
          .firestore()
          .collection('elevenlabs_call_sessions')
          .doc(conversationId)
          .set(
            {
              conversationId,
              tenantSlug,
              leadName: name,
              leadEmail: email,
              leadPhone: phone,
              status: 'dialing',
              requestId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      } catch (sessionError) {
        logger.warn('Failed to persist outbound call session state', {
          requestId,
          scope: 'api.elevenlabs-outbound',
          conversationId,
          error: serializeError(sessionError),
        });
      }
    }

    return NextResponse.json({ success: true, data, requestId }, { status: 200 });
  } catch (error: any) {
    logger.error('ElevenLabs outbound route error', {
      requestId,
      scope: 'api.elevenlabs-outbound',
      error: serializeError(error),
    });

    return NextResponse.json(
      { error: 'Unexpected outbound error', details: error?.message, requestId },
      { status: 500 }
    );
  }
}
