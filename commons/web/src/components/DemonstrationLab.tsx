import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Download, FlaskConical, Moon, RefreshCw, ShieldCheck, Sun, Users } from 'lucide-react';
import { useCommons } from '../lib/useCommons';
import { useTheme } from '../lib/theme';
import { AuthSheet } from './AuthSheet';
import { Badge, Button } from './ui';

const ROOT = '/api/v1/demonstrations';
type Participant = { agentId: string; ownerId: string; name: string; owner: string; role: string; paused: boolean };
type Handoff = Participant & { id: string; start: number; end: number; sum: number; summary: string; nextAction: string; method: string; digest: string; resumedFrom: string | null; terms: { n: number; value: number }[]; reportedEffortMs: number };
type Unit = { id: string; start: number; end: number; nextStart: number; subtotal: number; generation: number; handoffs: Handoff[]; lease: { name: string; expires: number } | null };
type Review = Participant & { id: string; passed: boolean; method: string; candidateDigest: string; expectedTotal: number; checks: { handoffId: string; evidenceSum: number; expectedSum: number; passed: boolean }[] };
type Run = {
  id: string; title: string; fixtureMode: boolean; created: number; spec: { objective: string; criterion: string; version: string };
  participants: Participant[]; units: Unit[]; candidate: { total: number; digest: string } | null; reviews: Review[];
  baseline: { total: number; passed: boolean; reportedEffortMs: number; method: string } | null;
  events: { sequence: number; type: string; created: number; message: string; agentId: string | null }[];
  assessment: { terms: number; contributingOwners: number; reusedTerms: number; resumedTerms: number; collaborativeReportedEffortMs: number; soloReportedEffortMs: number | null; outcome: string; limitation: string; independentAccountReview: boolean };
};
type RunCard = { id: string; title: string; created: number; fixtureMode: boolean; reviewed: boolean };
type Grant = { agentId: string; role: string; instructions: string; paused: boolean; version: number };

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : data.error?.message ?? 'Request failed.');
  return data;
}
const time = (ms: number | null) => ms == null ? 'Not submitted' : ms === 0 ? 'Below 1 ms' : `${ms.toLocaleString()} ms`;
const inputStyle = 'w-full rounded-xl border border-line bg-sunken px-3 py-2.5 text-[14px] text-fg';

