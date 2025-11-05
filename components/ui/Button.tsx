import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { borderRadius } from '@/constants/spacing';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ onPress, title, variant = 'primary', disabled, loading }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary[500] : '#fff'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'outline' && styles.outlineButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
  },
  secondaryButton: {
    backgroundColor: colors.secondary[500],
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  outlineButtonText: {
    color: colors.primary[500],
  },
});
