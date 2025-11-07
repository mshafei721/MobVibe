#!/bin/bash
# UI Duplicate Primitives Audit Script
#
# Ensures Paper components don't duplicate existing primitives.
# Only approved unique components should be exported from Paper adapter.

echo "🔍 Auditing for duplicate UI primitives..."

VIOLATIONS_FOUND=0

# Approved Paper components (no duplicates with primitives)
APPROVED_PAPER_COMPONENTS=("FAB" "Chip" "Badge" "ProgressBar" "Snackbar")

# Check for Paper components that would duplicate primitives
DUPLICATE_CHECKS=(
  "Button:react-native-paper.*Button"
  "Text:react-native-paper.*Text[^I]"  # TextInput is OK, but not Text component
  "Input:react-native-paper.*TextInput"
  "Card:react-native-paper.*Card"
  "Divider:react-native-paper.*Divider"
  "Avatar:react-native-paper.*Avatar"
  "List:react-native-paper.*List"
)

echo ""
echo "Checking for duplicate Paper components..."

for check in "${DUPLICATE_CHECKS[@]}"; do
  PRIMITIVE="${check%:*}"
  PATTERN="${check#*:}"

  FOUND=$(grep -r "$PATTERN" src/ui/adapters/paper/ \
    --include="*.ts" --include="*.tsx" 2>/dev/null || true)

  if [ ! -z "$FOUND" ]; then
    echo "❌ Duplicate found: Paper $PRIMITIVE duplicates existing primitive"
    echo "   Location: $FOUND"
    VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
  fi
done

echo ""
echo "Verifying only approved Paper components are exported..."

# Check all TypeScript files in paper adapter directory
for file in src/ui/adapters/paper/*.ts; do
  if [ -f "$file" ]; then
    BASENAME=$(basename "$file" .ts)

    # Skip index.ts
    if [ "$BASENAME" = "index" ]; then
      continue
    fi

    # Check if component is approved
    IS_APPROVED=0
    for approved in "${APPROVED_PAPER_COMPONENTS[@]}"; do
      if [ "$BASENAME" = "$approved" ]; then
        IS_APPROVED=1
        break
      fi
    done

    if [ $IS_APPROVED -eq 0 ]; then
      echo "❌ Unapproved Paper component: $BASENAME"
      echo "   Only these components are allowed: ${APPROVED_PAPER_COMPONENTS[*]}"
      VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
    fi
  fi
done

echo ""

# Final summary
if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo "✅ No duplicate primitives detected"
  echo "✅ All Paper components are unique and approved"
  echo ""
  echo "Approved Paper components:"
  for component in "${APPROVED_PAPER_COMPONENTS[@]}"; do
    echo "  - $component"
  done
  echo ""
  exit 0
else
  echo "❌ $VIOLATIONS_FOUND violation(s) detected"
  echo "❌ Remove duplicate components or use existing primitives instead"
  echo ""
  exit 1
fi
