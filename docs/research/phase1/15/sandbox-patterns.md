# Sandbox Orchestration Research (2025)

## Overview

Research findings on Fly.io Machines API best practices, Docker container orchestration security, and sandbox isolation patterns for running untrusted code.

## Fly.io Machines API

### Core Concepts

**Fly Machines** are fast-booting VMs with a REST API that can boot instances in about 300ms. They provide ephemeral storage with a blank slate on every startup, and can stop automatically when a program exits or start quickly either manually or automatically based on traffic.

### Lifecycle States

Machines move through states:
1. **created** - Space is reserved and container is fetched
2. **started** - Machine is booted
3. **stopped** - Machine is stopped but intact

**Starting a stopped Machine** usually takes well under a second.

### Best Practices for API Usage

**1. Retry Logic**
- Both flyctl and the Fly Machines API are best-effort
- It's on you to retry requests and ensure they go through
- Placement can fail as capacity can run out in particular regions

**2. Idle Detection**
- When using Fly.io machines to run apps that need to scale down, make your process exit when it's idle
- This effectively stops the machine but keeps it intact to pick up a future start request from a clean slate

**3. Ephemeral Execution**
- Use `fly machine run --rm` to spin up ephemeral Machines manually
- These machines are automatically destroyed after they stop

**4. Blue-Green Deployments**
- `skip_service_registration` leaves a Machine disconnected from Fly.io's request routing
- Useful for blue-green deploys where you bring a Machine up, test it healthy, and only then let user requests hit it

### Performance Characteristics

- **Boot Time**: ~300ms for fast-booting VMs
- **Start Time**: <1 second for stopped machines
- **API Response**: Best-effort, requires retry logic
- **Ephemeral Storage**: Blank slate on every startup

### MobVibe Application

**Usage Pattern**: Short-lived ephemeral sandboxes
- Create machine for coding session
- Execute Claude Agent operations
- Destroy machine when session ends
- Auto-destroy on timeout (30 minutes)

**Key Features to Use**:
- `auto_destroy: true` - Automatic cleanup when stopped
- Ephemeral storage - No persistence needed
- Fast boot times - Better UX
- API-based lifecycle management

## Docker Container Security & Isolation

### Core Isolation Mechanisms

**Namespaces** provide each container with its own independent:
- Networking
- Processes
- Storage

**Cgroups (Control Groups)** enforce resource limits:
- CPU usage ceilings
- Memory allocation limits
- Disk I/O quotas
- Network bandwidth control

### Security Best Practices (2025)

**1. Run as Non-Root User**
```dockerfile
RUN addgroup -S appuser && adduser -S -G appuser appuser
USER appuser
```

**2. Apply Resource Limits**
- Docker's resource limitations balance allocation
- Prevent single container from bringing system down
- Each container gets fair share of memory, CPU, disk I/O

**3. Enhanced Container Isolation (ECI)**
- Docker Desktop feature for stronger isolation
- Each Kubernetes node runs in ECI-protected container
- WSL 2 offers better performance but reduced security vs Hyper-V

**4. Network Isolation**
- Fine-grained control over pod communication
- Network policies for Kubernetes
- Isolated networking per container

### Recent Security Vulnerability (CVE-2025-9074)

**Critical Vulnerability Discovered**:
- Compromised containerization's core security principles
- Affected Windows and macOS
- Allowed containers to escape isolation
- Could access Docker Engine API via default subnet
- Take over host system

**Resolution**: Docker Desktop patch 4.44.3 (fixed within days)

**Lesson**: Container isolation is not absolute, requires defense-in-depth

### Resource Limits Implementation

**CPU Limits**:
- Set CPU shares or quotas per container
- Prevent CPU starvation
- Fair scheduling across containers

**Memory Limits**:
- Hard limits prevent OOM on host
- Soft limits for memory pressure
- Automatic cleanup of exceeding containers

**Disk I/O Limits**:
- Prevent disk thrashing
- Fair I/O allocation
- Protect against storage exhaustion

## Sandbox Security for Untrusted Code

### Docker Limitations

**Important Reality**: Docker is NOT the most secure way to run untrusted code
- Isolation based on LXC containers (Linux Kernel feature)
- Host machine and containers share same kernel
- Security compromised if Linux Kernel vulnerability found
- Safer to run as non-root user even in container

### Hardened Docker Configuration (August 2025)

**Locked-down Container Setup**:
```bash
docker run \
  --rm \                              # No persistent storage
  --read-only \                       # Read-only filesystem
  --security-opt no-new-privileges \  # No privilege escalation
  --cap-drop ALL \                    # Drop all capabilities
  --memory 512m \                     # Limit memory
  --cpus 1.0 \                        # Limit CPU
  --network none \                    # No network access
  your-image
```

**Key Hardening Flags**:
- `--cap-drop ALL`: Remove all Linux capabilities
- `--security-opt no-new-privileges`: Prevent privilege escalation
- `--read-only`: Immutable filesystem
- `--memory`, `--cpus`: Resource limits
- `--network none`: Network isolation

**Result**: Everything wiped clean when stopped

### gVisor for Enhanced Isolation (March 2025)

**What is gVisor**:
- User-space kernel providing strong isolation
- Intercepts system calls made by processes inside virtualized environment
- Can run standalone or as Docker runtime
- Perfect middle ground for running untrusted code

**Benefits**:
- Stronger isolation than standard Docker
- Protects host kernel from untrusted code
- Recommended for AI agent sandboxes

**MobVibe Consideration**: Evaluate gVisor vs standard Docker based on threat model

### Security Layers for MobVibe

