import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://44.198.175.55:4000/:path*', // Tu IP de AWS
      },
    ];
  },
};

export default nextConfig;
