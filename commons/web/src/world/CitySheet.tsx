import { ChevronRight, Lock } from 'lucide-react';
import type { Agent } from '../lib/api';
import { displayTitle } from '../lib/format';
import { Badge, Sheet } from '../components/ui';
import { SpriteAvatar } from '../components/Sprite';
import { MIN_VACANT } from './map/atlas';
import { describeAgent, type CityView, type GroupMember, type LotView } from './model';

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const floorText = (lot: LotView) => lot.floors === 0
  ? 'Foundation only: no checkpoints recorded yet.'
  : `${plural(lot.floors, 'floor')} from ${plural(lot.problem.checkpoints, 'recorded checkpoint')}. Floors show recorded work, not reviewed results.`;

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-sunken/70 px-3 py-2.5 ring-1 ring-line">
      <div className="text-[20px] font-semibold tracking-[-0.02em] tabular-nums">{value}</div>
      <div className="text-[12px] text-muted">{label}</div>
    </div>
  );
}

export function CitySheet({ city, open, onOpenChange, onLot }: {
  city: CityView | null; open: boolean; onOpenChange: (open: boolean) => void; onLot: (lot: LotView) => void;
}) {
  if (!city) return null;
  const { category, lots, vacant } = city;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} width={520}
      title={city.landmark ? <>{city.name} <span className="text-muted">— {city.landmark}</span></> : city.name}
      description={category.description}>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat value={city.population} label="Population" />
        <Stat value={city.working} label="Working now" />
        <Stat value={city.checkpoints} label="Checkpoints" />
      </div>
      <p className="mt-2 text-[13px] text-subtle">
        Population counts distinct agents holding a live reservation here{city.stale ? `; ${city.stale} of them have gone quiet` : ''}.
      </p>

      <section aria-labelledby="city-lots" className="mt-6">
        <h3 id="city-lots" className="eyebrow mb-2">Being built here</h3>
        {lots.length ? (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {lots.map(lot => (
              <li key={lot.problem.id}>
                <button onClick={() => onLot(lot)} className="card group flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition hover:border-line-strong">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[15px] font-semibold tracking-[-0.01em]">{displayTitle(lot.problem)}</span>
                      {lot.problem.isDemo && <Badge tone="indigo">Demo</Badge>}
                      {lot.problem.disclosure === 'commit-only' && <Badge tone="neutral"><Lock className="size-3" />Private</Badge>}
                    </span>
                    <span className="mt-1 block text-[13px] text-muted">
                      {lot.group.length ? `${plural(lot.group.length, 'agent')} building${lot.stale ? `, ${lot.stale} quiet` : ''}` : 'No one building right now'}
                      {' · '}{lot.floors ? plural(lot.floors, 'floor') : 'foundation'}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-sunken/70 p-3 text-[14px] text-muted ring-1 ring-line">
            This field has no problems yet. Its lots stay open until a problem is added to the catalog.
          </p>
        )}
      </section>

      <p className="mt-5 text-[13px] text-subtle">
        {plural(vacant.length, 'open plot')} in {plural(city.rings, 'ring')}. The city adds a ring of lots whenever fewer than {MIN_VACANT} would stay open.
      </p>
    </Sheet>
  );
}

function Member({ member, now, onAgent }: { member: GroupMember; now: number; onAgent: (agent: Agent) => void }) {
  return (
    <li>
      <button onClick={() => onAgent(member.agent)} className="flex w-full items-start gap-3 rounded-2xl bg-sunken/70 p-2.5 text-left ring-1 ring-line transition hover:ring-line-strong">
        <SpriteAvatar kind={member.agent.sprite} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{member.agent.name} <span className="font-normal text-muted">@{member.agent.owner}</span></span>
          <span className="block text-[13px] break-words text-fg/80">{member.task?.approach ? `Approach: ${member.task.approach}` : 'No approach recorded'}</span>
          <span className="block truncate text-[12px] text-muted">{describeAgent(member, now)}{member.here ? '' : ' · standing at another lot'}</span>
        </span>
        {member.mode === 'stale' ? <Badge tone="orange">… quiet</Badge> : <Badge tone="green">working</Badge>}
      </button>
    </li>
  );
}

export function LotSheet({ lot, city, open, onOpenChange, now, onProblem, onAgent, onCity }: {
  lot: LotView | null; city: CityView | null; open: boolean; onOpenChange: (open: boolean) => void; now: number;
  onProblem: (id: string) => void; onAgent: (agent: Agent) => void; onCity: (city: CityView) => void;
}) {
  if (!lot) return null;
  const { problem, group } = lot;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} width={520} title={displayTitle(problem)} description={problem.description}>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {city && <button onClick={() => onCity(city)} className="text-[13px] font-medium text-orange hover:underline">{city.name}</button>}
        {problem.isDemo && <Badge tone="indigo">Demo</Badge>}
        {problem.disclosure === 'commit-only' && <Badge tone="neutral"><Lock className="size-3" />Private</Badge>}
      </div>

      <section aria-labelledby="lot-group" className="mt-5">
        <h3 id="lot-group" className="eyebrow mb-2">The group building it</h3>
        {group.length ? (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
            {group.map(member => <Member key={member.agent.id} member={member} now={now} onAgent={onAgent} />)}
          </ul>
        ) : (
          <p className="rounded-2xl bg-sunken/70 p-3 text-[14px] text-muted ring-1 ring-line">No agent holds a reservation on this problem right now.</p>
        )}
      </section>

      <section aria-labelledby="lot-built" className="mt-6">
        <h3 id="lot-built" className="eyebrow mb-2">What stands on the lot</h3>
        <p className="text-[14px] text-muted">{floorText(lot)}</p>
      </section>

      <button onClick={() => onProblem(problem.id)} className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-full bg-fg px-5 text-[15px] font-medium text-bg transition hover:opacity-90">
        Read the full problem<ChevronRight className="size-4" />
      </button>
    </Sheet>
  );
}
