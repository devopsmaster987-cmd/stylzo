import { platformMetadata, renderPlatformPage } from '@/components/platform-guide.jsx';

export const generateMetadata = platformMetadata('youtube');

export default async function YouTubeFontGeneratorPage({ searchParams }) {
  return renderPlatformPage({ key: 'youtube', searchParams });
}
