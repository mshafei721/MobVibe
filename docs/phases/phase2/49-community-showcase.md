# Phase 49: Community Showcase

## Overview
Create a community-driven platform for discovering, rating, and featuring outstanding projects built with MobVibe.

**Duration:** 2 days
**Dependencies:** [48]
**Owners:** Frontend Engineer, Backend Engineer
**MCP Tools:** websearch: false, context7: true, sequentialthinking: true

## Objectives
- Featured projects section
- Community ratings & reviews
- Trending & popular apps discovery
- User profiles & portfolios

## Technical Approach

### Data Model
```typescript
// types/community.ts
interface FeaturedProject {
  id: string;
  project_id: string;
  featured_at: string;
  featured_by: string; // Admin user ID
  featured_until?: string;
  category: 'editor_pick' | 'trending' | 'community_favorite';
  sort_order: number;
  description_override?: string;
}

interface ProjectRating {
  id: string;
  project_id: string;
  user_id: string;
  rating: number; // 1-5
  review?: string;
  created_at: string;
  updated_at?: string;
  helpful_count: number;
}

interface ProjectStats {
  project_id: string;
  view_count: number;
  fork_count: number;
  rating_average: number;
  rating_count: number;
  comment_count: number;
  trending_score: number; // Calculated metric
  updated_at: string;
}

interface UserProfile {
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  github_url?: string;
  twitter_handle?: string;
  projects_count: number;
  followers_count: number;
  following_count: number;
}

interface TrendingAlgorithm {
  // Trending score = (views * 0.1) + (forks * 5) + (rating_avg * rating_count * 2)
  // Decayed by time: score * decay_factor(days_since_update)
  views_weight: number;
  forks_weight: number;
  ratings_weight: number;
  time_decay: number;
}
```

### Implementation Steps

#### 1. Database Schema (4h)
```sql
-- Featured projects
CREATE TABLE featured_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  featured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  featured_by UUID NOT NULL REFERENCES auth.users(id),
  featured_until TIMESTAMPTZ,
  category TEXT NOT NULL CHECK (category IN ('editor_pick', 'trending', 'community_favorite')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  description_override TEXT,
  UNIQUE(project_id, category)
);

-- Ratings & reviews
CREATE TABLE project_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, user_id)
);

-- Project statistics (materialized view)
CREATE TABLE project_stats (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  fork_count INTEGER NOT NULL DEFAULT 0,
  rating_average DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  trending_score DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  github_url TEXT,
  twitter_handle TEXT,
  projects_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User follows (for portfolio discovery)
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- RLS Policies
CREATE POLICY "Anyone can view featured projects"
  ON featured_projects FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view ratings"
  ON project_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings"
  ON project_ratings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings"
  ON project_ratings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view stats"
  ON project_stats FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_featured_category ON featured_projects(category, sort_order);
CREATE INDEX idx_featured_until ON featured_projects(featured_until);
CREATE INDEX idx_ratings_project ON project_ratings(project_id);
CREATE INDEX idx_stats_trending ON project_stats(trending_score DESC);
CREATE INDEX idx_stats_rating ON project_stats(rating_average DESC, rating_count DESC);
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  views INTEGER,
  forks INTEGER,
  rating_avg DECIMAL,
  rating_count INTEGER,
  days_old INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  base_score DECIMAL;
  decay_factor DECIMAL;
BEGIN
  -- Base score calculation
  base_score := (views * 0.1) + (forks * 5) + (rating_avg * rating_count * 2);

  -- Time decay (exponential decay over 30 days)
  decay_factor := POWER(0.95, days_old);

  RETURN base_score * decay_factor;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project stats
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_stats (project_id, rating_average, rating_count)
  SELECT
    NEW.project_id,
    AVG(rating)::DECIMAL(3, 2),
    COUNT(*)
  FROM project_ratings
  WHERE project_id = NEW.project_id
  ON CONFLICT (project_id)
  DO UPDATE SET
    rating_average = EXCLUDED.rating_average,
    rating_count = EXCLUDED.rating_count,
    trending_score = calculate_trending_score(
      project_stats.view_count,
      project_stats.fork_count,
      EXCLUDED.rating_average,
      EXCLUDED.rating_count,
      EXTRACT(DAY FROM NOW() - (SELECT created_at FROM projects WHERE id = NEW.project_id))::INTEGER
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_rating
  AFTER INSERT OR UPDATE OR DELETE ON project_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stats();
```

