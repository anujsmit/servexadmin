import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/mistris',
        destination: '/servex',
        permanent: true,
      },
      {
        source: '/mistris/:path*',
        destination: '/servex/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
