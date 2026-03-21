# Flujo Completo de Callback Queue con EventBridge

## 1. ¿Cómo funciona EventBridge y las horas de operación?

```
EventBridge Rule (cada 25 segundos)
    ↓
Invoques processCallbackQueueHandler Lambda
    ↓
Lambda INICIA → Verifica horarios operacionales EN RUNTIME
    ↓
SI ESTÁ FUERA DE HORARIO → Retorna sin procesar (no llamadas)
SI ESTÁ DENTRO DE HORARIO → Procesa la cola
```

**EventBridge (cada 25 segundos):**
- Se ejecuta **independientemente de la hora** (EventBridge no sabe de horarios)
- Llama la Lambda cada 25 segundos
- LA LAMBDA verifica internamente si es hora de operar

**Verificación de Horarios (dentro de la Lambda):**
```javascript
Step 1b: Checking operational hours
  ↓
Obtiene hora actual: ej. viernes 14:30
  ↓
Lee documento "weekly" de Firestore
  ↓
Busca datos de viernes: { open: "09:00", close: "18:00" }
  ↓
Valida: 14:30 >= 09:00 && 14:30 < 18:00 ✅ SÍ → Procesa
```

**Horario actual de operación (del archivo upload-schedule.js):**
```
Domingo    → CERRADO
Lunes      → 09:00 - 18:00
Martes     → 09:00 - 18:00
Miércoles  → 09:00 - 18:00
Jueves     → 09:00 - 18:00
Viernes    → 09:00 - 18:00
Sábado     → 10:00 - 15:00
```

**Logs que verás en CloudWatch:**
```
Step 1b: Checking operational hours
  Current day: friday, time: 14:30
  friday: 09:00 - 18:00 | Current: 14:30 | Within hours: true ✅
  Step 1b.1: Within operational hours, proceeding
```

Si está fuera de horario:
```
  friday: 09:00 - 18:00 | Current: 22:30 | Within hours: false ❌
  Step 1b.1: Outside operational hours, skipping queue processing
  Response: { "message": "Outside operational hours", "processed": 0 }
```

---

## 2. ¿Cómo SABE cuál lead procesar primero? (Orden de la cola)

```
FIFO (First In, First Out) - Primer entrada, primer salida
```

**Query en Firestore:**
```javascript
db.collection('callback_queue')
  .where('status', '==', 'pending')           // Solo items sin procesar
  .orderBy('created_at', 'asc')               // Orden: más antiguo primero
  .limit(1)                                   // Procesa 1 por invocación
  .get()
```

**Ejemplo de cola:**
```
Documento 1: { lead_name: "Juan", created_at: 2026-02-14 14:00:00, status: "pending" }
Documento 2: { lead_name: "María", created_at: 2026-02-14 14:00:05, status: "pending" }
Documento 3: { lead_name: "Carlos", created_at: 2026-02-14 14:00:10, status: "pending" }

Cada 25 segundos:
Ejecución 1 (14:00:25) → Procesa Juan (si no contesta → va a "pending" con attempt_count=1)
Ejecución 2 (14:00:50) → Procesa María
Ejecución 3 (14:01:15) → Procesa Carlos
Ejecución 4 (14:01:40) → Juan otra vez (reintento 1/3)
Ejecución 5 (14:02:05) → Próximo en cola, etc...
```

**Logs en CloudWatch:**
```
Step 2: Querying callback queue for pending items
Step 2.1: Found 1 pending items in queue

Step 3.1: Processing queue item abc123def
  Lead: Juan Garcia (+16175551234)
```

---

## 3. ¿Qué pasa si no contestan después de 3 intentos?

```
Intento 1 (minuto 0)
  ↓
Falla → { status: 'pending', attempt_count: 1, last_error: "..." }
  ↓
Intento 2 (minuto 25)
  ↓
Falla → { status: 'pending', attempt_count: 2, last_error: "..." }
  ↓
Intento 3 (minuto 50)
  ↓
Falla → { status: 'FAILED', attempt_count: 3, last_error: "..." }
  ↓
❌ SE DETIENE - NO MÁS REINTENTOS
```

**Documento de queue item marcado como FAILED:**
```javascript
{
  lead_phone: "+16175551234",
  lead_name: "Juan Garcia",
  lead_id: "lead_123",
  status: "failed",                    // ← MARCADO COMO FALLIDO
  attempt_count: 3,                    // ← 3 intentos completados
  last_error: "ElevenLabs API returned 503: Service Unavailable",
  created_at: 2026-02-14 14:00:00,
  last_attempt_at: 2026-02-14 14:00:50,
  completed_at: null
}
```

**Logs en CloudWatch de cada reintento:**
```
Intento 1:
  Step 3.1: Processing queue item abc123def
  Lead: Juan Garcia (+16175551234)
  ERROR: ElevenLabs API returned 503: Service Unavailable
  Will retry (1/3)
  Updated status: pending, attempt_count: 1

Intento 2:
  Step 3.1: Processing queue item abc123def
  Lead: Juan Garcia (+16175551234)
  ERROR: ElevenLabs API returned 503: Service Unavailable
  Will retry (2/3)
  Updated status: pending, attempt_count: 2

Intento 3:
  Step 3.1: Processing queue item abc123def
  Lead: Juan Garcia (+16175551234)
  ERROR: ElevenLabs API returned 503: Service Unavailable
  Max retries reached, marking as failed
  Updated status: FAILED, attempt_count: 3
```

