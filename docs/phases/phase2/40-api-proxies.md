# Phase 40: Backend API Proxies

## Metadata
```yaml
phase: 40
title: Backend API Proxies
track: Advanced Interaction
category: infrastructure
priority: critical
complexity: high
estimated_hours: 16
dependencies: [14, 28]
websearch: true
```

## Overview
Build secure proxy infrastructure in the backend to handle external API requests (Anthropic, E2B, Nano Banana, ElevenLabs), implementing rate limiting per user, key rotation, audit logging, and cost tracking.

## Success Criteria
- [ ] All external APIs proxied through backend
- [ ] Rate limiting enforces 100 req/hour per user
- [ ] API keys never exposed to client
- [ ] Request/response logged for audit
- [ ] Key rotation supports zero-downtime
- [ ] Cost tracking per user/project
- [ ] Error responses sanitized (no key leaks)

## Technical Approach

### Proxy Architecture
```typescript
// backend/src/routes/proxy.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import { auditLog } from '../middleware/audit-log';
import { AnthropicProxy } from '../proxies/anthropic';
import { E2BProxy } from '../proxies/e2b';
import { NanoBananaProxy } from '../proxies/nano-banana';
import { ElevenLabsProxy } from '../proxies/elevenlabs';

const router = Router();

// All proxy routes require auth + rate limiting + audit
router.use(authenticate);
router.use(rateLimit);
router.use(auditLog);

// Anthropic Claude API
router.post('/anthropic/messages', async (req, res) => {
  const proxy = new AnthropicProxy(req.user.id);
  await proxy.forward(req, res);
});

// E2B Sandbox API
router.post('/e2b/sandboxes', async (req, res) => {
  const proxy = new E2BProxy(req.user.id);
  await proxy.forward(req, res);
});

router.post('/e2b/sandboxes/:id/execute', async (req, res) => {
  const proxy = new E2BProxy(req.user.id);
  await proxy.forward(req, res);
});

// Nano Banana Icon API
router.post('/nano-banana/generate', async (req, res) => {
  const proxy = new NanoBananaProxy(req.user.id);
  await proxy.forward(req, res);
});

// ElevenLabs Audio API
router.post('/elevenlabs/generate', async (req, res) => {
  const proxy = new ElevenLabsProxy(req.user.id);
  await proxy.forward(req, res);
});

export default router;
```

### Base Proxy Class
```typescript
// backend/src/proxies/base-proxy.ts
export abstract class BaseProxy {
  constructor(
    protected userId: string,
    protected apiName: string
  ) {}

  async forward(req: Request, res: Response): Promise<void> {
    const requestId = generateRequestId();

    try {
      // Get API key from secure vault
      const apiKey = await this.getApiKey();

      // Track cost estimate
      const costEstimate = this.estimateCost(req.body);
      await this.recordCostEstimate(requestId, costEstimate);

      // Forward request
      const response = await this.makeRequest(req, apiKey);

      // Track actual cost
      const actualCost = this.calculateCost(response);
      await this.recordActualCost(requestId, actualCost);

      // Sanitize response (remove any key references)
      const sanitized = this.sanitizeResponse(response);

      res.json(sanitized);
    } catch (error) {
      await this.handleError(requestId, error, res);
    }
  }

  protected abstract getApiKey(): Promise<string>;
  protected abstract makeRequest(req: Request, apiKey: string): Promise<any>;
  protected abstract estimateCost(body: any): number;
  protected abstract calculateCost(response: any): number;
  protected abstract sanitizeResponse(response: any): any;

  protected async recordCostEstimate(requestId: string, cost: number) {
    await db.query(
      `INSERT INTO api_usage (request_id, user_id, api_name, estimated_cost, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [requestId, this.userId, this.apiName, cost]
    );
  }

  protected async recordActualCost(requestId: string, cost: number) {
    await db.query(
      `UPDATE api_usage
       SET actual_cost = $1, status = 'completed', completed_at = NOW()
       WHERE request_id = $2`,
      [cost, requestId]
    );
  }

  protected async handleError(requestId: string, error: any, res: Response) {
    // Log error securely (no key exposure)
    await db.query(
      `UPDATE api_usage SET status = 'failed', error = $1 WHERE request_id = $2`,
      [error.message, requestId]
    );

    // Sanitize error response
    const sanitized = {
      error: error.message.replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED]'),
      requestId
    };

    res.status(error.status || 500).json(sanitized);
  }
}
```

### Anthropic Proxy
```typescript
// backend/src/proxies/anthropic.ts
export class AnthropicProxy extends BaseProxy {
  constructor(userId: string) {
    super(userId, 'anthropic');
  }

