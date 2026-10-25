'use client';

import { useCallback, useEffect, useState } from 'react';
import { buildEventIcs, decodeEventData, parseEventStamp } from '@/public/js/qr-payloads.js';

const DAY = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});
const MONTH = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' });
const TIME = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
});

function sameDay(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

function formatDuration(start, end) {
  if (!end) return '';
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours} hr ${rest} min`;
  if (hours) return `${hours} hr`;
  return `${rest} min`;
}

function fileStem(value) {
  return value.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'event';
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.6 7-12a7 7 0 1 0-14 0c0 6.4 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function EventView() {
  const [event, setEvent] = useState(undefined);
  const [note, setNote] = useState('');

  useEffect(() => {
    const read = () => {
      const encoded = window.location.hash.replace(/^#/, '');
      setEvent(encoded ? decodeEventData(encoded) : null);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const addToCalendar = useCallback(() => {
    if (!event) return;
    const ics = buildEventIcs(event);
    if (!ics) return;
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileStem(event.summary)}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, [event]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNote('Link copied to the clipboard');
    } catch {
      setNote('Could not copy the link');
    }
  }, []);

  if (event === undefined) {
    return (
      <section className="event-page">
        <div className="event-card">
          <p className="event-loading">Loading event…</p>
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="event-page">
        <div className="event-card event-missing">
          <h1>This event link is incomplete</h1>
          <p className="lede">
            The address is missing its event details. Open the original QR code again, or create a
            new one with the generator.
          </p>
          <a className="btn grad" href="/qr-code-generator">Create an event QR code</a>
        </div>
      </section>
    );
  }

  const start = parseEventStamp(event.start);
  const end = parseEventStamp(event.end);
  const multiDay = Boolean(end && !sameDay(start, end));
  const dateLine = multiDay
    ? `${DAY.format(start)} – ${DAY.format(end)}`
    : DAY.format(start);
  const timeLine = end
    ? `${TIME.format(start)} – ${TIME.format(end)}`
    : TIME.format(start);
  const duration = formatDuration(start, end);
  const mapHref = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : '';

  return (
    <section className="event-page">
      <article className="event-card">
        <div className="event-glow" aria-hidden="true" />

        <header className="event-head">
          <div className="event-date" aria-hidden="true">
            <span className="event-month">{MONTH.format(start)}</span>
            <span className="event-day">{start.getUTCDate()}</span>
          </div>
          <div className="event-heading">
            <p className="event-eyebrow">You are invited</p>
            <h1>{event.summary}</h1>
            <p className="event-when">{dateLine}</p>
          </div>
        </header>

        <div className="event-details">
          <div className="event-detail">
            <ClockIcon />
            <div>
              <span>When</span>
              <b>{timeLine}</b>
              <small>{duration ? `${duration} · local time` : 'Local time'}</small>
            </div>
          </div>
          {event.location ? (
            <div className="event-detail">
              <PinIcon />
              <div>
                <span>Where</span>
                <b>{event.location}</b>
              </div>
            </div>
          ) : null}
        </div>

        {event.description ? (
          <div className="event-description">
            <h2>About this event</h2>
            <p>{event.description}</p>
          </div>
        ) : null}

        <div className="event-actions">
          <button type="button" className="btn grad" onClick={addToCalendar}>
            Add to calendar
          </button>
          {mapHref ? (
            <a className="btn subtle" href={mapHref} target="_blank" rel="noopener noreferrer">
              Open location
            </a>
          ) : null}
          <button type="button" className="btn subtle" onClick={copyLink}>Copy link</button>
        </div>
        <p className="event-note" role="status" aria-live="polite">{note}</p>
      </article>

      <p className="event-credit">
        Shared with a <a href="/qr-code-generator">Stylzo QR code</a>.
      </p>
    </section>
  );
}
