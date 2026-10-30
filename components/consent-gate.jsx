'use client';
import { useEffect, useState } from 'react';
import { configureConsent, readConsent, writeConsent, syncAds } from '@/lib/consent.js';

/**
 * Consent banner plus the ad loader.
 *
 * Two jobs, deliberately in one component so there is a single owner of the
 * "have we got permission yet" question:
 *   1. ask, and remember the answer;
 *   2. inject the AdSense tag only after a "yes".
 *
 * With no client id configured this renders nothing at all, so an unconfigured
 * build stays exactly as it is today.
 */
export function ConsentGate({ client, certifiedCmp = false }) {
  const [choice, setChoice] = useState(null);

  useEffect(() => {
    if (!client) return undefined;
    configureConsent({ certifiedCmp });
    setChoice(readConsent());
    syncAds(client);

    const onChange = (e) => {
      setChoice(e.detail);
      syncAds(client);
    };
    window.addEventListener('stylzo:consent', onChange);
    return () => window.removeEventListener('stylzo:consent', onChange);
  }, [client, certifiedCmp]);

  // A certified CMP renders its own dialog and owns the decision. Showing the
  // custom banner beside it would ask twice and could override the CMP.
  if (!client || certifiedCmp || choice) return null;

  const answer = (value) => {
    writeConsent(value);
    syncAds(client);
    setChoice(value);
  };

  return (
    <div className="consent" role="dialog" aria-label="Cookie choices" aria-live="polite">
      <p className="consent-text">
        We ask before showing ads. Accept means advertising cookies may be set: Google may set
        or read them to show and measure ads on this site. Decline means no advertising script
        is loaded, so no advertising cookies are set and no ads are shown. Either way, the text
        you type isn&rsquo;t used for ads and is not uploaded by the generator, and your choice
        is kept in your own browser. Read the <a href="/privacy">privacy policy</a>.
      </p>
      <div className="consent-actions">
        <button type="button" className="btn" data-consent="granted" onClick={() => answer('granted')}>
          Accept
        </button>
        <button type="button" className="btn ghost" data-consent="denied" onClick={() => answer('denied')}>
          Decline
        </button>
      </div>
    </div>
  );
}