  protected async getApiKey(): Promise<string> {
    return await getRotatedKey('anthropic');
  }

  protected async makeRequest(req: Request, apiKey: string) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw { status: response.status, message: error.error?.message };
    }

    return response.json();
  }

  protected estimateCost(body: any): number {
    // Estimate tokens from prompt
    const inputTokens = estimateTokens(body.messages);
    const outputTokens = body.max_tokens || 1024;

    // Claude pricing (per million tokens)
    const inputCost = (inputTokens / 1_000_000) * 3.00;
    const outputCost = (outputTokens / 1_000_000) * 15.00;

    return inputCost + outputCost;
  }

  protected calculateCost(response: any): number {
    const usage = response.usage;
    const inputCost = (usage.input_tokens / 1_000_000) * 3.00;
    const outputCost = (usage.output_tokens / 1_000_000) * 15.00;
    return inputCost + outputCost;
  }

  protected sanitizeResponse(response: any): any {
    // Remove any metadata that might contain keys
    const { id, type, role, content, usage, stop_reason } = response;
    return { id, type, role, content, usage, stop_reason };
  }
}
```

### Rate Limiting
```typescript
// backend/src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

export const apiRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour per user
  keyGenerator: (req) => req.user.id,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit: 100,
      window: '1 hour',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});
```

### Key Rotation
```typescript
// backend/src/services/key-rotation.ts
export class KeyRotationService {
  private keys: Map<string, ApiKey[]> = new Map();
  private currentIndex: Map<string, number> = new Map();

  async initialize() {
    // Load keys from secure vault
    const keys = await this.loadKeysFromVault();

    for (const key of keys) {
      if (!this.keys.has(key.service)) {
        this.keys.set(key.service, []);
        this.currentIndex.set(key.service, 0);
      }
      this.keys.get(key.service)!.push(key);
    }
  }

  async getRotatedKey(service: string): Promise<string> {
    const serviceKeys = this.keys.get(service);
    if (!serviceKeys || serviceKeys.length === 0) {
      throw new Error(`No keys available for ${service}`);
    }

    const currentIdx = this.currentIndex.get(service) || 0;
    const key = serviceKeys[currentIdx];

    // Check if key is near rate limit
    if (await this.isNearRateLimit(key)) {
      // Rotate to next key
      const nextIdx = (currentIdx + 1) % serviceKeys.length;
      this.currentIndex.set(service, nextIdx);
      return serviceKeys[nextIdx].value;
    }

    return key.value;
  }

  private async isNearRateLimit(key: ApiKey): Promise<boolean> {
    const usage = await this.getKeyUsage(key);
    return usage.requests >= key.rateLimit * 0.9; // 90% threshold
  }

  private async loadKeysFromVault(): Promise<ApiKey[]> {
    // Load from AWS Secrets Manager, HashiCorp Vault, etc.
    const secrets = await fetch(process.env.VAULT_URL, {
      headers: { Authorization: `Bearer ${process.env.VAULT_TOKEN}` }
    }).then(r => r.json());

    return secrets.keys.map((k: any) => ({
      service: k.service,
      value: k.value,
      rateLimit: k.rateLimit || 1000,
      createdAt: new Date(k.createdAt)
    }));
  }
}