**Layer 1: Fly.io Isolation**
- Each machine is separate VM
- Network isolation between machines
- Hardware-level isolation

**Layer 2: Docker Container**
- Namespace isolation
- Cgroup resource limits
- Non-root user execution

**Layer 3: Hardened Configuration**
- Read-only filesystem
- No privilege escalation
- Dropped capabilities
- Resource limits (CPU, memory)

**Layer 4: Time-Based Limits**
- 30-minute maximum runtime
- Automatic cleanup on timeout
- Force-stop on expiration

**Layer 5: Network Restrictions**
- Limited outbound access
- No direct internet access (Fly.io provides)
- Rate limiting at API level

## Container Orchestration for Sandboxes

### Ephemeral vs Persistent Patterns

**Ephemeral (MobVibe Pattern)**:
- Create on demand
- Short-lived (minutes to hours)
- No state preservation
- Automatic cleanup
- Lower cost (pay per use)

**Persistent**:
- Long-running containers
- State preservation
- Higher fixed cost
- Better for always-on services

### Auto-Destroy Strategies

**Fly.io auto_destroy: true**:
- Automatically destroy machine when stopped
- No manual cleanup needed
- Reduced cost (no stopped machine charges)

**Timeout-Based Cleanup**:
- Monitor machine age
- Force-stop after threshold (30 minutes)
- Cleanup stale machines periodically

**Session-Based Lifecycle**:
- Tie machine to coding session
- Destroy when session ends
- Handle crash scenarios (orphaned machines)

## Cost Optimization

### Fly.io Pricing Model

- Pay per second while running
- No charge for stopped machines with auto_destroy
- Reduced cost with ephemeral patterns

### Optimization Strategies

**1. Fast Boot Times**
- Small Docker images (<500MB)
- Minimal dependencies
- Layer caching

**2. Aggressive Cleanup**
- 30-minute timeout
- Auto-destroy on stop
- Periodic orphan cleanup

**3. Resource Rightsizing**
- 512MB memory (sufficient for Node + Expo CLI)
- 1 CPU (shared, cost-effective)
- Monitor actual usage

**4. Region Selection**
- Single region for MVP (sjc - San Jose)
- Multi-region adds complexity
- Consider user proximity for production

### Monitoring & Alerts

**Cost Alerts**:
- Daily spending threshold
- Unusual machine count
- Long-running machines

**Usage Metrics**:
- Average machine lifetime
- Peak concurrent machines
- Failed creations (capacity issues)

## MobVibe Implementation Strategy

### Sandbox Image Design

**Base Image**: `node:20-alpine`
- Small size (~50MB base)
- Fast boot times
- Security-focused (Alpine)

**Installed Tools**:
- Node.js 20 LTS
- Expo CLI (for React Native development)
- EAS CLI (Expo Application Services)
- Git (version control)
- Bash (shell operations)

**Security Hardening**:
- Non-root user (`appuser`)
- Minimal system packages
- No persistent storage

### Lifecycle Management

**Creation**:
1. API call to Fly.io Machines
2. Wait for machine ready (~300ms)
3. Store machine ID in session
4. Begin executing commands

**Operation**:
1. Execute commands via Fly.io API
2. Stream output to session events
3. Monitor timeout (30 minutes)
4. Handle errors gracefully

**Cleanup**:
1. Session ends → destroy machine
2. Timeout reached → force destroy
3. Worker shutdown → destroy all
4. Periodic cleanup of orphans (every minute)

### Error Handling

**Creation Failures**:
- Retry with exponential backoff
- Try different region if capacity full
- Fail job if all retries exhausted

**Execution Failures**:
- Capture stderr and exit codes
- Store in session events
- Allow retry from mobile app

**Cleanup Failures**:
- Log error but continue
- Orphaned machines caught by periodic cleanup
- Alert on consistent failures

## Security Recommendations

### Minimal Privilege

- Run all processes as non-root
- Drop unnecessary Linux capabilities
- Use read-only filesystem where possible
- Limit network access

### Defense in Depth

- Multiple isolation layers (VM + container + hardening)
- Time-based limits (30 minutes max)
- Resource limits (CPU, memory)
- Monitoring and alerting

### Secrets Management

- Never store secrets in Docker image
- Pass secrets via Fly.io environment variables
- Rotate API tokens regularly
- Use short-lived credentials

### Audit Logging

- Log all sandbox operations
- Track machine lifecycle events
- Monitor resource usage
- Alert on anomalies

## Testing Strategy

### Unit Tests

- SandboxManager CRUD operations
- SandboxLifecycle state management
- Timeout and cleanup logic

### Integration Tests

- Create real machine on Fly.io
- Execute test commands
- Verify output
- Cleanup successfully

### Load Tests

- Multiple concurrent sandboxes
- Measure create/destroy times
- Monitor resource usage
- Identify bottlenecks

### Security Tests

- Verify non-root execution
- Test resource limits
- Attempt privilege escalation
- Check network isolation

## References

- [Fly.io Machines Overview](https://fly.io/docs/machines/overview/)
- [Fly.io Machines API](https://fly.io/docs/machines/api/)
- [Docker Security Best Practices](https://blog.gitguardian.com/how-to-improve-your-docker-containers-security-cheat-sheet/)
- [Sandboxing Code in Containers (AWS)](https://aws.amazon.com/blogs/startups/sandboxing-code-in-the-era-of-containers/)
- [gVisor for AI Agents](https://amirmalik.net/2025/03/07/code-sandboxes-for-llm-ai-agents)

---

**Research Date**: 2025-01-07
**Phase**: 15 - Sandbox Orchestration
**Status**: Complete
