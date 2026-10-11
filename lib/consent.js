// Consent state for advertising cookies.
//
// The site is otherwise cookieless, but AdSense reads and writes its own
// cookies. Nothing ad-related may load before the visitor has agreed, so the ad
// tag is injected only from here and only once consent is recorded.
//
// Imported as a normal module rather than fetched from /public, so it is part
// of the bundle. Every function touches browser APIs only when called, which
// happens from effects, so importing this on the server is harmless.

const KEY = 'stylzo-consent';

// 'granted' | 'denied' | null (not yet answered)
export function readConsent() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null; // private mode / storage disabled
  }
}

export function writeConsent(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch { /* storage disabled: consent lasts for this page view only */ }
  // Same-tab listeners, so the banner disappears the moment it is answered.
  window.dispatchEvent(new CustomEvent('stylzo:consent', { detail: value }));
}

/**
 * Load the AdSense tag once. Kept idempotent because consent can be re-answered
 * from the footer link at any time.
 */
export function loadAdsense(client) {
  if (!client || document.querySelector('script[data-adsense]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.dataset.adsense = '1';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(s);
}

/** Called on load and whenever consent changes. Ads are injected only on grant. */
export function syncAds(client) {
  if (!client) return;
  if (readConsent() === 'granted') {
    loadAdsense(client);
  } else if (readConsent() === 'denied') {
    // Withdraw consent: drop the tag and the markup it filled in, so ads that
    // were already fetched are not left on the page.
    document.querySelector('script[data-adsense]')?.remove();
    for (const el of document.querySelectorAll('ins.adsbygoogle')) el.innerHTML = '';
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