import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@glyph/ai',
    '@glyph/application',
    '@glyph/diagrams',
    '@glyph/domain',
    '@glyph/ui',
  ],
}

export default nextConfig
