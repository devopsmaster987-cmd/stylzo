// Admin authentication, shared by /admin and /admin/seo.
//
// Both pages used to inline the same three-line check, which is how they drift
// apart: one gains a guard and the other does not. One implementation means a
// fix reaches every admin surface at once.
//
// Deliberately free of `next/headers` so it can be unit-tested with bare
// `node --test`, the same reason services/seo.js uses relative imports. The
// caller reads the request header and passes the value in.

import crypto from 'node:crypto';
import { env } from '../config/environment.js';

/**
 * Constant-time comparison.
 *
 * `===` returns at the first differing byte, so how quickly a guess is rejected
 * reveals how many leading characters were right, and enough guesses recover the
 * key one character at a time. Hashing first also collapses the length
 * difference: timingSafeEqual throws on unequal lengths, which would itself be a
 * timing signal, and a fixed-length digest removes it.
 */
export function secretEquals(a, b) {
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  const ha = crypto.createHash('sha256').update(sa, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(sb, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb) && sa.length === sb.length;
}

/** True only when a key is configured and the one supplied matches it. */
export function isAdminAuthorized(suppliedKey) {
  if (!env.adminKey) return false;
  if (!suppliedKey) return false;
  return secretEquals(suppliedKey, env.adminKey);
}

/**
 * Pick the key from a request, preferring the header over the query string.
 *
 * A `?key=` value lands in browser history, in access logs and in any analytics
 * that captures full URLs. `Referrer-Policy: strict-origin-when-cross-origin`
 * keeps it from reaching third parties cross-origin, but it is still on the
 * device and on the server, so the header is the better door.
 */
export function pickAdminKey(headerKey, searchParams = {}) {
  const fromHeader = typeof headerKey === 'string' ? headerKey : '';
  const fromQuery = typeof searchParams.key === 'string' ? searchParams.key : '';
  return fromHeader || fromQuery;
}