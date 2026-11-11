import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/AnimaSpellBook/' : '/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    open: true,
    port: 5173
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});