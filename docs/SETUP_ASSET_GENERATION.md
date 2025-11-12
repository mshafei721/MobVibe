# Asset Generation Setup Guide

Step-by-step guide to configure and deploy the Asset Generation system for MobVibe.

## Prerequisites

- Supabase project created and configured
- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase`)
- Mobile app environment set up
- API keys for image and sound generation services

## Step 1: Database Setup

### 1.1 Run Migration

```bash
cd /d/009_Projects_AI/Personal_Projects/MobVibe

# Apply the migration
supabase db push

# Or manually run the SQL file
supabase db execute --file supabase/migrations/20250111_create_assets_table.sql
```

### 1.2 Verify Tables

```sql
-- Check assets table
SELECT * FROM information_schema.tables
WHERE table_name = 'assets';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'assets';

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'assets';
```

## Step 2: Storage Bucket Setup

### 2.1 Create Buckets

Option A: Via Supabase Dashboard
1. Go to Storage in Supabase Dashboard
2. Create new bucket: `project-icons`
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/png, image/jpeg, image/jpg, image/webp`
3. Create new bucket: `project-sounds`
   - Public: Yes
   - File size limit: 10MB
   - Allowed MIME types: `audio/mpeg, audio/mp3, audio/wav, audio/ogg`

Option B: Via SQL
```bash
supabase db execute --file supabase/setup-storage-buckets.sql
```

### 2.2 Verify Storage Policies

```sql
-- Check storage policies
SELECT * FROM storage.policies
WHERE bucket_id IN ('project-icons', 'project-sounds');
```

## Step 3: API Keys Setup

### 3.1 Choose Image Generation Provider

**Option 1: OpenAI DALL-E** (Recommended for quality)
1. Sign up at https://platform.openai.com
2. Create API key
3. Cost: ~$0.02-0.04 per 1024x1024 image
4. Set environment variables:
   ```bash
   IMAGE_GENERATION_API_KEY=sk-...
   IMAGE_GENERATION_API_URL=https://api.openai.com/v1/images/generations
   ```

**Option 2: Stability AI** (Good for variety)
1. Sign up at https://platform.stability.ai
2. Create API key
3. Cost: ~$0.01-0.02 per image
4. Set environment variables:
   ```bash
   IMAGE_GENERATION_API_KEY=sk-...
   IMAGE_GENERATION_API_URL=https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image
   ```

**Option 3: Replicate** (Budget-friendly)
1. Sign up at https://replicate.com
2. Create API token
3. Cost: ~$0.005-0.01 per image
4. Set environment variables:
   ```bash
   IMAGE_GENERATION_API_KEY=r8_...
   IMAGE_GENERATION_API_URL=https://api.replicate.com/v1/predictions
   ```

### 3.2 Setup ElevenLabs (Sound Generation)

1. Sign up at https://elevenlabs.io
2. Get API key from profile
3. Cost: ~$0.03 per audio generation
4. Free tier: 10,000 characters/month
5. Set environment variable:
   ```bash
   ELEVENLABS_API_KEY=your-key-here
   ```

### 3.3 Configure Supabase Service Role

1. Go to Supabase Dashboard > Settings > API
2. Copy "service_role" key (secret key)
3. Set environment variable:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Step 4: Edge Functions Deployment

### 4.1 Set Supabase Secrets

```bash
# Navigate to project
cd /d/009_Projects_AI/Personal_Projects/MobVibe

# Set secrets for Edge Functions
supabase secrets set IMAGE_GENERATION_API_KEY=your-key
supabase secrets set IMAGE_GENERATION_API_URL=your-url
supabase secrets set ELEVENLABS_API_KEY=your-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# Verify secrets are set
supabase secrets list
```

### 4.2 Deploy Edge Functions

```bash
# Deploy icon generation function
supabase functions deploy generate-icons

# Deploy sound generation function
supabase functions deploy generate-sounds

# Verify deployment
supabase functions list
```

### 4.3 Test Edge Functions

```bash
# Test icon generation
curl -X POST \
  "https://your-project.supabase.co/functions/v1/generate-icons" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "fitness app icon",
    "count": 6,
    "projectId": "test-project-id"
  }'

# Test sound generation
curl -X POST \
  "https://your-project.supabase.co/functions/v1/generate-sounds" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "button click",
    "count": 4,
    "projectId": "test-project-id",
    "duration": 2
  }'
```

## Step 5: Mobile App Configuration

### 5.1 Install Dependencies

```bash
cd /d/009_Projects_AI/Personal_Projects/MobVibe

# Install required packages
npm install expo-av react-native-haptic-feedback

# Or with yarn
yarn add expo-av react-native-haptic-feedback
```

### 5.2 Update app.json

Add expo-av plugin configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
          "audioModeDescription": "Allow $(PRODUCT_NAME) to play audio"
        }
      ]
    ]
  }
}
```

### 5.3 Configure Environment Variables

Create `.env.production` file:

```bash
# Copy example
cp .env.example .env.production

