import { forwardRef, useEffect, useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export const spring = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 } as const;

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-fg text-bg hover:opacity-90',
  secondary: 'bg-elev-2 text-fg border border-line hover:border-line-strong',
  ghost: 'text-muted hover:text-fg hover:bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]',
  accent: 'text-white bg-[linear-gradient(135deg,var(--orange),var(--pink))] shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--pink)_60%,transparent)] hover:brightness-110',
  danger: 'text-red bg-[color-mix(in_srgb,var(--red)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--red)_18%,transparent)]',
};
const sizes = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-[15px] gap-2', lg: 'h-12 px-6 text-[17px] gap-2' };

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes }>(
  function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cx(
          'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium transition-[background,opacity,filter,border-color,transform] duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100',
          variants[variant], sizes[size], className)}
        {...props}
      />
    );
  });

const tones = {
  neutral: 'text-muted bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]',
  orange: 'text-orange bg-[color-mix(in_srgb,var(--orange)_14%,transparent)]',
  green: 'text-green bg-[color-mix(in_srgb,var(--green)_14%,transparent)]',
  indigo: 'text-indigo bg-[color-mix(in_srgb,var(--indigo)_16%,transparent)] dark:text-[#9e9cff]',
  pink: 'text-pink bg-[color-mix(in_srgb,var(--pink)_14%,transparent)]',
  blue: 'text-blue bg-[color-mix(in_srgb,var(--blue)_14%,transparent)]',
  red: 'text-red bg-[color-mix(in_srgb,var(--red)_14%,transparent)]',
};
export type Tone = keyof typeof tones;

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium leading-5', tones[tone], className)}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-elev-2 px-1 font-sans text-[11px] font-medium text-muted">{children}</kbd>;
}

export function LiveDot({ tone = 'green', className }: { tone?: 'green' | 'orange' | 'red' | 'muted'; className?: string }) {
  const color = { green: 'text-green', orange: 'text-orange', red: 'text-red', muted: 'text-subtle' }[tone];
  return <span aria-hidden className={cx('live-dot inline-block size-2 rounded-full bg-current', color, tone === 'muted' && 'after:hidden', className)} />;
}

export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: {
  value: T; onChange: (value: T) => void; label: string; size?: 'sm' | 'md';
  options: { value: T; label: ReactNode }[];
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="relative inline-flex rounded-full bg-sunken p-0.5 ring-1 ring-line">
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx('relative z-10 rounded-full font-medium transition-colors', size === 'sm' ? 'h-7 px-3 text-[13px]' : 'h-8 px-3.5 text-[14px]',
              active ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            {active && <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 -z-10 rounded-full bg-elev shadow-card ring-1 ring-line dark:bg-elev-2" />}
            <span className="inline-flex items-center gap-1.5">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** iOS-style sheet: a bottom sheet on phones, a floating side panel or centered card on larger screens. */
export function Sheet({ open, onOpenChange, title, description, children, placement = 'side', width = 560 }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode;
  children: ReactNode; placement?: 'side' | 'center'; width?: number;
}) {
  const desktop = useMediaQuery('(min-width: 768px)');
  const reduce = useReducedMotion();
  const mode = desktop ? placement : 'bottom';
  const motionProps = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : mode === 'side'
      ? { initial: { x: 40, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 40, opacity: 0 } }
      : mode === 'center'
        ? { initial: { scale: 0.96, opacity: 0, y: 8 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.97, opacity: 0, y: 4 } }
        : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
  const position = {
    side: 'right-3 top-3 bottom-3 rounded-[28px]',
    center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[min(760px,calc(100dvh-48px))] rounded-[28px]',
    bottom: 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]',
  }[mode];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
                <motion.div
                  {...motionProps}
                  transition={reduce ? { duration: 0.15 } : spring}
                  style={mode !== 'bottom' ? { width: `min(${width}px, calc(100vw - 24px))` } : undefined}
                  className={cx('fixed z-50 flex flex-col overflow-hidden border border-line bg-elev shadow-float outline-none', position)}
                >
                  {mode === 'bottom' && <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" />}
                  <header className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-3">
                    <div className="min-w-0">
                      <Dialog.Title className="text-[22px] font-semibold tracking-[-0.025em] text-balance">{title}</Dialog.Title>
                      {description
                        ? <Dialog.Description className="mt-1 text-[14px] text-muted">{description}</Dialog.Description>
                        : <Dialog.Description className="sr-only">Dialog</Dialog.Description>}
                    </div>
                    <Dialog.Close asChild>
                      <button aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-full bg-sunken text-muted ring-1 ring-line transition hover:text-fg">
                        <X className="size-4" strokeWidth={2.4} />
                      </button>
                    </Dialog.Close>
                  </header>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>
                </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-subtle">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'h-11 w-full rounded-xl border border-line bg-sunken px-3.5 text-[15px] text-fg placeholder:text-subtle outline-none transition focus:border-blue focus:ring-4 focus:ring-[color-mix(in_srgb,var(--blue)_18%,transparent)]';
