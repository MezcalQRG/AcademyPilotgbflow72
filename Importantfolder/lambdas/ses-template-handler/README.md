# Handler SES Templates - Flujo Simplificado

## Funcionalidad
**POST /send-template-email**: Recibe datos de usuario y tipo de template, descarga template dinámicamente de SES, reemplaza variables y envía email.

## Flujo completo (Frontend → Backend → Lambda)

### 1. Frontend envía login/signup data
```javascript
// Desde tu frontend (Firebase/React)
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'Juan Pérez',
    templateType: 'account-created'
  })
});
```

### 2. Orquestrador valida y reenvía
```javascript
// Tu orquestrador (Node.js)
router.post('/api/auth/signup', requireAuth, async (req, res) => {
  const lambdaResponse = await axios.post(process.env.LAMBDA_SEND_TEMPLATE_URL, {
    userEmail: req.body.email,
    userData: req.body,
    templateType: req.body.templateType
  });
  res.json(lambdaResponse.data); // Retorna JWT y redirect
});
```

### 3. Lambda procesa automáticamente
```bash
curl -X POST https://tu-api-gateway-url/send-template-email \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "user@example.com",
    "userData": {
      "name": "Juan Pérez",
      "loginUrl": "https://app.com/login",
      "welcomeMessage": "Bienvenido a Gracie Barra!"
    },
    "templateType": "account-created"
  }'
```

## Tipos de templates soportados
- `account-created` → Template "AccountCreated" en SES
- `password-reset` → Template "PasswordReset" en SES
- `magic-link` → Template "MagicLink" en SES
- `appointment-booked` → Template "AppointmentBooked" en SES
- `invoice` → Template "Invoice" en SES

## Variables dinámicas automáticas
La lambda descarga el template más reciente de SES y extrae automáticamente las variables `{{variable}}` del contenido.

Ejemplo template "AccountCreated" en SES:
```
Subject: Welcome {{name}}!

Hi {{name}},

Your account has been created successfully.
Login here: {{loginUrl}}

{{welcomeMessage}}
```

## Respuesta exitosa
```json
{
  "success": true,
  "message": "Email enviado exitosamente con template 'AccountCreated'",
  "sentTo": "user@example.com",
  "templateUsed": "AccountCreated",
  "jwt": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "redirectTo": "/dashboard"
}
```

## Validación automática
- Verifica que el `templateType` sea válido
- Descarga template de SES y valida existencia
- Extrae variables requeridas del contenido
- Valida que `userData` contenga todas las variables necesarias
- Envía email y retorna JWT simulado

¡El frontend solo envía datos, la lambda hace todo lo demás automáticamente!