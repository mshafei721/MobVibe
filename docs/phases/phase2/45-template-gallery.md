# Phase 45: Template Gallery

## Overview
Browse and discover project templates organized by category with search, filter, and preview functionality.

**Duration:** 2 days
**Dependencies:** [44]
**Owners:** Frontend Engineer, Backend Engineer

## Objectives
- Template gallery UI with category organization
- Search & filter templates by category, tags, popularity
- Template preview cards with thumbnails
- Category-based navigation
- Featured & trending templates

## Technical Approach

### Template System Architecture
```yaml
Database:
  Table: templates
  Fields: id, name, description, category, tags, thumbnail_url,
          preview_images, fork_count, rating, is_featured, created_at

Categories:
  - Social Media (Instagram clone, Twitter clone)
  - E-commerce (Shopping cart, Product catalog)
  - Productivity (Todo app, Note taking)
  - Finance (Budget tracker, Expense manager)
  - Entertainment (Music player, Video streaming)
  - Health (Fitness tracker, Meal planner)
  - Education (Quiz app, Learning platform)
  - Business (CRM, Dashboard)

Views:
  - All Templates
  - By Category
  - Featured
  - Trending (most forked this week)
  - New (last 30 days)
```

### Implementation Steps

#### 1. Template Database Schema (2h)
```sql
-- supabase/migrations/045_templates.sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Creator
  created_by UUID REFERENCES auth.users(id),
  is_official BOOLEAN DEFAULT false, -- Created by MobVibe team

  -- Media
  thumbnail_url TEXT,
  preview_images TEXT[] DEFAULT '{}', -- Up to 5 screenshots
  demo_video_url TEXT,

  -- Template content
  template_data JSONB NOT NULL, -- Project structure, code, assets
  tech_stack TEXT[] DEFAULT '{}', -- React, TypeScript, Supabase, etc.

  -- Metadata
  fork_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Full text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' '))
  ) STORED
);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_featured ON templates(is_featured);
CREATE INDEX idx_templates_fork_count ON templates(fork_count DESC);
CREATE INDEX idx_templates_created ON templates(created_at DESC);
CREATE INDEX idx_templates_search ON templates USING GIN(search_vector);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);

-- Template reviews
CREATE TABLE template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(template_id, user_id)
);

-- RLS policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published templates"
  ON templates FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = created_by);
```

#### 2. Template Gallery Component (8h)
```typescript
// components/TemplateGallery.tsx
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useTemplates } from '@/hooks/useTemplates';

export function TemplateGallery() {
  const { templates, loading, searchTemplates, filterByCategory } = useTemplates();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'all' | 'featured' | 'trending' | 'new'>('all');

  const categories = [
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'ecommerce', label: 'E-commerce', icon: '🛒' },
    { id: 'productivity', label: 'Productivity', icon: '✅' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'health', label: 'Health', icon: '🏃' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'business', label: 'Business', icon: '💼' },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchTemplates(query);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    filterByCategory(categoryId === selectedCategory ? null : categoryId);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold mb-4">Template Gallery</Text>

        {/* Search Bar */}
        <TextInput
          placeholder="Search templates..."
          className="border border-gray-300 rounded-lg p-3 mb-4"
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {/* View Filter */}
        <View className="flex-row gap-2 mb-4">
          {['all', 'featured', 'trending', 'new'].map(v => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              className={`px-4 py-2 rounded-full ${
                view === v ? 'bg-purple-500' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                view === v ? 'text-white' : 'text-gray-700'
              }`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {categories.map(cat => (
              <Pressable
                key={cat.id}
                onPress={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-purple-500'
                    : 'bg-gray-100'
                }`}
              >
                <Text className="text-base">{cat.icon}</Text>
                <Text className={`text-sm font-medium ${
                  selectedCategory === cat.id ? 'text-white' : 'text-gray-700'
                }`}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Template Grid */}
      <FlatList
        data={templates}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TemplateCard template={item} />
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500">No templates found</Text>
          </View>
        }
      />
    </View>
  );
}

