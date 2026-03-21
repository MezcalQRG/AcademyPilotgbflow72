const AWS = require('aws-sdk');
const { getFirestore } = require('./firebase-admin');

const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Transcript Webhook Service (Multi-Tenant)
 * 
 * Invoked by ElevenLabs when a conversation ends. It expects the webhook payload
 * to contain the tenantSlug (e.g., passed as a dynamic variable from the agent).
 * It then queries Firestore only for unprocessed leads belonging to that tenant.
 */
exports.handler = async (event) => {
  console.log('--- TRANSCRIPT WEBHOOK ---');

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    // 1. Extract Tenant Information
    // ElevenLabs webhooks can include custom metadata or variables depending on how the agent is configured.
    // We assume the agent is configured to pass back the 'tenantSlug'.
    const tenantSlug = body?.tenantSlug || body?.variables?.tenantSlug;
    
    if (!tenantSlug) {
      console.error('Webhook Configuration Error: Received transcript without a tenantSlug context.');
      // Return 200 to prevent ElevenLabs from retrying a bad payload
      return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Missing tenant context.' }) };
    }

    const transcript = body?.transcript || body?.text || 'No transcript provided';
    console.log(`Processing transcript for tenant: ${tenantSlug}`);

    const db = getFirestore();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Query for unprocessed leads scoped specifically to the tenant
    const snapshot = await db.collection('leads')
      .where('tenantSlug', '==', tenantSlug)
      .where('processed', '==', false)
      .where('createdAt', '>=', twentyFourHoursAgo)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    if (snapshot.empty) {
      console.log(`No unprocessed leads found in the last 24 hours for tenant: ${tenantSlug}. Skipping outbound call.`);
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Processed. No action needed.' }) };
    }

    const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Found ${leads.length} unprocessed leads for tenant ${tenantSlug}.`);

    // 3. Trigger Outbound Call Lambda (if enabled)
    if (process.env.TRIGGER_OUTBOUND === 'true') {
      const outboundLambdaName = process.env.OUTBOUND_LAMBDA_NAME || 'triggerOutboundCallHandler';
      console.log(`Triggering outbound Lambda: ${outboundLambdaName}`);

      try {
        await lambda.invoke({
          FunctionName: outboundLambdaName,
          InvocationType: 'Event', // Asynchronous invocation
          // Pass the tenant context down the pipeline
          Payload: JSON.stringify({ tenantSlug, leads, transcript }) 
        }).promise();
        console.log(`Outbound call Lambda triggered successfully for tenant ${tenantSlug}.`);
      } catch (invokeError) {
        console.error(`Failed to invoke outbound call Lambda for tenant ${tenantSlug}:`, invokeError);
      }
    } else {
      console.log('Skipping outbound call. TRIGGER_OUTBOUND is not set to "true".');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, unprocessedLeadsCount: leads.length })
    };

  } catch (error) {
    console.error('Transcript Webhook Error:', error);
    // Return 200 to ElevenLabs to prevent webhook retries on our internal errors
    return { statusCode: 200, body: JSON.stringify({ success: false, error: 'Internal processing error logged.' }) };
  }
};