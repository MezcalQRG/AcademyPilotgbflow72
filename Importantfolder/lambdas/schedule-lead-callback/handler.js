const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
const projectId = process.env.FIREBASE_PROJECT_ID || 'admin-audit-3f2cd';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: projectId,
  });
}

const db = admin.firestore();

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('SCHEDULE LEAD CALLBACK - Add lead to callback queue');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Parse webhook payload from agent
    console.log('Step 1: Parsing webhook payload');
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    console.log('Step 1.1: Webhook payload:', JSON.stringify(body, null, 2));

    // Step 2: Extract lead information
    console.log('Step 2: Extracting lead information');
    const leadPhone = body?.lead_phone || body?.phone || body?.variables?.lead_phone;
    const leadName = body?.lead_name || body?.name || body?.variables?.lead_name || 'Unknown';
    const leadId = body?.lead_id || body?.id || body?.variables?.lead_id || 'N/A';
    const message = body?.message || body?.variables?.message || 'Calling with important information';
    const clase = body?.clase || body?.variables?.clase || 'Not specified';
    const priority = body?.priority || body?.variables?.priority || 'normal';
    
    console.log('Step 2.1: Lead phone:', leadPhone);
    console.log('Step 2.2: Lead name:', leadName);
    console.log('Step 2.3: Lead ID:', leadId);
    console.log('Step 2.4: Message:', message);
    console.log('Step 2.5: Priority:', priority);

    // Step 3: Validate required data
    console.log('Step 3: Validating required data');
    if (!leadPhone) {
      console.log('Step 3.1: ERROR - lead_phone is required');
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'lead_phone is required',
        }),
      };
    }

    // Step 4: Save to callback queue in Firestore
    console.log('Step 4: Saving to callback queue');
    const queueRef = db.collection('callback_queue').doc();
    const queueItem = {
      lead_phone: leadPhone,
      lead_name: leadName,
      lead_id: leadId,
      clase: clase,
      message: message,
      priority: priority,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      attempt_count: 0,
      last_error: null,
    };

    await queueRef.set(queueItem);
    console.log(`Step 4.1: Queue item saved with ID: ${queueRef.id}`);

    console.log('='.repeat(80));
    console.log('SUCCESS: Lead added to callback queue');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Lead added to callback queue',
        queue_item_id: queueRef.id,
        lead: {
          id: leadId,
          name: leadName,
          phone: leadPhone,
        },
      }),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('ERROR:', error.message);
    console.log('Stack:', error.stack);
    console.log('='.repeat(80));

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
