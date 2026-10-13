import { headers } from 'next/headers';
import { catalog } from '@/services/catalog.js';
import { snapshot } from '@/services/analytics.js';
import { env, firebaseConfigured } from '@/config/environment.js';
import { isAdminAuthorized, pickAdminKey } from '@/lib/admin-auth.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';
import { Scripts } from '@/components/scripts.jsx';

function adminMeta() {
  return pageMeta({
    title: 'Admin',
    description: 'Catalog health, traffic counters and feature flags for this Stylzo deployment.',
    path: '/admin',
    noindex: true,
  });
}

export function generateMetadata() {
  return toMetadata(adminMeta());
}

export default async function AdminPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const key = pickAdminKey((await headers()).get('x-admin-key'), sp);
  const authorized = isAdminAuthorized(key);

  const { styles, counts, categories } = catalog();
  const stats = authorized
    ? {
        totalStyles: styles.length,
        indexable: styles.filter((s) => s.indexable).length,
        categories: Object.entries(counts).map(([k, n]) => ({ key: k, name: categories[k]?.name || k, count: n })),
        analytics: snapshot(),
        flags: {
          firebaseConfigured,
          aiConfigured: Boolean(env.aiApiKey),
          vercel: env.isVercel,
          env: env.nodeEnv,
        },
      }
    : null;

  return (
    <>
      <JsonLd items={adminMeta().jsonLd} />
      <Scripts pageKey="admin" />

      <section className="hero">
        <p className="eyebrow">admin</p>
        <h1>Dashboard</h1>
        <p className="lede">Catalog health, traffic counters and feature flags for this deployment.</p>
      </section>

      {!env.adminKey ? (
        <div className="panel">
          <h2>Set up access</h2>
          <p className="auth-note">
            This deployment has no <code>ADMIN_KEY</code>, so the dashboard stays closed. Add
            {' '}<code>ADMIN_KEY=some-long-secret</code> to your environment, restart, then open
            {' '}<code>/admin?key=some-long-secret</code>.
          </p>
        </div>
      ) : !authorized ? (
        <div className="panel">
          <h2>Enter your key</h2>
          <form className="key-form" method="get" action="/admin">
            <label className="skip" htmlFor="admin-key">Admin key</label>
            <input id="admin-key" name="key" type="password" placeholder="ADMIN_KEY" autoComplete="off" required />
            <button className="btn" type="submit">Open dashboard</button>
          </form>
          <p className="auth-note">Wrong or missing keys see nothing — the dashboard returns no data.</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><b>{stats.totalStyles}</b><span>styles in catalog</span></div>
            <div className="stat-card"><b>{stats.indexable}</b><span>indexable style pages</span></div>
            <div className="stat-card"><b>{stats.analytics.totalViews}</b><span>pageviews (this instance)</span></div>
            <div className="stat-card"><b>{stats.analytics.sessions}</b><span>sessions (this instance)</span></div>
            <div className="stat-card"><b>{stats.analytics.uptimeSeconds}s</b><span>instance uptime</span></div>
          </div>

          <h2>Categories</h2>
          <table className="table">
            <thead><tr><th>Category</th><th>Key</th><th>Styles</th></tr></thead>
            <tbody>
              {stats.categories.map((c) => (
                <tr key={c.key}><td>{c.name}</td><td><code>{c.key}</code></td><td>{c.count}</td></tr>
              ))}
            </tbody>
          </table>

          <h2>Traffic</h2>
          <table className="table">
            <thead><tr><th>Top pages</th><th>Views</th></tr></thead>
            <tbody>
              {stats.analytics.topPages.map((p) => (
                <tr key={p.key}><td><code>{p.key}</code></td><td>{p.count}</td></tr>
              ))}
            </tbody>
          </table>

          <table className="table">
            <thead><tr><th>Events</th><th>Count</th></tr></thead>
            <tbody>
              {stats.analytics.events.map((p) => (
                <tr key={p.key}><td><code>{p.key}</code></td><td>{p.count}</td></tr>
              ))}
              {!stats.analytics.events.length ? (
                <tr><td colSpan="2" className="muted">No events captured yet.</td></tr>
              ) : null}
            </tbody>
          </table>

          <h2>Feature flags</h2>
          <table className="table">
            <tbody>
              <tr><td>Firebase configured</td><td>{stats.flags.firebaseConfigured ? 'yes' : 'no'}</td></tr>
              <tr><td>AI provider configured</td><td>{stats.flags.aiConfigured ? 'yes' : 'no'}</td></tr>
              <tr><td>Hosting</td><td>{stats.flags.vercel ? 'Vercel' : 'node'}</td></tr>
              <tr><td>Environment</td><td>{stats.flags.env}</td></tr>
            </tbody>
          </table>
          <p className="auth-note">Counters are in-memory per instance — they reset when the process restarts and are never joined with identifiers.</p>
          <p className="more">
            <a href="/admin/seo?key=${encodeURIComponent(key)}">Open the SEO keyword dashboard</a>
          </p>
        </>
      )}
    </>
  );
}