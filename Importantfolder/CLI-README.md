# ElevenLabs CLI Helper Scripts

Simple bash scripts to interact with the ElevenLabs Conversational AI API.

## Prerequisites

- `curl` installed
- `python3` installed  
- ElevenLabs API key (set in scripts or as environment variable)

## Available Scripts

### 1. List All Agents
```bash
./list-agents.sh
```

Lists all your ElevenLabs conversational AI agents with their IDs.

**Example output:**
```
Found 3 agent(s):

1. Name: Student Intake
   ID: agent_xxxxxxxxxxxx

2. Name: SALLY  
   ID: agent_5101kh4k6hxvezmsa2tbwp0y6mvs

3. Name: Test Agent
   ID: agent_yyyyyyyyyyyy
```

### 2. Get Agent Details
```bash
./get-agent.sh <agent_id>
```

Gets complete configuration for a specific agent.

**Example:**
```bash
./get-agent.sh agent_5101kh4k6hxvezmsa2tbwp0y6mvs
```

## Current Agents Found

Based on your ElevenLabs account:

| Agent Name | Agent ID | Purpose |
|------------|----------|---------|
| **SALLY** | `agent_5101kh4k6hxvezmsa2tbwp0y6mvs` | Currently configured for student intake |
| **quetzal** | `agent_1601kh502e9wfphv4q7chzct567x` | Unknown purpose |
| **Agents v3 Demo** | `agent_0501khc5psnrfnrtbc6900r0kmaj` | Demo/test agent |

## Recommended Setup

For your two-agent system, you need:

### Agent 1: Student Intake (Inbound)
- **Purpose**: Receives calls from prospective students
- **Webhooks**:
  - Custom tool: `add_lead` → `https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/add-lead`
  - End of conversation → `https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/transcript`
- **Tools Required**:
  ```json
  {
    "name": "add_lead",
    "url": "https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/add-lead",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer 123456789"
    }
  }
  ```

### Agent 2: Sally - Academy Caller (Outbound)
- **Purpose**: Calls academy to report new leads
- **Phone to call**: `+13059293241`
- **Webhooks**:
  - End of conversation → `https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/transcript`
  - *(Optional)* End of conversation → `https://2cgrii72ke.execute-api.us-east-1.amazonaws.com/mark-processed`
- **First Message**: "Hello, this is Sally calling from Gracie Barra. I have [X] new student leads to share with you..."

## Configure Lambda Environment Variables

Once you have your agent IDs, set them in AWS Lambda Console:

### For `initiateOutboundCallHandler`:
```bash
ELEVENLABS_API_KEY=sk_908ed7e1b24e4327f378d08426b9751127808b99a4e641a7
SALLY_AGENT_ID=<your_outbound_agent_id>
ACADEMY_PHONE=+13059293241
```

### For `transcriptWebhookHandler`:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY=<your_firebase_json>
FIREBASE_PROJECT_ID=admin-audit-3f2cd
TRIGGER_OUTBOUND=false  # Set to "true" when ready
OUTBOUND_LAMBDA_NAME=initiateOutboundCallHandler
```

## API Key

Current API key in scripts: `sk_908ed7e1b24e4327f378d08426b9751127808b99a4e641a7`

To use a different key, set environment variable:
```bash
export ELEVENLABS_API_KEY="your_key_here"
./list-agents.sh
```

## Troubleshooting

**"Error: Failed to connect to ElevenLabs API"**
- Check your internet connection
- Verify the API key is valid

**"No agents found"**
- Create agents in the ElevenLabs dashboard first
- Go to: https://elevenlabs.io/app/conversational-ai

**"Unexpected response format"**
- The API may have changed
- Check the raw response output
- Verify your API key has correct permissions
