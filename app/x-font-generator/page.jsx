import { platformMetadata, renderPlatformPage } from '@/components/platform-guide.jsx';

export const generateMetadata = platformMetadata('x');

export default async function XFontGeneratorPage({ searchParams }) {
  return renderPlatformPage({ key: 'x', searchParams });
}
