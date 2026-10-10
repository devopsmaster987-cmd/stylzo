'use client';
import { useEffect, useRef } from 'react';

export function Scripts({ pageKey = '', scripts = [], generator = false }) {
  const done = useRef(new Set());
  useEffect(() => {
    if (pageKey) document.body.dataset.page = pageKey;
    const srcs = ['/js/ui.js', '/js/analytics.js', ...(generator ? ['/js/generator.js'] : []), ...scripts];
    for (const src of srcs) {
      if (done.current.has(src)) continue;
      done.current.add(src);
      const s = document.createElement('script');
      s.type = 'module';
      s.src = src;
      document.body.appendChild(s);
    }
  }, [pageKey]);
  return null;
}