/**
 * Writes a real HTML document for every public route.
 *
 * Runs after both Vite passes: the browser build leaves `dist/index.html` with
 * an empty `<div id="root">`, and the SSR build leaves a Node bundle in
 * `dist-ssr/`. This renders each route through that bundle and writes the
 * result back into a copy of the shell.
 *
 * The point is the crawlers that do not run JavaScript. Google renders the page
 * and was always fine; the answer engines mostly are not, and to them every URL
 * on the site was the same empty document. This is also what makes the per-route
 * `<title>` real rather than something only a JavaScript-executing client sees.
 *
 * Head entries come from the same `SEO_ROUTES` table the router and the sitemap
 * read, so a route cannot be prerendered with a title different from the one
 * `useSeo` sets a moment later during hydration.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(clientDir, 'dist');

const { render, SEO_ROUTES, absoluteUrl } = await import(
  path.join(clientDir, 'dist-ssr', 'entry-prerender.js')
);

const shell = await readFile(path.join(distDir, 'index.html'), 'utf8');

// This script overwrites dist/index.html with the rendered home page, so on a
// second run the file it reads as the blank shell is no longer blank — every
// page would then be built on top of the landing page's markup, and app.html
// would ship with a copy of it. Cheaper to refuse than to debug later.
if (!shell.includes('<div id="root"></div>')) {
  throw new Error(
    'prerender: dist/index.html has already been prerendered. Run `vite build` ' +
      'to regenerate the empty shell before prerendering again.',
  );
}

/** Replaces the content of a `<meta>` already present in the shell. */
function setMeta(html, attr, name, content) {
  const pattern = new RegExp(
    `(<meta\\s+${attr}="${name}"\\s+content=")[^"]*(")`,
    'i',
  );
  if (!pattern.test(html)) {
    throw new Error(`prerender: no <meta ${attr}="${name}"> in dist/index.html`);
  }
  return html.replace(pattern, `$1${escapeAttr(content)}$2`);
}

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * The shell carries the whole structured-data graph, including the FAQ, because
 * the FAQ is on the home page. Leaving that node on `/privacy` would be
 * structured data describing content that is not on the page — the kind of
 * mismatch that earns a manual action — so every other route gets the graph
 * with the FAQ removed.
 */
function scopeStructuredData(html, isHome) {
  if (isHome) return html;
  return html.replace(
    /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,
    (_match, open, body, close) => {
      const graph = JSON.parse(body);
      graph['@graph'] = graph['@graph'].filter((node) => node['@type'] !== 'FAQPage');
      return `${open}\n${JSON.stringify(graph, null, 2)}\n    ${close}`;
    },
  );
}

let written = 0;

for (const route of SEO_ROUTES) {
  const isHome = route.path === '/';
  const url = absoluteUrl(route.path);

  let html = shell;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`);
  html = setMeta(html, 'name', 'description', route.description);
  html = setMeta(html, 'name', 'robots', route.noindex ? 'noindex, follow' : 'index, follow');
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', route.title);
  html = setMeta(html, 'property', 'og:description', route.description);
  html = setMeta(html, 'name', 'twitter:title', route.title);
  html = setMeta(html, 'name', 'twitter:description', route.description);
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${url}" />`,
  );
  html = scopeStructuredData(html, isHome);

  const markup = render(route.path);
  html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);

  const outDir = isHome ? distDir : path.join(distDir, route.path.replace(/^\//, ''));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
  written += 1;
}

/**
 * The shell for everything that is not prerendered: the sign-in form and the
 * application behind it.
 *
 * Those routes have no file of their own, so the host's SPA fallback answers
 * them — and if that fallback were `index.html`, it would now hand them the
 * fully rendered landing page. React would then try to hydrate the dashboard
 * against the marketing copy, fail, and rebuild the whole tree, and the tab
 * would say "AI operations for dental practices" while showing a sign-in form.
 *
 * So the fallback gets an empty root, which is the cue `main.tsx` uses to mount
 * with `createRoot` instead of hydrating, and a `noindex` — the application
 * screens are already disallowed in robots.txt and none of them is a landing
 * page for anything.
 */
let appShell = setMeta(shell, 'name', 'robots', 'noindex, nofollow');
// Bare brand, because this shell is shared by the sign-in and all 28 app
// screens. Inheriting the home page's title left the tab claiming "AI
// operations for dental practices" above a sign-in form.
appShell = appShell.replace(/<title>[\s\S]*?<\/title>/, '<title>Summit Tech</title>');
await writeFile(path.join(distDir, 'app.html'), appShell, 'utf8');

console.log(`prerendered ${written} routes, plus app.html for the SPA fallback`);
