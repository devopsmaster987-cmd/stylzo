import { notFound } from 'next/navigation';
import { GUIDES, getGuide, guideMeta } from '@/lib/guides.js';
import { toMetadata } from '@/lib/pages.js';
import { GuideArticle } from '@/components/guide-article.jsx';

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { robots: { index: false, follow: false } };
  return toMetadata(guideMeta(guide));
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} />;
}
