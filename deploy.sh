#!/bin/bash
# CrewBooks Deployment Script
# Usage: ./deploy.sh [dev|staging|prod]

set -e

ENV=${1:-dev}
echo "🏗️  Deploying CrewBooks to: $ENV"
echo "================================="

# ---- Backend ----
echo ""
echo "📦 Deploying Backend (AWS SAM)..."
cd backend

# Install dependencies
npm install

# Build SAM application
sam build

# Deploy
if [ "$ENV" = "prod" ]; then
  sam deploy --config-env prod
else
  sam deploy --config-env default
fi

# Get outputs
echo ""
echo "📋 Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "crewbooks-$ENV" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "crewbooks-$ENV" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
  --output text)
CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name "crewbooks-$ENV" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
  --output text)

echo "  API URL:        $API_URL"
echo "  User Pool ID:   $USER_POOL_ID"
echo "  Client ID:      $CLIENT_ID"

# ---- Frontend ----
cd ../frontend

# Write .env.local
echo ""
echo "📝 Writing frontend .env.local..."
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID
NEXT_PUBLIC_REGION=us-east-1
EOF

echo "  .env.local written!"

# Install and build frontend
echo ""
echo "🔨 Building Frontend..."
npm install
npm run build

echo ""
echo "✅ CrewBooks deployed successfully!"
echo "================================="
echo "  Backend:  $API_URL"
echo "  Frontend: Run 'cd frontend && npm start' or deploy to Vercel/Amplify"
echo ""
echo "  To run locally: cd frontend && npm run dev"
echo ""
