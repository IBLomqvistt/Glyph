import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  outputFileTracingIncludes: {
    '/*': ['./report-sources/**/*'],
  },
  transpilePackages: [
    '@glyph/ai',
    '@glyph/application',
    '@glyph/diagrams',
    '@glyph/domain',
    '@glyph/ui',
  ],
}

export default nextConfig
