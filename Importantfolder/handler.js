const admin = require('firebase-admin');

// Lazy initialize Firebase Admin
function initFirebase() {
  if (admin.apps.length) return admin.firestore();

  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT must be valid JSON');
      throw e;
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  } else {
    throw new Error('No Firebase service account configured (FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH)');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return admin.firestore();
}

// Simple cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0;
  let norma = 0;
  let normb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    norma += a[i] * a[i];
    normb += b[i] * b[i];
  }
  if (norma === 0 || normb === 0) return 0;
  return dot / (Math.sqrt(norma) * Math.sqrt(normb));
}

async function makeEmbedding(openaiKey, input) {
  if (!openaiKey) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input }),
  });
  if (!res.ok) throw new Error(`Embeddings error: ${res.statusText}`);
  const j = await res.json();
  return j.data[0].embedding;
}

async function callChat(openaiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres un asistente conciso. Responde en 2-3 oraciones.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 256,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`Chat error: ${res.statusText}`);
  const j = await res.json();
  return j.choices[0].message.content.trim();
}

exports.handler = async function (event) {
  try {
    const headers = event.headers || {};
    const auth = headers.authorization || headers.Authorization || '';
    if (process.env.ELEVENLABS_WEBHOOK_SECRET && auth !== `Bearer ${process.env.ELEVENLABS_WEBHOOK_SECRET}`) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const pregunta = body.pregunta_usuario || body.question || body.text;
    if (!pregunta) return { statusCode: 400, body: JSON.stringify({ error: 'Missing pregunta_usuario' }) };

    const db = initFirebase();

    // 1) Embedding
    const openaiKey = process.env.OPENAI_API_KEY;
    const queryEmbedding = await makeEmbedding(openaiKey, pregunta);

    // 2) Retrieve candidate docs from Firestore (assumes collection 'vectors' with fields: embedding (array), text)
    const snapshot = await db.collection('vectors').limit(200).get();
    const scored = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.embedding || !Array.isArray(data.embedding)) return;
      const score = cosineSimilarity(queryEmbedding, data.embedding);
      scored.push({ id: doc.id, score, text: data.text || data.content || '' });
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);
    const context = top.map((t) => `- ${t.text}`).join('\n');

    // 3) Send to chat model
    const prompt = `Contexto:\n${context}\n\nPregunta: ${pregunta}\n\nResponde de forma breve y útil.`;
    const answer = await callChat(openaiKey, prompt);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, answer }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
