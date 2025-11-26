/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['api', 'database'],
  images: {
    domains: ['localhost', 'images.unsplash.com'],
  },
}

module.exports = nextConfig
