# Mapa de Agentes ElevenLabs y Webhooks

## Agentes Configurados Actualmente

### 1. **Student Intake Agent** (Entrante)
- **Tipo**: Inbound (llamadas entrantes de estudiantes)
- **Función**: Recibe información del estudiante
- **Webhooks que dispara**:
  - `POST /add-lead` → Guarda lead en Firestore
  - `POST /kick-confirmation` → Llamar a academia para confirmación
  - (Opcional) `POST /schedule-lead-callback` → Encolar a lead para callback

---

### 2. **Outbound Follow-up Agent** (Callback a Leads)
- **ID**: `agent_2001khfa9cn7fqab8wrv2ertt7jb`
- **Tipo**: Outbound (llamadas salientes)
- **Función**: Llama a leads para seguimiento después del intake
- **Número Twilio**: `+1 626 699 3169`
- **Disparado por**: Lambda `processCallbackQueueHandler`
- **Webhooks que dispara**:
  - `POST /mark-processed` → Marcar lead como procesado
  - (Opcional) `POST /update-lead` → Actualizar datos del lead
  - (Opcional) `POST /log-call-result` → Guardar resultado de llamada

---

### 3. **Confirmation Agent** (Confirmación a Academia)
- **ID**: `agent_5201khfawsbtfajsxrh0xba5r5s3`
- **Tipo**: Outbound (llamadas salientes)
- **Función**: Llama a academia para confirmar estudiante nuevo
- **Número Twilio**: `+1 626 699 3169`
- **Disparado por**: 
  - Lambda `kickConfirmationHandler` (desde /kick-confirmation webhook)
  - Lambda `dailyLeadReminderHandler` (resumen diario)
- **Webhooks que dispara**:
  - `POST /academy-confirmed` → Lead confirmado por academia
  - (Opcional) `POST /academy-declined` → Academia rechazó estudiante
  - (Opcional) `POST /schedule-visit` → Programar visita del estudiante

---

### 4. **Sally Agent** (Llamadas Internas a Academia)
- **ID**: `agent_2001khfa9cn7fqab8wrv2ertt7jb` (reutilizar o diferente)
- **Tipo**: Outbound (llamadas salientes)
- **Función**: Sally llama a academia con resumen de leads nuevos
- **Número Twilio**: `+1 626 699 3169`
- **Disparado por**: Lambda `initiateOutboundCallHandler` (desde /transcript)
- **Webhooks que dispara**:
  - `POST /academy-briefing-complete` → Resumen enviado
  - (Opcional) `POST /schedule-sync` → Programar sincronización

---

## Flujo Completo de Webhooks

```
LLAMADA ENTRANTE
       ↓
┌──────────────────────────────────────────────┐
│ Student Intake Agent (Inbound)               │
│ - Recolecta: nombre, teléfono, clase, fecha │
│ - Webhook: POST /add-lead                    │
│           (Firestore: leads.processed=false) │
└──────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────┐
│ POST /kick-confirmation                      │
│ (Agent dispara inmediatamente)               │
└──────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────┐
│ Confirmation Agent (Outbound)                │
│ ID: agent_5201khfawsbtfajsxrh0xba5r5s3      │
│ - Llama academia con datos del estudiante    │
│ - Webhook: POST /academy-confirmed           │
│           POST /academy-declined             │
└──────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────┐
│ POST /schedule-lead-callback (Optional)      │
│ - Enqueuer lead para callback con agent      │
│ - Firestore: callback_queue.status=pending   │
└──────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────┐
│ Event: EventBridge cada 1 minuto             │
│ Llama: processCallbackQueueHandler           │
└──────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────┐
│ Outbound Follow-up Agent (Callback)          │
│ ID: agent_2001khfa9cn7fqab8wrv2ertt7jb      │
│ - Llama lead de vuelta                       │
│ - Webhook: POST /mark-processed              │
│           POST /log-call-result              │
└──────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────┐
│ POST /mark-processed                         │
│ (Firestore: leads.processed=true)            │
└──────────────────────────────────────────────┘
```

---

## Tabla de Agentes y Webhooks

| Agent | Tipo | ID | Número | Webhooks Dispara |
|-------|------|----|----|--|
| **Student Intake** | Inbound | *(remoto)* | via SIP | `/add-lead`, `/kick-confirmation` |
| **Follow-up (Callbacks)** | Outbound | `agent_2001khfa9cn7fqab8wrv2ertt7jb` | +1 626 699 3169 | `/mark-processed`, `/log-call-result` |
| **Confirmation (Academy)** | Outbound | `agent_5201khfawsbtfajsxrh0xba5r5s3` | +1 626 699 3169 | `/academy-confirmed`, `/academy-declined` |
| **Sally (Optional)** | Outbound | `agent_2001khfa9cn7fqab8wrv2ertt7jb` | +1 626 699 3169 | `/academy-briefing-complete` |

---

## Webhooks Disponibles en AWS Lambda

