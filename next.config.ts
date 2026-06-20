import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.56.1"],
  experimental: {
    optimizePackageImports: ['@ant-design/icons', 'antd', 'recharts'],
  },

  async redirects() {
    return [
      {
        source: "/mistris",
        destination: "/servex",
        permanent: true,
      },
      {
        source: "/mistris/:path*",
        destination: "/servex/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;