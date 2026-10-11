'use client';
import { useEffect, useState } from 'react';
import { readConsent, writeConsent, syncAds } from '@/lib/consent.js';

/**
 * Footer link that lets a visitor change an advertising decision after the fact.
 * Required once ads are live: a consent choice that can only be made once and
 * can never be revisited is not really consent.
 *
 * Renders nothing when ads are not configured, so it costs nothing today.
 */
export function ConsentControl({ client }) {
  const [choice, setChoice] = useState(null);

  useEffect(() => {
    if (!client) return undefined;
    setChoice(readConsent());
    syncAds(client);

    const onChange = (e) => setChoice(e.detail);
    window.addEventListener('stylzo:consent', onChange);
    return () => window.removeEventListener('stylzo:consent', onChange);
  }, [client]);

  if (!client || !choice) return null;

  const label = choice === 'granted' ? 'cookies: on' : 'cookies: off';

  return (
    <span className="consent-control">
      {' · '}
      <button
        type="button"
        className="linkish"
        data-consent-toggle={label}
        onClick={() => {
          writeConsent(choice === 'granted' ? 'denied' : 'granted');
          syncAds(client);
        }}
      >
        {label}
      </button>
    </span>
  );
}