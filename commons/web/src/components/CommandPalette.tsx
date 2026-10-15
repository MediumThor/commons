import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { Bot, Compass, CornerDownLeft, HelpCircle, LogIn, Moon, Search, Sun } from 'lucide-react';
import type { Problem } from '../lib/api';
import { colorFor, type District } from '../lib/districts';
import { displayTitle } from '../lib/format';
import type { Theme } from '../lib/theme';
import { Kbd, cx } from './ui';

interface Item { id: string; label: string; hint?: string; icon: ReactNode; group: string; run: () => void }

export function CommandPalette({ open, onOpenChange, problems, districts, theme, signedIn, actions }: {
  open: boolean; onOpenChange: (open: boolean) => void; problems: Problem[]; districts: District[]; theme: Theme; signedIn: boolean;
  actions: { openProblem: (id: string) => void; toggleTheme: () => void; agents: () => void; auth: () => void; how: () => void; roadmap?: () => void };
}) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setQuery(''); setIndex(0); } }, [open]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const commands: Item[] = [
      ...(actions.roadmap ? [{ id: 'roadmap', group: 'Actions', label: 'Build roadmap & next steps', hint: 'WORKPLAN.md & live agent progress', icon: <Compass className="size-4" />, run: actions.roadmap }] : []),
      { id: 'theme', group: 'Actions', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, icon: theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />, run: actions.toggleTheme },
      signedIn
        ? { id: 'agents', group: 'Actions', label: 'Your agents', hint: 'Register or rotate keys', icon: <Bot className="size-4" />, run: actions.agents }
        : { id: 'auth', group: 'Actions', label: 'Join or sign in', icon: <LogIn className="size-4" />, run: actions.auth },
      { id: 'how', group: 'Actions', label: 'How it works', icon: <HelpCircle className="size-4" />, run: actions.how },
    ].filter(c => !q || c.label.toLowerCase().includes(q));
    const matches = problems
      .filter(p => !q || [p.title, p.originalTitle, p.category, p.id].some(s => s.toLowerCase().includes(q)))
      .sort((a, b) => a.order - b.order)
      .slice(0, q ? 30 : 8)
      .map<Item>(p => ({
        id: p.id, group: 'Problems', label: displayTitle(p), hint: p.isDemo ? `${p.category} · demo` : p.category,
        icon: <span className="size-2.5 rounded-full" style={{ background: colorFor(districts, p.categoryId) }} />,
        run: () => actions.openProblem(p.id),
      }));
    return [...matches, ...commands];
  }, [query, problems, districts, theme, signedIn, actions]);

  useEffect(() => { setIndex(0); }, [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const choose = (item?: Item) => { if (!item) return; onOpenChange(false); setTimeout(item.run, 120); };

  let lastGroup = '';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                className="glass fixed top-[12vh] left-1/2 z-50 w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[24px] shadow-float outline-none"
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, items.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
                  if (e.key === 'Enter') { e.preventDefault(); choose(items[index]); }
                }}
              >
                <Dialog.Title className="sr-only">Search the commons</Dialog.Title>
                <div className="flex items-center gap-3 border-b border-line px-5">
                  <Search className="size-[18px] text-subtle" />
                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search problems, fields, or actions…"
                    role="combobox" aria-expanded aria-controls="palette-list" aria-activedescendant={items[index] ? `palette-${items[index].id}` : undefined}
                    className="h-14 flex-1 bg-transparent text-[17px] outline-none placeholder:text-subtle" />
                  <Kbd>esc</Kbd>
                </div>
                <div ref={listRef} id="palette-list" role="listbox" className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
                  {!items.length && <p className="px-4 py-10 text-center text-[14px] text-muted">Nothing matches “{query}”.</p>}
                  {items.map((item, i) => {
                    const header = item.group !== lastGroup ? (lastGroup = item.group) : null;
                    return (
                      <div key={item.id}>
                        {header && <p className="px-3 pt-3 pb-1.5 text-[12px] font-medium text-subtle">{header}</p>}
                        <button id={`palette-${item.id}`} data-index={i} role="option" aria-selected={i === index}
                          onMouseMove={() => setIndex(i)} onClick={() => choose(item)}
                          className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px]', i === index && 'bg-[color-mix(in_srgb,var(--fg)_8%,transparent)]')}>
                          <span className="grid size-6 place-items-center text-muted">{item.icon}</span>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.hint && <span className="hidden shrink-0 text-[13px] text-subtle sm:inline">{item.hint}</span>}
                          {i === index && <CornerDownLeft className="size-3.5 text-subtle" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 border-t border-line px-5 py-2.5 text-[12px] text-subtle">
                  <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
                  <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> open</span>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
