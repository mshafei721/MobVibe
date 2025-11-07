#!/bin/bash

# UI Adapter Import Audit Script
# Verifies zero vendor leakage - all UI imports should go through adapters

echo "🔍 Auditing UI vendor imports..."
echo ""

# Check for React Native UI component imports outside adapters
# Exclude allowed exceptions: Platform, AccessibilityInfo, types, utilities
RN_VIOLATIONS=$(grep -r "from 'react-native'" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="adapters" \
  --exclude-dir="__tests__" \
  --exclude-dir="__demo__" \
  | grep -v "react-native-haptic-feedback" \
  | grep -v "@expo/vector-icons" \
  | grep -v "react-native-reanimated" \
  | grep -v "react-native-gifted-chat" \
  | grep -v "react-native-keyboard-controller" \
  | grep -v "react-native-paper" \
  | grep -v "Platform" \
  | grep -v "AccessibilityInfo" \
  | grep -v "KeyboardTypeOptions" \
  | grep -v "LayoutChangeEvent" \
  | grep -v "ViewStyle" \
  | grep -v "TextStyle" \
  | grep -v "ActivityIndicatorProps" \
  | grep -v "Animated" \
  | grep -v "StyleSheet" \
  | grep -v "import type" \
  | grep -v "} from 'react-native';")

# Check for gluestack imports outside adapters
GLUESTACK_VIOLATIONS=$(grep -r "from '@gluestack" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="adapters")

VIOLATIONS_FOUND=0

if [ -n "$RN_VIOLATIONS" ]; then
  echo "❌ React Native UI component imports found outside adapters:"
  echo "$RN_VIOLATIONS"
  echo ""
  VIOLATIONS_FOUND=1
fi

if [ -n "$GLUESTACK_VIOLATIONS" ]; then
  echo "❌ gluestack imports found outside adapters:"
  echo "$GLUESTACK_VIOLATIONS"
  echo ""
  VIOLATIONS_FOUND=1
fi

if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo "✅ Zero vendor leakage - all UI imports via adapters"
  echo ""
  echo "Allowed imports:"
  echo "  - Platform, AccessibilityInfo, ViewStyle, etc. (utilities/types)"
  echo "  - react-native-haptic-feedback (utility library)"
  echo "  - @expo/vector-icons (vendor-agnostic icon library)"
  echo "  - @/ui/tokens (design tokens)"
  echo "  - @/ui/adapters (adapter layer)"
  exit 0
else
  echo "❌ Vendor leakage detected - fix imports above"
  echo ""
  echo "Rule: Only src/ui/adapters/ can import from 'react-native' or '@gluestack-ui/themed'"
  echo "Primitives should import from '@/ui/adapters'"
  exit 1
fi
