# Phase 46: Fork & Publish Templates

## Overview
Enable users to fork existing templates and publish their own projects as templates with metadata, thumbnails, and review process.

**Duration:** 2 days
**Dependencies:** [45]
**Owners:** Frontend Engineer, Backend Engineer

## Objectives
- Fork template functionality (one-click project creation)
- Publish project as template capability
- Template metadata editor (name, description, thumbnail, tags)
- Review & approval process for published templates
- Template versioning

## Technical Approach

### Fork & Publish Architecture
```yaml
Fork Flow:
  1. User selects template
  2. Click "Fork Template"
  3. Copy template_data to new project
  4. Increment fork_count
  5. Navigate to new project

Publish Flow:
  1. User selects project to publish
  2. Fill template metadata form
  3. Upload thumbnail & screenshots
  4. Submit for review (non-official users)
  5. Admin approval → status: published
  6. Auto-publish for official creators

Database:
  Templates: Existing table
  Template_forks: Track fork relationships
  Template_submissions: Review queue for admins
```

### Implementation Steps

#### 1. Fork Tracking Schema (2h)
```sql
-- supabase/migrations/046_fork_publish.sql

-- Track fork relationships
CREATE TABLE template_forks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(template_id, project_id)
);

-- Submission queue for non-official templates
CREATE TABLE template_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to increment fork count
CREATE OR REPLACE FUNCTION increment_fork_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET fork_count = fork_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_fork_count_trigger
AFTER INSERT ON template_forks
FOR EACH ROW
EXECUTE FUNCTION increment_fork_count();

-- RLS policies
ALTER TABLE template_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own forks"
  ON template_forks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create forks"
  ON template_forks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions"
  ON template_submissions FOR SELECT
  USING (auth.uid() = submitted_by);
```

#### 2. Fork Template Functionality (5h)
```typescript
// hooks/useForkTemplate.ts
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'expo-router';

export function useForkTemplate() {
  const supabase = useSupabase();
  const router = useRouter();

  const forkTemplate = async (templateId: string) => {
    try {
      // 1. Fetch template data
      const { data: template, error: fetchError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Create new project from template
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
          name: `${template.name} (Fork)`,
          description: template.description,
          user_id: (await supabase.auth.getUser()).data.user.id,
          template_id: templateId,

          // Copy template structure
          file_structure: template.template_data.file_structure,
          dependencies: template.template_data.dependencies,
          config: template.template_data.config,
        })
        .select()
        .single();

      if (createError) throw createError;

      // 3. Copy template files to new project
      await copyTemplateFiles(template.template_data.files, project.id);

      // 4. Copy assets (icons, sounds, backgrounds)
      if (template.template_data.assets) {
        await copyTemplateAssets(template.template_data.assets, project.id);
      }

      // 5. Record fork relationship
      await supabase
        .from('template_forks')
        .insert({
          template_id: templateId,
          project_id: project.id,
          user_id: (await supabase.auth.getUser()).data.user.id,
        });

      // 6. Navigate to new project
      router.push(`/projects/${project.id}`);

      return { success: true, projectId: project.id };

    } catch (error) {
      console.error('Fork failed:', error);
      return { success: false, error: error.message };
    }
  };

  return { forkTemplate };
}

// Helper: Copy template files to new project
async function copyTemplateFiles(files: any[], projectId: string) {
  const supabase = useSupabase();

  for (const file of files) {
    await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        path: file.path,
        content: file.content,
        type: file.type,
      });
  }
}

// Helper: Copy template assets
async function copyTemplateAssets(assets: any[], projectId: string) {
  const supabase = useSupabase();
  const user = (await supabase.auth.getUser()).data.user;

  for (const asset of assets) {
    // Download original asset
    const response = await fetch(asset.url);
    const blob = await response.blob();

    // Upload to new project's bucket
    const bucket = getBucketName(asset.type);
    const newPath = `${user.id}/${projectId}/${asset.name}`;

    const { data: uploadData, error } = await supabase.storage
      .from(bucket)
      .upload(newPath, blob);

    if (error) continue;

    // Create asset record
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(newPath);

    await supabase
      .from('project_assets')
      .insert({
        project_id: projectId,
        user_id: user.id,
        type: asset.type,
        name: asset.name,
        url: publicUrl.publicUrl,
        format: asset.format,
        metadata: asset.metadata,
      });
  }
}
```

