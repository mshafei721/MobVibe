# Asset Generation Deployment Checklist

Complete checklist for deploying the Asset Generation system to production.

## Pre-Deployment

### 1. Code Review
- [ ] All files committed to git
- [ ] Code reviewed and approved
- [ ] No console.logs in production code
- [ ] Error handling in place
- [ ] TypeScript types complete

### 2. Testing
- [ ] Unit tests passing (`npm test`)
- [ ] Manual testing completed for icon generation
- [ ] Manual testing completed for sound generation
- [ ] Manual testing completed for asset library
- [ ] Cross-device testing (iOS/Android)
- [ ] Edge case testing (errors, rate limits, etc.)

### 3. Documentation
- [ ] README files updated
- [ ] API documentation complete
- [ ] Setup guide verified
- [ ] Environment variables documented
- [ ] Troubleshooting guide complete

## Database Setup

### 4. Migration
- [ ] Review migration SQL file
- [ ] Test migration on staging database
- [ ] Backup production database
- [ ] Run migration on production
- [ ] Verify tables created
- [ ] Verify indexes created
- [ ] Verify RLS policies active
- [ ] Test data access patterns

```bash
# Backup
supabase db dump > backup_pre_assets_$(date +%Y%m%d).sql

# Run migration
supabase db push

# Verify
SELECT * FROM information_schema.tables WHERE table_name = 'assets';
SELECT * FROM pg_indexes WHERE tablename = 'assets';
```

### 5. Storage Buckets
- [ ] Create `project-icons` bucket
- [ ] Set bucket to public
- [ ] Set 5MB size limit
- [ ] Configure allowed MIME types (PNG, JPEG, WEBP)
- [ ] Create `project-sounds` bucket
- [ ] Set bucket to public
- [ ] Set 10MB size limit
- [ ] Configure allowed MIME types (MP3, WAV, OGG)
- [ ] Verify storage policies
- [ ] Test upload/download

```bash
# Via SQL
supabase db execute --file supabase/setup-storage-buckets.sql

# Verify
SELECT * FROM storage.buckets WHERE id IN ('project-icons', 'project-sounds');
SELECT * FROM storage.policies WHERE bucket_id IN ('project-icons', 'project-sounds');
```

## API Configuration

### 6. Image Generation API
- [ ] Choose provider (DALL-E/Stability/Replicate)
- [ ] Create API account
- [ ] Generate API key
- [ ] Set spending limits
- [ ] Test API endpoint
- [ ] Verify response format
- [ ] Document cost per request

### 7. ElevenLabs API
- [ ] Create ElevenLabs account
- [ ] Subscribe to plan (or use free tier)
- [ ] Generate API key
- [ ] Set usage limits
- [ ] Test sound generation
- [ ] Verify audio format
- [ ] Document cost per request

### 8. Supabase Service Role
- [ ] Obtain service role key from dashboard
- [ ] Verify key has storage access
- [ ] Store securely (never commit to git)
- [ ] Rotate if previously exposed

## Edge Functions Deployment

### 9. Set Secrets
```bash
# Set all required secrets
supabase secrets set IMAGE_GENERATION_API_KEY=your-key
supabase secrets set IMAGE_GENERATION_API_URL=your-url
supabase secrets set ELEVENLABS_API_KEY=your-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# Verify secrets
supabase secrets list
```

- [ ] IMAGE_GENERATION_API_KEY set
- [ ] IMAGE_GENERATION_API_URL set
- [ ] ELEVENLABS_API_KEY set
- [ ] SUPABASE_SERVICE_ROLE_KEY set
- [ ] Secrets verified in dashboard

### 10. Deploy Functions
```bash
# Deploy icon generation
supabase functions deploy generate-icons

# Deploy sound generation
supabase functions deploy generate-sounds

# Verify deployment
supabase functions list
```

- [ ] generate-icons deployed
- [ ] generate-sounds deployed
- [ ] Functions show "healthy" status
- [ ] Test endpoints with curl

### 11. Test Edge Functions
```bash
# Test icon generation
curl -X POST \
  "https://your-project.supabase.co/functions/v1/generate-icons" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test icon",
    "count": 2,
    "projectId": "test-project-id"
  }'

# Test sound generation
curl -X POST \
  "https://your-project.supabase.co/functions/v1/generate-sounds" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test sound",
    "count": 2,
    "projectId": "test-project-id",
    "duration": 2
  }'
```

- [ ] Icon generation returns 200
- [ ] Icons uploaded to storage
- [ ] Sound generation returns 200
- [ ] Sounds uploaded to storage
- [ ] Error handling works (test with invalid data)

## Mobile App Deployment

### 12. Dependencies
```bash
npm install expo-av react-native-haptic-feedback
```

- [ ] expo-av installed
- [ ] react-native-haptic-feedback installed (should already exist)
- [ ] package.json updated
- [ ] Dependencies verified working

