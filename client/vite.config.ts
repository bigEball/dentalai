import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { buildSitemap } from './src/features/landing/seo'

/**
 * Emits `sitemap.xml` from the route table the app itself routes on.
 *
 * Kept as a build step rather than a checked-in file in `public/` so that a
 * new marketing page cannot ship without appearing in the sitemap — there is
 * one list, in `seo.ts`, and this reads it.
 */
function sitemap(): Plugin {
  return {
    name: 'summit-sitemap',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemap(new Date().toISOString().slice(0, 10)),
      })
    },
  }
}

export default defineConfig(({ isSsrBuild }) => ({
  /* The SSR pass builds one Node bundle for the prerenderer. Splitting it into
     browser cache chunks and re-emitting the sitemap alongside it would be
     meaningless, so both are browser-build only. */
  plugins: isSsrBuild ? [react()] : [react(), sitemap()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            /* React and the router are on every page and never change between
               deploys of our own code, so they get their own long-lived chunk.
               Recharts is only reached from the reporting screens behind the
               sign-in — pinning it here keeps Rollup from folding it back into
               anything the marketing page pulls in. */
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              charts: ['recharts'],
            },
          },
    },
  },
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}))
