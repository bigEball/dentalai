import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Root from './Root'
import './index.css'

// Catch unhandled errors that happen before React mounts
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `
      <div style="padding:40px;font-family:system-ui;text-align:center">
        <h1 style="font-size:24px;margin-bottom:8px">Failed to load</h1>
        <p style="color:#666;margin-bottom:16px;max-width:500px;margin-left:auto;margin-right:auto">${e.message}</p>
        <button onclick="localStorage.clear();location.href='/login'"
          style="padding:10px 24px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">
          Clear session &amp; reload
        </button>
      </div>`;
  }
});

try {
  const container = document.getElementById('root')!;
  const tree = (
    <React.StrictMode>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </React.StrictMode>
  );

  // The public pages ship with their markup already in the HTML, so they are
  // adopted rather than rebuilt. Everything else — the app behind the sign-in,
  // and `npm run dev`, which serves the unprerendered index.html — arrives with
  // an empty root and mounts the usual way.
  if (container.hasChildNodes()) {
    ReactDOM.hydrateRoot(container, tree);
  } else {
    ReactDOM.createRoot(container).render(tree);
  }
} catch (err) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding:40px;font-family:system-ui;text-align:center">
        <h1 style="font-size:24px;margin-bottom:8px">Failed to start</h1>
        <p style="color:#666;margin-bottom:16px">${err instanceof Error ? err.message : String(err)}</p>
        <button onclick="localStorage.clear();location.href='/login'"
          style="padding:10px 24px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">
          Clear session &amp; reload
        </button>
      </div>`;
  }
}
