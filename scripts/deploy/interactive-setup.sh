#!/bin/bash

# Interactive Credential Gathering Script
# Walks user through credential collection step-by-step

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Progress tracking
TOTAL_STEPS=7
CURRENT_STEP=0

# Credential storage
CREDS_FILE=".env.production.tmp"

print_header() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         MobVibe Interactive Credential Setup              ║${NC}"
    echo -e "${BLUE}║         Estimated time: 30-45 minutes                     ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Step $CURRENT_STEP of $TOTAL_STEPS: $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

prompt_continue() {
    echo ""
    read -p "$(echo -e ${GREEN}Press Enter when ready to continue...${NC})" _
}

save_credential() {
    local key=$1
    local value=$2
    echo "${key}=${value}" >> "$CREDS_FILE"
}

# Initialize
print_header

echo -e "${YELLOW}This script will help you gather all credentials needed to deploy MobVibe.${NC}"
echo ""
echo -e "${YELLOW}You'll need:${NC}"
echo "  • Browser access to various dashboards"
echo "  • Payment methods for some services (free tiers available)"
echo "  • 30-45 minutes of focused time"
echo ""
echo -e "${GREEN}What you'll get:${NC}"
echo "  • A complete .env.production file"
echo "  • Validated credentials ready for deployment"
echo "  • GitHub secrets checklist"
echo ""

# Create temporary credentials file
rm -f "$CREDS_FILE"
touch "$CREDS_FILE"
chmod 600 "$CREDS_FILE"

prompt_continue

# =============================================================================
# Step 1: Supabase
# =============================================================================
print_step "Supabase Credentials (You already have these!)"

echo -e "${YELLOW}You've already set up Supabase during development.${NC}"
echo "Let's retrieve your credentials."
echo ""
echo -e "${BLUE}Instructions:${NC}"
echo "1. Open https://supabase.com/dashboard"
echo "2. Select your MobVibe project"
echo "3. Go to Settings (gear icon) → API"
echo ""

prompt_continue

echo -e "${CYAN}Get Supabase URL:${NC}"
echo "Copy the 'Project URL' field"
echo "Example: https://abcdefghijklmnop.supabase.co"
echo ""
read -p "Paste Supabase URL: " SUPABASE_URL
save_credential "EXPO_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
echo -e "${GREEN}✓ Saved${NC}"

echo ""
echo -e "${CYAN}Get Supabase Anon Key:${NC}"
echo "Copy the 'anon public' key (starts with eyJ)"
echo ""
read -p "Paste Supabase Anon Key: " SUPABASE_ANON_KEY
save_credential "EXPO_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
echo -e "${GREEN}✓ Saved${NC}"

echo ""
echo -e "${CYAN}Get Supabase Service Role Key:${NC}"
echo -e "${RED}⚠️  SENSITIVE - Only for backend, never expose to frontend!${NC}"
echo "Copy the 'service_role' key (starts with eyJ)"
echo ""
read -sp "Paste Supabase Service Role Key (hidden): " SUPABASE_SERVICE_ROLE_KEY
echo ""
save_credential "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
echo -e "${GREEN}✓ Saved${NC}"

echo ""
echo -e "${GREEN}✓ Supabase credentials collected!${NC}"

prompt_continue

# =============================================================================
# Step 2: Anthropic
# =============================================================================
print_step "Anthropic API Key"

echo -e "${YELLOW}Anthropic powers the AI coding assistant.${NC}"
echo "Estimated cost: \$20-50/month (pay-as-you-go)"
echo ""
echo -e "${BLUE}Instructions:${NC}"
echo "1. Open https://console.anthropic.com/"
echo "2. Sign up or log in"
echo "3. Go to Settings → Billing → Add payment method"
echo "4. Set budget limit (recommend \$50/month)"
echo "5. Go to API Keys → Create Key"
echo "6. Name it: 'MobVibe Production'"
echo "7. Copy the key (starts with sk-ant-)"
echo ""

prompt_continue

read -sp "Paste Anthropic API Key (hidden): " ANTHROPIC_API_KEY
echo ""
save_credential "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY"
echo -e "${GREEN}✓ Saved${NC}"

