
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/*": ["./data/**/*"],
  },
};

export default nextConfig;
