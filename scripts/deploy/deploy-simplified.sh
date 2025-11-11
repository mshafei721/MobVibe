#!/bin/bash

# MobVibe Simplified Deployment Script
# Uses free/low-cost tiers: Fly.io, Supabase Free, GitHub Actions, GlitchTip
# Estimated cost: $30-65/month (vs $150-200/month with original plan)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}MobVibe Simplified Deployment${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for input
prompt_input() {
    local var_name=$1
    local prompt_text=$2
    local default_value=$3

    if [ -n "$default_value" ]; then
        read -p "$(echo -e ${YELLOW}$prompt_text [${default_value}]: ${NC})" input
        eval $var_name=\${input:-$default_value}
    else
        read -p "$(echo -e ${YELLOW}$prompt_text: ${NC})" input
        eval $var_name=\"$input\"
    fi
}

# Step 1: Prerequisites Check
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

if ! command_exists "node"; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18 or later.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed${NC}"

if ! command_exists "flyctl"; then
    echo -e "${YELLOW}⚠️  Fly.io CLI not found.${NC}"
    echo "Installing Fly.io CLI..."
    curl -L https://fly.io/install.sh | sh
    echo "Please restart your terminal and run this script again."
    exit 0
fi
echo -e "${GREEN}✓ Fly.io CLI installed${NC}"

if ! command_exists "eas"; then
    echo -e "${YELLOW}⚠️  EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
fi
echo -e "${GREEN}✓ EAS CLI installed${NC}"

# Step 2: Fly.io Setup
echo -e "\n${BLUE}Step 2: Fly.io Setup${NC}"
echo "Fly.io will host both your backend worker AND code sandboxes (replaces E2B)"
echo "Cost: ~\$10-15/month for hobby tier"

if ! flyctl auth whoami >/dev/null 2>&1; then
    echo -e "${YELLOW}Not logged into Fly.io. Logging in...${NC}"
    flyctl auth login
fi
echo -e "${GREEN}✓ Logged into Fly.io${NC}"

# Step 3: Collect Configuration
echo -e "\n${BLUE}Step 3: Configuration${NC}"

# Supabase
echo -e "\n${YELLOW}Supabase Configuration (Free tier: 500MB DB, 1GB storage)${NC}"
prompt_input SUPABASE_URL "Supabase URL"
prompt_input SUPABASE_SERVICE_ROLE_KEY "Supabase Service Role Key"
prompt_input SUPABASE_ANON_KEY "Supabase Anon Key"

# Anthropic
echo -e "\n${YELLOW}Anthropic API (Pay-as-you-go, ~\$20-50/month)${NC}"
prompt_input ANTHROPIC_API_KEY "Anthropic API Key"

# Fly.io
echo -e "\n${YELLOW}Fly.io Configuration${NC}"
FLY_API_TOKEN=$(flyctl auth token)
prompt_input FLY_APP_NAME "Fly.io App Name" "mobvibe-api"
prompt_input FLY_REGION "Fly.io Region" "sjc"

# Monitoring
echo -e "\n${YELLOW}Monitoring (Optional - use GlitchTip free tier or Sentry)${NC}"
prompt_input SENTRY_DSN "Sentry/GlitchTip DSN (press Enter to skip)"

# API URL
echo -e "\n${YELLOW}API Configuration${NC}"
API_URL="https://${FLY_APP_NAME}.fly.dev"
echo "API URL will be: $API_URL"

# Step 4: Create Fly.io App
echo -e "\n${BLUE}Step 4: Creating Fly.io app...${NC}"

cd backend/worker

if ! flyctl apps list | grep -q "$FLY_APP_NAME"; then
    flyctl apps create "$FLY_APP_NAME" --org personal
    echo -e "${GREEN}✓ Fly.io app created${NC}"
else
    echo -e "${YELLOW}⚠️  App already exists, skipping creation${NC}"
fi

# Step 5: Set Fly.io Secrets
echo -e "\n${BLUE}Step 5: Setting Fly.io secrets...${NC}"

flyctl secrets set \
    SUPABASE_URL="$SUPABASE_URL" \
    SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
    FLY_API_TOKEN="$FLY_API_TOKEN" \
    FLY_REGION="$FLY_REGION" \
    --app "$FLY_APP_NAME"

