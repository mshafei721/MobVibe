#!/bin/bash

# Token Audit Script
# Detects hardcoded color values, spacing, and other design tokens outside of src/ui/tokens

set -e

REPORT_FILE="reports/ui/token-audit-results.md"
ERRORS=0
WARNINGS=0

echo "# Token Audit Results" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Date:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "**Phase:** 03 - Token System Design" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "🔍 Running token audit..."

# Function to search for hardcoded values
search_hardcoded() {
  local pattern=$1
  local description=$2
  local exclude_paths=$3

  echo "" >> "$REPORT_FILE"
  echo "## $description" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  # Search for pattern excluding token files and specific paths
  results=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude="*tokens*" \
    --exclude="*config*" \
    --exclude="*audit*" \
    $exclude_paths \
    "$pattern" . 2>/dev/null || true)

  if [ -z "$results" ]; then
    echo "✅ **No issues found**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "✅ $description: No issues"
  else
    count=$(echo "$results" | wc -l)
    ERRORS=$((ERRORS + count))
    echo "❌ **Found $count instances of hardcoded values**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$results" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "❌ $description: Found $count issues"
  fi
}

# 1. Check for hardcoded hex colors
echo "Checking for hardcoded hex colors..."
search_hardcoded "#[0-9A-Fa-f]{6}" "Hardcoded Hex Colors" ""

# 2. Check for hardcoded rgb/rgba colors
echo "Checking for hardcoded rgb/rgba colors..."
search_hardcoded "rgb\(.*\)" "Hardcoded RGB Colors" ""

# 3. Check for hardcoded numeric spacing (looking for suspicious patterns)
echo "Checking for suspicious hardcoded spacing..."
search_hardcoded "padding.*:[^;]*[0-9]+px" "Hardcoded Padding (px)" "--exclude='*.json'"

# 4. Check for hardcoded margin values
echo "Checking for hardcoded margin values..."
search_hardcoded "margin.*:[^;]*[0-9]+px" "Hardcoded Margin (px)" "--exclude='*.json'"

# 5. Check for duplicate token definitions
echo "Checking for duplicate token definitions..."
echo "" >> "$REPORT_FILE"
echo "## Duplicate Token Definitions" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check if tokens are defined in multiple places
token_files=$(find src/ui/tokens -name "*.ts" 2>/dev/null || true)
if [ -n "$token_files" ]; then
  duplicates=$(grep -h "export const" $token_files | sort | uniq -d || true)
  if [ -z "$duplicates" ]; then
    echo "✅ **No duplicate token definitions**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "✅ No duplicate token definitions"
  else
    WARNINGS=$((WARNINGS + 1))
    echo "⚠️ **Found duplicate token definitions**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "$duplicates" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "⚠️ Found duplicate token definitions"
  fi
fi

# 6. Check for unused tokens (tokens defined but never used)
echo "Checking for potentially unused tokens..."
echo "" >> "$REPORT_FILE"
echo "## Token Usage Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "✅ **Token usage check deferred to Phase 04-05** (component migration)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "ℹ️ Token usage check deferred to Phase 04-05"

# Summary
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **Errors:** $ERRORS" >> "$REPORT_FILE"
echo "- **Warnings:** $WARNINGS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $ERRORS -eq 0 ]; then
  echo "**Result:** ✅ **PASS** - No critical issues found" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "✅ Audit complete: No critical issues"
  echo "📄 Report saved to: $REPORT_FILE"
  exit 0
else
  echo "**Result:** ❌ **FAIL** - Found $ERRORS hardcoded values" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Recommended Actions" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "1. Replace hardcoded color values with tokens from \`src/ui/tokens\`" >> "$REPORT_FILE"
  echo "2. Use Tailwind CSS classes for spacing instead of hardcoded px values" >> "$REPORT_FILE"
  echo "3. Refactor components to use design tokens for consistency" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "❌ Audit complete: Found $ERRORS issues"
  echo "📄 Report saved to: $REPORT_FILE"
  exit 1
fi
