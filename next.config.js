/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Отключаем эксперименты, которые могут вызывать проблемы
    webpackBuildWorker: false,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false
  },
  // Добавляем обработку ошибок Firebase Admin SDK
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Игнорируем ошибки Firebase Admin SDK на сервере
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
