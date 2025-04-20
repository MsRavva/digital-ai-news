/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Отключаем эксперименты, которые могут вызывать проблемы
    webpackBuildWorker: false,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false,
    // Отключаем новые функции React 19
    optimizePackageImports: [],
    ppr: false
  },
  // Внешние пакеты для серверных компонентов
  serverExternalPackages: [],
  // Отключаем проверку типов во время сборки
  typescript: {
    ignoreBuildErrors: true,
  },
  // Отключаем проверку ESLint во время сборки
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Добавляем обработку ошибок Firebase Admin SDK и решаем проблемы с next-flight-client-entry-loader
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      // Игнорируем ошибки Firebase Admin SDK на сервере
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // Решаем проблему с next-flight-client-entry-loader
    config.resolve.alias = {
      ...config.resolve.alias,
      'next-flight-client-entry-loader': require.resolve('next/dist/build/webpack/loaders/next-flight-client-entry-loader'),
    };

    return config;
  },
};

module.exports = nextConfig;
