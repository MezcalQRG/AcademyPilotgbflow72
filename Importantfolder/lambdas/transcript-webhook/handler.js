const admin = require('firebase-admin');
const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

// Initialize Firebase
const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
const projectId = process.env.FIREBASE_PROJECT_ID || 'elevenlabs-rag';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: projectId,
  });
}

const db = admin.firestore();

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('TRANSCRIPT WEBHOOK - CONVERSATION ENDED');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Log full transcript payload
    console.log('Step 1: Logging full transcript event');
    console.log('Full Event:', JSON.stringify(event, null, 2));

    // Step 2: Extract transcript text if available
    console.log('Step 2: Extracting transcript text');
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const transcript = body?.transcript || body?.text || 'No transcript found';
    console.log('Step 2.1: Transcript extracted:', transcript.substring(0, 200));

    // Step 3: Query Firestore for unprocessed leads from last 24 hours
    console.log('Step 3: Querying for unprocessed leads from last 24 hours');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const snapshot = await db.collection('leads')
      .where('processed', '==', false)
      .where('createdAt', '>=', twentyFourHoursAgo)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    console.log(`Step 3.1: Found ${snapshot.size} unprocessed leads`);

    if (snapshot.size > 0) {
      // Step 4: Prepare lead data
      console.log('Step 4: Preparing leads for outbound call');
      const leads = [];
      snapshot.forEach((doc) => {
        leads.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      console.log(`Step 4.1: Prepared ${leads.length} leads for processing`);
      console.log('Step 4.2: Lead summary:', leads.map(l => `${l.name} - ${l.visit_date}`).join(', '));

      // Step 5: Trigger outbound call Lambda (if TRIGGER_OUTBOUND env var is set)
      if (process.env.TRIGGER_OUTBOUND === 'true') {
        console.log('Step 5: Triggering outbound call Lambda');
        
        const params = {
          FunctionName: process.env.OUTBOUND_LAMBDA_NAME || 'initiateOutboundCallHandler',
          InvocationType: 'Event', // Async
          Payload: JSON.stringify({
            leads: leads,
            transcript: transcript,
          }),
        };

        try {
          const result = await lambda.invoke(params).promise();
          console.log('Step 5.1: Outbound call Lambda invoked successfully');
          console.log('Step 5.2: RequestId:', result.RequestId);
        } catch (lambdaErr) {
          console.log('Step 5.3: ERROR invoking outbound Lambda:', lambdaErr.message);
        }
      } else {
        console.log('Step 5: SKIPPED - TRIGGER_OUTBOUND not enabled (set to "true" to enable)');
      }
    } else {
      console.log('Step 4: No unprocessed leads found - skipping outbound call trigger');
    }

    console.log('='.repeat(80));
    console.log('SUCCESS: Transcript processed');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Transcript received and processed',
        unprocessedLeads: snapshot.size,
      }),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('ERROR:', error.message);
    console.log('Stack:', error.stack);
    console.log('='.repeat(80));

    return {
      statusCode: 200, // Still return 200 to ElevenLabs
      body: JSON.stringify({ 
        success: true, 
        message: 'Transcript received (error logged)',
      }),
    };
  }
};

