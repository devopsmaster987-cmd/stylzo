/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/*": [
      "./data/fonts.json",
      "./data/categories.json",
      "./data/pages.json",
      "./data/.catalog-cache.json",
    ],
  },
};

export default nextConfig;