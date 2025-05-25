/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '',
  assetPrefix:'',
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;
