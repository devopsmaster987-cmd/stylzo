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
/**
 * The image compressor at /image-compression.
 *
 * Held here with the rest of the answer-engine copy for the same reason: the
 * text below is rendered as visible page copy AND emitted as Question/Answer
 * schema, so the structured data can never claim something a visitor cannot
 * read.
 *
 * The privacy answer is the load-bearing one. A tool that asks for image files
 * is assumed to upload them unless the page says otherwise in the first
 * sentence, and an answer engine quoting a vague "secure" claim is worse than no
 * answer at all. It is not vague here: the images are decoded and re-encoded on
 * the visitor's own device and no request carrying one is ever made.
 */
export const IMAGE_COMPRESSOR_ANSWER = {
  q: 'What does this image compressor do?',
  a: 'It compresses JPG, PNG and WebP images in your browser and reports the real file size before '
    + 'and after. Nothing is uploaded: each image is decoded and re-encoded on your own device using '
    + 'a canvas, so no file is ever sent to a server. Set a quality level between 10% and 100%, resize '
    + 'by width or height with the aspect ratio preserved, choose an output format, then download the '
    + 'images one at a time or all together.',
};

export const IMAGE_COMPRESSOR_QA = [
  {
    q: 'Are my images uploaded anywhere?',
    a: 'No. Every image is decoded and re-encoded by your own browser, on your own device, using a '
      + 'canvas element. The page makes no request containing your image, there is no storage, and '
      + 'closing the tab discards everything. This is the same position the rest of this site takes '
      + 'with typed text.',
  },
  {
    q: 'How much can an image actually be compressed?',
    a: 'It depends entirely on the source. A photograph that has already been through a compressor '
      + 'usually saves 30 to 70 per cent at 80% quality. A PNG screenshot is already lossless, so it '
      + 'saves almost nothing unless you resize it or convert it to WebP. The honest answer is that '
      + 'a large saving means a visible quality cost, and the percentage this tool reports is measured '
      + 'from the real bytes it produces rather than estimated.',
  },
  {
    q: 'What quality setting should I use?',
    a: '80% is the default and the right choice for images on the web: the file gets noticeably '
      + 'smaller and most people cannot tell the difference at normal viewing size. Use 90% or above '
      + 'when the image will be printed or edited again, 60 to 70% for thumbnails, and expect visible '
      + 'banding and artefacts below 50%, especially across skies and smooth gradients.',
  },
  {
    q: 'Does resizing change my image aspect ratio?',
    a: 'Not unless you ask it to. While the aspect-ratio lock is on, typing a width computes the '
      + 'height for you and typing a height computes the width. Turn the lock off and fill in both '
      + 'fields to stretch the image deliberately, which is almost never what you want for a photo.',
  },
  {
    q: 'Which output format should I choose?',
    a: 'Keep the original format unless you have a reason to change it. WebP is usually 25 to 35 per '
      + 'cent smaller than JPEG at the same perceived quality and is the better default for the web, '
      + 'because it also keeps transparency. PNG is the safe choice when you need lossless pixels or '
      + 'sharp edges, such as a screenshot or a logo that will be scaled up. JPEG cannot hold '
      + 'transparency at all, so choosing it for an image that has any flattens that transparency '
      + 'onto a solid white background, and the tool warns you when it detects that it is about to.',
  },
  {
    q: 'Why did my PNG get bigger instead of smaller?',
    a: 'PNG is lossless, so the quality slider has nothing to work on and re-encoding a flat-colour '
      + 'image often adds a little overhead rather than removing any. To actually shrink a PNG, '
      + 'resize it to the dimensions you need, or convert it to WebP or JPEG, both of which are '
      + 'designed to discard detail the eye cannot see at that size.',
  },
  {
    q: 'Is there a limit on how many images I can compress?',
    a: 'Up to 20 images per batch and 25 MB per image, with a ceiling of 16,000 pixels on a side '
      + 'and 40 megapixels in total. Those limits exist so that decoding a very large file cannot '
      + 'exhaust the memory of a phone, not to restrict normal use: they are far above what a web '
      + 'page normally serves. Nothing is queued or stored, so there is no cap on how much you '
      + 'compress over the course of a visit.',
  },
];

/**
 * The QR code generator at /qr-code-generator.
 *
 * Held here with the rest of the answer-engine copy for the same reason as the
 * image compressor above: the text below is rendered as visible page copy AND
 * emitted as Question/Answer schema, so the structured data can never claim
 * something a visitor cannot read.
 *
 * The privacy answer is the load-bearing one here too, and for this tool it is
 * stronger than "we do not log it". This page asks for Wi-Fi passwords, phone
 * numbers and contact details. Those are the exact values a generator must never
 * transmit, so the answer is not that they are handled carefully but that they
 * are never sent: the symbol is built by the visitor's own browser and there is
 * no request that could carry one.
 */
