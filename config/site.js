import { env } from './environment.js';

// The four kinds of entity this site publishes are defined here, once.
// `ids` and `apps` are the source of truth for schema.org @id values and for
// the names, URLs and feature lists of every WebApplication. A page never
// invents an entity of its own; it references these by @id.
const BASE = env.siteUrl;

const apps = {
  generator: {
    path: '/',
    name: 'Stylzo Text Generator',
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Text generator',
    description:
      'Convert plain text into Unicode styles such as bold, cursive, gothic, bubble and glitch, '
      + 'then copy the result. Runs entirely in the browser.',
    features: null, // read from lib/facts.js so the style counts cannot drift
  },
  'text-tools': {
    path: '/tools',
    name: 'Stylzo Text Tools',
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Text utilities',
    description:
      'Count words and characters, convert case, reverse text, build slugs, replace text, '
      + 'sort lines and clean up pasted text in the browser.',
    features: [
      'Count words, characters, sentences and reading time',
      'Convert case, reverse text and generate URL slugs',
      'Find and replace text, and sort, deduplicate or trim lines',
      'Collapse spaces, normalise punctuation and strip zero-width characters',
    ],
  },
  'qr-code-generator': {
    path: '/qr-code-generator',
    name: 'Stylzo QR Code Generator',
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'QR code generator',
    description:
      'Create QR codes for links, text, Wi-Fi, WhatsApp, email, phone and contact cards, '
      + 'then download them as PNG, SVG or JPG. Built in the browser.',
    features: [
      'Create QR codes for links, text, Wi-Fi, WhatsApp, email, phone and contact cards',
      'Set colours and add a logo with a contrast warning',
      'Download the result as PNG, SVG or JPG',
    ],
  },
  'qr-code-reader': {
    path: '/qr-code-reader',
    name: 'Stylzo QR Code Reader',
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'QR code reader',
    description:
      'Decode a QR code from a photo or screenshot and show its link, text, Wi-Fi login, '
      + 'contact card, phone, email or location. The image stays in the browser.',
    features: [
      'Read a QR code from a photo or screenshot',
      'Extract links, text, Wi-Fi logins, contact cards, phone, email and location fields',
      'Decode the image locally without uploading it',
    ],
  },
  'image-compression': {
    path: '/image-compression',
    name: 'Stylzo Image Compressor',
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: 'Image compression',
    description:
      'Compress JPG, PNG and WebP images, resize, convert format and download a batch, '
      + 'with the real before-and-after size shown. No upload.',
    features: [
      'Compress JPG, PNG and WebP images and report the real before-and-after size',
      'Resize images, convert format and process a batch',
      'Download one file or the whole batch as a ZIP',
    ],
  },
  'universal-text-fixer': {
    path: '/universal-text-fixer',
    name: 'Stylzo Text Fixer',
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Text cleanup',
    description:
      'Clean up pasted text in the browser: spacing, quotes, dashes, repeated words, '
      + 'zero-width characters and case. Every fix is a toggle.',
    features: [
      'Fix spacing, quotes, dashes and repeated words',
      'Remove zero-width and other invisible characters',
      'Apply sentence case or change case without rewriting the wording',
    ],
  },
  'screenshot-to-text': {
    path: '/screenshot-to-text',
    name: 'Stylzo Screenshot to Text',
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: 'Optical character recognition',
    description:
      'Read text from a screenshot with OCR in the browser, edit the recognisable text, '
      + 'or replace a line on the image and export a PNG.',
    features: [
      'Extract text from a screenshot with OCR that runs in the browser',
      'Edit the recognised text before copying or downloading it',
      'Replace a line on the screenshot and export the edited PNG',
    ],
  },
  'pdf-editor': {
    path: '/pdf-editor',
    name: 'Stylzo PDF Editor',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'PDF editing',
    description:
      'Reorder, rotate, duplicate, delete or merge PDF pages, add text or page numbers, '
      + 'and download the result without uploading the document.',
    features: [
      'Reorder, rotate, duplicate, delete and merge PDF pages',
      'Add text or page numbers to one page or every page',
      'Rebuild and download the PDF in the browser',
    ],
  },
  'pdf-accessibility-checker': {
    path: '/pdf-accessibility-checker',
    name: 'Stylzo PDF Accessibility Checker',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'PDF accessibility',
    description:
      'Check a PDF locally for tags, reading order, language, title, fonts, alt text, '
      + 'links and form fields, with the fix beside each failed check.',
    features: [
      'Check tags, structure and reading order',
      'Check document language, title, readable fonts and alt text',
      'Check labelled links and form fields, with the fix for each failure',
    ],
  },
  studio: {
    path: '/studio',
    name: 'Stylzo Font Studio',
    applicationCategory: 'DesignApplication',
    applicationSubCategory: 'Text image generator',
    description:
      'Render styled text to a 1200 by 630 PNG with a chosen style, colour and background, '
      + 'drawn entirely in the browser.',
    features: [
      'Pick a Unicode style and preview the result',
      'Set text colour and a background, including gradients',
      'Download a 1200 by 630 PNG rendered in the browser',
    ],
  },
};

