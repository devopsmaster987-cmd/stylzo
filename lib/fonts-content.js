export const FONTS_SUPPORT = {
  h2: 'Which font styles work almost everywhere?',
  intro: 'The label beside each style is a practical estimate of glyph coverage. It says how likely the characters are to appear on a typical phone or desktop, not whether a particular app will accept them in a given field.',
  columns: ['Label', 'What it means', 'Examples'],
  rows: [
    {
      key: 'safe',
      meaning: 'Built from everyday Latin, mathematical and punctuation characters. These are the closest thing to a safe default.',
      examples: 'Bold, italic, sans, small caps, underline',
    },
    {
      key: 'good',
      meaning: 'Common enough to work in most modern apps, but an older device or a stripped-down client may miss a glyph.',
      examples: 'Cursive, gothic, bubble, fullwidth, framed lines',
    },
    {
      key: 'limited',
      meaning: 'Uses rarer symbols or heavy combining marks. Test the exact string in the destination before relying on it.',
      examples: 'Extreme glitch, filled bubble, subscript, arrow underline',
    },
  ],
  fieldHeading: 'Why a style can render but still be rejected',
  fieldBody: 'Rendering and validation are separate checks. A phone may draw every character in a bold Unicode name while the username field still refuses it, because that field accepts only ASCII letters, numbers and a few punctuation marks. The same split appears in email fields, passwords and some game clients: the font has the glyph, but the form has a narrower rule.',
  fallbackHeading: 'What to do when a style fails',
  fallbackBody: 'Try a plainer letter swap first, then remove any frame or combining mark. If the field still rejects it, use plain text and put the styled version in a caption or image instead. The support label narrows the guesswork, but the field you are actually pasting into is the final test.',
};
