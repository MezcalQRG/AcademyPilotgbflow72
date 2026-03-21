// Lambda handler: recibe payload con user data y template type, envía email automáticamente
const AWS = require('aws-sdk');

const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-2' });

// Mapeo de tipos de template a nombres en SES
const templateTypes = {
  'account-created': 'AccountCreated',
  'password-reset': 'PasswordReset',
  'magic-link': 'MagicLink',
  'appointment-booked': 'AppointmentBooked',
  'invoice': 'Invoice'
};

exports.handler = async (event) => {
  try {
    // Parsear payload
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { userEmail, userData, templateType, redirectUrl } = body || {};

    if (!userEmail || !userData || !templateType) {
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
          error: 'Tipo de template no válido',
          validTypes: Object.keys(templateTypes),
          received: templateType
        })
      };
    }

    // Obtener template desde SES
    let templateDetails;
    try {
      templateDetails = await ses.getTemplate({ TemplateName: templateName }).promise();
    } catch (err) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Template '${templateName}' no encontrado en SES`,
          templateType: templateType,
          availableTypes: Object.keys(templateTypes)
        })
      };
    }

    // Extraer variables requeridas del template
    const templateContent = templateDetails.Template.HtmlPart || templateDetails.Template.TextPart || '';
    const requiredVars = extractVariables(templateContent);

    // Validar que userData tenga todas las variables requeridas
    const missingVars = requiredVars.filter(v => !(v in userData));
    if (missingVars.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Faltan variables en userData: ${missingVars.join(', ')}`,
          requiredVariables: requiredVars,
          providedData: Object.keys(userData)
        })
      };
    }

    // Preparar datos para el template (agregar redirectUrl si existe)
    const templateData = { ...userData };
    if (redirectUrl) {
      templateData.redirectUrl = redirectUrl;
    }

    // Enviar email
    const params = {
      Destination: { ToAddresses: [userEmail] },
      Source: process.env.SES_FROM_EMAIL,
      Template: templateName,
      TemplateData: JSON.stringify(templateData)
    };

    await ses.sendTemplatedEmail(params).promise();

    // Retornar éxito con JWT simulado (en producción usarías un JWT real)
    const mockJwt = generateMockJwt(userEmail, templateType);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Email enviado exitosamente con template '${templateName}'`,
        sentTo: userEmail,
        templateUsed: templateName,
        jwt: mockJwt,
        redirectTo: '/dashboard'
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: err.message
      })
    };
  }
};

// Función para extraer variables {{variable}} del contenido del template
function extractVariables(content) {
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(2, -2).trim()))]; // Eliminar duplicados
}

// Función para generar JWT simulado (en producción usarías jsonwebtoken)
function generateMockJwt(email, templateType) {
  const payload = {
    email: email,
    template: templateType,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };
  // Esto es solo un mock, en producción usa una librería JWT real
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
