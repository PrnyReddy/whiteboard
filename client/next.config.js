/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';
const repoName = 'whiteboard';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isProduction ? `/${repoName}` : '',
  assetPrefix: isProduction ? `/${repoName}/` : '',
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;
