/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
}

export default nextConfig
