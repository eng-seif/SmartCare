import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['**.replit.dev', '**.repl.co', '**.replit.com', 'localhost', '127.0.0.1'],
};

export default nextConfig;
