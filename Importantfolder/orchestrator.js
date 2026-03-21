// Orchestrator API endpoint (Node.js/Express style, puede adaptarse a Lambda handler)
// Solo recibe requests del frontend autenticado, valida y reenvía a la lambda adecuada

const express = require('express');
const axios = require('axios');
const { z } = require('zod');

const router = express.Router();

// Ejemplo: schema para crear lead
const addLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^\+\d{10,15}$/),
  clase: z.string(),
  visit_date: z.string(),
  note: z.string().optional()
});

// Middleware de autenticación (ejemplo)
function requireAuth(req, res, next) {
  // Aquí validas JWT/cookie/sesión
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: validar token real
  next();
}

// Endpoint seguro para crear lead
router.post('/api/add-lead', requireAuth, async (req, res) => {
  try {
    const parsed = addLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.errors });
    }
    // Llama a tu lambda interna (API Gateway privado o invocación directa)
    const lambdaUrl = process.env.LAMBDA_ADD_LEAD_URL; // ej: https://xxxx.execute-api.us-east-1.amazonaws.com/add-lead
    const lambdaAuth = process.env.LAMBDA_AUTH_TOKEN; // nunca exponer esto al frontend
    const response = await axios.post(lambdaUrl, parsed.data, {
      headers: {
        'Authorization': `Bearer ${lambdaAuth}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

// Endpoint para signup/login con envío automático de email template
router.post('/api/auth/signup', requireAuth, async (req, res) => {
  try {
    const { email, name, templateType } = req.body;
    // Llama a la lambda que envía email automáticamente
    const lambdaUrl = process.env.LAMBDA_SEND_TEMPLATE_EMAIL_URL; // ej: https://xxxx.execute-api.us-east-1.amazonaws.com/send-template-email
    const lambdaAuth = process.env.LAMBDA_AUTH_TOKEN;
    const response = await axios.post(lambdaUrl, {
      userEmail: email,
      userData: {
        name: name,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        welcomeMessage: 'Bienvenido a Gracie Barra!'
      },
      templateType: templateType || 'account-created'
    }, {
      headers: {
        'Authorization': `Bearer ${lambdaAuth}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data); // Retorna JWT y redirect info
  } catch (err) {
    res.status(500).json({ error: 'Error en signup', details: err.message });
  }
});

// Ejemplo: schema vacío para GET (no requiere body)
const listSESTemplatesSchema = z.object({});

// Endpoint seguro para listar SES templates
router.get('/api/list-ses-templates', requireAuth, async (req, res) => {
  try {
    // No body, pero podrías validar query params aquí si los hubiera
    // Llama a tu lambda interna (API Gateway privado o invocación directa)
    const lambdaUrl = process.env.LAMBDA_LIST_SES_TEMPLATES_URL; // ej: https://xxxx.execute-api.us-east-1.amazonaws.com/list-ses-templates
    const lambdaAuth = process.env.LAMBDA_AUTH_TOKEN;
    const response = await axios.get(lambdaUrl, {
      headers: {
        'Authorization': `Bearer ${lambdaAuth}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

module.exports = router;
