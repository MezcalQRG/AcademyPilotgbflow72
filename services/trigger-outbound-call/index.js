const https = require('https');
const { getFirestore } = require('./firebase-admin');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// The default fallback values if the tenant hasn't configured them
const DEFAULT_SALLY_AGENT_ID = process.env.SALLY_AGENT_ID; 
const DEFAULT_ELEVENLABS_PHONE_ID = process.env.ELEVENLABS_PHONE_ID;

/**
 * Trigger Outbound Call Service (Multi-Tenant)
 * 
 * Asynchronously invoked by the `transcript-webhook` service. 
 * It requires a tenantSlug to fetch the specific academy's contact number 
 * and outbound agent configuration before initiating the call via ElevenLabs.
 */
exports.handler = async (event) => {
  console.log('--- TRIGGER OUTBOUND CALL ---');
  
  try {
    const { tenantSlug, leads, transcript } = event;
    
    // 1. Validate Input & Tenant
    if (!tenantSlug) {
      console.error('Security Alert: Attempted to trigger an outbound call without a tenantSlug.');
      return { success: false, error: 'tenantSlug is required' };
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      console.log(`No leads provided in payload for tenant ${tenantSlug}. Exiting.`);
      return { success: true, message: 'No leads to process' };
    }
    
    // 2. Fetch Tenant Configuration
    const db = getFirestore();
    let academyPhone, agentId, phoneId;

    try {
      const tenantDoc = await db.collection('landing_pages').doc(tenantSlug).get(); // Assuming contact phone is here or in a settings subcollection
      
      if (!tenantDoc.exists) {
        throw new Error(`Tenant configuration not found for slug: ${tenantSlug}`);
      }
      
      const tenantData = tenantDoc.data();
      academyPhone = tenantData.contactPhone;

      // In a fully multi-tenant system, each tenant might have their own Agent IDs.
      // If not, we fall back to the global defaults.
      agentId = tenantData.sallyAgentId || DEFAULT_SALLY_AGENT_ID;
      phoneId = tenantData.elevenLabsPhoneId || DEFAULT_ELEVENLABS_PHONE_ID;

    } catch (err) {
      console.error(`Failed to fetch configuration for tenant ${tenantSlug}:`, err);
      return { success: false, error: 'Tenant configuration error' };
    }

    // 3. Validate Configuration
    if (!ELEVENLABS_API_KEY || !agentId || !phoneId || !academyPhone) {
      const missing = [];
      if (!ELEVENLABS_API_KEY) missing.push('ELEVENLABS_API_KEY');
      if (!agentId) missing.push('Agent ID (Tenant or Default)');
      if (!phoneId) missing.push('Phone ID (Tenant or Default)');
      if (!academyPhone) missing.push(`Academy Phone (Tenant config for ${tenantSlug})`);
      
      const errorMsg = `Missing required configuration for ${tenantSlug}: ${missing.join(', ')}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`Processing ${leads.length} leads for outbound call to tenant: ${tenantSlug}.`);

    // 4. Format Leads Summary
    const leadsSummary = leads.map((lead, idx) => {
      const dateStr = lead.visit_date ? ` wants to visit on ${lead.visit_date}` : ' unspecified visit date';
      const noteStr = lead.note ? `, note: ${lead.note}` : '';
      return `Lead ${idx + 1}: ${lead.name}, phone ${lead.phone}, interested in ${lead.clase},${dateStr}${noteStr}`;
    }).join('. ');

    // 5. Prepare Dynamic Variable for Agent
    const leadSummaryMessage = `Hello, this is Sally calling from Gracie Barra. We have ${leads.length} new student lead${leads.length > 1 ? 's' : ''}. Here are the details: ${leadsSummary}. What times work best for you this week to schedule their visits?`;
    
    // 6. Prepare ElevenLabs Request Payload
    const requestPayload = {
      agent_id: agentId,
      agent_phone_number_id: phoneId,
      to_number: academyPhone,
      conversation_initiation_client_data: {
        dynamic_variables: {
          lead_summary: leadSummaryMessage, // The agent's prompt must use {{lead_summary}}
        },
        metadata: {
          tenantSlug: tenantSlug, // Ensure tenant context is passed into the call metadata
          lead_ids: leads.map(l => l.id),
          lead_count: leads.length,
          triggered_by: 'transcript_webhook',
        },
      },
    };

    console.log(`Initiating call to ${academyPhone} using agent ${agentId} for tenant ${tenantSlug}`);

    // 7. Execute API Call
    const callResult = await makeElevenLabsCall(requestPayload);
    
    console.log(`Outbound call initiated successfully for tenant ${tenantSlug}. ConvID: ${callResult.conversation_id || 'N/A'}`);

    return {
      success: true, 
      message: 'Outbound call initiated',
      leads_processed: leads.length,
      conversation_id: callResult.conversation_id
    };

  } catch (error) {
    console.error(`Trigger Outbound Call Error (Tenant: ${event.tenantSlug || 'Unknown'}):`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Wrapper for the ElevenLabs API call using standard http module
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
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(responseData)); } catch (e) { resolve({ raw: responseData }); }
        } else {
          reject(new Error(`ElevenLabs API ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}