const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-2' });

// Orquestador simple: recibe payload del frontend y reenvía al lambda de SES (send-template-email)
exports.handler = async (event, context) => {
  console.log('Orchestrator invoked', { event, context });

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    console.log('Orchestrator parsed body', { body });

    const { userEmail, templateType, userData } = body || {};

    if (!userEmail || !templateType || !userData) {
      console.error('Orchestrator missing required fields', { userEmail, templateType, userData });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Faltan campos requeridos: userEmail, templateType, userData',
          received: { userEmail, templateType, userData }
        })
      };
    }

    const targetFunction = process.env.SES_LAMBDA_FUNCTION_NAME;
    if (!targetFunction) {
      throw new Error('SES_LAMBDA_FUNCTION_NAME no configurado en variables de entorno');
    }

    const payload = {
      userEmail,
      templateType,
      userData
    };

    console.log('Invoking SES Lambda', { targetFunction, payload });

    const invokeResult = await lambda.invoke({
      FunctionName: targetFunction,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    }).promise();

    console.log('Lambda invoke result', { invokeResult });

    // El payload devuelto puede ser un string
    const responsePayload = invokeResult.Payload ? JSON.parse(invokeResult.Payload) : null;

    return {
      statusCode: (responsePayload && responsePayload.statusCode) ? responsePayload.statusCode : 200,
      body: JSON.stringify({
        orchestrator: true,
        targetFunction,
        lambdaResponse: responsePayload
      })
    };
  } catch (err) {
    console.error('Orchestrator error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error en el orquestador',
        details: err.message,
        stack: err.stack
      })
    };
  }
};
