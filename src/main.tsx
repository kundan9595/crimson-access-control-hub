import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// When a new deployment ships, stale chunk hashes from old SW-cached index.html
// will 404 (or return HTML via SPA rewrite). Force a hard reload to pick up the
// fresh index.html and new chunk URLs. Guard against reload loops with sessionStorage.
window.addEventListener('vite:preloadError', () => {
  const key = 'scottone_chunk_reload';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
