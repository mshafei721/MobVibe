# Phase 48: Collaboration Features

## Overview
Enable multi-user collaboration on projects with invites, real-time editing, comments, and presence indicators.

**Duration:** 2 days
**Dependencies:** [47]
**Owners:** Backend Engineer, Frontend Engineer, Real-time Engineer
**MCP Tools:** websearch: true, context7: true, sequentialthinking: true

## Objectives
- Invite collaborators to projects
- Multi-user editing with conflict resolution
- Comment system on code/elements
- Real-time presence indicators

## Technical Approach

### Data Model
```typescript
// types/collaboration.ts
interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  status: 'pending' | 'active' | 'declined';
}

interface CollaborationInvite {
  id: string;
  project_id: string;
  email: string;
  role: 'editor' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
}

interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  parent_comment_id?: string; // For threaded replies
  element_path?: string; // e.g., "src/screens/HomeScreen.tsx#L42"
  content: string;
  created_at: string;
  updated_at?: string;
  resolved: boolean;
}

interface UserPresence {
  user_id: string;
  project_id: string;
  cursor_position?: { file: string; line: number; column: number };
  active_file?: string;
  last_seen: string;
  status: 'active' | 'idle' | 'offline';
}
```

### Implementation Steps

#### 1. Database Schema (4h)
```sql
-- Collaborators table
CREATE TABLE project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  UNIQUE(project_id, user_id)
);

-- Invites table
CREATE TABLE collaboration_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token UUID NOT NULL DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  UNIQUE(token)
);

-- Comments table
CREATE TABLE project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  parent_comment_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
  element_path TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  resolved BOOLEAN NOT NULL DEFAULT false
);

-- RLS Policies
CREATE POLICY "Collaborators can view project collaborators"
  ON project_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc
      WHERE pc.project_id = project_collaborators.project_id
        AND pc.user_id = auth.uid()
        AND pc.status = 'active'
    )
  );

CREATE POLICY "Owners can invite collaborators"
  ON project_collaborators FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_collaborators.project_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

CREATE POLICY "Collaborators can view comments"
  ON project_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_comments.project_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

CREATE POLICY "Editors can create comments"
  ON project_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_id = project_comments.project_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
        AND status = 'active'
    )
  );

-- Indexes
CREATE INDEX idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON project_collaborators(user_id);
CREATE INDEX idx_comments_project ON project_comments(project_id);
CREATE INDEX idx_comments_element ON project_comments(element_path);
CREATE INDEX idx_invites_token ON collaboration_invites(token);
```

#### 2. Real-time Presence System (5h)
```typescript
// backend/services/presence.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class PresenceService {
  private static PRESENCE_TTL = 60; // 1 minute
  private static IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  static async updatePresence(
    userId: string,
    projectId: string,
    data: Partial<UserPresence>
  ) {
    const key = `presence:${projectId}:${userId}`;

    const presence: UserPresence = {
      user_id: userId,
      project_id: projectId,
      last_seen: new Date().toISOString(),
      status: 'active',
      ...data,
    };

    await redis.setex(key, this.PRESENCE_TTL, JSON.stringify(presence));

    // Broadcast presence update
    await this.broadcastPresence(projectId, userId, presence);
  }

  static async getProjectPresence(projectId: string): Promise<UserPresence[]> {
    const keys = await redis.keys(`presence:${projectId}:*`);
    const presenceData = await Promise.all(
      keys.map(key => redis.get(key))
    );

    const now = Date.now();
    return presenceData
      .filter(Boolean)
      .map(data => JSON.parse(data!))
      .map(presence => ({
        ...presence,
        status: this.calculateStatus(presence.last_seen, now),
      }));
  }

  static calculateStatus(lastSeen: string, now: number): UserPresence['status'] {
    const diff = now - new Date(lastSeen).getTime();

    if (diff < this.PRESENCE_TTL * 1000) return 'active';
    if (diff < this.IDLE_THRESHOLD) return 'idle';
    return 'offline';
  }

  static async broadcastPresence(
    projectId: string,
    userId: string,
    presence: UserPresence
  ) {
    // Use Supabase Realtime to broadcast
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    await supabase.channel(`project:${projectId}`)
      .send({
        type: 'broadcast',
        event: 'presence',
        payload: { userId, presence },
      });
  }
}

// backend/functions/presence/update.ts
export const updatePresence = async (req: Request, res: Response) => {
  const { project_id, cursor_position, active_file } = req.body;

  try {
    await PresenceService.updatePresence(req.user.id, project_id, {
      cursor_position,
      active_file,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update presence' });
  }
};
```

