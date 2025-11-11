# MobVibe Deployment Credentials Checklist

**Estimated time**: 30-45 minutes
**Cost to setup**: $0 (all accounts have free tiers)

---

## 📋 Checklist Overview

- [ ] 1. Supabase Credentials (5 min) - **Already have**
- [ ] 2. Anthropic API Key (5 min)
- [ ] 3. Fly.io Setup (10 min)
- [ ] 4. GlitchTip/Sentry Setup (10 min)
- [ ] 5. GitHub Configuration (5 min)
- [ ] 6. Expo/EAS Setup (5 min)
- [ ] 7. Verify All Credentials (5 min)

**Optional (for app store submission)**:
- [ ] 8. Apple Developer Account ($99/year)
- [ ] 9. Google Play Developer Account ($25 one-time)

---

## 1️⃣ Supabase Credentials (5 minutes)

### You Already Have These! ✅

Just need to retrieve them from your existing project.

### Step 1: Get Supabase URL
1. Go to https://supabase.com/dashboard
2. Select your **MobVibe** project
3. Click **Settings** (gear icon) in sidebar
4. Click **API** section
5. Copy **Project URL**

```
Example: https://abcdefghijklmnop.supabase.co
```

**Save as**: `SUPABASE_URL`

### Step 2: Get Supabase Anon Key
1. Same **API** section as above
2. Under **Project API keys**
3. Copy **anon / public** key (starts with `eyJ`)

```
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save as**: `SUPABASE_ANON_KEY`

### Step 3: Get Supabase Service Role Key ⚠️ SENSITIVE
1. Same **API** section
2. Under **Project API keys**
3. Copy **service_role** key (starts with `eyJ`)
4. **NEVER commit this to Git!**

```
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save as**: `SUPABASE_SERVICE_ROLE_KEY`

### Verify Supabase Credentials
```bash
# Test connection
curl -X GET "YOUR_SUPABASE_URL/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Should return: {"message":"Welcome to PostgREST"}
```

---

## 2️⃣ Anthropic API Key (5 minutes)

### Step 1: Create Account
1. Go to https://console.anthropic.com/
2. Click **Sign Up** or **Sign In**
3. Complete registration

### Step 2: Add Payment Method
1. Click **Settings** in sidebar
2. Go to **Billing**
3. Add payment method (credit card required)
4. Set budget limit (recommend $50/month to start)

### Step 3: Generate API Key
1. Click **API Keys** in sidebar
2. Click **Create Key**
3. Name it: `MobVibe Production`
4. Copy the key (starts with `sk-ant-`)
5. **Save immediately - you can't see it again!**

```
Example: sk-ant-api03-abc123xyz...
```

**Save as**: `ANTHROPIC_API_KEY`

### Verify Anthropic Key
```bash
# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_ANTHROPIC_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Should return: JSON response with message
```

### Cost Estimation
- Claude Sonnet: $3 per million input tokens, $15 per million output tokens
- Expected usage: ~5-10M tokens/month for 100 users
- **Estimated cost**: $20-50/month

---

## 3️⃣ Fly.io Setup (10 minutes)

### Step 1: Create Account
1. Go to https://fly.io/app/sign-up
2. Sign up with GitHub (recommended) or email
3. Verify email

### Step 2: Add Payment Method
1. Go to https://fly.io/dashboard
2. Click **Account** → **Billing**
3. Add credit card
4. **Note**: Free tier available (~$5/month usage often waived)

### Step 3: Install CLI
```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Add to PATH (add this to ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.fly/bin:$PATH"

# Restart terminal, then verify
flyctl version
```

### Step 4: Login
```bash
# Login to Fly.io
flyctl auth login

# This opens browser for authentication
# After success, you'll see: "successfully logged in as your@email.com"
```

### Step 5: Get API Token
```bash
# Get your Fly.io API token
flyctl auth token

# Copy the output (starts with `fo1_`)
```

```
Example: fo1_abc123xyz456...
```

**Save as**: `FLY_API_TOKEN`

### Verify Fly.io Setup
```bash
# List your apps (should be empty initially)
flyctl apps list

# Check authentication
flyctl auth whoami

# Should show your email
```

### Cost Estimation
- Shared CPU 1x: 256MB RAM = ~$2/month
- Shared CPU 1x: 512MB RAM = ~$5/month
- Machines usage (sandboxes): ~$5-10/month
- **Estimated cost**: $10-15/month

---

## 4️⃣ GlitchTip/Sentry Setup (10 minutes)

### Option A: GlitchTip (Recommended - Free Tier)

#### Step 1: Create Account
1. Go to https://app.glitchtip.com/register
2. Sign up with email or GitHub
3. Verify email

