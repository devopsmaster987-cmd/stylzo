import { renderStylesHub, generateMetadata } from '@/components/styles-hub.jsx';

export { generateMetadata };

export default async function StylesIndexPage({ searchParams }) {
  return renderStylesHub(await searchParams);
}
