import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
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
import { PROJECT_TEMPLATES, ProjectTemplate } from '@/constants/projectTemplates';

export default function NewProjectScreen() {
  const { createProject, loading } = useProjectStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [errors, setErrors] = useState<{ name?: string }>({});

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

  const handleTemplateSelect = (template: ProjectTemplate) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    setSelectedTemplate(template);
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
      return;
    }

    if (!selectedTemplate) {
      Alert.alert('Template Required', 'Please select a project template');
      ReactNativeHapticFeedback.trigger('notificationWarning');
      return;
    }

    ReactNativeHapticFeedback.trigger('impactMedium');

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        template_id: selectedTemplate.id,
      });

      ReactNativeHapticFeedback.trigger('notificationSuccess');
      router.replace(`/(tabs)/projects/${project.id}`);
    } catch (err: any) {
      ReactNativeHapticFeedback.trigger('notificationError');
      Alert.alert('Error', err.message || 'Failed to create project. Please try again.');
    }
  };

  const handleCancel = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Project</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>

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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Template</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a starting point for your project
          </Text>

          <View style={styles.templatesGrid}>
            {PROJECT_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleTemplateSelect(template)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.templateCard,
                    selectedTemplate?.id === template.id && styles.selectedTemplate,
                  ]}
                >
                  <Text style={styles.templateIcon}>{template.icon}</Text>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription} numberOfLines={2}>
                    {template.description}
                  </Text>
                  {selectedTemplate?.id === template.id && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedTemplate && (
          <Card style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
              <Text style={styles.previewTitle}>Template Preview</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewIcon}>{selectedTemplate.icon}</Text>
              <Text style={styles.previewName}>{selectedTemplate.name}</Text>
              <Text style={styles.previewDescription}>{selectedTemplate.description}</Text>
              {selectedTemplate.initialPrompt && (
                <View style={styles.promptContainer}>
                  <Text style={styles.promptLabel}>Initial Prompt:</Text>
                  <Text style={styles.promptText}>{selectedTemplate.initialPrompt}</Text>
                </View>
              )}
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          disabled={loading}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Create Project"
          onPress={handleCreate}
          variant="primary"
          loading={loading}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
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
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
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
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  labelMargin: {
    marginTop: spacing[4],
  },
  descriptionInput: {
    height: 80,
    paddingTop: spacing[3],
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing[1],
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing[2],
  },
  templateCard: {
    width: '46%',
    margin: spacing[2],
    padding: spacing[4],
    alignItems: 'center',
    minHeight: 150,
  },
  selectedTemplate: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  templateIcon: {
    fontSize: 48,
    marginBottom: spacing[2],
  },
  templateName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  },
  previewCard: {
    marginBottom: spacing[4],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  previewTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginLeft: spacing[2],
  },
  previewContent: {
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 64,
    marginBottom: spacing[2],
  },
  previewName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  previewDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  promptContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: spacing[3],
    borderRadius: borderRadius.base,
  },
  promptLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  promptText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  buttonSpacer: {
    width: spacing[3],
  },
});
