# Phase 26: Project Management CRUD

## Overview
Complete project lifecycle management with create, view, update, delete operations and discovery features.

**Duration:** 2 days
**Dependencies:** [25]
**Owners:** Frontend Engineer, Backend Engineer

## Objectives
- Full CRUD operations for projects
- Project list with cards UI
- Search & filter functionality
- Project details screen
- Delete confirmation flow

## Technical Approach

### Data Model
```typescript
// types/project.ts
interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon_url?: string;
  framework: 'react-native' | 'flutter' | 'ionic';
  template?: string;
  status: 'draft' | 'active' | 'archived';
  last_modified: string;
  created_at: string;
  metadata?: {
    screens_count: number;
    code_size_kb: number;
    last_build?: string;
  };
}
```

### Implementation Steps

#### 1. Database Schema & RLS (3h)
```sql
-- Project storage policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Full-text search
CREATE INDEX idx_projects_search ON projects
  USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
```

#### 2. Project List Screen (6h)
```typescript
// screens/ProjectListScreen.tsx
export function ProjectListScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<Project['status'] | 'all'>('all');

  const supabase = useSupabase();
  const navigation = useNavigation();

  useEffect(() => {
    fetchProjects();
  }, [searchQuery, filterStatus]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('last_modified', { ascending: false });

      if (searchQuery) {
        query = query.textSearch('name', searchQuery);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProjects(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigation.navigate('CreateProject');
  };

  const handleProjectPress = (project: Project) => {
    navigation.navigate('ProjectDetails', { projectId: project.id });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-2xl font-bold mb-4">My Projects</Text>

        {/* Search Bar */}
        <TextInput
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-gray-100 rounded-lg px-4 py-2 mb-3"
        />

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'draft', 'active', 'archived'].map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilterStatus(status as any)}
              className={`mr-2 px-4 py-2 rounded-full ${
                filterStatus === status ? 'bg-purple-500' : 'bg-gray-200'
              }`}
            >
              <Text className={filterStatus === status ? 'text-white' : 'text-gray-700'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Project List */}
      {loading ? (
        <ActivityIndicator className="mt-8" size="large" color="#8b5cf6" />
      ) : projects.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-400 text-lg mb-4">No projects yet</Text>
          <Button title="Create Your First Project" onPress={handleCreateProject} />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => handleProjectPress(item)} />
          )}
        />
      )}

      {/* FAB Create Button */}
      <Pressable
        onPress={handleCreateProject}
        className="absolute bottom-6 right-6 w-14 h-14 bg-purple-500 rounded-full items-center justify-center shadow-lg"
      >
        <PlusIcon size={24} color="white" />
      </Pressable>
    </View>
  );
}
```

#### 3. Project Card Component (3h)
```typescript
// components/ProjectCard.tsx
interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, onPress, onDelete }: ProjectCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => setMenuVisible(true)}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start">
        {/* Project Icon */}
        {project.icon_url ? (
          <Image
            source={{ uri: project.icon_url }}
            className="w-12 h-12 rounded-lg mr-3"
          />
        ) : (
          <View className="w-12 h-12 rounded-lg bg-purple-100 items-center justify-center mr-3">
            <Text className="text-purple-500 text-xl font-bold">
              {project.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Project Info */}
        <View className="flex-1">
          <Text className="text-lg font-semibold mb-1">{project.name}</Text>
          {project.description && (
            <Text className="text-gray-500 text-sm mb-2" numberOfLines={2}>
              {project.description}
            </Text>
          )}

          {/* Meta Info */}
          <View className="flex-row items-center gap-3">
            <View className={`px-2 py-1 rounded ${getStatusColor(project.status)}`}>
              <Text className="text-xs font-medium">{project.status}</Text>
            </View>
            <Text className="text-gray-400 text-xs">
              {formatDistanceToNow(new Date(project.last_modified))} ago
            </Text>
          </View>

          {project.metadata && (
            <View className="flex-row items-center gap-3 mt-2">
              <Text className="text-gray-400 text-xs">
                {project.metadata.screens_count} screens
              </Text>
              <Text className="text-gray-400 text-xs">
                {(project.metadata.code_size_kb / 1024).toFixed(1)} MB
              </Text>
            </View>
          )}
        </View>

        {/* Menu Button */}
        <Pressable onPress={() => setMenuVisible(true)}>
          <MoreVerticalIcon size={20} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Context Menu */}
      <Menu visible={menuVisible} onDismiss={() => setMenuVisible(false)}>
        <Menu.Item title="Edit" onPress={() => {/* Navigate to edit */}} />
        <Menu.Item title="Duplicate" onPress={() => {/* Duplicate project */}} />
        <Menu.Item title="Archive" onPress={() => {/* Archive project */}} />
        <Divider />
        <Menu.Item
          title="Delete"
          titleStyle={{ color: '#ef4444' }}
          onPress={() => onDelete?.(project.id)}
        />
      </Menu>
    </Pressable>
  );
}
```

