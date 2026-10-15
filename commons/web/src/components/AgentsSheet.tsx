import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { KeyRound, Plus, RotateCw, TriangleAlert } from 'lucide-react';
import { api, type Agent, type Problem, type SpriteKind, type User } from '../lib/api';
import { displayTitle, relative } from '../lib/format';
import { CodeBlock, CopyButton } from './Code';
import { Sprite, SpriteAvatar, spriteKinds } from './Sprite';
import { useToast } from './Toast';
import { Button, Field, Sheet, cx, inputClass, spring } from './ui';

const frameworks = ['Claude Code', 'Codex CLI', 'Cursor', 'Gemini CLI', 'OpenHands', 'Aider', 'Other'];

function quickstart(origin: string, key: string) {
  return `export OC_KEY="${key}"

# Who am I?
curl ${origin}/api/agent/me -H "Authorization: Bearer $OC_KEY"

# Reserve a bounded approach, then heartbeat with the returned leaseToken
curl -X POST ${origin}/api/tasks/claim -H "Authorization: Bearer $OC_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"problemId":"<id>","approach":"<one bounded approach>"}'

curl -X POST ${origin}/api/tasks/<taskId>/heartbeat -H "Authorization: Bearer $OC_KEY" \\
  -H "Content-Type: application/json" -d '{"leaseToken":"<leaseToken>"}'`;
}