// Template Card Component
function TemplateCard({ template }: Props) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/templates/${template.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-200"
    >
      {/* Thumbnail */}
      <View className="relative">
        <Image
          source={{ uri: template.thumbnail_url }}
          className="w-full h-40"
          resizeMode="cover"
        />

        {/* Featured Badge */}
        {template.is_featured && (
          <View className="absolute top-2 left-2 bg-yellow-500 rounded-full px-2 py-1">
            <Text className="text-white text-xs font-bold">⭐ Featured</Text>
          </View>
        )}

        {/* Official Badge */}
        {template.is_official && (
          <View className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
            <CheckBadgeIcon size={16} color="white" />
          </View>
        )}
      </View>

      {/* Template Info */}
      <View className="p-3">
        <Text className="font-bold text-gray-900 mb-1" numberOfLines={1}>
          {template.name}
        </Text>
        <Text className="text-xs text-gray-600 mb-2" numberOfLines={2}>
          {template.description}
        </Text>

        {/* Stats */}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <StarIcon size={14} color="#fbbf24" />
            <Text className="text-xs text-gray-600">
              {template.rating.toFixed(1)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <ForkIcon size={14} color="#666" />
            <Text className="text-xs text-gray-600">
              {formatNumber(template.fork_count)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <EyeIcon size={14} color="#666" />
            <Text className="text-xs text-gray-600">
              {formatNumber(template.view_count)}
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View className="flex-row flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 3).map(tag => (
            <View key={tag} className="bg-gray-100 rounded px-2 py-1">
              <Text className="text-xs text-gray-600">{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}
```

#### 3. Template Hooks (4h)
```typescript
// hooks/useTemplates.ts
import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

export function useTemplates() {
  const supabase = useSupabase();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async (options = {}) => {
    let query = supabase
      .from('templates')
      .select('*')
      .eq('status', 'published');

    // Apply filters
    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.view === 'featured') {
      query = query.eq('is_featured', true);
    } else if (options.view === 'trending') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .gte('created_at', weekAgo)
        .order('fork_count', { ascending: false });
    } else if (options.view === 'new') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .gte('created_at', monthAgo)
        .order('created_at', { ascending: false });
    } else {
      query = query.order('fork_count', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (!error) setTemplates(data);
    setLoading(false);
  };

  const searchTemplates = async (query: string) => {
    if (!query.trim()) {
      fetchTemplates();
      return;
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .textSearch('search_vector', query)
      .eq('status', 'published');

    if (!error) setTemplates(data);
  };

  const filterByCategory = async (category: string | null) => {
    fetchTemplates({ category });
  };

  const getTemplateById = async (templateId: string) => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    // Increment view count
    if (!error) {
      await supabase
        .from('templates')
        .update({ view_count: data.view_count + 1 })
        .eq('id', templateId);
    }

    return data;
  };

  return {
    templates,
    loading,
    searchTemplates,
    filterByCategory,
    getTemplateById,
    refresh: fetchTemplates
  };
}
```

## Key Tasks

### Database & Schema
- [ ] Create templates table
- [ ] Add template_reviews table
- [ ] Setup full-text search
- [ ] Add indexes for performance
- [ ] Configure RLS policies

### UI Components
- [ ] Build TemplateGallery component
- [ ] Create TemplateCard component
- [ ] Add search bar
- [ ] Implement category chips
- [ ] Add view filters (featured, trending, new)

### Template Discovery
- [ ] Implement search functionality
- [ ] Add category filtering
- [ ] Build trending algorithm
- [ ] Add featured templates
- [ ] Track view counts

## Acceptance Criteria
- [ ] Templates displayed in grid
- [ ] Search works with full-text
- [ ] Category filter functional
- [ ] Featured templates highlighted
- [ ] Trending section updates weekly
- [ ] View counts increment
- [ ] Cards show key stats

## Testing Strategy

### Unit Tests
```typescript
describe('Template Gallery', () => {
  it('fetches all published templates', async () => {
    const { templates } = useTemplates();
    expect(templates.every(t => t.status === 'published')).toBe(true);
  });

  it('filters templates by category', async () => {
    await filterByCategory('social');
    expect(templates.every(t => t.category === 'social')).toBe(true);
  });

  it('searches templates by text', async () => {
    await searchTemplates('instagram');
    expect(templates.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
- Test search functionality
- Verify category filtering
- Test trending calculation
- Verify view count increment
- Test template card rendering

### Manual Testing
- Search relevance
- Category accuracy
- Card layout on different screens
- Performance with 50+ templates
- Featured badge visibility

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slow search performance | Medium | Full-text search indexes, caching |
| Poor template discovery | Medium | Trending algorithm, featured section |
| Large thumbnail sizes | Low | CDN caching, WebP format |
| Category imbalance | Low | Curated featured templates |

## Success Metrics
- Template gallery load time: <2s
- Search response time: <500ms
- Average templates per category: >5
- Template view rate: >40%
- Fork rate from gallery: >15%

## Future Enhancements
- Template collections (curated sets)
- User-created template lists
- Template recommendations based on history
- Advanced filters (tech stack, difficulty)
- Template ratings & reviews display
