'use client';
import { useEffect, useRef } from 'react';

// Injected on every page. `/js/lib.js` appears only in the preload list below:
// `ui.js` statically imports it, so it is fetched either way, and naming it
// explicitly is what saves the browser from discovering that dependency only
// once the entry has already been parsed.
const INJECTED = ['/js/ui.js', '/js/analytics.js'];

export function Scripts({ pageKey = '', scripts = [], generator = false }) {
  const done = useRef(new Set());
  const srcs = [...INJECTED, ...(generator ? ['/js/generator.js'] : []), ...scripts];

  // Preloaded, not executed. These modules still have to wait for hydration to
  // inject them, because several of them touch markup React owns (the nav
  // toggle's `hidden`, the ad slots) and running them early would hydrate
  // against a DOM they had already rewritten. Preloading moves the transfer
  // into the HTML parse instead of leaving it queued behind hydration, which on
  // a page that streams 1.6 MB of markup is not a gap worth measuring by hand.
  const preload = [...new Set([...INJECTED, '/js/lib.js', ...srcs.slice(INJECTED.length)])];

  useEffect(() => {
    if (pageKey) document.body.dataset.page = pageKey;
    for (const src of srcs) {
      if (done.current.has(src)) continue;
      done.current.add(src);
      const s = document.createElement('script');
      s.type = 'module';
      s.src = src;
      // Matches the preload above. A preload is fetched in CORS mode by
      // default, and the browser keeps a module only if the request that wants
      // it matches the one that fetched it — without this the preload is
      // discarded and the module is downloaded twice, which would make the
      // whole change a net loss. Same-origin either way, so nothing else moves.
      s.crossOrigin = 'anonymous';
      document.body.appendChild(s);
    }
  }, [pageKey]);

  return (
    <>
      {preload.map((src) => (
        <link key={src} rel="modulepreload" href={src} />
      ))}
    </>
  );
}