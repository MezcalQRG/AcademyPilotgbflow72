const { getFirestore } = require('./firebase-admin');

/**
 * Get Leads Service
 * 
 * This service retrieves a list of leads from the Firestore database. It supports filtering, 
 * sorting, and pagination to allow for flexible querying by the frontend.
 */
exports.handler = async (event) => {
  console.log('--- GET LEADS SERVICE ---');

  try {
    // 1. Parse Query Parameters
    const { 
      limit = 100, 
      orderBy = 'createdAt', 
      order = 'desc', 
      includeProcessed = false 
    } = event;

    const db = getFirestore();
    let query = db.collection('leads');

    // 2. Apply Filters
    if (!includeProcessed) {
      query = query.where('processed', '==', false);
    }

    // 3. Apply Sorting and Pagination
    query = query.orderBy(orderBy, order).limit(Number(limit));

    // 4. Execute Query
    const snapshot = await query.get();
    
    // 5. Format Response
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
    }));

    console.log(`Successfully retrieved ${leads.length} leads.`);

    return {
      success: true,
      total: leads.length,
      leads: leads
    };

  } catch (error) {
    console.error('Get Leads Service Error:', error);
    return {
      success: false,
      error: 'Internal Server Error',
      details: error.message
    };
  }
};