**¿Qué hacer con items fallidos?**
- Quedan en `callback_queue` con `status: 'failed'`
- Puedes crear un Lambda separado para consultar e investigar fallos
- Opción: Crear una colección `failed_callbacks` para historial

---

## 4. ¿Qué pasa cuando termina de llamar a todos los leads?

```
EventBridge llama cada 25 segundos
    ↓
Lambda inicia
    ↓
Query: WHERE status='pending' ORDER BY created_at ASC LIMIT 1
    ↓
Resultado vacío (no hay más pending) ✅
    ↓
Lambda retorna:
{
  "success": true,
  "message": "No pending items in queue",
  "processed": 0
}
    ↓
EventBridge espera 25 segundos y VUELVE A INTENTAR (búsqueda vacía)
```

**Logs cuando NO hay items:**
```
Step 2: Querying callback queue for pending items
Step 2.1: Found 0 pending items in queue
Step 3: No pending items, exiting

Response:
{
  "success": true,
  "message": "No pending items in queue",
  "processed": 0,
  "failed": 0,
  "total": 0,
  "results": []
}
```

**Logs cuando hay items pendientes (cola procesando):**
```
Step 2.1: Found 1 pending items in queue
Step 3: Processing queue items
Step 3.1: Processing queue item abc123def
  Lead: Juan Garcia (+16175551234)
  Step 3b: Calling ElevenLabs API
  Step 3c: Call initiated successfully (ConvID: conv_abc123)
  Step 3d: Updating queue item status

SUCCESS: Processed 1 items, 0 failed
```

---

## Resumen del Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AGENT PROGRAMA CALLBACK                                 │
│    ↓ POST /schedule-lead-callback                          │
│    ↓ Guarda en callback_queue { status: 'pending' }        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EVENTBRIDGE CADA 25 SEG                                 │
│    Dispara processCallbackQueueHandler                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LAMBDA VERIFICA HORARIOS                                │
│    ❌ Fuera de horario? → Sale sin procesar (wait 25 seg)  │
│    ✅ En horario? → Continúa                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. LAMBDA BUSCA LEADS EN COLA (FIFO)                       │
│    WHERE status='pending'                                 │
│    ORDER BY created_at ASC                                 │
│    LIMIT 1 (una por invocación)                            │
│                                                              │
│    ¿Hay items? → Ir a paso 5                               │
│    ¿No hay? → Esperar 25 seg, EventBridge llama otra vez  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. LAMBDA LLAMA VÍA ELEVENLABS                             │
│    POST /v1/convai/sip-trunk/outbound-call                │
│    Callback Agent habla con lead                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. PROCESA RESULTADO                                       │
│    ✅ Llamada exitosa?                                     │
│       → status: 'completed'                                │
│       → Guarda conversation_id                             │
│       → Listo (no más reintentos)                          │
│                                                              │
│    ❌ Falla?                                               │
│       → attempt_count + 1                                  │
│       → Si attempt_count < 3:                              │
│          status: 'pending' (será reintentado)             │
│       → Si attempt_count >= 3:                             │
│          status: 'failed' (se detiene)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. CICLO CONTINÚA                                          │
│    EventBridge espera 25 seg                               │
│    → Vuelve al paso 2                                      │
│    → Procesa próximo lead en cola                          │
│    → O espera si cola está vacía                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Estadísticas y Monitoreo

**CloudWatch Logs:**
- Busca: `PROCESS CALLBACK QUEUE`
- Filtra por: `Step 2.1: Found X pending items`

**Métricas importantes:**
```
- Leads processed per 25 seconds: 1 (por diseño)
- Reintentos entre intentos: 25 segundos
- Max reintentos: 3 (total ~75 segundos por lead fallido)
- Items que pueden procesar por hora: ~144 (3600 seg / 25)
```

**Ejemplo de throughput:**
```
Hora:  14:00  14:25  14:50  15:15  15:40  16:05  16:30 ...
Items:  1      1      1      1      1      1      1     ...
        Juan   María  Carlos Juan(r1) María(r1) Carlos(r1) ...

Con 1 lead por 25 segundos:
- Si todo va bien: 144 leads/hora
- Pero si hay fallos: los reintentos ralentizan el proceso
```

---

## Configuración Actual

**template.yaml:**
```yaml
ProcessCallbackQueueSchedule:
  Type: Schedule
  Properties:
    Schedule: 'rate(25 seconds)'      # ← Cada 25 segundos
    RetryPolicy:
      MaximumEventAge: 60              # ← EventBridge reintentos (no Lambda)
      MaximumRetryAttempts: 2          # ← 2 reintentos de EventBridge
```

**Lambda:**
- Timeout: 60 segundos (suficiente para 1 llamada)
- Memory: 512 MB
- Reintentos internos: 3 (configurable en el código)
