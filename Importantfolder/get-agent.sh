#!/bin/bash

# Get detailed information about a specific ElevenLabs agent
# Usage: ./get-agent.sh <agent_id>

API_KEY="${ELEVENLABS_API_KEY:-sk_908ed7e1b24e4327f378d08426b9751127808b99a4e641a7}"

if [ -z "$1" ]; then
  echo "Usage: ./get-agent.sh <agent_id>"
  echo ""
  echo "Example: ./get-agent.sh agent_5101kh4k6hxvezmsa2tbwp0y6mvs"
  echo ""
  echo "To list all agents, run: ./list-agents.sh"
  exit 1
fi

AGENT_ID="$1"

echo "=========================================="
echo "Agent Details: $AGENT_ID"
echo "=========================================="
echo ""

# Get agent details
response=$(curl -s -X GET "https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}" \
  -H "xi-api-key: ${API_KEY}" \
  -H "Content-Type: application/json")

# Check if curl succeeded
if [ $? -ne 0 ]; then
  echo "Error: Failed to connect to ElevenLabs API"
  exit 1
fi

# Pretty print the response
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
