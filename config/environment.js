
import 'dotenv/config';

const num = (v, d) =>
  Number.isFinite(Number(v)) && v !== undefined && v !== ''
    ? Number(v)
    : d;

const str = (v, d = '') =>
  v === undefined || v === '' ? d : String(v);

const DEFAULT_SITE_URL = 'https://www.abdulsamad.shop';

/**
 * The canonical origin every absolute URL is built from. Vercel injects
 * VERCEL_PROJECT_PRODUCTION_URL at build time, so a deploy that forgets SITE_URL
 * still resolves to the right host instead of a hardcoded one.
 */
function resolveSiteUrl() {
  const raw = str(
    process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ).trim();
  const url = (raw || DEFAULT_SITE_URL).replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'production' && !raw) {
    throw new Error(
      'SITE_URL is not set. Canonical URLs, og:url, the sitemap and robots.txt ' +
        'are all derived from it, so a production build must set it explicitly.',
    );
  }
  return url;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isVercel: Boolean(process.env.VERCEL),
  port: num(process.env.PORT, 3000),

  // Website URL for production and sitemap generation.
  // Falling back silently to a hardcoded host means a misconfigured deploy
  // emits wrong canonicals, wrong og:url and a wrong robots.txt Sitemap: line
  // for every page, with no build error. In production, fail loudly instead.
  siteUrl: resolveSiteUrl(),

  maxInputLength: num(process.env.MAX_INPUT_LENGTH, 5000),
  ssrTextLimit: 300, // Longer input is handled live in the browser.
  rateLimitPerMinute: num(process.env.RATE_LIMIT_PER_MINUTE, 60),
  contactEmail: process.env.CONTACT_EMAIL || 'mastersamaddevops@gmail.com',

  // M6 - Firebase configuration.
  firebase: {
    apiKey: str(process.env.FIREBASE_API_KEY),
    authDomain: str(process.env.FIREBASE_AUTH_DOMAIN),
    projectId: str(process.env.FIREBASE_PROJECT_ID),
    appId: str(process.env.FIREBASE_APP_ID),
    storageBucket: str(process.env.FIREBASE_STORAGE_BUCKET),
    messagingSenderId: str(process.env.FIREBASE_MESSAGING_SENDER_ID),
  },

  // M7 - Optional AI model provider.
  aiApiKey: str(process.env.AI_API_KEY),
  aiModel: str(process.env.AI_MODEL, 'gpt-4o-mini'),

  // M7 - Admin dashboard token.
  adminKey: str(process.env.ADMIN_KEY),

  // M9 - Google AdSense. Both values are non-secret: the client id is a public
  // identifier that ships in every page's ad markup.
  adsense: {
    client: str(process.env.ADSENSE_CLIENT), // e.g. ca-pub-0000000000000000
    slot: str(process.env.ADSENSE_SLOT),     // the numeric ad unit id
  },
};

/** Ads load only when both ids are present, so a half-configured build stays ad-free. */
export const adsenseConfigured = Boolean(env.adsense.client && env.adsense.slot);

export const firebaseConfigured = Boolean(
  env.firebase.apiKey &&
  env.firebase.projectId &&
  env.firebase.appId
);