export const getRotatedKey = async (service: string) => {
  return keyRotationService.getRotatedKey(service);
};
```

### Audit Logging
```typescript
// backend/src/middleware/audit-log.ts
export const auditLog = async (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const startTime = Date.now();

  // Capture request
  const auditEntry = {
    request_id: requestId,
    user_id: req.user?.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    user_agent: req.headers['user-agent'],
    body: sanitizeBody(req.body),
    timestamp: new Date()
  };

  // Capture response
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    auditEntry.response_status = res.statusCode;
    auditEntry.response_time = Date.now() - startTime;
    auditEntry.response_body = sanitizeBody(body);

    // Log to database
    db.query(
      `INSERT INTO audit_logs (request_id, user_id, method, path, ip, user_agent,
        request_body, response_status, response_time, response_body, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        auditEntry.request_id,
        auditEntry.user_id,
        auditEntry.method,
        auditEntry.path,
        auditEntry.ip,
        auditEntry.user_agent,
        JSON.stringify(auditEntry.body),
        auditEntry.response_status,
        auditEntry.response_time,
        JSON.stringify(auditEntry.response_body),
        auditEntry.timestamp
      ]
    ).catch(err => console.error('Audit log failed:', err));

    return originalJson(body);
  };

  next();
};

function sanitizeBody(body: any): any {
  // Remove sensitive fields
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.api_key;
  return sanitized;
}
```

## Implementation Steps

1. **Base Proxy Infrastructure** (4h)
   - Implement BaseProxy class
   - Add request forwarding logic
   - Build cost tracking
   - Create response sanitization

2. **Service-Specific Proxies** (4h)
   - Build AnthropicProxy
   - Build E2BProxy
   - Build NanoBananaProxy
   - Build ElevenLabsProxy

3. **Rate Limiting** (2h)
   - Set up Redis store
   - Implement 100 req/hour limit
   - Add rate limit headers
   - Build limit exceeded handler

4. **Key Rotation** (3h)
   - Build KeyRotationService
   - Implement vault integration
   - Add rate limit detection
   - Create zero-downtime rotation

5. **Audit Logging** (3h)
   - Build audit middleware
   - Log all requests/responses
   - Sanitize sensitive data
   - Create audit log queries

## Testing Requirements

### Unit Tests
```typescript
describe('AnthropicProxy', () => {
  it('should forward requests correctly', async () => {
    const proxy = new AnthropicProxy('user-123');
    // Test request forwarding
  });

  it('should sanitize API keys from errors', async () => {
    // Test key redaction
  });

  it('should calculate costs accurately', async () => {
    // Test cost calculation
  });
});
```

### Integration Tests
- Rate limit enforces 100 req/hour
- Key rotation switches on high usage
- Audit logs capture all requests
- Cost tracking records estimates & actuals

## Files Changed
```
backend/src/routes/proxy.ts           [new]
backend/src/proxies/base-proxy.ts     [new]
backend/src/proxies/anthropic.ts      [new]
backend/src/proxies/e2b.ts            [new]
backend/src/proxies/nano-banana.ts    [new]
backend/src/proxies/elevenlabs.ts     [new]
backend/src/middleware/rate-limit.ts  [new]
backend/src/middleware/audit-log.ts   [new]
backend/src/services/key-rotation.ts  [new]
```

## Database Schema
```sql
-- API usage tracking
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  api_name TEXT NOT NULL,
  estimated_cost DECIMAL(10, 6),
  actual_cost DECIMAL(10, 6),
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_api_usage_user ON api_usage(user_id, created_at DESC);
CREATE INDEX idx_api_usage_project ON api_usage(project_id, created_at DESC);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  ip INET,
  user_agent TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_time INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id);
```

## Notes
- All API keys stored in secure vault (AWS Secrets Manager)
- Rate limiting per user prevents abuse
- Key rotation ensures zero downtime
- Audit logs enable security monitoring
- Cost tracking helps manage budget
- Error responses sanitized to prevent key leaks
- Consider adding cost alerts when user exceeds budget
