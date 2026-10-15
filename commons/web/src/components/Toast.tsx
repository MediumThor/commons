import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { spring } from './ui';

interface ToastItem { id: number; message: string; tone: 'success' | 'error' }
const ToastContext = createContext<(message: string, tone?: ToastItem['tone']) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems(list => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => setItems(list => list.filter(t => t.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id} layout transition={spring}
              initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="glass pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full py-2.5 pr-5 pl-3.5 text-[14px] font-medium shadow-float"
            >
              {item.tone === 'success' ? <CircleCheck className="size-[18px] text-green" /> : <CircleAlert className="size-[18px] text-red" />}
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
