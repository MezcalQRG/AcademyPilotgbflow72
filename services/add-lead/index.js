const { getFirestore } = require('./firebase-admin');

/**
 * Add Lead Handler
 * 
 * This function is responsible for adding a new lead to the Firestore database.
 * It receives lead data, validates it, and then creates a new document in the 'leads' collection.
 */
exports.handler = async (event) => {
  console.log('--- ADD LEAD HANDLER ---');

  try {
    // 1. Parse and Validate Input
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { name, phone, clase, visit_date, note, uniform } = body;

    if (!name || !phone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: name and phone' })
      };
    }

    // 2. Initialize Firestore
    const db = getFirestore();

    // 3. Prepare Lead Document
    const leadData = {
      name,
      phone,
      clase: clase || 'sin especificar',
      visit_date: visit_date || null,
      note: note || '',
      uniform: uniform !== undefined ? !!uniform : null, 
      source: 'orchestrator', // Source is now the orchestrator
      processed: false,
      createdAt: new Date(),
    };

    // 4. Add to Firestore
    const docRef = await db.collection('leads').add(leadData);

    console.log(`Successfully added lead with ID: ${docRef.id}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: docRef.id })
    };

  } catch (error) {
    console.error('Add Lead Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};