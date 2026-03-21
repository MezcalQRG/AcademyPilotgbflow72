const https = require('https');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const CONFIRMATION_AGENT_ID = process.env.CONFIRMATION_AGENT_ID; // Agent that calls human for confirmation
const ELEVENLABS_PHONE_ID = process.env.ELEVENLABS_PHONE_ID; // Phone number the agent owns
const ACADEMY_PHONE = process.env.ACADEMY_PHONE; // Academy contact number to call

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('KICK CONFIRMATION WEBHOOK - Trigger outbound call to academy for approval');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Parse webhook payload
    console.log('Step 1: Parsing webhook payload from student intake agent');
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    console.log('Step 1.1: Webhook payload:', JSON.stringify(body, null, 2));

    // Step 2: Extract lead information
    console.log('Step 2: Extracting lead information');
    const leadData = {
      name: body?.name || body?.variables?.student_name || 'Unknown',
      phone: body?.phone || body?.variables?.student_phone || 'Not provided',
      clase: body?.clase || body?.variables?.class_type || 'Not specified',
      visit_date: body?.visit_date || body?.variables?.visit_date || 'TBD',
      note: body?.note || body?.variables?.note || 'None',
      uniform: body?.uniform || body?.variables?.has_uniform || 'Unknown',
    };
    
    console.log('Step 2.1: Extracted lead data:', leadData);

    // Step 3: Validate required environment variables
    console.log('Step 3: Validating configuration');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not set');
    }
    if (!CONFIRMATION_AGENT_ID) {
      throw new Error('CONFIRMATION_AGENT_ID not set');
    }
    if (!ELEVENLABS_PHONE_ID) {
      throw new Error('ELEVENLABS_PHONE_ID not set');
    }
    if (!ACADEMY_PHONE) {
      throw new Error('ACADEMY_PHONE not set');
    }
    
    console.log('Step 3.1: Configuration valid');

    // Step 4: Build message summary for confirmation agent
    console.log('Step 4: Building confirmation message');
    const confirmationMessage = `
New student lead to confirm:
Name: ${leadData.name}
Phone: ${leadData.phone}
Interested in: ${leadData.clase}
Would like to visit: ${leadData.visit_date}
Notes: ${leadData.note}
Has uniform: ${leadData.uniform}
Please confirm if we can proceed with scheduling this student.
    `.trim();
    
    console.log('Step 4.1: Message:', confirmationMessage);

    // Step 5: Prepare outbound call payload
    console.log('Step 5: Preparing ElevenLabs Twilio outbound call');
    const payloadObj = {
      agent_id: CONFIRMATION_AGENT_ID,
      agent_phone_number_id: ELEVENLABS_PHONE_ID,
      to_number: ACADEMY_PHONE,
      conversation_initiation_client_data: {
        dynamic_variables: {
          student_name: leadData.name,
          student_phone: leadData.phone,
          class_type: leadData.clase,
          visit_date: leadData.visit_date,
          student_note: leadData.note,
          has_uniform: leadData.uniform,
        },
        source_info: {
          source: 'twilio',
        },
      },
    };
    
    const postData = JSON.stringify(payloadObj);
    console.log('Step 5.1: Payload prepared:', JSON.stringify(payloadObj, null, 2));

    // Step 6: Call ElevenLabs Twilio outbound API
    console.log('Step 6: Calling ElevenLabs Twilio outbound call API');
    const result = await makeOutboundCall(postData);
    
    console.log('Step 6.1: API response:', JSON.stringify(result, null, 2));

    console.log('='.repeat(80));
    console.log('SUCCESS: Confirmation call triggered');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Confirmation call triggered',
        lead: leadData,
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
 * Makes HTTPS POST request to ElevenLabs Twilio outbound call API
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

    console.log(`Making request to: ${options.hostname}${options.path}`);
    console.log('Payload:', payload);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('ElevenLabs API Status:', res.statusCode);
        console.log('ElevenLabs API Response:', data);
        
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
