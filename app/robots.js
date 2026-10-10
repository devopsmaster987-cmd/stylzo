import { env } from '@/config/environment.js';

export default function robots() {
  return {
    // /admin and /admin/seo are internal review tools and are noindex anyway;
    // disallowing them keeps them out of crawl budget and out of search results.
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin'] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
