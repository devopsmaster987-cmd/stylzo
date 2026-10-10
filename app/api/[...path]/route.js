import { jsonResponse } from '@/lib/api.js';

// Unknown API endpoints return JSON, never an HTML error page.
export const GET = () => jsonResponse(
  { error: 'not_found', message: 'Unknown API endpoint.' },
  { status: 404 },
);

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;