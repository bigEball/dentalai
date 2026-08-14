# Summit landing page

A standalone Vite + React + TypeScript + Tailwind project holding the new marketing
page. It runs on its own so the page can be designed without touching the app, and it
is written to be copied into `client/` as-is when you want to ship it.

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # type-check + production build into dist/
```

## What's in it

| File | Purpose |
| --- | --- |
| `src/LandingPage.tsx` | The whole page. One component, no router, no data fetching. |
| `src/JarvisCore.tsx` | The crowned-tooth mark inside the rotating HUD. Inline SVG. |
| `src/landing.css` | Keyframes for the HUD and the reveal animations. Plain CSS. |
| `public/logo-mark.png` | Copy of the existing tooth logo. |

Dependencies: `react`, `react-dom`, `lucide-react` (one icon), Tailwind. Nothing else.

## The page

One thing to click: **Open the live demo**. It appears in the nav, in the hero, after
the capability list, in the DSO section, in the closing block, and in the footer. There
is no lead-capture form, no pricing table, and no feature grid competing with it.

Sections: hero → three plain-language capabilities → custom software for DSOs → closing
CTA → footer.

## Dropping it into `client/`

1. Copy the three source files into the app:

   ```bash
   cp landing/src/LandingPage.tsx landing/src/JarvisCore.tsx landing/src/landing.css \
      client/src/features/landing/
   ```

2. Point the route at it. In `client/src/App.tsx` the landing import becomes:

   ```tsx
   import LandingPage from '@/features/landing/LandingPage';
   ```

   Then render it with the router wired to the demo:

   ```tsx
   const navigate = useNavigate();

   return (
     <LandingPage
       demoHref="/login"
       onDemoClick={(e) => { e.preventDefault(); navigate('/login'); }}
     />
   );
   ```

   Leaving `onDemoClick` off is fine too — the button is a plain `<a href="/login">` and
   will do a full page load.

3. `client/public/logo-mark.png` already exists, so the artwork resolves with no change.

The old `client/src/features/landing/Page.tsx` can then be deleted, along with the
`.summit-*` block in `client/src/index.css` that only its hero used.

Tailwind needs no config change: the client's `content` glob already covers
`src/**/*.tsx`, and the page only uses core utilities plus arbitrary values that
Tailwind 3.4 supports.

## Props

```ts
demoHref?: string      // default '/login'
onDemoClick?: (e: MouseEvent<HTMLAnchorElement>) => void
contactEmail?: string  // default 'omid@summitaisoftware.com'
logoSrc?: string       // default '/logo-mark.png'
```

## Notes

- Every animation is disabled under `prefers-reduced-motion: reduce`.
- The HUD is SVG, so it stays sharp at any size and costs no extra network requests.
- Copy is deliberately plain. If you edit it, keep the claims concrete — the page sells
  the demo, and the demo does the rest.
