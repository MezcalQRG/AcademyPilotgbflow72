exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('CONVERSATION INIT WEBHOOK - NEW CALL INITIATED');
  console.log('='.repeat(80));
  
  try {
    // Log full event payload
    console.log('Full Payload:');
    console.log(JSON.stringify(event, null, 2));
    
    // Extract key fields if present (for easier reading)
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    if (body) {
      console.log('');
      console.log('Key Fields:');
      console.log('  Caller ID:', body.caller_id || body.phoneNumber || 'N/A');
      console.log('  Call ID:', body.call_id || body.conversationId || 'N/A');
      console.log('  Timestamp:', body.timestamp || new Date().toISOString());
      console.log('  Custom Data:', body.custom_data || body.metadata || 'N/A');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('PAYLOAD LOGGED - Ready for processing');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Conversation initiated and logged' }),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('ERROR:', error.message);
    console.log('Stack:', error.stack);
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Webhook received (error logged)' }),
    };
  }
};
