// Approved, indexable landing pages.
//
// Every entry here corresponds to a real route (`/styles/<key>`), drives the keyword
// map's mapping step, and supplies page-specific copy. Content is intentionally
// hand-written per page: titles, descriptions, introductions, headings and FAQs must
// not repeat across pages, and nothing may claim a feature the catalog lacks.
//
// Platform limits are only stated where they are stable and verifiable. Anything
// unverified renders as "No limit checked" rather than an invented number.

/**
 * `styles` are real catalog slugs used as the page's generator output. They must
 * resolve through getStyle() and be indexable.
 */
export const LANDING_PAGES = [
  {
    key: 'instagram',
    subject: 'Instagram',
    title: 'Instagram Fancy Text Generator',
    description: 'Make Instagram bios, usernames and captions stand out with Unicode fancy text. Paste your name, pick a style and copy the result straight into your profile.',
    h1: 'Instagram fancy text generator',
    intro: [
      'This generator turns plain words into the bold, cursive, gothic and symbol styles that make an Instagram bio read like it was designed rather than typed. Type your name or caption above and every style updates as you type.',
      'Copy a result and paste it into your bio, your username, a story caption or a DM. Nothing is uploaded, and no Instagram login is ever required.',
      'Support varies by field: Instagram renders most Unicode in bios and captions, but usernames are far more restricted, so test your exact handle before you commit to it.',
    ],
    sections: [
      {
        h2: 'Instagram bio fonts that survive the app',
        body: 'Bio fields accept the widest range of characters, which makes this where decorative styles work best. These are the styles we would try first.',
        styles: ['bio-hearts', 'soft-bio', 'profile-stars', 'aesthetic-wide', 'handle-wrap', 'caption-underline'],
      },
      {
        h2: 'Username and display name text styles',
        body: 'Usernames are filtered far more aggressively than bios. Keep them short, avoid heavy combining-mark styles, and check the result in the app before saving.',
        styles: ['handle-wrap', 'story-title', 'bold', 'small-caps', 'squared'],
      },
      {
        h2: 'Caption text styles that read well',
        body: 'Captions have room for longer strings, so bubble, gothic and fullwidth styles all have space to breathe here.',
        styles: ['circled', 'fraktur', 'fullwidth', 'italic', 'bold-script', 'monospace'],
      },
    ],
    faq: [
      {
        q: 'Will this Instagram font actually show up in my bio?',
        a: 'Usually, yes. Instagram renders Unicode in bio and caption fields on both mobile and desktop, so bold, cursive, gothic and symbol styles appear as generated. Save the profile and reload the app if a change looks stale.',
      },
      {
        q: 'Why does my Instagram username show boxes instead of letters?',
        a: 'Usernames are restricted far more than bios. Instagram accepts a limited character set for handles, and any glyph outside that set is dropped or replaced. Test the exact handle in the app before you rely on it.',
      },
      {
        q: 'Does Stylzo need my Instagram login?',
        a: 'No. The text is styled in your browser and is never sent to our server. There is no account to connect and nothing to log in to, so you can use every style without sharing credentials.',
      },
    ],
    links: [
      { href: '/fonts/bio-hearts', label: 'Bio Hearts' },
      { href: '/fonts/soft-bio', label: 'Soft Bio' },
      { href: '/fonts/profile-stars', label: 'Profile Stars' },
      { href: '/fonts/handle-wrap', label: 'Handle Wrap' },
    ],
    variationSection: { h2: 'Explore Instagram text styles', key: 'instagram', subject: 'Instagram' },
  },

  {
    key: 'whatsapp',
    subject: 'WhatsApp',
    title: 'WhatsApp Fancy Text Generator',
    description: 'Style your WhatsApp display name and status with fancy Unicode text. Bold, cursive, underline, symbol and kaomoji styles you can copy in one tap.',
    h1: 'WhatsApp fancy text generator',
    intro: [
      'WhatsApp supports a small set of formatting marks and ordinary Unicode text, so a generator is the practical way to style a display name or status. Type above, choose a style, and the output updates live.',
      'Copy the result into your WhatsApp profile name, your About section or any chat message. The text is produced entirely in your browser.',
      'Display names are the most restrictive field here. WhatsApp may shorten or strip long or heavily decorated strings, so we show the generated length with each style so you can pick a safe length.',
    ],
    sections: [
      {
        h2: 'Styles that hold up in a display name',
        body: 'Display names are short and heavily filtered. Underlines, strikethroughs and plain letter swaps survive far more reliably than bubble or glitch effects.',
        styles: ['bold', 'italic', 'underline', 'strike', 'small-caps', 'monospace'],
      },
      {
        h2: 'Status and About section lettering',
        body: 'The About field accepts longer text, so decorated frames and symbol wraps have room to work here.',
        styles: ['symbol-heart', 'symbol-star', 'stars-frame', 'kaomoji-heart', 'emoji-frame-sparkles'],
      },
      {
        h2: 'Message text styles',
        body: 'Chat messages have no length pressure, so fullwidth, gothic and script styles read well in conversation.',
        styles: ['fullwidth', 'fraktur', 'script', 'circled', 'double-struck'],
      },
    ],
    faq: [
      {
        q: 'Which WhatsApp fancy text styles actually work?',
        a: 'Letter-swap styles such as bold, italic, gothic and small caps are the most dependable. Combining-mark styles such as underline and strikethrough depend on the device font, and emoji or symbol wraps work on current Android and iOS builds but not on every older client.',
      },
      {
        q: 'Why is my WhatsApp display name shorter than the text I pasted?',
        a: 'WhatsApp truncates display names and filters characters it does not accept in that field. Styles built from hundreds of combining marks are the first thing to be cut. Keep display names short and use plain letter swaps.',
      },
      {
        q: 'Can I use these styles in WhatsApp without an app or extension?',
        a: 'Yes. This runs on the web page in your browser, so there is nothing to install and no companion app. Copy the generated text and paste it into WhatsApp on any device.',
      },
    ],
    links: [
      { href: '/fonts/underline', label: 'Underline Text' },
      { href: '/fonts/small-caps', label: 'Small Caps' },
      { href: '/kaomoji', label: 'Kaomoji library' },
      { href: '/fonts/symbol-heart', label: 'Heart Wrap' },
    ],
    variationSection: { h2: 'Explore WhatsApp text styles', key: 'whatsapp', subject: 'WhatsApp' },
  },

  {
    key: 'discord',
    subject: 'Discord',
    title: 'Discord Fancy Text Generator',
    description: 'Style your Discord nickname, server name and status with fancy Unicode text. Clan tags, framed names, kaomoji and bold letter styles, copyable in one click.',
    h1: 'Discord fancy text generator',
    intro: [
      'Discord renders ordinary Unicode in nicknames, server names, channel names and status lines, which makes it one of the easiest places to use fancy text. Type above and every style re-renders as you go.',
      'Copy a result into a nickname, a server name, a channel topic or your About Me. Nothing leaves your browser.',
      'Discord applies its own filters on top of font support. Nicknames allow more decoration than usernames, and combining-mark styles render differently across desktop, mobile and the web client, so preview before you commit.',
    ],
    sections: [
      {
        h2: 'Nickname and display name styles',
        body: 'Nicknames have the least filtering in Discord, so bubble and framed styles are safe to use here.',
        styles: ['handle-wrap', 'cute-bubble', 'circled', 'story-title', 'soft-bio', 'bio-hearts'],
      },
      {
        h2: 'Server, channel and role name lettering',
        body: 'Server and channel names are shorter and filtered. Bold, small caps and fullwidth survive best.',
        styles: ['bold', 'small-caps', 'fullwidth', 'bold-fraktur', 'shout-caps'],
      },
      {
        h2: 'Status and About Me text',
        body: 'Status lines have room for decoration, so kaomoji frames and emoji frames both work well.',
        styles: ['kaomoji-shrug', 'kaomoji-heart', 'emoji-frame-heart', 'emoji-frame-fire', 'sparkle-sparkle'],
      },
    ],
    faq: [
      {
        q: 'Does Discord allow fancy text in nicknames?',
        a: 'Yes. Discord accepts Unicode letters and most symbol characters in display nicknames, and they render in chat alongside the message. Profile usernames are a separate, much stricter field and accept almost none of these characters.',
      },
      {
        q: 'Why do my Discord letters look different on mobile?',
        a: 'The characters are identical, but each platform ships a different font. Desktop, the web client and mobile bundle different font sets, so a style that renders correctly on one may show a fallback glyph on another.',
      },
      {
        q: 'Can I use these fonts in Discord without a bot?',
        a: 'Yes. This generator runs in your browser and needs no bot, token or extension. Copy the output and paste it into the Discord field you want to change.',
      },
    ],
    links: [
      { href: '/fonts/clan-tag', label: 'Clan Tag' },
      { href: '/fonts/gg-frame', label: 'GG Frame' },
      { href: '/kaomoji', label: 'Kaomoji library' },
      { href: '/fonts/cute-bubble', label: 'Cute Bubble' },
    ],
    variationSection: { h2: 'Explore Discord text styles', key: 'discord', subject: 'Discord' },
  },

  {
    key: 'gaming',
    subject: 'Gaming',
    title: 'Gaming Fancy Text Generator',
    description: 'Fancy text for gamer tags, clan names and guild titles. Bold, gothic, glitch and framed styles for Free Fire, PUBG, Roblox, Minecraft and more.',
    h1: 'Gaming fancy text generator',
    intro: [
      'Game names and clan tags are short, heavily filtered and rendered by the game client rather than the operating system, so they need styles that survive aggressive input handling. This generator gives you the ones that tend to hold up.',
      'Type your tag above, pick a style and copy it into the game. Every style is generated by the same engine that powers the main generator, so the output matches exactly.',
      'Each game filters characters differently and none of them document their rules. We do not publish per-game limits we cannot verify; test your tag in the game before committing a rare name to it.',
    ],
    sections: [
      {
        h2: 'Gamer tag and player name styles',
        body: 'Short letter swaps and symbol wraps survive name filters most often. Keep tags under 12 characters where the game allows it.',
        styles: ['clan-tag', 'console', 'handle-wrap', 'bold', 'sans-bold', 'fullwidth'],
      },
      {
        h2: 'Clan, guild and squad name lettering',
        body: 'Clan and guild names are usually less filtered than player handles, so framed and gothic styles work well.',
        styles: ['gg-frame', 'boss-mode', 'frag-line', 'respawn', 'fraktur', 'bold-fraktur'],
      },
      {
        h2: 'Lobby titles and status line text',
        body: 'Status lines and lobby titles take longer strings, which gives glitch and layered styles room to show properly.',
        styles: ['shout-caps', 'zalgo-light', 'glitch-alternate', 'zalgo-medium', 'stars-frame', 'health-bar'],
      },
    ],
    faq: [
      {
        q: 'Which fancy text works for Free Fire, PUBG and BGMI names?',
        a: 'Letter-swap styles such as bold, gothic and fullwidth are the safest bet because they keep the character count close to the original. Emoji and heavy combining-mark styles are frequently stripped by mobile game name filters.',
      },
      {
        q: 'Is there a character limit for game usernames?',
        a: 'No limit checked. Game name limits change per title and per region, and none are documented in a way we can verify, so we do not publish numbers. Count your characters in the generator and check the length directly in the game.',
      },
      {
        q: 'Will glitch and zalgo text render inside a game?',
        a: 'Sometimes. Zalgo and glitch styles stack combining marks, and games that filter or normalise text input often flatten them into plain letters. Test in a private or low-stakes name first.',
      },
    ],
    links: [
      { href: '/fonts/clan-tag', label: 'Clan Tag' },
      { href: '/fonts/gg-frame', label: 'GG Frame' },
      { href: '/fonts/respawn', label: 'Respawn Text' },
      { href: '/fonts/shout-caps', label: 'Shout Caps' },
    ],
    variationSection: { h2: 'Explore gaming text styles', key: 'gaming', subject: 'Gaming' },
  },

  {
    key: 'languages',
    subject: 'Script compatibility',
    title: 'Fancy Text and Non-Latin Scripts: What Works',
    description: 'Honest answers on fancy text for Hindi, Urdu, Arabic and Tamil: which characters survive, why glyphs go missing, and what this generator does not do.',
    h1: 'Fancy text and non-Latin scripts',
    intro: [
      'Our styles map Latin letters onto look-alike Unicode characters such as Mathematical Bold or Fraktur. That mapping only exists for Latin letters, so applying a style to Hindi, Urdu or Arabic text leaves those characters untouched and changes nothing.',
      'We could ship alphabets for other scripts, but they would have to be genuine Unicode letters rather than look-alikes, which means no decorative result. This page explains what the generator does with non-Latin input and where the limits are.',
      'This is an information page, not a generator. Use the main generator for Latin text and treat this page as the compatibility reference for everything else.',
    ],
    sections: [
      {
        h2: 'How Unicode letter styling actually works',
        body: 'Every style in this generator is a character substitution table. Latin letters are swapped for their styled counterparts; any other character is passed through untouched. That is why mixed text keeps its original non-Latin characters.',
        styles: ['bold', 'italic', 'script'],
      },
      {
        h2: 'Why characters turn into boxes or question marks',
        body: 'Missing glyphs happen when the font rendering the text has no character for a code point. Mobile keyboards, older Android builds and some in-game clients ship narrower font sets than desktop browsers, so the same string can render in one place and break in another.',
        styles: ['bold', 'double-struck'],
      },
      {
        h2: 'Scripts this generator does not restyle',
        body: 'Hindi, Urdu, Arabic, Bengali, Tamil, Telugu and the other scripts in the list above all pass through unchanged. Symbols, kaomoji and emoji wrapping still apply because those do not depend on Latin letter mapping.',
        styles: ['symbol-star', 'kaomoji-heart', 'emoji-frame-heart'],
      },
    ],
    faq: [
      {
        q: 'Can this generator make fancy Hindi, Urdu or Arabic text?',
        a: 'No. The styles are built from Latin look-alike characters, so Devanagari, Nastaliq and Arabic letters are copied through unchanged. We would rather say that plainly than ship a generator that quietly does nothing.',
      },
      {
        q: 'Why do some letters show as empty boxes after I paste my text elsewhere?',
        a: 'The receiving app is missing a font for that character. Support for a Unicode code point varies by operating system, app and device, and an older font set simply has no glyph to draw, so it shows a placeholder box instead.',
      },
      {
        q: 'Does the generator send my text anywhere?',
        a: 'No. Text is styled in your browser with a small local script and is never transmitted or stored. You can disconnect from the network and the page keeps working.',
      },
    ],
    links: [
      { href: '/fonts/bold', label: 'Bold' },
      { href: '/symbols', label: 'Symbols library' },
      { href: '/about', label: 'How styles work' },
    ],
    variationSection: { h2: 'Explore script compatibility searches', key: 'languages', subject: 'Unicode' },
  },

  {
    key: 'colours',
    subject: 'Colour display',
    title: 'Coloured Fancy Text: Why Plain Text Has No Colour',
    description: 'Can plain text force a font colour? No. Here is what coloured Unicode text can and cannot do, how emoji colour differs, and what to use instead.',
    h1: 'Coloured fancy text and how display actually works',
    intro: [
      'Searching for blue, gold or rainbow fancy text usually means wanting coloured letters. Plain Unicode text cannot do that: the characters carry no colour information, so whatever colour you see is simply the colour of the font drawing them.',
      'A few characters do bring their own colour, mainly emoji, which are rendered as small colour images by the app. Everything else is monochrome and takes the surrounding text colour.',
      'So there is no colour generator here, and we will not ship one that renders coloured text you cannot copy. This page explains the actual rules instead.',
    ],
    sections: [
      {
        h2: 'Why Unicode text cannot carry a font colour',
        body: 'Unicode encodes characters, not presentation. A styled letter carries its code point and nothing else, so it inherits the colour of the surrounding text or the app default.',
        styles: ['bold', 'italic'],
      },
      {
        h2: 'Where colour does come from',
        body: 'Emoji carry built-in colour because apps render them as colour glyphs. Symbols and kaomoji are drawn from a font and stay the same colour as the text around them.',
        styles: ['emoji-frame-heart', 'kaomoji-heart', 'symbol-heart'],
      },
      {
        h2: 'If you genuinely need coloured text',
        body: 'Colour requires a font file, an image, or an app that supports rich text. For static platforms the honest options are a coloured image or an app with its own text-colour controls.',
        styles: ['fullwidth', 'small-caps'],
      },
    ],
    faq: [
      {
        q: 'Is there a fancy text generator with blue or rainbow letters?',
        a: 'Not as plain text, and any site claiming otherwise is showing you something you cannot copy. Unicode characters carry no colour, so styled letters are always drawn in the colour of the surrounding text.',
      },
      {
        q: 'Which characters do bring their own colour?',
        a: 'Emoji, mostly. Apps render them as colour glyphs rather than as text, which is why an emoji frame looks colourful while the letters inside it stay the same colour as the rest of the line.',
      },
      {
        q: 'Why does my coloured text look different in another app?',
        a: 'The app decides the colour. Platforms that support rich text, such as some chat and document apps, will render whatever colour formatting they are given, while plain-text fields force everything to a single colour.',
      },
    ],
    links: [
      { href: '/emoji', label: 'Emoji library' },
      { href: '/symbols', label: 'Symbols library' },
      { href: '/fonts/symbol-heart', label: 'Heart Wrap' },
    ],
    variationSection: { h2: 'Explore colour display questions', key: 'colours', subject: 'Colour' },
  },
];

export const LANDING_PAGE_KEYS = LANDING_PAGES.map((p) => p.key);

export const getLandingPage = (key) => LANDING_PAGES.find((p) => p.key === key) || null;

/** Sibling links for the "more like this" nav, capped so pages never sprawl. */
export function siblings(key, n = 3) {
  return LANDING_PAGES.filter((p) => p.key !== key).slice(0, n);
}