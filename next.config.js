/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server component external packages optimization
  serverExternalPackages: ['react-syntax-highlighter'],
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configure webpack for better optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Reduce bundle size by splitting chunks more efficiently
    if (!dev && isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Create separate chunks for large dependencies
          syntaxHighlighter: {
            test: /[\\/]node_modules[\\/]react-syntax-highlighter[\\/]/,
            name: 'syntax-highlighter',
            chunks: 'async',
            priority: 10,
          },
          markdown: {
            test: /[\\/]node_modules[\\/](react-markdown|remark|rehype|unified)[\\/]/,
            name: 'markdown-processing',
            chunks: 'async',
            priority: 9,
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig 