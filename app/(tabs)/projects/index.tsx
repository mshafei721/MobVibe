import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useProjectStore, Project } from '@/store/projectStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing, borderRadius } from '@/constants/spacing';
import { PROJECT_TEMPLATES } from '@/constants/projectTemplates';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectsScreen() {
  const { projects, loading, error, fetchProjects, deleteProject } = useProjectStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    router.push('/(tabs)/projects/new');
  };

  const handleProjectPress = (project: Project) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    router.push(`/(tabs)/projects/${project.id}`);
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            ReactNativeHapticFeedback.trigger('notificationWarning');
            try {
              await deleteProject(project.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            }
          },
        },
      ]
    );
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProjectCard = ({ item }: { item: Project }) => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === item.template_id);
    const lastModified = new Date(item.updated_at).toLocaleDateString();

    return (
      <TouchableOpacity
        onPress={() => handleProjectPress(item)}
        onLongPress={() => handleDeleteProject(item)}
        activeOpacity={0.7}
      >
        <Card style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectIcon}>{template?.icon || '📄'}</Text>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.projectDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <Text style={styles.projectDate}>Last modified: {lastModified}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={80} color={colors.text.disabled} />
      <Text style={styles.emptyTitle}>No projects yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first project to get started
      </Text>
      <Button
        title="Create Project"
        onPress={handleCreateProject}
        variant="primary"
      />
    </View>
  );

  if (loading && projects.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Projects</Text>
        <TouchableOpacity onPress={handleCreateProject} style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.disabled} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.text.disabled} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProjects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
      />
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
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  addButton: {
    padding: spacing[2],
  },
  errorBanner: {
    backgroundColor: colors.error,
    padding: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderRadius: borderRadius.base,
  },
  errorText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.base,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing[1],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  projectCard: {
    marginBottom: spacing[3],
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  projectIcon: {
    fontSize: 40,
    marginRight: spacing[3],
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  projectDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  projectDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
});
