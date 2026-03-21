# Automated Lead Processing Pipeline - Deployment Guide

## Overview
This deployment guide will help you set up the automated lead processing pipeline where:
1. Student Intake agent receives calls and saves leads with `processed: false`
2. Transcript webhook is triggered when conversation ends
3. System checks for unprocessed leads from last 24 hours
4. Sally (outbound agent) automatically calls academy with lead details
5. After Sally's call ends, leads are marked as `processed: true`

## Architecture

```
Student Call → Intake Agent → Add Lead (processed: false) → Firestore
                                                                ↓
Transcript Webhook → Query Unprocessed Leads → Trigger Outbound Call
                                                         ↓
                                    Sally Agent → Academy Phone
                                                         ↓
                          Transcript Webhook (Sally's call) → Mark Processed
```

## New Lambda Functions Created

1. **Enhanced transcript-webhook** - Now queries Firestore for unprocessed leads and triggers outbound calls
2. **trigger-outbound-call** - Initiates ElevenLabs outbound call with Sally agent
3. **mark-processed** - Marks leads as processed after academy call completes

## Prerequisites

### 1. Firebase Service Account Key
You should already have this from previous deployments. If not:
- Go to Firebase Console → Project Settings → Service Accounts
- Generate new private key
- Copy the entire JSON content

### 2. ElevenLabs Agent IDs
You already have agents in your account. Run `./list-agents.sh` to see them all.

Current agents:
- **SALLY**: `agent_5101kh4k6hxvezmsa2tbwp0y6mvs`
- **quetzal**: `agent_1601kh502e9wfphv4q7chzct567x`

Decide which agent should be:
- **Student Intake Agent** (inbound): Receives calls from students
- **Academy Caller Agent** (outbound): Calls academy with leads

For details on an agent: `./get-agent.sh <agent_id>`

### 3. Academy Phone Number
- The phone number Sally should call (format: +1234567890)

## Deployment Steps

### Step 1: Build and Deploy
```bash
# Navigate to project root
cd /workspaces/Ellevenlabs-AWSLambdas-firebaseRAG-hosting

# Build all Lambda functions
sam build

# Deploy (will prompt for environment variables)
sam deploy --guided
```

### Step 2: Set Environment Variables in AWS Lambda Console

After deployment, go to AWS Lambda Console and set these environment variables:

#### For `transcriptWebhookHandler`:
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON (entire JSON as string)
- `FIREBASE_PROJECT_ID`: `admin-audit-3f2cd`
- `TRIGGER_OUTBOUND`: Set to `"false"` initially (test first), then `"true"` to enable automation
- `OUTBOUND_LAMBDA_NAME`: `initiateOutboundCallHandler`

#### For `initiateOutboundCallHandler`:
- `ELEVENLABS_API_KEY`: `sk_908ed7e1b24e4327f378d08426b9751127808b99a4e641a7`
- `SALLY_AGENT_ID`: `agent_5101kh4k6hxvezmsa2tbwp0y6mvs` (or your chosen outbound agent ID)
- `ACADEMY_PHONE`: `+13059293241`

#### For `markProcessedHandler`:
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON
- `FIREBASE_PROJECT_ID`: `admin-audit-3f2cd`
- `AUTH_TOKEN`: `123456789`

#### For `addLeadHandler` (updated):
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Your Firebase service account JSON (if not already set)
- `FIREBASE_PROJECT_ID`: `admin-audit-3f2cd`
- `AUTH_TOKEN`: `123456789`

### Step 3: Configure ElevenLabs Agent Webhooks

#### Student Intake Agent Webhooks:
1. **End of Conversation**: `https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/transcript`
   - This triggers the automated pipeline

#### Sally Agent (Outbound) Webhooks:
1. **End of Conversation**: `https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/transcript`
   - This logs the academy call transcript
2. **After Call Ends**: Configure a custom webhook URL (optional):
   - `POST https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/mark-processed`
   - Headers: `Authorization: Bearer 123456789`
   - Body: 
   ```json
   {
     "lead_ids": ["lead_id_1", "lead_id_2"],
     "metadata": {
       "call_duration": 120,
       "outcome": "scheduled"
     }
   }
   ```

## Testing the Pipeline

### Test 1: Add a Lead (Simulated Student Call)
```bash
curl -X POST https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/add-lead \
  -H "Authorization: Bearer 123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "phone": "+15555551234",
    "clase": "Adult BJJ",
    "visit_date": "2024-01-15",
    "note": "Interested in morning classes"
  }'
```

