/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
   webpack: ( config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    return config
  }
}

export default nextConfig