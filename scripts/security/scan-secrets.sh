#!/bin/bash
# Secret Scanning Script
# DEFERRED: Will be used when running security audits

set -e

echo "======================================"
echo "MobVibe Secret Scanning"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Install TruffleHog if not present
if ! command -v trufflehog &> /dev/null; then
    echo "${YELLOW}Installing TruffleHog...${NC}"
    pip install trufflehog3
fi

# Scan git history for secrets
echo "${YELLOW}Scanning git history for secrets...${NC}"
trufflehog filesystem . --json > secrets-report.json 2>&1 || true

# Check if any secrets were found
if [ -s secrets-report.json ]; then
    SECRETS_FOUND=$(wc -l < secrets-report.json)
    if [ "$SECRETS_FOUND" -gt 0 ]; then
        echo "${RED}ERROR: Found $SECRETS_FOUND potential secrets in git history!${NC}"
        echo "Review secrets-report.json for details"
        exit 1
    fi
fi

# Check for exposed environment variables in source code
echo "${YELLOW}Checking for exposed environment variables...${NC}"
if grep -r "EXPO_PUBLIC_SUPABASE_ANON_KEY.*=.*['\"][a-zA-Z0-9]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null; then
    echo "${RED}ERROR: Potential hardcoded API key found in source code!${NC}"
    exit 1
fi

# Verify .env files are not committed
echo "${YELLOW}Checking for committed .env files...${NC}"
if git ls-files | grep -q "\.env$"; then
    echo "${RED}ERROR: .env file committed to git!${NC}"
    echo "Remove it immediately:"
    echo "  git rm .env"
    echo "  git commit -m \"Remove .env file\""
    exit 1
fi

# Check for hardcoded passwords
echo "${YELLOW}Checking for hardcoded passwords...${NC}"
if grep -r "password.*=.*['\"][^{]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null; then
    echo "${YELLOW}WARNING: Potential hardcoded password found${NC}"
    # Not a hard failure, just a warning
fi

# Check for hardcoded API endpoints
echo "${YELLOW}Checking for hardcoded API endpoints...${NC}"
if grep -r "http://[0-9]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null; then
    echo "${YELLOW}WARNING: Hardcoded localhost URLs found${NC}"
    echo "Use environment variables instead"
fi

# Check for common secret patterns
echo "${YELLOW}Checking for common secret patterns...${NC}"
PATTERNS=(
    "api[_-]?key"
    "api[_-]?secret"
    "access[_-]?token"
    "auth[_-]?token"
    "private[_-]?key"
    "client[_-]?secret"
    "aws[_-]?secret"
)

for pattern in "${PATTERNS[@]}"; do
    if grep -ri "$pattern.*=.*['\"][a-zA-Z0-9]" --include="*.ts" --include="*.tsx" src/ 2>/dev/null; then
        echo "${YELLOW}WARNING: Potential secret matching pattern: $pattern${NC}"
    fi
done

# Check for AWS credentials
echo "${YELLOW}Checking for AWS credentials...${NC}"
if grep -r "AKIA[0-9A-Z]{16}" . 2>/dev/null; then
    echo "${RED}ERROR: AWS Access Key ID found!${NC}"
    exit 1
fi

# Check for Supabase service role keys (should never be in frontend)
echo "${YELLOW}Checking for Supabase service role keys...${NC}"
if grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.ts" --include="*.tsx" src/ app/ 2>/dev/null; then
    echo "${RED}ERROR: Service role key referenced in frontend code!${NC}"
    echo "Service role keys should ONLY be in backend/worker code"
    exit 1
fi

# Check for private keys
echo "${YELLOW}Checking for private keys...${NC}"
if grep -r "BEGIN.*PRIVATE KEY" . 2>/dev/null; then
    echo "${RED}ERROR: Private key found in repository!${NC}"
    exit 1
fi

# Verify sensitive files are in .gitignore
echo "${YELLOW}Verifying .gitignore coverage...${NC}"
SENSITIVE_PATTERNS=(
    ".env"
    ".env.local"
    "*.pem"
    "*.key"
    "credentials.json"
    "secrets.json"
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if ! grep -q "$pattern" .gitignore 2>/dev/null; then
        echo "${YELLOW}WARNING: $pattern not in .gitignore${NC}"
    fi
done

# Summary
echo ""
echo "${GREEN}======================================"
echo "Secret Scan Complete"
echo "======================================${NC}"
echo ""
echo "Results:"
if [ -s secrets-report.json ]; then
    echo "  - TruffleHog report: secrets-report.json"
fi
echo "  - No critical secrets found in committed code ✓"
echo "  - No .env files committed ✓"
echo "  - No service role keys in frontend ✓"
echo ""
echo "${GREEN}All critical checks passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review secrets-report.json for any findings"
echo "  2. Ensure all sensitive data is in environment variables"
echo "  3. Verify .env files are in .gitignore"
echo "  4. Rotate any exposed credentials immediately"
echo ""
