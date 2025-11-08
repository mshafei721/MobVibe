# Project Management System

**Phase:** 26
**Status:** Backend Complete (Mobile Deferred)
**Owner:** Backend Engineer

## Overview

Complete project lifecycle management system enabling users to create, view, update, and delete their mobile app projects. Implements full CRUD operations, search/filter capabilities, and metadata tracking through enhanced database schema and Row-Level Security policies.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                           │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Project  │  │  Project  │  │  Create  │  │  Project │ │
│  │   List    │  │   Card    │  │  Project │  │  Details │ │
│  │  Screen   │  │ Component │  │  Screen  │  │  Screen  │ │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘ │
│        │              │              │              │       │
│        └──────────────┴──────────────┴──────────────┘       │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ Supabase Client (Direct)
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                    Supabase Database                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  projects Table                        │  │
│  │                                                        │  │
│  │  • id, user_id, name, description                     │  │
│  │  • framework, template, icon_url                      │  │
│  │  • status, metadata (JSONB)                           │  │
│  │  • created_at, updated_at, last_modified              │  │
│  │  • icon_updated_at                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           Row-Level Security (RLS) Policies           │  │
│  │                                                        │  │
│  │  SELECT:  auth.uid() = user_id                        │  │
│  │  INSERT:  auth.uid() = user_id                        │  │
│  │  UPDATE:  auth.uid() = user_id                        │  │
│  │  DELETE:  auth.uid() = user_id                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                      Indexes                           │  │
│  │                                                        │  │
│  │  • user_id (B-tree)                                   │  │
│  │  • status (B-tree)                                    │  │
│  │  • created_at DESC (B-tree)                           │  │
│  │  • last_modified DESC (B-tree)                        │  │
│  │  • icon_url (B-tree, partial)                         │  │
│  │  • Full-text search (GIN)                             │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## Database Schema

### Projects Table

```sql
CREATE TABLE projects (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Core Info
  name TEXT NOT NULL,
  description TEXT,

  -- Framework & Template
  framework TEXT DEFAULT 'react-native'
    CHECK (framework IN ('react-native', 'flutter', 'ionic')),
  template TEXT,
  template_id TEXT, -- Legacy, kept for compatibility

  -- Configuration
  expo_config JSONB,
  sandbox_id TEXT,

  -- Visual
  icon_url TEXT,
  icon_updated_at TIMESTAMPTZ,

  -- Status & Lifecycle
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived', 'deleted')),

  -- Metadata
  metadata JSONB DEFAULT '{
    "screens_count": 0,
    "code_size_kb": 0
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);
```

### Metadata Structure

```typescript
interface ProjectMetadata {
  screens_count: number         // Number of screens in the app
  code_size_kb: number          // Total code size in KB
  last_build?: string           // ISO timestamp of last successful build
  dependencies?: string[]       // NPM package names
  last_preview?: string         // Last preview URL
  error_count?: number          // Number of compilation errors
  warning_count?: number        // Number of warnings
}
```

### Status Lifecycle

```
draft → active → archived → deleted
  ↓       ↓         ↓
  └───────┴─────────┘ (can move between any states)
```

**Status Definitions**:
- `draft`: Initial state, project created but not fully configured
- `active`: Project in active development
- `archived`: Project completed or paused (hidden from main list)
- `deleted`: Soft-deleted (permanently removed after 30 days)

## CRUD Operations

### Create Project

**Mobile Implementation** (Deferred):
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    name: 'My Awesome App',
    description: 'A great mobile app',
    framework: 'react-native',
    template: 'blank',
    status: 'draft',
    metadata: {
      screens_count: 0,
      code_size_kb: 0,
    },
  })
  .select()
  .single()
```

**Security**: RLS ensures `user_id` is automatically set to `auth.uid()`

**Validation**:
- Name: Required, 1-100 characters
- Description: Optional, max 500 characters
- Framework: Must be one of `react-native`, `flutter`, `ionic`
- Status: Defaults to `draft`

### Read Projects

**List All Projects**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('last_modified', { ascending: false })
```

**Filter by Status**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'active')
  .order('last_modified', { ascending: false })
