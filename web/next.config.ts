import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-ignore
  allowedDevOrigins: [
    "portrait-picture-purchases-corporation.trycloudflare.com",
    "*.trycloudflare.com",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
