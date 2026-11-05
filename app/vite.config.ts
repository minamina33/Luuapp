import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' で相対パス出力（どこに置いても動くように）
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { assetsDir: 'bundle' },
});