```

**Full-Text Search**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .textSearch('name', searchQuery)
  .order('last_modified', { ascending: false })
```

**Get Single Project**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single()
```

### Update Project

**Update Basic Info**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .update({
    name: 'Updated Name',
    description: 'Updated description',
  })
  .eq('id', projectId)
  .select()
  .single()
```

**Update Status**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .update({ status: 'archived' })
  .eq('id', projectId)
```

**Update Metadata**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .update({
    metadata: {
      screens_count: 5,
      code_size_kb: 1024,
      last_build: new Date().toISOString(),
    },
  })
  .eq('id', projectId)
```

**Auto-Update Timestamps**: `updated_at` and `last_modified` are automatically updated via database trigger

### Delete Project

**Soft Delete** (Recommended):
```typescript
const { error } = await supabase
  .from('projects')
  .update({ status: 'deleted' })
  .eq('id', projectId)
```

**Hard Delete** (Permanent):
```typescript
// Delete associated files first
await supabase.storage
  .from('project-icons')
  .remove([`${user.id}/${projectId}/`])

// Delete project record
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)
```

**Cascade Behavior**:
- Deleting a project deletes all associated `coding_sessions` (foreign key cascade)
- Deleting a project does **not** delete storage files automatically
- Storage files must be deleted separately

## Search & Filter

### Full-Text Search Implementation

**Index**:
```sql
CREATE INDEX idx_projects_search
  ON projects
  USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
```

**Query**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .textSearch('name,description', searchQuery, {
    type: 'websearch',
    config: 'english',
  })
```

**Features**:
- Stemming (e.g., "running" matches "run")
- Stop word removal (e.g., "the", "a")
- Ranking by relevance
- Supports phrase searches ("exact match")

### Filter Combinations

**Multiple Filters**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'active')
  .eq('framework', 'react-native')
  .textSearch('name', searchQuery)
  .order('last_modified', { ascending: false })
```

**Date Range**:
```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .gte('created_at', startDate)
  .lte('created_at', endDate)
```

**Pagination**:
```typescript
const pageSize = 20
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('last_modified', { ascending: false })
```

## Mobile Components (Deferred)

### ProjectListScreen

**Features**:
- Search bar with debouncing
- Status filter pills (all, draft, active, archived)
- Project cards in scrollable list
- Pull-to-refresh
- Empty state
- FAB create button

**Layout**:
```
┌─────────────────────────────────┐
│  My Projects             [+]    │
├─────────────────────────────────┤
│  [Search projects...]           │
│  [All] [Draft] [Active] [...]   │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ [Icon] Project Name       │  │
│  │        Description...     │  │
│  │        [Status] 2h ago    │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ [Icon] Another Project    │  │
│  │        Description...     │  │
│  │        [Status] 1d ago    │  │
│  └───────────────────────────┘  │
│                                 │
│           [FAB +]               │
└─────────────────────────────────┘
```

### ProjectCard Component

**Visual Elements**:
- Project icon (or first letter fallback)
- Name (bold, 1 line)
- Description (gray, 2 lines max)
- Status badge (colored pill)
- Time since last modified
- Metadata (screens count, code size)
- Context menu (long-press)

**Interactions**:
- Tap → Navigate to project details
- Long-press → Show context menu
- Context menu → Edit, Duplicate, Archive, Delete

### CreateProjectScreen

**Form Fields**:
- Project Name (required)
- Description (optional, multiline)
- Framework selection (radio buttons)
- Template selection (dropdown)
- Icon generation (optional, links to Phase 25)

**Validation**:
- Name required (1-100 chars)
- Description optional (max 500 chars)
- Framework required (default: react-native)

### ProjectDetailsScreen

**Sections**:
- Header (icon, name, status)
- Quick actions (Edit, Preview, Share)
- Metadata (created, modified, screens, size)
- Recent sessions (last 5 coding sessions)
- Settings (Framework, Template, Archive)
- Danger zone (Delete)

## Security

### Row-Level Security (RLS)

