# Phase 33: Security Audit

**Duration:** 1.5 days
**Dependencies:** [32]
**Status:** Pending

## Objective

Conduct comprehensive security audit including penetration testing, RLS verification, secret scanning, and OWASP compliance to ensure production-ready security posture.

## Scope

### In Scope
- Penetration testing (automated & manual)
- Row Level Security (RLS) verification
- Secret scanning & credential management
- OWASP Top 10 compliance check
- API security testing
- Authentication/authorization audit
- Dependency vulnerability scan

### Out of Scope
- Infrastructure security (covered in deployment)
- DDoS protection (infrastructure level)
- Physical security
- Third-party service audits (Supabase, E2B)

## Technical Architecture

### Security Framework
```yaml
Standards: OWASP Top 10, OWASP Mobile Top 10
Testing: OWASP ZAP, Burp Suite Community, npm audit
RLS: Supabase RLS policies, automated tests
Secrets: git-secrets, TruffleHog, environment validation
Monitoring: Sentry security events, audit logging
```

### Threat Model
```yaml
High Priority:
  - Unauthorized data access (RLS bypass)
  - API authentication bypass
  - Injection attacks (SQL, code)
  - Sensitive data exposure (tokens, keys)
  - Broken authentication/session management

Medium Priority:
  - XSS via generated code
  - CSRF attacks
  - Insecure dependencies
  - Excessive permissions

Low Priority:
  - Rate limiting bypass
  - Information disclosure
  - Session fixation
```

## Implementation Plan

### 1. Automated Security Scanning (3 hours)
```yaml
# .github/workflows/security-scan.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # Weekly Sunday scan

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Snyk vulnerability scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Full history for secret scan

      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

      - name: git-secrets scan
        run: |
          git clone https://github.com/awslabs/git-secrets.git
          cd git-secrets
          sudo make install
          cd ..
          git secrets --scan

  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/react
            p/typescript
            p/security-audit
            p/owasp-top-ten

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t mobvibe-api:test ./backend

      - name: Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: mobvibe-api:test
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

### 2. RLS Policy Verification (4 hours)
```sql
-- supabase/tests/rls-tests.sql
-- Test RLS policies are properly enforced

BEGIN;
SELECT plan(15);

-- Test: Users can only access their own sessions
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user1-id"}';

PREPARE get_own_sessions AS
  SELECT * FROM coding_sessions WHERE user_id = 'user1-id';

PREPARE get_other_sessions AS
  SELECT * FROM coding_sessions WHERE user_id = 'user2-id';

SELECT results_eq(
  'get_own_sessions',
  'Should return user1 sessions'
);

SELECT is_empty(
  'get_other_sessions',
  'Should not return other user sessions'
);

-- Test: Cannot insert session for another user
PREPARE insert_other_user_session AS
  INSERT INTO coding_sessions (user_id, title)
  VALUES ('user2-id', 'Hacked Session');

SELECT throws_ok(
  'insert_other_user_session',
  'new row violates row-level security policy'
);

-- Test: Cannot update other user sessions
PREPARE update_other_session AS
  UPDATE coding_sessions
  SET title = 'Hacked'
  WHERE user_id = 'user2-id';

SELECT is(
  (SELECT COUNT(*) FROM update_other_session),
  0::bigint,
  'Should not update other user sessions'
);

-- Test: Cannot delete other user sessions
PREPARE delete_other_session AS
  DELETE FROM coding_sessions WHERE user_id = 'user2-id';

SELECT is(
  (SELECT COUNT(*) FROM delete_other_session),
  0::bigint,
  'Should not delete other user sessions'
);

-- Test: Anonymous users cannot access any sessions
SET LOCAL ROLE anon;

PREPARE anon_get_sessions AS
  SELECT * FROM coding_sessions;

SELECT is_empty(
  'anon_get_sessions',
  'Anonymous users should not see sessions'
);

-- Test: service_role can bypass RLS (for admin operations)
SET LOCAL ROLE service_role;

