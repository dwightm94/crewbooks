#!/bin/bash
# Usage: ./deploy-lambda.sh crew
# Deploys a Lambda from backend/lambdas/<name>/index.js with correct structure

LAMBDA_NAME=$1
FUNCTION_NAME="crewbooks-${LAMBDA_NAME}-dev"
REGION="us-east-1"

if [ -z "$LAMBDA_NAME" ]; then
  echo "Usage: ./deploy-lambda.sh <lambda-name>"
  exit 1
fi

LAMBDA_DIR="lambdas/${LAMBDA_NAME}"
if [ ! -f "${LAMBDA_DIR}/index.js" ]; then
  echo "ERROR: ${LAMBDA_DIR}/index.js not found"
  exit 1
fi

echo "🔍 Installing dependencies for ${LAMBDA_NAME}..."
cd ${LAMBDA_DIR} && npm install && cd ../..

echo "📦 Building zip with correct structure..."
rm -f /tmp/${LAMBDA_NAME}-lambda.zip
zip -r /tmp/${LAMBDA_NAME}-lambda.zip lib/ ${LAMBDA_DIR}/

echo "⏳ Waiting for function to be ready..."
aws lambda wait function-updated --function-name ${FUNCTION_NAME} --region ${REGION}

echo "🚀 Deploying to ${FUNCTION_NAME}..."
aws lambda update-function-code \
  --function-name ${FUNCTION_NAME} \
  --zip-file fileb:///tmp/${LAMBDA_NAME}-lambda.zip \
  --region ${REGION} \
  --query 'FunctionName'

echo "⏳ Waiting for deploy to complete..."
aws lambda wait function-updated --function-name ${FUNCTION_NAME} --region ${REGION}

# Update handler if needed
aws lambda update-function-configuration \
  --function-name ${FUNCTION_NAME} \
  --handler ${LAMBDA_DIR}/index.handler \
  --region ${REGION} \
  --query 'Handler'

aws lambda wait function-updated --function-name ${FUNCTION_NAME} --region ${REGION}

echo "✅ Testing ${FUNCTION_NAME}..."
aws lambda invoke \
  --function-name ${FUNCTION_NAME} \
  --cli-binary-format raw-in-base64-out \
  --payload '{"httpMethod":"GET","path":"/'"${LAMBDA_NAME}"'","requestContext":{"authorizer":{"claims":{"sub":"test"}}}}' \
  --region ${REGION} /tmp/${LAMBDA_NAME}-test.json

echo "📋 Response:"
cat /tmp/${LAMBDA_NAME}-test.json
echo ""
echo "🎉 Deploy complete!"
