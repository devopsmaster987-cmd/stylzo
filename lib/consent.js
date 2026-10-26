// Consent state for advertising cookies.
//
// The site is otherwise cookieless, but AdSense reads and writes its own
// cookies. The root layout keeps an inert verification tag in the served HTML
// because AdSense verifies a site by reading it; this module is what turns that
// markup into an executable script, and only once the visitor has agreed (or a
// Google-certified CMP is handling the decision).
//
// Imported as a normal module rather than fetched from /public, so it is part
// of the bundle. Every function touches browser APIs only when called, which
// happens from effects, so importing this on the server is harmless.

const KEY = 'stylzo-consent';

// True only when a Google-certified CMP is live in AdSense. In that mode the
// CMP owns the EEA/UK/CH decision; a stale answer from the old local banner
// must not override it.
let certifiedCmp = false;

export function configureConsent({ certifiedCmp: value = false } = {}) {
  certifiedCmp = Boolean(value);
}

// 'granted' | 'denied' | null (not yet answered)
export function readConsent() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null; // private mode / storage disabled
  }
}

/** The single question every ad path must ask before touching the network. */
export function adsAllowed() {
  return certifiedCmp || readConsent() === 'granted';
}

/**
 * Turn the non-executing verification tag into a real script.
 *
 * The root layout serves the AdSense URL with `type="text/plain"` so
 * verification can still find it in the HTML, but the browser must not fetch or
 * run it before consent. This function is the only place that creates the live
 * tag, and it is idempotent because React effects can run more than once.
 */
export function loadAdTag(client) {
  if (!client || typeof document === 'undefined') return false;
  if (document.querySelector('script[data-adsense-live]')) return true;

  const pending = document.querySelector('script[data-adsense-pending]');
  const src = pending?.getAttribute('src')
    || `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  if (!src) return false;

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = src;
  script.dataset.adsense = '1';
  script.dataset.adsenseLive = '1';
  document.head.appendChild(script);
  return true;
}

export function writeConsent(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch { /* storage disabled: consent lasts for this page view only */ }
  // Same-tab listeners, so the banner disappears the moment it is answered.
  window.dispatchEvent(new CustomEvent('stylzo:consent', { detail: value }));
}

/** Called on load and whenever consent changes. Ads are shown only on grant. */
export function syncAds(client) {
  if (!client) return;
  const slots = document.querySelectorAll('.ad-slot');
  if (adsAllowed()) {
    // The first granted choice is also the moment the real AdSense script is
    // created. Before this, only the inert verification tag exists in the HTML.
    loadAdTag(client);
    for (const s of slots) s.removeAttribute('data-withdrawn');
  } else if (readConsent() === 'denied') {
    // Withdraw consent: stop further requests and drop the markup the tag
    // filled in, so ads that were already fetched are not left on the page.
    document.querySelector('script[data-adsense-live]')?.remove();
    for (const el of document.querySelectorAll('ins.adsbygoogle')) el.innerHTML = '';
    // Collapse the whole slot, label included, so a withdrawal does not leave
    // an "Advertisement" heading over an empty box.
    for (const s of slots) s.setAttribute('data-withdrawn', 'true');
  }
}

/**
 * Push an ad unit. Must only run once the tag script has defined
 * window.adsbygoogle, hence the caller's retry.
 */
export function pushAdUnit() {
  if (!window.adsbygoogle) return false;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    return true;
  } catch {
    return false; // ad blocked or tag not ready
  }
}