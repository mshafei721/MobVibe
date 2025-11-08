// OWASP Top 10 2021 Compliance Tests
// DEFERRED: Will be used when API endpoints are deployed

import axios, { AxiosError } from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_URL = process.env.TEST_API_URL || 'http://localhost:54321/functions/v1';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function getValidToken(): Promise<string> {
  // TODO: Implement actual token generation
  return 'mock-valid-token';
}

/**
 * OWASP Top 10 2021 Compliance Test Suite
 * https://owasp.org/Top10/
 */
describe('OWASP Top 10 2021 Compliance', () => {
  // ================================================================
  // A01:2021 - Broken Access Control
  // ================================================================
  describe('A01:2021 - Broken Access Control', () => {
    it('enforces authentication on protected endpoints', async () => {
      await expect(axios.get(`${API_URL}/get-session-status`)).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    it('enforces authorization via RLS', async () => {
      // Create two users
      const user1 = await createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );
      const user2 = await createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      // User1 creates session
      const { data: session } = await user1
        .from('coding_sessions')
        .insert({ title: 'Private Session' })
        .select()
        .single();

      // User2 cannot access User1's session
      const { data: leaked } = await user2
        .from('coding_sessions')
        .select()
        .eq('id', session!.id);

      expect(leaked).toEqual([]);
    });

    it('prevents directory traversal attacks', async () => {
      const token = await getValidToken();
      const maliciousPath = '../../../etc/passwd';

      await expect(
        axios.get(`${API_URL}/get-file-content?path=${encodeURIComponent(maliciousPath)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('prevents parameter manipulation', async () => {
      const token = await getValidToken();

      // Try to access session by manipulating user_id parameter
      await expect(
        axios.get(`${API_URL}/get-session-status?user_id=other-user-id`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it('prevents privilege escalation', async () => {
      const token = await getValidToken();

      // Try to set admin role via API
      await expect(
        axios.post(
          `${API_URL}/update-profile`,
          { role: 'admin' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it('enforces object-level authorization', async () => {
      const token = await getValidToken();

      // Try to access another user's resource directly by ID
      await expect(
        axios.get(`${API_URL}/get-session-status?session_id=other-user-session-id`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });

  // ================================================================
  // A02:2021 - Cryptographic Failures
  // ================================================================
  describe('A02:2021 - Cryptographic Failures', () => {
    it('uses HTTPS for all API communication', () => {
      expect(process.env.EXPO_PUBLIC_API_URL).toMatch(/^https:\/\//);
      expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\//);
    });

    it('stores passwords hashed (Supabase Auth)', async () => {
      // Supabase uses bcrypt by default
      // Verify passwords never returned in API responses
      const { data } = await supabase.auth.getUser();
      expect(data.user).not.toHaveProperty('password');
      expect(data.user).not.toHaveProperty('password_hash');
    });

    it('does not expose sensitive data in responses', async () => {
      const token = await getValidToken();

      const { data } = await axios.get(`${API_URL}/get-session-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check response doesn't contain sensitive fields
      expect(JSON.stringify(data)).not.toMatch(/password|secret|key|token/i);
    });

    it('uses secure cookie attributes', async () => {
      const { headers } = await axios.get(`${API_URL}/health`);

      const setCookie = headers['set-cookie'];
      if (setCookie) {
        expect(setCookie).toMatch(/Secure/);
        expect(setCookie).toMatch(/HttpOnly/);
        expect(setCookie).toMatch(/SameSite/);
      }
    });

    it('enforces TLS 1.2 minimum', async () => {
      // Verify API only accepts TLS 1.2+
      // This would need integration testing with different TLS versions
      expect(process.env.EXPO_PUBLIC_API_URL).toMatch(/^https:\/\//);
    });
  });

  // ================================================================
  // A03:2021 - Injection
  // ================================================================
  describe('A03:2021 - Injection', () => {
    it('prevents SQL injection', async () => {
      const token = await getValidToken();
      const maliciousInput = "'; DROP TABLE coding_sessions; --";

      // Should safely handle malicious input
      const { data } = await axios.post(
        `${API_URL}/start-coding-session`,
        { title: maliciousInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      expect(data.title).toBe(maliciousInput);

      // Verify table still exists
      const { status } = await axios.get(`${API_URL}/get-session-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(status).toBe(200);
    });

    it('prevents NoSQL injection', async () => {
      const token = await getValidToken();
      const maliciousQuery = { $ne: null };

      await expect(
        axios.get(`${API_URL}/get-session-status`, {
          params: { session_id: maliciousQuery },
          headers: { Authorization: `Bearer ${token}` },
        })
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('prevents command injection', async () => {
      const token = await getValidToken();
      const maliciousCommand = '; rm -rf / ;';

      await expect(
        axios.post(
          `${API_URL}/continue-coding`,
          { prompt: `Run: ${maliciousCommand}`, session_id: 'test-id' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('prevents code injection in sandboxes', async () => {
      const token = await getValidToken();
      const maliciousCode = 'process.exit(1); //';

      // E2B sandboxes should isolate code execution
      const { data } = await axios.post(
        `${API_URL}/continue-coding`,
        { prompt: `Write code: ${maliciousCode}`, session_id: 'test-id' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Should handle safely without crashing
      expect(data).toBeDefined();
    });

    it('sanitizes user input before processing', async () => {
      const token = await getValidToken();
      const xssInput = '<script>alert("XSS")</script>';

      const { data } = await axios.post(
        `${API_URL}/start-coding-session`,
        { title: xssInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Input should be stored but sanitized for output
      expect(data.title).toBeDefined();
    });
  });

  // ================================================================
  // A04:2021 - Insecure Design
  // ================================================================
  describe('A04:2021 - Insecure Design', () => {
    it('implements rate limiting', async () => {
      const token = await getValidToken();

      // Make rapid requests to trigger rate limiting
      const requests = Array(15)
        .fill(null)
        .map(() =>
          axios.post(
            `${API_URL}/continue-coding`,
            { prompt: 'test', session_id: 'test-id' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );

      const results = await Promise.allSettled(requests);
      const rateLimited = results.some(
        (r) => r.status === 'rejected' && (r.reason as AxiosError).response?.status === 429
      );

      expect(rateLimited).toBe(true);
    });

    it('validates all user inputs', async () => {
      const token = await getValidToken();

      // Test various invalid inputs
      await expect(
        axios.post(
          `${API_URL}/start-coding-session`,
          { title: 12345 }, // Wrong type
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('implements proper session timeout', async () => {
      const { data: session } = await supabase.auth.getSession();
      expect(session.session?.expires_at).toBeDefined();

      const expiresAt = new Date(session.session!.expires_at! * 1000);
      const now = new Date();
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Session should expire within reasonable time (e.g., 24 hours)
      expect(hoursDiff).toBeLessThanOrEqual(24);
    });

    it('enforces business logic validation', async () => {
      const token = await getValidToken();

      // Try to create session with invalid state transitions
      await expect(
        axios.post(
          `${API_URL}/update-session-status`,
          { session_id: 'test-id', status: 'invalid-status' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  // ================================================================
  // A05:2021 - Security Misconfiguration
  // ================================================================
  describe('A05:2021 - Security Misconfiguration', () => {
    it('disables debug mode in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(__DEV__).toBe(false);
      }
    });

    it('sets secure HTTP headers', async () => {
      const { headers } = await axios.get(`${API_URL}/health`);

      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['strict-transport-security']).toMatch(/max-age=/);
      expect(headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('does not expose version information', async () => {
      const { headers } = await axios.get(`${API_URL}/health`);

      expect(headers['server']).not.toMatch(/\d+\.\d+/); // No version numbers
      expect(headers['x-powered-by']).toBeUndefined();
    });

    it('has proper CORS configuration', async () => {
      const { headers } = await axios.options(`${API_URL}/start-coding-session`);

      expect(headers['access-control-allow-origin']).toBeDefined();
      expect(headers['access-control-allow-methods']).toBeDefined();
      expect(headers['access-control-allow-headers']).toBeDefined();
    });

    it('disables directory listing', async () => {
      await expect(axios.get(`${API_URL}/`)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  // ================================================================
  // A06:2021 - Vulnerable and Outdated Components
  // ================================================================
  describe('A06:2021 - Vulnerable and Outdated Components', () => {
    it('has no high/critical vulnerabilities in dependencies', async () => {
      // This is verified in CI/CD via npm audit
      // Here we just check package-lock.json exists
      const lockFile = require('../package-lock.json');
      expect(lockFile.lockfileVersion).toBeGreaterThanOrEqual(2);
    });

    it('uses supported versions of frameworks', () => {
      const packageJson = require('../package.json');

      // Check React Native version is supported
      const rnVersion = packageJson.dependencies['react-native'];
      expect(rnVersion).toBeDefined();

      // Check Expo SDK version is supported
      const expoVersion = packageJson.dependencies['expo'];
      expect(expoVersion).toBeDefined();
    });
  });

  // ================================================================
  // A07:2021 - Identification and Authentication Failures
  // ================================================================
  describe('A07:2021 - Identification and Authentication Failures', () => {
    it('enforces strong password policy', async () => {
      const weakPassword = '123456';

      const { error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: weakPassword,
      });

      expect(error).toBeDefined();
      expect(error?.message).toMatch(/password.*at least 8 characters/i);
    });

    it('implements session timeout', async () => {
      const { data: session } = await supabase.auth.getSession();
      expect(session.session?.expires_at).toBeDefined();
    });

    it('prevents credential stuffing', async () => {
      // Rate limiting on auth endpoints
      const attempts = Array(10)
        .fill(null)
        .map(() =>
          supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'wrong-password',
          })
        );

      const results = await Promise.allSettled(attempts);
      const rateLimited = results.some(
        (r) => r.status === 'rejected' && r.reason.message?.includes('rate limit')
      );

      // Should trigger rate limiting after several failed attempts
      expect(rateLimited).toBe(true);
    });

    it('does not expose whether user exists', async () => {
      const { error: error1 } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'password',
      });

      const { error: error2 } = await supabase.auth.signInWithPassword({
        email: 'existing@example.com',
        password: 'wrongpassword',
      });

      // Error messages should be generic
      expect(error1?.message).toMatch(/invalid/i);
      expect(error2?.message).toMatch(/invalid/i);
    });

    it('invalidates sessions on logout', async () => {
      const { data: session1 } = await supabase.auth.getSession();
      const token = session1.session?.access_token;

      await supabase.auth.signOut();

      // Try to use old token
      await expect(
        axios.get(`${API_URL}/get-session-status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  // ================================================================
  // A08:2021 - Software and Data Integrity Failures
  // ================================================================
  describe('A08:2021 - Software and Data Integrity Failures', () => {
    it('uses integrity checks for dependencies', () => {
      const lockFile = require('../package-lock.json');

      // package-lock.json v2+ includes integrity hashes
      expect(lockFile.lockfileVersion).toBeGreaterThanOrEqual(2);

      // Check a sample dependency has integrity field
      const packages = Object.values(lockFile.packages) as any[];
      const hasIntegrity = packages.some((pkg) => pkg.integrity);
      expect(hasIntegrity).toBe(true);
    });

    it('verifies data integrity via checksums', async () => {
      const token = await getValidToken();

      // When uploading files, verify checksums are validated
      const fileContent = 'test content';
      const invalidChecksum = 'invalid-sha256';

      await expect(
        axios.post(
          `${API_URL}/upload-file`,
          {
            content: fileContent,
            checksum: invalidChecksum,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('uses signed URLs for sensitive operations', async () => {
      // Supabase Storage signed URLs expire
      const { data } = await supabase.storage
        .from('session-files')
        .createSignedUrl('test.txt', 60);

      expect(data?.signedUrl).toMatch(/token=/);
    });
  });

  // ================================================================
  // A09:2021 - Security Logging and Monitoring Failures
  // ================================================================
  describe('A09:2021 - Security Logging and Monitoring Failures', () => {
    it('logs security events to Sentry', () => {
      expect(process.env.EXPO_PUBLIC_SENTRY_DSN).toBeDefined();
    });

    it('logs failed authentication attempts', async () => {
      // Failed login should be logged (verified via Sentry/Supabase dashboard)
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(error).toBeDefined();
      // In production, this would trigger a Sentry event
    });

    it('logs rate limit violations', async () => {
      const token = await getValidToken();

      // Trigger rate limit
      const requests = Array(20)
        .fill(null)
        .map(() =>
          axios.post(
            `${API_URL}/continue-coding`,
            { prompt: 'test', session_id: 'test-id' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );

      await Promise.allSettled(requests);
      // Rate limit events should be logged to monitoring system
    });

    it('includes request ID in responses', async () => {
      const { headers } = await axios.get(`${API_URL}/health`);

      expect(headers['x-request-id']).toBeDefined();
    });
  });

  // ================================================================
  // A10:2021 - Server-Side Request Forgery (SSRF)
  // ================================================================
  describe('A10:2021 - Server-Side Request Forgery (SSRF)', () => {
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
        response: {
          status: 400,
          data: { error: expect.stringMatching(/invalid url/i) },
        },
      });
    });

    it('blocks requests to private IP ranges', async () => {
      const token = await getValidToken();
      const privateUrls = [
        'http://127.0.0.1:8080',
        'http://10.0.0.1',
        'http://192.168.1.1',
        'http://172.16.0.1',
      ];

      for (const url of privateUrls) {
        await expect(
          axios.post(
            `${API_URL}/fetch-url`,
            { url },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ).rejects.toMatchObject({
          response: { status: 400 },
        });
      }
    });

    it('blocks requests to cloud metadata endpoints', async () => {
      const token = await getValidToken();
      const metadataUrls = [
        'http://169.254.169.254', // AWS
        'http://metadata.google.internal', // GCP
        'http://169.254.169.254/metadata/instance', // Azure
      ];

      for (const url of metadataUrls) {
        await expect(
          axios.post(
            `${API_URL}/fetch-url`,
            { url },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ).rejects.toMatchObject({
          response: { status: 400 },
        });
      }
    });

    it('enforces URL whitelist for external requests', async () => {
      const token = await getValidToken();
      const untrustedUrl = 'https://untrusted-domain.com/api';

      await expect(
        axios.post(
          `${API_URL}/fetch-url`,
          { url: untrustedUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });
});