#### 3. Publish Template UI (7h)
```typescript
// components/PublishTemplate.tsx
import { View, Text, TextInput, Button, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { usePublishTemplate } from '@/hooks/usePublishTemplate';

interface PublishTemplateProps {
  projectId: string;
}

export function PublishTemplate({ projectId }: PublishTemplateProps) {
  const { publishTemplate, loading } = usePublishTemplate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: [],
    thumbnailUri: null,
    previewImages: [],
  });

  const categories = [
    'social', 'ecommerce', 'productivity', 'finance',
    'entertainment', 'health', 'education', 'business'
  ];

  const handlePickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, thumbnailUri: result.assets[0].uri });
    }
  };

  const handlePickScreenshots = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri).slice(0, 5);
      setFormData({ ...formData, previewImages: uris });
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag.trim()] });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.thumbnailUri) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const result = await publishTemplate(projectId, formData);

    if (result.success) {
      Alert.alert(
        'Success',
        'Template submitted for review! You\'ll be notified when it\'s approved.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Publish as Template</Text>

      {/* Template Name */}
      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2">Template Name *</Text>
        <TextInput
          placeholder="My Awesome App Template"
          className="border border-gray-300 rounded-lg p-3"
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2">Description</Text>
        <TextInput
          placeholder="Describe what makes your template special..."
          className="border border-gray-300 rounded-lg p-3"
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={text => setFormData({ ...formData, description: text })}
        />
      </View>

      {/* Category */}
      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2">Category *</Text>
        <View className="flex-row flex-wrap gap-2">
          {categories.map(cat => (
            <Pressable
              key={cat}
              onPress={() => setFormData({ ...formData, category: cat })}
              className={`px-4 py-2 rounded-full ${
                formData.category === cat
                  ? 'bg-purple-500'
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                formData.category === cat ? 'text-white' : 'text-gray-700'
              }`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tags */}
      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2">Tags</Text>
        <View className="flex-row flex-wrap gap-2 mb-2">
          {formData.tags.map(tag => (
            <View key={tag} className="bg-purple-100 rounded-full px-3 py-1 flex-row items-center gap-1">
              <Text className="text-sm text-purple-700">{tag}</Text>
              <Pressable onPress={() => handleRemoveTag(tag)}>
                <XIcon size={14} color="#7c3aed" />
              </Pressable>
            </View>
          ))}
        </View>
        <TextInput
          placeholder="Add tag (e.g., authentication, payments)"
          className="border border-gray-300 rounded-lg p-3"
          onSubmitEditing={(e) => handleAddTag(e.nativeEvent.text)}
        />
      </View>

      {/* Thumbnail */}
      <View className="mb-4">
        <Text className="text-sm font-semibold mb-2">Thumbnail (16:9) *</Text>
        <Pressable
          onPress={handlePickThumbnail}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center"
        >
          {formData.thumbnailUri ? (
            <Image
              source={{ uri: formData.thumbnailUri }}
              className="w-full h-40 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <>
              <ImageIcon size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-2">Tap to upload thumbnail</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Preview Screenshots */}
      <View className="mb-6">
        <Text className="text-sm font-semibold mb-2">
          Screenshots (up to 5)
        </Text>
        <Pressable
          onPress={handlePickScreenshots}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center"
        >
          {formData.previewImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {formData.previewImages.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    className="w-32 h-56 rounded-lg"
                    resizeMode="cover"
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <>
              <ImageIcon size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-2">Tap to upload screenshots</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Submit */}
      <Button
        title="Submit Template for Review"
        onPress={handleSubmit}
        color="#8b5cf6"
        disabled={loading}
      />

      {/* Info */}
      <View className="mt-4 bg-blue-50 rounded-lg p-4">
        <Text className="text-sm text-blue-800">
          📝 Your template will be reviewed by our team before being published to the gallery. This usually takes 1-2 business days.
        </Text>
      </View>
    </ScrollView>
  );
}
```

