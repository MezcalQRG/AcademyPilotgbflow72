
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const AUTH_TOKEN = process.env.AUTH_TOKEN || '123456789';

/**
 * Universal Tactical Orchestrator.
 * Receives mission directives from the Next.js server and fans out to specialized handlers.
 */
exports.handler = async (event) => {
  console.log('--- MISSION DIRECTIVE RECEIVED ---');
  
  try {
    // 1. Authorization Protocol
    const authHeader = event.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    
    if (token !== AUTH_TOKEN) {
      console.error('Handshake Failure: Unauthorized Access');
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // 2. Parse Mission Parameters
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { action, payload } = body;

    console.log(`Action Initiated: ${action}`);

    // 3. Dispatch to Specialized Sector
    let targetFunction;
    switch (action) {
      case 'SEND_EMAIL':
        targetFunction = process.env.SES_HANDLER_FUNCTION_NAME || 'sesTemplateHandler';
        break;
      case 'ADD_LEAD':
        targetFunction = process.env.ADD_LEAD_FUNCTION_NAME || 'addLeadHandler';
        break;
      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }

    console.log(`Invoking Tactical Handler: ${targetFunction}`);

    const result = await lambda.invoke({
      FunctionName: targetFunction,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({ body: payload }) // Wrapping in body to match API Gateway proxy format
    }).promise();

    const responsePayload = JSON.parse(result.Payload);
    
    return {
      statusCode: responsePayload.statusCode || 200,
      body: responsePayload.body || JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Matrix Failure:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Matrix Error', details: error.message })
    };
  }
};
