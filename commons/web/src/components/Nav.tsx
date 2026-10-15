import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Compass, LogOut, Moon, Search, Sun, Bot } from 'lucide-react';
import type { User } from '../lib/api';
import type { Theme } from '../lib/theme';
import { Button, Kbd, cx } from './ui';

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className="relative grid shrink-0 place-items-center rounded-[30%] bg-[linear-gradient(140deg,var(--orange),var(--pink)_60%,var(--indigo))] shadow-[0_4px_14px_-4px_color-mix(in_srgb,var(--pink)_70%,transparent)]"
      style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 16 16" width={size * 0.62} height={size * 0.62} shapeRendering="crispEdges">
        <path fill="#fff" d="M4 3h8v2h2v7H2V5h2zM5 12h2v2H5zm4 0h2v2H9z" />
        <path fill="#1d1d1f" d="M5 7h2v2H5zm4 0h2v2H9zM7 10h2v1H7z" />
      </svg>
    </span>
  );
}

const links = [['/', 'World'], ['/list', 'List view']] as const;

export function Nav({ user, theme, path, overlay, onNavigate, onToggleTheme, onSearch, onAuth, onAgents, onHow, onLogout }: {
  user: User | null; theme: Theme; path: string; overlay: boolean; onNavigate: (path: string) => void; onToggleTheme: () => void; onSearch: () => void;
  onAuth: () => void; onAgents: () => void; onHow: () => void; onLogout: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  return (
    <header className={cx('top-0 z-40 transition-[background,border-color] duration-300',
      overlay ? 'pointer-events-none fixed inset-x-0 p-2 sm:p-3' : 'sticky',
      !overlay && (scrolled ? 'glass !border-x-0 !border-t-0' : 'border-b border-transparent'))}>
      <nav className={cx('mx-auto flex h-14 max-w-[1240px] items-center gap-2 px-4 sm:px-6',
        overlay && 'glass pointer-events-auto h-12 max-w-none rounded-full !px-2 shadow-card sm:!px-3')} aria-label="Main">
        <a href="/" onClick={e => { e.preventDefault(); onNavigate('/'); }} className="mr-3 flex shrink-0 items-center gap-2.5 rounded-lg whitespace-nowrap" aria-label="Oracle Commons home">
          <BrandMark />
          <span className={cx('text-[17px] font-semibold tracking-[-0.03em]', overlay && 'hidden sm:inline')}>Oracle Commons</span>
        </a>
        <div className="hidden items-center whitespace-nowrap md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} aria-current={path === href ? 'page' : undefined} onClick={e => { e.preventDefault(); onNavigate(href); }}
              className={cx('rounded-full px-3 py-1.5 text-[14px] transition hover:text-fg', path === href ? 'font-medium text-fg' : 'text-muted')}>{label}</a>
          ))}
          <a href="/demonstration" className="rounded-full px-3 py-1.5 text-[14px] text-muted transition hover:text-fg">Demonstration</a>
          <button onClick={onHow} className="rounded-full px-3 py-1.5 text-[14px] text-muted transition hover:text-fg">How it works</button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={onSearch} aria-label="Search problems and actions"
            className="hidden h-8 items-center gap-2 rounded-full border border-line bg-sunken/60 pr-1.5 pl-3 text-[13px] text-subtle transition hover:border-line-strong hover:text-muted sm:flex">
            <Search className="size-3.5" /> <span className="pr-6">Search</span> <Kbd>⌘K</Kbd>
          </button>
          <button onClick={onSearch} aria-label="Search" className="grid size-9 place-items-center rounded-full text-muted hover:text-fg sm:hidden">
            <Search className="size-[18px]" />
          </button>
          <button onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="relative grid size-9 place-items-center overflow-hidden rounded-full text-muted transition hover:bg-[color-mix(in_srgb,var(--fg)_6%,transparent)] hover:text-fg">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={theme} initial={{ y: 14, rotate: -40, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -14, rotate: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                {theme === 'dark' ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <a
            href="/roadmap"
            aria-current={path === '/roadmap' ? 'page' : undefined}
            onClick={e => { e.preventDefault(); onNavigate('/roadmap'); }}
            className={cx(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition active:scale-[0.97]',
              path === '/roadmap'
                ? 'border-transparent bg-[linear-gradient(135deg,var(--orange),var(--pink))] text-white shadow-[0_6px_18px_-6px_color-mix(in_srgb,var(--pink)_65%,transparent)]'
                : 'border-line bg-elev text-fg hover:border-line-strong',
            )}
          >
            <Compass className={cx('size-3.5', path === '/roadmap' ? 'text-white' : 'text-orange')} />
            <span>Roadmap</span>
          </a>
          {user ? (
            <div className="relative">
              <button onClick={e => { e.stopPropagation(); setMenu(m => !m); }} aria-expanded={menu} aria-haspopup="menu"
                className="flex h-8 items-center gap-2 rounded-full border border-line bg-elev pr-3 pl-1 text-[13px] font-medium transition hover:border-line-strong">
                <span className="grid size-6 place-items-center rounded-full bg-[linear-gradient(140deg,var(--blue),var(--indigo))] text-[11px] font-semibold text-white">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate sm:inline">@{user.handle}</span>
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div role="menu" initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.16 }} style={{ transformOrigin: 'top right' }}
                    className="glass absolute top-10 right-0 w-56 rounded-2xl p-1.5 shadow-float">
                    <div className="px-3 py-2">
                      <div className="truncate text-[14px] font-semibold">{user.displayName}</div>
                      <div className="truncate text-[12px] text-muted">@{user.handle}</div>
                    </div>
                    <div className="my-1 h-px bg-line" />
                    <MenuItem onClick={onAgents} icon={<Bot className="size-4" />}>Your agents</MenuItem>
                    <MenuItem onClick={onLogout} icon={<LogOut className="size-4" />}>Sign out</MenuItem>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={onAuth}>Join</Button>
          )}
        </div>
      </nav>
    </header>
  );
}

function MenuItem({ onClick, icon, children }: { onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] text-fg transition hover:bg-[color-mix(in_srgb,var(--fg)_7%,transparent)]">
      <span className="text-muted">{icon}</span>{children}
    </button>
  );
}
