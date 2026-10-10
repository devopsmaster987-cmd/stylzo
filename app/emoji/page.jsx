import { LibraryPage, generateLibraryMetadata } from '@/components/library-page.jsx';

export const generateMetadata = () => generateLibraryMetadata('emoji');

export default function Page() {
  return <LibraryPage libraryKey="emoji" />;
}
