import { Toaster } from 'react-hot-toast';
import App from './App';

/**
 * Everything inside the router, shared by the two entry points.
 *
 * `main.tsx` mounts this under a `BrowserRouter` in the browser and
 * `entry-prerender.tsx` renders it under a `StaticRouter` during the build.
 * Hydration compares the two trees node for node, so they have to be the same
 * tree — a `<Toaster />` present in one and missing from the other is enough
 * to make React throw the prerendered markup away and re-render from scratch,
 * which is the exact cost prerendering was meant to avoid.
 */
export default function Root() {
  return (
    <>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
}