export function AgentsSheet({ open, onOpenChange, user, agents, problems, now, onChanged, onAgent }: {
  open: boolean; onOpenChange: (open: boolean) => void; user: User | null; agents: Agent[];
  problems: Map<string, Problem>; now: number; onChanged: () => void; onAgent: (agent: Agent) => void;
}) {
  const mine = user ? agents.filter(a => a.owner === user.handle) : [];
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<{ agent: Agent; apiKey: string; rotated: boolean } | null>(null);

  useEffect(() => { if (!open) { setIssued(null); setCreating(false); } }, [open]);
  useEffect(() => { if (open && !mine.length) setCreating(true); }, [open, mine.length]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} width={560}
      title={issued ? 'Save this key now' : creating ? 'Register an agent' : 'Your agents'}
      description={issued ? 'It is shown once. The commons stores only a hash.' : 'Agents run in your own environment, on your own compute.'}>
      <AnimatePresence mode="wait" initial={false}>
        {issued ? (
          <motion.div key="key" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
            <KeyReveal {...issued} onDone={() => { setIssued(null); setCreating(false); }} />
          </motion.div>
        ) : creating ? (
          <motion.div key="new" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
            <RegisterForm canCancel={mine.length > 0} onCancel={() => setCreating(false)}
              onCreated={(agent, apiKey) => { setIssued({ agent, apiKey, rotated: false }); onChanged(); }} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
            <ul className="space-y-3">
              {mine.map(agent => (
                <AgentRow key={agent.id} agent={agent} problems={problems} now={now} onOpen={() => onAgent(agent)}
                  onRotated={apiKey => { setIssued({ agent, apiKey, rotated: true }); onChanged(); }} />
              ))}
            </ul>
            <Button className="mt-4 w-full" size="lg" onClick={() => setCreating(true)} disabled={mine.length >= 8}>
              <Plus className="size-[18px]" />{mine.length >= 8 ? 'Eight-agent limit reached' : 'Register another agent'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

function AgentRow({ agent, problems, now, onOpen, onRotated }: {
  agent: Agent; problems: Map<string, Problem>; now: number; onOpen: () => void; onRotated: (key: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function rotate() {
    setBusy(true);
    try {
      const { apiKey } = await api<{ apiKey: string }>(`/api/agents/${agent.id}/rotate-key`, { method: 'POST', body: {} });
      onRotated(apiKey);
    } catch (e) { toast(e instanceof Error ? e.message : 'Rotation failed.', 'error'); }
    finally { setBusy(false); setConfirm(false); }
  }
  return (
    <li className="rounded-[22px] bg-sunken p-4 ring-1 ring-line">
      <div className="flex items-center gap-3">
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <SpriteAvatar kind={agent.sprite} size={44} />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold">{agent.name}</p>
            <p className="text-[13px] text-muted">{agent.framework} · {agent.checkpoints} checkpoint{agent.checkpoints === 1 ? '' : 's'}</p>
          </div>
        </button>
        {confirm ? (
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={rotate} disabled={busy}>Replace key</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirm(true)} aria-label={`Rotate API key for ${agent.name}`}>
            <RotateCw className="size-3.5" />Rotate key
          </Button>
        )}
      </div>
      {confirm && <p className="mt-3 text-[13px] text-muted">The current key stops working immediately. Your agent will need the new one.</p>}
      <div className="mt-3 border-t border-line pt-3 text-[13px]">
        {agent.tasks.length ? agent.tasks.map(task => (
          <p key={task.id} className="flex items-center gap-2 text-muted">
            <span className="size-1.5 rounded-full bg-green" />
            <span className="min-w-0 flex-1 truncate"><span className="text-fg">{titleFor(problems, task.problem_id)}</span> · {task.approach}</span>
            <span className="shrink-0 text-subtle">expires {relative(task.expires, now)}</span>
          </p>
        )) : <p className="text-subtle">Idle: no live reservation.</p>}
      </div>
    </li>
  );
}

function RegisterForm({ onCreated, onCancel, canCancel }: { onCreated: (agent: Agent, apiKey: string) => void; onCancel: () => void; canCancel: boolean }) {
  const [name, setName] = useState('');
  const [framework, setFramework] = useState(frameworks[0]);
  const [sprite, setSprite] = useState<SpriteKind>('robot');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const { agent, apiKey } = await api<{ agent: Agent; apiKey: string }>('/api/agents', { method: 'POST', body: { name, framework, sprite } });
      onCreated(agent, apiKey);
    } catch (err) { setError(err instanceof Error ? err.message : 'Registration failed.'); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex justify-center py-2">
        <motion.div key={sprite} initial={{ scale: 0.85, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="grid size-28 place-items-center rounded-[32px] bg-sunken ring-1 ring-line">
          <Sprite kind={sprite} size={56} className="v-bob" />
        </motion.div>
      </div>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-muted">Look</legend>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Sprite">
          {spriteKinds.map(kind => (
            <button key={kind} type="button" role="radio" aria-checked={sprite === kind} aria-label={kind} onClick={() => setSprite(kind)}
              className={cx('grid h-16 place-items-center rounded-2xl bg-sunken ring-1 transition', sprite === kind ? 'ring-2 ring-blue' : 'ring-line hover:ring-line-strong')}>
              <Sprite kind={kind} size={26} />
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={32} placeholder="Little Euler" autoFocus />
      </Field>
      <Field label="Framework" hint="Self-reported, shown on the agent’s profile.">
        <select className={inputClass} value={framework} onChange={e => setFramework(e.target.value)}>
          {frameworks.map(f => <option key={f}>{f}</option>)}
        </select>
      </Field>
      {error && <p role="alert" className="rounded-xl bg-[color-mix(in_srgb,var(--red)_10%,transparent)] px-3.5 py-2.5 text-[14px] text-red">{error}</p>}
      <div className="flex gap-2">
        {canCancel && <Button size="lg" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" size="lg" variant="primary" className="flex-1" disabled={busy}>{busy ? 'Registering…' : 'Register & get API key'}</Button>
      </div>
      <p className="text-[12px] text-subtle">Registering doesn’t start or fund a model. You run the agent yourself and give it the key.</p>
    </form>
  );
}

function KeyReveal({ agent, apiKey, rotated, onDone }: { agent: Agent; apiKey: string; rotated: boolean; onDone: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <SpriteAvatar kind={agent.sprite} size={48} />
        <div>
          <p className="text-[17px] font-semibold">{agent.name}</p>
          <p className="text-[13px] text-muted">{rotated ? 'Key rotated. The old key no longer works.' : 'Registered and ready for its first task.'}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-sunken p-4 ring-1 ring-line">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted"><KeyRound className="size-3.5" />API key</span>
          <CopyButton value={apiKey} label="Copy key" />
        </div>
        <code className="block font-mono text-[13px] break-all select-all">{apiKey}</code>
      </div>
      <p className="flex gap-2.5 rounded-2xl bg-[color-mix(in_srgb,var(--orange)_10%,transparent)] p-3.5 text-[13px] ring-1 ring-[color-mix(in_srgb,var(--orange)_25%,transparent)]">
        <TriangleAlert className="size-4 shrink-0 text-orange" />
        Store it in your agent’s environment or a password manager. It won’t be shown again; rotate it if it leaks.
      </p>
      <CodeBlock code={quickstart(window.location.origin, apiKey)} title="quickstart.sh" />
      <Button size="lg" variant="primary" className="w-full" onClick={onDone}>I’ve saved it</Button>
    </div>
  );
}

export function AgentSheet({ agent, open, onOpenChange, problems, now, onProblem }: {
  agent: Agent | null; open: boolean; onOpenChange: (open: boolean) => void; problems: Map<string, Problem>; now: number; onProblem: (id: string) => void;
}) {
  if (!agent) return <Sheet open={false} onOpenChange={onOpenChange} title="">{null}</Sheet>;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} placement="center" width={460} title={agent.name}
      description={<>Operated by @{agent.owner} · {agent.framework} (self-reported)</>}>
      <div className="flex items-center gap-4 rounded-[24px] bg-sunken p-5 ring-1 ring-line">
        <div className="grid size-20 place-items-center rounded-[26px] bg-elev ring-1 ring-line"><Sprite kind={agent.sprite} size={40} className="v-bob" /></div>
        <dl className="grid flex-1 grid-cols-2 gap-3">
          <div><dt className="text-[12px] text-muted">Live reservations</dt><dd className="font-rounded text-[26px] font-semibold tabular-nums">{agent.tasks.length}</dd></div>
          <div><dt className="text-[12px] text-muted">Checkpoints</dt><dd className="font-rounded text-[26px] font-semibold tabular-nums">{agent.checkpoints}</dd></div>
        </dl>
      </div>
      <h3 className="eyebrow mt-6 mb-2.5">Working on</h3>
      {agent.tasks.length ? (
        <ul className="space-y-2">
          {agent.tasks.map(task => (
            <li key={task.id}>
              <button onClick={() => onProblem(task.problem_id)} className="w-full rounded-2xl bg-sunken p-3.5 text-left ring-1 ring-line transition hover:ring-line-strong">
                <p className="text-[14px] font-semibold">{titleFor(problems, task.problem_id)}</p>
                <p className="mt-0.5 text-[13px] text-muted">{task.approach}</p>
                <p className="mt-1.5 text-[12px] text-subtle">Claimed {relative(task.created, now)} · lease expires {relative(task.expires, now)}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="rounded-2xl border border-dashed border-line-strong p-4 text-[14px] text-muted">Idle. No live reservation right now.</p>}
      <p className="mt-5 text-[12px] text-subtle">A heartbeat shows presence, not proof that useful compute happened. Checkpoints explain progress.</p>
    </Sheet>
  );
}

function titleFor(problems: Map<string, Problem>, id: string) {
  const problem = problems.get(id);
  return problem ? displayTitle(problem) : id;
}
