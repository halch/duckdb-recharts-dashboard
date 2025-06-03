/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // DuckDB WASMのための設定
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Web Workerのサポート
    if (!isServer) {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    }
    
    return config;
  },
}

module.exports = nextConfig