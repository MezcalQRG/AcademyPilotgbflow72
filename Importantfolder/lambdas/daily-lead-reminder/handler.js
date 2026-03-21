const admin = require('firebase-admin');
const https = require('https');

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

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const CONFIRMATION_AGENT_ID = process.env.CONFIRMATION_AGENT_ID;
const ELEVENLABS_PHONE_ID = process.env.ELEVENLABS_PHONE_ID;
const ACADEMY_PHONE = process.env.ACADEMY_PHONE;

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('DAILY LEAD REMINDER - Check for unprocessed leads from yesterday');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Calculate yesterday's date range
    console.log('Step 1: Calculating yesterday date range');
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const tomorrowStart = new Date(yesterday);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    
    console.log(`Step 1.1: Yesterday start: ${yesterday.toISOString()}`);
    console.log(`Step 1.2: Tomorrow start: ${tomorrowStart.toISOString()}`);

    // Step 2: Query unprocessed leads from yesterday
    console.log('Step 2: Querying Firestore for unprocessed leads from yesterday');
    const snapshot = await db.collection('leads')
      .where('processed', '==', false)
      .where('createdAt', '>=', yesterday)
      .where('createdAt', '<', tomorrowStart)
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`Step 2.1: Found ${snapshot.size} unprocessed leads from yesterday`);

    // Step 3: If no leads, exit early
    if (snapshot.size === 0) {
      console.log('Step 3: No unprocessed leads found, exiting');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No unprocessed leads from yesterday',
          count: 0,
        }),
      };
    }

    // Step 4: Extract lead data
    console.log('Step 4: Extracting lead data');
    const leads = [];
    snapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        name: doc.data().name,
        phone: doc.data().phone,
        clase: doc.data().clase,
        visit_date: doc.data().visit_date,
        note: doc.data().note,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      });
    });
    
    console.log(`Step 4.1: Extracted ${leads.length} leads`);
    console.log('Step 4.2: Lead IDs:', leads.map(l => l.id).join(', '));

    // Step 5: Build summary for confirmation call
    console.log('Step 5: Building lead summary');
    const leadsSummary = leads.map((lead, idx) => {
      return `Lead ${idx + 1}: ${lead.name}, phone ${lead.phone}, interested in ${lead.clase}, visit date ${lead.visit_date || 'TBD'}`;
    }).join('. ');
    
    console.log('Step 5.1: Summary length:', leadsSummary.length);

    // Step 6: Check if confirmation agent is configured
    console.log('Step 6: Validating confirmation agent configuration');
    if (!ELEVENLABS_API_KEY || !CONFIRMATION_AGENT_ID || !ELEVENLABS_PHONE_ID || !ACADEMY_PHONE) {
      console.log('Step 6.1: WARNING - Confirmation agent not configured, skipping call');
      console.log(`Step 6.2: ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY ? 'set' : 'NOT SET'}`);
      console.log(`Step 6.3: CONFIRMATION_AGENT_ID: ${CONFIRMATION_AGENT_ID ? 'set' : 'NOT SET'}`);
      console.log(`Step 6.4: ELEVENLABS_PHONE_ID: ${ELEVENLABS_PHONE_ID ? 'set' : 'NOT SET'}`);
      console.log(`Step 6.5: ACADEMY_PHONE: ${ACADEMY_PHONE ? 'set' : 'NOT SET'}`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Found leads but confirmation agent not configured',
          count: leads.length,
          leads: leads,
        }),
      };
    }

    // Step 7: Trigger confirmation call
    console.log('Step 7: Triggering confirmation call to academy');
    const payloadObj = {
      agent_id: CONFIRMATION_AGENT_ID,
      agent_phone_number_id: ELEVENLABS_PHONE_ID,
      to_number: ACADEMY_PHONE,
      conversation_initiation_client_data: {
        dynamic_variables: {
          leads_count: leads.length,
          leads_summary: leadsSummary,
          first_lead_name: leads[0]?.name || 'Unknown',
        },
        metadata: {
          source: 'daily_lead_reminder',
          triggered_at: new Date().toISOString(),
          date_range: `${yesterday.toDateString()} 00:00 - 23:59`,
        },
      },
    };

    const postData = JSON.stringify(payloadObj);
    const result = await makeOutboundCall(postData);
    
    console.log('Step 7.1: Confirmation call triggered successfully');
    console.log('Step 7.2: Response:', JSON.stringify(result, null, 2));

    console.log('='.repeat(80));
    console.log('SUCCESS: Daily lead reminder executed');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Daily lead reminder call triggered',
        leads_count: leads.length,
        leads: leads,
        call_details: result,
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

/**
 * Makes HTTPS POST request to ElevenLabs Twilio API
 */
function makeOutboundCall(payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/convai/twilio/outbound-call',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('ElevenLabs API Status:', res.statusCode);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`ElevenLabs API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}
