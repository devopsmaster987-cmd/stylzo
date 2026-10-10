import { StaticPage, generateStaticMetadata } from '@/components/static-page.jsx';

export const generateMetadata = () => generateStaticMetadata('contact');

export default function Page() {
  return <StaticPage pageKey="contact" />;
}
