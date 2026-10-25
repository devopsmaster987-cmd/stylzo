import { notFound } from 'next/navigation';
import { catalog } from '@/services/catalog.js';
import { categoryContent } from '@/lib/category-content.js';
import {
  generateMetadata as categoryMetadata,
  generateStaticParams,
  renderCategoryPage,
} from '@/components/category-page.jsx';

export { generateStaticParams };

export default async function CategoryPage({ params, searchParams }) {
  const { key } = await params;
  if (!catalog().categories[key] || !categoryContent(key)) notFound();
  const page = await renderCategoryPage({ key, searchParams });
  if (!page) notFound();
  return page;
}

export async function generateMetadata({ params, searchParams }) {
  const { key } = await params;
  if (!catalog().categories[key] || !categoryContent(key)) {
    return { robots: { index: false, follow: false } };
  }
  return categoryMetadata({ params, searchParams });
}
