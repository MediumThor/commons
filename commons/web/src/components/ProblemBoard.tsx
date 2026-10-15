import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, ChevronDown, FlaskConical, Lock, Search, X } from 'lucide-react';
import type { Problem } from '../lib/api';
import { colorFor, type District } from '../lib/districts';
import { displayTitle, kindLabel, shortCompute } from '../lib/format';
import { SpriteAvatar } from './Sprite';
import { Badge, Segmented, cx, spring } from './ui';

type Filter = 'all' | 'active' | 'open';
type Sort = 'active' | 'field' | 'az';
const sorts: Record<Sort, string> = { active: 'Most active', field: 'By field', az: 'A–Z' };
const PAGE = 12;

export function ProblemBoard({ problems, districts, district, onDistrict, onOpen }: {
  problems: Problem[]; districts: District[]; district: District | null; onDistrict: (d: District | null) => void; onOpen: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('active');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = problems.filter(p =>
      (!district || district.id === p.categoryId)
      && (filter === 'all' || (filter === 'active' ? p.activeTasks > 0 : p.activeTasks === 0))
      && (!q || [p.title, p.originalTitle, p.category, p.id, p.description].some(s => s.toLowerCase().includes(q))));
    const compare: Record<Sort, (a: Problem, b: Problem) => number> = {
      active: (a, b) => b.activeTasks - a.activeTasks || b.checkpoints - a.checkpoints || a.order - b.order,
      field: (a, b) => a.categoryOrder - b.categoryOrder || a.order - b.order,
      az: (a, b) => a.title.localeCompare(b.title),
    };
    return rows.sort(compare[sort]);
  }, [problems, district, filter, query, sort]);

  const activeCount = problems.filter(p => p.activeTasks > 0).length;
  const allDemo = problems.length > 0 && problems.every(p => p.isDemo);

  return (
    <section id="problems" className="mx-auto max-w-[1240px] px-4 py-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The next good question</p>
          <h2 className="mt-2 text-[clamp(32px,4.5vw,52px)] leading-[1.02] font-semibold tracking-[-0.04em]">The problem board</h2>
          <p className="mt-3 max-w-lg text-[17px] text-muted">
            {allDemo
              ? `${problems.length} demo exercises for trying the collaboration loop. Pick one, reserve a bounded approach, and leave the map better than you found it.`
              : `${problems.length} problems with checkable answers. Pick one, reserve a bounded approach, and leave the map better than you found it.`}
          </p>
        </div>
        <Segmented label="Availability" value={filter} onChange={v => { setFilter(v); setLimit(PAGE); }} options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: <>Being explored <span className="text-subtle tabular-nums">{activeCount}</span></> },
          { value: 'open', label: 'Room to help' },
        ]} />
      </div>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
          <input value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE); }} type="search" placeholder="Find your next rabbit hole…"
            aria-label="Search problems"
            className="h-11 w-full rounded-full border border-line bg-elev pr-4 pl-10 text-[15px] outline-none transition placeholder:text-subtle focus:border-blue focus:ring-4 focus:ring-[color-mix(in_srgb,var(--blue)_18%,transparent)]" />
        </label>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <Chip active={!district} onClick={() => onDistrict(null)}>Every field</Chip>
          {districts.map(d => (
            <Chip key={d.id} active={district?.id === d.id} onClick={() => onDistrict(district?.id === d.id ? null : d)} color={d.color}>{d.name}</Chip>
          ))}
        </div>
        <label className="relative shrink-0">
          <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-subtle" />
          <select value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort problems"
            className="h-11 appearance-none rounded-full border border-line bg-elev pr-9 pl-9 text-[14px] font-medium outline-none focus:border-blue">
            {Object.entries(sorts).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-subtle" />
        </label>
      </div>

      <div className="mt-4 flex h-6 items-center gap-2 text-[13px] text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? 'problem' : 'problems'}
        {district && (
          <button onClick={() => onDistrict(null)} className="inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-[12px] ring-1 ring-line hover:text-fg">
            {district.name} <X className="size-3" />
          </button>
        )}
      </div>

      <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.slice(0, limit).map(problem => <ProblemCard key={problem.id} problem={problem} color={colorFor(districts, problem.categoryId)} onOpen={onOpen} />)}
        </AnimatePresence>
      </motion.div>

      {!list.length && (
        <div className="mt-6 rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
          <p className="text-[17px] font-medium">No problems match</p>
          <p className="mt-1 text-[14px] text-muted">Try a broader search or another neighborhood.</p>
        </div>
      )}
      {list.length > limit && (
        <div className="mt-10 flex justify-center">
          <button onClick={() => setLimit(l => l + PAGE * 2)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-elev px-5 text-[15px] font-medium transition hover:border-line-strong">
            Show more <span className="text-subtle tabular-nums">{list.length - limit} left</span> <ChevronDown className="size-4" />
          </button>
        </div>
      )}
      {allDemo && (
        <p className="mt-10 text-center text-[13px] text-subtle">
          Original Commons demo exercises · Development fixtures, not scientific discoveries or a vetted open-problem registry.
        </p>
      )}
    </section>
  );
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={cx('inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition',
        active ? 'border-transparent bg-fg text-bg' : 'border-line bg-elev text-muted hover:border-line-strong hover:text-fg')}>
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

function ProblemCard({ problem, color, onOpen }: { problem: Problem; color: string; onOpen: (id: string) => void }) {
  const sealed = problem.disclosure === 'commit-only';
  return (
    <motion.button
      layout transition={spring}
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      onClick={() => onOpen(problem.id)}
      className="group card relative flex flex-col overflow-hidden rounded-[24px] p-5 text-left transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float"
    >
      <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: color }} />
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-2 text-[13px] font-medium text-muted">
          <span className="size-2 shrink-0 rounded-full" style={{ background: color }} /><span className="truncate">{problem.category}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {sealed && <Badge tone="indigo"><Lock className="size-3" />Private</Badge>}
          {problem.isDemo
            ? <Badge tone="orange"><FlaskConical className="size-3" />Demo</Badge>
            : <Badge tone={problem.kind === 'moonshot' ? 'pink' : problem.kind === 'harvest' ? 'green' : 'neutral'}>{kindLabel[problem.kind]}</Badge>}
        </div>
      </div>
      <h3 className="mt-4 text-[19px] leading-tight font-semibold tracking-[-0.025em] text-balance">{displayTitle(problem)}</h3>
      <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">{problem.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="truncate text-[12px] text-subtle">{shortCompute(problem.compute)}</span>
        {problem.activeAgents.length ? (
          <span className="flex items-center gap-2 text-[12px] font-medium text-green">
            <span className="flex -space-x-2">
              {problem.activeAgents.slice(0, 3).map(a => <SpriteAvatar key={a.id} kind={a.sprite} size={24} className="ring-2 !ring-elev" />)}
            </span>
            {problem.activeTasks} active
          </span>
        ) : (
          <span className="text-[12px] text-subtle">Open seat</span>
        )}
      </div>
    </motion.button>
  );
}
