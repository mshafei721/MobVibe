import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProjectStore } from '@/store/projectStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing, borderRadius } from '@/constants/spacing';
import { PROJECT_TEMPLATES } from '@/constants/projectTemplates';

export default function ProjectSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, updateProject, deleteProject, archiveProject, loading } = useProjectStore();

  const project = projects.find((p) => p.id === id);
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (project) {
      const nameChanged = name !== project.name;
      const descChanged = description !== (project.description || '');
      setHasChanges(nameChanged || descChanged);
    }
  }, [name, description, project]);

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Project not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const template = PROJECT_TEMPLATES.find((t) => t.id === project.template_id);

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    } else if (name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
      return;
    }

    ReactNativeHapticFeedback.trigger('impactMedium');

    try {
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || null,
      });

      ReactNativeHapticFeedback.trigger('notificationSuccess');
      Alert.alert('Success', 'Project updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      ReactNativeHapticFeedback.trigger('notificationError');
      Alert.alert('Error', err.message || 'Failed to update project. Please try again.');
    }
  };

  const handleExport = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    Alert.alert(
      'Export Project',
      'Export functionality will be available soon. This will allow you to download all project files.',
      [{ text: 'OK' }]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Project',
      `Are you sure you want to archive "${project.name}"? You can restore it later from archived projects.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'default',
          onPress: async () => {
            ReactNativeHapticFeedback.trigger('notificationWarning');
            try {
              await archiveProject(project.id);
              ReactNativeHapticFeedback.trigger('notificationSuccess');
              router.replace('/(tabs)/projects');
            } catch (err: any) {
              ReactNativeHapticFeedback.trigger('notificationError');
              Alert.alert('Error', 'Failed to archive project. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            ReactNativeHapticFeedback.trigger('notificationError');
            try {
              await deleteProject(project.id);
              ReactNativeHapticFeedback.trigger('notificationSuccess');
              router.replace('/(tabs)/projects');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: handleSave },
        ]
      );
    } else {
      router.back();
    }
  };

  const createdDate = new Date(project.created_at).toLocaleDateString();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Project</Text>

          <Text style={styles.label}>Name *</Text>
          <Input
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({ ...errors, name: undefined });
              }
            }}
            placeholder="Enter project name"
            error={!!errors.name}
            maxLength={50}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <Text style={[styles.label, styles.labelMargin]}>Description (Optional)</Text>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Enter project description"
            multiline
            numberOfLines={3}
            style={styles.descriptionInput}
          />

          {hasChanges && (
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="primary"
              loading={loading}
              disabled={loading}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Statistics</Text>
          <Card>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Template:</Text>
              <Text style={styles.statValue}>{template?.name || 'Unknown'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Created:</Text>
              <Text style={styles.statValue}>{createdDate}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Sessions:</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Files:</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tokens Used:</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity onPress={handleExport} style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="download-outline" size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export Project</Text>
              <Text style={styles.actionDescription}>Download all project files</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.disabled} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleArchive} style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="archive-outline" size={24} color={colors.status} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Archive Project</Text>
              <Text style={styles.actionDescription}>Hide from active projects</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.disabled} />
          </TouchableOpacity>
        </View>

        <View style={styles.dangerSection}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Card style={styles.dangerCard}>
            <TouchableOpacity onPress={handleDelete} style={styles.dangerButton}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <View style={styles.dangerContent}>
                <Text style={styles.dangerTitle}>Delete Project</Text>
                <Text style={styles.dangerDescription}>
                  Permanently delete this project. This action cannot be undone.
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  dangerSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  labelMargin: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  descriptionInput: {
    height: 80,
    paddingTop: spacing[3],
    textAlignVertical: 'top',
    marginBottom: spacing[4],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  statLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.light,
    padding: spacing[4],
    borderRadius: borderRadius.base,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionIcon: {
    marginRight: spacing[3],
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  actionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  dangerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
    marginBottom: spacing[1],
  },
  dangerDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