**Policies** (Already Implemented in Phase 11):
```sql
-- Users can only view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create projects for themselves
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

**Security Guarantees**:
- ✅ Users cannot view other users' projects
- ✅ Users cannot create projects on behalf of others
- ✅ Users cannot modify other users' projects
- ✅ Users cannot delete other users' projects
- ✅ SQL injection protected (parameterized queries)
- ✅ XSS protected (React Native escapes by default)

### Input Validation

**Client-Side** (Mobile):
```typescript
function validateProjectName(name: string): string | null {
  if (!name.trim()) return 'Name is required'
  if (name.length > 100) return 'Name too long (max 100 chars)'
  return null
}

function validateDescription(desc: string): string | null {
  if (desc.length > 500) return 'Description too long (max 500 chars)'
  return null
}
```

**Database-Side** (Constraints):
- `name` NOT NULL
- `framework` CHECK constraint (3 valid values)
- `status` CHECK constraint (4 valid values)
- `user_id` foreign key constraint

## Performance

### Query Performance

**Index Usage**:
```sql
-- User's projects (uses user_id index)
SELECT * FROM projects WHERE user_id = '...' ORDER BY last_modified DESC;

-- Filter by status (uses status index)
SELECT * FROM projects WHERE user_id = '...' AND status = 'active';

-- Full-text search (uses GIN index)
SELECT * FROM projects WHERE to_tsvector('english', name || ' ' || description) @@ to_tsquery('search');
```

**Expected Query Times**:
- List projects: <50ms (with index)
- Search projects: <100ms (with GIN index)
- Get single project: <10ms (primary key lookup)
- Create project: <50ms
- Update project: <50ms
- Delete project: <100ms (with cascade)

### Optimization Strategies

**Pagination**:
```typescript
// Load 20 projects at a time
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .range(0, 19)
  .order('last_modified', { ascending: false })
```

**Debounced Search**:
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    fetchProjects(query)
  }, 300),
  []
)
```

**Optimistic Updates**:
```typescript
// Immediately update UI, rollback on error
const optimisticUpdate = async (projectId: string, updates: Partial<Project>) => {
  const oldProjects = [...projects]
  setProjects(projects.map(p => p.id === projectId ? { ...p, ...updates } : p))

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)

  if (error) {
    setProjects(oldProjects) // Rollback
    Alert.alert('Error', 'Update failed')
  }
}
```

**Caching**:
```typescript
// Cache projects list for 5 minutes
const [projects, setProjects] = useState<Project[]>([])
const [lastFetch, setLastFetch] = useState<Date | null>(null)

const fetchProjects = async (force = false) => {
  if (!force && lastFetch && Date.now() - lastFetch.getTime() < 5 * 60 * 1000) {
    return // Use cached data
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')

  if (!error) {
    setProjects(data)
    setLastFetch(new Date())
  }
}
```

## Error Handling

### Common Errors

1. **Unique Constraint Violation** (duplicate name)
   - Status: 409 Conflict
   - Message: "Project name already exists"
   - Solution: Prompt user to choose different name

2. **Foreign Key Violation** (invalid user_id)
   - Status: 403 Forbidden
   - Message: "Unauthorized"
   - Solution: Re-authenticate user