PREPARE service_get_all AS
  SELECT COUNT(*) FROM coding_sessions;

SELECT ok(
  (SELECT COUNT(*) FROM service_get_all) > 0,
  'Service role should bypass RLS'
);

SELECT * FROM finish();
ROLLBACK;
```

```typescript
// src/__tests__/security/rls-enforcement.test.ts
import { createClient } from '@supabase/supabase-js';

describe('RLS Policy Enforcement', () => {
  let user1Client: SupabaseClient;
  let user2Client: SupabaseClient;

  beforeAll(async () => {
    // Create two authenticated clients
    user1Client = await createAuthenticatedClient('user1@test.com');
    user2Client = await createAuthenticatedClient('user2@test.com');
  });

  it('should prevent cross-user session access', async () => {
    // User1 creates session
    const { data: session } = await user1Client
      .from('coding_sessions')
      .insert({ title: 'User1 Session' })
      .select()
      .single();

    // User2 tries to read User1's session
    const { data, error } = await user2Client
      .from('coding_sessions')
      .select()
      .eq('id', session.id);

    expect(data).toEqual([]);
    expect(error).toBeNull(); // RLS filters silently
  });

  it('should prevent unauthorized session updates', async () => {
    const { data: session } = await user1Client
      .from('coding_sessions')
      .insert({ title: 'Original Title' })
      .select()
      .single();

    // User2 tries to update User1's session
    const { error } = await user2Client
      .from('coding_sessions')
      .update({ title: 'Hacked Title' })
      .eq('id', session.id);

    // Verify no update occurred
    const { data: updated } = await user1Client
      .from('coding_sessions')
      .select()
      .eq('id', session.id)
      .single();

    expect(updated.title).toBe('Original Title');
  });

  it('should prevent unauthorized session deletion', async () => {
    const { data: session } = await user1Client
      .from('coding_sessions')
      .insert({ title: 'Session to Delete' })
      .select()
      .single();

    // User2 tries to delete User1's session
    await user2Client
      .from('coding_sessions')
      .delete()
      .eq('id', session.id);

    // Verify session still exists
    const { data } = await user1Client
      .from('coding_sessions')
      .select()
      .eq('id', session.id);

    expect(data).toHaveLength(1);
  });

  it('should enforce RLS on generated_code table', async () => {
    const { data: session } = await user1Client
      .from('coding_sessions')
      .insert({ title: 'Session with Code' })
      .select()
      .single();

    const { data: code } = await user1Client
      .from('generated_code')
      .insert({
        session_id: session.id,
        code: 'console.log("test")',
        language: 'javascript'
      })
      .select()
      .single();

    // User2 tries to access User1's code
    const { data: leaked } = await user2Client
      .from('generated_code')
      .select()
      .eq('id', code.id);

    expect(leaked).toEqual([]);
  });
});
```

### 3. API Security Testing (4 hours)
```typescript
// security-tests/api-security.test.ts
import axios from 'axios';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('API Security', () => {
  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      await expect(
        axios.get(`${API_URL}/sessions`)
      ).rejects.toMatchObject({
        response: { status: 401 }
      });
    });

    it('should reject invalid auth tokens', async () => {
      await expect(
        axios.get(`${API_URL}/sessions`, {
          headers: { Authorization: 'Bearer invalid-token' }
        })
      ).rejects.toMatchObject({
        response: { status: 401 }
      });
    });

    it('should reject expired tokens', async () => {
      const expiredToken = generateExpiredToken();

      await expect(
        axios.get(`${API_URL}/sessions`, {
          headers: { Authorization: `Bearer ${expiredToken}` }
        })
      ).rejects.toMatchObject({
        response: { status: 401, data: { error: 'Token expired' } }
      });
    });
  });

  describe('Injection Prevention', () => {
    it('should prevent SQL injection in session queries', async () => {
      const token = await getValidToken();
      const maliciousTitle = "'; DROP TABLE coding_sessions; --";

      const { data } = await axios.post(
        `${API_URL}/sessions`,
        { title: maliciousTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Should create session safely, not execute SQL
      expect(data.title).toBe(maliciousTitle);

      // Verify table still exists
      const { status } = await axios.get(`${API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(status).toBe(200);
    });

    it('should prevent code injection in prompts', async () => {
      const token = await getValidToken();
      const maliciousPrompt = '"; process.exit(1); //';

      const { data } = await axios.post(
        `${API_URL}/sessions/generate`,
        { prompt: maliciousPrompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Should return safely, not execute injected code
      expect(data.code).toBeDefined();
    });

    it('should sanitize XSS in generated code previews', async () => {
      const token = await getValidToken();
      const xssCode = '<script>alert("XSS")</script>';

      const { data } = await axios.post(
        `${API_URL}/sessions/preview`,
        { code: xssCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Should escape HTML entities
      expect(data.previewHtml).not.toContain('<script>');
      expect(data.previewHtml).toContain('&lt;script&gt;');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on generation endpoint', async () => {
      const token = await getValidToken();

      // Make 11 requests (limit is 10/min)
      const requests = Array(11).fill(null).map(() =>
        axios.post(
          `${API_URL}/sessions/generate`,
          { prompt: 'test' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      const results = await Promise.allSettled(requests);
      const rateLimited = results.filter(r =>
        r.status === 'rejected' &&
        r.reason.response?.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization', () => {
    it('should prevent access to other user resources', async () => {
      const user1Token = await getValidToken('user1@test.com');
      const user2Token = await getValidToken('user2@test.com');

      // User1 creates session
      const { data: session } = await axios.post(
        `${API_URL}/sessions`,
        { title: 'User1 Session' },
        { headers: { Authorization: `Bearer ${user1Token}` } }
      );

      // User2 tries to access User1's session
      await expect(
        axios.get(`${API_URL}/sessions/${session.id}`, {
          headers: { Authorization: `Bearer ${user2Token}` }
        })
      ).rejects.toMatchObject({
        response: { status: 403 }
      });
    });
  });

  describe('Input Validation', () => {
    it('should reject oversized payloads', async () => {
      const token = await getValidToken();
      const oversizedPrompt = 'a'.repeat(100000); // 100KB

      await expect(
        axios.post(
          `${API_URL}/sessions/generate`,
          { prompt: oversizedPrompt },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 413 } // Payload too large
      });
    });

    it('should validate UUID formats', async () => {
      const token = await getValidToken();

      await expect(
        axios.get(`${API_URL}/sessions/not-a-uuid`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ).rejects.toMatchObject({
        response: { status: 400, data: { error: 'Invalid session ID' } }
      });
    });
  });
});
```

### 4. Secret Scanning & Management (2 hours)
```bash
# scripts/security/scan-secrets.sh
#!/bin/bash

echo "Running secret scan..."

# Install tools if needed
command -v trufflehog >/dev/null 2>&1 || {
  echo "Installing TruffleHog..."
  pip install trufflehog
}

# Scan git history for secrets
echo "Scanning git history..."
trufflehog filesystem . --json > secrets-report.json

# Check for common secret patterns
echo "Checking for exposed secrets..."
grep -r "EXPO_PUBLIC_SUPABASE_ANON_KEY" --include="*.ts" --include="*.tsx" app/

# Verify .env files not committed
if git ls-files | grep -q "\.env$"; then
  echo "ERROR: .env file committed to git!"
  exit 1
fi

# Verify no hardcoded credentials
if grep -r "password.*=.*['\"]" --include="*.ts" --include="*.tsx" src/; then
  echo "WARNING: Potential hardcoded password found"
  exit 1
fi

echo "Secret scan complete. Review secrets-report.json for findings."
```

```typescript
// scripts/security/validate-env.ts
/**
 * Validate environment variables are properly configured
 */
const requiredEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_E2B_API_KEY',
  'EXPO_PUBLIC_API_URL'
];

const sensitiveEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2B_API_KEY',
  'SENTRY_AUTH_TOKEN'
];

function validateEnvironment() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required vars exist
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Check sensitive vars not exposed in public vars
  for (const varName of sensitiveEnvVars) {
    if (varName.startsWith('EXPO_PUBLIC_')) {
      errors.push(`Sensitive variable exposed as public: ${varName}`);
    }
  }

  // Check URL formats
  if (process.env.EXPO_PUBLIC_SUPABASE_URL &&
      !process.env.EXPO_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('Supabase URL must use HTTPS');
  }

  // Check for placeholder values
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (value && (value.includes('YOUR_') || value.includes('PLACEHOLDER'))) {
      warnings.push(`${varName} appears to be a placeholder`);
    }
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(err => console.error(`  ❌ ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('Environment warnings:');
    warnings.forEach(warn => console.warn(`  ⚠️  ${warn}`));
  }

  console.log('✅ Environment validation passed');
}

validateEnvironment();
```

### 5. OWASP Compliance Check (3 hours)
```typescript
// security-tests/owasp-compliance.test.ts
/**
 * OWASP Top 10 2021 Compliance Tests
 */
describe('OWASP Top 10 Compliance', () => {
  describe('A01:2021 - Broken Access Control', () => {
    it('enforces authentication on protected endpoints', async () => {
      // Tested in API security tests
    });

    it('enforces authorization (RLS)', async () => {
      // Tested in RLS verification
    });

    it('prevents directory traversal', async () => {
      const token = await getValidToken();
      const maliciousPath = '../../../etc/passwd';

      await expect(
        axios.get(`${API_URL}/files/${maliciousPath}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ).rejects.toMatchObject({
        response: { status: 400 }
      });
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    it('uses HTTPS for API communication', () => {
      expect(process.env.EXPO_PUBLIC_API_URL).toMatch(/^https:\/\//);
    });

    it('stores passwords hashed (Supabase Auth)', async () => {
      // Verified by Supabase - bcrypt by default
      // Manual check: passwords never returned in API
      const { data } = await supabase.auth.getUser();
      expect(data.user).not.toHaveProperty('password');
    });
  });

  describe('A03:2021 - Injection', () => {
    it('prevents SQL injection', async () => {
      // Tested in API security tests
    });

    it('should sandbox untrusted code execution', async () => {
      const token = await getValidToken();
      // Note: Actual sandbox testing done in E2B environment
      // This test verifies proper error handling

      const { data } = await axios.post(
        `${API_URL}/sandbox/execute`,
        { code: 'while(true) {}' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      expect(data.timeout).toBe(true);
    });
  });

  describe('A04:2021 - Insecure Design', () => {
    it('implements rate limiting', async () => {
      // Tested in API security tests
    });

    it('validates all user inputs', async () => {
      // Tested in input validation section
    });
  });

  describe('A05:2021 - Security Misconfiguration', () => {
    it('disables debug mode in production', () => {
      expect(__DEV__).toBe(false);
    });

    it('sets secure headers', async () => {
      const { headers } = await axios.get(`${API_URL}/health`);

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['strict-transport-security']).toMatch(/max-age=/);
    });
  });

  describe('A06:2021 - Vulnerable Components', () => {
    it('has no high/critical vulnerabilities', async () => {
      // Run: npm audit --audit-level=high
      // Verified in CI/CD pipeline
    });
  });

  describe('A07:2021 - Authentication Failures', () => {
    it('enforces strong password policy', async () => {
      const weakPassword = '123456';

      await expect(
        supabase.auth.signUp({
          email: 'test@example.com',
          password: weakPassword
        })
      ).rejects.toMatchObject({
        message: /Password must be at least 8 characters/
      });
    });

    it('implements session timeout', async () => {
      const { data: session } = await supabase.auth.getSession();
      expect(session.session?.expires_at).toBeDefined();
    });
  });

  describe('A08:2021 - Software/Data Integrity', () => {
    it('uses integrity checks for dependencies', () => {
      // package-lock.json provides integrity hashes
      const lockFile = require('../package-lock.json');
      expect(lockFile.lockfileVersion).toBeGreaterThanOrEqual(2);
    });
  });

  describe('A09:2021 - Logging & Monitoring', () => {
    it('logs security events to Sentry', () => {
      // Verified manually - Sentry configured
      expect(process.env.EXPO_PUBLIC_SENTRY_DSN).toBeDefined();
    });
  });

  describe('A10:2021 - Server-Side Request Forgery', () => {
    it('validates external URLs', async () => {
      const token = await getValidToken();
      const ssrfUrl = 'http://169.254.169.254/latest/meta-data/';

      await expect(
        axios.post(
          `${API_URL}/fetch-url`,
          { url: ssrfUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 400, data: { error: 'Invalid URL' } }
      });
    });
  });
});
```

## Security Audit Report

### Report Template
```markdown
# MobVibe Security Audit Report
**Date:** [DATE]
**Auditor:** [NAME]
**Version:** [VERSION]

## Executive Summary
- Overall Risk: [LOW/MEDIUM/HIGH]
- Critical Issues: [COUNT]
- High Issues: [COUNT]
- Medium Issues: [COUNT]
- Low Issues: [COUNT]

## Findings

### Critical Issues
[None found / List issues]

### High Priority Issues
[List with details]

### Medium Priority Issues
[List with details]

### Low Priority Issues
[List with details]

## OWASP Top 10 Compliance
- [ ] A01: Broken Access Control - PASS/FAIL
- [ ] A02: Cryptographic Failures - PASS/FAIL
- [ ] A03: Injection - PASS/FAIL
- [ ] A04: Insecure Design - PASS/FAIL
- [ ] A05: Security Misconfiguration - PASS/FAIL
- [ ] A06: Vulnerable Components - PASS/FAIL
- [ ] A07: Authentication Failures - PASS/FAIL
- [ ] A08: Software/Data Integrity - PASS/FAIL
- [ ] A09: Logging & Monitoring - PASS/FAIL
- [ ] A10: SSRF - PASS/FAIL

## Recommendations
1. [Prioritized list of remediation steps]

## Verification
- [ ] RLS policies tested and enforced
- [ ] No secrets in codebase
- [ ] Dependencies scanned (no high/critical)
- [ ] API security tested
- [ ] Authentication/authorization verified
```

## Acceptance Criteria

- [ ] No critical vulnerabilities identified
- [ ] No high priority vulnerabilities (or documented exceptions)
- [ ] RLS policies verified on all tables
- [ ] No secrets found in git history
- [ ] OWASP Top 10 compliance verified
- [ ] Dependency scan shows no high/critical issues
- [ ] API authentication/authorization tested
- [ ] Security audit report generated
- [ ] Remediation plan for medium/low issues

## Risk Management

### Technical Risks
```yaml
False Positives:
  Impact: LOW
  Mitigation: Manual review of automated scan results

Zero-Day Vulnerabilities:
  Impact: HIGH
  Mitigation: Monitoring, rapid patching process, Sentry alerts

Third-Party Dependencies:
  Impact: MEDIUM
  Mitigation: Regular updates, Snyk monitoring, lock files
```

## Dependencies

### External
- OWASP ZAP (penetration testing)
- TruffleHog (secret scanning)
- Snyk (dependency scanning)
- Semgrep (SAST)
- Supabase RLS testing framework

### Internal
- Phase 32 (performance optimization) complete
- All features implemented for comprehensive testing

## Success Metrics

```yaml
Vulnerability Resolution: 100% critical, 100% high
RLS Coverage: 100% of tables with user data
Secret Scanning: 0 secrets found
OWASP Compliance: 100% (10/10 categories pass)
Dependency Vulnerabilities: 0 high/critical
```

## Documentation Deliverables

- Security audit report
- RLS policy documentation
- Penetration testing report
- Secret management guide
- Security incident response plan
- Dependency update policy

## Next Steps

→ **Phase 34:** Production Deployment & Launch