#### Step 2: Create Organization
1. After login, click **Create Organization**
2. Name: `MobVibe`
3. Click **Create**

#### Step 3: Create Project
1. Click **Projects** → **Create Project**
2. Name: `MobVibe Mobile`
3. Platform: **React Native**
4. Click **Create Project**

#### Step 4: Get DSN
1. In project dashboard, click **Settings**
2. Click **Client Keys (DSN)**
3. Copy the DSN (starts with `https://`)

```
Example: https://abc123@app.glitchtip.com/123
```

**Save as**: `SENTRY_DSN` (GlitchTip is Sentry-compatible)

#### Free Tier Limits
- 1,000 errors per month
- 90 days retention
- Unlimited users
- **Cost**: $0

### Option B: Sentry (Alternative)

If you prefer Sentry instead:

1. Go to https://sentry.io/signup/
2. Create account (free tier: 5k errors/month)
3. Create project → Select **React Native**
4. Copy DSN from project settings

**Cost**: $0 for free tier (5k errors/month)

### Verify Monitoring Setup
```bash
# Test DSN (replace with your DSN)
curl -X POST "YOUR_SENTRY_DSN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test error","level":"error"}'

# Check GlitchTip/Sentry dashboard - should see test error
```

---

## 5️⃣ GitHub Configuration (5 minutes)

### Step 1: Verify Repository
1. Go to https://github.com/YOUR_USERNAME/MobVibe
2. Make sure you have **admin access**

### Step 2: Enable GitHub Actions
1. Go to repository **Settings**
2. Click **Actions** → **General**
3. Under **Actions permissions**, select:
   - ✅ Allow all actions and reusable workflows
4. Click **Save**

### Step 3: Prepare Secrets
You'll add these in Step 7 after collecting all credentials:
- EXPO_TOKEN (from Step 6)
- EXPO_PUBLIC_SUPABASE_URL (from Step 1)
- EXPO_PUBLIC_SUPABASE_ANON_KEY (from Step 1)
- EXPO_PUBLIC_API_URL (will be `https://mobvibe-api.fly.dev`)
- EXPO_PUBLIC_SENTRY_DSN (from Step 4)
- FLY_API_TOKEN (from Step 3)

---

## 6️⃣ Expo/EAS Setup (5 minutes)

### Step 1: Install EAS CLI
```bash
# Install globally
npm install -g eas-cli

# Verify installation
eas --version
```

### Step 2: Login to Expo
```bash
# Login (creates account if needed)
eas login

# Follow prompts:
# - Email: your@email.com
# - Password: (create strong password)
# - Username: (choose username)
```

### Step 3: Get Expo Token
```bash
# Get your Expo access token
eas whoami

# You should see:
# Logged in as your-username

# To get the token for GitHub Actions:
cat ~/.expo/state.json

# Or manually generate a token:
# 1. Go to https://expo.dev/accounts/[your-username]/settings/access-tokens
# 2. Click "Create token"
# 3. Name: "GitHub Actions"
# 4. Copy the token
```

**Save as**: `EXPO_TOKEN`

### Step 4: Initialize EAS in Project
```bash
# From project root
cd /path/to/MobVibe

# Configure EAS (if not already done)
eas build:configure

# Select options:
# - Platform: All
# - Creates eas.json (already exists in our case)
```

### Verify EAS Setup
```bash
# Check configuration
eas build:list

# Should connect to Expo and show (empty) build list
```

---

## 7️⃣ Verify All Credentials (5 minutes)

### Step 1: Create Credentials File (Temporary)

Create a temporary file to organize your credentials:

```bash
# Create temporary secure file (NOT committed to git)
nano ~/mobvibe-credentials.txt
```

Paste this template and fill in your values:

```
# MobVibe Production Credentials
# ⚠️ DELETE THIS FILE AFTER DEPLOYMENT ⚠️

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Fly.io
FLY_API_TOKEN=fo1_...
FLY_APP_NAME=mobvibe-api
FLY_REGION=sjc

# Monitoring (GlitchTip or Sentry)
SENTRY_DSN=https://...@app.glitchtip.com/123

# API URL (will be created during deployment)
API_URL=https://mobvibe-api.fly.dev

# Expo
EXPO_TOKEN=your-expo-token-here
```

Save file: `Ctrl+O`, then `Enter`, then `Ctrl+X`

### Step 2: Run Validation Script

```bash
# Run comprehensive validation
npm run validate:credentials

# Or manually with Node:
node scripts/deploy/validate-credentials.js
```

### Step 3: Secure the Credentials

```bash
# Set restrictive permissions
chmod 600 ~/mobvibe-credentials.txt

# Only you can read/write this file
```

---