#### 4. Create Project Flow (4h)
```typescript
// screens/CreateProjectScreen.tsx
export function CreateProjectScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState<Project['framework']>('react-native');
  const [template, setTemplate] = useState<string>();
  const [loading, setLoading] = useState(false);

  const supabase = useSupabase();
  const navigation = useNavigation();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          framework,
          template,
          status: 'draft',
          metadata: {
            screens_count: 0,
            code_size_kb: 0,
          },
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Project created!');
      navigation.navigate('ProjectDetails', { projectId: data.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Create New Project</Text>

      {/* Project Name */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Project Name *</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="My Awesome App"
          className="border border-gray-300 rounded-lg px-4 py-3"
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What does your app do?"
          multiline
          numberOfLines={3}
          className="border border-gray-300 rounded-lg px-4 py-3"
        />
      </View>

      {/* Framework Selection */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Framework</Text>
        <View className="flex-row gap-2">
          {['react-native', 'flutter', 'ionic'].map((fw) => (
            <Pressable
              key={fw}
              onPress={() => setFramework(fw as any)}
              className={`flex-1 py-3 rounded-lg border ${
                framework === fw
                  ? 'bg-purple-500 border-purple-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-center font-medium ${
                framework === fw ? 'text-white' : 'text-gray-700'
              }`}>
                {fw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Template Selection */}
      <View className="mb-6">
        <Text className="text-gray-700 font-medium mb-2">Template (Optional)</Text>
        <TemplateSelector value={template} onChange={setTemplate} />
      </View>

      {/* Create Button */}
      <Button
        title={loading ? 'Creating...' : 'Create Project'}
        onPress={handleCreate}
        disabled={loading || !name.trim()}
        color="#8b5cf6"
      />
    </ScrollView>
  );
}
```

#### 5. Delete Confirmation (2h)
```typescript
// hooks/useDeleteProject.ts
export function useDeleteProject() {
  const supabase = useSupabase();

  const deleteProject = async (projectId: string) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Delete Project',
        'This action cannot be undone. All project data will be permanently deleted.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete project files from Storage
                await supabase.storage
                  .from('project_icons')
                  .remove([`${projectId}/`]);

                // Delete project record
                const { error } = await supabase
                  .from('projects')
                  .delete()
                  .eq('id', projectId);

                if (error) throw error;

                Alert.alert('Success', 'Project deleted');
                resolve(true);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete project');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  };

  return { deleteProject };
}
```

## Key Tasks

### Data Layer
- [ ] Create projects table schema
- [ ] Setup RLS policies
- [ ] Add search indexes
- [ ] Create metadata triggers
- [ ] Test database operations

### List Screen
- [ ] Build ProjectListScreen
- [ ] Add search functionality
- [ ] Implement status filters
- [ ] Add pull-to-refresh
- [ ] Create empty state

### Project Cards
- [ ] Build ProjectCard component
- [ ] Add context menu
- [ ] Implement long-press actions
- [ ] Show project metadata
- [ ] Add status badges

### CRUD Operations
- [ ] Create project flow
- [ ] Edit project details
- [ ] Delete with confirmation
- [ ] Duplicate project
- [ ] Archive/unarchive

### Details Screen
- [ ] Build ProjectDetailsScreen
- [ ] Show full metadata
- [ ] Add quick actions
- [ ] Edit inline
- [ ] Share project

## Acceptance Criteria
- [ ] All CRUD operations work
- [ ] Projects persist correctly
- [ ] Search returns relevant results
- [ ] Filters update list
- [ ] Delete requires confirmation
- [ ] UI is polished & responsive
- [ ] Empty states are clear
- [ ] Loading states shown

## Testing Strategy

### Unit Tests
```typescript
describe('Project CRUD', () => {
  it('creates project', async () => {
    const project = await createProject({ name: 'Test App' });
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test App');
  });

  it('fetches user projects', async () => {
    const projects = await fetchProjects(userId);
    expect(projects).toBeInstanceOf(Array);
  });

  it('deletes project', async () => {
    await deleteProject(projectId);
    const projects = await fetchProjects(userId);
    expect(projects.find(p => p.id === projectId)).toBeUndefined();
  });
});
```

### Integration Tests
- Test full create flow
- Verify search functionality
- Test filter combinations
- Verify delete with cascading
- Test concurrent operations

### UI Tests
- Card press navigation
- Long-press menu
- Search debouncing
- Filter persistence
- Pull-to-refresh

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental deletion | High | Confirmation dialog, undo |
| Slow search | Medium | Indexes, debouncing |
| Concurrent edits | Low | Optimistic updates, conflict resolution |
| Large project lists | Medium | Pagination, virtual lists |
| RLS policy bugs | Medium | Comprehensive testing |

## Success Metrics
- Project creation success rate: >99%
- Search response time: <500ms
- Delete confirmation rate: >80%
- List scroll performance: 60fps
- User satisfaction: >4.5/5.0

## Future Enhancements
- Project templates library
- Collaborative projects (sharing)
- Project tags & categories
- Advanced search filters
- Project analytics dashboard
- Bulk operations (archive, delete)
- Project export/import
