# Add Lead Service

This is a specialized backend service responsible for a single task: adding a new lead to the Firestore database.

## Mission Objective

To receive lead information, validate it, and persist it in the `leads` collection in Firestore. This function is designed to be invoked by the central `UniversalTacticalOrchestrator`.

## Invocation

This function is not intended to be called directly from the outside world. It is invoked by the `Orchestrator` Lambda function.

## Request Payload

The `Orchestrator` passes a payload to this function with the following structure:

```json
{
  "name": "John Doe",
  "phone": "+15551234567",
  "clase": "Advanced Gi",
  "visit_date": "2024-07-20",
  "note": "Interested in a trial class.",
  "uniform": true
}
```

## Environment Variables

- `FIREBASE_SERVICE_ACCOUNT`: A JSON string containing the Firebase service account credentials. This is securely retrieved from AWS Systems Manager (SSM) Parameter Store.

## Deployment

This service is defined using the AWS Serverless Application Model (SAM). To deploy, navigate to the `services/add-lead` directory and run:

```bash
sam build
sam deploy --guided
```
