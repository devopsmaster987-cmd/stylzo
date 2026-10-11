// Consent state for advertising cookies.
//
// The site is otherwise cookieless, but AdSense reads and writes its own
// cookies. The tag itself is a plain <head> script in the root layout, because
// AdSense verifies a site by reading it out of the served HTML; this module
// governs what is allowed to be requested with it, so units are pushed only
// once the visitor has agreed.
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

/** Called on load and whenever consent changes. Ads are shown only on grant. */
export function syncAds(client) {
  if (!client) return;
  const slots = document.querySelectorAll('.ad-slot');
  if (readConsent() === 'granted') {
    for (const s of slots) s.removeAttribute('data-withdrawn');
  } else if (readConsent() === 'denied') {
    // Withdraw consent: drop the markup the tag filled in, so ads that were
    // already fetched are not left on the page. The tag itself stays: it is
    // static markup the verification step depends on, and removing it would
    // leave a grant later in this page view with nothing to push to.
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