export const QR_GENERATOR_ANSWER = {
  q: 'What does this QR code generator do?',
  a: 'It builds a scannable QR code for a website, plain text, a Wi-Fi network, an email address, a '
    + 'phone number, an SMS message, a WhatsApp chat, a contact card, a map location or a calendar '
    + 'event, and lets you change the colors, size, error correction and logo before downloading it '
    + 'as a PNG, SVG or JPG. The code is generated in your browser, so nothing you type is uploaded '
    + 'and there is no account to create.',
};

export const QR_GENERATOR_QA = [
  {
    q: 'What is a QR code?',
    a: 'A QR code is a two-dimensional barcode that a phone camera can read to open a link, send an '
      + 'email, join a Wi-Fi network, save a contact or add an event. It is made of black and white '
      + 'squares called modules, arranged in a square with three large squares in the corners so a '
      + 'camera can find and orient it. Any device with a camera can read one, with no app installed.',
  },
  {
    q: 'How do I create a QR code for free?',
    a: 'Pick one of the ten types at the top of the page, fill in the fields, and the code appears as '
      + 'you type. Then choose Download PNG, SVG or JPG. There is no account, no sign-up, no trial, '
      + 'no watermark and no limit on how many you make.',
  },
  {
    q: 'How do I create a QR code for my website?',
    a: 'Choose the URL type and type your address. If you leave off the https:// the tool adds it, '
      + 'because a code holding a bare domain is read by many phones as a search term rather than as '
      + 'a link. The finished code points at the address you typed and nothing else, so it will keep '
      + 'working as long as that page does.',
  },
  {
    q: 'Can I create a QR code for Wi-Fi?',
    a: 'Yes, using the Wi-Fi type. Enter the network name, choose the security and type the password, '
      + 'and scanning the code joins the network on a phone without anyone typing the password by '
      + 'hand. An open network with no password is also supported, in which case no password field is '
      + 'written into the code at all. The password never leaves your browser.',
  },
  {
    q: 'How do I download a QR code?',
    a: 'Use the Download PNG, Download SVG or Download JPG button under the preview. PNG is the right '
      + 'choice for sharing on a phone or a website, SVG is a vector file that stays sharp at any size '
      + 'and is what you want for printing, and JPG is useful where a file has to be small. The size '
      + 'you pick in the settings is the pixel size of the file you get.',
  },
  {
    q: 'Can I customize QR code colors?',
    a: 'Yes. Set a foreground and a background color and the preview updates immediately. The tool '
      + 'shows the contrast ratio between the two, because a QR code needs a much stronger contrast '
      + 'than ordinary text to scan reliably, and it warns you below 4.5:1. Black on white is the '
      + 'safest choice and is what most printed codes use.',
  },
  {
    q: 'Do QR codes expire?',
    a: 'A QR code never expires by itself. It holds a piece of text, not an address on a server, so it '
      + 'keeps working indefinitely. A code stops working when the thing behind it changes: if the '
      + 'link points at a page you later delete, or the Wi-Fi network is renamed, or the phone number '
      + 'is reassigned, the code will scan but lead somewhere else. Nothing here is hosted, so there '
      + 'is no subscription to lapse.',
  },
  {
    q: 'Is this QR code generator safe?',
    a: 'Yes, and the reason is structural rather than a promise. The code is built by your own browser '
      + 'using code that is served with the page, so a URL, a Wi-Fi password or a contact card never '
      + 'reaches a server. There is no upload, no third-party QR service and no storage, and closing '
      + 'the tab discards everything. A generator that uploads what you type could read anything you '
      + 'entered, which is why this one has no way to.',
  },
  {
    q: 'Can I create a QR code without an account?',
    a: 'Yes. There is no account, no sign-up and no email address required. Open the page, make as many '
      + 'codes as you like, and close the tab. Nothing is kept between visits and there is nothing to '
      + 'log out of.',
  },
  {
    q: 'How do I create a WhatsApp QR code?',
    a: 'Choose the WhatsApp type and enter the number in full international form, starting with the '
      + 'country code and without a plus sign, for example 15551234567 for a US number. A national '
      + 'number is refused, because a link built from one opens WhatsApp and then cannot find the '
      + 'contact. Type an optional message and scanning the code starts that chat with the message '
      + 'already written.',
  },
  {
    q: 'Why will my QR code not scan?',
    a: 'Almost always one of four things. Too little contrast, which the contrast readout on this page '
      + 'will flag for you. A logo covering too much of the code, which is why the tool warns past 20 '
      + 'percent and will not produce a code above 30 percent. Too few quiet-zone modules around the '
      + 'edge, which this tool always adds. Or the code was reprinted too small or on a busy '
      + 'background, which no amount of editing the code can fix.',
  },
  {
    q: 'What error correction level should I choose?',
    a: 'High, unless you have a reason not to. The level decides how much of the code can be covered or '
      + 'damaged and still scan: Low recovers about 7 percent, Medium 15, Quartile 25 and High 30. '
      + 'Higher levels make the code denser, so it needs a little more space to scan from, which is a '
      + 'good trade for a code that has to survive being printed, stuck on a bottle or shown on a '
      + 'screen in bright light. Adding a logo raises the level automatically.',
  },
];
