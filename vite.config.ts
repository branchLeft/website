import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

// Tailwind emits a `/*! tailwindcss vX.X.X | ... */` banner comment into every
// stylesheet it touches, and esbuild's minifier preserves "/*! */" legal
// comments by default regardless of `legalComments` settings on the CSS path.
// Strip it in the emitted bundle so production output doesn't fingerprint
// the build tooling/version.
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
