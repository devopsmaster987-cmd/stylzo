import { StaticPage, generateStaticMetadata } from '@/components/static-page.jsx';

export const generateMetadata = () => generateStaticMetadata('about');

export default function Page() {
  return <StaticPage pageKey="about" />;
}
