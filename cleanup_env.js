const fs = require('fs');
const path = require('path');

// Read the new service account key, extracting it properly even if there's invalid JSON formatting around it
const downloadFile = '/Users/aztecgod/Downloads/studio-5472086834-71ab7-firebase-adminsdk-fbsvc-ec9846d81c.json';
const jsonContent = fs.readFileSync(downloadFile, 'utf8');
const lines = jsonContent.trim().split('\n');
const lastLine = lines[lines.length - 1]; 
const newKeyFile = JSON.parse(lastLine);

const newPrivateKey = newKeyFile.private_key;
const newServiceAccountStr = JSON.stringify(newKeyFile);

function cleanEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const envLines = content.split('\n');
  const envMap = new Map();
  const keysOrder = [];
  
  let currentKey = null;
  let currentVal = [];
  let inMultiline = false;
  
  for (let i = 0; i < envLines.length; i++) {
    const line = envLines[i];
    
    if (!inMultiline) {
       if (!line.trim() || line.startsWith('#')) {
         continue; // Drop comments and blanks to clean up completely
       }
       const match = line.match(/^([^=]+)=(.*)$/);
       if (match) {
         currentKey = match[1].trim();
         let val = match[2];
         if (val.startsWith('"') && !val.endsWith('"') && val !== '"') {
            inMultiline = true;
            currentVal = [val];
         } else if (val === '"') {
            // Edge case where value starts on next line
            inMultiline = true;
            currentVal = ['"'];
         } else {
            envMap.set(currentKey, val);
            if (!keysOrder.includes(currentKey)) keysOrder.push(currentKey);
         }
       }
    } else {
       currentVal.push(line);
       if (line.endsWith('"')) {
          inMultiline = false;
          envMap.set(currentKey, currentVal.join('\n'));
          if (!keysOrder.includes(currentKey)) keysOrder.push(currentKey);
       }
    }
  }

  // Inject new key
  envMap.set('FIREBASE_PRIVATE_KEY', `"${newPrivateKey}"`);
  envMap.set('FIREBASE_SERVICE_ACCOUNT_KEY', `'${newServiceAccountStr}'`);

  if (!keysOrder.includes('FIREBASE_PRIVATE_KEY')) keysOrder.push('FIREBASE_PRIVATE_KEY');
  if (!keysOrder.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) keysOrder.push('FIREBASE_SERVICE_ACCOUNT_KEY');

  // reconstruct
  let newContent = '';
  for (const k of keysOrder) {
    newContent += `${k}=${envMap.get(k)}\n`;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Cleaned and updated ${filePath}`);
}

cleanEnvFile(path.join(__dirname, '.env'));
cleanEnvFile(path.join(__dirname, '.env.local'));