prompt_continue

# =============================================================================
# Step 3: Fly.io
# =============================================================================
print_step "Fly.io Setup"

echo -e "${YELLOW}Fly.io hosts both your backend AND code sandboxes.${NC}"
echo "Estimated cost: \$10-15/month"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${YELLOW}Fly.io CLI not found. Installing...${NC}"
    curl -L https://fly.io/install.sh | sh
    echo ""
    echo -e "${GREEN}✓ Fly.io CLI installed${NC}"
    echo -e "${YELLOW}Please restart your terminal and run this script again.${NC}"
    exit 0
fi

echo -e "${GREEN}✓ Fly.io CLI already installed${NC}"

# Login to Fly.io
if ! flyctl auth whoami &>/dev/null; then
    echo ""
    echo -e "${YELLOW}Logging into Fly.io...${NC}"
    flyctl auth login
fi

echo -e "${GREEN}✓ Logged into Fly.io${NC}"

# Get API token
echo ""
echo -e "${CYAN}Getting Fly.io API token...${NC}"
FLY_API_TOKEN=$(flyctl auth token)
save_credential "FLY_API_TOKEN" "$FLY_API_TOKEN"
echo -e "${GREEN}✓ Saved${NC}"

# App name
echo ""
echo -e "${CYAN}Choose Fly.io app name:${NC}"
read -p "App name [mobvibe-api]: " FLY_APP_NAME
FLY_APP_NAME=${FLY_APP_NAME:-mobvibe-api}
save_credential "FLY_APP_NAME" "$FLY_APP_NAME"
echo -e "${GREEN}✓ Saved${NC}"

# Region
echo ""
echo -e "${CYAN}Choose Fly.io region:${NC}"
echo "Common regions:"
echo "  sjc - San Jose, CA (US West)"
echo "  iad - Ashburn, VA (US East)"
echo "  lhr - London, UK"
echo "  syd - Sydney, Australia"
read -p "Region [sjc]: " FLY_REGION
FLY_REGION=${FLY_REGION:-sjc}
save_credential "FLY_REGION" "$FLY_REGION"
echo -e "${GREEN}✓ Saved${NC}"

# Construct API URL
API_URL="https://${FLY_APP_NAME}.fly.dev"
save_credential "EXPO_PUBLIC_API_URL" "$API_URL"

echo ""
echo -e "${GREEN}✓ Fly.io configured!${NC}"
echo "  API URL will be: $API_URL"

prompt_continue

# =============================================================================
# Step 4: Monitoring (GlitchTip/Sentry)
# =============================================================================
print_step "Error Monitoring Setup"

echo -e "${YELLOW}Choose your monitoring service:${NC}"
echo ""
echo "1. GlitchTip (Recommended)"
echo "   • Free tier: 1,000 errors/month"
echo "   • Sentry-compatible"
echo "   • Open source"
echo ""
echo "2. Sentry"
echo "   • Free tier: 5,000 errors/month"
echo "   • More features"
echo ""
echo "3. Skip (not recommended)"
echo ""
read -p "Choice [1]: " MONITORING_CHOICE
MONITORING_CHOICE=${MONITORING_CHOICE:-1}

if [ "$MONITORING_CHOICE" = "1" ]; then
    echo ""
    echo -e "${BLUE}GlitchTip Setup:${NC}"
    echo "1. Open https://app.glitchtip.com/register"
    echo "2. Sign up and create organization 'MobVibe'"
    echo "3. Create project 'MobVibe Mobile' (React Native)"
    echo "4. Go to Settings → Client Keys (DSN)"
    echo "5. Copy the DSN"
    echo ""
    prompt_continue
    read -p "Paste GlitchTip DSN: " SENTRY_DSN
    save_credential "EXPO_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"
    echo -e "${GREEN}✓ Saved${NC}"

