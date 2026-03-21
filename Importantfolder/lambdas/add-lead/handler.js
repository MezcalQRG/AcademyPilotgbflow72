const admin = require('firebase-admin');

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

exports.handler = async function (event) {
  // Log full raw event payload for debugging (ElevenLabs webhook content)
  try {
    console.log('RAW_EVENT:', JSON.stringify(event));
  } catch (e) {
    console.log('RAW_EVENT: <failed to stringify event>', e && e.message);
  }

  console.log('Step 1: Handler invoked, received event');
  console.log('Step 1.1: Event keys:', Object.keys(event));
  
  try {
    console.log('Step 2: Extracting headers');
    const headers = event.headers || {};
    console.log('Step 2.1: Headers keys:', Object.keys(headers));

    let auth = headers.authorization || headers.Authorization || '';
    auth = (typeof auth === 'string') ? auth.trim() : '';
    console.log('Step 2.2: Authorization header present:', !!auth);

    console.log('Step 3: Validating authorization');
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET || '';
    console.log('Step 3.1: Secret configured:', !!secret);

    // Accept either 'Bearer <secret>' or plain '<secret>' to be tolerant of header formats
    const authOk = secret ? (auth === `Bearer ${secret}` || auth === secret) : true;
    console.log('Step 3.2: Provided auth header value:', auth);
    if (!authOk) {
      console.log('Step 3.3: FAILED - Unauthorized access attempt');
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    console.log('Step 3.4: Authorization validation passed');

    console.log('Step 4: Parsing request body');
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
        console.log('Step 4.1: Body parsed successfully');
        console.log('Step 4.2: Body keys:', Object.keys(body));
      } catch (parseErr) {
        console.log('Step 4.1: FAILED - Body parse error:', parseErr.message);
        throw parseErr;
      }
    } else {
      console.log('Step 4.1: No body in event, using empty object');
    }
    
    console.log('Step 5: Extracting form fields');
    const name = body.name || body.nombre;
    console.log('Step 5.1: name =', name);
    
    const clase = body.clase || body.class || body.course || 'sin especificar';
    console.log('Step 5.2: clase =', clase);
    
    const phone = body.phone || body.telefono;
    console.log('Step 5.3: phone =', phone);
    
    const visit_date = body.visit_date || body.fecha_visita || body.date;
    console.log('Step 5.4: visit_date =', visit_date);
    
    const note = body.note || body.nota || '';
    console.log('Step 5.5: note =', note);
    
    const uniform = typeof body.uniform !== 'undefined' ? !!body.uniform : null;
    console.log('Step 5.6: uniform =', uniform);

    console.log('Step 6: Validating required fields');
    console.log('Step 6.1: name present:', !!name, '| phone present:', !!phone);
    if (!name || !phone) {
      console.log('Step 6.2: FAILED - Missing required fields');
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: name, phone' }) };
    }
    console.log('Step 6.3: All required fields validated');

    console.log('Step 7: Initializing Firebase Admin SDK');
    const db = initFirebase();
    console.log('Step 7.1: Firebase Admin SDK initialized');
    
    console.log('Step 8: Preparing document data for Firestore');
    const docData = {
      name,
      clase,
      phone,
      visit_date: visit_date || null,
      note,
      uniform,
      source: 'elevenlabs_tool',
      processed: false,
      createdAt: new Date(),
    };
    console.log('Step 8.1: Document data prepared:', JSON.stringify(docData));
    
    console.log('Step 9: Writing to Firestore "leads" collection');
    const docRef = await db.collection('leads').add(docData);
    console.log('Step 9.1: SUCCESSFUL - Document written');
    console.log('Step 9.2: New document ID:', docRef.id);

    console.log('Step 10: Returning success response');
    const response = { statusCode: 200, body: JSON.stringify({ success: true, id: docRef.id }) };
    console.log('Step 10.1: Response:', JSON.stringify(response));
    return response;
    
  } catch (err) {
    console.error('Step 99: EXCEPTION CAUGHT');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
