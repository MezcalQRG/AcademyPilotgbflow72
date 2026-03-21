const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

// This token should be configured in AWS Secrets Manager or Parameter Store for production
const AUTH_TOKEN = process.env.AUTH_TOKEN || '123456789';

/**
 * Universal Tactical Orchestrator.
 * Acts as a secure API Gateway and router for backend services.
 * It receives mission directives from the Next.js server and fans out to specialized Lambda handlers.
 */
exports.handler = async (event) => {
  console.log('--- MISSION DIRECTIVE RECEIVED ---');
  
  try {
    // 1. Authorization Protocol: Verify the bearer token
    const authHeader = event.headers?.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    
    if (token !== AUTH_TOKEN) {
      console.error('Handshake Failure: Unauthorized Access');
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // 2. Parse Mission Parameters from the request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { action, payload } = body;

    if (!action) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Mission directive "action" is missing.' }) };
    }

    console.log(`Action Initiated: ${action}`);

    // 3. Dispatch to Specialized Sector (Target Lambda)
    let targetFunction;
    switch (action) {
      case 'SEND_EMAIL':
        targetFunction = process.env.SES_HANDLER_FUNCTION_NAME || 'sesTemplateHandler';
        break;
      case 'ADD_LEAD':
        targetFunction = process.env.ADD_LEAD_FUNCTION_NAME || 'addLeadHandler';
        break;
      // Add other actions here
      default:
        console.error(`Unknown action: ${action}`);
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }

    console.log(`Invoking Tactical Handler: ${targetFunction}`);

    // 4. Invoke the specialized handler function
    const result = await lambda.invoke({
      FunctionName: targetFunction,
      InvocationType: 'RequestResponse',
      // The payload for the target function is passed directly.
      // The target function is expected to handle this payload.
      Payload: JSON.stringify(payload)
    }).promise();

    const responsePayload = JSON.parse(result.Payload);
    
    // 5. Relay the response from the handler back to the caller
    return {
      statusCode: responsePayload.statusCode || 200,
      body: responsePayload.body
    };

  } catch (error) {
    console.error('Matrix Failure: Orchestrator encountered a critical error.', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Matrix Error', details: error.message })
    };
  }
};