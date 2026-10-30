import { site } from '@/config/site.js';
import { ids, abs } from '@/services/seo.js';
import { pageMeta } from '@/lib/pages.js';
import { PRIVACY_SHORT } from '@/lib/facts.js';

// Writing guides: original articles about understanding and using styled text.
// Examples reference a style slug and a plain string; the article component
// renders them through the same Unicode engine the generator uses, so every
// example shown is real engine output rather than hand-typed characters.

export const GUIDES_PUBLISHED = '2026-10-30';
export const GUIDES_UPDATED = '2026-10-30';
/** Long form for bylines: "30 October 2026". */
export const GUIDES_UPDATED_LABEL = '30 October 2026';

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
  const meta = pageMeta({
    title: guide.metaTitle, // the builder appends the site suffix
    description: guide.metaDescription,
    path: guide.path,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Guides', path: '/guides' },
      { name: guide.title, path: guide.path },
    ],
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
    image: abs('/og-default.png'),
    isPartOf: { '@id': ids.website },
  });
  return meta;
}
