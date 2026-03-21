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

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('CONVERSION METRICS - Calculate performance and conversion rates');
  console.log('='.repeat(80));

  try {
    // Step 1: Get all leads from Firestore
    console.log('Step 1: Fetching all leads');
    const allLeads = await db.collection('leads').get();
    
    console.log(`Step 1.1: Total documents: ${allLeads.size}`);

    // Step 2: Calculate basic metrics
    console.log('Step 2: Calculating basic metrics');
    let totalLeads = 0;
    let processedLeads = 0;
    let processingTimes = [];
    let byClass = {};
    let classProcessed = {};
    let weeklyData = {};

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allLeads.forEach((doc) => {
      const lead = doc.data();
      totalLeads++;

      // By class
      const classe = lead.clase || 'Unknown';
      byClass[classe] = (byClass[classe] || 0) + 1;

      if (lead.processed) {
        processedLeads++;
        classProcessed[classe] = (classProcessed[classe] || 0) + 1;

        if (lead.processedAt && lead.createdAt) {
          const processingTime = lead.processedAt.toDate() - lead.createdAt.toDate();
          processingTimes.push(processingTime);
        }
      }

      // Weekly breakdown (last 7 days)
      if (lead.createdAt.toDate() >= sevenDaysAgo) {
        const weekDay = lead.createdAt.toDate().toISOString().split('T')[0];
        if (!weeklyData[weekDay]) {
          weeklyData[weekDay] = { total: 0, processed: 0 };
        }
        weeklyData[weekDay].total++;
        if (lead.processed) {
          weeklyData[weekDay].processed++;
        }
      }
    });

    console.log(`Step 2.1: Total leads: ${totalLeads}, Processed: ${processedLeads}`);

    // Step 3: Calculate conversion rates by class
    console.log('Step 3: Calculating conversion rates by class');
    let classConversionRates = {};
    Object.keys(byClass).forEach((classe) => {
      const total = byClass[classe];
      const processed = classProcessed[classe] || 0;
      const rate = total > 0 ? ((processed / total) * 100).toFixed(1) : 0;
      classConversionRates[classe] = {
        total: total,
        processed: processed,
        rate: `${rate}%`,
      };
    });

    console.log(`Step 3.1: Conversion rates:`, classConversionRates);

    // Step 4: Calculate processing times
    console.log('Step 4: Calculating processing statistics');
    let processingStats = {
      total_processed: processingTimes.length,
      average_ms: 0,
      average_minutes: 'N/A',
      median_ms: 0,
      median_minutes: 'N/A',
      min_ms: 0,
      max_ms: 0,
    };

    if (processingTimes.length > 0) {
      processingTimes.sort((a, b) => a - b);
      processingStats.total_processed = processingTimes.length;
      processingStats.average_ms = Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length);
      processingStats.average_minutes = (processingStats.average_ms / 1000 / 60).toFixed(1);
      processingStats.median_ms = processingTimes[Math.floor(processingTimes.length / 2)];
      processingStats.median_minutes = (processingStats.median_ms / 1000 / 60).toFixed(1);
      processingStats.min_ms = processingTimes[0];
      processingStats.max_ms = processingTimes[processingTimes.length - 1];
    }

    console.log(`Step 4.1: Processing stats:`, processingStats);

    // Step 5: Calculate overall conversion rate
    console.log('Step 5: Calculating overall metrics');
    const overallConversionRate = totalLeads > 0 
      ? ((processedLeads / totalLeads) * 100).toFixed(1)
      : 0;

    const metrics = {
      timestamp: new Date(),
      total_leads: totalLeads,
      processed_leads: processedLeads,
      unprocessed_leads: totalLeads - processedLeads,
      overall_conversion_rate: `${overallConversionRate}%`,
      by_class: classConversionRates,
      processing_time_stats: processingStats,
      last_7_days: weeklyData,
    };

    console.log(`Step 5.1: Overall conversion rate: ${overallConversionRate}%`);

    // Step 6: Generate detailed report
    console.log('Step 6: Generating detailed report');
    const report = `
🎯 CONVERSION METRICS REPORT
Generated: ${new Date().toISOString()}

📊 OVERALL PERFORMANCE:
  • Total Leads: ${totalLeads}
  • Processed: ${processedLeads}
  • Unprocessed: ${totalLeads - processedLeads}
  • Conversion Rate: ${overallConversionRate}%

📈 BY CLASS:
${Object.entries(classConversionRates).map(([cls, data]) => 
  `  • ${cls}:
      - Total: ${data.total}
      - Converted: ${data.processed}
      - Rate: ${data.rate}`
).join('\n')}

⏱️ PROCESSING TIME:
  • Average: ${processingStats.average_minutes} minutes (${processingStats.average_ms}ms)
  • Median: ${processingStats.median_minutes} minutes (${processingStats.median_ms}ms)
  • Min: ${processingStats.min_ms}ms
  • Max: ${processingStats.max_ms}ms
  • Samples: ${processingStats.total_processed}

📅 LAST 7 DAYS TREND:
${Object.entries(weeklyData).map(([day, data]) => 
  `  • ${day}: ${data.total} leads, ${data.processed} converted (${((data.processed/data.total)*100).toFixed(0)}%)`
).join('\n')}
    `.trim();

    console.log('Step 6.1: Report generated');

    // Step 7: Save metrics to Firestore
    console.log('Step 7: Saving metrics to Firestore');
    await db.collection('conversion_metrics').doc('latest').set(metrics, { merge: true });
    await db.collection('conversion_metrics_history').doc(new Date().toISOString().split('T')[0]).set(metrics);

    console.log('='.repeat(80));
    console.log('✅ SUCCESS: Conversion metrics calculated');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Conversion metrics calculated',
        metrics: metrics,
        report: report,
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
