import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild'
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 开发期：/api/v1 转发到本地 BFF（wrangler pages dev 默认 8788）。
      // BFF 未启动时 502 → apiClient 抛错 → practice-data 回退静态 bundle，刷题不崩。
      '/api/v1': {
        target: process.env.BFF_DEV_URL || 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  }
});
