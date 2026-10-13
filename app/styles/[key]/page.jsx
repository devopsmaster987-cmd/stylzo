import { notFound } from 'next/navigation';
import { LANDING_PAGES } from '@/lib/landing-pages.js';
import {
  renderLandingPage, generateMetadata as landingMetadata, generateStaticParams,
} from '@/components/landing-page.jsx';

export { generateStaticParams };

/**
 * /styles/<key> serves the six real landing pages and nothing else.
 *
 * The route used to render a keyword board here: 32 slugs, each a thin page
 * showing the same 25 words under a different search phrase. Those slugs are
 * permanently redirected away in next.config (see lib/styles-routing.js), so
 * they never reach this component — the catch-all rule there turns any slug that
 * is not one of the six into a 301 on the first request.
 *
 * The notFound() below is the second line of defence, not the first. It stays so
 * that a slug arriving by some other route — a rewrite, a prefetch that skips
 * redirects, a future change to the redirect list — renders a 404 rather than
 * quietly producing another thin page.
 */
export default async function StylePage({ params, searchParams }) {
  const { key } = await params;
  if (!LANDING_PAGES.some((p) => p.key === key)) notFound();
  const page = await renderLandingPage({ key, searchParams });
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params, searchParams }) {
  const { key } = await params;
  // searchParams has to be passed through: a ?text= render is somebody else's
  // name rather than the page's own content, and is noindex because of it.
  if (LANDING_PAGES.some((p) => p.key === key)) return landingMetadata({ params, searchParams });
  return { robots: { index: false, follow: false } };
}
