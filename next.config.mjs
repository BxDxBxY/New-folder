/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
};

// export default nextConfig;

import nextPWA from "next-pwa";

const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
