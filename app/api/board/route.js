import { handle, jsonResponse } from '@/lib/api.js';
import { boardEntry, boardRows, BOARD_SIZE } from '@/lib/keyword-board.js';
import { SUPPORT_LABEL } from '@/lib/pages.js';
import { cleanText } from '@/lib/validation.js';
import { env } from '@/config/environment.js';

// One keyword's board material: the heading, intro and the 25 styled,
// emoji-decorated words. The /styles dashboard fetches this when a keyword
// is picked, so the material loads on the same page instead of navigating
// to /styles/<slug>.
export const GET = handle((request) => {
  const { searchParams } = new URL(request.url);
  const entry = boardEntry(String(searchParams.get('key') || ''));
  if (!entry) {
    const err = new Error('Unknown keyword.');
    err.status = 404;
    err.code = 'not_found';
    throw err;
  }

  // ?text= renders the visitor's own text in every style, exactly like the
  // server-rendered keyword page does with the same query parameter.
  const text = cleanText(searchParams.get('text'), { max: env.maxInputLength });
  const rows = boardRows(entry.position, text.trim() ? text : null, entry.slug);

  return jsonResponse(
    {
      slug: entry.slug,
      heading: entry.heading,
      intro: entry.intro,
      position: entry.position,
      total: BOARD_SIZE,
      words: rows.length,
      rows: rows.map((r) => ({
        id: r.slug,
        name: r.styleName,
        slug: r.slug,
        category: 'board',
        support: r.support,
        supportLabel: SUPPORT_LABEL[r.support] || '',
        output: r.output,
        word: r.word,
        emojiBefore: r.emojiBefore.join(' '),
        emojiAfter: r.emojiAfter.join(' '),
        copyText: r.line,
      })),
    },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' } },
  );
});
