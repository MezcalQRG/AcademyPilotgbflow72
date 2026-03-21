const admin = require('firebase-admin');
const https = require('https');

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

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const CALLBACK_AGENT_ID = process.env.CALLBACK_AGENT_ID; // Agent that calls leads back
const CALLBACK_PHONE_ID = process.env.CALLBACK_PHONE_ID; // Phone number the agent owns

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('PROCESS CALLBACK QUEUE - Process pending callback queue items');
  console.log('='.repeat(80));
  
  try {
    // Step 1: Validate configuration
    console.log('Step 1: Validating configuration');
    if (!ELEVENLABS_API_KEY || !CALLBACK_AGENT_ID || !CALLBACK_PHONE_ID) {
      console.log('Step 1.1: WARNING - Configuration incomplete, skipping queue processing');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Configuration incomplete',
          processed: 0,
        }),
      };
    }
    console.log('Step 1.1: Configuration valid');

    // Step 1b: Check operational hours
    console.log('Step 1b: Checking operational hours');
    const isOperationalHours = await checkOperationalHours();
    if (!isOperationalHours) {
      console.log('Step 1b.1: Outside operational hours, skipping queue processing');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Outside operational hours',
          processed: 0,
        }),
      };
    }
    console.log('Step 1b.1: Within operational hours, proceeding');

    // Step 2: Query pending items from callback queue
    console.log('Step 2: Querying callback queue for pending items');
    const snapshot = await db.collection('callback_queue')
      .where('status', '==', 'pending')
      .orderBy('created_at', 'asc')
      .limit(1) // Process 1 item per invocation (EventBridge triggers every 25 seconds)
      .get();

    console.log(`Step 2.1: Found ${snapshot.size} pending items in queue`);

    if (snapshot.size === 0) {
      console.log('Step 3: No pending items, exiting');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No pending items in queue',
          processed: 0,
        }),
      };
    }

    // Step 3: Process each queue item
    console.log('Step 3: Processing queue items');
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    const results = [];
    const now = new Date();

    for (let doc of snapshot.docs) {
      const queueItemId = doc.id;
      const queueItem = doc.data();

      // Step 3.0: Check if item is scheduled for a future time
      console.log(`\nStep 3.${successCount + failureCount + skippedCount + 1}: Processing queue item ${queueItemId}`);
      console.log(`  Lead: ${queueItem.lead_name} (${queueItem.lead_phone})`);

      if (queueItem.scheduled_for) {
        const scheduledTime = new Date(queueItem.scheduled_for);
        if (scheduledTime > now) {
          const waitSeconds = Math.round((scheduledTime - now) / 1000);
          console.log(`  ⏳ Scheduled for: ${scheduledTime.toISOString()}`);
          console.log(`  ⏳ Will wait ${waitSeconds} seconds before calling`);
          console.log(`  SKIPPED - Not yet time to call`);
          skippedCount++;
          results.push({
            queue_item_id: queueItemId,
            status: 'skipped_scheduled',
            lead: queueItem.lead_name,
            scheduled_for: scheduledTime.toISOString(),
            wait_seconds: waitSeconds,
          });
          continue; // Skip to next item
        } else {
          console.log(`  ⏰ Scheduled time passed: ${scheduledTime.toISOString()}`);
          console.log(`  ⏰ Proceeding with call`);
        }
      }

      try {
        // Step 3a: Prepare outbound call payload
        console.log(`  Step 3a: Preparing outbound call payload`);
        const payloadObj = {
          agent_id: CALLBACK_AGENT_ID,
          agent_phone_number_id: CALLBACK_PHONE_ID,
          to_number: queueItem.lead_phone,
          conversation_initiation_client_data: {
            dynamic_variables: {
              lead_name: queueItem.lead_name,
              lead_id: queueItem.lead_id,
              class_type: queueItem.clase,
              callback_message: queueItem.message,
            },
            metadata: {
              source: 'process_callback_queue',
              queue_item_id: queueItemId,
              initiated_at: new Date().toISOString(),
            },
          },
        };

        // Step 3b: Make the outbound call
        console.log(`  Step 3b: Calling ElevenLabs API`);
        const callResult = await makeOutboundCall(JSON.stringify(payloadObj));
        console.log(`  Step 3c: Call initiated successfully (ConvID: ${callResult.conversation_id})`);

        // Step 3d: Update queue item as processed
        console.log(`  Step 3d: Updating queue item status`);
        await db.collection('callback_queue').doc(queueItemId).update({
          status: 'completed',
          completed_at: new Date(),
          conversation_id: callResult.conversation_id || null,
          sip_call_id: callResult.sip_call_id || null,
        });

        successCount++;
        results.push({
          queue_item_id: queueItemId,
          status: 'success',
          lead: queueItem.lead_name,
          conversation_id: callResult.conversation_id,
        });

        // Only process 1 item per invocation (FIFO)
        break;
      } catch (itemError) {
        console.log(`  ERROR: ${itemError.message}`);

        // Update queue item with error
        const attemptCount = (queueItem.attempt_count || 0) + 1;
        const maxRetries = 3;

        let newStatus = 'failed';
        if (attemptCount < maxRetries) {
          newStatus = 'pending'; // Retry
          console.log(`  Will retry (${attemptCount}/${maxRetries})`);
        } else {
          console.log(`  Max retries reached, marking as failed`);
        }

        await db.collection('callback_queue').doc(queueItemId).update({
          status: newStatus,
          attempt_count: attemptCount,
          last_error: itemError.message,
          last_attempt_at: new Date(),
        });

        failureCount++;
        results.push({
          queue_item_id: queueItemId,
          status: 'failed',
          lead: queueItem.lead_name,
          error: itemError.message,
        });

        // Only process 1 item per invocation (FIFO)
        break;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`SUCCESS: Processed ${successCount} items, ${failureCount} failed, ${skippedCount} skipped (scheduled)`);
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Queue processing completed',
        processed: successCount,
        failed: failureCount,
        skipped: skippedCount,
        total: successCount + failureCount + skippedCount,
        results: results,
      }),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('ERROR:', error.message);
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

