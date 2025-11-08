# Node.js Worker Service Patterns Research (2025)

## Overview

Research findings on modern Node.js worker service patterns, PM2 process management, and Docker best practices for production deployments.

## Node.js Worker Service Architecture

### Web/Worker Process Separation

**Pattern**: Separate responsibilities between two process types:
- **Web Process**: Handle incoming HTTP requests, dispatch quickly
- **Worker Process**: Execute background tasks, long-running operations

**Benefits**:
- Independent scaling of web and worker processes
- Can run on same or different machines
- Prevents blocking main request-response cycle

### Queue-Based Architecture

**Implementation**: Use Redis-based queue (e.g., Kue, Bull) for inter-process communication
- Flexible approach for distributed systems
- Decouples web and worker processes
- Enables retry logic and job persistence

### Worker Threads vs Clustering

**Worker Threads**: For CPU-intensive operations within single process
- Image processing, encryption, data crunching
- Shared memory space
- Better for parallel CPU work

**Clustering**: For horizontal scaling across cores
- Multiple Node.js instances
- Process isolation
- Better for I/O-bound workloads

**MobVibe Choice**: Job queue pattern (already implemented in Phase 13)
- Supabase Realtime + PostgreSQL
- Worker claims jobs atomically
- No need for clustering in MVP

### Memory Management

**Large File Processing**: Use Streams instead of loading entire files
- Critical for files >5GB
- Memory efficient
- Prevents OOM errors

**MobVibe Application**: Job processing with bounded memory
- Session events streamed incrementally
- No massive file loads in worker
- Monitor memory usage over time

## PM2 Process Management

### Core Features

1. **Process Monitoring**:
   - `pm2 monit` - Real-time CPU/memory monitoring
   - Host vitals speedbar
   - Automatic restart on crash

2. **Graceful Shutdown**:
   - SIGINT signal sent first (interceptable)
   - 1.6s grace period (customizable)
   - SIGKILL if not exited
   - Zero downtime restarts

3. **Cluster Mode**:
   - Load balance HTTP/TCP/UDP
   - 10x performance on 16-core machines
   - Automatic worker management

4. **Startup Scripts**:
   - Generate system startup scripts
   - Auto-start on server reboot
   - Systemd/Upstart/Launchd support

### Production Configuration

```bash
# Start with PM2
pm2 start dist/index.js --name mobvibe-worker

# Cluster mode (if needed later)
pm2 start dist/index.js -i max --name mobvibe-worker-cluster

# Save process list
pm2 save

# Generate startup script
pm2 startup

# Monitor
pm2 monit
```

### Graceful Shutdown Implementation

**Required**: Intercept SIGINT/SIGTERM
```typescript
process.on('SIGINT', async () => {
  // 1. Stop accepting new jobs
  // 2. Finish current job (with timeout)
  // 3. Close database connections
  // 4. Exit cleanly
})
```

**MobVibe**: Already implementing in Phase 14
- Stop polling timer
- Wait for isProcessing flag
- Configurable timeout (30s default)

### Restart Strategies

- **Exponential Backoff**: Retry with increasing delays
- **Cron-Based**: Restart at specific times
- **Memory-Based**: Restart when memory exceeds threshold

## Docker Best Practices (2025)

### Alpine Base Image

**Image**: `node:20-alpine`
- 100MB+ smaller than standard node:20
- Production-ready in 2025
- Includes wget by default (not curl)

**Health Check**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider http://localhost:8080/health || exit 1
```

**Benefits**:
- 40% shorter recovery time after failure
- Orchestrators (Docker Compose, K8s) make intelligent decisions
- Self-aware containers

### Production Optimizations

1. **NODE_ENV=production**:
   - 30% less memory overhead
   - 30% faster boot times
   - Disables dev dependencies

2. **Multi-Stage Builds**:
   - Trim container size by 50%
   - Cut final image by up to 80%
   - Separate build and runtime stages

3. **npm ci vs npm install**:
   - Faster, deterministic installs
   - Respects package-lock.json exactly
   - Better for CI/CD pipelines

### Health Check Configuration

**Parameters**:
- `--interval=30s`: Check every 30 seconds
- `--timeout=5s`: Fail if no response in 5s
- `--start-period=10s`: Grace period during startup
- `--retries=3`: Mark unhealthy after 3 failures

**Endpoint Requirements**:
- Lightweight check (< 100ms)
- Return 200 OK when healthy
- Check critical dependencies (database connection)
- Avoid heavy operations

### Docker Compose for Development

```yaml
services:
  worker:
    build: .
    environment:
      - NODE_ENV=development
    ports:
      - "8080:8080"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## MobVibe Phase 14 Implementation

### Architecture Decisions

1. **Logging**: Pino (structured JSON logging)
   - Fast, low overhead
   - Pretty printing for development
   - Production-ready JSON output

2. **Health Check**: HTTP server on port 8080
   - `/health` endpoint
   - Returns uptime and timestamp
   - Docker HEALTHCHECK compatible

3. **Configuration**: Environment variables with validation
   - Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   - Optional: POLL_INTERVAL_MS, LOG_LEVEL, etc.
   - Fail fast on missing vars

4. **Graceful Shutdown**: 30s timeout
   - Stop polling
   - Wait for current job
   - Clean exit (code 0)

5. **Docker**: Alpine-based, multi-stage build
   - node:20-alpine base
   - npm ci for dependencies
   - Health check with wget

### Performance Targets

**Baseline** (Phase 13):
- ~5 jobs/second (single worker)
- 50ms claim latency

**Production** (Future):
- 10 workers = 50-100 jobs/second
- Horizontal scaling with more workers
- Monitor: CPU, memory, job latency

### Monitoring Strategy

**Metrics to Track**:
- Jobs processed per minute
- Average job duration
- Memory usage over time
- Health check failures

**Tools**:
- Pino logs → Structured JSON
- PM2 monitoring (if used)
- Docker health checks
- Future: Prometheus/Grafana

## References

- [Node.js Worker Threads Documentation](https://nodejs.org/api/worker_threads.html)
- [PM2 Official Documentation](https://pm2.keymetrics.io/)
- [Docker Health Check Best Practices](https://patrickleet.medium.com/effective-docker-healthchecks-for-node-js-b11577c3e595)
- [Node.js 2025 Patterns](https://kashw1n.com/blog/nodejs-2025/)

---

**Research Date**: 2025-01-07
**Phase**: 14 - Worker Service Foundation
**Status**: Complete