# Edit with your values
nano .env.production
```

Add:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 6: Testing

### 6.1 Run Unit Tests

```bash
npm test components/assets/__tests__/IconGallery.test.tsx
```

### 6.2 Manual Testing Checklist

**Icon Generation:**
- [ ] Open assets screen
- [ ] Navigate to Icons tab
- [ ] Enter icon description: "fitness app, green dumbbell"
- [ ] Click "Generate Icons"
- [ ] Wait for generation (~8 seconds)
- [ ] Verify 6 icons display in grid
- [ ] Tap to select an icon
- [ ] Verify checkmark appears
- [ ] Click "Apply Icon"
- [ ] Verify success message
- [ ] Check project settings for updated icon

**Sound Generation:**
- [ ] Navigate to Sounds tab
- [ ] Enter sound description: "button click"
- [ ] Click "Generate Sounds"
- [ ] Wait for generation (~10 seconds)
- [ ] Verify 4 sounds display
- [ ] Click play button on first sound
- [ ] Verify audio plays
- [ ] Click pause button
- [ ] Verify audio stops
- [ ] Select a sound
- [ ] Click "Apply Sound"
- [ ] Verify success message

**Asset Library:**
- [ ] Navigate to Library tab
- [ ] Verify all generated assets appear
- [ ] Tap an icon asset
- [ ] Verify preview modal opens
- [ ] Close modal
- [ ] Tap a sound asset
- [ ] Play sound in preview
- [ ] Try delete action
- [ ] Try regenerate action

## Step 7: Production Deployment

### 7.1 Environment Variables

Set production environment variables in:
- Supabase Edge Functions (via `supabase secrets set`)
- Mobile app build configuration
- CI/CD pipeline secrets

### 7.2 Storage Limits

Configure appropriate limits:
```sql
-- Update storage limits if needed
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB
WHERE id = 'project-icons';

UPDATE storage.buckets
SET file_size_limit = 20971520 -- 20MB
WHERE id = 'project-sounds';
```

### 7.3 Rate Limiting

Add rate limiting to Edge Functions:
```typescript
// Add to Edge Function
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
});
```

### 7.4 Monitoring

1. Enable Supabase function logs
2. Set up error alerting
3. Monitor API usage and costs
4. Track generation success rates

## Troubleshooting

### Common Issues

**1. "Missing authorization header"**
- Ensure user is authenticated
- Check Authorization header in requests
- Verify Supabase session is valid

**2. "Image generation API not configured"**
- Verify environment variables are set
- Check secret names match code
- Redeploy Edge Functions after setting secrets

**3. "Failed to upload icon"**
- Check storage bucket exists
- Verify RLS policies allow user uploads
- Ensure user owns the project

**4. "No images returned from API"**
- Check API key is valid
- Verify API provider has credits
- Review API response format
- Check API rate limits

**5. Audio playback fails**
- Ensure expo-av is installed
- Check audio file format (MP3)
- Verify Storage bucket is public
- Test URL directly in browser

### Debug Edge Functions

```bash
# View function logs
supabase functions logs generate-icons

# View live logs
supabase functions logs generate-icons --tail

# Test locally
supabase functions serve generate-icons
```

### Check Storage Permissions

```sql
-- Test storage access
SELECT storage.foldername('user-id/project-id/icon.png');

-- Check user's storage permissions
SELECT * FROM storage.objects
WHERE bucket_id = 'project-icons'
AND name LIKE 'user-id/%';
```

## Cost Estimation

### Monthly Costs (1000 active users)

**Icon Generation:**
- Average: 3 generations per user
- 6 variants per generation
- Cost per image: $0.02
- Total: 3 * 6 * $0.02 * 1000 = $360/month

**Sound Generation:**
- Average: 2 generations per user
- 4 variants per generation
- Cost per sound: $0.03
- Total: 2 * 4 * $0.03 * 1000 = $240/month

**Storage:**
- Icons: 500KB * 6 * 3 * 1000 = 9GB
- Sounds: 300KB * 4 * 2 * 1000 = 2.4GB
- Supabase storage: $0.021/GB = ~$0.25/month

**Total: ~$600/month for 1000 users**

### Optimization Tips

1. Cache similar prompts
2. Implement user generation limits
3. Offer tiered pricing
4. Clean up unused assets after 30 days
5. Use lower-cost providers for non-critical generations

## Next Steps

1. Test all functionality end-to-end
2. Set up monitoring and alerting
3. Configure cost controls
4. Implement user limits
5. Add analytics tracking
6. Document API usage for users
7. Create user tutorials

## Support Resources

- Supabase Docs: https://supabase.com/docs
- ElevenLabs Docs: https://docs.elevenlabs.io
- OpenAI Docs: https://platform.openai.com/docs
- Expo AV Docs: https://docs.expo.dev/versions/latest/sdk/av/

## Related Documentation

- Main Asset Generation Docs: `docs/ASSET_GENERATION.md`
- Phase 25 Plan: `docs/phases/phase1/25-icon-generation.md`
- Edge Functions Guide: `docs/EDGE_FUNCTIONS.md`
- Storage Guide: `docs/STORAGE.md`
