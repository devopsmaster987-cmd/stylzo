'use client';
import { useEffect, useRef } from 'react';
import { readConsent, loadAdsense, pushAdUnit } from '@/lib/consent.js';

/**
 * One AdSense unit.
 *
 * Renders nothing at all when ads are not configured, so an unconfigured build
 * has no empty ad-shaped holes in the layout. The unit is only pushed to
 * adsbygoogle once the tag has loaded, which only happens after consent.
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

    // The tag is only injected once consent exists, and it may already be in the
    // document because of a sibling unit, so both paths are covered.
    if (readConsent() === 'granted') loadAdsense(client);
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
      <ins
        className="adsbygoogle"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        ref={ref}
      />
    </aside>
  );
}