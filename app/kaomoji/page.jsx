import { LibraryPage, generateLibraryMetadata } from '@/components/library-page.jsx';

export const generateMetadata = () => generateLibraryMetadata('kaomoji');

export default function Page() {
  return <LibraryPage libraryKey="kaomoji" />;
}
