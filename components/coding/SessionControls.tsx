import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';

interface SessionControlsProps {
  sessionId: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'expired';
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export function SessionControls({
  sessionId,
  status,
  onPause,
  onResume,
  onStop,
}: SessionControlsProps) {
  const handleStop = () => {
    Alert.alert(
      'Stop Session',
      'Are you sure you want to stop this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: onStop,
        },
      ]
    );
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: tokens.colors.success[500],
          backgroundColor: tokens.colors.success[50],
        };
      case 'paused':
        return {
          label: 'Paused',
          color: tokens.colors.warning[500],
          backgroundColor: tokens.colors.warning[50],
        };
      case 'pending':
        return {
          label: 'Pending',
          color: tokens.colors.info[500],
          backgroundColor: tokens.colors.info[50],
        };
      case 'completed':
        return {
          label: 'Completed',
          color: tokens.colors.neutral[500],
          backgroundColor: tokens.colors.neutral[100],
        };
      case 'failed':
        return {
          label: 'Failed',
          color: tokens.colors.error[500],
          backgroundColor: tokens.colors.error[50],
        };
      case 'expired':
        return {
          label: 'Expired',
          color: tokens.colors.neutral[500],
          backgroundColor: tokens.colors.neutral[100],
        };
      default:
        return {
          label: status,
          color: tokens.colors.neutral[500],
          backgroundColor: tokens.colors.neutral[100],
        };
    }
  };

  const statusConfig = getStatusConfig();
  const canPause = status === 'active' && onPause;
  const canResume = status === 'paused' && onResume;
  const canStop = (status === 'active' || status === 'paused') && onStop;

  return (
    <View style={styles.container}>
      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusConfig.backgroundColor },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
        <Text variant="caption" color={statusConfig.color} weight="medium">
          {statusConfig.label}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {/* Pause/Resume Button */}
        {canPause && (
          <TouchableOpacity onPress={onPause} style={styles.controlButton}>
            <Text variant="caption" color={tokens.colors.warning[500]} weight="medium">
              Pause
            </Text>
          </TouchableOpacity>
        )}

        {canResume && (
          <TouchableOpacity onPress={onResume} style={styles.controlButton}>
            <Text variant="caption" color={tokens.colors.success[500]} weight="medium">
              Resume
            </Text>
          </TouchableOpacity>
        )}

        {/* Stop Button */}
        {canStop && (
          <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
            <Text variant="caption" color={tokens.colors.text.inverse} weight="medium">
              Stop
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    backgroundColor: tokens.colors.background.base,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.spacing.borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  controlButton: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.spacing.borderRadius.md,
    backgroundColor: tokens.colors.surface[1],
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  stopButton: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.spacing.borderRadius.md,
    backgroundColor: tokens.colors.error[500],
  },
});
