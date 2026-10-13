import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

// The rate limiter, body reader and IP handling live in api-core.js, which has no
// Next.js import so it can be unit-tested directly. They are re-exported here
// because every route already imports them from this module, and the public
// surface is unchanged by the split.
export { readJson, rateLimit } from './api-core.js';

import { env } from '../config/environment.js';

/** Wrap a handler so thrown httpError-like errors become JSON responses. */
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
      const headers = err.headers || {};
      if (status >= 500) {
        // The stack goes to the server log, never to the client: it names
        // internal paths and, on a framework error, can include request data.
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