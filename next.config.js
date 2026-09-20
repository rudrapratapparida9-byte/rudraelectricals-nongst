/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/rudraelectricals-nongst',
  assetPrefix: '/rudraelectricals-nongst/',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
