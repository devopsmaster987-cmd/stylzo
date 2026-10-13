// Request-level guards with no Next.js dependency, so they can be unit-tested
// with bare `node --test`. lib/api.js re-exports everything here.

import { env } from '../config/environment.js';

const MAX_BODY = 32 * 1024;

/** Parse a JSON body with the same error codes the Express version returned. */
export async function readJson(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) {
    const err = new Error('Request body is too large.');
    err.status = 413;
    err.code = 'too_large';
    throw err;
  }
  // Content-Length is a claim by the client. It can be omitted or understated,
  // so the real size is checked against what actually arrived before it is
  // parsed. A missing length therefore falls through to this check rather than
  // skipping it.
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY) {
    const err = new Error('Request body is too large.');
    err.status = 413;
    err.code = 'too_large';
    throw err;
  }
  try {
    const body = JSON.parse(raw);
    return body && typeof body === 'object' ? body : {};
  } catch {
    const err = new Error('Request body must be valid JSON.');
    err.status = 400;
    err.code = 'bad_json';
    throw err;
  }
}

/**
 * The caller's address.
 *
 * X-Forwarded-For is a list the client starts and every trusted proxy appends
 * to, so the leftmost entry is the one the client chose and the rightmost is
 * the address our own infrastructure observed. Taking the leftmost is how a
 * rate limit gets bypassed: rotate a forged header and every request lands in
 * a brand new bucket. The rightmost entry is the one we can attribute.
 *
 * A private/unknown client-supplied value is not trusted on its own either, so
 * anything that is not a plausible public address collapses to `local`, which
 * shares one bucket rather than minting a new one per forged header.
 */
const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const PRIVATE_HOST = /^(?:localhost|.*\.local|.*\.internal|.*\.localhost)$/i;

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const raw = forwarded
    // Rightmost first: the last entry was appended by the nearest trusted hop.
    ? forwarded.split(',').map((s) => s.trim()).filter(Boolean).pop()
    : (request.headers.get('x-real-ip') || '').trim();

  if (!raw) return 'local';
  if (IPV4_RE.test(raw)) return raw;
  if (raw.includes(':') && /^[0-9a-f:]+$/i.test(raw)) return raw;
  if (PRIVATE_HOST.test(raw)) return 'local';
  return 'local';
}

/** In-memory fixed-window limiter (per instance, like the Express version). */
const buckets = new Map();

/**
 * Drop windows that have expired.
 *
 * Without this the map only ever grows: every distinct address-and-path pair
 * is a permanent entry, so a client that varies its headers to dodge the limit
 * is also leaking one entry per request until the process is out of memory.
 * Sweeping is amortised rather than run per request, because the work is
 * proportional to the map and the map is small in the normal case.
 */
const MAX_BUCKETS = 10_000;
const WINDOW_MS = 60_000;
let lastSweep = 0;

function sweep(now) {
  if (now - lastSweep < WINDOW_MS && buckets.size <= MAX_BUCKETS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now - b.start >= WINDOW_MS) buckets.delete(k);
  }
}

export function rateLimit(request, { limit = env.rateLimitPerMinute, windowMs = 60_000 } = {}) {
  const ip = clientIp(request);
  const now = Date.now();
  sweep(now);
  const key = `${ip}:${request.nextUrl?.pathname || new URL(request.url).pathname}`;
  const bucket = buckets.get(key);
  const active = bucket && now - bucket.start < windowMs ? bucket : { start: now, count: 0 };
  active.count += 1;
  buckets.set(key, active);

  const reset = Math.ceil((active.start + windowMs) / 1000);
  const headers = {
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(Math.max(0, limit - active.count)),
    'RateLimit-Reset': String(reset),
  };

  if (active.count > limit) {
    const err = new Error('Too many requests. Please wait a minute and try again.');
    err.status = 429;
    err.code = 'rate_limited';
    err.headers = { ...headers, 'Retry-After': String(Math.ceil((active.start + windowMs - now) / 1000)) };
    throw err;
  }
  return headers;
}
