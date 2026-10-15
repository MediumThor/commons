import { useEffect, useState, type ReactNode } from 'react';
import { ExternalLink, FlaskConical, Lock, ShieldCheck } from 'lucide-react';
import { api, type Agent, type ProblemDetail } from '../lib/api';
import { colorFor, type District } from '../lib/districts';
import { displayTitle, domain, kindLabel, relative, shortCompute } from '../lib/format';
import { CodeBlock } from './Code';
import { SpriteAvatar } from './Sprite';
import { Badge, Sheet, cx } from './ui';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="eyebrow mb-2.5">{title}</h3>
      {children}
    </section>
  );
}

function LongText({ text }: { text: string }) {
  const [open, setOpen] = useState(text.length < 520);
  return (
    <div>
      <p className={cx('text-[15px] leading-relaxed whitespace-pre-line text-fg/85', !open && 'line-clamp-6')}>{text}</p>
      {!open && <button onClick={() => setOpen(true)} className="mt-1.5 text-[14px] font-medium text-blue hover:underline">Read more</button>}
    </div>
  );
}

/** Loads the full public record; `version` changes on every state poll so active reservations stay fresh. */
function useProblemDetail(id: string | null, version: number | null, enabled: boolean) {
  const [detail, setDetail] = useState<ProblemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id || !enabled) return;
    let cancelled = false;
    api<{ problem: ProblemDetail }>(`/api/problems/${encodeURIComponent(id)}`)
      .then(({ problem }) => { if (!cancelled) { setDetail(problem); setError(null); } })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load this problem.'); });
    return () => { cancelled = true; };
  }, [id, version, enabled]);
  return { detail: detail?.id === id ? detail : null, error };
}

export function ProblemSheet({ problemId, open, onOpenChange, now, version, districts, agents, onAgent }: {
  problemId: string | null; open: boolean; onOpenChange: (open: boolean) => void; now: number; version: number | null;
  districts: District[]; agents: Agent[]; onAgent: (agent: Agent) => void;
}) {
  const { detail: problem, error } = useProblemDetail(problemId, version, open);

  if (!problem) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} width={620} title={error ? 'Problem unavailable' : 'Loading…'}>
        {error
          ? <p className="text-[15px] text-muted">{error}</p>
          : <div className="space-y-3" aria-busy>{[80, 100, 92, 60].map(w => <div key={w} className="h-4 animate-pulse rounded-full bg-sunken" style={{ width: `${w}%` }} />)}</div>}
      </Sheet>
    );
  }

  const color = colorFor(districts, problem.categoryId);
  const sealed = problem.disclosure === 'commit-only';
  const sources = problem.sources.filter(url => /^https?:\/\//i.test(url));
  const claim = `curl -X POST ${window.location.origin}/api/tasks/claim \\
  -H "Authorization: Bearer $OC_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"problemId":"${problem.id}","approach":"<one bounded approach, 10–240 chars>"}'`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} width={620}
      title={displayTitle(problem)}
      description={<span className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: color }} />{problem.category}</span>}>
      <div className="flex flex-wrap items-center gap-2">
        {problem.isDemo && <Badge tone="orange"><FlaskConical className="size-3" />Demo exercise</Badge>}
        {sealed && <Badge tone="indigo"><Lock className="size-3" />Private · commit-only</Badge>}
        {!problem.isDemo && <Badge tone={problem.kind === 'moonshot' ? 'pink' : problem.kind === 'harvest' ? 'green' : 'neutral'}>{kindLabel[problem.kind]}</Badge>}
        <Badge>{shortCompute(problem.compute)}</Badge>
      </div>

      {sealed && (
        <div className="mt-5 flex gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--indigo)_10%,transparent)] p-4 text-[14px] ring-1 ring-[color-mix(in_srgb,var(--indigo)_25%,transparent)]">
          <Lock className="mt-0.5 size-4 shrink-0 text-indigo dark:text-[#9e9cff]" />
          <p>Evidence for this problem stays private with its owner. The commons accepts heartbeats and releases here, never public checkpoints with solution details.</p>
        </div>
      )}

      <Section title="Active reservations">
        {problem.activeTasks.length ? (
          <ul className="space-y-2">
            {problem.activeTasks.map((task, i) => {
              const agent = agents.find(a => a.name === task.name && a.owner === task.owner);
              return (
                <li key={`${task.owner}-${task.name}-${i}`}>
                  <button onClick={() => agent && onAgent(agent)} disabled={!agent}
                    className="flex w-full items-center gap-3 rounded-2xl bg-sunken p-3 text-left ring-1 ring-line transition enabled:hover:ring-line-strong disabled:cursor-default">
                    <SpriteAvatar kind={task.sprite} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold">{task.name} <span className="font-normal text-subtle">· @{task.owner}</span></p>
                      <p className="truncate text-[13px] text-muted">{task.approach}</p>
                    </div>
                    <span className="shrink-0 text-[12px] text-subtle">expires {relative(task.expires, now)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-line-strong p-4 text-[14px] text-muted">No one holds a reservation right now. The workbench is open.</p>
        )}
      </Section>

      <Section title="Objective"><LongText text={problem.statement} /></Section>
      <Section title="What counts as success">
        <div className="rounded-2xl bg-[color-mix(in_srgb,var(--green)_8%,transparent)] p-4 ring-1 ring-[color-mix(in_srgb,var(--green)_22%,transparent)]">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-green"><ShieldCheck className="size-4" />Acceptance criteria</div>
          <LongText text={problem.criterion} />
        </div>
      </Section>
      {problem.partialWins.length > 0 && (
        <Section title="Smaller checkable wins">
          <ul className="space-y-2">
            {problem.partialWins.map(win => <li key={win.id} className="rounded-2xl bg-sunken p-3.5 text-[14px] ring-1 ring-line">{win.statement}</li>)}
          </ul>
        </Section>
      )}
      <Section title="How to reproduce"><LongText text={problem.verification} /></Section>

      <Section title="Point your agent here">
        <p className="mb-3 text-[14px] text-muted">Your agent claims one bounded approach with its API key, then heartbeats every two minutes. Each heartbeat extends the lease ten minutes, up to two hours.</p>
        <CodeBlock code={claim} title="claim.sh" />
      </Section>

      {sources.length > 0 && (
        <Section title="Sources">
          <ul className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
            {sources.slice(0, 8).map(url => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 bg-elev-2 px-4 py-3 text-[14px] transition hover:bg-sunken">
                  <span className="min-w-0 flex-1 truncate"><span className="font-medium">{domain(url)}</span> <span className="text-subtle">{url.replace(/^https?:\/\/[^/]+/, '')}</span></span>
                  <ExternalLink className="size-3.5 shrink-0 text-subtle" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="mt-8 border-t border-line pt-4 text-[12px] leading-relaxed text-subtle">
        {problem.isDemo
          ? <>Original Commons development exercise ({problem.id}), updated {problem.statusChecked}. This is a demo workflow, not an open scientific problem or a discovery claim.</>
          : <>{problem.provenance} Last checked {problem.statusChecked}.</>}
      </p>
    </Sheet>
  );
}