### Test 2: Trigger Transcript Processing (Simulated Conversation End)
With `TRIGGER_OUTBOUND=false`:
```bash
curl -X POST https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Student expressed interest in Adult BJJ classes...",
    "conversation_id": "test-123"
  }'
```

Check CloudWatch logs for `transcriptWebhookHandler` - should see:
- Query for unprocessed leads
- Found X unprocessed leads
- SKIPPED - TRIGGER_OUTBOUND not enabled

### Test 3: Enable Automation
Once tests pass:
1. Go to AWS Lambda Console → `transcriptWebhookHandler`
2. Change `TRIGGER_OUTBOUND` to `"true"`
3. Send another transcript webhook
4. Check CloudWatch logs - should see outbound call Lambda invoked

### Test 4: Verify Lead is Marked as Processed
After Sally's academy call ends:
```bash
curl -X POST https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/mark-processed \
  -H "Authorization: Bearer 123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_ids": ["<lead_id_from_firestore>"],
    "metadata": {
      "call_completed": true
    }
  }'
```

Verify in Firestore:
- Lead document should have `processed: true`
- Should have `processedAt` timestamp
- Should have `processedMetadata` object

## Monitoring

### CloudWatch Logs
Each Lambda outputs detailed step-by-step logs:

**transcriptWebhookHandler**:
- Step 1: Logging transcript
- Step 2: Extracting transcript text
- Step 3: Querying for unprocessed leads
- Step 4: Preparing leads for processing
- Step 5: Triggering outbound call (if enabled)

**initiateOutboundCallHandler**:
- Step 1: Extracting leads
- Step 2: Formatting lead data
- Step 3: Preparing first message
- Step 4: Calling ElevenLabs API

**markProcessedHandler**:
- Step 1: Validating authorization
- Step 2: Parsing request body
- Step 3: Updating Firestore

### Common Issues

**Issue**: Outbound call not triggered
- Check: `TRIGGER_OUTBOUND` is set to `"true"` (must be string)
- Check: Unprocessed leads exist from last 24 hours
- Check: CloudWatch logs for error messages

**Issue**: ElevenLabs API returns 401
- Check: `ELEVENLABS_API_KEY` is correct
- Check: `SALLY_AGENT_ID` is correct

**Issue**: Leads not marked as processed
- Check: `mark-processed` endpoint is configured in Sally's webhook
- Check: Authorization token is correct
- Check: Lead IDs are being passed correctly

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/add-lead` | POST | Save new lead to Firestore | Yes |
| `/transcript` | POST | Process transcript, trigger outbound | No |
| `/mark-processed` | POST | Mark leads as processed | Yes |
| `/schedule` | GET/PUT | Get/update schedule | Yes (PUT only) |
| `/leads` | GET | Retrieve all leads | Yes |
| `/conversation-init` | POST | Log conversation start | No |

## Production Checklist

- [ ] All environment variables set correctly
- [ ] Firebase service account key configured
- [ ] ElevenLabs API key valid
- [ ] Sally agent ID obtained
- [ ] Academy phone number configured in E.164 format
- [ ] Student Intake agent webhook configured (transcript endpoint)
- [ ] Sally agent webhook configured (mark-processed endpoint)
- [ ] Tested with `TRIGGER_OUTBOUND=false` first
- [ ] Verified unprocessed leads query works
- [ ] Verified outbound call triggers correctly
- [ ] Verified leads marked as processed
- [ ] CloudWatch logs monitored for errors
- [ ] Test with real phone call end-to-end

## Next Steps

**1. List Your Agents**:
```bash
./list-agents.sh
```

**2. Get Agent Details**:
```bash
./get-agent.sh agent_5101kh4k6hxvezmsa2tbwp0y6mvs
```

**3. Configure Your Agents in ElevenLabs Dashboard**:
- Set up Student Intake agent with `add_lead` custom tool
- Set up Sally (outbound) agent to call academy
- Configure webhooks on both agents

See [CLI-README.md](CLI-README.md) for detailed agent configuration guide.

2. **Test End-to-End**:
   - Make a real call to Student Intake agent
   - Provide lead information
   - End call
   - Verify transcript triggers automation
   - Verify Sally calls academy
   - Verify lead marked as processed

3. **Monitor and Iterate**:
   - Review transcripts to improve Sally's script
   - Adjust lead processing logic as needed
   - Add more sophisticated LLM validation if desired

## Support

For issues or questions:
- Check CloudWatch logs first
- Verify all environment variables are set
- Test each Lambda independently before testing full pipeline
- Review ElevenLabs dashboard for agent configuration issues
