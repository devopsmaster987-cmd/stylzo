import { catalog } from '@/services/catalog.js';
import { snapshot } from '@/services/analytics.js';
import { handle, jsonResponse } from '@/lib/api.js';

// Ops - lightweight health/metrics endpoint (no secrets).
export const GET = handle(() => jsonResponse(
  { ok: true, styles: catalog().styles.length, uptimeSeconds: snapshot().uptimeSeconds },
  { headers: { 'Cache-Control': 'no-store' } },
));