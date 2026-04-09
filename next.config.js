/** @type {import('next').NextConfig} */
const nextConfig = {
  // Harden production headers
  poweredByHeader: false,

  // Strict React mode for catching subtle bugs
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Treat TypeScript and ESLint errors as build failures in CI
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
