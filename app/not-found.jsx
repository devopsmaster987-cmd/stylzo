import { Scripts } from '@/components/scripts.jsx';

export const metadata = {
  title: 'Page not found',
  description: 'That address does not match a page here.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Scripts pageKey="404" />
      <article className="prose">
        <h1>Page not found</h1>
        <p>
          That address does not match a page here. Try the <a href="/">generator</a> or browse the{' '}
          <a href="/fonts">font styles</a>.
        </p>
      </article>
    </>
  );
}