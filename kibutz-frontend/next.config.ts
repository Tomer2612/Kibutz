import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable to prevent double WebSocket connections in dev
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    // Disable ESLint during builds - we'll run it separately
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'developers.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
      {
        protocol: 'https',
        hostname: 'kibutz.co.il',
      },
      {
        protocol: 'https',
        hostname: 'www.kibutz.co.il',
      },
      {
        protocol: 'http',
        hostname: 'kibutz.co.il',
      },
      {
        protocol: 'http',
        hostname: 'www.kibutz.co.il',
      },
    ],
  },
};

export default nextConfig;
