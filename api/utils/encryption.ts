/**
 * Encryption utility for OAuth tokens
 * Uses AES-256-GCM with PBKDF2 key derivation for secure token storage
 *
 * Security features:
 * - AES-256-GCM authenticated encryption (prevents tampering)
 * - Unique IV per encryption (same plaintext = different ciphertext)
 * - Salt-based key derivation with PBKDF2 (100,000 iterations)
 * - Master key stored in environment variable only
 *
 * Storage format: base64(salt + iv + auth_tag + encrypted_data)
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 64; // 512 bits for PBKDF2 salt
const TAG_LENGTH = 16; // 128 bits for GCM authentication tag
const KEY_LENGTH = 32; // 256 bits for AES-256
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum

// Positions in combined buffer
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get master encryption key from environment variable
 * Key must be 64 hex characters (32 bytes = 256 bits)
 *
 * Generate key with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function getMasterKey(): Buffer {
  const key = process.env.ACCOUNTING_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ACCOUNTING_ENCRYPTION_KEY environment variable not set');
  }

  if (key.length !== 64) {
    throw new Error('ACCOUNTING_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt OAuth token using AES-256-GCM
 *
 * @param plaintext - The token to encrypt (access token, refresh token, etc.)
 * @returns Base64-encoded string containing: salt + iv + auth_tag + encrypted_data
 *
 * @example
 * const encrypted = encryptToken('access_token_abc123');
 * // Returns: base64 string like "Q2F0Y2ggbWUgaWYgeW91IGNhbiE..."
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty token');
  }

  const masterKey = getMasterKey();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key from master key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(
    masterKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  // Encrypt plaintext
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted]);

  // Return as base64 for easy storage in database
  return combined.toString('base64');
}

/**
 * Decrypt OAuth token using AES-256-GCM
 *
 * @param encryptedBase64 - Base64-encoded encrypted token from encryptToken()
 * @returns Decrypted plaintext token
 *
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 *
 * @example
 * const decrypted = decryptToken('Q2F0Y2ggbWUgaWYgeW91IGNhbiE...');
 * // Returns: "access_token_abc123"
 */
export function decryptToken(encryptedBase64: string): string {
  if (!encryptedBase64) {
    throw new Error('Cannot decrypt empty token');
  }

  const masterKey = getMasterKey();

  // Decode from base64
  const combined = Buffer.from(encryptedBase64, 'base64');

  // Validate minimum length
  if (combined.length < ENCRYPTED_POSITION) {
    throw new Error('Invalid encrypted token format');
  }

  // Extract components
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, TAG_POSITION);
  const tag = combined.slice(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = combined.slice(ENCRYPTED_POSITION);

  // Derive decryption key (must match encryption key derivation)
  const derivedKey = crypto.pbkdf2Sync(
    masterKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);

  try {
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    // GCM authentication will fail if:
    // - Wrong key
    // - Data has been tampered with
    // - Corrupted ciphertext
    throw new Error('Failed to decrypt token: authentication failed');
  }
}

/**
 * Generate a new master encryption key
 * Run this once to generate a key, then store it in Vercel environment variables
 *
 * @returns 64-character hex string (32 bytes)
 *
 * @example
 * const masterKey = generateMasterKey();
 * console.log('Set this as ACCOUNTING_ENCRYPTION_KEY:', masterKey);
 * // Set in Vercel: ACCOUNTING_ENCRYPTION_KEY=a1b2c3d4e5f6...
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Verify that encryption/decryption works correctly
 * Useful for testing after key setup
 *
 * @returns true if encryption roundtrip works, throws error otherwise
 *
 * @example
 * verifyEncryption(); // Returns true if working correctly
 */
export function verifyEncryption(): boolean {
  const testToken = 'test_token_' + Date.now();
  const encrypted = encryptToken(testToken);
  const decrypted = decryptToken(encrypted);

  if (testToken !== decrypted) {
    throw new Error('Encryption verification failed: roundtrip mismatch');
  }

  // Verify different ciphertexts for same plaintext (IV uniqueness)
  const encrypted2 = encryptToken(testToken);
  if (encrypted === encrypted2) {
    throw new Error('Encryption verification failed: IV not unique');
  }

  return true;
}

/**
 * Check if master encryption key is configured
 *
 * @returns true if ACCOUNTING_ENCRYPTION_KEY is set and valid
 */
export function isEncryptionConfigured(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}
