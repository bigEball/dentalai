import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import Root from './Root';
import './index.css';

// Re-exported so the prerender script reads the route table through the bundle
// it already imports, rather than parsing the TypeScript source a second time.
export { SEO_ROUTES, absoluteUrl } from './features/landing/seo';

/**
 * The build-time half of the app. Vite bundles this for Node (`--ssr`), and
 * `scripts/prerender.mjs` calls `render` once per public route.
 *
 * This exists because the site is client-rendered and the answer engines —
 * unlike Google — largely do not execute JavaScript, so every URL looked
 * identical to them: an empty `<div id="root">`. Rendering the same component
 * tree to a string at build time puts the real copy in the HTML that gets
 * served, with no runtime cost and no server.
 *
 * `renderToString` rather than a headless browser on purpose: the marketing
 * pages hold no data fetching, so there is nothing to wait for, and Netlify's
 * build image does not need a Chromium download to deploy the site.
 */
export function render(path: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={path}>
        <Root />
      </StaticRouter>
    </StrictMode>,
  );
}
