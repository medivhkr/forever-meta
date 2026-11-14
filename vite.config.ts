import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Сайт живёт на GitHub Pages по адресу https://medivhkr.github.io/forever-meta/,
// поэтому все пути собираются от /forever-meta/.
export default defineConfig({
  base: '/forever-meta/',
  plugins: [react()],
});
