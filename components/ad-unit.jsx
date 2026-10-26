'use client';
import { useEffect, useRef } from 'react';
import { adsAllowed, pushAdUnit } from '@/lib/consent.js';

/* Everything inside the slot belongs to Google, not to React.
   adsbygoogle.js rewrites the <ins> in place: it adds data-adsbygoogle-status
   and data-ad-status, sets a style, and replaces the contents with the ad's
   <iframe>. It can also do all of that before React hydrates - the tag is a
   plain script in <head>, so it runs as soon as it has loaded - and a unit that
   is rewritten, or removed by an ad blocker or an extension, leaves React
   looking for markup that is no longer there. That is not a warning: React
   discards the server HTML for the whole page and rebuilds it on the client.

   So the slot is rendered as one opaque HTML string rather than as React
   children. React diffs the <aside>'s own attributes and nothing inside it,
   before hydration or on any later re-render, and the ad markup it wrote is
   never re-examined. Label included, because a React child inside the slot
   would put React back in the business of matching nodes it does not own. */
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);

/* The unit starts empty: nothing is requested before consent is recorded. The
   "Advertisement" label is added on the client only once AdSense marks the unit
   as filled, so an unfilled or blocked slot never shows a heading above a blank
   box. The label is visible rather than screen-reader only, because Google
   requires ads to be distinguishable from the surrounding site; aria-hidden
   because the <aside> already carries the label for assistive tech. */
const slotHtml = ({ client, slot, format }) =>
  `<ins class="adsbygoogle" data-ad-client="${escapeHtml(client)}"`
  + ` data-ad-slot="${escapeHtml(slot)}" data-ad-format="${escapeHtml(format)}"`
  + ' data-full-width-responsive="true"></ins>';

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

    const unit = () => ref.current?.querySelector('ins.adsbygoogle');

    // Google sets data-ad-status on the <ins> after it fills or rejects the
    // unit, and empties the <ins> when consent is withdrawn. Both changes flow
    // through this observer, so the label follows the real state rather than
    // the fact that a push was attempted.
    const syncLabel = () => {
      const slotEl = ref.current;
      const ad = unit();
      if (!slotEl || !ad) return;

      const isFilled = ad.getAttribute('data-ad-status') === 'filled'
        && ad.innerHTML.trim() !== '';
      const existing = slotEl.querySelector('.ad-label');

      if (isFilled && !existing) {
        const node = document.createElement('span');
        node.className = 'ad-label';
        node.setAttribute('aria-hidden', 'true');
        node.textContent = label;
        slotEl.insertBefore(node, ad);
      } else if (!isFilled && existing) {
        existing.remove();
      }
    };

    const tryPush = () => {
      if (cancelled || filled.current || !adsAllowed()) return;
      if (!unit() || !pushAdUnit()) return;
      filled.current = true;
      clearInterval(poll);
      syncLabel();
    };

    const observer = new MutationObserver(syncLabel);
    if (ref.current) {
      observer.observe(ref.current, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    // The tag is static markup in the document head and may not have run yet,
    // so either the load event or the poll below can be the one that finds it.
    // A visitor can leave the banner open for longer than the initial poll.
    // When they finally accept, start a fresh short poll for the newly injected
    // AdSense tag instead of leaving an empty slot on the page.
    const onConsent = () => {
      if (!adsAllowed()) return;
      clearInterval(poll);
      clearTimeout(stop);
      tryPush();
      poll = setInterval(tryPush, 250);
      stop = setTimeout(() => clearInterval(poll), 15000);
    };

    syncLabel();
    tryPush();

    window.addEventListener('stylzo:consent', onConsent);
    document.querySelector('script[data-adsense]')
      ?.addEventListener('load', tryPush);
    poll = setInterval(tryPush, 250);
    // Stop polling rather than leave a timer running for the life of the page.
    stop = setTimeout(() => clearInterval(poll), 15000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(stop);
      observer.disconnect();
      window.removeEventListener('stylzo:consent', onConsent);
      document.querySelector('script[data-adsense]')
        ?.removeEventListener('load', tryPush);
    };
  }, [client, slot, label]);

  if (!client || !slot) return null;

  return (
    <aside
      className="ad-slot"
      aria-label={label}
      ref={ref}
      // The string is written once and never rewritten, so the only thing React
      // would ever compare is markup Google has since changed: that is the one
      // comparison in here worth silencing.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: slotHtml({ client, slot, format }) }}
    />
  );
}