### ✅ Implementados
```
POST /add-lead                    → addLeadHandler
POST /kick-confirmation           → kickConfirmationHandler
POST /schedule-lead-callback      → scheduleLeadCallbackHandler
POST /mark-processed              → markProcessedHandler
POST /process-callback-queue      → processCallbackQueueHandler (manual trigger)
POST /daily-lead-reminder         → dailyLeadReminderHandler
GET  /leads                       → getLeadsHandler
GET  /schedule                    → getScheduleHandler
PUT  /schedule                    → updateScheduleHandler
POST /transcript                  → transcriptWebhookHandler
POST /conversation-init           → conversationInitHandler
```

### ❓ Sugeridos para Agregar
```
POST /academy-confirmed           → Cuando academia confirma estudiante
POST /academy-declined            → Cuando academia rechaza estudiante
POST /log-call-result             → Log de resultados de llamadas
POST /schedule-visit              → Programar visita del estudiante
POST /academy-briefing-complete   → Confirmar briefing enviado a academia
POST /get-queue-status            → Consultar estado de cola de callbacks
POST /get-call-history            → Historial de llamadas por lead
```

---

## Recomendación: Nuevo Agente para Academia

### **Propuesta: Academy Liaison Agent**
- **ID**: `agent_66XXXXX` (crear nuevo en ElevenLabs)
- **Tipo**: Outbound especializado
- **Función**: Llamadas periódicas a academia para:
  - Enviar resúmenes de leads nuevos
  - Confirmar visitas programadas
  - Recopilar feedback de clase
  - Actualizar horarios de disponibilidad
- **Número**: `+1 626 699 3169`
- **Frecuencia**: Diaria a las 17:00 (después de hora de operación)
- **Webhooks que dispara**:
  - `POST /academy-visit-confirmed` → Visita confirmada
  - `POST /academy-class-feedback` → Feedback después de clase
  - `POST /academy-schedule-updated` → Horarios actualizados

---

## Instrucciones para Agregar Nuevo Agente

### En ElevenLabs Dashboard:
1. Ir a Agents → Create New Agent
2. Configurar:
   - **Name**: "Academy Liaison Agent"
   - **Type**: Outbound Call
   - **Voice**: Tu voz preferida
   - **Phone Number**: Usar Twilio (ya configurado)
3. En Webhooks section:
   ```json
   {
     "webhooks": [
       {
         "event": "call_complete",
         "url": "https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/academy-visit-confirmed"
       }
     ]
   }
   ```
4. En Variables de conversación:
   ```json
   {
     "academy_name": "Gracie Barra",
     "recent_leads": "{{ leads_list }}",
     "today_visits": "{{ scheduled_visits }}"
   }
   ```
5. Copiar Agent ID (ejemplo: `agent_66XXXXX`)

---

## Variables Dinámicas que Necesitan los Agentes

### Student Intake Agent

```javascript
{
  "student_name": "Juan García",
  "student_phone": "+16175551234",
  "class_type": "Kids (6-12)",
  "visit_date": "2026-02-15 14:00",
  "has_uniform": false,
  "note": "Interessado en jiujitsu competitivo"
}
```

### Follow-up Agent (Callbacks)

```javascript
{
  "lead_name": "María López",
  "lead_phone": "+16175551234",
  "class_type": "Women",
  "callback_message": "Hola! Solo quería confirmar tu interés...",
  "visit_date": "Próxima semana disponible"
}
```

### Confirmation Agent (Academy)

```javascript
{
  "student_name": "Carlos Ruiz",
  "student_phone": "+16175551234",
  "class_type": "Adult",
  "visit_date": "2026-02-16 10:00",
  "instructor_available": true,
  "academy_location": "Downtown"
}
```

### Academy Liaison Agent (Nuevo)

```javascript
{
  "academy_name": "Gracie Barra Downtown",
  "today_new_leads": 3,
  "leads_list": [
    {"name": "Juan", "class": "Kids", "visit": "Today 14:00"},
    {"name": "María", "class": "Women", "visit": "Tomorrow 10:00"}
  ],
  "scheduled_visits": 5,
  "week_overview": "Busy week, good interest"
}
```

---

## Monitoreo de Webhooks en CloudWatch

Para ver qué webhooks se están disparando:

```bash
# Logs de todos los webhooks
aws logs tail /aws/lambda/addLeadHandler --follow
aws logs tail /aws/lambda/kickConfirmationHandler --follow
aws logs tail /aws/lambda/processCallbackQueueHandler --follow
aws logs tail /aws/lambda/markProcessedHandler --follow

# Filtrar por agente específico
aws logs filter-log-events --log-group-name /aws/lambda/processCallbackQueueHandler \
  --filter-pattern "agent_2001khfa9cn7fqab8wrv2ertt7jb"
```

---

## Checklist de Configuración Completa

- ✅ Student Intake Agent (inbound)
- ✅ Follow-up Agent: `agent_2001khfa9cn7fqab8wrv2ertt7jb`
- ✅ Confirmation Agent: `agent_5201khfawsbtfajsxrh0xba5r5s3`
- ❓ Academy Liaison Agent: `agent_66XXXXX` (crear nuevo)
- ✅ Webhooks básicos implementados
- ❓ Webhooks adicionales para academy feedback
- ❓ Dashboard para monitoreo en tiempo real
- ❓ Database de métricas de llamadas
