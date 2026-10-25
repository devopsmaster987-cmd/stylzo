// Category hub content.
//
// Each entry powers /fonts/category/<key>: a real page that links every
// indexable style in one category. The copy is written per category rather than
// generated from a single template, because the category name alone is not a
// reason for a page to exist. Facts come from the catalog and from the Unicode
// behaviour the rest of the site already explains; no feature is invented.
//
// `paragraphs` render before the style list, `faq` renders after it, and the
// style examples on the page are produced by the same engine as the generator.

import { CATEGORY_KEYS } from './category-keys.js';

export const CATEGORY_CONTENT = {
  bold: {
    title: 'Bold Text Styles — Copy and Paste',
    description: 'Browse bold Unicode styles for names, bios and headings. See how each weight renders, what it replaces, and how to copy it without installing a font.',
    h1: 'Bold text styles',
    paragraphs: [
      'Bold text here is not a font weight. Each letter is replaced with a heavier-looking character from the Mathematical Alphanumeric Symbols block, so the result is ordinary text that keeps its weight when it is pasted into a field with no formatting controls.',
      'That difference matters for a display name or a short heading. A real bold font changes how the letters are drawn; a bold Unicode style changes which characters are stored. The second survives copy and paste, but it also depends on the receiving app having a glyph for every character used.',
    ],
    useCases: ['Display names and nicknames', 'Short headings in plain-text profiles', 'One emphasised word in a caption'],
    faq: [
      {
        q: 'Is bold Unicode text the same as applying bold formatting?',
        a: 'No. Formatting is a property of rich text, while this replaces each letter with a different Unicode character. That is why it copies into a plain-text field, and why a screen reader reads a different character rather than announcing bold.',
      },
      {
        q: 'Which bold style is safest to paste?',
        a: 'The plain mathematical bold style is the safest of the group because its characters are widely shipped in system fonts. The italic, script and fraktur variants use less common ranges, so they are more likely to fall back to a box on old devices.',
      },
      {
        q: 'Can I use bold Unicode text in a username?',
        a: 'Only where the platform accepts those characters. Many username fields restrict input to a small character set and will strip or reject the styled letters. Test the exact field first and keep the name short.',
      },
    ],
  },

  italic: {
    title: 'Italic Text Styles — Copy and Paste',
    description: 'Italic and slanted Unicode text for bios, quotes and captions. Compare the styles, check support, and copy a result that works without installing a font.',
    h1: 'Italic text styles',
    paragraphs: [
      'Italic styling on this site is a character substitution, not a font style. A slanted Unicode letter can be pasted into chat, a bio or a comment box that offers no italic button, and it keeps its slant because the slant is part of the character itself.',
      'The trade-off is legibility and support. Slanted mathematical letters are common enough to render almost everywhere, but some apps treat them as decorative characters and may not read them as the same word during search. Use them for display text rather than for anything that must be searchable.',
    ],
    useCases: ['Quotes and attributions', 'A softer display name', 'Titles in a plain-text list'],
    faq: [
      {
        q: 'What is the difference between italic text and slanted text?',
        a: 'A real italic is a designed font whose letters may have different shapes. The styles here use Unicode characters that already look slanted. The result needs no font installed, but it is not the same thing as app-level italic formatting.',
      },
      {
        q: 'Will italic Unicode text still be selectable?',
        a: 'Yes. The characters are ordinary text, so they can be selected, copied and edited. Whether another person can search for the plain word depends on the app, because the underlying characters are not the original Latin letters.',
      },
      {
        q: 'Why do some apps turn italic text into boxes?',
        a: 'The app does not have a glyph for that Unicode range in its font. The characters are valid, but the renderer has nothing to draw. Plain mathematical italic is more widely supported than the script or double-struck variants.',
      },
    ],
  },

  cursive: {
    title: 'Cursive Text Styles — Copy and Paste',
    description: 'Cursive and script Unicode styles for signatures, names and invitations. Preview the lettering, check app support, and copy the result in one tap.',
    h1: 'Cursive text styles',
    paragraphs: [
      'Cursive styles use script-like Unicode alphabets, so a name can look handwritten even in a field that only accepts plain text. They are popular for signatures, short greetings and profile names where the shape of the letters is the point.',
      'Script characters are decorative and less universally supported than plain bold or italic. A long cursive sentence also becomes harder to read, especially at small sizes, so these styles work best on two or three words. Test the result in the app you plan to use before saving it to a name you cannot change easily.',
    ],
    useCases: ['Sign-offs and signatures', 'Names on invitations', 'Short decorative profile text'],
    faq: [
      {
        q: 'Are these cursive styles real fonts?',
        a: 'No. They are Unicode characters that look like cursive letters. Nothing is installed, and the text can be copied into any field that accepts plain text, subject to the receiving app having the right glyphs.',
      },
      {
        q: 'Why does cursive text sometimes look plain after pasting?',
        a: 'The destination app may normalise or strip characters it does not recognise. Some profile fields also apply their own font, which replaces the look of the characters without changing the text. If the shape matters, use an image instead.',
      },
      {
        q: 'How many words should I style in cursive?',
        a: 'Two or three is usually enough. Cursive letterforms are harder to scan in long strings, and several script ranges include gaps where a letter falls back to an ordinary shape, which breaks the handwritten effect.',
      },
    ],
  },

  gothic: {
    title: 'Gothic Text Styles — Copy and Paste',
    description: 'Blackletter and gothic Unicode styles for usernames, band references and dramatic headings. Compare the weights and copy the one that survives your app.',
    h1: 'Gothic text styles',
    paragraphs: [
      'Gothic text on this site means blackletter-style Unicode, the heavy medieval letterforms often called Old English. It is a strong visual choice for a short name, a title or a music reference, and it needs no font file to travel with the text.',
      'Blackletter is less readable than a plain sans or serif at small sizes, and some of the bold variants use characters that older phones do not include. The safest approach is to use it for a display line, preview it at the size it will actually appear, and keep a plain fallback for anything important.',
    ],
    useCases: ['Band and album references', 'Dramatic short headings', 'Gaming or role-play identities'],
    faq: [
      {
        q: 'What does gothic mean in this context?',
        a: 'It refers to blackletter-style Unicode letters, not to the Goth subculture and not to a gothic font file. The shapes resemble Old English and fraktur lettering, which is why the styles are often searched for under those names.',
      },
      {
        q: 'Is gothic Unicode text easy to read?',
        a: 'At a large size, yes. At caption or username size it can be harder than ordinary text, especially the bold and heavily decorated variants. Short words and high contrast backgrounds help more than any style setting.',
      },
      {
        q: 'Do gothic styles work in every app?',
        a: 'No. Mathematical fraktur characters are fairly common, but bold fraktur and rarer symbol variants are not. Apps with a narrow font or strict input filter may flatten them or show boxes. Check the exact app before relying on the result.',
      },
    ],
  },

  outline: {
    title: 'Outline Text Styles — Copy and Paste',
    description: 'Outline and hollow Unicode lettering for headings, posters and profile names. See the style, check its support level, and copy it without installing a font.',
    h1: 'Outline text styles',
    paragraphs: [
      'Outline text is made from hollow-looking Unicode characters, most often the double-struck alphabet used in mathematics. The letters keep their shape but lose their filled interior, which gives a lighter look than bold without becoming thin or decorative.',
      'There is only one outline style in the current indexable catalog, so the main decision is whether the destination app supports the characters at all. Double-struck letters are reasonably common, but they can still be replaced by an ordinary font when an app normalises input. Use them where the visual difference is visible, not in a field that will strip it.',
    ],
    useCases: ['A lighter alternative to bold', 'Headings over a dark background', 'Names that need a technical or mathematical look'],
    faq: [
      {
        q: 'Is outline text a font I need to install?',
        a: 'No. It is a set of Unicode characters that happen to look hollow. The text copies like any other plain text, and the receiving device decides whether it has a glyph for each character.',
      },
      {
        q: 'Why is there only one outline style?',
        a: 'The catalog has one distinct outlined alphabet that is widely supported. Other decorated shapes exist, but they are grouped under bubble, symbols or decorated styles rather than being duplicate outline pages with the same result.',
      },
      {
        q: 'Where does outline text look best?',
        a: 'It works best in a short heading, a poster line or a display name where the hollow shape is visible. At small sizes the gap inside each letter can disappear, so it reads like ordinary text with uneven spacing.',
      },
    ],
  },

  clean: {
    title: 'Clean Text Styles — Copy and Paste',
    description: 'Clean sans-serif and monospace Unicode styles for readable names, labels and technical text. Compare the plain-looking options and copy them safely.',
    h1: 'Clean text styles',
    paragraphs: [
      'Clean styles are the quiet end of the catalog. They use sans-serif and monospace Unicode alphabets that look close to ordinary text, so they can change the tone of a name or label without turning it into decoration.',
      'These are also the most forgiving styles to paste, because their characters are close to the ones a device already displays. That does not make them identical to plain text: the underlying code points still differ, which is why a search for the original word may not find the styled version. Use them when readability matters more than the effect.',
    ],
    useCases: ['Long display names that must stay readable', 'Technical labels and handles', 'A subtle change from default text'],
    faq: [
      {
        q: 'What makes a text style clean?',
        a: 'It uses a plain letterform rather than heavy decoration. Sans-serif and monospace Unicode alphabets keep the character count close to the original and stay legible at small sizes, which is what most people mean by clean.',
      },
      {
        q: 'Is clean Unicode text the same as normal text?',
        a: 'Visually it can be close, but the characters are different code points. That matters for search, sorting and screen readers. If you need the exact original word to remain searchable, use ordinary text instead.',
      },
      {
        q: 'Which clean style has the widest support?',
        a: 'The sans-serif and monospace mathematical alphabets are widely supported in modern system fonts. Even so, check the destination app if the name is important, because some fields normalise input before saving it.',
      },
    ],
  },

  wide: {
    title: 'Wide Text Styles — Copy and Paste',
    description: 'Fullwidth and wide Unicode styles for banners, menus and spaced-out headings. See how the width changes, check support, and copy the result.',
    h1: 'Wide text styles',
    paragraphs: [
      'Wide styles use fullwidth Unicode forms, the same letter shapes used in East Asian typography. Each character occupies more horizontal space, which makes a short word read like a banner or a spaced-out title without adding literal spaces between letters.',
      'The effect is visual rather than semantic. Fullwidth letters are ordinary characters, but they are not the same as the Latin letters they resemble, so searching for the original word may fail. They also take up more room, which matters in a username or a field with a tight character limit.',
    ],
    useCases: ['Banners and short headings', 'Menus and section labels', 'An aesthetic or vaporwave look'],
    faq: [
      {
        q: 'What is fullwidth text?',
        a: 'It is a Unicode form in which Latin letters and some punctuation are drawn at the width of a CJK character. The style is called wide or fullwidth because each character takes more horizontal space than its ordinary counterpart.',
      },
      {
        q: 'Does wide text count as more characters?',
        a: 'Each fullwidth letter is one Unicode code point, just like a normal letter, but it may look wider. Character counters can still treat it as one character, while a platform that measures display width may need more room for it.',
      },
      {
        q: 'Will fullwidth text work in a username?',
        a: 'Sometimes, but usernames are among the most restricted fields. Some platforms accept fullwidth letters, while others normalise them back to ordinary letters or reject them. Test the exact field before committing to a name.',
      },
    ],
  },

  bubble: {
    title: 'Bubble Text Styles — Copy and Paste',
    description: 'Bubble, circled, squared and boxed Unicode styles for playful names and captions. Compare the shapes, check app support, and copy a result.',
    h1: 'Bubble and boxed text styles',
    paragraphs: [
      'Bubble styles wrap each letter in a circle, a square or a parenthesis, or replace it with a letter that already has one of those shapes. They are playful and highly visible, which makes them a good fit for a nickname or a short celebratory line.',
      'The decoration is part of each character, so the text stays copyable, but it also makes the result longer and less predictable across apps. Circled letters are common; squared, negative and parenthesized forms are less so. Preview the exact style in the destination app, especially if it is a game or a field with a strict filter.',
    ],
    useCases: ['Playful nicknames', 'Party and birthday messages', 'Short group-chat labels'],
    faq: [
      {
        q: 'What is bubble text?',
        a: 'It is a family of Unicode styles whose letters are enclosed in a circle or a similar rounded shape, or replaced by characters that already look enclosed. The effect is decorative rather than a font you install.',
      },
      {
        q: 'Why do some circled letters look different from the rest?',
        a: 'Unicode does not provide a circled form for every Latin letter in the same range. When a character is missing, the catalog substitutes a nearby shape or leaves the plain letter, which can make a word look uneven.',
      },
      {
        q: 'Are bubble styles safe for usernames?',
        a: 'Less safe than plain letter swaps. The enclosed characters are less common in system fonts and are often filtered by username fields. Keep a plain version of the name ready in case the platform rejects the styled one.',
      },
    ],
  },

  small: {
    title: 'Small Text Styles — Copy and Paste',
    description: 'Small caps, superscript and subscript Unicode styles for compact labels, footnotes and tiny text. Compare the options and copy one that renders in your app.',
    h1: 'Small and tiny text styles',
    paragraphs: [
      'Small text styles make letters look smaller or place them above or below the baseline. Small caps use a dedicated Unicode alphabet, while superscript and subscript use raised or lowered characters originally intended for mathematical notation and footnotes.',
      'These styles are useful when you need a compact label or a footnote-like effect, but Unicode does not cover every letter in every position. A word may contain a mixture of tiny and ordinary characters, which is why the examples matter more here than on a plain letter swap. Check the result before using it in a name.',
    ],
    useCases: ['Footnotes and aside text', 'Compact labels in a bio', 'Mathematical or technical notation'],
    faq: [
      {
        q: 'Why are some letters in superscript still full size?',
        a: 'Unicode only defines raised forms for a limited set of letters, digits and symbols. Letters outside that set stay in their ordinary form, so a word can mix small and full-size characters.',
      },
      {
        q: 'Does small caps text count as uppercase?',
        a: 'Visually it resembles uppercase letters at a smaller size, but it is a separate Unicode alphabet. Copying it into a case-sensitive system will not turn it into ordinary capital letters.',
      },
      {
        q: 'Where should I avoid tiny text?',
        a: 'Avoid it in anything that has to be read quickly or at a distance, and in fields that need to be searchable. Tiny characters are harder to read on small screens, and some apps render the raised and lowered forms poorly.',
      },
    ],
  },

  lines: {
    title: 'Line Mark Text Styles — Underline, Strike and More',
    description: 'Underline, strikethrough, wavy, dotted and double-line Unicode styles. Compare 26 mark styles, see how they render, and copy the one you need.',
    h1: 'Underline and line mark styles',
    paragraphs: [
      'Line styles add a mark above, below or through ordinary letters using Unicode combining characters. Underline and strikethrough are the familiar ones, but the catalog also includes dotted, dashed, wavy, double and arrow-shaped marks, each with a different visual weight.',
      'These are modifiers rather than complete alphabets. Applied alone they underline plain text; combined with a base letter style they produce a stronger effect. Combining marks are the least consistently rendered characters on the site, so a line that looks clean on one device may sit too high, too low or disappear on another.',
    ],
    useCases: ['Marking a name or heading', 'Showing an old price or a correction', 'A quiet divider in a plain-text layout'],
    faq: [
      {
        q: 'How does underlined Unicode text work?',
        a: 'A combining underline character is placed after each letter. The renderer draws the mark beneath the preceding character. Because the mark is a separate code point, the text remains copyable, but its position depends on the app and font.',
      },
      {
        q: 'Why does the line sit in the wrong place?',
        a: 'Combining marks are positioned by the font and the text layout engine. Different devices use different fonts and may stack or shift the mark. There is no way to control the exact offset from plain text.',
      },
      {
        q: 'Should I use a line style in a username?',
        a: 'Usually not. Many username fields either strip combining marks or count them as extra characters, and the result can look broken. Use a line style for display text where you can see the final rendering.',
      },
    ],
  },

  flip: {
    title: 'Flipped and Reversed Text Styles — Copy and Paste',
    description: 'Upside-down, backwards and mirrored Unicode text for puzzles, jokes and captions. See the real output and copy a style that renders on your device.',
    h1: 'Flipped and reversed text styles',
    paragraphs: [
      'Flip styles change the order or orientation of the characters rather than their shape alone. An upside-down result usually pairs rotated Unicode letters with reversed character order, while a backwards style mirrors the sequence without rotating each glyph.',
      'The result is meant to be read as a visual joke, not as normal text. Search engines, screen readers and most input fields will not treat it as the original word, and some rotated characters are missing from the font, so the line can contain ordinary fallbacks. Keep it short and preview it where it will appear.',
    ],
    useCases: ['Jokes and puzzles', 'A reveal in a video or post', 'A deliberately unreadable signature'],
    faq: [
      {
        q: 'How do you make text upside down?',
        a: 'Each letter is replaced by a rotated or inverted Unicode character and the character order is reversed, so the line reads correctly when the screen is turned over. Not every letter has a rotated counterpart, so some characters stay ordinary.',
      },
      {
        q: 'Is flipped text readable by search engines?',
        a: 'No. The underlying characters are different, so a search for the plain word will not normally match a flipped version. Treat it as decoration rather than as content you need indexed or searchable.',
      },
      {
        q: 'Why does flipped text look uneven?',
        a: 'The rotated characters come from different Unicode ranges and are not designed as a matching font. Their size, baseline and spacing can differ, and missing characters fall back to normal letters.',
      },
    ],
  },

  glitch: {
    title: 'Glitch Text Styles — Copy and Paste',
    description: 'Glitch and Zalgo Unicode styles for gaming names, horror titles and corrupted-looking text. Compare intensities and copy a result with a clear support warning.',
    h1: 'Glitch text styles',
    paragraphs: [
      'Glitch styles stack combining marks above and below letters, or alternate cases and strike characters, to create a corrupted or unstable look. The underlying word usually stays readable, which is why the effect works for a display name or a short title.',
      'This is also the least predictable group on the site. Combining marks depend on the font, the operating system and the app, and heavy stacks can overflow a line, slow down a chat client or be stripped entirely by an input filter. Start with a light intensity and keep the string short.',
    ],
    useCases: ['Gaming display names', 'Horror or cyberpunk headings', 'A corrupted-looking status line'],
    faq: [
      {
        q: 'What is Zalgo text?',
        a: 'Zalgo is a style that adds many combining marks around each letter. It is not a separate font; it is ordinary text with extra Unicode marks attached. The result looks glitched because the marks stack above and below the character.',
      },
      {
        q: 'Is glitch text safe to paste everywhere?',
        a: 'No. Some apps strip combining marks, some render them far outside the line, and a few treat a long stack as spam or malformed input. Use it in a field you control or can preview, and avoid it in important messages.',
      },
      {
        q: 'Why does glitch text make a chat lag?',
        a: 'Every mark is another character the app has to position. A long line with hundreds of marks can be expensive to render, especially on a phone. Keeping the text short avoids most of that cost.',
      },
    ],
  },

  decorated: {
    title: 'Decorated Text Styles — Copy and Paste',
    description: 'Decorative Unicode text with frames, symbols and case effects for greetings and captions. Compare the styles and copy one that suits the occasion.',
    h1: 'Decorated text styles',
    paragraphs: [
      'Decorated styles add something around the words rather than replacing the letters outright. A frame, a symbol, a repeated mark or a case pattern can change the tone of a short line while keeping the original word recognisable.',
      'Because the decoration is added as characters, the result is longer than the plain text. That is fine in a caption or a greeting, but it can break a character limit or a username field. Use these styles where the decoration has room to show and where the destination accepts the extra symbols.',
    ],
    useCases: ['Birthday and celebration messages', 'A decorated caption or greeting', 'A playful group-chat line'],
    faq: [
      {
        q: 'What counts as a decorated text style?',
        a: 'A style that keeps the letters and adds symbols, frames, separators or a case pattern around them. It is different from a letter swap, where the shape of each character changes.',
      },
      {
        q: 'Why is decorated text longer than my input?',
        a: 'The decoration is made of extra characters. A frame adds at least one symbol at each end, and some styles add more. That extra length can matter in a field with a strict limit.',
      },
      {
        q: 'Will the decoration render on every device?',
        a: 'Not necessarily. Common punctuation and mathematical symbols are widely supported, but rarer decorative characters may be missing from older fonts. Preview the exact line before using it somewhere important.',
      },
    ],
  },

  symbols: {
    title: 'Symbol Text Styles — Copy and Paste',
    description: 'Wrap names and captions in Unicode stars, hearts, arrows and separators. Compare symbol styles, check support, and copy a decorated result.',
    h1: 'Symbol text styles',
    paragraphs: [
      'Symbol styles keep the letters intact and surround them with Unicode marks such as stars, hearts, arrows, bullets or separators. They are useful when the letters should stay readable but the line still needs a visual marker.',
      'Most of the symbols used here are common enough to render in modern fonts, but support is not universal. The decorative characters add length, and some apps treat them as emoji or strip them from restricted fields. A short phrase with one symbol at each end is the most reliable shape.',
    ],
    useCases: ['A marker beside a name', 'Dividers between sections of a bio', 'A short decorative label'],
    faq: [
      {
        q: 'What is the difference between a symbol style and the symbols library?',
        a: 'A style wraps your own text in symbols. The symbols library is a searchable list of individual Unicode symbols to copy on their own. Both use plain text, but they solve different jobs.',
      },
      {
        q: 'Why do some symbols appear as emoji?',
        a: 'A few Unicode characters have both a text presentation and an emoji presentation. The app chooses which one to draw. Adding a variation selector can sometimes force the text form, but not every app honours it.',
      },
      {
        q: 'Are symbol-wrapped names safe for usernames?',
        a: 'Usually not. Username fields often reject punctuation and symbol characters even when they accept ordinary letters. Use symbol wraps in a bio, a caption or a display name where the field allows them.',
      },
    ],
  },

  emoji: {
    title: 'Emoji Text Styles — Copy and Paste',
    description: 'Add emoji frames and sprinkles to names, captions and status lines. Compare the styles, see the real output, and copy a version your app supports.',
    h1: 'Emoji text styles',
    paragraphs: [
      'Emoji styles place colour emoji around your text or between words. They are the most colourful option in the catalog, and unlike letter swaps they usually render as images supplied by the device rather than as glyphs from the surrounding font.',
      'That difference cuts both ways. Emoji are widely supported, but each platform draws them differently, so the exact look is not under the page\'s control. Emoji also count as characters in a limit and can be stripped by fields that allow letters only. Keep the line short and check how the emoji sit beside the styled text.',
    ],
    useCases: ['Celebratory captions', 'A mood marker in a chat', 'A playful status line'],
    faq: [
      {
        q: 'Why do emoji look different on another phone?',
        a: 'Each platform ships its own emoji artwork. The code points are standard, but the picture is drawn by the device. That is why the same emoji can look flat on one system and glossy on another.',
      },
      {
        q: 'Do emoji styles upload or track anything?',
        a: 'No. The emoji are inserted by the same local styling engine. There is no upload and no account, and the text stays in the browser until you copy it somewhere.',
      },
      {
        q: 'Can I use emoji in a username?',
        a: 'Some apps allow it and many do not. A username field may reject emoji, count them differently or remove them on save. Use an emoji style in a caption or display name where the field is more permissive.',
      },
    ],
  },

  kaomoji: {
    title: 'Kaomoji Text Styles — Copy and Paste',
    description: 'Add Japanese-style text faces to your words with kaomoji frames and reactions. Compare the faces, check rendering, and copy one in a tap.',
    h1: 'Kaomoji text styles',
    paragraphs: [
      'Kaomoji are text faces built from ordinary characters and symbols. In this category they are paired with your text, either as a reaction beside it or as a frame around it, so a short line can carry a mood without an image.',
      'Because kaomoji are made of text, they inherit the support of the characters they use. Common brackets, slashes and punctuation render almost everywhere, while rarer marks may not. They are also visually busy, so they work best on a short greeting or a status line rather than a long paragraph.',
    ],
    useCases: ['Reactions in a chat', 'A playful sign-off', 'A status line with a mood'],
    faq: [
      {
        q: 'What is a kaomoji?',
        a: 'A kaomoji is a Japanese-style text emoticon assembled from punctuation, letters and symbols, such as a shrug or a table flip. It is plain text rather than an image or an emoji.',
      },
      {
        q: 'Do kaomoji work on a phone?',
        a: 'Mostly, as long as the phone font includes the characters used. Common kaomoji are built from widely available punctuation, while elaborate ones may contain a symbol that an older device does not render.',
      },
      {
        q: 'Why does a kaomoji look misaligned?',
        a: 'The face is drawn from characters with different widths and baselines. A proportional font can shift the parts relative to each other, so the same kaomoji may look tidy in one app and crooked in another.',
      },
    ],
  },

  gaming: {
    title: 'Gaming Text Styles — Copy and Paste',
    description: 'Clan tags, gamer names and guild titles in bold, gothic, glitch and framed Unicode styles. Compare the options and copy a tag for your game.',
    h1: 'Gaming text styles',
    paragraphs: [
      'Gaming styles are built for short, high-impact names: clan tags, player handles, lobby titles and guild labels. The catalog favours letter swaps and simple frames, because those are the shapes most likely to survive a game client\'s input filter.',
      'No game documents its character rules consistently, and filters differ by title, platform and region. A style that works in one lobby can be rejected in another. Use a short tag, keep a plain version ready, and test in a low-stakes name before committing to a rare one.',
    ],
    useCases: ['Clan and guild tags', 'Player display names', 'Lobby titles and status lines'],
    faq: [
      {
        q: 'Which gaming styles are most likely to work?',
        a: 'Short letter swaps such as bold, italic, small caps and fullwidth are the most reliable, because they stay close to the original character count. Heavy glitch stacks and rare symbols are more likely to be filtered.',
      },
      {
        q: 'Is there a character limit for game names?',
        a: 'There is no single limit. It varies by game, platform and region, and most titles do not publish a stable number. Count your characters in the generator and test the name in the game itself.',
      },
      {
        q: 'Why was my gamer tag rejected?',
        a: 'The game may allow only a narrow character set, may count styled characters differently, or may reject a name that resembles another player. Try a shorter, simpler style and keep the plain version as a fallback.',
      },
    ],
  },

  social: {
    title: 'Social Profile Text Styles — Copy and Paste',
    description: 'Bio-ready Unicode styles for profiles, captions and highlight labels. Compare hearts, frames and clean lettering, then copy a result that fits the field.',
    h1: 'Social profile text styles',
    paragraphs: [
      'Social styles are chosen for profile fields rather than long messages: a name, a bio line, a caption or a small highlight label. They tend to use hearts, stars, frames and clean letter swaps, because those shapes read quickly in a feed.',
      'The field matters more than the style. A bio usually accepts a wider character set than a username, and a caption has more room than a display name. Before saving, check the character limit and preview the line at phone size, where the decoration is easiest to lose.',
    ],
    useCases: ['Profile names and bio lines', 'Caption highlights', 'Short promotional labels'],
    faq: [
      {
        q: 'Which styles work best in a social bio?',
        a: 'Clean letter swaps, small caps and simple heart or star frames are the safest. They stay readable at a glance and add fewer characters than a heavy frame or a long emoji sequence.',
      },
      {
        q: 'Why does my bio style disappear after saving?',
        a: 'The platform may normalise the characters, strip the ones it does not allow, or apply its own font to the field. If the profile field flattens styled text, an image is the only reliable way to keep the look.',
      },
      {
        q: 'Should I use the same style everywhere?',
        a: 'Not necessarily. A style that suits a caption may be too busy for a username, and a username field may reject it entirely. Pick the style after checking the field, not before.',
      },
    ],
  },
};

export function categoryContent(key) {
  return CATEGORY_CONTENT[key] || null;
}

export function categoryKeys() {
  return CATEGORY_KEYS.filter((key) => Boolean(CATEGORY_CONTENT[key]));
}
