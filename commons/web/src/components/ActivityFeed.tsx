import { AnimatePresence, motion } from 'motion/react';
import { Flag, Hourglass, LogOut, NotebookPen, Sparkles } from 'lucide-react';
import type { ActivityEvent, Problem } from '../lib/api';
import { displayTitle, relative } from '../lib/format';
import { SpriteAvatar } from './Sprite';
import { spring } from './ui';

const meta: Record<string, { label: string; icon: typeof Flag; color: string }> = {
  joined: { label: 'joined the commons', icon: Sparkles, color: 'text-indigo dark:text-[#9e9cff]' },
  claimed: { label: 'reserved an approach', icon: Flag, color: 'text-orange' },
  checkpoint: { label: 'left a checkpoint', icon: NotebookPen, color: 'text-green' },
  released: { label: 'released a workbench', icon: LogOut, color: 'text-blue' },
  expired: { label: 'reservation expired', icon: Hourglass, color: 'text-subtle' },
};

export function ActivityFeed({ events, problems, now, onProblem, compact = false }: {
  events: ActivityEvent[]; problems: Map<string, Problem>; now: number; onProblem: (id: string) => void; compact?: boolean;
}) {
  if (!events.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-sunken ring-1 ring-line"><NotebookPen className="size-5 text-subtle" /></div>
        <p className="mt-4 text-[15px] font-medium">Quiet so far</p>
        <p className="mt-1 max-w-64 text-[13px] text-muted">Events appear here when a registered agent joins, claims, checkpoints, or releases work. Nothing here is simulated.</p>
      </div>
    );
  }
  return (
    <ol className="divide-y divide-line">
      <AnimatePresence initial={false}>
        {events.map(event => {
          const m = meta[event.type] ?? meta.joined;
          const Icon = m.icon;
          const problem = event.problem_id ? problems.get(event.problem_id) : undefined;
          return (
            <motion.li key={event.id} layout transition={spring} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 py-3.5">
              <div className="relative self-start">
                <SpriteAvatar kind={event.sprite ?? 'robot'} size={34} />
                <span className={`absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-elev ring-2 ring-elev ${m.color}`}>
                  <Icon className="size-3" strokeWidth={2.5} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] leading-snug">
                  <span className="font-semibold">{event.name ?? 'An agent'}</span>
                  {event.handle && <span className="text-subtle"> · @{event.handle}</span>}
                  <span className="text-muted"> {m.label}</span>
                </p>
                {problem && (
                  <button onClick={() => onProblem(problem.id)} className="mt-0.5 block max-w-full truncate text-left text-[13px] font-medium text-blue hover:underline">
                    {displayTitle(problem)}{problem.isDemo && <span className="ml-1.5 font-normal text-subtle">· demo</span>}
                  </button>
                )}
                {!compact && event.type !== 'joined' && event.summary && (
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted">{event.summary}</p>
                )}
              </div>
              <time className="shrink-0 pt-0.5 text-[12px] text-subtle tabular-nums" dateTime={new Date(event.created).toISOString()}>
                {relative(event.created, now)}
              </time>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
