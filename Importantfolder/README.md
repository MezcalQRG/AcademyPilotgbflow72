Resumen rápido

Archivos añadidos:
- `handler.js` — Lambda handler que valida header, genera embedding (OpenAI), consulta Firestore y responde.
- `package.json` — dependencias mínimas (`firebase-admin`).
- `sam-template.yaml` — plantilla SAM mínima para desplegar una función y exponer un endpoint HTTP.
- `.env.example` — variables de entorno necesarias.

Instrucciones rápidas

1) Instala dependencias localmente para probar:

```bash
npm install
```

2) Crear `.env` o exportar variables de entorno:

- `ELEVENLABS_WEBHOOK_SECRET` — secreto compartido con ElevenLabs tool header.
- `OPENAI_API_KEY` — clave para embeddings/chat.
- `FIREBASE_SERVICE_ACCOUNT` o `FIREBASE_SERVICE_ACCOUNT_PATH` — credenciales del service account.

3) Ejecutar localmente (simula lambda con un invocador):

```bash
node -e "(async()=>{const h=require('./handler'); const r=await h.handler({ headers:{ authorization: 'Bearer '+process.env.ELEVENLABS_WEBHOOK_SECRET }, body: JSON.stringify({ pregunta_usuario: '¿Cuál es la política de devoluciones?' }) }); console.log(r); })()"
```

4) Despliegue con SAM (ejemplo):

--```bash
sam build
sam deploy --guided
```

Notas
- El handler asume que existe una colección `vectors` en Firestore con documentos que contienen `embedding` (array) y `text`.
- Para datasets grandes usa un vector DB (Pinecone/Weaviate) o Cloud Run, este ejemplo es para prototipos.
# Ellevenlabs-AWSLambdas-firebaseRAG-hosting
A system for extending Ellevenlabs services
