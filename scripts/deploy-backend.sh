#!/bin/bash
set -e

# Deploy script for AWS Serverless Application Model (SAM) Microservices
# This script handles the order of operations for deploying dependent services
# Version 2.0: Fixed CloudFormation dependency issues

echo "============================================="
echo "🚀 INITIATING TACTICAL BACKEND DEPLOYMENT"
echo "============================================="

# Ensure AWS_REGION is set (passed down from the GitHub Actions YAML)
if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION is not set. Defaulting to us-east-2"
  export AWS_REGION=us-east-2
fi

echo "Deploying to region: $AWS_REGION"

# 1. Deploy the Onboarding Service (Creates the S3 Bucket first, without Lambda notification initially)
echo "\n--- [1/8] Deploying Onboarding Service (S3 Infrastructure) ---"
cd services/onboarding
npm install
sam build
# First deployment: S3 bucket without the inbound-mail-parser listener yet (use template default)
sam deploy --region $AWS_REGION --no-confirm-changeset --no-fail-on-empty-changeset --stack-name gracie-onboarding-service --resolve-s3 --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

# Capture the exact S3 bucket name created by CloudFormation
S3_BUCKET_NAME=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name gracie-onboarding-service --query "Stacks[0].Outputs[?OutputKey=='IncomingEmailsBucketName'].OutputValue" --output text)
echo "✅ S3 Bucket Provisioned: $S3_BUCKET_NAME"
cd ../..

# 2. Deploy Inbound Mail Parser (Requires the S3 Bucket Name)
echo "\n--- [2/7] Deploying Inbound Mail Parser ---"
cd services/inbound-mail-parser
npm install
sam build
sam deploy --region $AWS_REGION --no-confirm-changeset --no-fail-on-empty-changeset --stack-name gracie-inbound-mail-parser --resolve-s3 --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameter-overrides IncomingEmailsBucketName=$S3_BUCKET_NAME
cd ../..

# Capture the Inbound Mail Parser Lambda ARN and update Onboarding service with it
echo "\n--- [2.5/7] Updating Onboarding Service with Inbound Mail Parser ARN ---"
INBOUND_MAIL_PARSER_ARN=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name gracie-inbound-mail-parser --query "Stacks[0].Outputs[?OutputKey=='InboundMailParserFunctionArn'].OutputValue" --output text)
echo "Inbound Mail Parser ARN: $INBOUND_MAIL_PARSER_ARN"

# Redeploy onboarding with the inbound-mail-parser ARN
cd services/onboarding
sam build
sam deploy --region $AWS_REGION --no-confirm-changeset --no-fail-on-empty-changeset --stack-name gracie-onboarding-service --resolve-s3 --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameter-overrides InboundMailParserFunctionArn=$INBOUND_MAIL_PARSER_ARN
cd ../..

# 3. Deploy Standalone Services
for service in add-lead get-leads mark-processed schedule-lead-callback ses-template-handler; do
  echo "\n--- [3-7/8] Deploying Microservice: $service ---"
  cd services/$service
  npm install
  sam build
  sam deploy --region $AWS_REGION --no-confirm-changeset --no-fail-on-empty-changeset --stack-name gracie-$service --resolve-s3 --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
  cd ../..
done

# 4. Deploy Orchestrator (Requires all other Lambda ARNs)
echo "\n--- [8/8] Deploying Universal Tactical Orchestrator ---"
# We need to fetch the ARNs of the deployed functions to pass as parameters to the Orchestrator
ADD_LEAD_ARN=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name gracie-add-lead --query "Stacks[0].Outputs[?OutputKey=='AddLeadFunctionName'].OutputValue" --output text)
GET_LEADS_ARN=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name gracie-get-leads --query "Stacks[0].Outputs[?OutputKey=='GetLeadsFunctionName'].OutputValue" --output text)
MARK_PROCESSED_ARN=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name gracie-mark-processed --query "Stacks[0].Outputs[?OutputKey=='MarkProcessedFunctionName'].OutputValue" --output text)
SCHEDULE_CALLBACK_ARN=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name gracie-schedule-lead-callback --query "Stacks[0].Outputs[?OutputKey=='ScheduleLeadCallbackFunctionName'].OutputValue" --output text)
SES_HANDLER_NAME=$(aws cloudformation describe-stacks --region $AWS_REGION --stack-name gracie-ses-template-handler --query "Stacks[0].Outputs[?OutputKey=='SesTemplateHandlerFunctionName'].OutputValue" --output text)

cd services/orchestrator
npm install
sam build
sam deploy --region $AWS_REGION --no-confirm-changeset --no-fail-on-empty-changeset --stack-name gracie-orchestrator --resolve-s3 --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
  AddLeadFunctionName=$ADD_LEAD_ARN \
  GetLeadsFunctionName=$GET_LEADS_ARN \
  MarkProcessedFunctionName=$MARK_PROCESSED_ARN \
  ScheduleCallbackFunctionName=$SCHEDULE_CALLBACK_ARN \
  SesHandlerFunctionName=$SES_HANDLER_NAME

echo "============================================="
echo "✅ TACTICAL BACKEND DEPLOYMENT COMPLETE"
echo "============================================="