### 13. App Configuration
- [ ] app.json updated with expo-av plugin
- [ ] Audio permissions configured
- [ ] Environment variables set
- [ ] Build configuration updated

### 14. Environment Variables
Create `.env.production`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] Production .env file created
- [ ] SUPABASE_URL set
- [ ] SUPABASE_ANON_KEY set
- [ ] No sensitive keys exposed to client

### 15. Build and Test
```bash
# Development build
npx expo start

# Production build
eas build --platform ios
eas build --platform android
```

- [ ] Development build runs
- [ ] All components render
- [ ] Icon generation works
- [ ] Sound generation works
- [ ] Asset library works
- [ ] Production builds successful
- [ ] App Store Connect / Play Store ready

## Monitoring Setup

### 16. Logging
- [ ] Supabase function logs enabled
- [ ] Error tracking configured
- [ ] Success/failure metrics tracked
- [ ] Performance metrics tracked

### 17. Alerting
- [ ] Error rate alerts set up
- [ ] API cost alerts configured
- [ ] Storage quota alerts configured
- [ ] Function timeout alerts configured

### 18. Analytics
- [ ] Track icon generation events
- [ ] Track sound generation events
- [ ] Track asset application events
- [ ] Track error events
- [ ] Track user engagement

## Cost Controls

### 19. Rate Limiting
- [ ] Implement user rate limits
- [ ] Set project rate limits
- [ ] Configure API rate limits
- [ ] Add cooldown periods

### 20. Usage Limits
- [ ] Set monthly budget alerts
- [ ] Configure per-user limits
- [ ] Set storage quotas
- [ ] Document limit policies

### 21. Cost Monitoring
- [ ] Daily cost tracking
- [ ] Monthly cost reports
- [ ] Provider cost dashboards
- [ ] Budget threshold alerts

## Security Audit

### 22. Access Control
- [ ] RLS policies tested
- [ ] User can only access own assets
- [ ] Storage folders isolated per user
- [ ] API keys not exposed to client
- [ ] Service role key secure

### 23. Input Validation
- [ ] Prompt sanitization
- [ ] Count limits enforced
- [ ] Duration limits enforced
- [ ] File type validation
- [ ] Size limit validation

### 24. Error Handling
- [ ] No sensitive data in errors
- [ ] Proper error messages
- [ ] Graceful failures
- [ ] Error boundaries in place

## Documentation

### 25. User Documentation
- [ ] Feature documentation complete
- [ ] Tutorial videos/guides created
- [ ] FAQ section updated
- [ ] Troubleshooting guide published

### 26. Developer Documentation
- [ ] API docs published
- [ ] Setup guide complete
- [ ] Architecture documented
- [ ] Deployment guide complete

## Post-Deployment

### 27. Smoke Tests
```bash
# Run full test suite
npm test

# Test in production app
# - Generate icons
# - Generate sounds
# - View asset library
# - Apply assets to project
```

- [ ] All unit tests passing
- [ ] Icon generation works in production
- [ ] Sound generation works in production
- [ ] Asset library loads
- [ ] Assets persist correctly

### 28. Monitoring
- [ ] Check function logs for errors
- [ ] Monitor API costs (first 24 hours)
- [ ] Monitor storage usage
- [ ] Monitor user feedback
- [ ] Track success rates

### 29. Rollback Plan
- [ ] Database rollback script ready
- [ ] Previous app version deployable
- [ ] Edge function versions tagged
- [ ] Rollback procedure documented

### 30. Team Communication
- [ ] Deployment announcement sent
- [ ] Feature documentation shared
- [ ] Support team trained
- [ ] Monitoring dashboard access granted

## Success Metrics (Week 1)

Track these metrics after deployment:

- [ ] Icon generation success rate: >95%
- [ ] Sound generation success rate: >90%
- [ ] Average icon generation time: <10s
- [ ] Average sound generation time: <15s
- [ ] User satisfaction: >4.0/5.0
- [ ] API cost per generation: <$0.10
- [ ] Zero critical errors
- [ ] Zero security incidents

## Rollback Triggers

Rollback if any of these occur:

- [ ] Success rate drops below 80%
- [ ] Critical security vulnerability discovered
- [ ] API costs exceed budget by 200%
- [ ] Data loss or corruption detected
- [ ] System unavailable for >1 hour

## Support Readiness

### 31. Support Team
- [ ] Support docs distributed
- [ ] Common issues documented
- [ ] Escalation path defined
- [ ] On-call schedule set

### 32. User Communication
- [ ] Release notes published
- [ ] Feature announcement made
- [ ] Tutorial content ready
- [ ] Support channels monitored

---

## Sign-Off

Deployment completed by: ________________
Date: ________________
Verified by: ________________

## Notes

Use this space for deployment-specific notes:

---

## Post-Deployment Review

Schedule: 1 week after deployment
Attendees: ________________
Date: ________________

Topics:
- Success metrics review
- Cost analysis
- User feedback review
- Issues encountered
- Improvements identified
- Next iteration planning
