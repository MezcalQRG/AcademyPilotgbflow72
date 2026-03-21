# Contrato seguro: Frontend → Orquestador → Lambdas

## 1. Flujo recomendado

```
[Usuario]
   ↓
[Frontend (browser, sin secretos)]
   ↓ (fetch /api/add-lead, JWT auth)
[Orquestador (Node/Lambda, secretos protegidos)]
   ↓ (valida, reenvía, agrega auth)
[API Gateway/Lambda]
   ↓
[Lambda destino]
```

## 2. Ejemplo de endpoint seguro

POST /api/add-lead

Headers:
- Authorization: Bearer <JWT usuario>
- Content-Type: application/json

Body:
```json
{
  "name": "Test Student",
  "phone": "+15555551234",
  "clase": "Adult BJJ",
  "visit_date": "2024-01-15",
  "note": "Interested in morning classes"
}
```

## 3. Validación y forwarding
- El orquestador valida el payload con zod/ajv.
- Si es válido, reenvía a la Lambda usando el AUTH_TOKEN solo conocido en backend.
- Si no, responde error 400.

## 4. Seguridad
- El frontend nunca ve ni usa secretos de Lambdas, ElevenLabs, ni Firebase.
- El orquestador puede loggear, auditar, rate-limitar, y proteger contra abuso.
- Puedes extender a más endpoints repitiendo el patrón.

## 5. Ejemplo de variable de entorno

.env (solo en backend/orquestador, nunca frontend):
```
LAMBDA_ADD_LEAD_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/add-lead
LAMBDA_AUTH_TOKEN=supersecreto
```

---

¿Quieres el ejemplo para otro endpoint o integración con tu auth real?