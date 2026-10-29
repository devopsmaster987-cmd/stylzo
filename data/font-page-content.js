// Editable content for the /fonts/[slug] pages in list B.
//
// Each entry replaces the generated prose on that page. Keep every paragraph
// specific to the style and do not copy a paragraph from another entry.
// Run `node --test tests/unit/font-page-content.test.js` after editing.
//
// TODO: add the remaining 50 list-B font pages in batches 3-7.

export const fontPageContent = {


  'all-lowercase': {
    title: 'All Lowercase Text Converter',
    description: 'All Lowercase removes capital letters from a name, caption or bio line. The result is ordinary lowercase text, so it displays and reads normally.',
    h1: 'All Lowercase Text Converter',
    lede: 'Lowercase-only text is a quiet way to make a name or caption feel less formal.',
    quick: 'Lowercase text uses ordinary letters, so it displays normally; an app that forces capitals is the main place the style is lost.',
    intro:
      'All Lowercase is the simplest style here: it changes capital letters to lowercase and leaves the rest of the text alone. There is no look-alike alphabet and no combining mark. The output is ordinary Unicode text, so it behaves like anything else you type. People use it for a soft, understated bio, a lowercase username, a caption written in a quiet tone, or a line that should not look like a headline. It is also useful when a field automatically capitalises the first letter and you want to see how the text looks without that emphasis. Because the transformation only changes case, the result stays readable, searchable and compatible with almost every app. The one thing it cannot do is preserve a capital that matters, such as the first letter of a name or an acronym. If that capital is part of how the name is written, keep the plain version.',
    where:
      'The conversion uses Unicode lowercase mappings, so an uppercase accented letter keeps its accent and simply loses its capital form. Letters in scripts without case, digits, punctuation and emoji are untouched. There are no missing glyphs to worry about because no character is replaced by a look-alike. The failures are contextual: a name field that title-cases every word, a sentence box that capitalises after a full stop, or a platform that stores handles in lowercase and displays them that way regardless. Initials and acronyms lose information when they are flattened. Search usually treats case insensitively, and a screen reader reads the ordinary letters normally. Keep the style away from names whose capitalisation is part of their identity.',
    examples: ['ALEX RIVERA', 'GOOD VIBES ONLY', 'BERLIN 2026'],
    faqs: [
      {
        q: 'Does All Lowercase change the letters themselves?',
        a: 'No. It only changes the case of letters that have a lowercase form. Accents, numbers, punctuation and emoji are left as they are, so the text remains normal Unicode rather than a look-alike alphabet.',
      },
      {
        q: 'Why does my lowercase text turn back into capitals?',
        a: 'Some apps apply automatic capitalisation to names, sentences or new lines. That setting is part of the app, not the text. Paste the result into the final field and check it after saving; if the app capitalises automatically, the lowercase look cannot be kept there.',
      },
      {
        q: 'Does it change accented letters?',
        a: 'Yes, when the accented letter has a lowercase form. An uppercase É becomes é and Ü becomes ü, while the accent stays in place. Letters in scripts without uppercase and lowercase, and characters such as digits and punctuation, are left unchanged.',
      },
    ],
    related: ['alternating-case', 'all-caps', 'shout-caps', 'sans'],
  },

  'arrow-under': {
    title: 'Arrow Underline Text Generator',
    description: 'Arrow Underline adds a small arrow mark below every letter using a Unicode combining character. Works best on short names and headings; check your app.',
    h1: 'Arrow Underline Text Generator',
    lede: 'A row of tiny arrows under each letter points at the text without changing its shape.',
    quick: 'The letters display on most systems, but the arrow mark can vanish or show an empty box if the app lacks U+034D or drops combining marks.',
    intro:
      'Arrow Underline adds a small left-pointing arrow below each letter. The effect is made with U+034D, a combining mark that attaches to the character before it, so the letters themselves are not replaced. Paired with bold letters, the arrows are easier to see. The result looks like a row of tiny arrows pointing along the word, which suits a handle, a short heading or a label that should catch the eye. Because the output is still text, it can be copied into a bio or a chat message without an image. Arrow Underline is a decorative mark rather than a complete alphabet. Its support is narrower than a Mathematical Bold letter, and the exact position of the arrow depends on the font and the shaping engine. It works best on short lines, where the marks are easy to see and less likely to collide with the line below.',
    where:
      'The mark is added after letters, digits and punctuation, while spaces and emoji are skipped. That means a number, a hyphen or a full stop can carry an arrow too, which is rarely what a short heading needs. The arrow does not change the letter underneath; the font has to place the combining mark under the preceding character. A font without a glyph for U+034D may show a box, and an app that strips combining characters may lose the arrow while keeping the word. Letters with descenders such as g, j, p, q and y can push the arrow into the line below. Narrow letters can make neighbouring arrows overlap. Test the exact field before using it in a name.',
    examples: ['Alex', 'night owl', 'made it'],
    faqs: [
      {
        q: 'What character makes the arrow underline?',
        a: 'Each letter is followed by U+034D, COMBINING LEFT ARROW BELOW. The browser draws the arrow under the letter. Because the arrow is a separate combining character, the original letters remain in the text.',
      },
      {
        q: 'Why do the arrows disappear when I paste them?',
        a: 'Some apps remove combining marks, and some fonts have no glyph for U+034D. The text may still contain the character even when the arrow is not drawn. Try the style in the exact app and field you plan to use, because the result depends on that app text handling.',
      },
      {
        q: 'Will a screen reader announce the arrows?',
        a: 'It may ignore U+034D, read it as an extra symbol, or say nothing at all; behaviour varies by software and punctuation settings. The arrow is decorative and carries no spoken meaning. Keep a plain version of the word when a listener needs it.',
      },
    ],
    related: ['underline', 'bar-under', 'tilde-under', 'dot-above'],
  },

  backwards: {
    title: 'Backwards Text Generator',
    description: 'Backwards Text reverses the order of characters, so a name or phrase reads from right to left. The letters themselves stay ordinary Unicode text.',
    h1: 'Backwards Text Generator',
    lede: 'Reverse the character order to make a line that reads backwards but copies as plain text.',
    quick: 'The reversed letters need no special glyphs; the risk is that a reader or screen reader sees nonsense, not an empty box.',
    intro:
      'Backwards Text reverses the order of characters in a line. Type a name and the last character appears first, so Alex becomes xelA. The letters are not swapped for look-alike shapes; they keep their normal Unicode values and only their positions change. That makes the result easy to select, copy and paste, and it keeps accents and emoji intact because the engine works on whole characters rather than bytes. People use it for puzzles, hidden messages, playful captions and usernames that should look odd at first glance. It is also useful for a joke where the reader has to work out the line. The style does not attempt to mirror the glyphs, so the letters are still upright and readable once you read from right to left. Spaces move with the other characters, which means a phrase can look spaced differently after reversal. For a line that should read naturally from left to right, use a mirror style instead.',
    where:
      'Reversing changes character order rather than character identity, so no letter needs a special glyph. Digits reverse too: 2026 becomes 6202, and punctuation moves to the opposite end of the line. Accented letters and emoji stay whole because the engine reverses grapheme clusters, not individual bytes. Spaces are characters as well, so a phrase can end up with its words separated in unexpected places. The practical limits are reading and lookup: a screen reader follows the stored order and hears nonsense, a search box will not match the original word, and an app with right-to-left layout may reorder the line again. A phone number or address becomes unusable. Use it for a puzzle or a joke and keep the normal text nearby.',
    examples: ['Alex Rivera', 'good vibes', 'Berlin 2026'],
    faqs: [
      {
        q: 'Does Backwards Text use special Unicode characters?',
        a: 'No. It reverses the characters you type, including spaces, so the output is made of the same letters in a different order. Accented letters and emoji are kept whole rather than split.',
      },
      {
        q: 'Why does the spacing look wrong after reversing?',
        a: 'Spaces are characters too, so they move when the line is reversed. A phrase with several words can end up with its spaces in different places relative to the visible words. Try a shorter phrase if the spacing matters.',
      },
      {
        q: 'What does a screen reader do with reversed text?',
        a: 'It reads the characters in the order stored in the document, which is the reversed order. The listener may hear a meaningless string or individual letters. Reversal is a visual puzzle, so provide the original wording separately when the meaning matters.',
      },
    ],
    related: ['backwards-words', 'flipped-letters', 'upside-down', 'upside-down-words'],
  },

  'backwards-words': {
    title: 'Backwards Words Text Generator',
    description: 'Backwards Words reverses the letters inside each word but keeps the word order, so the line still looks like separate words. Copy and paste the result.',
    h1: 'Backwards Words Text Generator',
    lede: 'Keep the sentence shape while every individual word runs right to left.',
    quick: 'The reversed words use ordinary letters, so boxes are unlikely; the style fails when a reader expects normal word order.',
    intro:
      'Backwards Words reverses the letters inside every word but leaves the words in their original order. Good vibes only becomes dooG seбиv ylno in shape, so the line still has three separate word blocks. The engine splits on whitespace, reverses each grapheme cluster, and rejoins the line with the same spaces. This keeps the outline of a sentence while making each word read from right to left. It is different from Backwards Text, which reverses the whole line and moves the spaces as well. People use Backwards Words for captions, puzzle hints and playful profile text where the sentence should still look like a sentence. Because the letters remain ordinary Unicode characters, accents and emoji stay intact. The effect is easy to copy, but it is not meant for text that someone has to read quickly. It works best on a short phrase with clear word boundaries.',
    where:
      'The split happens only on whitespace, so punctuation stays attached to its word and moves with it: hello! becomes !olleh. A hyphenated word such as well-known is treated as a single word, and the hyphen ends up inside the reversed string. Digits reverse with their word, so a year changes order just like a name. Letters keep their ordinary Unicode values, which means no glyph is missing, but the output is still unreadable to a screen reader and will not match the original word in search. Apps with bidirectional text handling may reorder the words visually. It is best for a short caption or puzzle where the sentence shape matters more than immediate reading.',
    examples: ['Alex Rivera', 'good vibes only', 'Berlin 2026'],
    faqs: [
      {
        q: 'How is this different from Backwards Text?',
        a: 'Backwards Text reverses the entire line, so the spaces and word order move as well. Backwards Words reverses only the letters inside each word, leaving the words in the same places and the spaces unchanged.',
      },
      {
        q: 'Does it keep emoji and accents together?',
        a: 'Yes. The engine reverses whole grapheme clusters rather than individual code units, so an accented letter or an emoji sequence stays in one piece. The letters still have their normal Unicode values.',
      },
      {
        q: 'Can a listener understand backwards words?',
        a: 'Usually not. A screen reader reads each reversed word as written, so the sentence sounds garbled even though the word order is unchanged. The effect is visual, not spoken. Offer a normal copy of the message if someone needs to hear it.',
      },
    ],
    related: ['backwards', 'upside-down-words', 'flipped-letters', 'upside-down'],
  },

  'bar-under': {
    title: 'Bar Underline Text Generator',
    description: 'Bar Underline places a short bar under every letter with a combining mark. Use it for headings and names; some older apps may drop or misplace the mark.',
    h1: 'Bar Underline Text Generator',
    lede: 'A single bar under each letter adds weight without turning the text into a different alphabet.',
    quick: 'The bar mark needs a font with U+0331; without it the app may show an empty box, a detached dash or nothing.',
    intro:
      'Bar Underline adds a short horizontal bar under each letter using U+0331, COMBINING MACRON BELOW. The bar is a separate combining character, so the letters stay unchanged and the text remains selectable. Paired with bold letters, the bar is easier to see. The effect is a firm, even rule under a word, lighter than a double underline and more geometric than a wavy mark. It suits headings, names, labels and short captions that need a little weight without a full frame. Because the bar is drawn by the font, its thickness and distance from the letters vary between devices. It works best on short lines where the mark has room. Most modern apps render the mark, but a limited font may drop it. Test a name in the field where it will appear.',
    where:
      'U+0331 attaches to the character before it, so the bar is added after letters, digits and punctuation alike; spaces and emoji are skipped. A full stop or a number can therefore carry a bar, which is rarely what a heading wants. The letter itself is unchanged, and the mark can be copied, but the font decides where the bar sits. On letters with descenders such as g, j, p, q and y, a low bar can crowd the tail. A font without the glyph may show a box, and an app that strips combining marks may lose the bar while keeping the word. Short names and labels are the safest use; long lines make the marks look uneven.',
    examples: ['Alex', 'night owl', 'made it'],
    faqs: [
      {
        q: 'Which Unicode character adds the bar?',
        a: 'The bar is U+0331, COMBINING MACRON BELOW. It follows each letter and asks the font to draw a short line underneath. Because it is a combining mark, the letter itself is not replaced.',
      },
      {
        q: 'Why is the bar in a different place on my phone?',
        a: 'Fonts position combining marks differently, and the app may use a different font from the one on your computer. The bar can sit closer to the letters, overlap the line below or appear as a separate dash. This is a display difference on the device.',
      },
      {
        q: 'Does the bar appear under digits and punctuation?',
        a: 'Yes. The converter adds U+0331 after every letter, digit and punctuation mark, but skips spaces and emoji. A number or a full stop can carry the bar, so check a mixed line if you only wanted it under the letters.',
      },
    ],
    related: ['bar-underline', 'underline', 'tilde-under', 'arrow-under'],
  },

  'bar-underline': {
    title: 'Bar and Line Underline Generator',
    description: 'Bar and Line Underline stacks two combining marks under each letter for a heavier rule. Best for short headings; display depends on the app and its font.',
    h1: 'Bar and Line Underline Generator',
    lede: 'Two stacked marks under each letter make a firmer rule than a plain underline.',
    quick: 'Both marks need font support; an app missing either one may show a box or a single line instead of the double rule.',
    intro:
      'Bar and Line Underline stacks two combining marks under every letter: U+0331, a short macron below, and U+0332, a low line. The result is a darker, more deliberate rule than either mark on its own. The marks are applied to bold letters so the double rule is easier to see. The letters are not replaced, so the output stays readable and can be pasted as plain text. People use it for short headings, names in a bio and labels that need a firm visual base. It is a decorative treatment rather than a separate alphabet, and it works best on short words where the two marks have space to sit. Because both marks are drawn by the receiving font, their spacing and weight vary. Most modern apps render both, but a limited font may drop one.',
    where:
      'Both marks are combining characters, so they attach to the same base character. Letters, digits and punctuation each receive the pair, while spaces and emoji are skipped. A letter that already has a mark below, such as a cedilla, ends up with three marks stacked in the same area, which many fonts render poorly. If a font supports only one of U+0331 and U+0332, the line appears single rather than double; if the app strips combining marks, both can vanish while the letters remain. The stack also makes the line taller, so tight spacing can overlap the next row. Try it on the exact heading or name you plan to use.',
    examples: ['Alex', 'night owl', 'made it'],
    faqs: [
      {
        q: 'What are the two marks in this style?',
        a: 'It uses U+0331 COMBINING MACRON BELOW and U+0332 COMBINING LOW LINE. The first draws a short bar, the second a longer line. Together they create a heavier underline effect without changing the letters.',
      },
      {
        q: 'Why does only one line show in some apps?',
        a: 'An app may support one mark and not the other, or its font may position them so they overlap. The text still contains both characters. Display depends on the device and font, so the style is best used where you can check the result.',
      },
      {
        q: 'What happens to a letter that already has an accent below?',
        a: 'The two underline marks are added on top of the existing mark, so a letter with a cedilla can carry three marks in the same area. Many fonts stack them badly or draw them on top of each other. Use a plain letter if the result has to stay clear.',
      },
    ],
    related: ['bar-under', 'underline', 'strike-underline', 'overline-underline'],
  },



  'bold-fraktur': {
    title: 'Bold Gothic Text Generator',
    description: 'Bold Gothic uses Mathematical Bold Fraktur letters for a heavy blackletter look. Copy the Unicode text for names, titles and gothic-style captions.',
    h1: 'Bold Gothic Text Generator',
    lede: 'Heavy blackletter letters give a name the look of an old manuscript or metal logo.',
    quick: 'The Fraktur letters need a font with the Mathematical Alphanumeric Symbols block; an app without it may draw empty boxes.',
    intro:
      'Bold Gothic uses the Mathematical Bold Fraktur alphabet, a set of Unicode letters with the heavy, angular strokes of blackletter. Each ordinary letter is replaced by a character from the Mathematical Alphanumeric Symbols block, so Bold becomes 𝕭𝖔𝖑𝖉. The letters are not a downloadable font: they are distinct code points that copy and paste as text. The bold weight makes the style darker and more compact than the plain Fraktur used by Old English. People use it for gothic usernames, band and album references, dramatic headings and gaming names that should look weighty. It keeps the spelling of the original word, so the text remains selectable even though it looks like a different typeface. Short names work best; long lines become dense. The Mathematical Alphanumeric Symbols block is widely supported, though a device without those glyphs will show boxes.',
    where:
      'The mapping covers the twenty-six uppercase and twenty-six lowercase Latin letters and no digits. A name such as Alex2026 keeps ordinary digits beside blackletter letters, and punctuation, spaces and accented letters stay in the surrounding font. That mix is the main visual limitation: numbers look lighter than the letters, and an accented name is only partly converted. Mathematical letters are separate Unicode code points, not a font switch, so a device whose font lacks the block may draw boxes. At small sizes the heavy strokes close up the counters in letters such as 𝖊, 𝖔 and 𝖘, and some capitals are easy to confuse. Screen readers may announce the characters as mathematical symbols rather than ordinary letters. Keep a plain copy when the name has to be read or searched.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'Is Bold Gothic a font I need to install?',
        a: 'No. The letters are Unicode characters from the Mathematical Bold Fraktur alphabet. They travel with the text, so the receiver does not need a font file. The device does need a font that contains glyphs for those code points.',
      },
      {
        q: 'What is the difference between Bold Gothic and Old English?',
        a: 'Both use blackletter shapes. Bold Gothic uses the bold Fraktur alphabet, which has thicker strokes, while Old English uses the regular Fraktur alphabet. They are different Unicode code points and produce different output.',
      },
      {
        q: 'How does a screen reader pronounce Mathematical Bold Fraktur?',
        a: 'It may read the Unicode names, map the letters back to A to Z, or spell them out, depending on the software. The heavy blackletter appearance is not conveyed. A listener may not recognise the word, so use ordinary letters where the name must be understood.',
      },
    ],
    related: ['fraktur', 'boss-mode', 'bold-script', 'bold'],
  },

  'boss-mode': {
    title: 'Boss Mode Text Generator',
    description: 'Boss Mode combines Fraktur letters with ornate Javanese brackets for a game-ready tag. Copy it for names and titles; older devices may miss the brackets.',
    h1: 'Boss Mode Text Generator',
    lede: 'Fraktur letters inside ornate brackets make a short tag read like a game lobby title.',
    quick: 'The Fraktur letters usually render; an app without the Javanese brackets may show empty boxes where the frame should be.',
    intro:
      'Boss Mode combines two effects: the letters are converted to Fraktur, and the whole line is wrapped in ornate Javanese brackets, U+A9C1 and U+A9C2. The result looks like a game lobby tag, with a heavy blackletter name inside decorative corner marks. The letters keep their original spelling, so the tag stays selectable and can be copied into a display name or a chat. People use it for clan tags, tournament names, Discord nicknames and short titles that should feel competitive. The frame is most effective on one or two words; a long line pushes the brackets apart and loses the compact shape. The style is decorative, not a separate font, and it works only where the app accepts the characters. The Fraktur letters are widely supported, but the Javanese brackets are much rarer, so the frame is the part most likely to fail on an older device.',
    where:
      'The letters come from the Mathematical Alphanumeric Symbols block, but the frame uses U+A9C1 and U+A9C2, two Javanese punctuation characters. Digits and punctuation are not converted, so a tag with a number shows ordinary digits between blackletter letters. The brackets are the fragile part: many fonts have no glyph for them, and game or chat fields often allow only a narrow character set. A field may keep the letters and remove the brackets, reject the whole tag, or show boxes at the ends. The letters themselves remain text and copy normally. Test the complete tag in the exact name field, and keep a bracket-free version for platforms that filter symbols.',
    examples: ['Alex', 'clan tag', 'boss mode'],
    faqs: [
      {
        q: 'What are the brackets around Boss Mode text?',
        a: 'They are U+A9C1 and U+A9C2, a pair of Javanese punctuation characters used here as a decorative frame. They are not emoji or a font. Because they are uncommon, some devices may not have glyphs for them.',
      },
      {
        q: 'Why did the brackets vanish in my game?',
        a: 'Many games restrict display names to a small set of characters and remove anything else. The Fraktur letters may survive while the brackets are stripped, or the whole name may be rejected. Check the field after saving and keep a plain version for platforms that filter symbols.',
      },
      {
        q: 'Will a screen reader read the brackets in Boss Mode?',
        a: 'It may announce them as punctuation, skip them, or read the Fraktur letters by their Unicode names. The frame is decorative and adds no meaning. If the tag has to be understood by a listener, use plain text.',
      },
    ],
    related: ['bold-fraktur', 'fraktur', 'clan-tag', 'gg-frame'],
  },

  console: {
    title: 'Console Tag Text Generator',
    description: 'Console Tag uppercases a line and converts it to Mathematical Monospace letters and digits. Copy the fixed-width text for game tags and Discord names.',
    h1: 'Console Tag Text Generator',
    lede: 'Monospace letters in capitals give a short tag the fixed-width look of a terminal.',
    quick: 'Mathematical Monospace lives in the math symbols block; a device without those glyphs may show boxes even though the tag copies as text.',
    intro:
      'Console Tag first converts the line to uppercase, then maps each basic Latin letter and digit to its Mathematical Monospace form. A name such as Alex becomes 𝙰𝙻𝙴𝚇, and 2026 becomes 𝟸𝟶𝟸𝟼. The two steps explain the style: the capitals make the tag feel like a command, while the monospace alphabet gives every character the same width. Because the letters are Unicode characters rather than a font setting, the result can be copied into a display name, a Discord nickname or a game lobby title without installing anything. Short tags work best, since a long sentence in fixed-width capitals becomes a solid block. The style is also useful for a faux-terminal heading or a retro computer caption. It does not change punctuation or spacing, so a tag keeps its shape. Keep a plain version for fields that reject mathematical symbols.',
    where:
      'Uppercasing happens before the mapping, so a mixed-case name loses its original capitals even if the monospace step later fails. The mapping covers A-Z and 0-9; accented letters, punctuation, spaces and emoji stay in the surrounding font. That creates a visible seam in names such as José, where the é remains ordinary while the other letters turn monospace. Digits are all converted, which is useful for a year or a squad number. Game and chat fields vary: some accept the math letters, some strip them, and some reject the name outright. The uppercase I and digit 1 are clearly different in this block, but a small screen still makes them worth checking. A screen reader may read the letters normally, spell them, or announce mathematical symbols. Test the exact tag after saving.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'Does Console Tag preserve lowercase letters?',
        a: 'No. It uppercases the whole line before the monospace mapping, so a mixed-case name comes out in capitals. If the lowercase shape matters, use a monospace style that does not change case.',
      },
      {
        q: 'Why is one accented letter still in a normal font?',
        a: 'The monospace table only covers the basic Latin alphabet and digits. An accented letter is uppercased but not replaced, so it stays in the app font while the rest of the word becomes monospace. The result is a visible weight and width mismatch.',
      },
      {
        q: 'Will Console Tag survive a game name filter?',
        a: 'It depends on the game. Some fields accept the Mathematical Monospace characters, some remove them, and some reject the whole name. Test the complete tag in the exact field and keep a plain fallback for platforms that filter symbols.',
      },
    ],
    related: ['monospace', 'boss-mode', 'clan-tag', 'gg-frame'],
  },



  'dot-above': {
    title: 'Dot Above Text Generator',
    description: 'Dot Above adds a small dot over every letter with a Unicode combining mark. The bold base keeps the mark visible on names and short headings.',
    h1: 'Dot Above Text Generator',
    lede: 'A dot over each letter gives a short line a measured, almost musical beat.',
    quick: 'The dot is U+0307, a combining mark; an app that strips marks or a font without the glyph can make it vanish.',
    intro:
      'Dot Above attaches U+0307 COMBINING DOT ABOVE to every character that is not a space or emoji. The converter also renders the text in bold first, so the letters have enough weight to carry the small mark. The output looks like a line of dotted capitals or lowercase letters, depending on the input. People use it for a stylised name, a short heading, a lyric line or a caption that should feel precise rather than decorative. Because the dot is a combining character, the letters themselves are not replaced and the line remains selectable text. The effect is subtle at normal size and needs a font that positions the mark cleanly. It works best on a short word or phrase; a long paragraph turns into a field of dots. Keep a plain version where the text must stay easy to read.',
    where:
      'U+0307 follows the base character, so the font decides the exact height and spacing of each dot. Letters, digits and punctuation all receive the mark, while spaces and emoji are skipped; a full stop can end up with a dot above it as well as its own shape. Lowercase i and j already carry a tittle, so adding U+0307 can produce a doubled or crowded dot. A letter that already has a dot above, such as ż, stacks another mark in the same place. Accented letters with marks below are usually unaffected, but a font may still shift the dot. At small sizes the marks can merge into the tops of tall letters such as b, d and h. A screen reader may ignore the mark or announce it as a combining dot. Test the exact name before using it in a profile.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'Which character creates the dot above each letter?',
        a: 'It is U+0307, COMBINING DOT ABOVE. The character follows the base letter and asks the font to draw a dot over it. The original letter stays in the text, so the word can still be copied.',
      },
      {
        q: 'Why does the letter i show two dots?',
        a: 'A lowercase i already has a tittle, and the converter adds U+0307 above it. Depending on the font, the two marks may appear as a double dot, a single thick dot or a crowded shape. Use a word without i or j if a clean top matters.',
      },
      {
        q: 'Does Dot Above put a dot over numbers?',
        a: 'Yes. The converter adds the mark after digits and punctuation as well as letters, while skipping spaces and emoji. A year or a price can end up dotted, so check a mixed line before using it in a heading.',
      },
    ],
    related: ['dotted', 'double-dot-under', 'tilde-under', 'underline'],
  },

  dotted: {
    title: 'Dotted Text Generator',
    description: 'Dotted Text places a dot under every letter with a Unicode combining mark. The bold base makes the dots easier to see on names and labels.',
    h1: 'Dotted Text Generator',
    lede: 'A dot beneath each letter turns a plain word into a dotted line.',
    quick: 'The dot is U+0323, so a font without that glyph or an app that drops combining marks may hide the dots.',
    intro:
      'Dotted Text adds U+0323 COMBINING DOT BELOW under each character. The converter applies the mark to bold letters, which gives the small dots more contrast against the page. The effect is a single dot under every letter, digit and punctuation mark, with spaces left clear. It is different from an underline: there is no continuous rule, only a repeated point beneath the text. People use it for a dotted name, a short label, a lyric or a caption that needs a light decorative base. The letters keep their ordinary Unicode values, so the result copies and pastes as text. Dotted Text is easy to overuse; on a long line the repeated dots can look like noise. A short word or a two-word phrase shows the pattern best. Keep the plain spelling nearby when the text has to be searched or read aloud.',
    where:
      'Because U+0323 attaches below the base character, the font controls how far the dot sits from the letter. Descenders in g, j, p, q and y occupy that space, so the dot may touch the tail or disappear into it. A letter that already has a mark below, such as a cedilla, ends up with two marks in the same area. Digits and punctuation also receive the dot, while spaces and emoji are skipped. Some fonts place the dot very low, which can crowd the following line; others draw it close enough to look like a small underline. An app that normalises text may remove the mark, leaving ordinary letters. A screen reader often ignores the dot or reads it as a combining character. Check a name with descenders before relying on the effect.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'How is Dotted Text different from Dotted Underline?',
        a: 'Dotted Text adds only a dot below each character. Dotted Underline adds the same dot plus a continuous line under the word, so it looks heavier and uses two combining marks.',
      },
      {
        q: 'Why is the dot hidden under letters like g or y?',
        a: 'The tail of a descender occupies the space below the baseline. Some fonts place the dot inside or behind the tail, and others push it lower. The character is still in the text even when the dot is hard to see.',
      },
      {
        q: 'Does Dotted Text add a dot under spaces?',
        a: 'No. Spaces and emoji are skipped, while letters, digits and punctuation receive the mark. A line with several words therefore has dots under the words but not in the gaps between them.',
      },
    ],
    related: ['dot-above', 'dotted-underline', 'dotted-strike', 'double-dot-under'],
  },

  'dotted-strike': {
    title: 'Dotted Strikethrough Generator',
    description: 'Dotted Strikethrough adds a dot below and a line through each letter. The double mark is decorative, and font support decides how clean it looks.',
    h1: 'Dotted Strikethrough Generator',
    lede: 'A line through the letters and a dot beneath them make a deliberately crossed-out word.',
    quick: 'Both U+0323 and U+0336 must render; if the app drops either mark, the line, the dots, or both can disappear.',
    intro:
      'Dotted Strikethrough combines two combining marks: U+0323 COMBINING DOT BELOW and U+0336 COMBINING LONG STROKE OVERLAY. The converter applies both to bold letters, so the word carries a dot underneath and a line across the middle. The result reads as cancelled, sold out or deliberately unavailable, with more texture than a plain strikethrough. People use it for a joke price, a spoiler, a fake correction or a caption that should look edited. The letters are not replaced, so the line remains selectable and can be copied into a post or message. The effect is heavy and best kept to a few words; a full sentence becomes difficult to read. It also depends on font shaping, because two marks on one character can collide. Keep a plain version when the crossed-out meaning has to be understood without the visual cue.',
    where:
      'Both marks attach to the same base character, so letters, digits and punctuation receive the pair while spaces and emoji stay clear. A descender such as g, j, p, q or y already reaches into the space where the dot sits, and the strike line crosses the middle of every glyph. On tall letters the line can sit too high or too low; on short letters it can cover the whole shape. A letter with an existing accent may end up with three marks fighting for the same area. Fonts vary widely in how they position the stroke and the dot, and an app that strips combining marks can remove both while leaving ordinary letters behind. A screen reader usually reads the base letters and does not announce that the word is crossed out. Use words such as cancelled when the meaning matters.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'Which two marks make Dotted Strikethrough?',
        a: 'It uses U+0323 COMBINING DOT BELOW and U+0336 COMBINING LONG STROKE OVERLAY. The first draws the dot, the second draws the line. Both are added to bold letters.',
      },
      {
        q: 'Why is the line uneven across the word?',
        a: 'The stroke is drawn by the font, and letter shapes have different heights and widths. Ascenders, descenders and existing accents can push the line off centre. The text is the same on every device, but the drawing is not.',
      },
      {
        q: 'Does a screen reader announce the strikethrough?',
        a: 'Usually not. The combining marks are decorative and may be ignored or read as extra symbols. A listener hears the letters, not the cancellation. Write the meaning in words if someone needs to understand it without seeing the line.',
      },
    ],
    related: ['dotted', 'strike', 'dotted-underline', 'short-strike'],
  },

  'dotted-underline': {
    title: 'Dotted Underline Text Generator',
    description: 'Dotted Underline puts a dot below and a line under every letter. Use it on short labels; the stacked marks need a font that supports both.',
    h1: 'Dotted Underline Text Generator',
    lede: 'A dotted base under a solid line gives a word a two-level underline.',
    quick: 'The style needs U+0323 and U+0332; if one glyph is missing or stripped, the dots and line may separate or disappear.',
    intro:
      'Dotted Underline stacks two marks beneath each character: U+0323 COMBINING DOT BELOW and U+0332 COMBINING LOW LINE. The converter applies them to bold letters, making the dot and the rule easier to distinguish. The result is a solid underline with a row of dots between it and the letters, a more elaborate treatment than either mark alone. People use it for a short heading, a label, a name in a bio or a caption that needs a decorative base. The letters stay ordinary Unicode text, so the line can be copied and pasted. The effect is busy at small sizes and on long lines, where the dots and the rule compete for space. A short word or a two-word phrase shows the two levels clearly. Keep a plain version where the text needs to stay simple and readable.',
    where:
      'Both marks are combining characters attached to the same base, so letters, digits and punctuation receive the pair while spaces and emoji are skipped. Descenders in g, j, p, q and y reach into the space between the dot and the line, and the two marks can overlap on those letters. A cedilla or another mark below adds a third layer in the same area. Fonts position U+0323 and U+0332 differently, so the gap between dot and rule varies; at a small size they may merge into a single thick line. An app that normalises combining marks may keep one and drop the other. Tight line spacing can make the underline touch the next row. A screen reader usually ignores both marks. The two marks can also drift apart when a font substitutes a different glyph for one of them, and a PDF export may flatten the pair into an image. A high-contrast mode can hide the low line, while a monochrome screen may merge the dots into the rule. The effect is not a real underline, so a link style or spell-check squiggle may sit in the same area and confuse the eye. A word processor may treat the combined character as one glyph and refuse to colour the dot and rule separately. Copying from a chat app can preserve the marks, while copying from a rendered image loses them entirely. A narrow font can make the dots collide, and a wide font can leave a gap that looks like a broken line. Test a descender and a capital in the exact field.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'How is Dotted Underline different from Dotted Text?',
        a: 'Dotted Text adds only a dot below each character. Dotted Underline adds the dot plus a continuous low line, so the word has two decorative levels underneath. It uses U+0323 and U+0332.',
      },
      {
        q: 'Why do the dots and the line merge on my phone?',
        a: 'The font decides how far apart the two marks sit. At small sizes or in a compact font, the dot can touch the line and look like a thicker rule. The characters are still separate even when the drawing is tight.',
      },
      {
        q: 'Does Dotted Underline mark punctuation?',
        a: 'Yes. Every non-space character receives both marks, including digits and punctuation. A full stop or comma can carry a dot and a line, so check a mixed line if you only wanted the effect under letters.',
      },
    ],
    related: ['dotted', 'underline', 'dotted-strike', 'bar-underline'],
  },

  'double-dot-under': {
    title: 'Double Dot Underline Generator',
    description: 'Double Dot Underline places two dots below each letter with one combining mark. The bold base keeps the mark visible on short names.',
    h1: 'Double Dot Underline Generator',
    lede: 'Two small dots under every letter give a word a quiet, balanced base.',
    quick: 'The mark is U+0324; a font without that glyph or an app that strips combining marks can hide the dots completely.',
    intro:
      'Double Dot Underline adds U+0324 COMBINING DIAERESIS BELOW to each character. Despite the name, it is a single combining mark that draws two dots under the letter, not two separate marks applied one after the other. The converter renders bold letters first, so the dots have a solid shape to sit beneath. The effect looks like a diaeresis or umlaut moved below the baseline, giving a short word a symmetrical, slightly formal base. People use it for a stylised name, a label, a short heading or a caption with a precise, decorative feel. The letters remain ordinary text, so the output copies cleanly. It is subtle on a single word and repetitive on a long line. A short phrase shows the paired dots best. Keep the plain text for fields that filter combining marks.',
    where:
      'U+0324 attaches to the character before it, so the font decides how wide the pair of dots is drawn and how far below the letter it sits. Letters, digits and punctuation receive the mark, while spaces and emoji are skipped. Descenders in g, j, p, q and y can collide with the dots, and a letter that already has a mark below, such as a cedilla, can end up with a crowded stack. The pair may look like a tiny colon or a broken underline on very small text. Accented letters with marks above are usually unaffected, but the font may shift the lower dots to avoid the upper accent. An app that normalises text can remove the mark, leaving plain letters. A screen reader may ignore it or announce a combining diaeresis. No standard language uses the diaeresis below as a spelling accent; it is a decorative Unicode combination, not a real orthographic mark. Unicode does assign it to phonetic notation, but this generator applies it only for its visual shape. The pair can look like a colon, a tiny equals sign or two beads under the letter, depending on the typeface. A designer may draw the dots round, square or oval, and a fallback font can replace the pair with a missing-glyph box. Because it is one code point, the mark survives copy and paste as a unit; it does not become two separate dots. A spell checker may flag the word, and a search box may not match the plain spelling. A narrow column can wrap the pair onto a new line, and a tight line height can push the dots into the row beneath. Check a descender before using it in a name.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'Is Double Dot Underline one mark or two?',
        a: 'It is one mark, U+0324 COMBINING DIAERESIS BELOW. The font draws both dots from that single character. That is different from adding two separate dot marks under a letter.',
      },
      {
        q: 'Why does it look like an umlaut below the letter?',
        a: 'The mark is a diaeresis, the same shape as the two dots in an umlaut, but its position is below the base character. The font controls the exact spacing and height.',
      },
      {
        q: 'Do numbers receive the double dot?',
        a: 'Yes. Every non-space character receives U+0324, including digits and punctuation. Spaces and emoji are skipped. A year or a price can therefore carry the double dot, so check a mixed line before using it.',
      },
    ],
    related: ['dotted', 'dot-above', 'tilde-under', 'dotted-underline'],
  },

  'emoji-frame-blossom': {
    title: 'Blossom Frame Text Generator',
    description: 'Sakura Blossom Frame places cherry-blossom emoji around a name or caption. Use it for spring bios and hanami posts; the letters stay unchanged.',
    h1: 'Blossom Frame Text Generator',
    lede: 'A pair of cherry blossoms gives a short line the mood of spring.',
    quick: 'A cherry blossom is a colour glyph whose petals are drawn by the phone; a profile box that accepts only letters will reject it.',
    intro:
      'Blossom Frame places the sakura emoji, U+1F338, on either side of a short line. Cherry blossom is Japan\'s spring flower: the hanami picnic, the blossom forecast that tracks the season northward, and the falling petals all shape its meaning. It suggests renewal, gentleness and mono no aware, the quiet awareness that beauty passes. That makes it a natural marker for a spring profile, a hanami outing caption or a seasonal greeting sent when the local trees open. The wording between the flowers is not rewritten, so Japanese kana, accented letters and punctuation remain as typed. The result is text, not a picture, and it can be pasted into a bio or message. Two or three words keep the floral bookends balanced; a long paragraph pushes them apart and can wrap. A handle or formal title is better left unframed.',
    where:
      'The emoji is U+1F338, and the wrapper adds a blank space beside each flower. iOS, Android and Windows each ship separate artwork, so petal shape, pink tone and the centre of the bloom differ; updates can change the drawing again. A monochrome emoji font may show a flat silhouette, while a strict profile box may strip the flower entirely. The two blossoms plus their spaces also use part of a character budget, which matters on a short bio. On a narrow phone a longer caption can wrap and leave a single flower stranded. Assistive software may read "cherry blossom" before and after the wording, so a listener hears the floral label twice. The seasonal signal is strong: a sakura border in autumn or on a winter holiday post can feel out of place, and a serious job title may read like a greeting card. Preview the saved post.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'What is the sakura emoji associated with?',
        a: 'It is tied to spring in Japan: hanami picnics, the blossom forecast that follows the season north, and the brief fall of the petals. That gives it a meaning of renewal, gentleness and beauty that does not stay, which is more specific than a generic flower.',
      },
      {
        q: 'Why does the blossom change shape between phones?',
        a: 'Apple, Google and Microsoft draw their own emoji artwork, and an update can redraw it again. Petal geometry, pink tone and the centre of the bloom may all differ, so the flower is not a fixed picture across devices.',
      },
      {
        q: 'Will a profile box accept the cherry blossom?',
        a: 'Many handles allow only letters, numbers, dots and underscores and will remove the flower. A display name, bio or caption is more likely to keep it. The two blossoms and their spaces also use part of the character budget, so test the exact field.',
      },
    ],
    related: ['emoji-frame-fire', 'emoji-frame-party', 'emoji-frame-sparkles', 'symbol-heart'],
  },

  'emoji-frame-fire': {
    title: 'Fire Frame Text Generator',
    description: 'Fire Frame bookends a line with flame emoji for hype, streaks and hot takes. The words stay ordinary text; the flame is drawn by the device.',
    h1: 'Fire Frame Text Generator',
    lede: 'A flame at each end gives a short line the heat of a challenge or a win.',
    quick: 'The flame is a platform glyph, so its silhouette and orange-yellow mix shift between phones; a game lobby may filter it out.',
    intro:
      'Fire Frame sets the flame emoji, U+1F525, at each end of a line. A flame can mean heat, a winning streak, a hot take or an emergency, and slang uses "fire" as praise while a "dumpster fire" means a disaster. The same symbol can therefore read as excitement or alarm, and the words beside it decide which. It fits a gaming win streak, a blunt opinion post or a workout streak update. Nothing between the flames is rewritten, so a score, hashtag or player name keeps its spelling. The result travels as text and can be dropped into a lobby chat or a caption. A couple of words keep the two flames close enough to read as a pair; a long sentence separates them and may wrap. A platform that blocks emoji will remove the flame. Keep a plain tag for a formal title.',
    where:
      'The wrapper adds U+1F525 and a blank space on both sides. Apple, Google and Microsoft draw the flame with their own emoji fonts, so the outline, the yellow core and the angle of the tip are not identical; a system update can redraw it. A text-style fallback may reduce it to a dark shape. Competitive name fields often allow only letters and digits and will drop the symbol, while a lobby chat or caption usually keeps it. The flame and its spaces consume part of a tag length, and the emoji can take several code units. A long line on a small screen can leave one flame alone on a row. Voice output may say "fire" twice, which can sound like a warning rather than hype. Tone is the other risk: flames around a serious safety notice can look like a joke, and flames around a joke can look like an alarm. A campfire, bonfire or barbecue uses a literal flame, while a candle, torch or spark can suggest a small light; none of those is the same as a hype label. A smoke alarm, extinguisher or safety drill belongs to an emergency, so avoid the frame on a serious notice. Preview the message.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'When does the fire emoji read as praise or as danger?',
        a: 'Slang uses "fire" for something excellent, while a "dumpster fire" describes a disaster. The flame itself carries heat and intensity, not a fixed judgement, so the surrounding words decide whether it reads as hype, warning or mockery.',
      },
      {
        q: 'Why is the flame drawn differently on Windows?',
        a: 'Windows uses Segoe UI Emoji, while Apple and Google use their own emoji fonts. The outline, the yellow core and the tilt of the flame can differ, and an OS update may change the artwork again.',
      },
      {
        q: 'Will a game lobby accept a flame tag?',
        a: 'Often not. Competitive name fields may allow only letters and digits and will strip the symbol, while a lobby chat or bio may keep it. Test the exact field and hold a plain tag for platforms that filter emoji.',
      },
    ],
    related: ['emoji-frame-party', 'emoji-frame-blossom', 'emoji-frame-sparkles', 'boss-mode'],
  },

  'emoji-frame-party': {
    title: 'Party Frame Text Generator',
    description: 'Party Frame bookends a line with party-popper emoji for birthdays, launches and congratulations. The words inside stay ordinary text.',
    h1: 'Party Frame Text Generator',
    lede: 'A party popper at each end announces a celebration before the words are read.',
    quick: 'The popper is a platform glyph, so the cone and confetti palette change between phones; a username rule may reject it.',
    intro:
      'Party Frame places the party-popper emoji, U+1F389, on both sides of a line. The image shows a cone bursting with confetti, a shorthand for a celebration that has just begun. It belongs with birthday wishes, product launch announcements and congratulations on a milestone, where the message is good news rather than routine. The announcement itself is untouched, including dates, names and exclamation marks. Because the popper is a text character, the line can be copied into a caption or chat without an image file. A short phrase keeps the two cones close and the confetti reads as one burst; a long sentence separates them and can wrap. A strict username rule may remove the symbol, and a tight bio allowance may cut the line. Keep an unframed version for a formal notice or a searchable title.',
    where:
      'The wrapper inserts U+1F389 and a blank space at either end. Apple, Google and Microsoft supply separate popper artwork, so the cone angle, the confetti colours and the amount of empty space differ; an OS update can alter the palette. A monochrome emoji font may show a flat outline instead of the colour version. Handles usually allow only letters, numbers and a few marks, while a bio, caption or chat message is more likely to keep the popper. The emoji plus its spaces use part of a character allowance, and the glyph can take several code units. On a narrow screen a longer line may wrap and leave one cone by itself. Spoken output may say "party popper" at both ends, interrupting the announcement. The wrapper is a moment marker, not a permanent badge: it suits a launch day or a birthday, but can feel odd on a year-round profile. A retirement, graduation or engagement announcement can use the same cone, while a cake, balloons or streamers may appear in the photo; the popper is the part that signals the news. A team win, an anniversary or a promotion can call for the same burst. Check the saved text.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'What kind of moment does the party popper emoji mark?',
        a: 'It marks a celebration that has just happened: a birthday, a launch, a promotion, a win or another milestone. The cone and confetti suggest a burst of good news, so it fits an announcement better than a permanent profile badge.',
      },
      {
        q: 'Why do the confetti colours vary across devices?',
        a: 'Apple, Google and Microsoft each draw the popper with their own emoji artwork. The cone angle, the confetti palette and the empty space around it can differ, and an OS update may change the design again.',
      },
      {
        q: 'Does the popper fit in a username or bio?',
        a: 'A username rule often rejects emoji, while a bio or caption may keep the popper. The glyph and its spaces also use part of the character allowance, and an emoji can take several code units. Test the exact field before relying on it.',
      },
    ],
    related: ['emoji-frame-fire', 'emoji-frame-blossom', 'emoji-frame-sparkles', 'sparkle-sparkle'],
  },

  'emoji-frame-sparkles': {
    title: 'Sparkles Frame Text Generator',
    description: 'Sparkles Frame bookends a line with the ✨ emoji for launches, celebrations and fresh starts. The words inside stay ordinary text you can copy.',
    h1: 'Sparkles Frame Text Generator',
    lede: 'A pair of sparkles at either end gives a short line a sense of something new.',
    quick: 'The golden burst is widely stocked, but a handle rule that bans pictures will delete it; the wording inside stays unchanged.',
    intro:
      'Sparkles Frame sets U+2728, a built-in picture of several pointed twinkles, on both sides of a short phrase. Most phones paint the cluster in gold, with one broad twinkle and smaller companions; the arrangement comes from the installed typeface. The mark has long stood for wonder, a clean slate and a fresh beginning, so it reads as a small surge of delight rather than a score. It fits a product reveal, a restock note, a makeover reel, a birthday greeting or a display nickname that should feel new. Whatever sits between the two bursts is not rewritten, so a date, a price or a brand keeps its spelling. The effect stays compact on two or three words; a longer sentence pulls the twinkles apart and may spill. The result is ordinary text and pastes into an about line or a message. Keep a bare version for a formal announcement.',
    where:
      'The wrapper places U+2728 and a plain gap on either side. Apple paints a gold trio with one broad central twinkle, Google groups them another way, and Microsoft may show a paler or silver cluster; a software release can redraw the picture again. On some devices the mark appears as a flat outline rather than a painted image, and a very old typeface may draw a blank rectangle. A strict nickname rule may accept just alphanumerics and delete the burst, whereas an about line, photo description or private message tends to preserve it. Both bursts plus the gaps count toward a length cap, which matters in a tight about section. On a slim handset a longer sentence may spill onto a second row and strand the closing burst. A speech reader might announce the mark at both edges, so someone listening hears the phrase twice. Skip it on a safety warning or legal disclaimer, where a cheerful flourish can seem glib. A cleaning service could add it after a deep-clean reel, and a skincare label might place it beside a fresh formula; a home organiser could use it on a decluttering post, while a jeweller might set it next to a polished ring. Check the published line in the exact app.',
    examples: ['new drop', 'launch day', 'Alex Rivera'],
    faqs: [
      {
        q: 'What mood does the sparkles burst add to a caption?',
        a: 'It implies freshness, a reset or a touch of wonder, so it fits a product reveal, a restock or a makeover. It feels celebratory without promising a rating the way a lone star might.',
      },
      {
        q: 'Why is the sparkle cluster a different shape on another phone?',
        a: 'Every phone maker draws the picture differently. How many tiny points appear, how they tilt and whether the tint reads gold or silver come from the installed typeface, not from the code point. What you paste is unchanged.',
      },
      {
        q: 'How does Sparkles Frame differ from Star Frame?',
        a: 'Sparkles groups several little twinkles at the edges, whereas Star Frame sets one solid five-point shape on either flank. The group feels like a party or a clean slate; the lone shape suggests a saved item, a grade or a rank.',
      },
    ],
    related: ['emoji-frame-star', 'emoji-frame-party', 'emoji-frame-blossom', 'emoji-sparkle'],
  },

  'emoji-frame-star': {
    title: 'Star Frame Text Generator',
    description: 'Star Frame puts a ⭐ at each end of a name, caption or tag. Use it for ratings, favourites and achievements; the words in between are unchanged.',
    h1: 'Star Frame Text Generator',
    lede: 'A star on each side turns a short line into a small award or bookmark.',
    quick: 'The star sits in most emoji fonts, so the frame usually survives; the risk is a strict handle or game name filter.',
    intro:
      'Star Frame puts U+2B50, the white medium star, at each end of a line. The character is a single five-point star, usually gold on a colour emoji font and a plain outline when the system falls back to a text glyph. A star is one of the oldest rating marks: five of them score a film, a restaurant or an app, and one alone can mean a favourite, a bookmark or a highlight. That history makes the frame feel like a small badge or an award rather than a party. It works for a review headline, a favourites list, an achievement post, a clan rank or a short profile line. The words inside keep their exact spelling, including numbers and punctuation. Two or three words keep the two stars close; a long paragraph separates them and weakens the badge shape. The output is text, not a picture, so it can be copied into a caption, a chat or a document. Keep a plain title for search.',
    where:
      'This frame inserts U+2B50 plus a space at both ends. The star may arrive with an emoji variation selector, in which case the device draws the colour version; without it, a monochrome outline can appear. Apple, Google and Microsoft each style the points and the shading differently, and an update can redesign it. Some game and username fields accept letters only and will delete the star, while a caption or bio is more likely to keep it. The two stars and their spaces use part of a length limit. On a narrow display a long line can wrap and leave one star alone on the next row. The symbol is also ambiguous: a reader may take it as a rating, a favourite marker or a footnote. If the line is a review, the star supports that reading; if it is a name, add words that make the meaning clear. Spoken output may say "star" at both ends, and a listener may not know whether it is a score. Preview the saved text.',
    examples: ['five stars', 'favourite find', 'Alex Rivera'],
    faqs: [
      {
        q: 'Does a star frame turn a caption into a rating?',
        a: 'It can, because a single star is widely read as a score or a favourite mark. A line such as "five stars" or a review context makes that meaning clear. On a personal name the star is more likely to look like a decorative badge, so add a word or two if the intent matters.',
      },
      {
        q: 'Why does the star sometimes look grey and flat?',
        a: 'The character can be drawn as text or as an emoji. A text presentation gives a monochrome outline, while an emoji font supplies the gold colour version. The choice depends on the platform, the font and whether a variation selector travels with the character.',
      },
      {
        q: 'Can a star frame work as a bookmark or saved marker?',
        a: 'Yes. A single star is often used to mark a favourite or a saved item, so the frame can label a post you want to return to. It reads less like a score when the words inside describe a place, a recipe or a product rather than a rating.',
      },
    ],
    related: ['emoji-frame-sparkles', 'emoji-frame-fire', 'emoji-frame-blossom', 'emoji-sparkle'],
  },

  'emoji-sparkle': {
    title: 'Emoji Sparkles Text Generator',
    description: 'Emoji Sparkles drops a sparkle or star between some words as you type. Copy the decorated caption for bios and posts; the letters are not replaced.',
    h1: 'Emoji Sparkles Text Generator',
    lede: 'A single sparkle lands in the gaps between words instead of framing the whole line.',
    quick: 'The symbol is a common emoji; a platform that filters emoji may drop it while leaving the surrounding words intact.',
    intro:
      'Emoji Sparkles uses a different approach from a frame: it drops one symbol into some of the gaps between words. The pool contains U+2728 sparkles, U+2B50 star and U+1F31F glowing star, and the converter picks one each time it decorates a gap. Because the choice is driven by a fixed seed, the same phrase always receives the same symbols. The letters are never replaced, so the text stays readable and searchable in the ordinary way. The effect is lighter than a border and more scattered than a single icon. It suits a short caption, an event announcement, a two-line bio or a message where one bright mark is enough. A one-word input still gets a symbol at the end so the style never looks inactive. Longer paragraphs collect many marks and can feel noisy. Use it on a few words, keep a plain version for a formal post, and remember that each symbol is an emoji drawn by the receiving device.',
    where:
      'The flair step splits the line on whitespace and, for each word, may append one symbol with a fixed probability. It never inserts inside a word, so punctuation attached to a word stays beside it. The seed belongs to this style, which means the pattern is reproducible on every visit rather than random per request. A single word receives a forced mark at its end, because an undecorated result would misrepresent the effect. The three symbols have separate code points and separate artwork: a four-point sparkle, a five-point star and a glowing star with a halo. A platform may draw one as a flat text glyph and another as colour emoji, so a line can mix styles. Apps that block emoji remove the marks but leave the words. A character counter treats each emoji as one or more units, so a tight bio limit shrinks. Spoken output may name each star, interrupting the sentence. A caption with a hashtag can take a mark after the tag, but a URL should stay bare. Check the final saved caption.',
    examples: ['good vibes', 'new drop', 'Alex Rivera'],
    faqs: [
      {
        q: 'Why does Emoji Sparkles skip some gaps between words?',
        a: 'The style uses a balanced chance for each word rather than decorating every space. That keeps the line from looking like a solid pattern and leaves the words easy to read. The fixed seed decides which gaps receive a symbol for a given phrase.',
      },
      {
        q: 'Can a sparkle appear in the middle of a word?',
        a: 'No. The converter splits the line at whitespace, so a symbol can only follow a complete word. Punctuation stays with its word. A single word is a special case: one symbol is added at the end so the style still shows a visible change.',
      },
      {
        q: 'Does the same caption always get the same sparkle pattern?',
        a: 'Yes. The style uses a stored seed, so repeating the same input produces the same symbols in the same places. That makes the result predictable when you paste the same line again, unlike a random generator that changes on every press.',
      },
    ],
    related: ['sparkle-sparkle', 'emoji-frame-sparkles', 'stars-frame', 'small-caps'],
  },

  'flipped-letters': {
    title: 'Flipped Letters Text Generator',
    description: 'Flipped Letters swaps each character for an upside-down look-alike without reversing the order. Use it for puzzles, headers and playful names.',
    h1: 'Flipped Letters Text Generator',
    lede: 'Each letter turns upside down while the line still reads left to right.',
    quick: 'Many flipped letters are IPA symbols, so a font without them may show boxes; the order stays the same on every device.',
    intro:
      'Flipped Letters replaces each basic Latin character with an upside-down look-alike but keeps the original order. An A becomes ∀, an e becomes ǝ, and the word still starts on the left and ends on the right. This is the key difference from upside-down text, which also reverses the sequence. Many of the substitutes come from the International Phonetic Alphabet or from mathematical symbols, so they are separate Unicode characters rather than a rotated font. Some letters have no convincing partner and remain upright, and digits are approximated with similar shapes. Reading takes effort because the eye must turn each glyph over while the line runs in the usual direction. That makes the style a good puzzle hint, a reveal title, a strange header or a playful display name. It is not suitable for instructions or anything read quickly. The output remains selectable text, so it can be copied, but a search for the plain word will not match it. Use short lines.',
    where:
      'The mapping covers the Latin alphabet, including separate forms for some uppercase and lowercase letters. Accented characters, punctuation, emoji and any glyph without a partner pass through unchanged, which can leave an odd upright letter in the middle of a flipped word. Spaces stay put, so word boundaries survive. Digits may be replaced by shapes that resemble them, but the resemblance is loose and a year can become hard to recognise. The order is never reversed; if you want the line to read from the right as well, choose a different style. Fonts that lack the IPA or mathematical glyphs may show boxes or fall back to a similar symbol, and a platform that normalises text may map the characters back to ordinary letters. A screen reader follows the stored characters, so it may read phonetic symbols or spell the line out. A username field may accept the characters, but a search box and a mention will not find the original spelling. Keep a plain copy.',
    examples: ['Alex Rivera', 'good vibes', 'level 42'],
    faqs: [
      {
        q: 'How is Flipped Letters different from upside-down text?',
        a: 'Flipped Letters changes only the shape of each character and keeps the order, so the line still starts at the left. Upside-down text also reverses the sequence, which is why the two styles look similar but read in opposite directions.',
      },
      {
        q: 'Why does one letter in my word stay normal?',
        a: 'The map only includes letters that have a convincing upside-down partner. An accented letter, a symbol or a letter outside that table is left as it is. That upright character can break the pattern, so choose a word made mostly of basic Latin letters.',
      },
      {
        q: 'Will a screen reader understand flipped letters?',
        a: 'It reads the characters that are stored, which are phonetic or mathematical symbols rather than the original letters. The output may sound like unrelated sounds or be spelled out letter by letter. Treat the style as a visual puzzle and give the plain wording separately.',
      },
    ],
    related: ['upside-down', 'upside-down-words', 'backwards', 'backwards-words'],
  },

  'frag-line': {
    title: 'Frag Line Text Generator',
    description: 'Frag Line sets bold letters with a strikethrough mark for game tags and Discord names. The bold base keeps the line legible; check your game field.',
    h1: 'Frag Line Text Generator',
    lede: 'Bold letters with a line through them give a game tag a scored, battle-worn look.',
    quick: 'The style needs a bold Unicode alphabet and a combining strike; a font missing either can show boxes or a detached line.',
    intro:
      'Frag Line layers two effects. First it maps basic Latin letters and digits to Mathematical Bold, which gives the line a heavy, uniform weight. Then it adds U+0336 COMBINING LONG STROKE OVERLAY to every character that is not a space or emoji, drawing a line through the middle. The name comes from shooter games, where a frag is a kill and a frag line is the running score. The result looks like a scoreboard entry that has been struck through: bold enough to read, marked enough to feel like a result. It suits clan tags, tournament handles, killfeed jokes, Discord nicknames and stream overlays. Because the letters are Unicode characters, the tag stays selectable and copies without an image. Punctuation receives the strike but not the bold mapping, so a colon or bracket can look lighter than the rest. Keep the tag short; a long line becomes a dense block. Test the exact field, because game filters differ.',
    where:
      'The bold step covers A-Z, a-z and the ten digits. The strike step then attaches U+0336 to each grapheme except spaces and emoji, so commas, hyphens and full stops also carry the line. A letter with an accent is not in the bold table and stays in the surrounding font while the rest of the word is heavy, which creates a visible seam. On a small screen the overlay can merge with the thick strokes of e, o and s, making the word hard to parse; descenders such as g, p and y can push the line off centre. Game and chat fields are inconsistent: some accept mathematical letters and combining marks, some strip the line but keep the bold, and some reject the tag outright. A strike is also semantically loaded, so a reader may think the name is cancelled or unavailable rather than scored. Spoken output usually ignores the overlay and may read the mathematical characters awkwardly. Save the field and check it on a phone.',
    examples: ['Alex Rivera', 'clan tag', 'double kill'],
    faqs: [
      {
        q: 'Where does the name Frag Line come from?',
        a: 'In shooter games a frag is a kill, and the frag count is the score. The bold letters and the line through them resemble a scored or struck-through entry on a scoreboard, so the name describes the look rather than a text command.',
      },
      {
        q: 'Why does the line sit too high on some letters?',
        a: 'The strike is a combining mark drawn by the font over the base glyph. Letters with different heights, ascenders or descenders pull the line away from the visual middle, and a bold face makes the mismatch more obvious. The character is still present even when the line looks off centre.',
      },
      {
        q: 'What happens to a game name with an accent in Frag Line?',
        a: 'The bold table covers only unaccented Latin letters and digits. An accented letter stays in the ordinary app font while its neighbours turn bold, so the word looks uneven. The strike is still added to that letter, but the weight difference remains.',
      },
    ],
    related: ['boss-mode', 'gg-frame', 'clan-tag', 'health-bar', 'bold'],
  },

  fraktur: {
    title: 'Old English Text Generator',
    description: 'Old English converts plain letters to the Fraktur blackletter alphabet. Copy the Unicode text for gothic names, titles and manuscript-style headings.',
    h1: 'Old English Text Generator',
    lede: 'Regular blackletter letters bring the look of a manuscript or an old newspaper masthead.',
    quick: 'Fraktur glyphs live in the Mathematical Alphanumeric Symbols block; a device without them may draw empty boxes.',
    intro:
      'Old English uses the regular Mathematical Fraktur alphabet, the blackletter shapes that grew out of medieval calligraphy and later appeared on newspaper mastheads, diplomas, beer labels and gothic record covers. Each basic Latin letter is replaced by its Fraktur code point, so an A becomes 𝔄 and a g becomes 𝔤. The spelling and the reading order stay the same; only the shapes change. This is the lighter, more open weight, not the heavy bold version, which makes it easier to use on a heading longer than one word. It suits a band name, a tattoo sketch, a certificate, a fantasy title or a dramatic profile line. Digits are not part of the alphabet, so a year stays in the ordinary font and creates a deliberate contrast. The output is text, not a downloadable typeface, and it copies into a caption or document. Blackletter is slow to read in bulk, so keep the line short and keep a plain version for search.',
    where:
      'The table maps A-Z and a-z only. Numbers, punctuation, accented letters, emoji and symbols remain in the surrounding typeface, which is why a date beside a blackletter name looks noticeably lighter. Several Fraktur forms are easy to confuse: the long s, the z, the k and some capitals do not resemble their modern counterparts, and a reader who does not know blackletter may misread a word. The code points sit in the Mathematical Alphanumeric Symbols block; modern phones and computers usually include them, but an older device or a stripped app can show empty boxes. Because each letter is a separate mathematical character, an ordinary search for the word often fails, and a screen reader may announce the Unicode name or spell the letters. A username field may allow the characters, while a form that checks spelling may reject them. Use the style for display and keep a plain spelling wherever someone needs to find or hear the name.',
    examples: ['Alex Rivera', 'night owl', 'Berlin 2026'],
    faqs: [
      {
        q: 'Why is Old English also called Fraktur?',
        a: 'Fraktur is the name of the blackletter type family that the Unicode alphabet reproduces. "Old English" is a popular label for the same look, especially in tattoo lettering and newspaper mastheads. The character shapes are the regular Fraktur forms, not the bold ones.',
      },
      {
        q: 'Which Old English letters are easiest to mix up?',
        a: 'The long s can look like an f, the z has an unusual tail, and several capitals differ sharply from their modern forms. A name with those letters may be misread by someone unfamiliar with blackletter. Check the result before using it on a sign or a formal document.',
      },
      {
        q: 'Why does a number stay plain in Old English text?',
        a: 'The Fraktur alphabet contains letters only, so digits are not converted and keep the app\'s normal font. The same is true for punctuation and accented letters. That contrast is part of the style, but it means a year or a price will not match the blackletter weight.',
      },
    ],
    related: ['bold-fraktur', 'boss-mode', 'bold-script', 'clan-tag'],
  },

  fullwidth: {
    title: 'Wide (Fullwidth) Text Generator',
    description: 'Wide (Fullwidth) replaces ordinary letters and digits with their fullwidth Unicode forms. Use it for roomy banners, menus and retro layouts.',
    h1: 'Wide (Fullwidth) Text Generator',
    lede: 'Fullwidth forms give every letter a square, evenly spaced body.',
    quick: 'Fullwidth letters belong to a standard Unicode block; most phones and browsers draw them, though a rare app may lack the glyphs.',
    intro:
      'Wide (Fullwidth) replaces ASCII letters and digits with the fullwidth forms from the Halfwidth and Fullwidth Forms block. Those forms exist because East Asian typography aligns Latin text to a square grid, where each character occupies the same width as a Han, kana or hangul glyph. In a Latin-only line the effect is a row of square, evenly spaced letters with generous gaps. It reads as retro, aesthetic or futuristic, and it has become a staple of vaporwave art, karaoke screens, arcade menus and banners. The style changes character identity, not font weight or letter spacing, so the output is text that can be copied into a caption, a document or a chat. Only basic letters and digits are converted; punctuation, spaces and accented letters keep their normal width, which creates a visible rhythm of wide and narrow marks. Short lines show the grid clearly. A full paragraph looks stretched and is tiring to read, so reserve the style for headings, names and display lines.',
    where:
      'The table covers the twenty-six uppercase letters, twenty-six lowercase letters and ten digits. A comma, full stop, apostrophe, hyphen or accented character is outside the table and stays narrow, so a sentence has wide letters separated by thin marks. The forms are separate code points rather than a font setting. A device without the block may draw boxes, and an app that normalises input can convert them back to ASCII, which is common in handles and search fields. The width is roughly twice that of a normal Latin character, so a line wraps sooner than expected and a bio limit fills quickly. A screen reader may treat each wide letter as its own symbol, pronounce it as the plain letter, or spell the word. East Asian readers often recognise the forms from local typesetting; other readers see a retro display face. The style does not make text bold or monospaced, because spaces and punctuation keep their ordinary width. Test the destination field.',
    examples: ['Alex Rivera', 'TOKYO 1999', 'latte run'],
    faqs: [
      {
        q: 'Where do fullwidth letters come from?',
        a: 'They belong to a Unicode block created for East Asian typesetting, where Latin text is aligned to the same square grid as Han, kana and hangul characters. The wide forms keep columns straight in that mixed-script layout. Outside that context they read as a retro display style.',
      },
      {
        q: 'Why do the spaces stay narrow in Wide (Fullwidth) text?',
        a: 'The conversion maps letters and digits only. The ordinary space is not replaced by a wide space, and punctuation keeps its normal form. That is why a phrase shows broad letters separated by narrow gaps instead of a perfectly even grid.',
      },
      {
        q: 'Can Wide (Fullwidth) text still be found by search?',
        a: 'The wide letters are separate code points, so a search for the plain spelling may miss them. Some apps normalise the characters back to ASCII when saving a name, which restores search but removes the look. Keep a plain copy if the text has to be discoverable.',
      },
    ],
    related: ['negative-circled', 'small-caps', 'bold-script', 'bold'],
  },

  'gg-frame': {
    title: 'GG Frame Text Generator',
    description: 'GG Frame brackets a short line with crossed-swords symbols for match wins, clan tags and lobby names. The words inside stay unchanged.',
    h1: 'GG Frame Text Generator',
    lede: 'Crossed swords at each end mark a line as a match result or a challenge.',
    quick: 'The crossed-swords glyph is present in most symbol fonts, but a game name filter may strip it; the inner text is untouched.',
    intro:
      'GG Frame wraps a line in U+2694 CROSSED SWORDS, one at each end. "GG" is shorthand for "good game", the sign-off players type at the end of a match, and the crossed swords reinforce the competitive setting. The style leaves every letter, number and punctuation mark between the swords exactly as typed, so a team name or a final score keeps its spelling. It suits an end-of-match message, a tournament lobby title, a clan tag, a Discord channel name or a friendly challenge. Two words keep the swords close and the frame reads as one badge; a long sentence pushes them apart and may wrap. The swords are a text character, but many systems draw them as a colour emoji, so the same tag can look flat on one screen and painted on another. The output copies as text. Some game fields restrict symbols, so keep an unframed version for strict platforms.',
    where:
      'The wrapper adds U+2694 and a plain space at both ends. The character has a text presentation and an emoji presentation; without a variation selector the device decides which to draw, so one player may see grey blades and another a brown handle and silver steel. A game or chat name field may allow only letters, digits and a few marks and will remove the swords or reject the whole tag. A score, a hyphen or a colon inside the frame is untouched. Each sword and its space counts toward a character limit, and an emoji can use more than one code unit. On a narrow phone a longer line can wrap and leave a single sword on the next row. Spoken output may say "crossed swords" before and after the words, which can sound like a challenge rather than a result. Use the frame where the match context is obvious, and preview the saved name.',
    examples: ['Alex Rivera', 'clan tag', 'GG WP'],
    faqs: [
      {
        q: 'What does GG stand for in GG Frame?',
        a: 'GG is gamer shorthand for "good game", usually typed after a match. The crossed swords around the words make that end-of-match meaning visible. The frame does not change the letters inside, so a team name or score stays exactly as written.',
      },
      {
        q: 'Why are the swords grey on one screen and coloured on another?',
        a: 'The crossed-swords character can be presented as text or as an emoji. A text font draws a flat monochrome glyph, while an emoji font supplies a coloured illustration. The platform and the presence of a variation selector decide which version appears.',
      },
      {
        q: 'Can GG Frame be used in a game display name?',
        a: 'It depends on the game. Some name fields accept the swords, others remove them, and some reject the tag entirely. The two symbols also use part of the length limit. Test the exact field and keep a plain version for platforms that filter symbols.',
      },
    ],
    related: ['frag-line', 'boss-mode', 'clan-tag', 'health-bar'],
  },

  'handle-wrap': {
    title: 'Handle Wrap Text Generator',
    description: 'Handle Wrap frames a short name in a sparkle border made from punctuation and stars. Copy it for bios, captions and profile lines.',
    h1: 'Handle Wrap Text Generator',
    lede: 'A ribbon of tiny stars and dots wraps a handle the way an old profile signature did.',
    quick: 'The border uses common punctuation and star symbols, so it usually renders; an app that bans symbols may drop the frame.',
    intro:
      'Handle Wrap uses a decorative sparkle border: a leading run of "✧･ﾟ: *" and a matching trailing "* :･ﾟ✧" around the text. The shape recalls the signatures and sparkle text that circulated on early forums, messaging profiles and social pages, where a handle sat inside a ribbon of small marks. The border is built from punctuation and a few uncommon symbols rather than from emoji, so it has a hand-drawn, nostalgic feel. The letters between the marks are not changed, which means a name keeps its spelling and can still be copied. Use it for a display name, a bio heading, a short caption or a profile line where a soft frame fits. Two or three words keep the two ends balanced; a long name pushes them apart and may wrap. The result is ordinary text and works wherever plain text is accepted, though a strict handle field may reject the symbols or cut the line. Keep a bare version for mentions and search.',
    where:
      'The border uses U+2727 WHITE FOUR POINTED STAR, U+FF65 HALFWIDTH KATAKANA MIDDLE DOT, U+FF9F HALFWIDTH KATAKANA SEMI-VOICED SOUND MARK, a colon, an asterisk and spaces. Several of those characters are uncommon, so a font may replace the small dots with a plain dot or a missing-glyph box, and the border can lose its precise shape. The text inside, including its own spaces, is untouched. The frame adds roughly a dozen characters, which matters in a bio or display-name field with a tight limit; a long handle may be truncated or wrap so that the closing half sits on a new line. A username field often allows only letters, numbers, dots and underscores and will remove the border, while a display name or caption is usually more permissive. A screen reader may read the star and punctuation as separate symbols, adding noise before the name. Use the frame for display and keep a plain handle for search and mentions.',
    examples: ['Alex Rivera', 'night owl', 'made it'],
    faqs: [
      {
        q: 'What symbols make up the Handle Wrap border?',
        a: 'The border combines a white four-pointed star, a halfwidth katakana middle dot, a halfwidth semi-voiced sound mark, a colon, an asterisk and ordinary spaces. Together they form a small ribbon that resembles early profile signatures.',
      },
      {
        q: 'Why does Handle Wrap feel nostalgic?',
        a: 'It echoes the sparkle signatures that were popular on forums, messaging profiles and early social pages. Those decorations were made from punctuation and symbol characters rather than images, which is why the same look can still be pasted as text today.',
      },
      {
        q: 'Will the frame fit in a username field?',
        a: 'Rarely. Many handle fields allow only letters, numbers, dots and underscores, and the border also adds about a dozen characters. A display name or bio is more likely to accept it. Test the exact field and keep an unframed handle for mentions.',
      },
    ],
    related: ['symbol-heart', 'small-caps', 'emoji-frame-sparkles', 'fullwidth'],
  },

  'health-bar': {
    title: 'Health Bar Text Generator',
    description: 'Health Bar separates each letter with a block and caps the line like a game meter. Use it for HUD-style tags; rendering varies by app.',
    h1: 'Health Bar Text Generator',
    lede: 'Block characters turn a word into a row of cells capped like a health meter.',
    quick: 'Block-element glyphs are common but not universal; a font missing them may draw boxes, and a game filter may reject the line.',
    intro:
      'Health Bar turns a line into a row of cells. It inserts U+25AE BLACK VERTICAL RECTANGLE between the letters of each word, then caps the result with U+258C LEFT HALF BLOCK at the start and U+2588 FULL BLOCK at the end. The separated letters resemble the segments of a game meter, and the half block and full block suggest a bar that is partly filled. It borrows the visual language of a HUD, where a health bar shows how much damage a player can still take. Use it for a player tag, a stream overlay label, a joke status line or a game-themed heading. The letters themselves are not replaced, so the word stays readable once the eye adjusts to the bars. A long word becomes very wide, and a short tag fills the meter shape best. The output is text rather than an image, so it can be pasted into a chat or a caption. Block glyphs are common but not guaranteed on every device.',
    where:
      'The separator step places a block between every pair of letters inside a word; spaces between words stay as ordinary spaces. The frame then adds a half block before the first word and a full block after the last. Only three block characters are involved, so the letters keep their normal shapes. Fonts draw block elements with different widths and heights: in a proportional face the cells may look uneven, and on a small screen the bars can overpower the text. A game or chat field may strip the blocks, and each one counts toward a length limit, so even a short tag can hit the cap. Some apps draw the vertical rectangle narrower than the full block, which makes the meter look uneven. A screen reader may announce the blocks as geometric shapes or skip them entirely, so the meter idea is visual. A descender beside a tall bar can look crowded. Test the exact tag in the app where it will appear.',
    examples: ['Alex Rivera', 'night owl', 'level 42'],
    faqs: [
      {
        q: 'What do the half block and full block do in Health Bar?',
        a: 'The half block at the start and the full block at the end close the line like the edges of a meter. The vertical rectangles between the letters suggest the segments inside it. The letters are not changed; the blocks only add the frame and the gaps.',
      },
      {
        q: 'Why is Health Bar so much longer than the word I typed?',
        a: 'The style adds one block between every pair of letters and two more at the ends. A five-letter word gains six block characters, so the line grows quickly. A bio or name field with a tight limit may cut it off.',
      },
      {
        q: 'Which devices draw the Health Bar blocks correctly?',
        a: 'Most modern phones and browsers include the block-element glyphs, but the exact width and height vary with the font. A stripped-down app or an old device may show boxes. Game fields may filter the characters. Preview the tag on the device where it will be used.',
      },
    ],
    related: ['frag-line', 'gg-frame', 'boss-mode', 'console'],
  },
};
