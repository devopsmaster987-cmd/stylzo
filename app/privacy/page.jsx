import { StaticPage, generateStaticMetadata } from '@/components/static-page.jsx';

export const generateMetadata = () => generateStaticMetadata('privacy');

export default function Page() {
  return <StaticPage pageKey="privacy" />;
}
