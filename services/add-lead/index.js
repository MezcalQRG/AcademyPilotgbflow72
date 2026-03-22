const { getFirestore } = require('./firebase-admin');

/**
 * Add Lead Handler (Multi-Tenant)
 * 
 * This function adds a new lead to the Firestore database. It requires a tenantSlug
 * to associate the new lead with the correct academy.
 */
exports.handler = async (event) => {
  console.log('--- ADD LEAD HANDLER ---');

  try {
    // 1. Parse Input
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    // Extracting email as well
    const { tenantSlug, name, phone, email, clase, visit_date, note, uniform, source } = body;

    // 2. Validate Tenant and Required Fields
    if (!tenantSlug) {
      console.error('Security Alert: Attempted to add a lead without a tenantSlug.');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bad Request: tenantSlug is required.' })
      };
    }

    if (!name || !phone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: name and phone' })
      };
    }

    // 3. Initialize Firestore
    const db = getFirestore();

    // 4. Prepare Lead Document
    const leadData = {
      tenantSlug, // Explicitly assign the lead to the tenant
      name,
      phone,
      email: email || null, // Optional for backward compatibility, but highly recommended
      clase: clase || 'sin especificar',
      visit_date: visit_date || null,
      note: note || '',
      uniform: uniform !== undefined ? !!uniform : null, 
      source: source || 'orchestrator', 
      processed: false,
      createdAt: new Date(),
    };

    // 5. Add to Firestore
    const docRef = await db.collection('leads').add(leadData);

    console.log(`Successfully added lead with ID: ${docRef.id} to tenant: ${tenantSlug}`);

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