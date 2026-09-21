import { createHash, randomBytes } from 'node:crypto';

/**
 * Used for opaque tokens (invite/reset tokens, refresh tokens) that must be
 * looked up BY their hash — deterministic, unlike bcrypt, which salts per
 * call and can't support a WHERE equality lookup. Never use this for login
 * passwords.
 */
export function generateRawToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
