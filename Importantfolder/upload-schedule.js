#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load Firebase credentials
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('❌ ERROR: GOOGLE_APPLICATION_CREDENTIALS not set');
  console.error('Set path to your Firebase service account key file');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// Default schedule
const defaultSchedule = {
  sunday: { open: null, close: null, closed: true },
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '15:00', closed: false },
};

async function uploadSchedule() {
  try {
    console.log('📅 Uploading default schedule to Firestore...');
    console.log('');

    const scheduleRef = db.collection('schedule').doc('weekly');
    await scheduleRef.set(defaultSchedule, { merge: true });

    console.log('✅ SUCCESS! Default schedule uploaded to Firestore');
    console.log('');
    console.log('📋 Schedule Details:');
    Object.entries(defaultSchedule).forEach(([day, hours]) => {
      const status = hours.closed ? '❌ CLOSED' : `✅ ${hours.open} - ${hours.close}`;
      console.log(`  ${day.padEnd(10)}: ${status}`);
    });

    // Verify upload
    const verifySnap = await scheduleRef.get();
    if (verifySnap.exists) {
      console.log('');
      console.log('✅ Verification: Schedule successfully stored in Firestore');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

uploadSchedule();
