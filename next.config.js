/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  outputFileTracingExcludes: {
    '*': [
      'node_modules/sharp',
      'node_modules/@swc',
    ],
  },
}

module.exports = nextConfig