3. **RLS Policy Violation** (accessing other user's project)
   - Status: 403 Forbidden
   - Message: "Access denied"
   - Solution: Redirect to user's own projects

4. **Not Found** (deleted project)
   - Status: 404 Not Found
   - Message: "Project not found"
   - Solution: Remove from local cache, refresh list

5. **Rate Limit** (too many requests)
   - Status: 429 Too Many Requests
   - Message: "Too many requests, try again later"
   - Solution: Implement exponential backoff

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string          // e.g., "PGRST116" (Supabase error code)
    message: string       // Human-readable message
    details: string       // Technical details
    hint: string          // Suggested fix
  }
}
```

### User-Friendly Error Messages

```typescript
function getErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case '23505': // Unique violation
      return 'A project with this name already exists'
    case '23503': // Foreign key violation
      return 'Unable to create project. Please sign in again.'
    case 'PGRST301': // RLS violation
      return 'You do not have access to this project'
    default:
      return 'Something went wrong. Please try again.'
  }
}
```

## Testing

### Database Tests

```typescript
describe('Projects Table', () => {
  it('enforces RLS policies', async () => {
    const user1 = await createTestUser()
    const user2 = await createTestUser()

    const project = await createProject(user1, { name: 'Test' })

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single()

    expect(data).toBeNull() // User 2 cannot see User 1's project
    expect(error).toBeDefined()
  })

  it('cascades delete to sessions', async () => {
    const project = await createProject(user, { name: 'Test' })
    const session = await createSession(project.id)

    await supabase.from('projects').delete().eq('id', project.id)

    const { data } = await supabase
      .from('coding_sessions')
      .select('*')
      .eq('id', session.id)

    expect(data).toEqual([]) // Session deleted
  })
})
```

### Integration Tests

```typescript
describe('Project CRUD', () => {
  it('creates project', async () => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: 'Test App', framework: 'react-native' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.id).toBeDefined()
    expect(data.status).toBe('draft')
  })

  it('searches projects', async () => {
    await createProject(user, { name: 'Finance App', description: 'Budgeting' })
    await createProject(user, { name: 'Fitness App', description: 'Health tracker' })

    const { data } = await supabase
      .from('projects')
      .select('*')
      .textSearch('name,description', 'finance')

    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Finance App')
  })
})
```

## Migration Strategy

### Applying Migration 014

```bash
# Development
supabase db push

# Production
supabase db push --linked
```

### Rollback Plan

```sql
-- Rollback migration 014
ALTER TABLE projects
  DROP COLUMN IF EXISTS framework,
  DROP COLUMN IF EXISTS template,
  DROP COLUMN IF EXISTS last_modified,
  DROP COLUMN IF EXISTS metadata;

DROP INDEX IF EXISTS idx_projects_search;
DROP INDEX IF EXISTS idx_projects_last_modified;

-- Restore original status constraint
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('active', 'archived', 'deleted'));

-- Restore original trigger
DROP TRIGGER IF EXISTS projects_update_timestamps ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Data Migration

**Existing Projects**:
- `framework` defaults to `'react-native'`
- `template` remains NULL
- `last_modified` set to `updated_at`
- `metadata` defaults to `{"screens_count": 0, "code_size_kb": 0}`

**No manual data migration required** - all handled by migration script

## Future Enhancements

### Phase 27+ Integration
- Session persistence: Link projects to saved sessions
- Project export: Export project to ZIP file
- Project import: Import existing projects
- Collaborative projects: Share projects with other users

### Advanced Features
1. **Project Templates Library**
   - Pre-built templates (e.g., "E-commerce", "Social Media")
   - Community templates
   - Template preview

2. **Project Tags & Categories**
   - Custom tags for organization
   - Categories (Business, Education, Entertainment)
   - Tag-based search

3. **Project Analytics**
   - Code quality metrics
   - Build success rate
   - Development velocity
   - Usage patterns

4. **Bulk Operations**
   - Archive multiple projects
   - Delete multiple projects
   - Export multiple projects

5. **Project Sharing**
   - Public project links
   - Team collaboration
   - Access control (view/edit)

6. **Version History**
   - Track project changes over time
   - Restore previous versions
   - Compare versions

## API Reference

### Supabase Client (TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Create
const { data, error } = await supabase
  .from('projects')
  .insert({ name: 'My App' })
  .select()
  .single()

// Read (list)
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('last_modified', { ascending: false })

// Read (single)
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single()

// Update
const { data, error } = await supabase
  .from('projects')
  .update({ name: 'Updated Name' })
  .eq('id', projectId)
  .select()
  .single()

// Delete
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)

// Search
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .textSearch('name,description', searchQuery)

// Filter
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'active')
  .eq('framework', 'react-native')
```

---

**Phase 26 Status**: Backend Complete (Mobile Deferred)
**Database**: Enhanced schema with framework, template, metadata columns
**RLS**: All policies implemented (Phase 11)
**Indexes**: Optimized for list, search, filter operations
**Documentation**: Complete
**Mobile Components**: Designed, implementation deferred until app development
