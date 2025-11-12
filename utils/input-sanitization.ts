/**
 * Input Sanitization Utilities
 * Prevents XSS, injection attacks, and malicious inputs
 *
 * Security: CWE-79 (XSS), CWE-94 (Code Injection)
 */

/**
 * Sanitize user prompt for AI API calls
 * Removes HTML tags, normalizes whitespace, enforces length limits
 */
export function sanitizePrompt(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\r\n]+/g, ' ') // Normalize newlines to spaces
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .slice(0, maxLength); // Enforce max length
}

/**
 * Sanitize file path to prevent directory traversal
 * Removes ../, ./, and absolute paths
 */
export function sanitizeFilePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return '';
  }

  return path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+/g, '/') // Normalize multiple slashes
    .replace(/^\.\//, ''); // Remove current directory reference
}

/**
 * Sanitize project name for display and storage
 */
export function sanitizeProjectName(name: string, maxLength: number = 100): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove dangerous characters
    .replace(/\s{2,}/g, ' ') // Collapse spaces
    .slice(0, maxLength);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email
    .trim()
    .toLowerCase()
    .slice(0, 254); // RFC 5321 max length
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url.trim());

    // Only allow HTTPS and HTTP
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Enforce HTTPS on URLs
 */
export function enforceHttps(url: string): string | null {
  const sanitized = sanitizeUrl(url);

  if (!sanitized) {
    return null;
  }

  // Require HTTPS
  if (!sanitized.startsWith('https://')) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJson<T>(input: unknown): T | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  try {
    // Stringify and parse to remove dangerous keys
    const str = JSON.stringify(input, (key, value) => {
      // Block prototype pollution keys
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        return undefined;
      }
      return value;
    });

    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize HTML content (basic - for simple display)
 * For production, use a library like DOMPurify
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize integer input
 */
export function sanitizeInteger(
  value: unknown,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  const num = Number(value);

  if (isNaN(num) || !Number.isInteger(num)) {
    return null;
  }

  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Rate limiting helper - checks if action is allowed
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const record = this.attempts.get(key);

    // Clean up expired records
    if (record && record.resetAt < now) {
      this.attempts.delete(key);
    }

    const current = this.attempts.get(key);

    if (!current) {
      // First attempt
      const resetAt = now + windowMs;
      this.attempts.set(key, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(resetAt),
      };
    }

    if (current.count >= limit) {
      // Limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(current.resetAt),
      };
    }

    // Increment count
    current.count++;

    return {
      allowed: true,
      remaining: limit - current.count,
      resetAt: new Date(current.resetAt),
    };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  clear(): void {
    this.attempts.clear();
  }
}

/**
 * Export singleton rate limiter for client-side rate limiting
 */
export const clientRateLimiter = new RateLimiter();
