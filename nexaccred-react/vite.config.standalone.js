import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Builds the offline UI/UX review artifact: one self-contained .html file
 * (JS + CSS inlined, no external script/link tags left pointing at
 * separate files) that opens directly via double-click — no dev server, no
 * backend, no `npm install` required by whoever receives it.
 *
 * Entry point is src/AppStandalone.jsx (see that file's comment) — NOT
 * src/App.jsx, which is the real, backend-authenticated app served by the
 * ordinary `npm run dev` / `npm run build`. This config only ever reads
 * index.standalone.html / main.standalone.jsx; it never touches the live
 * app's build output.
 *
 *   npm run build:standalone   →  dist-standalone/index.standalone.html
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': '/src' } },
  build: {
    outDir: 'dist-standalone',
    rollupOptions: {
      input: 'index.standalone.html',
    },
    // vite-plugin-singlefile inlines everything into the HTML regardless,
    // but keeping code-splitting off avoids it having to stitch chunks back
    // together and keeps the build deterministic.
    cssCodeSplit: false,
  },
});
