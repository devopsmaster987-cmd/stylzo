import { site } from '@/config/site.js';
import { ids, abs } from '@/services/seo.js';
import { pageMeta } from '@/lib/pages.js';
import { PRIVACY_SHORT } from '@/lib/facts.js';

// Writing guides: original articles about understanding and using styled text.
// Examples reference a style slug and a plain string; the article component
// renders them through the same Unicode engine the generator uses, so every
// example shown is real engine output rather than hand-typed characters.

export const GUIDES_PUBLISHED = '2026-11-07';
export const GUIDES_UPDATED = '2026-11-07';
/** Long form for bylines: "7 November 2026". */
export const GUIDES_UPDATED_LABEL = '7 November 2026';

/**
 * Social/featured image for a guide. `src` is served from /public, and the
 * dimensions must match the file so crawlers never re-fetch to measure it.
 * Guides without an image fall back to the site default.
 */
function guideOgImage(guide) {
  if (!guide.image?.src) return null;
  return {
    url: abs(guide.image.src),
    width: guide.image.width || 1200,
    height: guide.image.height || 630,
    alt: guide.image.alt || guide.metaTitle,
  };
}

export const GUIDES = [
  {
    slug: 'fancy-text-for-instagram-bio',
    metaTitle: 'Instagram Bio Fonts: A Practical Guide',
    title: 'How to Make a Good Instagram Bio with Fancy Text',
    metaDescription:
      'An Instagram bio gives you 150 characters. Which fancy text styles read well in a bio, which to skip, and how to build one in five short steps.',
    summary:
      'Which styles survive the 150-character bio, which to skip, and how to build a bio in five steps.',
    intro: [
      'An Instagram bio carries 150 characters of plain text, and Instagram gives you no button to make part of it bold or cursive. Fancy text fills that gap. You style a phrase here in the generator, copy it, paste it into the bio, and it shows up styled for everyone who visits your profile.',
      'This guide covers what actually survives the bio field, what a styled line costs against the 150-character budget, and a short process for building a bio that still reads like a person wrote it.',
    ],
    sections: [
      {
        heading: 'What a bio can hold',
        paragraphs: [
          'Instagram documents a 150-character limit for the bio. Every styled letter occupies one character in the field, exactly like a plain letter, so a letter-swap style does not make your text bigger. What does cost room is decoration: wrapping characters, symbols and emoji all count as characters too, and they add up faster than you expect on a two-line bio.',
          'Line breaks are allowed in a bio, and they do more for readability than any font trick. A short styled phrase on its own line reads the way a heading would; the same phrase tangled into a long sentence tends to be skipped by everyone scanning your profile.',
          'The username is the opposite story. Instagram usernames accept only letters, numbers, underscores and periods, and the handle cannot end in a period, so no pasted style survives there. Put the decoration on the Name line or in the bio, and leave the @handle plain so people can type it, search it and mention you.',
        ],
      },
      {
        heading: 'Styles that read well on a phone',
        paragraphs: [
          'Most people will read your bio on a small screen in a few seconds, so the styles that work best keep letter shapes simple and add no extra marks.',
        ],
        examples: [
          { label: 'Bold, for one strong line', style: 'bold', plain: 'Short and loud' },
          { label: 'Cursive, for a name or mood word', style: 'bold-script', plain: 'No hesitation' },
          { label: 'Small caps, for a quiet subhead', style: 'small-caps', plain: 'Aesthetic' },
        ],
        list: [
          'Bold and small-caps styles swap the letters one for one, so they add no extra characters.',
          'A cursive style suits a name or a single mood word better than a full sentence.',
          'Skip the glitch families in a bio: their stacked marks grow tall and can break the line layout on narrow screens.',
        ],
      },
      {
        heading: 'Building the bio, step by step',
        steps: [
          'Write the whole bio in plain text first. Two short lines beat one crowded paragraph, and the style pass needs somewhere to fit.',
          'Pick the one phrase that deserves the styling - usually the Name line or a short motto - and style only that phrase. Style the entire bio and nothing stands out any more.',
          'Copy the styled phrase, paste it into the bio field, and read the field again. Instagram is where the characters meet the layout, not the generator.',
          'If you want a frame or symbols around the phrase, add one element at a time and watch the character counter move. A wrapper around a long phrase is the first thing a 150-character budget will cut off.',
          'Finally, open the profile from a second device, or ask a friend to screenshot it. Rendering varies a little between phones, and this is the cheapest way to catch a missing shape before a reader does.',
        ],
      },
      {
        heading: 'Frames, symbols and what they cost',
        paragraphs: [
          'Wrapping a line in decorative characters can look deliberate and tidy when the words inside stay short. The wrapping characters are Unicode symbols like the styled letters themselves, which is why they travel through copy and paste together.',
        ],
        examples: [
          { label: 'A handle with a soft frame', style: 'handle-wrap', plain: 'sam' },
          { label: 'One symbol on each side of a line', style: 'symbol-sparkle', plain: 'quiet mind' },
        ],
        paragraphs2: [
          'One caution: a framed line reads as decoration, not as information. Keep one framed element in a bio at most, and keep the words inside it strong enough to carry their own meaning without the frame. Two frames crowd each other, and both push against the same character budget.',
        ],
      },
      {
        heading: 'When a change does not show up',
        paragraphs: [
          'Profiles are cached on both Instagram sides: the app may show your old bio for a while after you save a new one. Save the profile, close it, and reopen the app before assuming the paste failed. If a specific line still looks wrong after a reload, check it on the web version of the profile, and compare word by word against the styled line in the generator.',
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Styling every line of the bio. Pick one or two elements; the rest stays plain and stays readable.',
        'Closing the profile page before looking at the result. The app is the only test that counts.',
        'Stacking emoji frames on top of symbol frames. They crowd each other and both count against the limit.',
        'Trying to force a styled @handle. That field accepts a fixed alphabet, and pasted styling is dropped there.',
      ],
    },
    faq: [
      {
        q: 'Do fancy text styles actually work in Instagram bios?',
        a: 'Usually, yes. Instagram renders ordinary Unicode letters in the bio and caption fields on current mobile and desktop builds, and bold, cursive and small-caps styles are widely used there. Check your own line once in the app, because occasional devices may draw a rarer symbol differently.',
      },
      {
        q: 'Can I use fancy text for my username?',
        a: 'No, not in the @username itself. Instagram usernames accept letters, numbers, underscores and periods, with a documented length cap, so styling pasted there does not survive. The Name line and the bio are where decoration belongs. Rules change, so check the app\u2019s current help page before you commit to a name.',
      },
      {
        q: 'Does styled text take up more space in the bio?',
        a: 'The styled letters do not: a bold letter is still one character. Frames, symbols and emoji around the text do consume characters from the 150, so spend them on one deliberate element rather than across the whole bio.',
      },
      {
        q: 'What if my styled name shows plain for some friends?',
        a: 'The characters are identical on every device; what differs is whether each device has a shape for them. A phone with narrower font coverage can fall back to boxes or plain forms. Reading your own profile from a second device, or on a friend\u2019s screen, tells you quickly.',
      },
    ],
    tryIt: { href: '/styles/instagram', label: 'the Instagram font generator' },
    related: [
      { slug: 'copy-and-paste-fancy-text', label: 'copying and pasting on each device' },
      { slug: 'when-not-to-use-fancy-text', label: 'where styling does more harm than good' },
    ],
  },
  {
    slug: 'stylish-usernames',
    metaTitle: 'Stylish Usernames: How to Build One',
    title: 'How to Make a Stylish Username (and What to Avoid)',
    metaDescription:
      'A stylish username has to survive real fields with real limits. How to design one, where styled names actually work, and what gets rejected.',
    summary:
      'Where styled usernames work, where they are rejected, and how to design one that still looks good.',
    intro: [
      'A stylish username has two jobs that fight each other. It has to look distinctive, and it has to be accepted by a signup field that often refuses unusual characters. Most styled-name failures are not bad taste: the name was fine, but the field it lives in has rules the style violated.',
      'This guide separates those field rules from the design advice, then walks through a process that ends with a username you have actually verified in the app it must live in.',
    ],
    sections: [
      {
        heading: 'Which platforms are strict',
        paragraphs: [
          'The strict fields are the handle-style ones. Instagram, for example, documents a username alphabet limited to plain letters, numbers, underscores and periods within a 30-character range, and TikTok runs the same narrow pattern for its own handle; Facebook documents a name policy for profiles that excludes symbols entirely. On those fields a fully cursive handle is not possible, and pasting one gets it rejected or stripped.',
          'Display names are looser. The TikTok nickname (30 characters, documented), the Instagram Name line, Discord nicknames and most in-game name fields accept ordinary Unicode text, and that is where styles live. A few games and services go further and lock their name fields to a fixed built-in alphabet, so there is no styled letter that will survive - the field decides, not the theory. These rules are not permanent: platforms tighten and loosen them without announcement, so check the help page of the app you are targeting before you depend on a name.',
        ],
      },
      {
        heading: 'Styles that stay legible on a small screen',
        paragraphs: [
          'A username is read at a glance, often in a friends list or a chat header, so short, cleanly-drawn styles beat decorative ones.',
        ],
        examples: [
          { label: 'Bold sans, clearly different from plain', style: 'sans-bold', plain: 'Sniper' },
          { label: 'Small caps, tidy and short', style: 'small-caps', plain: 'Wolf' },
          { label: 'A bracketed gaming tag', style: 'clan-tag', plain: 'Fox' },
        ],
        paragraphs2: [
          'Notice what these have in common: each letter is swapped for a single character, letters keep their shapes, and nothing hangs above or below the line. A name you can read in a millisecond at 3 a.m. in a lobby is worth more than an elaborate one.',
        ],
      },
      {
        heading: 'Design it in five steps',
        steps: [
          'Start from the base word. No amount of styling rescues a name you would not wear plain.',
          'List where the name must live: a handle field, a nickname field, a game name field - each with its own rules and limits.',
          'Build two variants: one styled (a single letter-swap style such as bold or small caps) and one plain form that fits every handle field exactly, using underscores or periods where decoration is not allowed.',
          'Test the styled variant by pasting it into the real field, saving it, then reading it on the smallest screen that will show it.',
          'Keep both versions in a note. If a platform later filters a character out of existing names, you want the plain fallback to hand.',
        ],
      },
      {
        heading: 'The invitation problem',
        paragraphs: [
          'One limitation comes from the fact that nobody can type a styled name on a keyboard. Friends cannot type it to search for you, and quick "add me" messages have to be sent as copy-paste text. That is precisely why platform handle fields stay plain - they exist so a person can type a name and land on a profile.',
          'It also quietly helps to be at least half findable. A profile that people can locate by typing, from a search box or a group roster, grows through friends; a profile that only opens through a saved style can be invisible however good it looks.',
          'If being found quickly matters, use the styled form where it is wanted and keep the plain handle for anything that depends on someone typing your name: friend codes, search boxes, invites.',
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Pasting a styled handle into a strict field and assuming it worked. Those fields expect rejection; always re-read the field after saving.',
        'Choosing a style that is unreadable at a glance. Leaderboards and chat headers give you a moment, not a study session.',
        'Adding stacked-mark styles to a username. Some sites filter those characters, and the ones that accept them often wrap the line.',
        'Decorating the one field people type, and leaving the display field plain. Decorate the display name; keep the address findable.',
        'Forgetting to count. Every field caps its length, styled characters count like any other, and the check takes seconds.',
      ],
    },
    faq: [
      {
        q: 'Which styles are least likely to be rejected?',
        a: 'Letter-swap alphabets such as bold, sans-bold and small caps behave like normal text in a field that accepts Unicode, because they add no characters and change no structure. Framing and stacking styles are more likely to hit a filter or wrap a line.',
      },
      {
        q: 'Why did my friend see plain text where I styled it?',
        a: 'Rendering depends on the fonts installed on the device doing the viewing. On older systems and in some apps a look-alike alphabet can fall back to plain forms or boxes, which is another reason to check your name on the devices your friends actually use.',
      },
      {
        q: 'Does a styled username change the character count?',
        a: 'A pure letter-swap keeps the count identical: one character in, one character out. Frames, brackets and stacked marks all add characters, and every field counts them against its own limit.',
      },
      {
        q: 'Can I style my name on Facebook?',
        a: 'Facebook documents a name policy for profiles that rules out symbols and unusual characters, and a styled name can be reported or reverted. Use the fields designed for what you want - a nickname feature where offered - rather than treating look-alike letters as a loophole. The policy is Facebook\u2019s to change, so check its current help pages for names before you style anything for a profile.',
      },
    ],
    tryIt: { href: '/fonts/sans-bold', label: 'the bold sans text generator' },
    related: [
      { slug: 'fancy-text-for-gaming-names', label: 'the gaming-name version of this problem' },
      { slug: 'why-fancy-text-shows-boxes', label: 'why an accepted name can still show boxes' },
    ],
  },
  {
    slug: 'what-is-unicode-text',
    metaTitle: 'What Fancy Text Really Is: Unicode Explained',
    title: 'What Is Unicode Fancy Text and How Does It Work?',
    metaDescription:
      'Fancy text is not a font. It is ordinary letters swapped for look-alike characters defined by the Unicode standard. Here is how that works, in plain words.',
    summary:
      'The mechanics: fonts versus character maps, the Unicode blocks behind the styles, and why the result pastes anywhere.',
    intro: [
      'Fancy text looks like a font change, but no font is involved. Each style on this site is a table of replacements: when the engine meets the ordinary letter a, it swaps in a different Unicode character that resembles a bold, cursive or circled a.',
      'That single sentence explains most of what people notice later. It is why the result pastes into apps that know nothing about this generator, why no installation is needed on either side, and why the text still has to be drawn by a font in the app it lands in.',
    ],
    sections: [
      {
        heading: 'Fonts change shapes; character swaps change letters',
        paragraphs: [
          'A font is a design for ordinary characters. When you open a word processor and pick a typeface, the letters underneath stay the same - that is why the text remains searchable and consistent everywhere - but the design only appears on devices where that font is installed.',
          'A character swap works on the letters themselves. Your a becomes a different, rarer character before it leaves the generator. The characters carry their appearance inside the text, the way emoji and accented letters do, so no viewer has to install anything.',
        ],
      },
      {
        heading: 'What a code point is',
        paragraphs: [
          'Unicode is the standard that gives every character in the world a number, called a code point. Ordinary a lives at U+0061. The bold capital A belongs to a different block, at U+1D400, and 47 of its neighbours form a full bold alphabet. The cursive-style H is U+210B in the Letterlike Symbols block, the circled S is U+24C8 under Enclosed Alphanumerics, and the fullwidth a is U+FF41 in its own range.',
          'A style is simply a mapping: plain letter to code point from one of those alphabets. The engine walks your text and replaces each letter with its partner. Underline and strikethrough work differently - they keep your letters and append a combining mark to each one, which the device draws above or below the letter that came with it.',
        ],
      },
      {
        heading: 'Is this the same thing as emoji?',
        paragraphs: [
          'Emoji are Unicode characters too, but they are defined as pictures with their own meaning, so an emoji reads as an emoji no matter what surrounds it. The look-alike alphabets are the opposite: each is a letter first, and its meaning is whatever word you were typing.',
          'That split shows up in practice. Emoji have keyboard panels everywhere and are drawn by nearly any app, while a styled word needs a generator or a copy - and the reading device still needs a glyph for the letter it is given.',
        ],
      },
      {
        heading: 'The families behind the styles',
        paragraphs: [
          'Each family comes from a different part of the standard, and each brings its own look and quirks.',
        ],
        examples: [
          { label: 'Bold, from the Mathematical Alphanumeric block', style: 'bold', plain: 'Styled text' },
          { label: 'Cursive, from the Script block', style: 'script', plain: 'Dreamer' },
          { label: 'Monospace, the typewriter family', style: 'monospace', plain: 'code block' },
          { label: 'Fullwidth, from East Asian typesetting', style: 'fullwidth', plain: 'aesthetic' },
          { label: 'Circled, from Enclosed Alphanumerics', style: 'circled', plain: 'Sunny day' },
        ],
      },
      {
        heading: 'What stays true after styling',
        paragraphs: [
          'The result is still text. It can be selected, copied, quoted and converted back, and it never degrades the way an image does when it is zoomed or recompressed. Letter-swap styles also keep the character count: the bold version lands at two characters, the same as plain typing.',
          'What changes is search and typing. No keyboard produces these letters, so nobody can retype your styled phrase, and a search for the plain word does not match the styled one. That is the trade: the styling travels with the text, but the ability to type it does not.',
        ],
      },
      {
        heading: 'Why some of it flows badly',
        paragraphs: [
          'All of this relies on the reading device having a shape for each character. Apps bundle their own fonts, and older or simpler systems have less of the standard. When a shape is missing, most apps draw an empty box in its place - which is why some devices and some apps behave very differently for the same line.',
        ],
      },
    ],
    tips: {
      heading: 'Quick tips',
      items: [
        'Swap one phrase, not a paragraph: character swaps shine on short display lines, not long reading.',
        'Combinations are just text too: bold plus underline is a letter swap plus a combining mark, applied in one pipeline.',
        'Treat emoji as content and styled letters as typography: they coexist fine, but each does a different job.',
        'If you need the plain version back, retype it, or run styled text through a text fixer that can restore letter-swap alphabets.',
      ],
    },
    faq: [
      {
        q: 'Is fancy text a hack or anything sketchy?',
        a: 'No. The characters it uses are standard, published Unicode. The result is plain text with unusual characters in it, which every text-capable app already understands.',
      },
      {
        q: 'Where do all the strange letters come from?',
        a: 'From blocks of the Unicode standard: Mathematical Alphanumeric Symbols, Letterlike Symbols, Enclosed Alphanumerics, small capitals, plus combining marks for underline and strike effects. A generator maps your ordinary letters onto one of those alphabets.',
      },
      {
        q: 'Does the generator store my text?',
        a: `No. ${PRIVACY_SHORT} The conversion happens on your device, which is also why the site feels instant with long inputs.`,
      },
      {
        q: 'Can styled text be made plain again?',
        a: 'Often, yes. A reversing table can turn a letter-swap alphabet back, combining marks can be stripped, and reversed text is reversed again. A text fixer does this kind of cleanup on pasted text.',
      },
    ],
    tryIt: { href: '/', label: 'the Stylzo text generator' },
    related: [
      { slug: 'why-fancy-text-shows-boxes', label: 'what happens when a glyph is missing' },
      { slug: 'fancy-text-accessibility', label: 'how screen readers handle it' },
    ],
  },
  {
    slug: 'why-fancy-text-shows-boxes',
    metaTitle: 'Why Fancy Text Shows Boxes - and How to Fix It',
    title: 'Why Fancy Text Sometimes Shows as Boxes or Question Marks',
    metaDescription:
      'Boxes mean the device has no shape to draw for that character. Why it happens, how to test for it, and which styles are least likely to run into it.',
    summary:
      'Why missing glyphs appear as boxes, how to test for them, and which styles are most likely to survive.',
    intro: [
      'A box or a question mark where a letter should be is not damage, and it is not proof that a generator broke the text. It is the receiving device saying, in its own way, that it has no drawing for that character. The character is still in your text; the machine showing it is missing a shape.',
      'This guide unpacks that: what a missing glyph is, why two devices disagree, and a short procedure for finding the problem on the device that matters - the one your reader actually uses.',
    ],
    sections: [
      {
        heading: 'What a box really is',
        paragraphs: [
          'When an app meets a character it cannot draw, it has to show something. Most draw an empty rectangle (often called tofu), some print a question mark, and a few quietly drop the character. None of these change the text underneath: the display is the substitution, not the content.',
          'A question mark can also be a deliberate placeholder the app inserts for any character outside the ranges it accepts, which is common in fields that restrict input. In all three cases the honest description is the same: the text is fine, the display is missing a glyph.',
        ],
      },
      {
        heading: 'Why two devices disagree',
        paragraphs: [
          'Devices differ by operating system version and by app. A current phone ships with a font that covers more of the Unicode standard than a five-year-old computer does. Apps add their own fonts on top: a game, a browser and a bank app on the same phone can each have different coverage, so one line can render perfectly in the browser and box out inside another app.',
          'Enclosed letters add a second wrinkle: a subset of them carries an emoji presentation on some platforms, drawn as a coloured tile rather than as a letter. That is a difference in how the device chooses to draw a valid character - not a corrupt one.',
        ],
      },
      {
        heading: 'Styles most likely to travel badly',
        paragraphs: [
          'Roughly: enclosed shapes and stacked marks ask more of a font than plain alphabets do.',
        ],
        examples: [
          { label: 'Filled tiles: may render as emoji', style: 'negative-circled', plain: 'Night' },
          { label: 'Square frames: patchy on older systems', style: 'squared', plain: 'Boxed' },
          { label: 'Parenthesised letters: limited coverage', style: 'parenthesized', plain: 'subtle' },
          { label: 'Stacked marks: can overflow a line', style: 'zalgo-light', plain: 'Hi' },
        ],
        paragraphs2: [
          'None of these styles is broken. Each simply has a higher chance of meeting a font without its shapes, which is why every style page here states a support level rather than promising the same behaviour everywhere.',
        ],
      },
      {
        heading: 'Find the problem before your reader does',
        steps: [
          'Reproduce what your reader will see: open the styled line in the exact app, on the exact device, where it is supposed to appear.',
          'When results differ between devices, compare them side by side. Same characters, different drawing - that contrast is the fastest diagnosis there is.',
          'If a critical field is the one failing, swap to a plainer style. Bold and small caps ask for nothing unusual; filled tiles ask for a lot.',
          'Remember the field itself: some inputs reject characters they will never render, and no style survives being stripped at input.',
        ],
      },
      {
        heading: 'The quick sanity checks',
        list: [
          'Paste the line into a plain note app. If the letters survive there, the characters are intact and the problem is the other app\u2019s font.',
          'Count if it matters: a letter-swap style keeps your character count, so a box is not evidence that something snuck into the text.',
          'Ask the person you sent it to what they see. One screenshot settles a debate that two people can argue about for days.',
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Retyping the sentence by hand and blaming the paste. Characters do not degrade in copy and paste; check the display font instead.',
        'Testing only on your own phone. The reader\u2019s device is the one that has to have the shapes.',
        'Assuming a box means the whole style is unworkable. Most styles have a plainer sibling that draws the same message safely.',
        'Keeping no plain contact route. An inbox made of ordinary letters is the one address nobody can mistype or misrender.',
      ],
    },
    faq: [
      {
        q: 'Did copying break the characters?',
        a: 'Almost never. Copy and paste move characters exactly as they are. A box appears when the app at the far end has no drawing for one of them, not because the characters arrived wrong.',
      },
      {
        q: 'Can the reader install a font to fix it?',
        a: 'On a desktop it is possible, and that is the classic fix for a missing glyph - but it is rarely practical, because every recipient would need the same install in every app they read you in. A plainer style is the realistic move.',
      },
      {
        q: 'Why does one style work for me and its neighbour does not?',
        a: 'The two styles draw on different Unicode blocks, and your device\u2019s fonts cover one more completely than the other. That is why support is stated per style here rather than as one blanket claim.',
      },
      {
        q: 'My friend\u2019s phone showed a question mark instead. Is that the same thing?',
        a: 'In effect, yes. Some apps substitute a question mark instead of an empty box for a character they cannot draw. The cause and the fix are the same: the character is intact, and the display needs a font with the shape.',
      },
    ],
    tryIt: { href: '/fonts/sans', label: 'the clean sans-serif style' },
    related: [
      { slug: 'what-is-unicode-text', label: 'what a glyph is and where these letters come from' },
      { slug: 'copy-and-paste-fancy-text', label: 'testing a paste device by device' },
    ],
  },
  {
    slug: 'fancy-text-accessibility',
    metaTitle: 'Fancy Text and Screen Readers',
    title: 'Fancy Text and Accessibility: What Screen Readers Read Out Loud',
    metaDescription:
      'Styled letters are real characters, and screen readers may read them by their Unicode names, spell them out or skip them. What worsens reading, and what to do instead.',
    summary:
      'How assistive tech tends to treat styled characters, what makes reading worse, and how to keep a page readable.',
    intro: [
      'Styled text replaces characters rather than applying a formatting flag, and that distinction decides everything for assistive technology. A screen reader, a dictation tool and a translation app all receive the look-alike characters as new letters, not as "this sentence, bolded".',
      'The honest summary is that behaviour varies. Some display alphabets are read letter by letter without much trouble in many readers; others can be pronounced oddly, announced with a technical name, or passed over. This guide sticks to what is dependable: what tends to happen, what makes it worse, and how to keep the useful text plain while keeping the fun parts styled.',
    ],
    sections: [
      {
        heading: 'What tends to happen to styled letters',
        paragraphs: [
          'A screen reader reads the character code that is actually there, so a look-alike alphabet may be sounded out like ordinary letters, announced by its formal Unicode name, spelled letter by letter, or skipped. Behaviour differs by reader, browser and device; no single description covers every combination.',
          'Because results differ between screen reader, browser and device, the fair statement is: letter-swap styles may read fine, may read strangely, or may be skipped, depending entirely on the equipment the listener has. That range is why the practical advice is about placement, not prohibition.',
          'None of this is exotic for the engine - the reader deals in code points all day, and accented letters, emoji and punctuation are all handled the same way. Styled letters simply belong to ranges that some pronunciation tables cover better than others.',
          'A quick self-check costs nothing: open the finished phrase on a second device, or turn on the assistive speech feature your own system already ships, and listen to how your name or line comes across. One trial is evidence about your devices only - other listeners may hear something different - but it beats guessing about a phrase you plan to keep.',
        ],
      },
      {
        heading: 'What makes reading worse',
        paragraphs: [
          'Three things reliably add difficulty, and each one follows from how the characters are built.',
          'Length: a whole paragraph of swapped letters asks a listener to assemble every word from individually pronounced letters. A sentence styled as a deliberate accent is one thing; body copy styled throughout is unusable as reading matter.',
          'Stacked marks: the glitch and heavy-decoration families attach many marks to each letter. A reader may announce every mark or insert long pauses, either of which destroys the word it decorates.',
          'Symbol frames: decorative symbols around a line are characters too, and a screen reader may give each one its spoken name between your words. The visual is quiet; the audio is not.',
        ],
        examples: [
          { label: 'Struck through: marks attached to every letter', style: 'strike', plain: 'mistake' },
          { label: 'Small caps: a different letter range', style: 'small-caps', plain: 'Hello' },
          { label: 'Light stack: attached marks per letter', style: 'zalgo-light', plain: 'corrupt' },
        ],
      },
      {
        heading: 'A workable rule: decorate the accent, not the information',
        paragraphs: [
          'Keep any information that must be understood in plain text, and let styled characters finish the visual job around it. On a profile, that means a styled mood line is fine while the handle, contact details and the meaningful lines stay plain. On a web page, it means a styled part of a heading is fine while the heading is still mostly ordinary words.',
          'The same split serves search and memory as well as assistive tech: somebody looking for your page, quoting it, or reading it back later needs the plain version, and the styled version is a nice-to-have rather than a substitute.',
        ],
      },
      {
        heading: 'What nice styling looks like in practice',
        paragraphs: [
          'A practical recipe: one short styled phrase, everything else plain; no stacked marks on text someone will need to read; symbol frames on their own line, if at all; and if a phrase carries facts - dates, names, links - it goes in plain text first and stays there.',
        ],
        examples: [
          { label: 'Plain bold, no attached marks', style: 'bold', plain: 'Hi' },
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Putting the only copy of essential information inside a heavily styled phrase.',
        'Using stacked-mark styles on text that is meant to be understood rather than seen.',
        'Filling a bio with styled prose from top to bottom: a listener hears letters, and a scanner loses the thread.',
      ],
    },
    faq: [
      {
        q: 'Does fancy text break screen readers?',
        a: 'Not reliably "break", and not for every listener: a short styled phrase often reads as letters without real problems. But behaviour really does vary between devices and readers, with some engines skipping or mispronouncing these characters, so styled text is a poor carrier for essential meaning.',
      },
      {
        q: 'Which styles are friendliest to a screen reader?',
        a: 'Short letter-swaps such as bold on a word or two. They add no extra characters, keep letter shapes simple, and need no interaction with combining marks or symbols; on many readers they will be pronounced as letters, and even where that happens imperfectly the phrase is short.',
      },
      {
        q: 'What do symbol- and emoji-wrapped lines sound like?',
        a: 'Possibly like a list: some readers announce each symbol\u2019s spoken name as it is reached, so a frame could add a spoken word between your words. Keep frames short when they appear at all, and keep them far from the essential content.',
      },
      {
        q: 'Should I abandon styled text?',
        a: 'No - scope it. Use it as display on short phrases, keep meaningful copy plain, and a styled accent can coexist with good readability everywhere on your profile or page.',
      },
    ],
    tryIt: { href: '/fonts/bold', label: 'the bold text generator' },
    related: [
      { slug: 'what-is-unicode-text', label: 'how the character swaps work under the hood' },
      { slug: 'when-not-to-use-fancy-text', label: 'other places where plain text wins' },
    ],
  },
  {
    slug: 'fancy-text-for-gaming-names',
    metaTitle: 'Gaming Names: Do\u2019s and Don\u2019ts of Fancy Text',
    title: 'Fancy Text for Gaming Names: Do\u2019s and Don\u2019ts',
    metaDescription:
      'Where styled names survive in games and Discord, why some name fields refuse them, and how to keep one readable in a lobby or a leaderboard.',
    summary:
      'Where decorated names work in games and Discord, where they are refused, and how to keep one readable.',
    intro: [
      'A gaming name is a display object first: it appears in a lobby list, a scoreboard or a friends menu, usually small, often for a quarter of a second. That context drives most of the advice below - what helps is short, clean and easy to pick out of twenty rows.',
      'Gaming fields also include some of the most restrictive name inputs anywhere people paste styled text, so the useful skill is knowing which name field you are filling rather than hoping the roster accepted a fancy handle.',
    ],
    sections: [
      {
        heading: 'One name, several fields',
        paragraphs: [
          'Many games and stores split naming into at least two fields: the account identifier that other systems match against, and the display name shown beside your actions. The identifier is usually strict - often plain letters and numbers on a server that matches names exactly, while the display field is usually more relaxed and is where decoration can flourish.',
          'Discord follows the same shape: the account username stays in its documented letters-and-numbers pattern, while the display nickname accepts ordinary Unicode text in many cases. Whether it happens in a game client, a launcher or a chat app, the pattern repeats: find the field that exists for showing off, and put the styling there.',
        ],
        examples: [
          { label: 'A clan tag with built-in brackets', style: 'clan-tag', plain: 'Wolf' },
          { label: 'Console-style caps', style: 'console', plain: 'Sniper' },
          { label: 'A short frame for a post-match post', style: 'gg-frame', plain: 'GG' },
        ],
      },
      {
        heading: 'Styles that hold up in a lobby list',
        paragraphs: [
          'Names are drawn with whatever fonts the game or app uses, so the styles that survive are the ones whose characters are widely available on desktop and mobile systems alike.',
        ],
        examples: [
          { label: 'Bold sans, readable at small sizes', style: 'sans-bold', plain: 'Wanderer' },
          { label: 'Alternating case with a strike, broken-terminal look', style: 'glitch-alternate', plain: 'user' },
        ],
        paragraphs2: [
          'Keep the base word short. Spacing and letter widths get stretched inside styled-made fields on some screens, and a five-letter name has far more room for error than a fifteen-letter one.',
        ],
      },
      {
        heading: 'Clan tags and prefixes',
        paragraphs: [
          'A tag is the smallest slot of all - two to six characters carried beside the name - and its job is recognition, not poetry. The bracketed tag style here draws on the monospace letterforms, whose shapes line up in a column, which is part of why a bracketed tag looks tidier than a decorated full name.',
          'Agree the tag with the group before anyone changes a name. A prefix that only half the group wears reads as two sets of members, and the character rules for tags on some games are stricter than the rules for the name field beside them.',
        ],
      },
      {
        heading: 'What to skip in a name, and why',
        list: [
          'Heavy stacked marks: they grow above and below the line, can bulge a list row, and some platforms filter those characters outright.',
          'Enclosed tiles and boxed shapes: they may be drawn as emoji on some systems, so one name can change appearance between devices.',
          'Very long names: styled text can wrap inside friend lists and leaderboards, which is bad for the row that has to stay on one line.',
          'Frames crowded against frames: one short frame is a statement; three of them are noise in a small cell.',
        ],
      },
      {
        heading: 'Testing a name before committing',
        steps: [
          'Style the candidate in the generator and copy it.',
          'Paste it into the real field and save it, then look at the name where the game actually shows it: lobby list, scoreboard, friends menu.',
          'View it from a second device, ideally one with different age or platform, since rendering depends on device fonts.',
          'Check whether others can read it out loud. If a friend stumbles over it once, it will be worse in text chat.',
          'Keep a plain backup of the same name in a note, in case the field later rejects a pasted character or you switch platforms.',
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Assuming every game accepts the same characters: some name fields are locked to a narrow alphabet, and no exception is made for clever pastes.',
        'Using stacked-mark names where the roster row has to fit one line: density is the enemy of a readable scoreboard.',
        'Decorating the account identifier, which is the one string that must match exactly, instead of the display name.',
      ],
    },
    faq: [
      {
        q: 'Can a fancy-text name get my account in trouble?',
        a: 'Styled text is ordinary characters, not a cheat, so the styling itself is not a violation. Rules still apply to the name you choose: policies on impersonation or misleading tags are ordinary rules, and they apply the same way whether a name is styled or plain.',
      },
      {
        q: 'Why does my name render differently for friends?',
        a: 'Rendering depends on the fonts on the device doing the drawing, so your styled glyphs may fall back to other forms or boxes on a system with less coverage. Testing from a second device is the only honest preview available.',
      },
      {
        q: 'How will people find me with a styled name?',
        a: 'Search and friend matching compare typed characters, and no normal keyboard can type look-alike letters, so exact search usually fails. Keep the findable form in your friend code or account field, and style the display name.',
      },
      {
        q: 'Do fences or brackets slow the game down?',
        a: 'No. A decorated name is a few extra characters in a string; performance is not affected. The reason for restraint is legibility and field acceptance, not speed.',
      },
    ],
    tryIt: { href: '/fonts/clan-tag', label: 'the clan tag generator' },
    related: [
      { slug: 'stylish-usernames', label: 'the same problem off the scoreboard' },
      { slug: 'why-fancy-text-shows-boxes', label: 'why a saved name can still render as boxes' },
    ],
  },
  {
    slug: 'copy-and-paste-fancy-text',
    metaTitle: 'Copy and Paste Fancy Text: Phone and PC',
    title: 'How to Copy and Paste Fancy Text on Phone and Computer',
    metaDescription:
      'Styled characters travel as plain text, so a paste is just a paste. The exact steps on iPhone, Android, Windows and Mac, plus fixes for pastes that fail.',
    summary:
      'Device-by-device steps for copying and pasting styled text, and fixes for the pastes that misbehave.',
    intro: [
      'Copy and paste is all the transport this text needs: the styling lives inside the characters, so any app that accepts text accepts the styled version, and there is no formatting to lose on the way.',
      'What differs between devices is just the gesture - which button copies, which menu pastes. Below are the exact paths for iPhone, Android, Windows and Mac, then a set of fixes for the pastes that go wrong.',
    ],
    sections: [
      {
        heading: 'On iPhone or iPad',
        steps: [
          'Type your words into the generator and pick a style.',
          'Tap the Copy button beside the style you chose; the result is placed on the clipboard as ordinary text.',
          'Open the app where the text belongs, tap and hold inside the input field, then choose Paste.',
          'If nothing pastes, tap once inside the field first so the cursor is placed, then tap and hold. A field with no focus will not paste.',
        ],
      },
      {
        heading: 'On Android',
        steps: [
          'Type into the generator, choose the style, and tap Copy.',
          'In the receiving app, tap and hold the field, then select Paste. Depending on the keyboard, you may instead choose from a clipboard list.',
          'If the pasted line looks different from the preview, compare the two app by app: the characters arrive identical, so the difference is rendering on that device.',
        ],
      },
      {
        heading: 'On Windows and Mac',
        steps: [
          'Windows: select the styled text, press Control-C to copy, and Control-V to paste. Right-click menus offer the same tools as Copy and Paste.',
          'Mac: select the text, press Command-C, then Command-V.',
          'Moving between machines: carry a styled phrase in a note or an email draft to yourself. Nothing converts text faster - and the characters survive in either.',
          'One habit worth adopting from the start: copy the style and immediately paste it into a low-stakes place - a new note or a draft - to confirm the characters made it before they head into a real bio or form. Re-copying a line into thin air is easy to misread.',
        ],
      },
      {
        heading: 'Keep a snippet file for reuse',
        paragraphs: [
          'Because the styled versions are characters, they can live in a note, a draft email or a document just like ordinary text. A short note with your usual heading, handle line and motto means a whole bio is one copy away, and you can update the plain version next to it without hunting through the generator for each one.',
          'Organise by destination, not by style. A heading for each place the phrase tends to go - profile, username preview, chat signature - and you avoid restyling the same sentence weekly.',
          'This habit pays off twice. It documents what you have already tested, so the styles that survived your devices stay reachable, and it keeps the plain words of each phrase beside the styled ones for the day a field wants them back.',
        ],
      },
      {
        heading: 'What copy cannot fix',
        paragraphs: [
          'A paste moves characters, not outcomes. If the destination field has a length cap, the cut happens in the field after the paste, so shorten the phrase before copying rather than hoping the field is generous.',
          'And if a paste arrives plain where you expected styling, investigate the field before re-copying. Some inputs transform what you give them - a common one strips characters outside a fixed alphabet - and no number of fresh pastes overcomes that.',
        ],
      },
      {
        heading: 'When a paste goes wrong',
        list: [
          'Boxes in the destination: that app\u2019s font lacks the shapes. Switch to a plainer style rather than fighting the app.',
          'Characters swallowed: some helpers treat rare letters as accidental input and replace them. Paste once, look immediately, then undo and retype if the field changed anything.',
          'Line breaks collapsed or split: some fields handle newlines differently around pasted text, so set breaks while in the field.',
          'Extra spaces or stray punctuation: a text fixer can collapse spacing, remove repeated words and clean punctuation in one pass.',
          'Pasted nowhere: the field silently ignored unusual characters. Some inputs accept a fixed alphabet; use your plain fallback there instead of arguing.',
        ],
      },
    ],
    tips: {
      heading: 'Quick tips',
      items: [
        'Copy from the generator rather than retyping: these characters are not on any keyboard.',
        'If the browser\u2019s copy button is blocked, select the styled text directly and copy it - the characters are the same either way.',
        'Paste once and eyeball immediately. Reading the result in the destination is the only correct test.',
        'Keep the plain words beside the styled ones in your note. If a field ever rejects the style, the plain phrase is the restore point.',
      ],
    },
    faq: [
      {
        q: 'Does styling survive the clipboard?',
        a: 'Fully. There is no formatting attached: each styled letter is a different character, and the clipboard moves characters exactly. What may differ afterwards is only how the next app draws them.',
      },
      {
        q: 'Can I paste styled text into any app?',
        a: 'Into anything that accepts plain text, yes; the characters will appear there. A few apps restyle their input fields, some restrict characters, and a handful have fonts that cannot draw a particular glyph; those are the ones where boxes appear.',
      },
      {
        q: 'Why does the text look different on my friend\u2019s phone?',
        a: 'The characters are identical; the drawing is not. Different devices and apps carry different fonts, and a missing glyph shows as a box or another fallback shape there.',
      },
      {
        q: 'The copy button refused. What now?',
        a: 'Browsers generally require a permission click before a web page may write to the clipboard. Allow the prompt, or select the styled text and use your normal copy shortcut - the result is the same characters either way.',
      },
    ],
    tryIt: { href: '/fonts/bold', label: 'the bold text generator' },
    related: [
      { slug: 'fancy-text-for-instagram-bio', label: 'where those pastes usually land' },
      { slug: 'how-to-make-fancy-text', label: 'the full style-copy-paste loop' },
      { slug: 'why-fancy-text-shows-boxes', label: 'what to do when the paste shows boxes' },
    ],
  },
  {
    slug: 'when-not-to-use-fancy-text',
    metaTitle: 'When Not to Use Fancy Text',
    title: 'When Not to Use Fancy Text (Resumes, Email, Search, Forms)',
    metaDescription:
      'Resumes, email, search boxes and forms need ordinary letters. Where styled text costs you, what to use instead, and where it still makes sense.',
    summary:
      'Four places where styled text actively costs you, and what to do instead in each.',
    intro: [
      'Styled text is a display tool. It works by replacing ordinary letters with look-alike characters, which is a power move in a bio and a mistake in a job application. The places to avoid are exactly the ones that expect to match, search, or process the letters you send.',
      'Here are the four contexts that trip people up most often, the reason each one fails, what to do instead, and where styling still earns its keep.',
    ],
    sections: [
      {
        heading: 'Resumes and application forms',
        paragraphs: [
          'A r\u00e9sum\u00e9 is usually read twice: first by applicant-tracking software that looks for words, then by a human. Both stages assume ordinary letters. A style-swapped heading or skill word may be stored as a different string of characters, which can prevent a keyword match - or the parser may not handle the characters cleanly at all.',
          'Do the styling with formatting tools instead. A word processor or a real bold in a PDF applies an actual format while the letters stay themselves, so the parser still reads the same characters and the human still sees the emphasis.',
          'The cost of getting it wrong is not always dramatic, which makes it easy to miss: a keyword stored as different characters does not raise an error, the application simply competes in a search it never matched.',
        ],
      },
      {
        heading: 'Search and finding things back',
        paragraphs: [
          'Search matches characters. The letters you type in a search box are the ordinary ones, and a styled heading stores look-alike characters, so one does not match the other. That applies to search engines, find-in-page, catalogue searches and site filters alike.',
          'If it matters that people find the item - a page, a product, a profile - at least one plain, searchable copy of the phrase should exist. That is also why the platform you are publishing on will usually have its own, deliberately plain fields for names and tags.',
        ],
        examples: [
          { label: 'A small-caps word: not letters a keyboard can type', style: 'small-caps', plain: 'Search' },
        ],
      },
      {
        heading: 'Email and anything a confirmation needs',
        paragraphs: [
          'Email carries no formatting of its own, and readers vary widely; look-alike characters are fine in a short signature accent, but the subject line and body copy are safer as ordinary text, both for readability and for any filter that reads the words.',
          'Examples: a confirmation code, an address, a phone number, an order or booking reference. Any of these may be matched exactly by a system later, and a styled look-alike fails that match. Keep the letters where something is being matched exactly always plain.',
        ],
      },
      {
        heading: 'Forms, passwords and machine-read fields',
        list: [
          'Contact, account and checkout forms: validated against ordinary letters, so look-alikes may be rejected or stored wrong.',
          'Passwords and password hints: typed on a keyboard by definition, so a styled character simply cannot be entered - the field needs ordinary letters.',
          'Discount codes, serial codes and tracking numbers: these are exact strings, and a decorative letter does not match.',
          'Fields read or merged by scripts: the same reasoning, and the failure is silent.',
        ],
      },
      {
        heading: 'Where stylish text still belongs',
        paragraphs: [
          'Profile bios and display names; short chat accents and headline decorations; images such as the font studio where a PNG of styled text is the intended product. In each one a human reads without a machine pulling quotes or matching strings, and the letters look-alike without a cost.',
          'The dividing line is easy to apply: if the next reader is a person glancing at it and no machine will sort, confirm or look up the string, styling is playable. If a machine will read it - or it will be re-typed or matched by a person later - keep the ordinary alphabet.',
        ],
      },
    ],
    tips: {
      heading: 'Quick tips',
      items: [
        'Style the accent, keep the substance: decoration looks deliberate when the surrounding words stay plain.',
        'Where the app has real formatting - email editors, Markdown platforms, word processors - that route beats character swaps.',
        'Before pasting anywhere official, ask what will happen next: who or what needs to read it again.',
        'Anything that will be retyped later - a handle someone copies from a screenshot, a code read from a photo - needs ordinary letters to exist somewhere.',
      ],
    },
    faq: [
      {
        q: 'Can my resume use one small styled element?',
        a: 'It is not worth the risk: applicant software may store the swapped characters as different letters and miss the match. Use the real bold or italics in the document for every heading and skill, and let design come from the layout itself.',
      },
      {
        q: 'Do search engines read the styled characters?',
        a: 'They may be able to index them as characters, but that is different from matching the plain word someone types. For anything you want found in search or in-page, the plain version is the one that reliably matches.',
      },
      {
        q: 'Is a decorative email signature okay?',
        a: 'A symbol divider or a heart is low-risk decoration that email readers handle. Swapping the letters of your name or your company name is less safe, since both may be quoted, searched and filtered.',
      },
      {
        q: 'What about pasting styled text into an online form?',
        a: 'Expected to fail: forms usually validate against ordinary letters and may reject or mangle look-alikes. Use plain text everywhere in a form, and keep codes, names and passwords strictly on the ordinary alphabet.',
      },
    ],
    tryIt: { href: '/universal-text-fixer', label: 'the text fixer' },
    related: [
      { slug: 'fancy-text-accessibility', label: 'what screen readers do with styled text' },
      { slug: 'fancy-text-for-instagram-bio', label: 'where styling works in your favour' },
    ],
  },
  {
    slug: 'fancy-text-for-whatsapp',
    metaTitle: 'Fancy Text for WhatsApp: Name, Status and Chats',
    title: 'Fancy Text for WhatsApp: Names, Statuses and Chat Signatures',
    metaDescription:
      'WhatsApp shows plain Unicode text in names, statuses and messages. Which fancy styles read well in a status, where a styled name is rejected, and how to paste one that survives.',
    summary:
      'Which styles work in a WhatsApp status or display name, where the field rules bite, and a paste workflow that holds up.',
    intro: [
      'WhatsApp does not ship a bold or cursive button for your status, your display name or a chat message. Fancy text fills that gap the same way it does on every other app: you style a phrase here, copy the characters, and paste them into the field. The styling lives inside the letters, so WhatsApp receives ordinary text and shows it styled for everyone who reads it.',
      'This guide covers the three places people actually paste styled text in WhatsApp - the display name, the About/status line and messages - which styles survive each one, and the field rules that catch people out.',
    ],
    sections: [
      {
        heading: 'Where styled text can go in WhatsApp',
        paragraphs: [
          'WhatsApp splits identity into a few fields with different rules. Your phone number is the account key and cannot be styled. The display name (what contacts see) accepts ordinary Unicode text on current builds, so letter-swap styles usually paste and save. Your About line - often used as a status - is free text with a documented length cap, and it accepts the same characters your keyboard can produce, including styled ones.',
          'In-chat messages are the loosest surface of all: any Unicode character that your device can send will arrive as those characters. The catch is not WhatsApp refusing the text; it is whether the receiving phone has shapes to draw for it.',
        ],
      },
      {
        heading: 'Styles that read well in a status line',
        paragraphs: [
          'A status is scanned in a list of contacts, usually one line at a time. Short letter-swap styles keep the line tidy; wrappers and stacked marks eat the length cap and wrap badly.',
        ],
        examples: [
          { label: 'Bold, for a short status', style: 'bold', plain: 'Quiet weekend' },
          { label: 'Cursive, for a mood line', style: 'bold-script', plain: 'Still here' },
          { label: 'Small caps, for a tidy sub-line', style: 'small-caps', plain: 'Available' },
          { label: 'A light frame for a name plate', style: 'handle-wrap', plain: 'Sam' },
        ],
        paragraphs2: [
          'Each of these swaps one character for one character, so the styled version costs no more of the status limit than plain typing. Frames and symbols add characters of their own; use at most one of them, and keep the words inside short enough to finish the line.',
        ],
      },
      {
        heading: 'Display name versus phone number',
        paragraphs: [
          'The display name is the field built for how you want to appear. It accepts ordinary Unicode text, so a styled first name or nickname usually saves and shows on your contacts\' lists. The phone number underneath stays plain by design: it is how WhatsApp addresses the account, and no styling can or should change it.',
          'If a styled display name looks plain for some contacts, compare devices. The characters are identical everywhere; a phone with narrower font coverage may fall back to plain forms. Keep a plain version of the same name ready in case a contact needs to find you by typing.',
        ],
        examples: [
          { label: 'A display name in bold', style: 'sans-bold', plain: 'Amina' },
          { label: 'A nickname in small caps', style: 'small-caps', plain: 'Leo' },
        ],
      },
      {
        heading: 'Chat signatures and group names',
        paragraphs: [
          'A signature line you paste at the end of a message, or a short styled phrase inside a group announcement, is decoration on top of ordinary conversation. Keep it to one short line: a long styled paragraph is slower to read and harder for anyone to quote back.',
          'Group names are set by admins and accept Unicode text on current builds. A styled group name can look deliberate in the chat list, but test it from a second device first - the same missing-glyph rules apply, and a group title full of boxes is worse than a plain one.',
        ],
        examples: [
          { label: 'A one-line chat signature', style: 'symbol-sparkle', plain: 'sent with care' },
          { label: 'A bracketed group tag', style: 'clan-tag', plain: 'Weekend' },
        ],
      },
      {
        heading: 'Paste workflow that holds up',
        steps: [
          'Type the phrase in plain text first, then style only the part that deserves it.',
          'Copy the styled result from the generator, then paste it into a note or draft message once to confirm the characters arrived intact.',
          'Paste into the real WhatsApp field - display name, About or message - and read the field again before you leave it.',
          'Open the chat or profile from a second device, or ask a contact what they see. That is the only honest preview of another phone.',
          'Keep the plain phrase beside the styled one in your notes. If a field later rejects a character, or a contact cannot find you, the plain form is the restore point.',
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Styling the phone number or expecting the About field to accept an endless wrapper. Both are ordinary text fields with ordinary limits.',
        'Wrapping a long status in symbols: every wrapper character counts against the length cap and crowds the line.',
        'Assuming every contact sees the same glyphs. Rendering depends on the reading device, not on WhatsApp alone.',
        'Decorating the only name people can type to find you. Keep a plain contact route.',
      ],
    },
    faq: [
      {
        q: 'Does fancy text work in WhatsApp status and About?',
        a: 'Usually, yes. Both fields render ordinary Unicode letters on current mobile builds, and bold, cursive and small-caps styles are widely used there. Check your own line once after saving, because a rare symbol can still draw differently on an older phone.',
      },
      {
        q: 'Can I style my WhatsApp display name?',
        a: 'The display name accepts ordinary Unicode text on current builds, so a letter-swap style often pastes and saves. Your phone number stays plain by design. If a styled name shows plain for some contacts, that is font coverage on their device - keep a plain version ready.',
      },
      {
        q: 'Why did my friend see boxes where I styled the status?',
        a: 'The characters arrived intact; their phone has no drawing for one of them, so the app substitutes an empty box. Swap to a plainer style such as bold or small caps rather than fighting the device.',
      },
      {
        q: 'Do styled messages send slower or get filtered?',
        a: 'No. A decorated name or status is a few extra characters in a string; delivery is unaffected. The reason for restraint is legibility and the length cap, not performance.',
      },
    ],
    tryIt: { href: '/styles/whatsapp', label: 'the WhatsApp font generator' },
    related: [
      { slug: 'copy-and-paste-fancy-text', label: 'the exact paste steps on each device' },
      { slug: 'fancy-text-for-instagram-bio', label: 'the same problem on Instagram' },
    ],
    image: {
      src: '/guides/fancy-text-for-whatsapp.png',
      alt: 'Fancy text for WhatsApp: bold and cursive styles ready to paste into a status or display name',
      width: 1200,
      height: 630,
      caption: 'Styles that survive a WhatsApp status line: one character in, one character out.',
    },
  },
  {
    slug: 'tiny-and-small-text',
    metaTitle: 'Tiny Text Generator: Superscript and Small Caps',
    title: 'Tiny and Small Text: Superscript, Small Caps and What Actually Shrinks',
    metaDescription:
      'Tiny text is not a smaller font - it is a different Unicode alphabet. How superscript and small-caps styles work, where they render, and when a "tiny" style will not look tiny.',
    summary:
      'Why superscript and small caps look small, which devices draw them, and how to pick a tiny style that survives paste.',
    intro: [
      'People search for a tiny text generator expecting smaller letters. What they get is a character swap: the ordinary letter is replaced by a look-alike from a superscript or small-capital alphabet, and the device draws that character at whatever size its font decides. On a phone that ships those glyphs, the line looks genuinely smaller. On a device missing them, the same line can fall back to boxes or plain forms.',
      'This guide separates the two families that carry the "tiny" look, explains what each one costs in compatibility, and shows a short process for choosing a style that still reads after it leaves the generator.',
    ],
    sections: [
      {
        heading: 'Two families, two different jobs',
        paragraphs: [
          'Superscript letters sit raised and reduced in many fonts: they are a real Unicode alphabet (the Superscripts and Subscripts block, plus a few Letterlike forms), so a phrase styled in superscript looks small and elevated on devices that have the shapes. Small caps are a different alphabet again: capitals drawn at a smaller uniform height, which reads as quiet and tidy rather than raised.',
          'Neither family changes the font size of your text. The apparent shrink comes from the glyph design itself. That is why the same "tiny" line can look perfect on one phone and ordinary on another - the characters either exist there or they do not.',
        ],
        examples: [
          { label: 'Superscript: raised and reduced', style: 'superscript', plain: 'tiny line' },
          { label: 'Small caps: quiet capitals', style: 'small-caps', plain: 'Quiet Line' },
          { label: 'Subscript: dropped below the line', style: 'subscript', plain: 'footnote' },
        ],
      },
      {
        heading: 'Where tiny text survives',
        paragraphs: [
          'Short labels, social bios, watermarks on a caption and decorative sub-lines are the natural homes for a tiny style. Long body copy is not: a whole paragraph of superscript is harder to read and asks more of every device that opens it.',
        ],
        list: [
          'Instagram or TikTok bio sub-lines, when the phrase is short.',
          'Discord or game nicknames, if the field accepts Unicode and the row has room.',
          'Caption footers and photo credits that should recede rather than shout.',
          'Anywhere a single word needs to look deliberately small next to plain text.',
        ],
        paragraphs2: [
          'Avoid forms, emails, search boxes and anything that must be retyped. No keyboard produces these letters, so nobody can type your tiny phrase to find it - keep a plain twin for that job.',
        ],
      },
      {
        heading: 'Why a "tiny" style sometimes looks normal',
        paragraphs: [
          'Three common causes, in the order they usually show up. First: the receiving font draws superscript at nearly full size, so the characters exist but do not shrink. Second: the style you picked is small caps rather than superscript, and small caps are capitals at a reduced height, not raised letters - a different aesthetic, not a failure. Third: a missing glyph fell back to a plain letter or a box, and the line quietly stopped being tiny.',
          'The fix is the same in all three cases: test the pasted line on the device that matters, and switch family if the look is wrong. Superscript for raised and reduced; small caps for quiet capitals; fullwidth or circled when you need something else entirely.',
        ],
        examples: [
          { label: 'Raised superscript again, for comparison', style: 'superscript', plain: 'Compare' },
          { label: 'Circled, when raised letters are missing', style: 'circled', plain: 'Alt' },
        ],
      },
      {
        heading: 'A short selection process',
        steps: [
          'Decide the job: raised watermark, quiet capitals, or a dropped footnote mark. Each job maps to a different family.',
          'Style a two- or three-word sample, not a paragraph. Tiny styles are judged on a short line.',
          'Paste into the real destination and read it there - bios, nicknames and captions each draw differently.',
          'Check a second device if the line will be seen by other people. Missing glyphs are invisible on your own phone.',
          'Keep the plain words next to the styled ones so anyone who cannot see the shapes still has the text.',
        ],
      },
      {
        heading: 'Numbers in tiny styles',
        paragraphs: [
          'Superscript includes digit forms, so years, counts and ordinals can ride raised with the letters. Small caps generally does not restyle digits the same way; a number next to small-caps letters may stay full height, which is fine if the contrast is deliberate. For a fully enclosed look - digits inside bubbles or squares - use a circled or squared style instead of a tiny one.',
        ],
        examples: [
          { label: 'Raised digits with letters', style: 'superscript', plain: 'Top 10' },
          { label: 'Enclosed digits when tiny is not enough', style: 'circled', plain: '2026' },
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Pasting a whole paragraph of superscript into a bio or status. Short lines only.',
        'Expecting every phone to shrink superscript the same way. Glyph coverage decides the final look.',
        'Confusing small caps with superscript. One is quiet capitals; the other is raised and reduced.',
        'Deleting the plain version of a phrase someone may need to search or type.',
      ],
    },
    faq: [
      {
        q: 'Is tiny text a real font size?',
        a: 'No. It is a character swap into a superscript or small-capital alphabet. The apparent size comes from the glyph design, not from a font-size change, which is why devices without those glyphs fall back to plain letters or boxes.',
      },
      {
        q: 'Which style is the smallest?',
        a: 'Superscript usually reads as the smallest because the letters are raised and reduced together. Small caps looks quieter but keeps capital shapes. Actual size still depends on the font drawing the line on the reading device.',
      },
      {
        q: 'Can I use tiny text in a username?',
        a: 'Only where the field accepts Unicode. Handle fields that lock to plain letters and numbers will reject or strip the style. Put the tiny line on a display name or bio, and keep the typed handle plain.',
      },
      {
        q: 'Why does my superscript show as boxes?',
        a: 'The receiving app or phone has no shape for those characters. Copy still moves the characters correctly; the display is missing a glyph. Switch to a plainer style such as small caps or bold for that destination.',
      },
    ],
    tryIt: { href: '/fonts/superscript', label: 'the superscript text generator' },
    related: [
      { slug: 'why-fancy-text-shows-boxes', label: 'what happens when a tiny glyph is missing' },
      { slug: 'what-is-unicode-text', label: 'where these alphabets come from' },
    ],
    image: {
      src: '/guides/tiny-and-small-text.png',
      alt: 'Tiny text examples: superscript and small-caps styles that look smaller without changing font size',
      width: 1200,
      height: 630,
      caption: 'Superscript and small caps: two Unicode alphabets that read as tiny.',
    },
  },
  {
    slug: 'how-to-make-fancy-text',
    metaTitle: 'How to Make Fancy Text (Any Device, Free)',
    title: 'How to Make Fancy Text on Phone or Computer',
    metaDescription:
      'A five-step way to turn plain words into fancy Unicode text you can paste anywhere: pick a style, copy the characters, paste them, test the destination, keep a plain twin.',
    summary:
      'The plain workflow for making fancy text: style, copy, paste, test on the real device, keep a plain backup.',
    intro: [
      'Making fancy text is not installing a font or learning an editor. It is a five-step loop: type your words, swap them into a Unicode style, copy the characters, paste them where they belong, and check the result on the device that will show it. No account, no download, and nothing to install on either end.',
      'This guide is the whole loop in order, with the decisions that matter at each step and the fixes for the two things that go wrong: a paste that arrives plain, and a line that shows boxes.',
    ],
    sections: [
      {
        heading: 'Step 1: write the plain version first',
        paragraphs: [
          'Type the full phrase exactly as you want it to read - name, status, caption, signature. Styling is a pass over finished words, not a substitute for writing them. A short line is easier to style, easier to paste and easier to read once it lands.',
          'Keep that plain version. It is your restore point if a field rejects the style, your fallback for search boxes and forms, and the text anyone can still type if their phone cannot draw the styled letters.',
        ],
      },
      {
        heading: 'Step 2: pick one style that fits the destination',
        paragraphs: [
          'One phrase, one style. Letter-swap families - bold, cursive, small caps, monospace, fullwidth - change the alphabet without adding characters, so they travel through copy and paste cleanly. Wrapper and stacked-mark styles add decoration and sometimes extra characters; they suit a short accent, not a full sentence.',
        ],
        examples: [
          { label: 'Bold, the default strong line', style: 'bold', plain: 'Make it clear' },
          { label: 'Cursive, for a name or mood', style: 'script', plain: 'Daydream' },
          { label: 'Small caps, for a quiet label', style: 'small-caps', plain: 'Note' },
          { label: 'Monospace, for a code-like tag', style: 'monospace', plain: 'tag-01' },
          { label: 'Fullwidth, for a wide aesthetic line', style: 'fullwidth', plain: 'wide look' },
        ],
      },
      {
        heading: 'Step 3: copy the characters, not a picture',
        paragraphs: [
          'Fancy text here is ordinary Unicode characters, not an image and not a font file. When you copy, the clipboard carries the characters themselves. Any app that accepts text accepts them; there is no formatting to lose on the way.',
          'If a copy button is blocked by the browser, select the styled line and use the normal copy shortcut. The result is the same characters either way.',
        ],
      },
      {
        heading: 'Step 4: paste into the real field',
        steps: [
          'Open the destination - bio field, status, chat box, game name, document - and place the cursor in it.',
          'Paste once, then read the field immediately. The destination is where characters meet layout, limits and fonts.',
          'Save if the field has a save step, then reopen or refresh. Some apps cache the old value briefly.',
          'If the paste arrives plain, the field is transforming or restricting input: switch to a plainer letter-swap style, or use the plain version in that field and keep the styled line for display surfaces.',
        ],
      },
      {
        heading: 'Step 5: test on the device that matters',
        paragraphs: [
          'Your phone may draw every glyph perfectly while a friend\'s older handset shows boxes. That is font coverage on their side, not damage to your text. The cheapest honest test is a second device, or a screenshot from the person who will actually read the line.',
          'When a critical line fails, step down: bold and small caps ask for nothing unusual; enclosed tiles and heavy stacked marks ask for a lot. One plainer style that survives everywhere beats a spectacular one that boxes out half the time.',
        ],
        examples: [
          { label: 'A safe default after a failed test', style: 'sans-bold', plain: 'Still works' },
        ],
      },
      {
        heading: 'The two failures, diagnosed',
        list: [
          'Paste arrived plain: the destination stripped or ignored characters outside its alphabet. Re-read the field after saving; use a style that only swaps letters, or keep the plain form there.',
          'Boxes or question marks: the reading device has no glyph for one of the characters. Characters did not break in transit - switch style or switch device for the preview.',
          'Line wrapped or truncated: a length cap or a narrow column. Shorten the phrase before copying rather than hoping the field is generous.',
          'Looks different on each phone: expected. Rendering is chosen by the font on each device; compare side by side when it matters.',
        ],
      },
    ],
    tips: {
      heading: 'Quick tips',
      items: [
        'Style one accent phrase, not the whole paragraph. Decoration reads as deliberate when the rest stays plain.',
        'Paste once and eyeball immediately - the destination is the only test that counts.',
        'Keep plain and styled twins of anything important in a note, organised by where each one goes.',
        'When in doubt, step down to bold or small caps. They survive more fields and more fonts than any decorative family.',
      ],
    },
    faq: [
      {
        q: 'Do I need to install a font or an app?',
        a: 'No. The style is a character swap done before you copy, and the result travels as plain text. Nothing has to be installed on your device or on the reader\'s.',
      },
      {
        q: 'Is fancy text free to use?',
        a: 'Yes. The characters come from the Unicode standard rather than a licensed typeface, so the generated text is yours to use on any platform that accepts plain text.',
      },
      {
        q: 'Can I make fancy text on iPhone and Android the same way?',
        a: 'Yes. The workflow is identical; only the copy and paste gestures differ. Type, style, copy, paste into the field, then verify on the phone that will show it.',
      },
      {
        q: 'Why can nobody type my fancy name to search for me?',
        a: 'No keyboard produces look-alike letters, so exact search and friend matching against the styled form usually fail. Keep the plain handle or name as the typed route, and use the styled version for display.',
      },
    ],
    tryIt: { href: '/', label: 'the Stylzo text generator' },
    related: [
      { slug: 'copy-and-paste-fancy-text', label: 'device-by-device paste steps' },
      { slug: 'what-is-unicode-text', label: 'what is actually happening under the hood' },
    ],
    image: {
      src: '/guides/how-to-make-fancy-text.png',
      alt: 'How to make fancy text: type plain words, pick a Unicode style, copy and paste the result',
      width: 1200,
      height: 630,
      caption: 'The whole workflow: plain words in, styled Unicode characters out.',
    },
  },
  {
    slug: 'fancy-numbers',
    metaTitle: 'Fancy Numbers: Styled Digits You Can Paste',
    title: 'Fancy Numbers: Styled Digits for Bios, Captions and Tags',
    metaDescription:
      'Fancy number text is a Unicode digit swap, not a new font. Which styles enclose or raise digits, where they render, and how to keep counts readable.',
    summary:
      'How styled digits work, which families enclose or raise numbers, and where a fancy number still reads cleanly.',
    intro: [
      'A fancy number is the same trick as fancy letters: the ordinary digit is replaced by a look-alike from a Unicode alphabet - circled, squared, superscript, fullwidth - before it leaves the generator. The characters travel as text, so they paste into bios, captions and tags the same way styled names do.',
      'Digits have fewer alphabets than letters, and not every style restyles them. This guide covers which families actually change a number, where the result still reads, and how to keep a count understandable when the decoration gets heavy.',
    ],
    sections: [
      {
        heading: 'Which styles change a digit',
        paragraphs: [
          'The families with real digit coverage are the ones worth knowing. Enclosed styles - circled and squared, filled or open - put each number in a frame. Superscript raises and reduces digits for a watermark look. Fullwidth widens them to match a wide letter line. Small caps and bold often leave digits at full height beside restyled capitals, which can be a deliberate contrast rather than a miss.',
        ],
        examples: [
          { label: 'Circled digits', style: 'circled', plain: '2026' },
          { label: 'Squared digits', style: 'squared', plain: '42' },
          { label: 'Filled bubbles', style: 'negative-circled', plain: '7' },
          { label: 'Raised superscript digits', style: 'superscript', plain: 'Top 10' },
          { label: 'Wide fullwidth digits', style: 'fullwidth', plain: '100' },
        ],
      },
      {
        heading: 'Where a fancy number still reads',
        paragraphs: [
          'Short, isolated numbers do best: a year in a bio, a rank in a caption, a level or score in a gaming tag, a countdown fragment. A long ID, a phone number, a price that must be compared, or anything someone will retype stays plain - decorative digits are harder to read aloud and impossible to type back.',
        ],
        list: [
          'Bio lines: a single year or a short rank next to plain words.',
          'Captions and comments: one highlighted count when the surrounding sentence is ordinary text.',
          'Gaming tags and clan labels: a short enclosed number that matches the bracketed name style.',
          'Anniversary or countdown accents, when the date itself is also written in plain text somewhere nearby.',
        ],
      },
      {
        heading: 'Readability when the line mixes letters and digits',
        paragraphs: [
          'Mixed lines - letters in one style, digits in another, or digits left plain beside styled letters - need one clear hierarchy. Enclosed digits next to plain bold letters usually work: the frame marks the number, the words stay easy to scan. Enclosed letters and enclosed digits together can crowd a short row.',
        ],
        examples: [
          { label: 'Plain words, framed number', style: 'bold', plain: 'Level' },
          { label: 'Framed number beside the word', style: 'circled', plain: '9' },
          { label: 'One style for both, when the line is short', style: 'superscript', plain: 'S2' },
        ],
        paragraphs2: [
          'If the number must be compared - scores on a leaderboard, prices in a list - keep every digit in the same plain form so the eye can line them up. Decoration belongs on labels, not on data.',
        ],
      },
      {
        heading: 'Testing a styled number',
        steps: [
          'Style only the digits you need, then copy them with any short label around them.',
          'Paste into the real field - bio, caption, tag, profile - and read it in place.',
          'Check a second device. Enclosed and raised digits are more likely to miss a glyph than plain letters.',
          'Say the line out loud or ask someone to. If the number is hard to read back, it is hard to use.',
          'Keep the plain digits beside the styled ones for anything that will be typed, searched or dialled.',
        ],
      },
    ],
    tips: {
      heading: 'Common mistakes',
      items: [
        'Styling a phone number, OTP, price or ID. Those strings must be typeable and unambiguous.',
        'Wrapping every digit in a caption. One framed number is an accent; a row of framed numbers is noise.',
        'Mixing two enclosed styles on the same short line. They compete for the same visual job.',
        'Assuming every style restyles digits. Check the preview - small caps and bold often leave numbers unchanged.',
      ],
    },
    faq: [
      {
        q: 'What is a fancy number text generator?',
        a: 'It swaps ordinary digits for look-alike Unicode characters - circled, squared, superscript, fullwidth and friends - before you copy them. The result is still text, so it pastes anywhere plain digits would.',
      },
      {
        q: 'Do all fancy text styles change numbers?',
        a: 'No. Families with explicit digit coverage (circled, squared, superscript, fullwidth and several filled variants) change them. Others, including many small-caps and bold styles, leave digits at normal height beside restyled letters.',
      },
      {
        q: 'Can I use styled digits in a username or handle?',
        a: 'Only where the field accepts Unicode. Handle fields locked to plain letters and numbers will reject or strip them. Put the styled number on a display name or bio, and keep any typed identifier plain.',
      },
      {
        q: 'Why does a circled number show as an emoji on my friend\'s phone?',
        a: 'Some enclosed characters carry an emoji presentation on certain platforms and are drawn as a coloured tile. The character is valid; the device chose a picture-like rendering. A different enclosed style, or plain digits, avoids that ambiguity.',
      },
    ],
    tryIt: { href: '/fonts/circled', label: 'the circled text generator' },
    related: [
      { slug: 'tiny-and-small-text', label: 'raised and quiet alphabets for short labels' },
      { slug: 'why-fancy-text-shows-boxes', label: 'what happens when a digit glyph is missing' },
    ],
    image: {
      src: '/guides/fancy-numbers.png',
      alt: 'Fancy numbers: circled, squared and superscript digits styled with Unicode and ready to paste',
      width: 1200,
      height: 630,
      caption: 'Styled digits from three families: enclosed, squared and raised.',
    },
  },
].map((guide) => ({
  ...guide,
  path: `/guides/${guide.slug}`,
  published: GUIDES_PUBLISHED,
  updated: GUIDES_UPDATED,
}));

const bySlug = new Map(GUIDES.map((g) => [g.slug, g]));

export function getGuide(slug) {
  return bySlug.get(slug);
}

/**
 * The pages, with a summary line each. Used by the /guides index, the
 * ItemList it emits and the sitemap.
 */
export function guideEntries() {
  return GUIDES.map((g) => ({ slug: g.slug, path: g.path, title: g.title, summary: g.summary }));
}

/**
 * Article metadata: the usual page meta from the shared builder, plus one
 * Article node naming the site as author and publisher. Pushed into `ld`
 * before the lazy JSON-LD getter is first read, so both the metadata and the
 * page render emit it.
 */
export function guideMeta(guide) {
  const image = guideOgImage(guide);
  const meta = pageMeta({
    title: guide.metaTitle, // the builder appends the site suffix
    description: guide.metaDescription,
    path: guide.path,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
      { name: guide.title, path: guide.path },
    ],
    ...(image ? { images: [image] } : {}),
  });
  meta.ld.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${abs(guide.path)}#article`,
    headline: guide.title,
    datePublished: guide.published,
    dateModified: guide.updated,
    inLanguage: 'en',
    // The visible byline on the article is the owner's name; the node references
    // the same person so structured data cannot disagree with the page.
    author: {
      '@type': 'Person',
      name: site.ownerName,
      '@id': abs('/#owner'),
    },
    publisher: { '@id': ids.organization },
    mainEntityOfPage: { '@id': `${abs(guide.path)}#webpage` },
    image: image
      ? {
        '@type': 'ImageObject',
        url: image.url,
        width: image.width,
        height: image.height,
        caption: guide.image.alt || guide.metaTitle,
      }
      : abs('/og-default.png'),
    isPartOf: { '@id': ids.website },
  });
  return meta;
}