#### 2. Community Discovery API (5h)
```typescript
// backend/functions/community/featured.ts
export const getFeaturedProjects = async (req: Request, res: Response) => {
  const { category, limit = 10 } = req.query;

  try {
    let query = supabase
      .from('featured_projects')
      .select(`
        *,
        projects (
          id,
          name,
          description,
          icon_url,
          preview_url,
          framework,
          created_at
        ),
        project_stats (*)
      `)
      .order('sort_order', { ascending: true })
      .limit(Number(limit));

    if (category) {
      query = query.eq('category', category);
    }

    // Filter out expired features
    query = query.or('featured_until.is.null,featured_until.gte.now()');

    const { data, error } = await query;
    if (error) throw error;

    res.json({ featured: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured projects' });
  }
};

// backend/functions/community/trending.ts
export const getTrendingProjects = async (req: Request, res: Response) => {
  const { timeframe = '7d', limit = 20 } = req.query;

  try {
    const cutoffDate = calculateCutoff(timeframe as string);

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_stats (*)
      `)
      .gte('created_at', cutoffDate)
      .order('project_stats.trending_score', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ trending: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending projects' });
  }
};

function calculateCutoff(timeframe: string): string {
  const now = new Date();
  switch (timeframe) {
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

// backend/functions/community/popular.ts
export const getPopularProjects = async (req: Request, res: Response) => {
  const { limit = 20 } = req.query;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_stats (*)
      `)
      .order('project_stats.rating_average', { ascending: false })
      .gte('project_stats.rating_count', 5) // Minimum 5 ratings
      .limit(Number(limit));

    if (error) throw error;

    res.json({ popular: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular projects' });
  }
};
```

#### 3. Rating & Review System (4h)
```typescript
// backend/functions/ratings/create.ts
export const createRating = async (req: Request, res: Response) => {
  const { project_id, rating, review } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const { data, error } = await supabase
      .from('project_ratings')
      .insert({
        project_id,
        user_id: req.user.id,
        rating,
        review: review?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'You already rated this project' });
      }
      throw error;
    }

    res.json({ rating: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rating' });
  }
};

// backend/functions/ratings/helpful.ts
export const markHelpful = async (req: Request, res: Response) => {
  const { rating_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('project_ratings')
      .update({ helpful_count: supabase.raw('helpful_count + 1') })
      .eq('id', rating_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ rating: data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as helpful' });
  }
};
```

#### 4. Community Showcase UI (7h)
```typescript
// screens/CommunityScreen.tsx
export function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<'featured' | 'trending' | 'popular'>('featured');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const endpoint = {
        featured: '/api/community/featured',
        trending: '/api/community/trending',
        popular: '/api/community/popular',
      }[activeTab];

      const response = await fetch(endpoint);
      const data = await response.json();

      setProjects(data[activeTab] || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-2xl font-bold mb-4">Community Showcase</Text>

        {/* Tabs */}
        <View className="flex-row gap-2">
          {(['featured', 'trending', 'popular'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === tab ? 'bg-purple-500' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-center font-medium ${
                activeTab === tab ? 'text-white' : 'text-gray-700'
              }`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Project List */}
      {loading ? (
        <ActivityIndicator className="mt-8" size="large" color="#8b5cf6" />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => <CommunityProjectCard project={item} />}
        />
      )}
    </View>
  );
}

