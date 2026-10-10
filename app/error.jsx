'use client';

export default function ErrorPage({ reset }) {
  return (
    <article className="prose">
      <h1>Something went wrong</h1>
      <p>The server hit an error. Reload the page, or <a href="/">return home</a>.</p>
      <p>
        <button type="button" className="btn" onClick={() => reset()}>Try again</button>
      </p>
    </article>
  );
}