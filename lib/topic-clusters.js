// Topic clusters: the four subjects the site is built around.
//
// Each cluster names one canonical page that defines the subject and the member
// pages that depend on it. The owner links to its members and every member links
// back to the owner, so a crawler and a reader can both tell which page is the
// definition and which pages are applications of it.
//
// The wording for the first two definitions lives in the owner sentence on
// /about; /tools and /styles define their own cluster in their opening copy.
// The test suite checks the term is present and that both directions are linked.

import { LANDING_PAGES } from './landing-pages.js';

export const TOPIC_CLUSTERS = [
  {
    key: 'unicode-text-styles',
    term: 'Unicode text styles',
    owner: '/about',
    members: ['/', '/fonts', '/styles'],
  },
  {
    key: 'libraries',
    term: 'copyable libraries',
    owner: '/about',
    members: ['/symbols', '/emoji', '/kaomoji'],
  },
  {
    key: 'text-tools',
    term: 'text tools',
    owner: '/tools',
    members: [
      '/qr-code-generator',
      '/qr-code-reader',
      '/image-compression',
      '/universal-text-fixer',
      '/screenshot-to-text',
      '/pdf-editor',
      '/pdf-accessibility-checker',
    ],
  },
  {
    key: 'platform-guides',
    term: 'style guides',
    owner: '/styles',
    members: LANDING_PAGES.map((page) => `/styles/${page.key}`),
  },
];
