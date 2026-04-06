import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
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
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </React.StrictMode>,
  )
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
