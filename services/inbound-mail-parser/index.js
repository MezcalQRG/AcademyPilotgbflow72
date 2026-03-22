const AWS = require('aws-sdk');
const simpleParser = require('mailparser').simpleParser;
const { getFirestore } = require('./firebase-admin');

const s3 = new AWS.S3();
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'graciebarra.ai';

/**
 * Inbound Mail Parser Service (Multi-Tenant)
 * 
 * Triggered automatically by AWS S3 when SES receives an email and drops the raw .eml file.
 * 1. Downloads the raw email file from S3.
 * 2. Parses the email to extract text, sender, and recipient.
 * 3. Extracts the tenantSlug from the recipient address (e.g., westcovina@graciebarra.ai -> westcovina).
 * 4. Finds the corresponding lead in Firestore by their email.
 * 5. Saves the email content as a new document in the lead's 'messages' subcollection.
 */
exports.handler = async (event) => {
  console.log('--- INBOUND MAIL PARSER TRIGGERED ---');

  try {
    // 1. Extract bucket and object key from the S3 Event
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing incoming email from Bucket: ${bucket}, Key: ${key}`);

    // 2. Download the raw email object from S3
    const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    
    // 3. Parse the raw email data
    const parsedEmail = await simpleParser(s3Object.Body);
    
    const senderEmail = parsedEmail.from.value[0].address.toLowerCase();
    const recipientEmail = parsedEmail.to.value[0].address.toLowerCase();
    const subject = parsedEmail.subject || 'No Subject';
    const textContent = parsedEmail.text || 'No text content';
    
    console.log(`Received email from: ${senderEmail}, to: ${recipientEmail}`);

    // 4. Extract the Tenant Slug
    // We expect emails to be sent to {tenantSlug}@{ROOT_DOMAIN}
    const emailParts = recipientEmail.split('@');
    if (emailParts.length !== 2 || emailParts[1] !== ROOT_DOMAIN) {
       console.error(`Email recipient ${recipientEmail} does not match expected format {slug}@${ROOT_DOMAIN}. Skipping.`);
       // We don't throw an error because we don't want S3 to constantly retry processing a bad email.
       return { statusCode: 200, body: 'Ignored: Invalid recipient domain' };
    }
    const tenantSlug = emailParts[0];
    console.log(`Extracted Tenant Slug: ${tenantSlug}`);

    // 5. Connect to Firestore
    const db = getFirestore();

    // 6. Find the Lead
    // We need to associate this email with a specific lead in the tenant's CRM.
    // We search the 'leads' collection for a matching email within this specific tenant.
    console.log(`Searching for lead with email ${senderEmail} in tenant ${tenantSlug}...`);
    const leadsSnapshot = await db.collection('leads')
        .where('tenantSlug', '==', tenantSlug)
        .where('email', '==', senderEmail) // Note: your current add-lead only saves phone. You MUST start saving email.
        .limit(1)
        .get();

    let leadRef;
    
    if (leadsSnapshot.empty) {
        // If the lead doesn't exist, we should probably create one, 
        // or route it to an "Unassigned Inbox" for the academy owner to review.
        // For this robust implementation, we will create a new "Unknown Lead" record.
        console.log(`Lead not found. Creating a new lead record for ${senderEmail}...`);
        
        const newLead = {
            tenantSlug: tenantSlug,
            name: parsedEmail.from.value[0].name || senderEmail.split('@')[0], // Try to get name from email headers
            email: senderEmail,
            phone: 'Unknown (Email Contact)', // We don't have their phone yet
            source: 'inbound_email',
            processed: false,
            createdAt: new Date(),
        };
        
        leadRef = await db.collection('leads').add(newLead);
        console.log(`Created new lead with ID: ${leadRef.id}`);
    } else {
        leadRef = leadsSnapshot.docs[0].ref;
        console.log(`Found existing lead ID: ${leadRef.id}`);
    }

    // 7. Save the Email Content
    // We store the email as a "message" subcollection under the specific lead.
    // This allows the dashboard to show a chronological thread of all communication.
    console.log('Saving email content to Firestore...');
    const messageData = {
        direction: 'inbound', // Indicates the student sent this to the academy
        senderEmail: senderEmail,
        recipientEmail: recipientEmail,
        subject: subject,
        bodyText: textContent,
        // We could also store parsedEmail.html if we want to render rich emails in the dashboard
        receivedAt: new Date(parsedEmail.date || new Date()), // Use the email header date if available
        isRead: false // Flag for the dashboard UI
    };

    await leadRef.collection('messages').add(messageData);

    console.log(`Successfully stored incoming email for tenant ${tenantSlug}.`);
    
    // Optional (but recommended): Send a notification to the academy owner
    // This could involve invoking another Lambda or writing to a 'notifications' collection in Firestore.

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Inbound email parsed and stored.' })
    };

  } catch (error) {
    console.error('Inbound Mail Parser Error:', error);
    // Return 200 so S3 doesn't continually retry a structurally broken email.
    // We log the error in CloudWatch for debugging.
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, error: 'Processing failed, see logs.', details: error.message })
    };
  }
};