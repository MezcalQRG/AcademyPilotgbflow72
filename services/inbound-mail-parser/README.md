# Inbound Mail Parser Service

This microservice acts as the engine for your AI-powered CRM Helpdesk. It captures incoming emails sent by students and routes them into the correct academy's database, setting the stage for future LLM analysis.

## Operation

This service is fundamentally different from your API-driven microservices. It is **event-driven**, triggered directly by AWS infrastructure.

1.  **The Trigger:** When a student replies to an academy email (e.g., `westcovina@graciebarra.ai`), AWS SES catches it based on the Receipt Rule we configured during onboarding. SES drops the raw `.eml` file into a specific S3 bucket.
2.  **S3 Event:** Dropping that file into S3 triggers this `inbound-mail-parser-service` Lambda function.
3.  **Downloading & Parsing:** The Lambda uses the AWS SDK to download the raw file from S3. It uses the `mailparser` library to decode the complex `.eml` format into structured data (plain text, HTML, sender, recipient, subject).
4.  **Tenant Extraction:** It looks at the recipient address (`westcovina@graciebarra.ai`) and extracts the `tenantSlug` ("westcovina").
5.  **CRM Routing:** It connects to Firestore and searches the `leads` collection for the sender's email address, ensuring it only looks within the specific `tenantSlug`.
    *   **Existing Lead:** If the email matches an existing lead, it proceeds to step 6.
    *   **New Lead:** If this is a cold email from an unknown person, it automatically creates a new lead profile for that tenant.
6.  **Conversation Storage:** Finally, it saves the parsed email content (subject, body text, timestamp, direction) into a `messages` subcollection underneath that specific lead.

## The AI Vision

By storing communication this way, your frontend dashboard can display a threaded conversation history for every lead. When you integrate your LLM, you can feed it this entire `messages` subcollection to automatically summarize the student's requests or draft personalized replies for the academy owner.

## Environment Variables

-   `FIREBASE_SERVICE_ACCOUNT`: Service account JSON for Firestore access.
-   `ROOT_DOMAIN`: The base domain used for emails (e.g., `graciebarra.ai`).

## Deployment

This service is defined using AWS SAM.

```bash
npm install
sam build
sam deploy --guided
```