import { env, firebaseConfigured } from '@/config/environment.js';
import { handle, jsonResponse } from '@/lib/api.js';

// Public client config (Firebase web keys are designed to be public; they are
// only sent when configured, and nothing else is exposed here).
export const GET = handle(() => jsonResponse(
  { firebase: firebaseConfigured ? env.firebase : null },
  { headers: { 'Cache-Control': 'public, max-age=300' } },
));