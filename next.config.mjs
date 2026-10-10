/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  outputFileTracingIncludes: {
    "/*": [
      "./data/fonts.json",
      "./data/categories.json",
      "./data/pages.json",
      "./data/keywords.txt",
      "./data/.catalog-cache.json",
      "./data/*.json",
      "./data/*.txt",
    ],
  },
};

export default nextConfig;