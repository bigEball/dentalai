/**
 * The public route table, and the only place a crawlable URL is declared.
 *
 * Three things read this file and they must not be allowed to disagree:
 *
 *   - `useSeo` (runtime) sets the title, description and canonical per route.
 *   - The sitemap plugin in `vite.config.ts` emits `sitemap.xml` at build time.
 *   - `public/robots.txt` points crawlers at that sitemap.
 *
 * The previous arrangement had one `<title>` in `index.html` for all eight
 * public URLs, which meant every page competed with every other page for the
 * same phrase and none of them described themselves. Adding a route here is
 * enough to fix that for the new page — there is no second list to update.
 *
 * Deliberately dependency-free: `vite.config.ts` imports it in Node during the
 * build, so nothing here may reach for React, the DOM, or a browser global.
 */
import { COMPANY } from './company';

export interface SeoRoute {
  /** Path as the router declares it. Also the sitemap `<loc>`, minus origin. */
  path: string;
  /**
   * Brand last. Safari truncates the tail of a tab label once a few are open,
   * and between the two halves it is the distinctive one that has to survive —
   * so the page's own name leads and `Summit Tech` is what gets cut.
   */
  title: string;
  /** ~155 characters. Longer than that is dropped from the search result. */
  description: string;
  /**
   * Left out of `sitemap.xml`. A confirmation screen and a sign-in form are
   * real URLs but nothing should arrive on either one from a search result.
   */
  noindex?: boolean;
}

export const SEO_ROUTES: readonly SeoRoute[] = [
  {
    path: '/',
    title: 'Summit Tech — AI operations for dental practices',
    description:
      'Summit Tech writes the clinical notes, fills the schedule and scrubs the claims, then writes it all back into OpenDental. See all 26 tools in a live demo.',
  },
  {
    path: '/about',
    title: 'About — Summit Tech',
    description:
      'Who builds Summit Tech, how the software is put together, and the kinds of dental practices and groups it is built to fit.',
  },
  {
    path: '/services',
    title: 'Services — Summit Tech',
    description:
      'AI clinical notes, insurance claim review, recall and reactivation, patient communications and month-end reporting — every module, and what each one does.',
  },
  {
    path: '/contact',
    title: 'Contact — Summit Tech',
    description:
      'Talk to Summit Tech about a demo, a rollout across locations, or custom software for your group. Call, email, or send a note from this page.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy — Summit Tech',
    description:
      'How SUMMIT TECH LLC collects, uses, stores and discloses information, including patient data handled on behalf of a dental practice.',
  },
  {
    path: '/terms',
    title: 'Terms of Service — Summit Tech',
    description:
      'The terms that govern use of Summit Tech software and services, including the agreement between SUMMIT TECH LLC and the practices it serves.',
  },
  {
    path: '/accessibility',
    title: 'Accessibility Statement — Summit Tech',
    description:
      'Summit Tech targets WCAG 2.1 Level AA. What has been tested, what is known not to conform yet, and how to report a barrier you run into.',
  },
  {
    path: '/thank-you',
    title: 'Thank you — Summit Tech',
    description: 'Your message reached us. Someone will follow up shortly.',
    noindex: true,
  },
];

/** Fast path for `useSeo`, which looks up on every navigation. */
const BY_PATH = new Map(SEO_ROUTES.map((route) => [route.path, route]));

export function seoFor(pathname: string): SeoRoute | undefined {
  return BY_PATH.get(pathname);
}

/**
 * The absolute form of a route. Canonical tags and sitemap entries both have
 * to be absolute, and both have to agree on whether the path carries a
 * trailing slash — `/about` and `/about/` are two URLs to a crawler.
 */
export function absoluteUrl(path: string): string {
  return path === '/' ? `${COMPANY.url}/` : `${COMPANY.url}${path}`;
}

/**
 * `sitemap.xml`, built from the table above at build time.
 *
 * `lastmod` is passed in rather than read from the clock so that two builds of
 * the same commit produce byte-identical output.
 */
export function buildSitemap(lastmod: string): string {
  const entries = SEO_ROUTES.filter((route) => !route.noindex)
    .map((route) =>
      [
        '  <url>',
        `    <loc>${absoluteUrl(route.path)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        // The landing page changes with the product; the legal pages change
        // when the lawyer says so. Priority is relative within the site only.
        `    <priority>${route.path === '/' ? '1.0' : '0.7'}</priority>`,
        '  </url>',
      ].join('\n'),
    )
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n');
}
