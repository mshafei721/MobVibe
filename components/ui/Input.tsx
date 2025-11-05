import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing, borderRadius } from '@/constants/spacing';

interface InputProps extends TextInputProps {
  error?: boolean;
}

export function Input({ error, style, ...props }: InputProps) {
  return (
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        style,
      ]}
      placeholderTextColor={colors.text.disabled}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[4],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
});
