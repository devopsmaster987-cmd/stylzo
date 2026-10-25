import { pageMeta, toMetadata } from '@/lib/pages.js';
import { Scripts } from '@/components/scripts.jsx';
import { EventView } from '@/components/event-view.jsx';

function eventMeta() {
  return pageMeta({
    title: 'Event',
    description: 'View the details of an event shared with a Stylzo QR code.',
    path: '/event',
    noindex: true,
  });
}

export function generateMetadata() {
  return toMetadata(eventMeta());
}

export default function EventPage() {
  return (
    <>
      <Scripts pageKey="event" />
      <EventView />
      <noscript>
        <p className="event-loading">
          This event needs JavaScript to read its details from the link.
        </p>
      </noscript>
    </>
  );
}
