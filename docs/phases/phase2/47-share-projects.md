# Phase 47: Share Projects

## Overview
Enable users to generate view-only share links for their projects with expiration and permission controls.

**Duration:** 2 days
**Dependencies:** [46]
**Owners:** Backend Engineer, Frontend Engineer
**MCP Tools:** websearch: false, context7: true, sequentialthinking: true

## Objectives
- Generate view-only share links
- Link expiration & permissions
- Share link UI & copy functionality
- Preview for shared links

## Technical Approach

### Data Model
```typescript
// types/share.ts
interface ProjectShare {
  id: string;
  project_id: string;
  share_token: string; // UUID for public links
  created_by: string;
  created_at: string;
  expires_at?: string;
  permissions: {
    can_view: boolean;
    can_fork: boolean;
    can_comment: boolean;
  };
  access_count: number;
  last_accessed_at?: string;
  is_active: boolean;
}

interface ShareLinkConfig {
  expiresIn?: '1h' | '24h' | '7d' | '30d' | 'never';
  allowFork?: boolean;
  allowComments?: boolean;
  requirePassword?: boolean;
  password?: string;
}
```

### Implementation Steps

#### 1. Database Schema (3h)
```sql
-- Project shares table
CREATE TABLE project_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  share_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  permissions JSONB NOT NULL DEFAULT '{"can_view": true, "can_fork": false, "can_comment": false}'::jsonb,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  password_hash TEXT,
  UNIQUE(share_token)
);

-- RLS policies
CREATE POLICY "Users can view own shares"
  ON project_shares FOR SELECT
  USING (created_by = auth.uid() OR is_active = true);

CREATE POLICY "Users can create shares for own projects"
  ON project_shares FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own shares"
  ON project_shares FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own shares"
  ON project_shares FOR DELETE
  USING (created_by = auth.uid());

-- Indexes
CREATE INDEX idx_shares_project ON project_shares(project_id);
CREATE INDEX idx_shares_token ON project_shares(share_token);
CREATE INDEX idx_shares_expiry ON project_shares(expires_at) WHERE is_active = true;

-- Function to check if share is valid
CREATE OR REPLACE FUNCTION is_share_valid(token UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_shares
    WHERE share_token = token
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Backend Share API (4h)
```typescript
// backend/functions/shares/create.ts
export const createShareLink = async (req: Request, res: Response) => {
  const { project_id, config } = req.body as {
    project_id: string;
    config: ShareLinkConfig
  };

  try {
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Calculate expiration
    const expiresAt = config.expiresIn === 'never'
      ? null
      : calculateExpiry(config.expiresIn);

    // Hash password if provided
    const passwordHash = config.requirePassword && config.password
      ? await bcrypt.hash(config.password, 10)
      : null;

    // Create share record
    const { data: share, error } = await supabase
      .from('project_shares')
      .insert({
        project_id,
        created_by: req.user.id,
        expires_at: expiresAt,
        permissions: {
          can_view: true,
          can_fork: config.allowFork ?? false,
          can_comment: config.allowComments ?? false,
        },
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (error) throw error;

    // Generate public URL
    const shareUrl = `${process.env.APP_URL}/shared/${share.share_token}`;

    res.json({
      share,
      url: shareUrl,
      qr_code: await generateQRCode(shareUrl),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create share link' });
  }
};

function calculateExpiry(duration: string): string {
  const now = new Date();
  switch (duration) {
    case '1h': return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
}

// backend/functions/shares/access.ts
export const accessSharedProject = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Fetch share record
    const { data: share, error } = await supabase
      .from('project_shares')
      .select('*, projects(*)')
      .eq('share_token', token)
      .single();

    if (error || !share) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Validate share
    if (!share.is_active) {
      return res.status(403).json({ error: 'Share link deactivated' });
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Share link expired' });
    }

    // Check password if required
    if (share.password_hash) {
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }

      const isValid = await bcrypt.compare(password, share.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Increment access count
    await supabase
      .from('project_shares')
      .update({
        access_count: share.access_count + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', share.id);

    // Return project data (sanitized)
    res.json({
      project: {
        id: share.projects.id,
        name: share.projects.name,
        description: share.projects.description,
        icon_url: share.projects.icon_url,
        framework: share.projects.framework,
        preview_url: share.projects.preview_url,
        created_at: share.projects.created_at,
      },
      permissions: share.permissions,
      owner: {
        id: share.created_by,
        // Fetch owner profile if public
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to access shared project' });
  }
};
```

#### 3. Share Link UI Component (4h)
```typescript
// components/ShareProjectDialog.tsx
interface ShareProjectDialogProps {
  projectId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function ShareProjectDialog({ projectId, visible, onDismiss }: ShareProjectDialogProps) {
  const [config, setConfig] = useState<ShareLinkConfig>({
    expiresIn: '7d',
    allowFork: true,
    allowComments: false,
  });
  const [shareUrl, setShareUrl] = useState<string>();
  const [qrCode, setQrCode] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shares/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, config }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setShareUrl(data.url);
      setQrCode(data.qr_code);
    } catch (error) {
      Alert.alert('Error', 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    Alert.alert('Copied!', 'Share link copied to clipboard');
  };

  const handleShare = async () => {
    if (!shareUrl) return;

    await Share.share({
      message: `Check out my app on MobVibe: ${shareUrl}`,
      url: shareUrl,
    });
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss} animationType="slide">
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold">Share Project</Text>
            <Pressable onPress={onDismiss}>
              <XIcon size={24} color="#9ca3af" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {!shareUrl ? (
            <>
              {/* Expiration */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Link Expires</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['1h', '24h', '7d', '30d', 'never'].map((duration) => (
                    <Pressable
                      key={duration}
                      onPress={() => setConfig({ ...config, expiresIn: duration as any })}
                      className={`px-4 py-2 rounded-lg border ${
                        config.expiresIn === duration
                          ? 'bg-purple-500 border-purple-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text className={config.expiresIn === duration ? 'text-white' : 'text-gray-700'}>
                        {duration === 'never' ? 'Never' : duration.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Permissions */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Permissions</Text>

                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-600">Allow forking</Text>
                  <Switch
                    value={config.allowFork}
                    onValueChange={(value) => setConfig({ ...config, allowFork: value })}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Allow comments</Text>
                  <Switch
                    value={config.allowComments}
                    onValueChange={(value) => setConfig({ ...config, allowComments: value })}
                  />
                </View>
              </View>

              {/* Create Button */}
              <Button
                title={loading ? 'Creating...' : 'Create Share Link'}
                onPress={handleCreateLink}
                disabled={loading}
                color="#8b5cf6"
              />
            </>
          ) : (
            <>
              {/* QR Code */}
              {qrCode && (
                <View className="items-center mb-6">
                  <Image
                    source={{ uri: qrCode }}
                    style={{ width: 200, height: 200 }}
                  />
                  <Text className="text-gray-500 text-sm mt-2">Scan to view project</Text>
                </View>
              )}

              {/* Share URL */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Share Link</Text>
                <View className="flex-row items-center bg-gray-100 rounded-lg p-3">
                  <Text className="flex-1 text-gray-600" numberOfLines={1}>
                    {shareUrl}
                  </Text>
                  <Pressable onPress={handleCopyLink} className="ml-2">
                    {copied ? (
                      <CheckIcon size={20} color="#10b981" />
                    ) : (
                      <CopyIcon size={20} color="#8b5cf6" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Share Options */}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleCopyLink}
                  className="flex-1 bg-purple-500 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">Copy Link</Text>
                </Pressable>

                <Pressable
                  onPress={handleShare}
                  className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
                >
                  <Text className="text-gray-700 font-medium">Share...</Text>
                </Pressable>
              </View>

              {/* Share Info */}
              <View className="mt-4 p-4 bg-blue-50 rounded-lg">
                <Text className="text-blue-700 text-sm mb-1">
                  ⏰ Expires: {config.expiresIn === 'never' ? 'Never' : config.expiresIn}
                </Text>
                <Text className="text-blue-700 text-sm mb-1">
                  🔓 Can fork: {config.allowFork ? 'Yes' : 'No'}
                </Text>
                <Text className="text-blue-700 text-sm">
                  💬 Can comment: {config.allowComments ? 'Yes' : 'No'}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
```

#### 4. Shared Project Preview Screen (5h)
```typescript
// screens/SharedProjectScreen.tsx
export function SharedProjectScreen({ route }: any) {
  const { token } = route.params;
  const [project, setProject] = useState<any>();
  const [permissions, setPermissions] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    fetchSharedProject();
  }, []);

  const fetchSharedProject = async (pwd?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shares/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setPasswordRequired(true);
        return;
      }

      if (data.error) {
        Alert.alert('Error', data.error);
        navigation.goBack();
        return;
      }

      setProject(data.project);
      setPermissions(data.permissions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load shared project');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    fetchSharedProject(password);
  };

  const handleFork = async () => {
    if (!permissions?.can_fork) return;

    try {
      const response = await fetch('/api/projects/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      Alert.alert('Success', 'Project forked to your account!');
      navigation.navigate('ProjectDetails', { projectId: data.project.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to fork project');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (passwordRequired) {
    return (
      <View className="flex-1 bg-white p-4 justify-center">
        <Text className="text-2xl font-bold mb-4">Password Required</Text>
        <Text className="text-gray-600 mb-4">
          This shared project is password protected.
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        />

        <Button title="Access Project" onPress={handlePasswordSubmit} color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold mb-2">{project.name}</Text>
        {project.description && (
          <Text className="text-gray-600">{project.description}</Text>
        )}

        {/* View-only badge */}
        <View className="mt-2">
          <View className="self-start bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-700 text-xs font-medium">View Only</Text>
          </View>
        </View>
      </View>

      {/* Preview */}
      <View className="flex-1">
        <WebView
          source={{ uri: project.preview_url }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Actions */}
      <View className="p-4 border-t border-gray-200">
        {permissions?.can_fork && (
          <Button
            title="Fork This Project"
            onPress={handleFork}
            color="#8b5cf6"
          />
        )}
      </View>
    </View>
  );
}
```

## Key Tasks

### Backend
- [ ] Create project_shares table
- [ ] Setup RLS policies
- [ ] Build share creation API
- [ ] Build share access API
- [ ] Add QR code generation
- [ ] Implement password protection
- [ ] Add expiration logic

### Frontend
- [ ] Share button in project UI
- [ ] ShareProjectDialog component
- [ ] Share config options
- [ ] Link copy functionality
- [ ] QR code display
- [ ] SharedProjectScreen
- [ ] Password input flow

### Security
- [ ] Token uniqueness
- [ ] Expiration validation
- [ ] Password hashing
- [ ] Rate limiting on access
- [ ] Access logging

## Acceptance Criteria
- [ ] Users can create share links
- [ ] Links have configurable expiration
- [ ] Permissions control fork/comment
- [ ] Copy to clipboard works
- [ ] QR codes generate correctly
- [ ] Password protection works
- [ ] Expired links show error
- [ ] View-only access enforced
- [ ] Access count tracked

## Testing Strategy

### Unit Tests
```typescript
describe('Share Links', () => {
  it('generates unique share token', async () => {
    const share = await createShareLink(projectId, {});
    expect(share.share_token).toMatch(/^[0-9a-f]{8}-/);
  });

  it('validates expiration', async () => {
    const share = await createShareLink(projectId, { expiresIn: '1h' });
    expect(new Date(share.expires_at)).toBeInstanceOf(Date);
  });

  it('enforces password', async () => {
    const share = await createShareLink(projectId, {
      requirePassword: true,
      password: 'test123',
    });
    expect(share.password_hash).toBeDefined();
  });
});
```

### Integration Tests
- Create share → Access via link
- Test all expiration durations
- Verify password protection
- Test permission enforcement
- Track access counts

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token collision | Low | UUID v4, unique constraint |
| Expired link abuse | Medium | Server-side validation |
| Password brute force | High | Rate limiting, lockout |
| Unauthorized access | High | RLS policies, token validation |

## Success Metrics
- Share link creation success: >99%
- Link access response time: <500ms
- Copy to clipboard success: >98%
- Password validation success: 100%
- Share link usage: >30% of users

## Future Enhancements
- Custom short URLs
- Link analytics dashboard
- Batch share management
- Email sharing
- Social media preview cards
- Access logs & history
