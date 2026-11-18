import { defineConfig } from 'astro/config';
import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === 'true';

export default defineConfig({
  site: 'https://shae-site.vercel.app',
  vite: {
    build: {
      rollupOptions: {
        plugins: analyze
          ? [
              visualizer({
                filename: 'dist/stats.html',
                gzipSize: true,
                brotliSize: true,
                template: 'treemap',
              }),
            ]
          : [],
      },
    },
  },
});
