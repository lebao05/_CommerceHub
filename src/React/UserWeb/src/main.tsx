import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App.tsx';

// Apply stored theme synchronously before React renders — prevents FOUC
(function applyStoredTheme() {
  try {
    const stored = localStorage.getItem('ch-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      // Default to light
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