#### 3. CRDT-based Collaboration (6h)
```typescript
// services/collaboration/crdt.ts
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

/**
 * Conflict-free Replicated Data Type for collaborative editing
 * Research: Yjs for production-ready CRDT implementation
 */
export class CollaborativeDocument {
  private ydoc: Y.Doc;
  private provider: WebsocketProvider;
  private awareness: any;

  constructor(projectId: string, userId: string) {
    this.ydoc = new Y.Doc();

    // Connect to collaboration server
    this.provider = new WebsocketProvider(
      process.env.COLLAB_SERVER_URL!,
      `project-${projectId}`,
      this.ydoc
    );

    this.awareness = this.provider.awareness;
    this.awareness.setLocalState({
      user: { id: userId },
      cursor: null,
    });
  }

  /**
   * Get shared text for file editing
   */
  getSharedText(filePath: string): Y.Text {
    return this.ydoc.getText(filePath);
  }

  /**
   * Update cursor position (for presence)
   */
  updateCursor(position: { line: number; column: number }) {
    this.awareness.setLocalStateField('cursor', position);
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): Array<{ id: string; cursor: any }> {
    const states = this.awareness.getStates();
    const users: any[] = [];

    states.forEach((state: any, clientId: number) => {
      if (state.user) {
        users.push({
          id: state.user.id,
          cursor: state.cursor,
        });
      }
    });

    return users;
  }

  /**
   * Apply changes from local editor
   */
  applyLocalChange(filePath: string, change: { from: number; to: number; text: string }) {
    const ytext = this.getSharedText(filePath);

    this.ydoc.transact(() => {
      if (change.to > change.from) {
        ytext.delete(change.from, change.to - change.from);
      }
      if (change.text) {
        ytext.insert(change.from, change.text);
      }
    });
  }

  /**
   * Listen for remote changes
   */
  onRemoteChange(filePath: string, callback: (delta: any) => void) {
    const ytext = this.getSharedText(filePath);

    ytext.observe((event) => {
      callback(event.delta);
    });
  }

  destroy() {
    this.provider.destroy();
    this.ydoc.destroy();
  }
}
```

