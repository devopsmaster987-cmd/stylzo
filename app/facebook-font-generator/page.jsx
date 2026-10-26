import { platformMetadata, renderPlatformPage } from '@/components/platform-guide.jsx';

export const generateMetadata = platformMetadata('facebook');

export default async function FacebookFontGeneratorPage({ searchParams }) {
  return renderPlatformPage({ key: 'facebook', searchParams });
}