// components/CommunityProjectCard.tsx
export function CommunityProjectCard({ project }: { project: any }) {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('CommunityProjectDetails', { projectId: project.id });
  };

  const handleFork = async () => {
    // Fork logic from Phase 46
  };

  const stats = project.project_stats;

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
    >
      {/* Preview Image */}
      {project.preview_url && (
        <Image
          source={{ uri: project.preview_url }}
          className="w-full h-48"
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View className="p-4">
        <View className="flex-row items-start mb-2">
          {/* Icon */}
          <Image
            source={{ uri: project.icon_url }}
            className="w-12 h-12 rounded-lg mr-3"
          />

          {/* Info */}
          <View className="flex-1">
            <Text className="text-lg font-bold mb-1">{project.name}</Text>
            {project.description && (
              <Text className="text-gray-600 text-sm" numberOfLines={2}>
                {project.description}
              </Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row items-center gap-4 mb-3">
          <View className="flex-row items-center">
            <StarIcon size={16} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-gray-600 text-sm ml-1">
              {stats?.rating_average?.toFixed(1) || '0.0'} ({stats?.rating_count || 0})
            </Text>
          </View>

          <View className="flex-row items-center">
            <EyeIcon size={16} color="#9ca3af" />
            <Text className="text-gray-600 text-sm ml-1">
              {formatNumber(stats?.view_count || 0)}
            </Text>
          </View>

          <View className="flex-row items-center">
            <ForkIcon size={16} color="#9ca3af" />
            <Text className="text-gray-600 text-sm ml-1">
              {formatNumber(stats?.fork_count || 0)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={handlePress}
            className="flex-1 bg-purple-500 rounded-lg py-2 items-center"
          >
            <Text className="text-white font-medium">View</Text>
          </Pressable>

          <Pressable
            onPress={handleFork}
            className="flex-1 bg-gray-200 rounded-lg py-2 items-center"
          >
            <Text className="text-gray-700 font-medium">Fork</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// components/RatingForm.tsx
export function RatingForm({ projectId, onSubmit }: any) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ratings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, rating, review }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      Alert.alert('Success', 'Rating submitted!');
      onSubmit?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-white rounded-lg p-4">
      <Text className="text-lg font-bold mb-3">Rate This Project</Text>

      {/* Star Rating */}
      <View className="flex-row justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <StarIcon
              size={32}
              color="#fbbf24"
              fill={star <= rating ? '#fbbf24' : 'transparent'}
            />
          </Pressable>
        ))}
      </View>

      {/* Review Text */}
      <TextInput
        value={review}
        onChangeText={setReview}
        placeholder="Share your thoughts (optional)..."
        multiline
        numberOfLines={4}
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
      />

      <Button
        title={loading ? 'Submitting...' : 'Submit Rating'}
        onPress={handleSubmit}
        disabled={loading || rating === 0}
        color="#8b5cf6"
      />
    </View>
  );
}
```

## Key Tasks

### Backend
- [ ] Create featured_projects table
- [ ] Create project_ratings table
- [ ] Create project_stats table
- [ ] Create user_profiles table
- [ ] Implement trending algorithm
- [ ] Build rating APIs
- [ ] Build discovery APIs
- [ ] Stats update triggers

### Frontend
- [ ] CommunityScreen with tabs
- [ ] CommunityProjectCard
- [ ] Rating form component
- [ ] User profile screen
- [ ] Featured section UI
- [ ] Trending algorithm display
- [ ] Popular projects list

## Acceptance Criteria
- [ ] Featured projects displayed
- [ ] Trending algorithm works
- [ ] Users can rate projects (1-5 stars)
- [ ] Reviews support text
- [ ] Stats update in real-time
- [ ] User profiles viewable
- [ ] Portfolios browsable
- [ ] Discovery filters work

## Testing Strategy

### Unit Tests
```typescript
describe('Community Features', () => {
  it('calculates trending score', () => {
    const score = calculateTrendingScore(100, 5, 4.5, 10, 2);
    expect(score).toBeGreaterThan(0);
  });

  it('validates rating range', async () => {
    await expect(createRating(projectId, 6)).rejects.toThrow();
  });
});
```

### Integration Tests
- Create rating → Update stats
- Feature project → Display in list
- Calculate trending → Sort correctly
- User profile → Show projects

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rating manipulation | High | One rating per user, rate limiting |
| Trending gaming | Medium | Time decay, multiple metrics |
| Scaling stats updates | Medium | Materialized views, caching |
| Spam reviews | Medium | Moderation queue, reporting |

## Success Metrics
- Community engagement: >40% users rate projects
- Featured click-through: >60%
- Trending accuracy: >80% user satisfaction
- Rating distribution: Healthy bell curve
- Profile views: >50% of users view profiles

## Future Enhancements
- Collections & lists
- Awards & badges
- Creator verification
- Sponsored showcases
- Algorithm customization
- Content moderation tools