#### 4. Collaboration UI Components (6h)
```typescript
// components/CollaboratorsList.tsx
export function CollaboratorsList({ projectId }: { projectId: string }) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [presence, setPresence] = useState<Map<string, UserPresence>>(new Map());
  const supabase = useSupabase();

  useEffect(() => {
    fetchCollaborators();
    subscribeToPresence();
  }, [projectId]);

  const fetchCollaborators = async () => {
    const { data } = await supabase
      .from('project_collaborators')
      .select('*, users(id, email, avatar_url)')
      .eq('project_id', projectId)
      .eq('status', 'active');

    setCollaborators(data || []);
  };

  const subscribeToPresence = () => {
    const channel = supabase.channel(`project:${projectId}`);

    channel
      .on('broadcast', { event: 'presence' }, ({ payload }) => {
        setPresence(prev => new Map(prev).set(payload.userId, payload.presence));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-3">Collaborators</Text>

      {collaborators.map((collab) => {
        const userPresence = presence.get(collab.user_id);

        return (
          <View key={collab.id} className="flex-row items-center mb-3">
            {/* Avatar */}
            <View className="relative">
              <Image
                source={{ uri: collab.users.avatar_url }}
                className="w-10 h-10 rounded-full"
              />
              {/* Presence indicator */}
              <View
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  userPresence?.status === 'active'
                    ? 'bg-green-500'
                    : userPresence?.status === 'idle'
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
                }`}
              />
            </View>

            {/* User info */}
            <View className="flex-1 ml-3">
              <Text className="font-medium">{collab.users.email}</Text>
              <Text className="text-gray-500 text-xs">{collab.role}</Text>
              {userPresence?.active_file && (
                <Text className="text-gray-400 text-xs">
                  Editing: {userPresence.active_file}
                </Text>
              )}
            </View>

            {/* Role badge */}
            <View className={`px-2 py-1 rounded ${
              collab.role === 'owner' ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <Text className={`text-xs ${
                collab.role === 'owner' ? 'text-purple-700' : 'text-gray-700'
              }`}>
                {collab.role}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// components/InviteCollaboratorDialog.tsx
export function InviteCollaboratorDialog({ projectId, visible, onDismiss }: any) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/collaborators/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, email, role }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      Alert.alert('Success', 'Invitation sent!');
      onDismiss();
      setEmail('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} animationType="slide">
      <View className="flex-1 bg-white p-4">
        <Text className="text-xl font-bold mb-4">Invite Collaborator</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Role</Text>
        <View className="flex-row gap-2 mb-4">
          {['editor', 'viewer'].map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r as any)}
              className={`flex-1 py-3 rounded-lg border ${
                role === r
                  ? 'bg-purple-500 border-purple-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-center font-medium ${
                role === r ? 'text-white' : 'text-gray-700'
              }`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          title={loading ? 'Sending...' : 'Send Invite'}
          onPress={handleInvite}
          disabled={loading || !email.trim()}
          color="#8b5cf6"
        />
      </View>
    </Modal>
  );
}

// components/CommentThread.tsx
export function CommentThread({ projectId, elementPath }: any) {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const supabase = useSupabase();

  useEffect(() => {
    fetchComments();
    subscribeToComments();
  }, [projectId, elementPath]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('project_comments')
      .select('*, users(email, avatar_url)')
      .eq('project_id', projectId)
      .eq('element_path', elementPath)
      .order('created_at', { ascending: true });

    setComments(data || []);
  };

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`comments:${projectId}:${elementPath}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_comments',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await supabase.from('project_comments').insert({
        project_id: projectId,
        element_path: elementPath,
        content: newComment.trim(),
      });

      setNewComment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  return (
    <View className="bg-white rounded-lg border border-gray-200 p-4">
      <Text className="font-bold mb-3">Comments</Text>

      <ScrollView className="mb-3" style={{ maxHeight: 300 }}>
        {comments.map((comment) => (
          <View key={comment.id} className="mb-3">
            <View className="flex-row items-center mb-1">
              <Image
                source={{ uri: comment.users.avatar_url }}
                className="w-6 h-6 rounded-full mr-2"
              />
              <Text className="text-sm font-medium">{comment.users.email}</Text>
              <Text className="text-xs text-gray-400 ml-auto">
                {formatDistanceToNow(new Date(comment.created_at))} ago
              </Text>
            </View>
            <Text className="text-gray-700">{comment.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center">
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-2"
        />
        <Pressable
          onPress={handleAddComment}
          className="bg-purple-500 rounded-lg px-4 py-2"
        >
          <Text className="text-white font-medium">Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

## Key Tasks

### Backend
- [ ] Create collaborators schema
- [ ] Create invites schema
- [ ] Create comments schema
- [ ] Setup RLS policies
- [ ] Build invite API
- [ ] Build accept invite API
- [ ] Setup presence with Redis
- [ ] CRDT collaboration server

### Real-time
- [ ] Presence broadcasting
- [ ] Cursor position sync
- [ ] Comment notifications
- [ ] Conflict resolution
- [ ] Activity feed

### Frontend
- [ ] CollaboratorsList component
- [ ] InviteCollaboratorDialog
- [ ] Presence indicators
- [ ] Cursor overlay UI
- [ ] CommentThread component
- [ ] Notification system

## Acceptance Criteria
- [ ] Users can invite collaborators
- [ ] Invites sent via email
- [ ] Role-based permissions work
- [ ] Real-time presence visible
- [ ] Multi-user editing works
- [ ] Conflicts auto-resolve (CRDT)
- [ ] Comments thread properly
- [ ] Notifications delivered
- [ ] Cursor positions synced

## Testing Strategy

### Unit Tests
```typescript
describe('Collaboration', () => {
  it('creates invite', async () => {
    const invite = await createInvite(projectId, 'user@example.com', 'editor');
    expect(invite.token).toBeDefined();
  });

  it('accepts invite', async () => {
    const collab = await acceptInvite(invite.token, userId);
    expect(collab.status).toBe('active');
  });

  it('enforces role permissions', async () => {
    const viewer = { role: 'viewer' };
    expect(canEdit(viewer)).toBe(false);
  });
});
```

### Integration Tests
- Invite → Accept → Collaborate flow
- CRDT conflict resolution
- Presence updates
- Comment threading
- Permission enforcement

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Merge conflicts | High | CRDT (Yjs) for automatic resolution |
| Network latency | Medium | Optimistic updates, sync indicators |
| Presence scaling | Medium | Redis pub/sub, TTL cleanup |
| Unauthorized access | High | RLS policies, role validation |

## Success Metrics
- Invite acceptance rate: >70%
- Concurrent editors supported: >10/project
- Presence update latency: <200ms
- Conflict resolution: 100% automatic
- Collaboration satisfaction: >4.2/5.0

## Future Enhancements
- Video chat integration
- Screen sharing
- Change history & blame
- Conflict review UI
- Team workspaces
- Activity timeline
