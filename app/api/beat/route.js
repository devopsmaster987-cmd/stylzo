import { track, trackSession } from '@/services/analytics.js';
import { handle, rateLimit, readJson, jsonResponse } from '@/lib/api.js';

// M8 - cookieless page/event beacon.
export const POST = handle(async (request) => {
  const rl = rateLimit(request);
  const body = await readJson(request);
  const path = typeof body.path === 'string' ? body.path : '';
  const event = typeof body.event === 'string' ? body.event : '';
  if (body.session) trackSession();
  track({ path, event });
  return jsonResponse({ ok: true }, { headers: { ...rl, 'Cache-Control': 'no-store' } });
});