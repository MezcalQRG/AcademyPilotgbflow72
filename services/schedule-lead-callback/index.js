const { getFirestore } = require('./firebase-admin');

/**
 * Schedule Lead Callback Service (Multi-Tenant)
 * 
 * Invoked via a webhook to add a lead to the callback queue. It now requires a tenantSlug
 * to associate the queued item with the correct academy. The background worker will
 * process these items based on the academy's operational hours.
 */
exports.handler = async (event) => {
  console.log('--- SCHEDULE LEAD CALLBACK ---');

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    // 1. Extract and Normalize Lead Information & Tenant Isolation
    const { tenantSlug } = body;
    const leadPhone = body?.lead_phone || body?.phone || body?.variables?.lead_phone;
    const leadName = body?.lead_name || body?.name || body?.variables?.lead_name || 'Unknown';
    const leadId = body?.lead_id || body?.id || body?.variables?.lead_id || 'N/A';
    const message = body?.message || body?.variables?.message || 'Calling with important information';
    const clase = body?.clase || body?.variables?.clase || 'Not specified';
    const priority = body?.priority || body?.variables?.priority || 'normal';

    // 2. Validate Tenant and Required Data
    if (!tenantSlug) {
      console.error('Security Alert: Attempted to schedule a callback without a tenantSlug.');
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Bad Request: tenantSlug is required.' })
      };
    }

    if (!leadPhone) {
      console.warn('Missing required field: lead_phone');
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'lead_phone is required' }) };
    }

    // 3. Prepare Queue Item
    const queueItem = {
      tenantSlug, // Explicitly assign the queue item to the tenant
      lead_phone: leadPhone,
      lead_name: leadName,
      lead_id: leadId,
      clase: clase,
      message: message,
      priority: priority,
      status: 'pending', // Key status for the queue processor
      created_at: new Date(),
      updated_at: new Date(),
      attempt_count: 0,
      last_error: null,
    };

    // 4. Save to Firestore Queue
    const db = getFirestore();
    const queueRef = db.collection('callback_queue').doc();
    await queueRef.set(queueItem);

    console.log(`Successfully scheduled callback for lead ${leadName} to tenant: ${tenantSlug} with ID: ${queueRef.id}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Lead added to callback queue',
        queue_item_id: queueRef.id,
        lead: { id: leadId, name: leadName, phone: leadPhone }
      })
    };

  } catch (error) {
    console.error(`Schedule Lead Callback Error (Tenant: ${event.body?.tenantSlug || 'Unknown'}):`, error);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Internal Server Error', details: error.message }) };
  }
};