const https = require('https');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SALLY_AGENT_ID = process.env.SALLY_AGENT_ID; // Your Sally agent ID
const ELEVENLABS_PHONE_ID = process.env.ELEVENLABS_PHONE_ID; // Twilio number the agent owns
const ACADEMY_PHONE = process.env.ACADEMY_PHONE; // Academy phone number to call

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('TRIGGER OUTBOUND CALL - Sally calling Academy');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Extract leads from event
    console.log('Step 1: Extracting leads from event');
    const { leads, transcript } = event;
    
    if (!leads || leads.length === 0) {
      console.log('Step 1.1: No leads provided, exiting');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'No leads to process' }),
      };
    }
    
    console.log(`Step 1.2: Processing ${leads.length} leads`);

    // Step 2: Format leads data for Sally
    console.log('Step 2: Formatting lead data for Sally');
    const leadsSummary = leads.map((lead, idx) => {
      return `Lead ${idx + 1}: ${lead.name}, phone ${lead.phone}, interested in ${lead.clase}, wants to visit on ${lead.visit_date || 'unspecified date'}${lead.note ? `, note: ${lead.note}` : ''}`;
    }).join('. ');
    
    console.log('Step 2.1: Leads summary:', leadsSummary);

    // Step 3: Prepare first prompt override for Sally
    console.log('Step 3: Preparing first message for Sally');
    const firstMessage = `Hello, this is Sally calling from Gracie Barra to share some exciting news! We have ${leads.length} new student lead${leads.length > 1 ? 's' : ''} interested in joining your academy. Here are the details: ${leadsSummary}. I wanted to coordinate with you to schedule their visits. What times work best for you this week?`;
    
    console.log('Step 3.1: First message prepared (length:', firstMessage.length, 'chars)');

    // Step 4: Call ElevenLabs API to initiate outbound call
    console.log('Step 4: Initiating ElevenLabs outbound call');
    
    if (!ELEVENLABS_API_KEY) {
      console.log('Step 4.1: ERROR - ELEVENLABS_API_KEY not set');
      throw new Error('ELEVENLABS_API_KEY environment variable not set');
    }
    
    if (!SALLY_AGENT_ID) {
      console.log('Step 4.2: ERROR - SALLY_AGENT_ID not set');
      throw new Error('SALLY_AGENT_ID environment variable not set');
    }
    
    if (!ELEVENLABS_PHONE_ID) {
      console.log('Step 4.3: ERROR - ELEVENLABS_PHONE_ID not set');
      throw new Error('ELEVENLABS_PHONE_ID environment variable not set');
    }
    
    if (!ACADEMY_PHONE) {
      console.log('Step 4.4: ERROR - ACADEMY_PHONE not set');
      throw new Error('ACADEMY_PHONE environment variable not set');
    }

    const requestPayload = {
      agent_id: SALLY_AGENT_ID,
      agent_phone_number_id: ELEVENLABS_PHONE_ID,
      to_number: ACADEMY_PHONE,
      conversation_initiation_client_data: {
        dynamic_variables: {
          lead_summary: firstMessage,
        },
        metadata: {
          lead_ids: leads.map(l => l.id),
          lead_count: leads.length,
          triggered_by: 'transcript_webhook',
        },
      },
    };

    console.log('Step 4.4: Request payload prepared');
    console.log('Step 4.5: Agent ID:', SALLY_AGENT_ID);
    console.log('Step 4.6: Phone number:', ACADEMY_PHONE);

    const result = await makeElevenLabsCall(requestPayload);
    
    console.log('Step 4.7: ElevenLabs API response:', JSON.stringify(result, null, 2));

    console.log('='.repeat(80));
    console.log('SUCCESS: Outbound call initiated');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Outbound call initiated',
        leads_processed: leads.length,
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
 * Makes HTTPS POST request to ElevenLabs Twilio API to initiate an outbound call
 */
function makeElevenLabsCall(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/convai/twilio/outbound-call',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('ElevenLabs API Response Status:', res.statusCode);
        console.log('ElevenLabs API Response Body:', responseData);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            resolve({ raw: responseData });
          }
        } else {
          reject(new Error(`ElevenLabs API returned ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}
