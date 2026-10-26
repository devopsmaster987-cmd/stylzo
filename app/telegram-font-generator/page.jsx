import { platformMetadata, renderPlatformPage } from '@/components/platform-guide.jsx';

export const generateMetadata = platformMetadata('telegram');

export default async function TelegramFontGeneratorPage({ searchParams }) {
  return renderPlatformPage({ key: 'telegram', searchParams });
}
