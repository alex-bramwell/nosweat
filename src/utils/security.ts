/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  // Remove HTML tags and encode special characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Checks if a password has been compromised using Have I Been Pwned API
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 */
export const checkPasswordCompromised = async (password: string): Promise<{ compromised: boolean; count?: number }> => {
  if (!password) return { compromised: false };

  try {
    // Hash the password using SHA-1 (required by HIBP API)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Use k-anonymity: send only first 5 chars
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true', // Extra security measure
      },
    });

    if (!response.ok) {
      // If API fails, don't block the user
      console.warn('HIBP API check failed');
      return { compromised: false };
    }

    const text = await response.text();
    const hashes = text.split('\n');

    // Check if our hash suffix appears in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return {
          compromised: true,
          count: parseInt(count.trim(), 10)
        };
      }
    }

    return { compromised: false };
  } catch (error) {
    console.error('Error checking password:', error);
    // Don't block user if check fails
    return { compromised: false };
  }
};

/**
 * Rate limiter for login attempts
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>;
  private maxAttempts: number;
  private windowMs: number;
  private lockoutDurationMs: number;

  constructor(maxAttempts = 5, windowMs = 900000, lockoutDurationMs = 300000) {
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs; // 15 minutes default
    this.lockoutDurationMs = lockoutDurationMs; // 5 minutes default
  }

  /**
   * Check if an identifier (e.g., email) is rate limited
   */
  isRateLimited(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    // Check if still locked out
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return true;
    }

    // Reset if window has passed
    if (Date.now() - record.firstAttempt > this.windowMs) {
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  /**
   * Record a failed attempt
   */
  recordAttempt(identifier: string): { allowed: boolean; attemptsRemaining: number; lockoutMinutes?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, attemptsRemaining: this.maxAttempts - 1 };
    }

    // Reset if window has passed
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, attemptsRemaining: this.maxAttempts - 1 };
    }

    // Increment count
    record.count++;

    // Check if exceeded max attempts
    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutDurationMs;
      return {
        allowed: false,
        attemptsRemaining: 0,
        lockoutMinutes: Math.ceil(this.lockoutDurationMs / 60000)
      };
    }

    return {
      allowed: true,
      attemptsRemaining: this.maxAttempts - record.count
    };
  }

  /**
   * Reset attempts for an identifier (e.g., on successful login)
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all attempts (useful for cleanup)
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

/**
 * Generate a secure random token for CSRF protection
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Detect potential SQL injection patterns
 */
export const detectSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(UNION.*SELECT)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Detect potential XSS patterns
 */
export const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /<iframe/gi,
    /eval\(/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};
