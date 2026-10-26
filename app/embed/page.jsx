import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';
import { env } from '@/config/environment.js';

const SNIPPET = `<div data-stylzo-embed></div>
<script type="module" src="${env.siteUrl}/embed/stylzo-embed.js"></script>`;

function embedMeta() {
  return pageMeta({
    title: 'Embed the Fancy Text Generator — Free Widget',
    description: 'Add a working fancy text generator to any site with one script tag. No account, API key or build step, and under 10 KB. MIT-licensed engine.',
    path: '/embed',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Embed', path: '/embed' }],
  });
}

export function generateMetadata() {
  return toMetadata(embedMeta());
}

export default function EmbedPage() {
  return (
    <>
      <JsonLd items={embedMeta().jsonLd} />
      <Scripts pageKey="embed" />

      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> / <span aria-current="page">Embed</span>
      </nav>

      <article className="prose">
        <h1>Embed the fancy text generator</h1>

        <section className="quick-answer" aria-labelledby="embed-answer">
          <h2 id="embed-answer">How do I add this to my site?</h2>
          <p>
            Paste two lines of HTML anywhere in your page. There is no account, no API key and no
            build step — the widget is a single script file with no dependencies, and it works on
            any site that can host a script tag. It carries a visible link back to Stylzo, which
            has to stay: removing it breaks the terms below.
          </p>
        </section>

        <h2>The snippet</h2>
        <pre><code>{SNIPPET}</code></pre>
        <p className="muted">
          Put it in your footer, in a sidebar, or anywhere that suits. The script upgrades every
          element carrying <code>data-stylzo-embed</code>, so you can add as many as you like.
        </p>

        <h2>What you get</h2>
        <ul>
          <li>A working generator with twelve styles, live preview and copy to clipboard.</li>
          <li>No dependencies, no framework, no tracking of what your visitors type.</li>
          <li>Text is styled in the visitor&apos;s own browser and never reaches a server.</li>
          <li>Under 10 KB, loaded from a CDN edge.</li>
        </ul>

        <h2>Customising it</h2>
        <p>
          The widget reads its own origin from the script URL, so the same file works in
          development and production. To control the width, wrap it and set a width on the
          container, or override the <code>#stylzo-embed</code> styles after the script loads.
        </p>
        <pre><code>{`<div style="max-width:340px" data-stylzo-embed></div>`}</code></pre>

        <h2>The engine, on its own</h2>
        <p>
          If you want the styling without the widget, the engine is published separately and is
          what the widget runs on. It is pure, dependency-free and about 14 KB.
        </p>
        <pre><code>npm install @stylzo/unicode</code></pre>
        <p>
          It is MIT licensed, so you can use it in a commercial project without asking. It comes
          with 23 Unicode alphabets, combining marks, zalgo and frames.
        </p>

        <h2>Terms for the embed</h2>
        <ul>
          <li>Keep the visible &ldquo;Powered by Stylzo&rdquo; link.</li>
          <li>Do not resell the widget as your own tool.</li>
          <li>Do not remove it in order to hide where the functionality comes from.</li>
        </ul>
        <p className="muted">
          Those are the only conditions. There is no traffic cap, no approval process and no
          email address required.
        </p>

        <h2>If it does not appear</h2>
        <p>
          A Content Security Policy that forbids scripts from this origin will stop it loading.
          That is the browser working correctly, not a bug in the widget — the script is a module
          so it never needs <code>unsafe-inline</code>, but the host site still has to allow it.
        </p>
      </article>
    </>
  );
}