/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Avatars are tiny local webp files; serve them as-is (no image-optimizer round trips).
  images: { unoptimized: true },
};
export default nextConfig;
