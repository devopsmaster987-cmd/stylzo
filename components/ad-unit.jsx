'use client';
import { useEffect, useRef } from 'react';
import { readConsent, pushAdUnit } from '@/lib/consent.js';

/* adsbygoogle.js rewrites the <ins> in place: it adds data-adsbygoogle-status
   and replaces the contents with an <iframe> ad frame. Both happen before React
   hydrates, so the node is handed to React already different from the server
   HTML. Hoisted so the value is stable across re-renders. */
const GOOGLE_OWNS_CHILDREN = { __html: '' };

/**
 * One AdSense unit.
 *
 * Renders nothing at all when ads are not configured, so an unconfigured build
 * has no empty ad-shaped holes in the layout. The unit is only pushed to
 * adsbygoogle once consent is granted.
 */
export function AdUnit({ slot, client, format = 'auto', label = 'Advertisement' }) {
  const ref = useRef(null);
  const filled = useRef(false);

  useEffect(() => {
    if (!client || !slot || filled.current) return undefined;

    let cancelled = false;
    let poll = 0;
    let stop = 0;

    const tryPush = () => {
      if (cancelled || filled.current || readConsent() !== 'granted') return;
      if (!ref.current || !pushAdUnit()) return;
      filled.current = true;
      clearInterval(poll);
    };

    // The tag is static markup in the document head and may not have run yet,
    // so either the load event or the poll below can be the one that finds it.
    tryPush();

    document.querySelector('script[data-adsense]')
      ?.addEventListener('load', tryPush);
    poll = setInterval(tryPush, 250);
    // Stop polling rather than leave a timer running for the life of the page.
    stop = setTimeout(() => clearInterval(poll), 15000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(stop);
      document.querySelector('script[data-adsense]')
        ?.removeEventListener('load', tryPush);
    };
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <aside className="ad-slot" aria-label={label}>
      {/* Visible, not screen-reader only: Google requires ads to be labelled and
          distinguishable from the surrounding site. aria-hidden because the
          <aside> already carries the label for assistive tech. */}
      <span className="ad-label" aria-hidden="true">{label}</span>
      {/* Google owns every child of this node from the moment it fills the slot,
          so React must never try to diff them. suppressHydrationWarning covers
          the attributes Google adds before hydration; the empty
          dangerouslySetInnerHTML stops React re-diffing the injected iframe on
          any later re-render. */}
      <ins
        className="adsbygoogle"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        ref={ref}
        suppressHydrationWarning
        dangerouslySetInnerHTML={GOOGLE_OWNS_CHILDREN}
      />
    </aside>
  );
}