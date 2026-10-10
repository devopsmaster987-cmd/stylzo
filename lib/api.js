import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
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
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    const err = new Error('Request body must be valid JSON.');
    err.status = 400;
    err.code = 'bad_json';
    throw err;
  }
}

/** In-memory fixed-window limiter (per instance, like the Express version). */
const buckets = new Map();

export function rateLimit(request, { limit = env.rateLimitPerMinute, windowMs = 60000 } = {}) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'local';
  const now = Date.now();
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
    err.headers = headers;
    throw err;
  }
  return headers;
}

/** Wrap a handler so thrown httpError-like errors become JSON responses. */
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
      const headers = err.headers || {};
      if (status >= 500) {
        const id = crypto.randomBytes(4).toString('hex');
        console.error(`[${id}]`, err);
        return NextResponse.json(
          { error: 'server_error', message: 'Something went wrong.', id },
          { status, headers },
        );
      }
      return NextResponse.json(
        { error: err.code || 'bad_request', message: err.message },
        { status, headers },
      );
    }
  };
}

export function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return NextResponse.json(body, { status, headers });
}

/**
 * Respond with an already-serialized JSON string. Used for the full catalog payload,
 * which is identical on every request — re-encoding it per hit costs more than sending it.
 */
export function rawJsonResponse(body, { status = 200, headers = {} } = {}) {
  return new NextResponse(body, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}