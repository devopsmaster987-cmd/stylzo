import { platformMetadata, renderPlatformPage } from '@/components/platform-guide.jsx';

export const generateMetadata = platformMetadata('tiktok');

export default async function TikTokFontGeneratorPage({ searchParams }) {
  return renderPlatformPage({ key: 'tiktok', searchParams });
}
