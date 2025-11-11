/**
 * Error Handler
 * Centralized error handling and retry logic for API calls
 */

import { APIErrorResponse } from './types';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (this.statusCode === 401) {
      return 'Please log in again';
    }
    if (this.statusCode === 403) {
      return 'You do not have permission to perform this action';
    }
    if (this.statusCode === 404) {
      return 'The requested resource was not found';
    }
    if (this.statusCode === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (this.statusCode >= 500) {
      return 'Server error. Please try again in a moment.';
    }
    return this.message || 'Something went wrong. Please try again.';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    // Don't retry auth, permission, or validation errors
    if ([401, 403, 400, 422].includes(this.statusCode)) {
      return false;
    }
    // Retry network errors, rate limits, and server errors
    return true;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'No internet connection') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  getUserMessage(): string {
    return 'Please check your internet connection and try again.';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }

  getUserMessage(): string {
    return 'The request took too long. Please try again.';
  }
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param baseDelay Base delay in milliseconds (default: 1000)
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof APIError && !error.isRetryable()) {
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;

      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms`, {
        error: error instanceof Error ? error.message : String(error)
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Parse API error response
 */
export function parseAPIError(response: Response, body: any): APIError {
  // Try to extract error info from response body
  let message = 'An error occurred';
  let details: any = undefined;

  if (body && typeof body === 'object') {
    if ('error' in body && typeof body.error === 'string') {
      message = body.error;
    } else if ('message' in body && typeof body.message === 'string') {
      message = body.message;
    }

    if ('details' in body) {
      details = body.details;
    }
  } else if (typeof body === 'string') {
    message = body;
  }

  return new APIError(response.status, message, details);
}

/**
 * Create error from network failure
 */
export function createNetworkError(error: any): NetworkError | TimeoutError {
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return new TimeoutError();
  }
  return new NetworkError();
}
