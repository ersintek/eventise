import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/events/:orgSlug/:eventSlug-onam',
          destination: '/events/:orgSlug/:eventSlug/onam',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default config;
