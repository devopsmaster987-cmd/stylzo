import { LibraryPage, generateLibraryMetadata } from '@/components/library-page.jsx';

export const generateMetadata = () => generateLibraryMetadata('symbols');

export default function Page() {
  return <LibraryPage libraryKey="symbols" />;
}
