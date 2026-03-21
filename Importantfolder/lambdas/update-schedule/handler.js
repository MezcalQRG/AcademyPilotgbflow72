const admin = require('firebase-admin');

const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
const projectId = process.env.FIREBASE_PROJECT_ID || 'elevenlabs-rag';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: projectId,
  });
}

const db = admin.firestore();

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

exports.handler = async function (event) {
  console.log('='.repeat(80));
  console.log('SCHEDULE WEBHOOK - UPDATE WEEKLY HOURS');
  console.log('='.repeat(80));

  try {
    // Step 1: Validate authorization
    console.log('Step 1: Checking authorization header...');
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const expectedToken = process.env.AUTH_TOKEN || '123456789';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || token !== expectedToken) {
      console.log('Step 1.1: Authorization FAILED - invalid or missing token');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing authorization token' }),
      };
    }
    console.log('Step 1.2: Authorization successful');

    // Step 2: Parse and validate request body
    console.log('Step 2: Parsing request body...');
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bad Request', message: 'Request body is required' }),
      };
    }

    let body = null;
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bad Request', message: 'Invalid JSON in request body' }),
      };
    }

    const scheduleInput = body.schedule || body;
    const { normalizedSchedule, errors } = normalizeSchedule(scheduleInput);

    if (errors.length > 0) {
      console.log('Step 2.1: Validation errors:', JSON.stringify(errors));
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bad Request', message: 'Invalid schedule format', details: errors }),
      };
    }

    console.log('Step 2.2: Schedule normalized:', JSON.stringify(normalizedSchedule, null, 2));

    // Step 3: Save to Firestore (replace existing schedule)
    console.log('Step 3: Writing schedule to Firestore...');
    const scheduleRef = db.collection('schedule').doc('weekly');
    await scheduleRef.set(normalizedSchedule, { merge: false });

    console.log('Step 3.1: Schedule updated successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, schedule: normalizedSchedule }),
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

function normalizeSchedule(scheduleInput) {
  const normalized = {
    timezone: scheduleInput?.timezone || 'local',
    hours: {},
    classes: {},
  };
  const errors = [];

  // Parse classes (optional)
  DAYS_OF_WEEK.forEach((day) => {
    const classBlocks = Array.isArray(scheduleInput?.classes?.[day])
      ? scheduleInput.classes[day]
      : [];

    const normalizedBlocks = [];
    classBlocks.forEach((block, index) => {
      const name = String(block?.name || '').trim();
      const start = block?.start;
      const end = block?.end;

      if (!name) {
        errors.push({ day, index, message: 'Class name is required' });
        return;
      }
      if (!isValidTime(start) || !isValidTime(end)) {
        errors.push({ day, index, message: 'Class start/end must be HH:MM (24h)' });
        return;
      }

      normalizedBlocks.push({ name, start, end });
    });

    normalized.classes[day] = normalizedBlocks;
  });

  // Parse hours (optional). If missing, derive from classes.
  DAYS_OF_WEEK.forEach((day) => {
    const dayInput = scheduleInput?.hours?.[day] || scheduleInput?.[day] || {};
    const closed = Boolean(dayInput.closed);

    if (!closed) {
      const open = dayInput.open;
      const close = dayInput.close;
      if (isValidTime(open) && isValidTime(close)) {
        normalized.hours[day] = { open, close, closed: false };
        return;
      }
    }

    const derived = deriveHoursFromClasses(normalized.classes[day]);
    if (derived) {
      normalized.hours[day] = { open: derived.open, close: derived.close, closed: false };
      return;
    }

    if (closed) {
      normalized.hours[day] = { open: null, close: null, closed: true };
      return;
    }

    errors.push({ day, message: 'Provide hours or at least one class block for open days' });
  });

  return { normalizedSchedule: normalized, errors };
}

function deriveHoursFromClasses(classBlocks) {
  if (!classBlocks || classBlocks.length === 0) {
    return null;
  }

  const times = classBlocks
    .flatMap((block) => [block.start, block.end])
    .filter(Boolean)
    .sort();

  return { open: times[0], close: times[times.length - 1] };
}

function isValidTime(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
