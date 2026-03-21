const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
const projectId = process.env.FIREBASE_PROJECT_ID || 'admin-audit-3f2cd';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: projectId,
  });
}

const db = admin.firestore();
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'defaulttoken';

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('ANALYTICS LEAD REPORT - Generate comprehensive analytics');
  console.log('='.repeat(80));

  try {
    // Step 1: Parse query parameters
    console.log('Step 1: Parsing query parameters');
    const period = event.queryStringParameters?.period || 'today'; // today, week, month
    const includeDetails = event.queryStringParameters?.details === 'true';

    console.log(`Step 1.1: Period: ${period}, Include details: ${includeDetails}`);

    // Step 2: Get date range
    console.log('Step 2: Calculating date range');
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }

    const endDate = new Date();
    console.log(`Step 2.1: ${period.toUpperCase()} Report - From ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Step 3: Query all leads in period
    console.log('Step 3: Querying leads in period');
    const snapshot = await db.collection('leads')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`Step 3.1: Found ${snapshot.size} leads in ${period}`);

    // Step 4: Calculate metrics
    console.log('Step 4: Calculating metrics');
    let metrics = {
      total_leads: snapshot.size,
      processed: 0,
      unprocessed: 0,
      by_class: {},
      by_source: {},
      by_day: {},
      avg_time_to_process: 0,
      recent_leads: [],
    };

    let processingTimes = [];

    snapshot.forEach((doc) => {
      const lead = doc.data();
      const date = lead.createdAt.toDate();
      const dayKey = date.toISOString().split('T')[0];

      // Count by status
      if (lead.processed) {
        metrics.processed++;
        if (lead.processedAt) {
          const processingTime = lead.processedAt.toDate() - date;
          processingTimes.push(processingTime);
        }
      } else {
        metrics.unprocessed++;
      }

      // Count by class
      const classe = lead.clase || 'Unknown';
      metrics.by_class[classe] = (metrics.by_class[classe] || 0) + 1;

      // Count by source
      const source = lead.source || 'Unknown';
      metrics.by_source[source] = (metrics.by_source[source] || 0) + 1;

      // Count by day
      metrics.by_day[dayKey] = (metrics.by_day[dayKey] || { total: 0, processed: 0 });
      metrics.by_day[dayKey].total++;
      if (lead.processed) {
        metrics.by_day[dayKey].processed++;
      }

      // Store recent leads if requested
      if (includeDetails && metrics.recent_leads.length < 10) {
        metrics.recent_leads.push({
          id: doc.id,
          name: lead.name,
          phone: lead.phone,
          class: lead.clase,
          processed: lead.processed,
          created_at: lead.createdAt.toDate().toISOString(),
        });
      }
    });

    // Calculate average processing time
    if (processingTimes.length > 0) {
      const avgMs = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      metrics.avg_time_to_process = `${(avgMs / 1000 / 60).toFixed(1)} minutes`;
    }

    // Step 5: Calculate conversion rate
    console.log('Step 5: Calculating conversion rate');
    const conversionRate = metrics.total_leads > 0 
      ? ((metrics.processed / metrics.total_leads) * 100).toFixed(1)
      : 'N/A';

    metrics.conversion_rate = `${conversionRate}%`;

    // Step 6: Generate summary text
    console.log('Step 6: Generating summary');
    const summary = `
📊 ${period.toUpperCase()} ANALYTICS REPORT

📈 OVERVIEW:
  • Total Leads: ${metrics.total_leads}
  • Processed: ${metrics.processed}
  • Unprocessed: ${metrics.unprocessed}
  • Conversion Rate: ${metrics.conversion_rate}
  • Avg Time to Process: ${metrics.avg_time_to_process}

📚 BY CLASS:
${Object.entries(metrics.by_class).map(([cls, count]) => `  • ${cls}: ${count}`).join('\n')}

📍 BY SOURCE:
${Object.entries(metrics.by_source).map(([src, count]) => `  • ${src}: ${count}`).join('\n')}

📅 BY DAY:
${Object.entries(metrics.by_day).map(([day, data]) => `  • ${day}: ${data.total} total, ${data.processed} processed (${((data.processed/data.total)*100).toFixed(0)}%)`).join('\n')}
    `.trim();

    console.log('Step 6.1: Summary generated');

    // Step 7: Save report to Firestore
    console.log('Step 7: Saving report to Firestore');
    await db.collection('analytics_reports').doc(`${period}_${new Date().toISOString().split('T')[0]}`).set({
      period: period,
      generated_at: new Date(),
      metrics: metrics,
      summary: summary,
    }, { merge: true });

    console.log('='.repeat(80));
    console.log('✅ SUCCESS: Analytics report generated');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Analytics report generated',
        period: period,
        metrics: metrics,
        summary: summary,
      }),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('❌ ERROR:', error.message);
    console.log('Stack:', error.stack);
    console.log('='.repeat(80));

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
