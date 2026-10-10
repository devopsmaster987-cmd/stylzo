import { searchStyles } from '@/services/catalog.js';
import { cleanText } from '@/lib/validation.js';
import { env } from '@/config/environment.js';
import { catalog } from '@/services/catalog.js';
import { applyStyle } from '@/services/unicode/engine.js';
import { handle, jsonResponse } from '@/lib/api.js';

// Ranked catalog search: /api/search?q=glitch
export const GET = handle((request) => {
  const { searchParams } = new URL(request.url);
  const q = cleanText(searchParams.get('q'), { max: 60 });
  if (!q.trim()) return jsonResponse({ results: [] });

  const text = cleanText(searchParams.get('text'), { max: env.maxInputLength }) || catalog().sample;
  const results = searchStyles(q, 24).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    support: s.support,
    output: applyStyle(text, s, { maxLength: env.ssrTextLimit }),
    pipeline: s.pipeline,
  }));

  return jsonResponse({ results }, { headers: { 'Cache-Control': 'private, max-age=30' } });
});