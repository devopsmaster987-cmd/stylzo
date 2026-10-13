// Answer-engine content: the short, direct answers that AI assistants need.
//
// The rule applied throughout: the first sentence answers the question outright,
// before any hedging or context. These strings are rendered as visible page
// copy AND emitted as Question/Answer schema, so the structured data can never
// claim something the visitor cannot read.

/** The one-sentence definition, reused wherever the site is introduced. */
export const WHAT_IT_IS =
  'Stylzo is a free text generator that converts plain text into styled text by '
  + 'replacing each letter with a look-alike Unicode character, so the result can be pasted '
  + 'into any app that accepts plain text without installing a font.';

/** Why the result breaks, which is the single most common support question. */
export const WHY_BOXES =
  'Styled text is made of Unicode characters rather than a font, so it only displays correctly '
  + 'in apps whose fonts include a glyph for each character used. Where a glyph is missing, the '
  + 'app draws an empty box or substitutes a different character.';

/**
 * The home page's answer-first pair. Held as one constant because it is rendered
 * as visible copy and emitted as a Question node, and a Question whose wording
 * differs from the heading a crawler reads is schema the page does not show.
 */
export const HOME_ANSWER = {
  q: 'What is this site and what does it do?',
  a: WHAT_IT_IS,
};

/** The same pairing for /tools, whose visible block listed the tools inline. */
export const TOOLS_ANSWER = {
  q: 'What text tools does this page include?',
  a: 'A word and character counter, a case converter (upper, lower, title, sentence, camel, '
    + 'snake, kebab), a reverse tool for characters, words or both, a slug generator, a find '
    + 'and replace with optional case matching, and line tools that sort, deduplicate, trim, '
    + 'drop blanks or shuffle a list. Everything runs in your browser, so long text is never '
    + 'uploaded.',
};

export const ABOUT_QA = [
  {
    q: 'What is a fancy text generator?',
    a: 'A fancy text generator converts ordinary text into styled-looking text. Most of them, '
      + 'including this one, do it by swapping each letter for a look-alike Unicode character '
      + 'rather than by applying a font, which means the result works anywhere plain text is '
      + 'accepted and needs nothing installed.',
  },
  {
    q: 'Is this a free font generator?',
    a: 'Yes. There is no account, no sign-up, no trial and no watermark. The tool runs entirely '
      + 'in your browser and the text you type is never sent to the server.',
  },
  {
    q: 'Why does my fancy text show up as empty boxes?',
    a: WHY_BOXES,
  },
  {
    q: 'Does fancy text work on WhatsApp, Instagram and TikTok?',
    a: 'Usually, because those apps accept the underlying Unicode characters. The one thing to '
      + 'avoid is a style that relies on rarely used symbols, which some apps strip. Each style '
      + 'page states how widely it is supported, and the ones built from everyday mathematical '
      + 'and Latin letters work almost everywhere.',
  },
  {
    q: 'Can I use generated text commercially?',
    a: 'Yes. The output is built from characters in the Unicode standard rather than from a '
      + 'licensed typeface, so there is no font licence attached to what you generate.',
  },
  {
    q: 'How many styles are there?',
    a: 'Over 5,600 generated combinations across 18 categories. One hundred of the most useful '
      + 'styles have their own page with a description and support notes; the rest are reachable '
      + 'from the category filters on the same page.',
  },
];

export const LIBRARY_ANSWER = {
  q: 'Why do copied items sometimes appear as empty boxes?',
  a: WHY_BOXES,
};

export const LIBRARY_QA = {
  symbols: [
    {
      q: 'What are these symbols and who are they for?',
      a: 'They are Unicode symbols you can paste into a bio, caption or message: arrows, stars, '
        + 'hearts, music notes, currency signs and decorative shapes. They are used to decorate '
        + 'plain-text fields where no formatting is available, such as social bios and chat names.',
    },
    {
      q: 'Why do some symbols appear as boxes when I paste them?',
      a: WHY_BOXES,
    },
    {
      q: 'How do I copy a symbol?',
      a: 'Click any symbol and it is copied to your clipboard immediately, with no button to '
        + 'press. Paste it wherever you want it.',
    },
  ],
  emoji: [
    {
      q: 'How do I find a specific emoji?',
      a: 'Use the search box at the top of the page and type a word such as heart, cat or food. '
        + 'The list filters as you type, and clicking any emoji copies it.',
    },
    {
      q: 'Can I copy emoji on a computer?',
      a: 'Yes, on any modern desktop browser. Clicking an emoji copies it to your clipboard and '
        + 'you can paste it into any app that accepts plain text, which is almost all of them.',
    },
    {
      q: 'Are these emoji the same ones my phone has?',
      a: 'Yes. They are the standard Unicode emoji, so they render as your device decides, which '
        + 'is why the same emoji can look slightly different between platforms.',
    },
  ],
  kaomoji: [
    {
      q: 'What is kaomoji?',
      a: 'Kaomoji are text emoticons made from ordinary keyboard characters, such as '
        + '(╯°□°）╯︵ ┻━┻, that read as a face or a mood. They were made for Japanese messaging '
        + 'but are now used anywhere text can be typed.',
    },
    {
      q: 'Why are some kaomoji sideways?',
      a: 'A kaomoji that puts a table over its face, such as (╯°□°）╯︵ ┻━┻, is upside down to '
        + 'show it has thrown the table. It is meant to be typed exactly as written.',
    },
    {
      q: 'Do kaomoji work on a phone?',
      a: 'Yes, as long as your keyboard can type the characters. Most modern phones can, because '
        + 'they are built from standard symbols rather than special ones.',
    },
  ],
};

