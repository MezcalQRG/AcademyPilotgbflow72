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
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'defaulttoken';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ACADEMY_LIAISON_AGENT_ID = process.env.ACADEMY_LIAISON_AGENT_ID || process.env.CONFIRMATION_AGENT_ID;
const ELEVENLABS_PHONE_ID = process.env.ELEVENLABS_PHONE_ID;
const ACADEMY_PHONE = process.env.ACADEMY_PHONE;

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('ACADEMY BRIEFING - Generate analysis and call academy');
  console.log('='.repeat(80));

  try {
    // Step 1: Validate authentication
    console.log('Step 1: Validating authentication');
    const token = event.headers?.authorization?.replace('Bearer ', '') || event.queryStringParameters?.token;
    if (token && token !== AUTH_TOKEN) {
      console.log('Step 1.1: ❌ Authentication failed');
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: 'Unauthorized' }),
      };
    }
    console.log('Step 1.1: ✅ Authentication passed or webhook allowed');

    // Step 2: Get today's unprocessed leads
    console.log('Step 2: Fetching today unprocessed leads');
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const snapshot = await db.collection('leads')
      .where('processed', '==', false)
      .where('createdAt', '>=', todayStart)
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`Step 2.1: Found ${snapshot.size} unprocessed leads today`);

    // Step 3: Calculate analytics
    console.log('Step 3: Calculating analytics');
    let totalLeads = snapshot.size;
    let byClass = {};
    let leads = [];

    snapshot.forEach(doc => {
      const lead = doc.data();
      leads.push({
        id: doc.id,
        name: lead.name,
        phone: lead.phone,
        class: lead.clase,
        visit_date: lead.visit_date,
        note: lead.note,
      });

      // Count by class
      const classe = lead.clase || 'Unknown';
      byClass[classe] = (byClass[classe] || 0) + 1;
    });

    console.log(`Step 3.1: Leads by class:`, byClass);

    // Step 4: Get conversion metrics
    console.log('Step 4: Calculating conversion metrics');
    const allLeadsSnapshot = await db.collection('leads').get();
    const totalAllLeads = allLeadsSnapshot.size;
    const processedLeads = allLeadsSnapshot.docs.filter(d => d.data().processed).length;
    const conversionRate = totalAllLeads > 0 ? ((processedLeads / totalAllLeads) * 100).toFixed(1) : 'N/A';

    console.log(`Step 4.1: Total leads: ${totalAllLeads}, Processed: ${processedLeads}, Rate: ${conversionRate}%`);

    // Step 5: Build briefing message
    console.log('Step 5: Building briefing message');
    const briefingMessage = `
Good evening! This is your automated briefing from Gracie Barra.

Today we received ${totalLeads} new student leads.

Breakdown by class:
${Object.entries(byClass).map(([cls, count]) => `- ${cls}: ${count} student${count > 1 ? 's' : ''}`).join('\n')}

The leads are:
${leads.map((l, i) => `${i + 1}. ${l.name} (${l.phone}) - ${l.class} class - Visit: ${l.visit_date || 'TBD'}`).join('\n')}

Our overall conversion rate is ${conversionRate}% (${processedLeads} processed out of ${totalAllLeads} total leads this period).

Please confirm if you can accommodate these students and let me know about any scheduling conflicts.
    `.trim();

    console.log(`Step 5.1: Briefing message length: ${briefingMessage.length} chars`);

    // Step 6: Prepare outbound call to academy
    console.log('Step 6: Preparing outbound call to academy');
    
    if (!ELEVENLABS_API_KEY || !ACADEMY_LIAISON_AGENT_ID || !ELEVENLABS_PHONE_ID || !ACADEMY_PHONE) {
      console.log('Step 6.1: WARNING - Missing ElevenLabs config, returning briefing data only');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Briefing generated (call not made - missing config)',
          briefing: {
            today_leads: totalLeads,
            by_class: byClass,
            leads_list: leads,
            conversion_rate: conversionRate,
            briefing_message: briefingMessage,
          },
        }),
      };
    }

    const callPayload = {
      agent_id: ACADEMY_LIAISON_AGENT_ID,
      agent_phone_number_id: ELEVENLABS_PHONE_ID,
      to_number: ACADEMY_PHONE,
      conversation_initiation_client_data: {
        dynamic_variables: {
          today_leads: totalLeads,
          leads_summary: Object.entries(byClass)
            .map(([cls, count]) => `${count} ${cls}`)
            .join(', '),
          conversion_rate: conversionRate,
          briefing_message: briefingMessage,
        },
        metadata: {
          source: 'academy_briefing_webhook',
          timestamp: new Date().toISOString(),
          leads_count: totalLeads,
        },
      },
    };

    console.log('Step 6.1: Calling ElevenLabs API');
    const callResult = await makeOutboundCall(JSON.stringify(callPayload));
    console.log('Step 6.2: Call initiated:', callResult.conversation_id);

    // Step 7: Save briefing to Firestore for history
    console.log('Step 7: Saving briefing to Firestore');
    await db.collection('analytics_briefings').doc().set({
      timestamp: new Date(),
      briefing_date: todayStart,
      total_leads: totalLeads,
      by_class: byClass,
      conversion_rate: conversionRate,
      leads_list: leads,
      call_result: {
        conversation_id: callResult.conversation_id,
        status: 'initiated',
      },
    });
    console.log('Step 7.1: Briefing saved to analytics_briefings collection');

    console.log('='.repeat(80));
    console.log('✅ SUCCESS: Academy briefing generated and call initiated');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Academy briefing generated and call initiated',
        briefing: {
          today_leads: totalLeads,
          by_class: byClass,
          leads_list: leads,
          conversion_rate: conversionRate,
          call_initiated: true,
          conversation_id: callResult.conversation_id,
        },
      }),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('❌ ERROR:', error.message);
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
        console.log(`    ElevenLabs API Status: ${res.statusCode}`);
        
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