## 8️⃣ Optional: Apple Developer Account

**Only needed when submitting to TestFlight/App Store**

### Cost: $99/year

### Setup Steps:
1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with Apple ID
3. Enroll in Apple Developer Program
4. Pay $99 annual fee
5. Wait for approval (1-2 business days)

### After Approval:
1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in app information:
   - Platform: iOS
   - Name: MobVibe
   - Bundle ID: com.mobvibe.app
4. Get credentials:
   - Apple ID: Your Apple ID email
   - Team ID: Found in membership details
   - App ID: From App Store Connect

---

## 9️⃣ Optional: Google Play Developer Account

**Only needed when submitting to Google Play**

### Cost: $25 one-time

### Setup Steps:
1. Go to https://play.google.com/console/signup
2. Sign in with Google Account
3. Pay $25 one-time registration fee
4. Complete developer profile

### After Setup:
1. Create app: **Create app** button
2. Fill in details:
   - App name: MobVibe
   - Package name: com.mobvibe.app
3. Create service account for automated submissions:
   - https://console.cloud.google.com/
   - Create new project: "MobVibe"
   - Enable Google Play Android Developer API
   - Create service account
   - Download JSON key file
4. Save as: `secrets/google-play-service-account.json`

---

## ✅ Final Checklist

Before proceeding to deployment, verify you have:

### Required for Backend Deployment
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] FLY_API_TOKEN
- [ ] FLY_APP_NAME (decided: mobvibe-api)
- [ ] FLY_REGION (decided: sjc or your preference)

### Required for Mobile Build
- [ ] EXPO_TOKEN
- [ ] EXPO_PUBLIC_SUPABASE_URL
- [ ] EXPO_PUBLIC_SUPABASE_ANON_KEY
- [ ] EXPO_PUBLIC_API_URL (https://mobvibe-api.fly.dev)
- [ ] EXPO_PUBLIC_SENTRY_DSN

### Required for CI/CD
- [ ] All above credentials added to GitHub Secrets
- [ ] GitHub Actions enabled in repository

### Optional (App Store Submission)
- [ ] Apple Developer Account ($99/year)
- [ ] Google Play Developer Account ($25 one-time)
- [ ] Apple Team ID and App ID
- [ ] Google Play service account JSON

---

## 🔒 Security Best Practices

### ✅ DO:
- Store credentials in password manager (1Password, LastPass, Bitwarden)
- Use environment variables for local development
- Add credentials to GitHub Secrets for CI/CD
- Use Fly.io secrets for production backend
- Delete temporary credential files after setup
- Rotate API keys every 90 days

### ❌ DON'T:
- Commit credentials to Git (check .gitignore)
- Share credentials in Slack/Discord/email
- Use production keys in development
- Store credentials in plain text on disk
- Use same password for multiple services
- Share Supabase service role key (backend only!)

---

## 📞 Need Help?

### Common Issues:

**"Invalid API key"**
- Check for extra spaces or newlines
- Verify key hasn't expired
- Make sure using correct key type (anon vs service role)

**"Authentication failed"**
- Confirm email is verified
- Check password is correct
- Try logout and login again

**"Payment method required"**
- All services need payment method for production use
- Free tiers still require card on file
- Cards are NOT charged unless you exceed free limits

**"Can't find API key section"**
- Clear browser cache
- Try different browser
- Check you're logged into correct account

---

## ⏭️ Next Steps

Once you have all credentials:

1. **Run deployment script**:
   ```bash
   ./scripts/deploy/deploy-simplified.sh
   ```

2. **Or deploy manually** following:
   - `docs/QUICK_START_DEPLOYMENT.md` (30-minute guide)
   - `docs/DEPLOYMENT_SIMPLIFIED.md` (comprehensive guide)

**Estimated time to deploy**: 30 minutes after credentials gathered

---

## 💾 Credential Storage Template

Save this in your password manager (recommended: Bitwarden, 1Password):

```
Service: MobVibe Production Credentials
Category: Development

# Supabase
URL: [PASTE_HERE]
Anon Key: [PASTE_HERE]
Service Role Key: [PASTE_HERE]

# Anthropic
API Key: [PASTE_HERE]

# Fly.io
API Token: [PASTE_HERE]
App Name: mobvibe-api
Region: sjc

# Monitoring
Sentry/GlitchTip DSN: [PASTE_HERE]

# Expo
Token: [PASTE_HERE]
Username: [PASTE_HERE]

# Optional: App Stores
Apple ID: [PASTE_HERE]
Apple Team ID: [PASTE_HERE]
Google Service Account: Path to JSON file
```

---

**Ready to deploy?** Proceed to `docs/QUICK_START_DEPLOYMENT.md`
