import { pageContent } from '@/services/catalog.js';
import { env } from '@/config/environment.js';
import { site } from '@/config/site.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { ABOUT_QA, WHAT_IT_IS } from '@/lib/aeo.js';
import { keyFacts } from '@/lib/facts.js';
import { JsonLd } from './json-ld.jsx';
import { Scripts } from './scripts.jsx';

/**
 * The answer-first paragraph for each policy page. These are the questions an
 * assistant is most likely to be asked about this page, answered in one or two
 * sentences before the longer prose.
 */
const PAGE_ANSWER = {
  about: {
    q: 'What is Stylzo and how does it work?',
    a: WHAT_IT_IS,
  },
  privacy: {
    q: 'Does this site store the text I type?',
    a: 'No. The text you type is converted in your browser and is never sent to the server or '
      + 'stored. The only things kept on your device are your own settings: your cookie choice, '
      + 'and any styles you have favourited or used recently.',
  },
  terms: {
    q: 'Can I use the text this site generates commercially?',
    a: 'Yes. The output is built from standard Unicode characters rather than a licensed '
      + 'font, so there is no licence attached to what you generate. You may not use styled text '
      + 'to impersonate others, evade moderation, harass people or break the law.',
  },
  contact: {
    q: 'How do I contact the owner of Stylzo?',
    // No response-time promise here: it is a claim about a human's inbox that
    // nobody can audit, and an unverifiable promise on a contact page is worse
    // than saying nothing.
    a: 'Use the email address on this page to report a broken style, an incorrect result or a '
      + 'feature request. Include the style name, the app where it did not display correctly and '
      + 'your device, because those three details usually identify the cause immediately.',
  },
};

/** Extra questions and answers that only appear on one of the policy pages. */
const PAGE_FAQ = {
  about: ABOUT_QA,
};

function staticMeta(key) {
  const page = pageContent(key);
  return pageMeta({
    title: page.title,
    description: page.description,
    path: `/${key}`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: page.title, path: `/${key}` }],
    // The answer-first question is emitted as its own Question node by
    // buildMeta(); the page's FAQ stays visible without a FAQPage wrapper.
    faq: PAGE_FAQ[key] || [],
    quickAnswer: PAGE_ANSWER[key] || null,
  });
}

export async function generateStaticMetadata(key) {
  return toMetadata(staticMeta(key));
}

export function StaticPage({ pageKey }) {
  const page = pageContent(pageKey);
  const meta = staticMeta(pageKey);
  const answer = PAGE_ANSWER[pageKey];
  const ownerName = String(site.ownerName || '').trim();
  const businessEmail = String(site.businessEmail || '').trim() || env.contactEmail;
  const domain = new URL(env.siteUrl).host.replace(/^www\./, '');

  return (
    <>
      <JsonLd items={meta.jsonLd} />
      <Scripts pageKey={pageKey} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">{page.title}</span>
      </nav>

      <article className="prose">
        <h1>{page.title}</h1>

        {/* Answer first, prose second. An assistant quoting this page needs a
            standalone answer, and a reader wants the same thing. */}
        {answer ? (
          <section className="quick-answer" aria-labelledby="quick-answer-heading">
            <h2 id="quick-answer-heading">{answer.q}</h2>
            <p>{answer.a}</p>
          </section>
        ) : null}

        {page.body.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}

        {pageKey === 'about' ? (
          <p>
            {ownerName
              ? `Stylzo is the brand name for the website at ${domain}, owned and run by ${ownerName}. It publishes Unicode text styles, copyable libraries, browser text tools and platform style guides.`
              : 'Stylzo is the brand name for this website, owned and run by one person. It publishes Unicode text styles, copyable libraries, browser text tools and platform style guides.'}
          </p>
        ) : null}

        {page.sections?.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            {s.links ? (
              <ul>
                {s.links.map((l) => (
                  <li key={l.href}><a href={l.href} {...(l.external ? { rel: 'noopener noreferrer' } : {})}>{l.label}</a></li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {/* Only on /about. These are the numbers a generated answer is most
            likely to quote, each stated on its own line so a model lifting one
            of them gets a complete, correct claim rather than a fragment. */}
        {pageKey === 'about' ? (
          <section aria-labelledby="facts-heading">
            <h2 id="facts-heading">Key facts</h2>
            <dl className="facts">
              {keyFacts().map((f) => (
                <div key={f.id}>
                  <dt>{f.label}</dt>
                  <dd><b>{f.value}</b> &mdash; {f.detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {PAGE_FAQ[pageKey] ? (
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading">Common questions</h2>
            {PAGE_FAQ[pageKey].map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        ) : null}

        {pageKey === 'contact' ? (
          businessEmail ? (
            <p>
              Email the owner at <a href={`mailto:${businessEmail}`}>{businessEmail}</a>.
            </p>
          ) : (
            <p>
              No contact address is configured yet. Set <code>businessEmail</code> in
              <code>config/site.js</code> or <code>CONTACT_EMAIL</code> in the environment to show
              one here.
            </p>
          )
        ) : null}
      </article>
    </>
  );
}