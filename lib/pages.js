import { env } from '@/config/environment.js';
import { applyStyle } from '@/services/unicode/engine.js';
import { catalog } from '@/services/catalog.js';
import { clampText } from '@/lib/validation.js';
import { buildMeta } from '@/services/seo.js';

export const SUPPORT_LABEL = {
  safe: 'Works almost everywhere',
  good: 'Works in most apps',
  limited: 'Check your app first',
};

export const PAGE_SIZE = 48;

/** Render a list of styles against the (SSR-capped) input text. */
export function renderCards(styles, text) {
  return styles.map((s) => ({
    ...s,
    output: applyStyle(text, s, { maxLength: env.ssrTextLimit }),
    supportLabel: SUPPORT_LABEL[s.support],
  }));
}

/** `?text=` when present, otherwise the catalog sample. */
export function inputFromQuery(params) {
  const text = clampText(params?.text, { max: env.maxInputLength });
  return text.trim() ? text : catalog().sample;
}

/** A curated picker list for the studio composer. */
export function composerStyles() {
  const { styles } = catalog();
  const seen = new Set();
  const out = [];
  for (const s of styles) {
    if (s.indexable && !seen.has(s.category)) {
      seen.add(s.category);
      out.push({ id: s.id, name: s.name });
    }
  }
  for (const s of styles) {
    if (out.length >= 120) break;
    if (s.indexable && !seen.has(s.id)) {
      seen.add(s.id);
      out.push({ id: s.id, name: s.name });
    }
  }
  return out;
}

export const LIB_META = {
  symbols: {
    title: 'Symbols Library',
    description: 'Copy arrows, stars, hearts, music notes, currency and decorative symbols. Every symbol is one click and works in bios, chats and documents.',
  },
  emoji: {
    title: 'Emoji Library',
    description: 'Browse emoji by category with meanings: smileys, animals, food, travel, activities, objects and symbols. Tap to copy any emoji.',
  },
  kaomoji: {
    title: 'Kaomoji Library',
    description: 'Japanese-style text emoticons for every mood: happy, sad, angry, love, animals and shrugs. Tap to copy any kaomoji.',
  },
};

export function faqFor(style) {
  return [
    {
      q: `How do I use ${style.name}?`,
      a: 'Type your text, copy the result and paste it where you want it. No font install is needed because the result is made of Unicode characters.',
    },
    {
      q: `Where does ${style.name} work?`,
      a: `${SUPPORT_LABEL[style.support]}. ${style.support === 'limited' ? 'Some apps replace these characters with boxes or emoji.' : 'If an app shows empty boxes, its font lacks those characters.'}`,
    },
    {
      q: 'Is my text saved anywhere?',
      a: 'No. The text is styled in your browser and is not sent to or stored on our server.',
    },
    {
      q: `Why does ${style.name} text look like boxes in some apps?`,
      a: 'The style uses Unicode characters rather than a font, so an app shows them correctly only if the device has a glyph for each one. Missing characters fall back to an empty box.',
    },
    {
      q: `Can I use ${style.name} text commercially?`,
      a: 'Yes. The characters come from the Unicode standard rather than from a licensed typeface, and the generated text is yours to use on any platform.',
    },
    {
      q: `What is the difference between ${style.name} text and a font?`,
      a: `A font changes the shape of ordinary letters, so the text stays readable and searchable but needs the font installed. ${style.name} text replaces each letter with a different Unicode character, so it works anywhere plain text is accepted without installing anything.`,
    },
  ];
}

/** Shape built by services/seo.js. */
export function pageMeta(options) {
  return buildMeta(options);
}

/** The same shape expressed as Next.js metadata for generateMetadata(). */
export function toMetadata(meta) {
  return {
    // `absolute` stops the root layout's title.template from appending the site name a
    // second time: buildMeta() has already suffixed it.
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: meta.canonical },
    // Emitted verbatim (no space after the comma) to match the crawler contract.
    other: { robots: meta.robots },
    openGraph: {
      title: meta.og.title,
      description: meta.og.description,
      url: meta.og.url,
      type: 'website',
      siteName: meta.og.siteName,
      images: meta.og.images,
      locale: 'en_US',
    },
    twitter: meta.twitter,
  };
}