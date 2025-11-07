/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ensure Prisma engines are included in Vercel deployment
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/.prisma/client/**/*', './node_modules/@prisma/client/**/*'],
  },
}

module.exports = nextConfig