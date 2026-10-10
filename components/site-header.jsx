import { Fragment } from 'react';
import { site } from '@/config/site.js';
import { applyStyle } from '@/services/unicode/engine.js';

export function wordmark() {
  return applyStyle(site.name, { pipeline: [{ type: 'map', name: 'bold-script' }] });
}

export function BrandLink() {
  return (
    <a className="brand" href="/" aria-label={`${site.name} home`}>
      <span aria-hidden="true">{wordmark()}</span>
      <span className="brand-dot" aria-hidden="true">.</span>
    </a>
  );
}

export function SiteNav() {
  return (
    <nav aria-label="Main">
      <ul className="nav">
        {site.nav.map((n) => (
          <li key={n.href} className={[n.children ? 'has-sub' : '', n.className || ''].filter(Boolean).join(' ') || undefined}>
            {n.children ? (
              <>
                <span className="nav-sub-label"><a href={n.href}>{n.label}</a></span>
                <ul className="subnav">
                  {n.children.map((c) => <li key={c.href}><a href={c.href}>{c.label}</a></li>)}
                </ul>
              </>
            ) : (
              <a href={n.href}>{n.label}</a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  return (
    <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile" hidden>
      <ul>
        {site.nav.map((n) => (
          <Fragment key={n.href}>
            <li className={n.className || undefined}><a href={n.href}>{n.label}</a></li>
            {(n.children || []).map((c) => (
              <li key={c.href} className="mobile-child"><a href={c.href}>{c.label}</a></li>
            ))}
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}