// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 프론트에서 /api 로 호출 → 백엔드(8080)로 프록시
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        /**
         * 백엔드가 /reco/pets 처럼 루트로 열려 있으면 /api 프리픽스를 제거해서 전달
         * - 백엔드가 /api/xxx 로 열려 있으면 이 줄을 주석 처리하세요.
         */
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
