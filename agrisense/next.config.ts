/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
}

export default nextConfig
