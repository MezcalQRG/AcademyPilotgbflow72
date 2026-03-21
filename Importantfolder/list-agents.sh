#!/bin/bash

# Simple script to list your ElevenLabs conversational AI agents
# Usage: ./list-agents.sh

API_KEY="${ELEVENLABS_API_KEY:-sk_908ed7e1b24e4327f378d08426b9751127808b99a4e641a7}"

echo "=========================================="
echo "ElevenLabs Conversational AI Agents"
echo "=========================================="
echo ""

# List all agents
response=$(curl -s -X GET "https://api.elevenlabs.io/v1/convai/agents" \
  -H "xi-api-key: ${API_KEY}" \
  -H "Content-Type: application/json")

# Check if curl succeeded
if [ $? -ne 0 ]; then
  echo "Error: Failed to connect to ElevenLabs API"
  exit 1
fi

# Check if response contains error
if echo "$response" | grep -q "error"; then
  echo "Error from API:"
  echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
  exit 1
fi

# Pretty print the response
echo "$response" | python3 -c "
import json
import sys

try:
    data = json.load(sys.stdin)
    
    if isinstance(data, dict) and 'agents' in data:
        agents = data['agents']
        if len(agents) == 0:
            print('No agents found. Create agents in the ElevenLabs dashboard first.')
            sys.exit(0)
            
        print(f'Found {len(agents)} agent(s):\n')
        for i, agent in enumerate(agents, 1):
            print(f'{i}. Name: {agent.get(\"name\", \"Unknown\")}')
            print(f'   ID: {agent.get(\"agent_id\", \"N/A\")}')
            print(f'   Created: {agent.get(\"created_at\", \"N/A\")}')
            print(f'   Platform: {agent.get(\"platform\", \"N/A\")}')
            print()
    else:
        print('Unexpected response format:')
        print(json.dumps(data, indent=2))
except json.JSONDecodeError:
    print('Error: Invalid JSON response')
    sys.exit(1)
" || {
  # Fallback if Python fails
  echo "Raw response:"
  echo "$response"
}

echo ""
echo "=========================================="
echo "To use these agents in your Lambda:"
echo "1. Copy the Agent ID you want to use"
echo "2. Set it as SALLY_AGENT_ID environment variable"
echo "   in the initiateOutboundCallHandler Lambda"
echo "=========================================="
