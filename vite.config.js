import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use '/' on Vercel deployments, otherwise default to repository sub-path for GitHub Pages
  base: process.env.VERCEL ? '/' : '/Goal-Setting-Portal/',
});

