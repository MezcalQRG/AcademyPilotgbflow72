// Lambda handler: List AWS SES templates
const AWS = require('aws-sdk');

const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  try {
    const result = await ses.listTemplates({ MaxItems: 50 }).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ templates: result.TemplatesMetadata })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
