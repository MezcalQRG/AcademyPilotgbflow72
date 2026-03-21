# Universal Tactical Orchestrator

This is the central command and control hub for the Gracie Barra application's backend services. It is an AWS Lambda function fronted by an API Gateway, acting as a secure "fan-out" proxy.

## Mission Objective

The Orchestrator's primary role is to receive high-level "mission directives" from authorized clients (like the Next.js frontend), authenticate them, and delegate the tasks to specialized, single-purpose Lambda functions.

This pattern provides:
- **Security:** A single, hardened entry point with a consistent authorization protocol.
- **Scalability:** New backend capabilities can be added by deploying a new specialized function and adding a `case` in the orchestrator, without changing existing logic.
- **Maintainability:** Business logic is encapsulated in small, focused functions that are easy to understand, test, and debug.

## Operation Flow

1.  **Request:** A client sends a `POST` request to the `/orchestrate` endpoint.
2.  **Authentication:** The Orchestrator verifies the `Authorization: Bearer <token>` header.
3.  **Routing:** It parses the `action` from the request body (e.g., `"ADD_LEAD"`, `"SEND_EMAIL"`).
4.  **Delegation:** Based on the `action`, it invokes the corresponding specialized Lambda function, passing the `payload` from the request.
5.  **Response:** It captures the response from the specialized function and relays it back to the original client.

## Request Contract

**Endpoint:** `POST /orchestrate`
**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <AUTH_TOKEN>`

**Body:**
```json
{
  "action": "ACTION_NAME",
  "payload": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

## Environment Variables

- `AUTH_TOKEN`: The secret bearer token for authorization.
- `ADD_LEAD_FUNCTION_NAME`: The name of the Lambda function that handles adding new leads.
- `SES_HANDLER_FUNCTION_NAME`: The name of the Lambda function that handles sending emails.

## Deployment

This service is defined using the AWS Serverless Application Model (SAM). To deploy, navigate to the `services/orchestrator` directory and run:

```bash
sam build
sam deploy --guided
```

The output of the deployment will include the `OrchestratorApiUrl`. This URL should be used to configure the `ORCHESTRATOR_URL` environment variable in the Next.js application.

## Proposed Services

Based on a direct analysis of the Next.js Admin Hub dashboard at `src/app/dashboard`, the following specialized, single-purpose Lambda functions are proposed to power its functionality. Each service will be invoked by the Orchestrator.

### Core & Administrative Services
- `get-dashboard-summary`: Fetches the aggregated data for the main dashboard view.
- `get-settings`: Retrieves the current settings for the academy.
- `update-settings`: Updates the academy's settings.
- `get-billing-info`: Fetches billing and subscription information.

### Lead & Conversation Management
- `get-leads`: Fetches a list of leads with filtering and pagination.
- `get-lead-details`: Retrieves detailed information for a single lead.
- `update-lead`: A general-purpose service to update any attribute of a lead.
- `add-note-to-lead`: Adds a note to a lead's record.
- `get-conversations`: Fetches a list of conversations.
- `get-conversation-details`: Retrieves the full transcript of a specific conversation.

### Ads & Marketing
- `get-ad-campaigns`: Fetches a list of all ad campaigns.
- `get-ad-campaign-details`: Retrieves detailed performance metrics for a specific campaign.
- `create-ad-campaign`: Creates a new advertising campaign.
- `update-ad-campaign`: Updates an existing ad campaign.

### Automations & Omnichannel
- `get-automations`: Fetches a list of all configured automations.
- `create-automation`: Creates a new automation rule.
- `update-automation`: Updates an existing automation.
- `get-omnichannel-config`: Retrieves the omnichannel communication configuration.
- `update-omnichannel-config`: Updates the omnichannel configuration.

### Voice & AI
- `get-voice-agents`: Fetches a list of available voice agents.
- `get-voice-agent-details`: Retrieves the configuration for a specific voice agent.
- `update-voice-agent`: Updates a voice agent's configuration.
- `get-ai-tax-advice`: The backend for the AI Tax Assistant.

### Content & Scheduling
- `get-class-schedule`: Fetches the academy's class schedule.
- `update-class-schedule`: Updates the class schedule.
- `get-landing-page-content`: Retrieves the content for the public landing page.
- `update-landing-page-content`: Updates the landing page content.
