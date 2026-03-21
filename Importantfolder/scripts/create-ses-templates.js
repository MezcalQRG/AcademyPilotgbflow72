/**
 * TACTICAL SCRIPT: SES Template Provisioning
 * Run this script to establish the required communication templates in your AWS SES registry.
 * Usage: node create-ses-templates.js
 */

const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-2' });

const templates = [
  {
    TemplateName: 'WelcomeAcademy',
    SubjectPart: 'Welcome to the Gracie Barra {{location}} Academy!',
    HtmlPart: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 4px solid #E61919; padding: 20px;">
        <h1 style="color: #E61919; text-transform: uppercase; font-style: italic;">Mission Initialized</h1>
        <p>Hello <strong>{{name}}</strong>,</p>
        <p>Your academy locaction at <strong>{{location}}</strong> has been successfully integrated into the Gracie Barra AI Pilot System.</p>
        <div style="background: #f4f4f4; padding: 15px; margin: 20px 0; border-left: 4px solid #E61919;">
          <p style="margin: 0; font-size: 14px;"><strong>Deployment Details:</strong></p>
          <ul style="font-size: 13px;">
            <li>Status: Operational</li>
            <li>Sector: {{location}}</li>
            <li>Link: <a href="{{loginUrl}}">{{loginUrl}}</a></li>
          </ul>
        </div>
        <p>Access your command dashboard to begin lead management and ad deployment.</p>
        <a href="{{loginUrl}}" style="display: inline-block; background: #E61919; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase;">Access Dashboard</a>
        <p style="margin-top: 30px; font-size: 10px; color: #999;">GRACIE BARRA AI PILOT // SECURITY PROTOCOL V2.1</p>
      </div>
    `,
    TextPart: "Welcome to {{location}} Academy! Access your dashboard at {{loginUrl}}"
  },
  {
    TemplateName: 'MagicLink',
    SubjectPart: 'Secure Access Link - Gracie Barra AI',
    HtmlPart: `
      <div style="font-family: sans-serif; border: 2px solid #000; padding: 30px; text-align: center;">
        <h2 style="color: #E61919;">SECURE HANDSHAKE REQUIRED</h2>
        <p>Click the button below to authorize your session and enter the dashboard.</p>
        <a href="{{loginUrl}}" style="display: inline-block; background: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold;">AUTHORIZE SESSION</a>
        <p style="font-size: 11px; margin-top: 20px;">If you did not request this link, disregard this transmission.</p>
      </div>
    `,
    TextPart: "Authorize your session: {{loginUrl}}"
  }
];

async function provisionTemplates() {
  console.log('--- COMMENCING TEMPLATE PROVISIONING ---');
  
  for (const template of templates) {
    try {
      console.log(`Checking registry for: ${template.TemplateName}...`);
      await ses.getTemplate({ TemplateName: template.TemplateName }).promise();
      
      console.log(`Found existing template. Initiating update...`);
      await ses.updateTemplate({ Template: template }).promise();
      console.log(`SUCCESS: ${template.TemplateName} updated.`);
    } catch (err) {
      if (err.code === 'TemplateDoesNotExist') {
        console.log(`Template not found. Creating new entry...`);
        await ses.createTemplate({ Template: template }).promise();
        console.log(`SUCCESS: ${template.TemplateName} created.`);
      } else {
        console.error(`FAILURE: Could not provision ${template.TemplateName}`, err.message);
      }
    }
  }
  
  console.log('--- PROVISIONING COMPLETE ---');
}

provisionTemplates();
