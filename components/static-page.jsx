import { pageContent } from '@/services/catalog.js';
import { env } from '@/config/environment.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from './json-ld.jsx';
import { Scripts } from './scripts.jsx';

function staticMeta(key) {
  const page = pageContent(key);
  return pageMeta({
    title: page.title,
    description: page.description,
    path: `/${key}`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: page.title, path: `/${key}` }],
  });
}

export async function generateStaticMetadata(key) {
  return toMetadata(staticMeta(key));
}

export function StaticPage({ pageKey }) {
  const page = pageContent(pageKey);
  const meta = staticMeta(pageKey);

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey={pageKey} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">{page.title}</span>
      </nav>

      <article className="prose">
        <h1>{page.title}</h1>
        {page.body.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        {pageKey === 'contact' ? (
          env.contactEmail ? (
            <p>Email <a href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.</p>
          ) : (
            <p>
              No contact address is configured yet. Set <code>CONTACT_EMAIL</code> in the environment
              to show one here.
            </p>
          )
        ) : null}
      </article>
    </>
  );
}