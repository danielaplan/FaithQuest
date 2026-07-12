import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd()
  },
  allowedDevOrigins: [
    'dormitory-barracuda-poach.ngrok-free.dev',
    'localhost',
    '127.0.0.1'
  ]
};

export default nextConfig;
