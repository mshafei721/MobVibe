# Database Patterns Research - Phase 11

**Date:** 2025-11-07
**Research Sources:** Supabase Docs, PostgreSQL Wiki, Database Performance Guides

---

## Supabase RLS Best Practices (2025)

### Security Fundamentals

**Enable RLS Always:**
- Enable RLS for every table, even non-sensitive data
- Tables without RLS in public schema are accessible to anon role
- Always have security measures in place

**Policy Design:**
- Be specific with policies (SELECT, INSERT, UPDATE, DELETE)
- Use auth helpers carefully (avoid user_metadata, use raw_app_meta_data)
- raw_user_meta_data can be modified by users - not secure for authorization
- raw_app_meta_data cannot be updated by users - use for authorization data

### Performance Optimization

**1. Add Indexes for RLS:**
```sql
-- For RLS: auth.uid() = user_id
CREATE INDEX userid ON test_table USING btree (user_id);
-- Improvement: 100x+ on large tables
```

**2. Wrap Functions in SELECT:**
```sql
-- Cache function results with initPlan
WHERE auth.uid() IN (SELECT user_id FROM ...)
-- WARNING: Only if results don't change per row
```

**3. Optimize Join Patterns:**
```sql
-- ❌ SLOW:
auth.uid() IN (SELECT user_id FROM team_user WHERE team_user.team_id = table.team_id)

-- ✅ FAST:
team_id IN (SELECT team_id FROM team_user WHERE user_id = auth.uid())
```

**4. Add Filters to Queries:**
```typescript
// ❌ Relies only on RLS:
.from('table').select()

// ✅ Add explicit filter:
.from('table').select().eq('user_id', userId)
```

**Security Considerations:**
- Functions used in RLS can be called from API
- Secure functions in alternate schema if results would leak data
- Index columns like user_id, tenant_id to avoid slow complex joins

---

## PostgreSQL Schema Design for Mobile Apps

### Schema Organization Patterns

**Multi-Schema Approach:**
- Single database with multiple named schemas > multiple databases
- Organize objects into logical groups
- Prevents users from interfering with each other

**Security & Separation:**
- Move sensitive data (email, password_hash) to separate tables
- Use private schemas for sensitive data
- Prevents accidental selection of sensitive values
- Users lack permission to query private schemas directly

### Mobile-Specific Considerations

**Server-Driven Architecture:**
- Ensures data consistency across entire app ecosystem
- Robust schema design benefits mobile apps

**Query Patterns:**
- Understand common/critical operations
- Optimize for write vs read operations
- Design changes dramatically based on requirements

**Performance:**
- Large tables: use database partitioning
- Critical for mobile apps with sync requirements

---

## Indexing Strategies for Real-Time Apps

### Core Principles

**Real-Time Requirements:**
- Index updates available within milliseconds
- Critical for live analytics, IoT, fraud detection

**Index Placement:**
- Frequently queried fields
- Columns in WHERE, JOIN, GROUP BY, ORDER BY clauses
- Significantly enhances search performance

### Strategies

**1. Caching:**
- Cache frequently accessed data
- Reduce database load
- Improve response times

**2. Vector Indexes (AI Workloads):**
- Approximate nearest neighbors
- Real-time vector search on massive datasets

**3. Technology Stack:**
- Elasticsearch: search & analytics
- Apache Kafka: real-time data streaming
- Redis: in-memory indexing, ultra-low latency

### Trade-offs

**Read vs Write:**
- Indexes speed up reads
- Slow down writes (insert, update, delete)
- Every write requires updating index entries

**Pre-Launch Planning:**
- Add indexes before app launch
- Performance degrades as queried data grows
- Plan for scale from start

---

## MobVibe Application Recommendations

### Table Design

**1. Profiles Table:**
- Index: email (for lookups), tier (for filtering)
- RLS: Users can only view/update own profile
- Service role bypass for admin operations

**2. Projects Table:**
- Index: user_id, status, created_at DESC
- RLS: Users can only CRUD own projects
- Composite index for common queries

**3. Coding Sessions:**
- Index: user_id, project_id, status, expires_at
- RLS: Users can only view own sessions
- Status index for worker queries

**4. Coding Jobs:**
- Composite index: (status, priority DESC)
- Efficient job queue claiming
- Index on created_at for FIFO within priority

**5. Session Events:**
- Index: session_id, created_at DESC
- Real-time event streaming
- Partition consideration for high volume

### Performance Strategy

**For MobVibe Real-Time Features:**
- Index all foreign keys (user_id, project_id, session_id)
- Add explicit filters in queries (don't rely only on RLS)
- Use composite indexes for queue operations
- Cache frequently accessed data (profiles, active sessions)
- Monitor slow query log and add indexes accordingly

### Security Strategy

**RLS Policies:**
- Enable on all tables
- Use auth.uid() for user isolation
- Service role bypasses RLS (worker operations)
- Subqueries for related table access (jobs via sessions)
- Never expose raw_user_meta_data for authorization

---

**Status:** Research Complete
**Confidence:** High - based on official docs and recent best practices
