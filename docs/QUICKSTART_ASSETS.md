# Asset Generation - Quick Start Guide

Get the Asset Generation system up and running in 10 minutes.

## Prerequisites

- Supabase project running
- Node.js 18+ installed
- Mobile development environment set up

## 1. Install Dependencies (1 min)

```bash
cd /d/009_Projects_AI/Personal_Projects/MobVibe
npm install expo-av
```

## 2. Database Setup (2 min)

```bash
# Run migration
supabase db push

# Or manually
supabase db execute --file supabase/migrations/20250111_create_assets_table.sql
```

## 3. Create Storage Buckets (1 min)

Via Supabase Dashboard:
1. Go to Storage
2. Create bucket: `project-icons` (Public, 5MB limit)
3. Create bucket: `project-sounds` (Public, 10MB limit)

Or via SQL:
```bash
supabase db execute --file supabase/setup-storage-buckets.sql
```

## 4. Get API Keys (3 min)

### ElevenLabs (Required for sounds)
1. Sign up: https://elevenlabs.io
2. Get API key from Settings
3. Free tier: 10,000 chars/month

### Image Generation (Choose one)

**Option A: OpenAI (Best quality)**
- Sign up: https://platform.openai.com
- Create API key
- Cost: ~$0.04/image

**Option B: Stability AI (Good balance)**
- Sign up: https://platform.stability.ai
- Create API key
- Cost: ~$0.02/image

**Option C: Replicate (Budget-friendly)**
- Sign up: https://replicate.com
- Create API token
- Cost: ~$0.01/image

## 5. Configure Secrets (2 min)

```bash
# Set Edge Function secrets
supabase secrets set IMAGE_GENERATION_API_KEY=your-key
supabase secrets set IMAGE_GENERATION_API_URL=your-url
supabase secrets set ELEVENLABS_API_KEY=your-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# Verify
supabase secrets list
```

## 6. Deploy Edge Functions (1 min)

```bash
supabase functions deploy generate-icons
supabase functions deploy generate-sounds
```

## Done!

Test it:

```bash
# Start app
npm start

# Navigate to Assets tab
# Enter prompt: "fitness app icon"
# Click Generate Icons
# Wait ~8 seconds
# Select and apply!
```

## Quick Test

```bash
# Test icon generation
curl -X POST \
  "https://your-project.supabase.co/functions/v1/generate-icons" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test icon",
    "count": 2,
    "projectId": "test-id"
  }'
```

## Troubleshooting

**Error: "Missing authorization header"**
- Make sure user is logged in
- Check Supabase session is valid

**Error: "Image generation API not configured"**
- Verify secrets are set: `supabase secrets list`
- Redeploy functions: `supabase functions deploy generate-icons`

**Error: "Failed to upload icon"**
- Check storage buckets exist
- Verify bucket names: `project-icons`, `project-sounds`
- Check RLS policies allow user uploads

**Generation too slow?**
- Normal: 8-10s for icons, 12-15s for sounds
- Check network connection
- Verify API provider status

## Next Steps

1. Read full documentation: `docs/ASSET_GENERATION.md`
2. Review setup guide: `docs/SETUP_ASSET_GENERATION.md`
3. Customize prompts for better results
4. Set up monitoring and cost tracking
5. Configure rate limits

## Component Usage

```tsx
import { IconGallery } from '@/components/assets/IconGallery';
import { SoundGallery } from '@/components/assets/SoundGallery';
import { AssetLibrary } from '@/components/assets/AssetLibrary';

// In your screen
<IconGallery projectId={projectId} />
<SoundGallery projectId={projectId} />
<AssetLibrary projectId={projectId} />
```

## Hooks Usage

```tsx
import { useIconGeneration } from '@/hooks/useIconGeneration';

const { generateIcons, icons, loading } = useIconGeneration();

await generateIcons(projectId, 'fitness app icon');
```

## Cost Estimates

Per generation:
- Icons (6 variants): $0.06-0.24
- Sounds (4 variants): $0.12-0.32

Per 1000 users/month:
- Icons: ~$360 (3 generations each)
- Sounds: ~$240 (2 generations each)
- Storage: ~$0.25 (11GB)
- Total: ~$600/month

## Support

- Issues: Check function logs in Supabase Dashboard
- Docs: `docs/ASSET_GENERATION.md`
- Setup: `docs/SETUP_ASSET_GENERATION.md`
- Tests: `npm test components/assets`

---

Ready to generate assets!
