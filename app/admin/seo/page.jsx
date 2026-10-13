import { headers } from 'next/headers';
import { env } from '@/config/environment.js';
import { isAdminAuthorized, pickAdminKey } from '@/lib/admin-auth.js';
import { keywordMap, KEYWORD_CATEGORIES } from '@/services/keyword-map.js';
import { pageMeta, toMetadata } from '@/lib/pages.js';
import { JsonLd } from '@/components/json-ld.jsx';

function seoAdminMeta() {
  return pageMeta({
    title: 'SEO Keyword Dashboard',
    description: 'Internal review dashboard for the Stylzo keyword map: category coverage, mapping status and emoji variation counts.',
    path: '/admin/seo',
    noindex: true,
  });
}

export function generateMetadata() {
  return toMetadata(seoAdminMeta());
}

const STATUS_FILTERS = [
  ['all', 'All'],
  ['mapped', 'Mapped'],
  ['skipped', 'Skipped'],
  ['planned', 'Planned'],
  ['unmapped', 'Unmapped'],
  ['needs-review', 'Needs review'],
];

export default async function SeoAdminPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const authorized = isAdminAuthorized(pickAdminKey((await headers()).get('x-admin-key'), sp));
  const data = keywordMap();
  const { summary } = data;

  return (
    <>
      <JsonLd items={seoAdminMeta().jsonLd} />
      {/* No client script: this page used to load the /styles board dashboard,
          which was a copy-paste leftover — it drove keyword filtering on a page
          whose filters are server-side query parameters. Filtering still works
          through the GET form; only the instant client-side narrowing is gone. */}

      <section className="hero">
        <p className="eyebrow">admin</p>
        <h1>SEO keyword dashboard</h1>
        <p className="lede">
          Review the keyword map before anything is published. Keywords are reviewed here; they
          are never turned into pages automatically.
        </p>
      </section>

      {!env.adminKey ? (
        <div className="panel">
          <h2>Set up access</h2>
          <p className="auth-note">
            This deployment has no <code>ADMIN_KEY</code>, so the dashboard stays closed. Add
            {' '}<code>ADMIN_KEY=some-long-secret</code> to your environment, restart, then open
            {' '}<code>/admin/seo?key=some-long-secret</code>.
          </p>
        </div>
      ) : !authorized ? (
        <div className="panel">
          <h2>Enter your key</h2>
          <form className="key-form" method="get" action="/admin/seo">
            <label className="skip" htmlFor="seo-admin-key">Admin key</label>
            <input id="seo-admin-key" name="key" type="password" placeholder="ADMIN_KEY" autoComplete="off" required />
            <button className="btn" type="submit">Open dashboard</button>
          </form>
          <p className="auth-note">Wrong or missing keys see no keyword data at all.</p>
        </div>
      ) : (
        <div className="kw-layout">
          <button
            type="button"
            className="btn subtle kw-drawer-toggle"
            id="kw-drawer-toggle"
            aria-expanded="false"
            aria-controls="kw-sidebar"
          >
            Keyword categories
          </button>

          <aside className="kw-sidebar" id="kw-sidebar" aria-label="Keyword categories">
            <nav aria-label="Categories">
              <h2 className="kw-sidebar-title" id="kw-cat-label">Categories</h2>
              <ul className="kw-cat-list" role="list">
                {KEYWORD_CATEGORIES.map((c) => {
                  const found = data.categories.find((x) => x.id === c.id);
                  if (!found) return null;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="kw-cat"
                        data-kw-category={c.id}
                        aria-pressed={c.id === 'all' ? 'true' : 'false'}
                      >
                        <span className="kw-cat-icon" aria-hidden="true">{found.icon}</span>
                        <span className="kw-cat-label">{found.label}</span>
                        <span className="kw-cat-count" data-kw-count-for={c.id}>{found.count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="kw-main">
            <div className="stats-grid">
              <div className="stat-card"><b>{summary.sourceEntries}</b><span>source entries</span></div>
              <div className="stat-card"><b>{summary.uniqueKeywords}</b><span>unique keywords</span></div>
              <div className="stat-card"><b>{summary.mapped}</b><span>mapped</span></div>
              <div className="stat-card"><b>{summary.skipped}</b><span>skipped competitors</span></div>
              <div className="stat-card"><b>{summary.planned}</b><span>planned features</span></div>
              <div className="stat-card"><b>{summary.unmapped + summary.needsReview}</b><span>need review</span></div>
              <div className="stat-card"><b>{summary.indexablePages}</b><span>indexable pages</span></div>
              <div className="stat-card"><b>{summary.totalVariations}</b><span>variations generated</span></div>
              <div className="stat-card"><b>{summary.displayedVariations}</b><span>variations displayed</span></div>
              <div className="stat-card">
                <b>{summary.sectionsMeetingTarget}/{summary.variationSections}</b>
                <span>sections at target</span>
              </div>
              <div className="stat-card"><b>{summary.sectionsShort}</b><span>sections short</span></div>
              <div className="stat-card"><b>{summary.duplicates}</b><span>duplicate lines</span></div>
              <div className="stat-card"><b>{summary.removed}</b><span>lines removed</span></div>
              <div className="stat-card"><b>{data.validation.failures}</b><span>SEO failures</span></div>
            </div>

            <div className="kw-controls">
              <div className="kw-search">
                <label htmlFor="kw-search">Search keywords</label>
                <input
                  id="kw-search"
                  type="search"
                  data-kw-search
                  placeholder="Filter by keyword, category, status or route"
                  autoComplete="off"
                />
              </div>

              <fieldset className="kw-status">
                <legend>Mapping status</legend>
                {STATUS_FILTERS.map(([value, label]) => (
                  <label key={value} className="kw-status-option">
                    <input
                      type="radio"
                      name="kw-status"
                      value={value}
                      data-kw-status
                      defaultChecked={value === 'all'}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <div className="kw-sort">
                <label htmlFor="kw-sort">Sort by</label>
                <select id="kw-sort" data-kw-sort className="field-input">
                  <option value="keyword">Keyword (A–Z)</option>
                  <option value="category">Category</option>
                  <option value="status">Mapping status</option>
                  <option value="variations">Valid variations (high to low)</option>
                  <option value="route">Target route</option>
                </select>
              </div>
            </div>

            <p className="kw-count" data-kw-result-count aria-live="polite"></p>

            <ul className="rows kw-rows" data-kw-rows>
              {data.keywords.map((k) => (
                <li
                  key={k.normalized}
                  className="row kw-row"
                  data-kw-row
                  data-normalized={k.normalized}
                  data-original={k.original}
                  data-category={k.category}
                  data-status={k.status}
                  data-route={k.route || ''}
                  data-variations={k.variations || 0}
                >
                  <div className="row-meta">
                    <h3 className="row-name">{k.normalized}</h3>
                    <p className="row-support" data-status-badge={k.status}>{k.status}</p>
                  </div>
                  <dl className="kw-detail">
                    <div><dt>Original</dt><dd>{k.original}</dd></div>
                    <div><dt>Core modifier</dt><dd>{k.coreModifier}</dd></div>
                    <div><dt>Category</dt><dd>{k.category}</dd></div>
                    <div><dt>Target route</dt><dd>{k.route || 'none — not mapped'}</dd></div>
                    <div><dt>Variations</dt><dd>{k.variations || 0} generated, {k.displayedVariations || 0} displayed</dd></div>
                    <div><dt>Reason</dt><dd>{k.reason}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>

            <p className="kw-empty" data-kw-empty hidden>
              No keywords match that search or filter. Clear the search box or pick another status.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
