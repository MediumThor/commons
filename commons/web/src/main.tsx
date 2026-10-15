import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App';
import { ToastProvider } from './components/Toast';
import './index.css';

const DemonstrationLab = lazy(() => import('./components/DemonstrationLab').then(module => ({ default: module.DemonstrationLab })));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        {window.location.pathname === '/demonstration' ? <Suspense fallback={<p role="status" className="p-8">Opening the collaboration notebook…</p>}><DemonstrationLab /></Suspense> : <App />}
      </ToastProvider>
    </MotionConfig>
  </StrictMode>,
);