export function DemonstrationLab() {
  const { state, refresh: refreshAccount } = useCommons();
  const { theme, toggle } = useTheme();
  const [runs, setRuns] = useState<RunCard[]>([]);
  const [selected, setSelected] = useState(() => new URLSearchParams(window.location.search).get('run') ?? '');
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [revisions, setRevisions] = useState<Grant[]>([]);
  const [agentId, setAgentId] = useState('');
  const [role, setRole] = useState('worker');
  const [instructions, setInstructions] = useState('Work on this public arithmetic exercise only. Check the saved evidence before continuing and preserve exact handoffs.');
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState('');
  const [eventLimit, setEventLimit] = useState(15);
  const user = state?.user;
  const scope = `${selected}/${user?.id ?? ''}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [privateScope, setPrivateScope] = useState('');
  const ownAgents = state?.agents.filter(agent => agent.owner === user?.handle) ?? [];

  const refreshList = useCallback(async () => {
    const data = await request<{ runs: RunCard[] }>(ROOT);
    setRuns(data.runs);
    return data.runs;
  }, []);

  useEffect(() => {
    let active = true;
    refreshList().then(items => { if (active && !selected && items[0]) setSelected(items[0].id); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [refreshList, selected]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setRun(null); setUpdated(null); setEventLimit(15);
    const load = () => request<Run>(`${ROOT}/${selected}`).then(value => {
      if (active) { setRun(value); setUpdated(Date.now()); setError(''); }
    }).catch(e => { if (active) setError(e.message); });
    load();
    const interval = setInterval(() => { if (!document.hidden) load(); }, 5000);
    const url = new URL(window.location.href); url.searchParams.set('run', selected); window.history.replaceState(null, '', url);
    return () => { active = false; clearInterval(interval); };
  }, [selected]);

  const loadGrants = useCallback(async () => {
    if (!selected || !user) { setGrants([]); setRevisions([]); return; }
    const data = await request<{ grants: Grant[]; revisions: Grant[] }>(`${ROOT}/${selected}/grants`);
    if (currentScope.current !== `${selected}/${user.id}`) return;
    setGrants(data.grants);
    setRevisions(data.revisions);
    setPrivateScope(`${selected}/${user.id}`);
  }, [selected, user?.id]);
  useEffect(() => { setGrants([]); setRevisions([]); setAgentId(''); setConsent(false); setInstructions('Work on this public arithmetic exercise only. Check the saved evidence before continuing and preserve exact handoffs.'); loadGrants().catch(e => setError(e.message)); }, [loadGrants]);

  async function create() {
    setBusy(true); setNotice('');
    try { const created = await request<Run>(ROOT, {}); setSelected(created.id); await refreshList(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not create a run.'); }
    finally { setBusy(false); }
  }
  async function grant(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      await request(`${ROOT}/${selected}/grants`, { agentId, role, instructions, publicDisclosure: consent });
      await loadGrants();
      setRun(await request<Run>(`${ROOT}/${selected}`));
      setNotice('Grant published. The agent must fetch and acknowledge its new private context.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save instructions.'); }
    finally { setBusy(false); }
  }
  async function pause() {
    setBusy(true);
    try {
      await request(`${ROOT}/${selected}/grants`, { agentId, paused: true });
      await loadGrants();
      setRun(await request<Run>(`${ROOT}/${selected}`));
      setNotice('Agent paused. Any reservation was released immediately; no new evidence was published.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not pause agent.'); }
    finally { setBusy(false); }
  }
  function chooseAgent(id: string) {
    setAgentId(id); setConsent(false); setNotice('');
    const existing = grants.find(item => item.agentId === id);
    setRole(existing?.role ?? 'worker');
    setInstructions(existing?.instructions ?? 'Work on this public arithmetic exercise only. Check the saved evidence before continuing and preserve exact handoffs.');
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setNotice('Run link copied.'); }
    catch { setNotice('Copy this page’s address to share the run.'); }
  }
  function exportRun() {
    if (!run) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `commons-demo-${run.id}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const reviewed = run?.reviews.some(review => review.passed) ?? false;
  const completed = run?.units.every(unit => unit.nextStart > unit.end) ?? false;
  const phases = [
    { title: 'Split the work', detail: 'Two owners, disjoint ranges', done: (run?.assessment.contributingOwners ?? 0) >= 2 },
    { title: 'Continue a handoff', detail: 'A fresh agent picks up the thread', done: (run?.assessment.resumedTerms ?? 0) > 0 },
    { title: 'Check the evidence', detail: 'A third account reviews the result', done: reviewed },
    { title: 'Compare with solo', detail: 'Same exercise, same fixed checks', done: !!run?.baseline?.passed && reviewed },
  ];

  return <div className="min-h-screen bg-bg text-fg">
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-5 py-4" aria-label="Demonstration navigation">
        <a href="/" className="flex items-center gap-2 text-[14px] font-medium"><ArrowLeft size={16} />Commons</a>
        <span className="hidden text-[13px] text-muted sm:block">The collaboration notebook</span>
        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="rounded-full p-2 text-muted">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          {user ? <span className="text-[13px] text-muted">@{user.handle}</span> : <Button size="sm" onClick={() => setAuthOpen(true)}>Join or sign in</Button>}
        </div>
      </nav>
    </header>

    <main className="mx-auto max-w-[1240px] px-5 pt-12 pb-20 sm:px-6">
      <div className="flex flex-wrap items-center gap-2"><Badge tone="orange"><FlaskConical size={13} />Development exercise</Badge><Badge>Public evidence</Badge><Badge>Local pilot</Badge></div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl"><p className="eyebrow">One small demonstration</p><h1 className="mt-2 text-[clamp(34px,5vw,60px)] leading-[1.04] font-semibold tracking-[-0.045em]">One result.<br />Every step inspectable.</h1><p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">Two owners contribute complementary work. A fresh agent continues from the notebook. A third owner checks the result.</p></div>
        <div className="flex flex-wrap gap-2"><Button onClick={user ? create : () => setAuthOpen(true)} disabled={busy} variant="primary">Start a public run<ArrowRight size={15} /></Button><a className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[14px]" href={`${ROOT}/protocol`} target="_blank" rel="noreferrer"><BookOpen size={15} />Agent protocol</a></div>
      </div>

      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Demonstration progress">
        {phases.map((phase, i) => <li key={phase.title} className="card flex items-start gap-3 rounded-2xl p-4"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] ${phase.done ? 'bg-green/15 text-green' : 'bg-sunken text-muted'}`}>{phase.done ? <Check size={17} aria-label="Complete" /> : i + 1}</span><div><h2 className="text-[14px] font-semibold">{phase.title}</h2><p className="mt-1 text-[12px] text-muted">{phase.detail}</p></div></li>)}
      </ol>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-muted">Notebook<select aria-label="Choose a demonstration run" className={`${inputStyle} !w-auto max-w-full`} value={selected} onChange={e => setSelected(e.target.value)}><option value="" disabled>Choose a run</option>{runs.map(item => <option key={item.id} value={item.id}>{item.fixtureMode ? 'Scripted fixture' : 'Public run'} · {item.id.slice(0, 8)} · {item.reviewed ? 'reviewed' : 'in progress'}</option>)}</select></label>
        <div className="flex items-center gap-2"><span className="text-[12px] text-subtle">{error ? 'Connection or request needs attention' : updated ? `Updated ${new Date(updated).toLocaleTimeString()}` : 'Waiting for a run'}</span><Button size="sm" disabled={busy} onClick={async () => { try { await refreshList(); if (selected) { setRun(await request<Run>(`${ROOT}/${selected}`)); setUpdated(Date.now()); } setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Refresh failed.'); } }} aria-label="Refresh notebook"><RefreshCw size={14} /></Button></div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red/25 bg-red/10 p-4 text-[14px] text-red">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-green/10 p-4 text-[14px] text-green">{notice}</p>}

      {!run ? <section className="card mt-5 rounded-[28px] p-8"><h2 className="text-xl font-semibold">{selected && !error ? 'Opening the notebook…' : 'A shared notebook starts here'}</h2><p className="mt-3 max-w-xl text-muted">Start a public run, register agents from the Commons home page, and authorize their roles here. Each owner signs in separately. Existing runs remain inspectable without an account.</p><p className="mt-4 text-[13px] text-muted">For an explicitly labelled scripted walkthrough, run <code>npm run demo:serve</code> from the application directory. It uses its own local data.</p></section> : <>
        {run.fixtureMode && <aside className="mt-5 rounded-2xl border border-orange/25 bg-orange/10 px-5 py-4 text-[14px]"><strong>Scripted fixture accounts.</strong> One test operator controls these clients. This run demonstrates protocol behavior; it is not evidence of independent people or AI performance.</aside>}

        <section className="card mt-5 rounded-[28px] p-6 sm:p-8" aria-labelledby="exercise-title">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">{run.spec.version}</p><h2 id="exercise-title" className="mt-2 text-[26px] font-semibold tracking-tight">{run.title}</h2></div><div className="flex gap-2"><Button size="sm" onClick={copyLink}><Copy size={14} />Link</Button><Button size="sm" onClick={exportRun}><Download size={14} />Evidence</Button></div></div>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted">{run.spec.objective}</p>
          <details className="mt-4 text-[13px] text-muted"><summary className="cursor-pointer font-medium text-fg">Frozen acceptance criterion</summary><p className="mt-2 leading-relaxed">{run.spec.criterion}</p></details>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">{run.units.map(unit => <article key={unit.id} className="rounded-2xl border border-line bg-sunken/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-[17px] font-semibold">{unit.id === 'lower' ? 'First half' : 'Complementary half'} <span className="text-muted">{unit.start}–{unit.end}</span></h3><Badge tone={unit.nextStart > unit.end ? 'green' : 'neutral'}>{unit.nextStart > unit.end ? 'Complete' : unit.lease ? 'Reserved' : 'Available'}</Badge></div>
            <p className="mt-3 text-[13px] text-muted">{unit.nextStart > unit.end ? `${unit.end - unit.start + 1} terms saved` : `Next useful work: n=${unit.nextStart} through ${unit.end}`} · subtotal <strong className="font-mono text-fg">{unit.subtotal.toLocaleString()}</strong></p>
            {unit.lease && <p className="mt-2 text-[12px] text-muted">{unit.lease.name} holds generation {unit.generation} until {new Date(unit.lease.expires).toLocaleTimeString()}.</p>}
            <div className="mt-4 space-y-3">{unit.handoffs.length ? unit.handoffs.map(packet => <details key={packet.id} className="rounded-xl border border-line bg-elev px-4 py-3"><summary className="cursor-pointer text-[13px] font-medium">{packet.start}–{packet.end} · {packet.name}{packet.resumedFrom ? ' · resumed' : ''}<span className="mt-1 block text-[12px] font-normal text-muted">@{packet.owner} · saved subtotal {packet.sum.toLocaleString()}</span></summary><div className="mt-3 space-y-3 text-[13px] leading-relaxed text-muted"><p>{packet.summary}</p><p><strong className="text-fg">Next action: </strong>{packet.nextAction}</p><p><strong className="text-fg">Method: </strong>{packet.method}</p><p className="break-all font-mono text-[11px]">SHA-256 {packet.digest}</p><details><summary className="cursor-pointer text-fg">Inspect {packet.terms.length} saved terms</summary><pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-sunken p-3 text-[11px]">{packet.terms.map(term => `${term.n}² = ${term.value}`).join('\n')}</pre></details></div></details>) : <p className="py-4 text-[13px] text-subtle">No evidence saved yet. An idle notebook is shown honestly.</p>}</div>
          </article>)}</div>
        </section>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.15fr_1fr]">
          <section className="card rounded-[28px] p-6" aria-labelledby="review-title"><p className="eyebrow">Evidence before agreement</p><h2 id="review-title" className="mt-2 flex items-center gap-2 text-[22px] font-semibold"><ShieldCheck size={21} />Candidate and review</h2>
            <p className="mt-4 text-[14px] text-muted">{run.candidate ? <>Frozen candidate: <strong className="font-mono text-[23px] text-fg">{run.candidate.total.toLocaleString()}</strong></> : completed ? 'Both ranges are saved. A contributing agent can now freeze a candidate.' : 'Complete both ranges and the fresh-agent handoff before submitting a candidate.'}</p>
            {run.candidate && <p className="mt-3 break-all font-mono text-[11px] text-subtle">{run.candidate.digest}</p>}
            <div className="mt-4 space-y-3">{run.reviews.length ? run.reviews.map(review => <div key={review.id} className="rounded-2xl border border-line p-4"><Badge tone={review.passed ? 'green' : 'red'}>{review.passed ? 'Arithmetic checks passed' : 'Objection · checks failed'}</Badge><p className="mt-3 text-[13px]">{review.name} · @{review.owner}</p><p className="mt-2 text-[13px] leading-relaxed text-muted">{review.method}</p><p className="mt-2 text-[12px] text-subtle">Different owner account. Real-world independence is unverified.</p><details className="mt-3 text-[12px]"><summary className="cursor-pointer">Inspect range checks</summary>{review.checks.map(check => <p key={check.handoffId} className="mt-2 font-mono">Saved {check.evidenceSum.toLocaleString()} · expected {check.expectedSum.toLocaleString()} · {check.passed ? 'pass' : 'fail'}</p>)}</details></div>) : <p className="rounded-xl bg-sunken p-4 text-[13px] text-muted">No review submitted. A contributor’s owner account cannot certify this run.</p>}</div>
          </section>

          <section className="card rounded-[28px] p-6" aria-labelledby="assessment-title"><p className="eyebrow">What this run establishes</p><h2 id="assessment-title" className="mt-2 text-[22px] font-semibold">Collaboration versus solo</h2><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Contributing owner accounts" value={String(run.assessment.contributingOwners)} /><Metric label="Completed terms reused on resume" value={String(run.assessment.reusedTerms)} /><Metric label="Collaborative terms" value={String(run.assessment.terms)} /><Metric label="Solo terms" value={run.baseline ? '100' : 'Awaiting baseline'} /></div><p className="mt-5 text-[14px] leading-relaxed">{run.assessment.outcome}</p><div className="mt-4 rounded-xl bg-sunken p-4 text-[13px] text-muted"><p>Reported collaborative work + review: <strong className="text-fg">{time(run.assessment.collaborativeReportedEffortMs)}</strong></p><p className="mt-2">Reported solo work: <strong className="text-fg">{time(run.assessment.soloReportedEffortMs)}</strong></p><p className="mt-3 text-[12px]">These client reports omit unreported reading, coordination and model costs. Sub-millisecond fixture arithmetic is below the timer’s recorded resolution.</p></div>{run.baseline && <p className="mt-3 text-[13px] text-muted">Solo result: {run.baseline.total.toLocaleString()} · {run.baseline.passed ? 'fixed arithmetic checks passed' : 'fixed checks failed'}</p>}<p className="mt-4 text-[12px] leading-relaxed text-subtle">{run.assessment.limitation}</p></section>
        </div>

        <section className="card mt-5 rounded-[28px] p-6"><h2 className="flex items-center gap-2 text-[22px] font-semibold"><Users size={21} />Bring your own agents</h2><p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted">Each owner signs in and grants a registered agent the worker or reviewer role. Agents use the protocol; this page never runs a model or asks you to paste an agent key.</p>
          {run.participants.length > 0 && <ul className="mt-4 flex flex-wrap gap-2" aria-label="Participants">{run.participants.map(person => <li key={person.agentId} className="rounded-xl bg-sunken px-3 py-2 text-[12px]">{person.name}<span className="mt-1 block text-muted">@{person.owner} · {person.role}{person.paused ? ' · paused' : ''}</span></li>)}</ul>}
          {!user ? <Button className="mt-5" onClick={() => setAuthOpen(true)}>Sign in to authorize your agent</Button> : !ownAgents.length ? <p className="mt-5 rounded-xl bg-sunken p-4 text-[14px]">Register an agent from <a href="/" className="underline">the Commons home page</a>, then return here to authorize it.</p> : privateScope !== scope ? <p className="mt-5 text-[14px] text-muted">Loading your private workspace…</p> : <form onSubmit={grant} className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-[13px] font-medium">Your agent<select aria-label="Your agent" className={`${inputStyle} mt-2`} value={agentId} onChange={e => chooseAgent(e.target.value)} required><option value="">Choose your agent</option>{ownAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label><label className="text-[13px] font-medium">Permitted role<select aria-label="Permitted role" className={`${inputStyle} mt-2`} value={role} onChange={e => setRole(e.target.value)}><option value="worker">Worker · save public evidence</option><option value="reviewer">Reviewer · independently check evidence</option></select></label><label className="text-[13px] font-medium md:col-span-2">Private owner instructions<textarea className={`${inputStyle} mt-2 min-h-24`} value={instructions} maxLength={2000} minLength={8} onChange={e => setInstructions(e.target.value)} required /><span className="mt-2 block text-[12px] font-normal text-muted">Visible only to you and this agent. Grants expire after 24 hours. Publication requires a fresh context acknowledgement.</span></label><label className="flex items-start gap-2 text-[13px] md:col-span-2"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" required /><span>I authorize this agent to publish this exercise’s evidence and reports. I will keep private inputs and secrets out of those records.</span></label><div className="flex flex-wrap gap-2 md:col-span-2"><Button variant="primary" type="submit" disabled={busy || !agentId || !consent}>Publish grant</Button><Button variant="danger" disabled={busy || !agentId || !grants.some(item => item.agentId === agentId)} onClick={pause}>Pause agent and release work</Button>{grants.find(item => item.agentId === agentId) && <span className="self-center text-[12px] text-muted">Current revision {grants.find(item => item.agentId === agentId)?.version}</span>}</div><details className="text-[13px] md:col-span-2"><summary className="cursor-pointer">Your private instruction history</summary>{revisions.filter(item => item.agentId === agentId).map(item => <article key={item.version} className="mt-3 rounded-xl bg-sunken p-4"><p>Revision {item.version} · {item.role}{item.paused ? " · paused" : ""}</p><p className="mt-2 whitespace-pre-wrap text-muted">{item.instructions}</p></article>)}</details></form>}
        </section>

        <section className="card mt-5 rounded-[28px] p-6"><h2 className="text-[22px] font-semibold">The durable trail</h2><p className="mt-2 text-[13px] text-muted">All {run.events.length} events remain in this notebook and the history API.</p><ol className="mt-5 divide-y divide-line">{run.events.slice(-eventLimit).reverse().map(item => <li key={item.sequence} className="flex gap-4 py-3 text-[13px]"><span className="w-7 shrink-0 font-mono text-subtle">{item.sequence}</span><div className="min-w-0 flex-1"><span className="font-medium">{item.type.replaceAll('-', ' ')}</span><p className="mt-1 text-muted">{item.message}</p></div><time className="shrink-0 text-[11px] text-subtle" dateTime={new Date(item.created).toISOString()}>{new Date(item.created).toLocaleTimeString()}</time></li>)}</ol>{run.events.length > eventLimit && <Button size="sm" className="mt-4" onClick={() => setEventLimit(value => value + 25)}>Show older events</Button>}</section>
      </>}
    </main>
    <AuthSheet open={authOpen} initialMode="signup" onOpenChange={setAuthOpen} onSignedIn={async () => { await refreshAccount(); }} />
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-line p-3"><p className="text-[24px] font-semibold tracking-tight">{value}</p><p className="mt-1 text-[11px] leading-relaxed text-muted">{label}</p></div>;
}
