// Lambda handler: List SES templates y envía uno seleccionado
const AWS = require('aws-sdk');

const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * event.body debe ser:
 * {
 *   "to": "destino@email.com",
 *   "templateName": "NombreTemplate",
 *   "templateData": { ... } // objeto plano, será serializado a JSON
 * }
 */
exports.handler = async (event) => {
  // Fallback hardcodeado
  const fallbackTemplates = [
    "Invoice",
    "MagicLink",
    "PasswordReset",
    "AppointmentBooked",
    "AccountCreated"
  ];
  let available = fallbackTemplates;
  try {
    // 1. Listar templates disponibles (en vivo)
    try {
      const templates = await ses.listTemplates({ MaxItems: 50 }).promise();
      if (templates && templates.TemplatesMetadata && templates.TemplatesMetadata.length > 0) {
        available = templates.TemplatesMetadata.map(t => t.Name);
      }
    } catch (err) {
      // Si falla, usa fallback
    }

    // 2. Parsear input
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { to, templateName, templateData } = body || {};
    if (!to || !templateName || !templateData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan campos: to, templateName, templateData', availableTemplates: available })
      };
    }
    if (!available.includes(templateName)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Template no existe', availableTemplates: available })
      };
    }

    // 3. Enviar email usando el template
    const params = {
      Destination: { ToAddresses: [to] },
      Source: process.env.SES_FROM_EMAIL,
      Template: templateName,
      TemplateData: JSON.stringify(templateData)
    };
    await ses.sendTemplatedEmail(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, sentTemplate: templateName, to })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, availableTemplates: available })
    };
  }
};
