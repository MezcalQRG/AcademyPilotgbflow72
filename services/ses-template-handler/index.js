const AWS = require('aws-sdk');
const { templateTypes } = require('./ses-template-map');

const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * SES Template Handler
 * 
 * This function sends templated emails using AWS SES. It validates the incoming payload, 
 * ensures the requested template exists, and sends the email with the provided data.
 */
exports.handler = async (event) => {
  console.log('--- SES TEMPLATE HANDLER ---');

  try {
    // 1. Parse and Validate Input
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { userEmail, userData, templateType, redirectUrl } = body;

    if (!userEmail || !userData || !templateType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: userEmail, userData, templateType' })
      };
    }

    // 2. Map and Validate Template
    const templateName = templateTypes[templateType.toLowerCase()];
    if (!templateName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Invalid templateType: ${templateType}` })
      };
    }

    // 3. Prepare SES Parameters
    const params = {
      Destination: { ToAddresses: [userEmail] },
      Source: process.env.SES_FROM_EMAIL || 'no-reply@graciebarra.ai',
      Template: templateName,
      TemplateData: JSON.stringify(userData)
    };

    // 4. Send Templated Email
    const sendResult = await ses.sendTemplatedEmail(params).promise();

    console.log(`Successfully sent templated email (${templateName}) to ${userEmail}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: sendResult.MessageId,
        redirectTo: redirectUrl // Include redirectUrl in the response if provided
      })
    };

  } catch (error) {
    console.error('SES Template Handler Error:', error);

    // Specific error for non-existent template
    if (error.code === 'TemplateDoesNotExist') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Template '${templateName}' not found in SES.` })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};