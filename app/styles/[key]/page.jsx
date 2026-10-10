import { notFound } from 'next/navigation';
import { LANDING_PAGES } from '@/lib/landing-pages.js';
import {
  renderLandingPage, generateMetadata as landingMetadata,
} from '@/components/landing-page.jsx';
import { keywordBoard, boardEntry } from '@/lib/keyword-board.js';
import {
  renderKeywordPage, generateKeywordMetadata, BOARD_SIZE, generateStaticParams,
} from '@/components/keyword-board-page.jsx';

export { generateStaticParams };

export async function generateMetadata({ params, searchParams }) {
  const { key } = await params;
  if (LANDING_PAGES.some((p) => p.key === key)) return landingMetadata({ params, searchParams });
  if (boardEntry(key)) return generateKeywordMetadata({ params, searchParams });
  return { robots: { index: false, follow: false } };
}

export default async function StylePage({ params, searchParams }) {
  const { key } = await params;
  if (LANDING_PAGES.some((p) => p.key === key)) {
    const page = await renderLandingPage({ key, searchParams });
    if (!page) notFound();
    return page;
  }
  const page = await renderKeywordPage({ slug: key, searchParams });
  if (!page) notFound();
  return page;
}

export { BOARD_SIZE };