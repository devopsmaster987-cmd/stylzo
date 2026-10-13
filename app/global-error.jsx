'use client';

/**
 * Last-resort error boundary. Without this, an unhandled render error anywhere
 * in the app returns Next's built-in error page: unstyled default HTML, no site
 * chrome, no navigation, and no CSP nonce. A visitor who hits one would be
 * stranded with no way back into the site.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex,nofollow" />
        <title>Something went wrong | Stylzo</title>
        <link rel="stylesheet" href="/css/main.css" />
      </head>
      <body>
        <main id="main" className="wrap">
          <section className="hero">
            <h1>Something went wrong</h1>
            <p className="lede">
              This page could not be shown. Nothing you typed has been lost or sent anywhere.
            </p>
          </section>
          <p>
            <button type="button" className="btn" onClick={reset}>Try again</button>
          </p>
          <p className="more">
            Or go back to <a href="/">the generator</a>, browse <a href="/fonts">font styles</a>,
            or open <a href="/styles">the style guides</a>.
          </p>
          {error?.digest ? <p className="muted">Reference: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}