export const TOOLS_QA = [
  {
    q: 'Is there a free word counter online?',
    a: 'Yes, on this page. The counter gives word, character and sentence counts and updates as '
      + 'you type, entirely in your browser.',
  },
  {
    q: 'Are these text tools free and private?',
    a: 'Yes, and nothing you type leaves your browser. There is no upload, no account and no '
      + 'limit on how much text you can process.',
  },
  {
    q: 'Does a text uppercase converter keep the original text?',
    a: 'Yes. The converters produce a separate result that you copy or download; your input is '
      + 'never modified in place, so you can run the same text through several tools.',
  },
];

export const STUDIO_QA = [
  {
    q: 'How do I turn text into an image?',
    a: 'Type your text, pick a style and a colour scheme on the font studio page, and the '
      + 'preview redraws as you type. Use the download button to save it as a 1200 by 630 PNG.',
  },
  {
    q: 'Do I need an app to make a text image?',
    a: 'No. The image is drawn by your own browser using a canvas, so it works on a phone or a '
      + 'desktop with nothing to install and nothing uploaded.',
  },
  {
    q: 'Is there a watermark on the downloaded image?',
    a: 'No. The PNG is exactly what you see in the preview, with no watermark and no size limit '
      + 'beyond the 1200 by 630 canvas.',
  },
];

export const HOME_QA = [
  {
    q: 'What is the best free fancy text generator?',
    a: 'Stylzo generates over 5,600 text styles with no sign-up, no watermark and no upload, '
      + 'and it runs entirely in your browser. It is the right choice when you need styled text '
      + 'for a bio, caption or nickname and want it to work in any app that accepts plain text.',
  },
  {
    q: 'How do I get fancy text on my phone?',
    a: 'Open this site in your phone browser, type your text into the box and tap copy, then '
      + 'paste it into the app you want. Nothing is installed and no account is needed.',
  },
  {
    q: 'Why does some fancy text not work in a messaging app?',
    a: WHY_BOXES,
  },
];

/**
 * /fonts is a browsable catalogue rather than a generator, so its answer-first
 * block explains what the list contains and how to search it rather than
 * repeating the generator pitch.
 */
export const FONTS_ANSWER = {
  q: 'What are these fancy font styles?',
  a: 'They are text styles built from Unicode characters rather than from a font file. Each '
    + 'letter is swapped for a look-alike character from another script, giving bold, cursive, '
    + 'gothic, bubble, glitch and thousands more, grouped into 18 categories. Because the result '
    + 'is ordinary text, it pastes into any app that accepts plain text with nothing installed.',
};

export const FONTS_QA = [
  {
    q: 'Will every font style look the same in my app?',
    a: 'No, and this is the main thing to check before relying on a style. Unicode support varies '
      + 'by app, device and version: a style built from everyday Latin and mathematical characters '
      + 'usually renders almost everywhere, while one built from rarer symbols may be flattened, '
      + 'stripped or drawn as empty boxes in some apps. Every style here is labelled with how widely '
      + 'it is supported.',
  },
  {
    q: 'How do I find a particular font style?',
    a: 'Type into the search box and the list filters as you type, or scroll through the '
      + 'categories. Opening a style gives it its own page with a working generator, rendered '
      + 'examples and notes on where the style is known to work.',
  },
  {
    q: 'Are these styles real fonts I have to install?',
    a: 'No. There is nothing to download or install. The styles are made of standard Unicode '
      + 'characters, which is why the result survives being pasted into an app that was never '
      + 'designed to display them, and why some apps that lack the glyph show a box instead.',
  },
];

/**
 * /styles, the hub. These passages are the page's own: the answer block, the
 * how-it-works prose and the FAQ are what an assistant can quote when asked
 * what the page is for, and they are what the page's ad is gated on.
 */
export const STYLES_ANSWER = {
  q: 'What does the fancy text styles page show?',
  a: 'It shows the same 25 words rendered in 25 different Unicode styles, so you can see every '
    + 'effect side by side before you choose one. Each word is wrapped in 6 to 8 colour emoji, '
    + 'every line has its own copy button, and typing in the box restyles all 25 rows with your '
    + 'own text. Six guides below go deeper on where the finished text will be pasted.',
};

export const STYLES_QA = [
  {
    q: 'Which of these styles is most likely to work when I paste it somewhere?',
    a: 'The plain letter swaps — bold, italic, small caps, fullwidth and the gothic styles — are '
      + 'the safest, because they use characters almost every device ships a font for. Styles '
      + 'built from rarer symbols, and anything stacking many combining marks, are far more likely '
      + 'to arrive as empty boxes or be stripped by the app you paste into.',
  },
  {
    q: 'Why did my copied fancy text paste as ordinary text?',
    a: 'Either the destination app strips characters it does not recognise, which is common in '
      + 'comment boxes and some profile fields, or you copied the plain word instead of a '
      + 'decorated row. Use the copy button beside the style you want, and if the destination '
      + 'flattens it whatever you pick, the font studio turns styled text into a picture that '
      + 'nothing can strip.',
  },
  {
    q: 'Can I use emoji-wrapped fancy text in an Instagram bio?',
    a: 'Yes, but short is safer. One decorated word usually reads better than several, and long '
      + 'decorated lines are often truncated in bio fields. Remember the text is made of Unicode '
      + 'characters, so it works best in fields that accept plain text rather than ones that '
      + 'expect an image or a link.',
  },
  {
    q: 'Is any of this a font I need to install?',
    a: 'No. The styles are substitution tables that swap letters for look-alike Unicode '
      + 'characters, so the output is ordinary text that pastes anywhere plain text is accepted. '
      + 'That is also why it can break: a receiving app needs its own font to include a glyph for '
      + 'every character used, and where one is missing it draws a box instead.',
  },
];