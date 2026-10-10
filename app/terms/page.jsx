import { StaticPage, generateStaticMetadata } from '@/components/static-page.jsx';

export const generateMetadata = () => generateStaticMetadata('terms');

export default function Page() {
  return <StaticPage pageKey="terms" />;
}
