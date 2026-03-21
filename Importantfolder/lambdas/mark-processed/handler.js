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

// Authorization token (should match the one in other webhooks)
const VALID_TOKEN = process.env.AUTH_TOKEN || '123456789';

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('MARK LEADS AS PROCESSED');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Validate authorization
    console.log('Step 1: Validating authorization');
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    const token = authHeader?.replace('Bearer ', '').trim();
    
    if (!token || token !== VALID_TOKEN) {
      console.log('Step 1.1: UNAUTHORIZED - Invalid or missing token (ignored)');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Ignored' }),
      };
    }
    
    console.log('Step 1.2: Authorization valid');

    // Step 2: Parse request body
    console.log('Step 2: Parsing request body');
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { lead_ids, metadata } = body;
    
    console.log('Step 2.1: Received lead IDs:', lead_ids);
    
    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      console.log('Step 2.2: ERROR - No valid lead_ids provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'lead_ids array is required' }),
      };
    }

    // Step 3: Update each lead in Firestore
    console.log(`Step 3: Updating ${lead_ids.length} leads in Firestore`);
    
    const batch = db.batch();
    const processedAt = new Date();
    
    lead_ids.forEach((leadId) => {
      const leadRef = db.collection('leads').doc(leadId);
      batch.update(leadRef, {
        processed: true,
        processedAt: processedAt,
        processedMetadata: metadata || {},
      });
    });
    
    console.log('Step 3.1: Executing batch update');
    await batch.commit();
    console.log('Step 3.2: Batch update successful');

    console.log('='.repeat(80));
    console.log('SUCCESS: Leads marked as processed');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('ERROR:', error.message);
    console.log('Stack:', error.stack);
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }
};