/**
 * Checks if current time is within operational hours
 */
async function checkOperationalHours() {
  try {
    // Get current time
    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    console.log(`  Current day: ${dayOfWeek}, time: ${currentTime}`);

    // Get schedule from Firestore
    const scheduleDoc = await db.collection('schedule').doc('weekly').get();
    if (!scheduleDoc.exists) {
      console.log(`  WARNING: Schedule not found in Firestore, allowing calls`);
      return true; // Allow if schedule not found
    }

    const scheduleData = scheduleDoc.data();
    const daySchedule = scheduleData[dayOfWeek];

    if (!daySchedule) {
      console.log(`  WARNING: No schedule for ${dayOfWeek}, allowing calls`);
      return true;
    }

    if (daySchedule.closed) {
      console.log(`  ${dayOfWeek} is closed (closed: true)`);
      return false;
    }

    const { open, close } = daySchedule;
    if (!open || !close) {
      console.log(`  WARNING: Invalid schedule for ${dayOfWeek}: open=${open}, close=${close}`);
      return true; // Allow if schedule is invalid
    }

    // Check if current time is between open and close
    const withinHours = currentTime >= open && currentTime < close;
    console.log(`  ${dayOfWeek}: ${open} - ${close} | Current: ${currentTime} | Within hours: ${withinHours}`);

    return withinHours;
  } catch (error) {
    console.log(`  ERROR checking operational hours: ${error.message}`);
    return true; // Allow calls if we can't check hours (fail-safe)
  }
}

/**
 * Makes HTTPS POST request to ElevenLabs SIP trunk API
 */
function makeOutboundCall(payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/convai/twilio/outbound-call',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`    ElevenLabs API Status: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`ElevenLabs API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}
