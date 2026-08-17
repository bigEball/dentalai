import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { absoluteUrl, seoFor } from './seo';

/**
 * Rewrites the head to describe the route currently on screen.
 *
 * The app is client-rendered, so every URL is served the same `index.html` and
 * arrives with the same title, description and canonical. A crawler that runs
 * JavaScript — Google and Bing both do — reads the head after this has run, so
 * this is what makes `/services` and `/privacy` distinct documents rather than
 * eight copies of the home page competing with each other.
 *
 * Called once in `PageShell`, which wraps every marketing and legal page, and
 * once in the landing route, which builds its own chrome. Pages behind the
 * sign-in do not call it and keep whatever the last public page set.
 */

/** Upserts a `<meta>` by name or property, creating the tag if it is absent. */
function setMeta(key: 'name' | 'property', value: string, content: string) {
  const selector = `meta[${key}="${value}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function useSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = seoFor(pathname);
    if (!route) return;

    const url = absoluteUrl(route.path);

    document.title = route.title;
    setMeta('name', 'description', route.description);

    // Canonical has to move with the route. Left pointing at the origin, it
    // tells the crawler every page on the site is really the home page.
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    setMeta('name', 'robots', route.noindex ? 'noindex, follow' : 'index, follow');

    // Link previews are generated per URL, so these move with the route too.
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:title', route.title);
    setMeta('property', 'og:description', route.description);
    setMeta('name', 'twitter:title', route.title);
    setMeta('name', 'twitter:description', route.description);
  }, [pathname]);
}
