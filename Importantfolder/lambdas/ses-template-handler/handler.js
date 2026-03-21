// Lambda handler: receives payload with user data and template type, sends email automatically
const AWS = require('aws-sdk');

const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-2' });

// Mapeo de tipos de template a nombres en SES
// Sincronizado con needtoimplement.md y requerimientos de la academia
const templateTypes = {
  'account-created': 'AccountCreated',
  'password-reset': 'PasswordReset',
  'magic-link': 'MagicLink',
  'appointment-booked': 'AppointmentBooked',
  'invoice': 'Invoice',
  'academy-welcome': 'WelcomeAcademy' // Nuevo template para onboarding de locaciones
};

exports.handler = async (event, context) => {
  console.log('Tactical Dispatch Initiated', { event, context });

  try {
    // Parsear payload
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    console.log('Payload Received', { body });

    const { userEmail, userData, templateType, redirectUrl } = body || {};

    if (!userEmail || !userData || !templateType) {
      console.error('Handshake Failure: Missing Fields', { userEmail, userData, templateType });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Faltan campos requeridos: userEmail, userData, templateType',
          received: { userEmail, userData, templateType }
        })
      };
    }

    // Mapear tipo de template
    const templateName = templateTypes[templateType.toLowerCase()];
    if (!templateName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Protocolo de template no válido',
          validTypes: Object.keys(templateTypes),
          received: templateType
        })
      };
    }

    // Obtener template desde SES para validar existencia y variables
    let templateDetails;
    try {
      templateDetails = await ses.getTemplate({ TemplateName: templateName }).promise();
    } catch (err) {
      console.error(`Matrix Error: Template '${templateName}' not found in SES registry`);
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Template '${templateName}' no encontrado en SES`,
          templateType: templateType,
          availableTypes: Object.keys(templateTypes)
        })
      };
    }

    // Extraer variables requeridas del template (Handlebars style)
    const templateContent = templateDetails.Template.HtmlPart || templateDetails.Template.TextPart || '';
    const requiredVars = extractVariables(templateContent);

    // Validar que userData tenga todas las variables requeridas por el template
    const missingVars = requiredVars.filter(v => !(v in userData));
    if (missingVars.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Faltan variables tácticas en userData: ${missingVars.join(', ')}`,
          requiredVariables: requiredVars,
          providedData: Object.keys(userData)
        })
      };
    }

    // Preparar datos para el template
    const templateData = { ...userData };
    if (redirectUrl) {
      templateData.redirectUrl = redirectUrl;
    }

    // Enviar email via SES
    const params = {
      Destination: { ToAddresses: [userEmail] },
      Source: process.env.SES_FROM_EMAIL || 'no-reply@graciebarra.ai',
      Template: templateName,
      TemplateData: JSON.stringify(templateData)
    };

    // Configuración específica por locación si se provee en needtoimplement logic
    if (userData.location) {
      params.ConfigurationSetName = `${userData.location}-config-set`;
      // Opcional: Cambiar el Source basado en la locación si se ha verificado el MAIL FROM
      // params.Source = `no-reply@${userData.location}.graciebarra.ai`;
    }

    console.log('Dispatching SES templated email', { templateName, userEmail });

    const sendResult = await ses.sendTemplatedEmail(params).promise();
    console.log('Dispatch Success', { messageId: sendResult.MessageId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Email enviado exitosamente con template '${templateName}'`,
        sentTo: userEmail,
        templateUsed: templateName,
        messageId: sendResult.MessageId,
        redirectTo: redirectUrl || '/dashboard'
      })
    };

  } catch (err) {
    console.error('Critical Dispatch Error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno en la matriz de comunicaciones',
        details: err.message
      })
    };
  }
};

// Función para extraer variables {{variable}} del contenido del template
function extractVariables(content) {
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(2, -2).trim()))];
}