elif [ "$MONITORING_CHOICE" = "2" ]; then
    echo ""
    echo -e "${BLUE}Sentry Setup:${NC}"
    echo "1. Open https://sentry.io/signup/"
    echo "2. Create account and organization"
    echo "3. Create project → Select 'React Native'"
    echo "4. Copy DSN from project settings"
    echo ""
    prompt_continue
    read -p "Paste Sentry DSN: " SENTRY_DSN
    save_credential "EXPO_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"
    echo -e "${GREEN}✓ Saved${NC}"

else
    echo -e "${YELLOW}⚠️  Skipping monitoring setup (not recommended)${NC}"
    save_credential "EXPO_PUBLIC_SENTRY_DSN" ""
fi

prompt_continue

# =============================================================================
# Step 5: Expo/EAS
# =============================================================================
print_step "Expo/EAS Setup"

echo -e "${YELLOW}EAS builds your mobile apps.${NC}"
echo ""

# Check if EAS is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}Installing EAS CLI...${NC}"
    npm install -g eas-cli
    echo -e "${GREEN}✓ EAS CLI installed${NC}"
fi

# Login to EAS
echo ""
echo -e "${CYAN}Logging into Expo...${NC}"
eas login

# Get token
echo ""
echo -e "${CYAN}Getting Expo token...${NC}"
echo "This is needed for GitHub Actions to build automatically."
echo ""
echo "To get your token:"
echo "1. Go to: https://expo.dev/accounts/[your-username]/settings/access-tokens"
echo "2. Click 'Create token'"
echo "3. Name: 'GitHub Actions'"
echo "4. Copy the token"
echo ""
prompt_continue

read -sp "Paste Expo token (hidden): " EXPO_TOKEN
echo ""
save_credential "EXPO_TOKEN" "$EXPO_TOKEN"
echo -e "${GREEN}✓ Saved${NC}"

prompt_continue

# =============================================================================
# Step 6: GitHub Secrets
# =============================================================================
print_step "GitHub Secrets Setup"

echo -e "${YELLOW}GitHub Actions needs these secrets to build and deploy.${NC}"
echo ""
echo "Go to your GitHub repository:"
echo "  Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo -e "${CYAN}Add these 6 secrets:${NC}"
echo ""

# Read credentials from file
source "$CREDS_FILE"

echo "1. EXPO_TOKEN"
echo "   Value: (your Expo token from previous step)"
echo ""
echo "2. EXPO_PUBLIC_SUPABASE_URL"
echo "   Value: $EXPO_PUBLIC_SUPABASE_URL"
echo ""
echo "3. EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo "   Value: $EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "4. EXPO_PUBLIC_API_URL"
echo "   Value: $EXPO_PUBLIC_API_URL"
echo ""
echo "5. EXPO_PUBLIC_SENTRY_DSN"
echo "   Value: $EXPO_PUBLIC_SENTRY_DSN"
echo ""
echo "6. FLY_API_TOKEN"
echo "   Value: (your Fly.io token from previous step)"
echo ""

prompt_continue

# =============================================================================
# Step 7: Summary
# =============================================================================
print_step "Summary & Next Steps"

echo -e "${GREEN}✅ Credential gathering complete!${NC}"
echo ""
echo -e "${CYAN}Credentials saved to:${NC}"
echo "  .env.production.tmp (temporary)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "  1. This file contains SENSITIVE data"
echo "  2. Store in password manager (recommended: Bitwarden, 1Password)"
echo "  3. Delete after deployment"
echo ""

# Create final .env file
cp .env.production.template .env.production
cat "$CREDS_FILE" >> .env.production

echo -e "${GREEN}✓ Created .env.production${NC}"
echo ""

echo -e "${CYAN}Next steps:${NC}"
echo "  1. Review .env.production file"
echo "  2. Add GitHub secrets (see step 6 above)"
echo "  3. Run validation: node scripts/deploy/validate-credentials.js"
echo "  4. Deploy: ./scripts/deploy/deploy-simplified.sh"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Setup complete! Ready to deploy.${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Cleanup reminder
echo -e "${YELLOW}Don't forget to:${NC}"
echo "  • Add secrets to GitHub"
echo "  • Save credentials in password manager"
echo "  • Delete .env.production.tmp after deployment"
echo ""
