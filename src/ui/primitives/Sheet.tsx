import React, { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Box, Modal, Pressable } from '../adapters';
import { tokens } from '../tokens';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
}

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  children,
  accessibilityLabel,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <Box style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose}>
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
          />
        </Pressable>

        <Box
          style={{
            backgroundColor: tokens.colors.background.base,
            borderTopLeftRadius: tokens.spacing.borderRadius.xl,
            borderTopRightRadius: tokens.spacing.borderRadius.xl,
            paddingTop: tokens.spacing[6],
            paddingHorizontal: tokens.spacing[4],
            paddingBottom: tokens.spacing[8],
            maxHeight: '80%',
          }}
          accessibilityLabel={accessibilityLabel}
        >
          {children}
        </Box>
      </Box>
    </Modal>
  );
};
