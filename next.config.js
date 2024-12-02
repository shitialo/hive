/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      bufferutil: false,
      'utf-8-validate': false
    };
    return config;
  },
}

module.exports = nextConfig 