/** Stable @id values, shared by Organization, WebSite, WebPage and every app. */
export const ids = {
  organization: `${BASE}/#organization`,
  website: `${BASE}/#website`,
  owner: `${BASE}/#owner`,
  page: (path = '/') => `${BASE}${path === '/' ? '/' : path}#webpage`,
  breadcrumb: (path) => `${BASE}${path === '/' ? '/' : path}#breadcrumb`,
  app: (key) => {
    const app = apps[key];
    if (!app) throw new Error(`Unknown WebApplication: ${key}`);
    return app.path === '/' ? `${BASE}/#generator` : `${BASE}${app.path}#app`;
  },
};

export const site = {
  name: 'Stylzo',
  // The host is the brand's public domain. Keeping it as an alternate name is
  // how schema.org ties the Stylzo brand to abdulsamad.shop without inventing a
  // second brand or a fake legal name.
  alternateName: 'abdulsamad.shop',
  tagline: 'Type once, get 5,578 styles you can paste wherever text is accepted',
  defaultDescription:
    'Turn plain text into bold, cursive, gothic, bubble, glitch and hundreds of other styles. Plus symbols, emoji, kaomoji and text tools. Free, no sign-up. The styling runs on your own device.',
  twitter: '',
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/share/1GS6jfYyQS/' },
    { label: 'Instagram', href: 'https://www.instagram.com/abdul.samad987?mdxt=OG5jdzY5bjN6ZjJt' },
  ],
  themeColor: '#4b2fe0',
  // Public identity used on About, Contact and in schema.org. The inbox is the
  // same address already published on Contact; it is not a private secret.
  ownerName: 'Abdul Samad',
  businessEmail: env.contactEmail,
  ids,
  apps,
  nav: [
    { href: '/', label: 'Generator' },
    { href: '/styles', label: 'Style guides', className: 'nav-board' },
    { href: '/guides', label: 'Guides' },
    { href: '/studio', label: 'Studio' },
    { href: '/tools', label: 'Tools', children: [
      { href: '/tools', label: 'Text tools' },
      { href: '/qr-code-generator', label: 'QR code generator' },
      { href: '/qr-code-reader', label: 'QR code reader' },
      { href: '/image-compression', label: 'Image compressor' },
      { href: '/universal-text-fixer', label: 'Text fixer' },
      { href: '/screenshot-to-text', label: 'Screenshot to text' },
      { href: '/pdf-editor', label: 'PDF editor' },
      { href: '/pdf-accessibility-checker', label: 'PDF accessibility checker' },
    ] },
    {
      href: '/symbols', label: 'Libraries',
      children: [
        { href: '/symbols', label: 'Symbols' },
        { href: '/emoji', label: 'Emoji' },
        { href: '/kaomoji', label: 'Kaomoji' },
      ],
    },
    { href: '/about', label: 'About' },
  ],
};
