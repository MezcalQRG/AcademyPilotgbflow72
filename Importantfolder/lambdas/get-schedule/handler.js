const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
const projectId = process.env.FIREBASE_PROJECT_ID || 'elevenlabs-rag';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: projectId,
  });
}

const db = admin.firestore();

// Days of week for reference
const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('SCHEDULE WEBHOOK - RETRIEVING WEEKLY HOURS');
  console.log('='.repeat(80));

  try {
    // Step 1: Validate authorization
    console.log('Step 1: Checking authorization header...');
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const expectedToken = process.env.AUTH_TOKEN || '123456789';
    
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token || token !== expectedToken) {
      console.log('Step 1.1: Authorization FAILED - invalid or missing token');
      console.log('Step 1.2: Received token:', token);
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing authorization token' }),
      };
    }
    console.log('Step 1.3: Authorization successful!');

    // Step 2: Parse request body (if provided)
    console.log('Step 2: Parsing request body...');
    let requestedDay = null;
    if (event.body) {
      try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        requestedDay = body.day ? body.day.toLowerCase() : null;
        console.log('Step 2.1: Requested day:', requestedDay);
      } catch (e) {
        console.log('Step 2.2: Could not parse body (optional):', e.message);
      }
    }

    // Step 3: Get schedule from Firestore
    console.log('Step 3: Fetching schedule from Firestore...');
    const scheduleRef = db.collection('schedule').doc('weekly');
    const scheduleSnap = await scheduleRef.get();

    let scheduleData = null;
    if (scheduleSnap.exists) {
      scheduleData = scheduleSnap.data();
      console.log('Step 3.1: Schedule found in Firestore');
      console.log('Step 3.2: Schedule data:', JSON.stringify(scheduleData, null, 2));
    } else {
      console.log('Step 3.1: No schedule found in Firestore - using defaults');
      scheduleData = getDefaultSchedule();
      console.log('Step 3.2: Using default schedule');
    }

    // Step 4: Format response
    console.log('Step 4: Formatting response...');
    const response = formatScheduleResponse(scheduleData, requestedDay);
    console.log('Step 4.1: Formatted response:', JSON.stringify(response, null, 2));

    console.log('='.repeat(80));
    console.log('SUCCESS: Schedule retrieved and formatted');
    console.log('='.repeat(80));

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.log('='.repeat(80));
    console.log('ERROR:', error.message);
    console.log('Stack:', error.stack);
    console.log('='.repeat(80));

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
    };
  }
};

/**
 * Format schedule data for AI consumption
 */
function formatScheduleResponse(scheduleData, requestedDay) {
  const normalized = normalizeStoredSchedule(scheduleData);
  const today = new Date();
  const todayDay = DAYS_OF_WEEK[today.getDay()];

  if (requestedDay && DAYS_OF_WEEK.includes(requestedDay)) {
    // Return single day
    const dayData = normalized.hours[requestedDay] || {};
    const dayClasses = normalized.classes[requestedDay] || [];
    return {
      day: requestedDay,
      isOpen: !dayData.closed,
      hours: dayData.closed ? 'CLOSED' : `${dayData.open} - ${dayData.close}`,
      openTime: dayData.open || null,
      closeTime: dayData.close || null,
      classes: dayClasses,
      fullSchedule: formatFullWeek(normalized.hours),
      timezone: normalized.timezone,
    };
  }

  // Return full week with today highlighted
  return {
    today: todayDay,
    weekSchedule: formatFullWeek(normalized.hours),
    classesByDay: normalized.classes,
    summary: generateScheduleSummary(normalized.hours, normalized.classes),
    timezone: normalized.timezone,
  };
}

/**
 * Format full week schedule
 */
function formatFullWeek(scheduleData) {
  const formatted = {};
  DAYS_OF_WEEK.forEach(day => {
    const dayData = scheduleData[day] || {};
    formatted[day] = {
      open: dayData.closed ? null : dayData.open,
      close: dayData.closed ? null : dayData.close,
      status: dayData.closed ? 'CLOSED' : 'OPEN',
      displayText: dayData.closed ? 'CLOSED' : `${dayData.open} - ${dayData.close}`,
    };
  });
  return formatted;
}

/**
 * Generate human-readable schedule summary
 */
function generateScheduleSummary(scheduleData, classesByDay) {
  const lines = [];
  lines.push('📅 Weekly Schedule:');
  lines.push('');

  DAYS_OF_WEEK.forEach(day => {
    const dayData = scheduleData[day] || {};
    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
    const status = dayData.closed ? '❌ CLOSED' : `✅ ${dayData.open} - ${dayData.close}`;
    lines.push(`${dayName}: ${status}`);

    const dayClasses = classesByDay?.[day] || [];
    dayClasses.forEach((block) => {
      lines.push(`  - ${block.name}: ${block.start} - ${block.end}`);
    });
  });

  return lines.join('\n');
}

/**
 * Default schedule (Monday-Friday 9AM-6PM, Saturday 10AM-3PM, Sunday closed)
 */
function getDefaultSchedule() {
  return {
    timezone: 'local',
    hours: {
      sunday: { open: null, close: null, closed: true },
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '15:00', closed: false },
    },
    classes: {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    },
  };
}

function normalizeStoredSchedule(scheduleData) {
  if (scheduleData?.hours && scheduleData?.classes) {
    return scheduleData;
  }

  const legacy = scheduleData || {};
  const normalized = {
    timezone: legacy.timezone || 'local',
    hours: {},
    classes: {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    },
  };

  DAYS_OF_WEEK.forEach((day) => {
    const dayData = legacy[day] || {};
    normalized.hours[day] = {
      open: dayData.open || null,
      close: dayData.close || null,
      closed: Boolean(dayData.closed),
    };
  });

  return normalized;
}
