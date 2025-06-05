// next.config.js (or .mjs)
/** @type {import('next').NextConfig} */
const config = {

  images: {
    remotePatterns: [ 
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**', 
      },
    ],
  
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
};

export default config;