#### 4. Publish Template Hook (2h)
```typescript
// hooks/usePublishTemplate.ts
import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import * as FileSystem from 'expo-file-system';

export function usePublishTemplate() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);

  const publishTemplate = async (projectId: string, formData: any) => {
    setLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;

      // 1. Upload thumbnail
      const thumbnailUrl = await uploadImage(
        formData.thumbnailUri,
        `templates/${user.id}/thumbnails`,
        'template_thumbnails'
      );

      // 2. Upload preview images
      const previewUrls = await Promise.all(
        formData.previewImages.map((uri, i) =>
          uploadImage(
            uri,
            `templates/${user.id}/previews`,
            'template_previews'
          )
        )
      );

      // 3. Gather project data
      const { data: project } = await supabase
        .from('projects')
        .select('*, project_files(*), project_assets(*)')
        .eq('id', projectId)
        .single();

      // 4. Create template record
      const templateData = {
        file_structure: project.file_structure,
        dependencies: project.dependencies,
        config: project.config,
        files: project.project_files,
        assets: project.project_assets,
      };

      const { data: template, error } = await supabase
        .from('templates')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: formData.tags,
          thumbnail_url: thumbnailUrl,
          preview_images: previewUrls,
          template_data: templateData,
          created_by: user.id,
          is_official: false,
          status: 'draft', // Will be set to 'published' after review
        })
        .select()
        .single();

      if (error) throw error;

      // 5. Submit for review
      await supabase
        .from('template_submissions')
        .insert({
          template_id: template.id,
          submitted_by: user.id,
          status: 'pending',
        });

      return { success: true, templateId: template.id };

    } catch (error) {
      console.error('Publish failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (
    uri: string,
    path: string,
    bucket: string
  ): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const filename = `${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${path}/${filename}`, buffer, {
        contentType: 'image/png',
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${path}/${filename}`);

    return urlData.publicUrl;
  };

  return { publishTemplate, loading };
}
```

## Key Tasks

### Database & Schema
- [ ] Create template_forks table
- [ ] Create template_submissions table
- [ ] Add fork count trigger
- [ ] Setup RLS policies
- [ ] Create Storage buckets for thumbnails

### Fork Functionality
- [ ] Implement forkTemplate hook
- [ ] Copy template files to project
- [ ] Copy template assets
- [ ] Record fork relationship
- [ ] Increment fork count

### Publish Functionality
- [ ] Build PublishTemplate UI
- [ ] Add metadata form
- [ ] Implement image upload
- [ ] Create submission record
- [ ] Add review queue for admins

## Acceptance Criteria
- [ ] Fork creates complete project copy
- [ ] Fork count increments correctly
- [ ] Publish form validates input
- [ ] Thumbnail uploads successfully
- [ ] Submissions enter review queue
- [ ] Navigation works after fork
- [ ] Asset copying preserves quality

## Testing Strategy

### Unit Tests
```typescript
describe('Fork Template', () => {
  it('creates project from template', async () => {
    const result = await forkTemplate(templateId);
    expect(result.success).toBe(true);
    expect(result.projectId).toBeDefined();
  });

  it('increments fork count', async () => {
    const before = template.fork_count;
    await forkTemplate(template.id);
    const after = (await getTemplate(template.id)).fork_count;
    expect(after).toBe(before + 1);
  });
});

describe('Publish Template', () => {
  it('creates template record', async () => {
    const result = await publishTemplate(projectId, formData);
    expect(result.success).toBe(true);
  });

  it('creates submission for review', async () => {
    await publishTemplate(projectId, formData);
    const submissions = await getSubmissions(user.id);
    expect(submissions.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
- Test fork workflow end-to-end
- Verify file copying
- Test asset duplication
- Verify publish workflow
- Test image uploads

### Manual Testing
- Fork various template types
- Test publish form validation
- Verify thumbnail quality
- Check submission status
- Test navigation flows

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large template copy times | High | Background job, progress UI |
| Asset copying failures | Medium | Retry logic, partial success handling |
| Image upload size limits | Medium | Compression, size validation |
| Review queue backlog | Low | Admin dashboard, notifications |

## Success Metrics
- Fork success rate: >98%
- Average fork time: <5s
- Publish success rate: >95%
- Template approval rate: >80%
- Average review time: <48h

## Future Enhancements
- Template versioning (v1, v2, etc.)
- Auto-update forked projects from template
- Template marketplace with paid templates
- Community ratings influence approval
- Template diff viewer (compare versions)
