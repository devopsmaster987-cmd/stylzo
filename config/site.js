// Brand. Change these in one place (or via env) when the brand changes.
export const site = {
  name: 'Stylzo',
  tagline: 'Type once, get 5,600+ styles you can paste anywhere',
  defaultDescription:
    'Turn plain text into bold, cursive, gothic, bubble, glitch and hundreds of other styles. Plus symbols, emoji, kaomoji and text tools. Free, no sign-up, everything runs in your browser.',
  twitter: '',
  themeColor: '#4b2fe0',
  nav: [
    { href: '/', label: 'Generator' },
    { href: '/styles', label: 'Style guides', className: 'nav-board' },
    { href: '/studio', label: 'Studio' },
    { href: '/tools', label: 'Tools', children: [
      { href: '/tools', label: 'Text tools' },
      { href: '/qr-code-generator', label: 'QR code generator' },
      { href: '/qr-code-reader', label: 'QR code reader' },
      { href: '/image-compression', label: 'Image compressor' },
      { href: '/universal-text-fixer', label: 'Text fixer' },
      { href: '/screenshot-to-text', label: 'Screenshot to text' },
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