if [ -n "$SENTRY_DSN" ]; then
    flyctl secrets set SENTRY_DSN="$SENTRY_DSN" --app "$FLY_APP_NAME"
fi

echo -e "${GREEN}✓ Secrets configured${NC}"

# Step 6: Deploy Backend
echo -e "\n${BLUE}Step 6: Deploying backend to Fly.io...${NC}"

flyctl deploy --remote-only

echo -e "${GREEN}✓ Backend deployed${NC}"

# Step 7: Health Check
echo -e "\n${BLUE}Step 7: Running health check...${NC}"
sleep 10

if curl -f "$API_URL/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy!${NC}"
else
    echo -e "${RED}❌ Health check failed. Check logs with: flyctl logs --app $FLY_APP_NAME${NC}"
    exit 1
fi

cd ../..

# Step 8: Configure Mobile Environment
echo -e "\n${BLUE}Step 8: Configuring mobile environment...${NC}"

cat > .env << EOF
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# API URL
EXPO_PUBLIC_API_URL=$API_URL

# Monitoring
EXPO_PUBLIC_SENTRY_DSN=$SENTRY_DSN

# Environment
EXPO_PUBLIC_ENVIRONMENT=production
EOF

echo -e "${GREEN}✓ Mobile environment configured (.env created)${NC}"

# Step 9: Setup GitHub Secrets
echo -e "\n${BLUE}Step 9: GitHub Secrets Setup${NC}"
echo "To enable automated builds, add these secrets to your GitHub repository:"
echo "Go to: Settings > Secrets and variables > Actions > New repository secret"
echo ""
echo -e "${YELLOW}Required secrets:${NC}"
echo "  EXPO_TOKEN (from: eas whoami)"
echo "  EXPO_PUBLIC_SUPABASE_URL = $SUPABASE_URL"
echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY = $SUPABASE_ANON_KEY"
echo "  EXPO_PUBLIC_API_URL = $API_URL"
echo "  EXPO_PUBLIC_SENTRY_DSN = $SENTRY_DSN"
echo "  FLY_API_TOKEN = $FLY_API_TOKEN"
echo ""
read -p "Press Enter after you've added the GitHub secrets..."

# Step 10: Summary
echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}============================================${NC}\n"

echo -e "${GREEN}Backend:${NC}"
echo "  URL: $API_URL"
echo "  Health: $API_URL/health"
echo "  Logs: flyctl logs --app $FLY_APP_NAME"
echo ""

echo -e "${GREEN}Mobile Apps:${NC}"
echo "  To build: Push to main branch (GitHub Actions will build automatically)"
echo "  Manual build: eas build --platform ios/android --profile production"
echo ""

echo -e "${GREEN}Cost Estimate:${NC}"
echo "  Fly.io:     ~\$10-15/month (backend + sandboxes)"
echo "  Anthropic:  ~\$20-50/month (usage-based)"
echo "  Supabase:   \$0 (free tier)"
echo "  GitHub:     \$0 (free for public repos)"
echo "  GlitchTip:  \$0 (free tier, 1k errors/month)"
echo "  ─────────────────────────────"
echo "  Total:      ~\$30-65/month"
echo ""
echo "  vs Original Plan: \$150-200/month"
echo "  Savings: ~70% (\$85-155/month saved)"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test the API: curl $API_URL/health"
echo "  2. Monitor logs: flyctl logs --app $FLY_APP_NAME"
echo "  3. Build mobile apps: git push origin main (triggers CI/CD)"
echo "  4. Submit to stores: After build, use 'eas submit'"
echo "  5. Monitor free tier limits:"
echo "     - Supabase: Check database size (500MB limit)"
echo "     - GlitchTip: Check error count (1k/month limit)"
echo ""

echo -e "${GREEN}Useful Commands:${NC}"
echo "  flyctl logs --app $FLY_APP_NAME     # View backend logs"
echo "  flyctl ssh console --app $FLY_APP_NAME  # SSH into container"
echo "  flyctl status --app $FLY_APP_NAME   # Check app status"
echo "  flyctl scale show --app $FLY_APP_NAME   # Check scaling"
echo ""

echo -e "${BLUE}Deployment script completed successfully!${NC}\n"
