import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProjectStore } from '@/store/projectStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing, borderRadius } from '@/constants/spacing';
import { PROJECT_TEMPLATES } from '@/constants/projectTemplates';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, currentProject, setCurrentProject, refreshProject } = useProjectStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const project = projects.find((p) => p.id === id);
      if (project) {
        setCurrentProject(project);
      } else {
        // Fetch project if not in store
        refreshProject(id);
      }
    }
  }, [id, projects]);

  const project = currentProject?.id === id ? currentProject : projects.find((p) => p.id === id);
  const template = project ? PROJECT_TEMPLATES.find((t) => t.id === project.template_id) : null;

  const handleStartCoding = () => {
    ReactNativeHapticFeedback.trigger('impactMedium');
    Alert.alert(
      'Coming Soon',
      'The coding interface will be available soon. This will open the AI-powered coding environment for your project.',
      [{ text: 'OK' }]
    );
  };

  const handleSettings = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    router.push(`/(tabs)/projects/settings?id=${id}`);
  };

  const handleBack = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    setCurrentProject(null);
    router.back();
  };

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const createdDate = new Date(project.created_at).toLocaleDateString();
  const lastModifiedDate = new Date(project.updated_at).toLocaleDateString();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.heroCard}>
          <Text style={styles.heroIcon}>{template?.icon || '📄'}</Text>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.description && (
            <Text style={styles.projectDescription}>{project.description}</Text>
          )}
          <View style={styles.templateBadge}>
            <Ionicons name="bookmark" size={16} color={colors.primary[500]} />
            <Text style={styles.templateBadgeText}>{template?.name || 'Unknown Template'}</Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>{createdDate}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Modified</Text>
                <Text style={styles.infoValue}>{lastModifiedDate}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="code-outline" size={20} color={colors.text.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Template</Text>
                <Text style={styles.infoValue}>{template?.name || 'Unknown'}</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Ionicons name="play-circle-outline" size={32} color={colors.primary[500]} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </Card>

            <Card style={styles.statCard}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary[500]} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Files</Text>
            </Card>
          </View>
          <Text style={styles.statsNote}>
            Statistics will be available once you start coding
          </Text>
        </View>

        {template?.initialPrompt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial Prompt</Text>
            <Card style={styles.promptCard}>
              <Text style={styles.promptText}>{template.initialPrompt}</Text>
            </Card>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Start Coding"
          onPress={handleStartCoding}
          variant="primary"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  settingsButton: {
    padding: spacing[2],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginBottom: spacing[4],
  },
  heroIcon: {
    fontSize: 80,
    marginBottom: spacing[3],
  },
  projectName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  projectDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.base,
  },
  templateBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
    marginLeft: spacing[1],
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  infoCard: {
    padding: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  infoIcon: {
    marginRight: spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    marginHorizontal: spacing[1],
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  statsNote: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  promptCard: {
    backgroundColor: '#f5f5f5',
  },
  promptText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
