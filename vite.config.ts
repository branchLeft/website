import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

// Tailwind's /*! banner survives esbuild's minifier as a legal comment. Strip
// it from the emitted CSS so production output does not fingerprint the build.
function stripCssBanners(): Plugin {
  return {
    name: 'strip-css-banners',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (
          file.type === 'asset' &&
          file.fileName.endsWith('.css') &&
          typeof file.source === 'string'
        ) {
          file.source = file.source.replace(/\/\*!.*?\*\//gs, '');
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), stripCssBanners()],
  resolve: {
    tsconfigPaths: true,
  },
});
