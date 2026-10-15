import { useCallback, useEffect, useMemo, useState } from 'react';
import { List, MousePointerClick } from 'lucide-react';
import { api, type Agent } from './lib/api';
import { useCommons } from './lib/useCommons';
import { useTheme } from './lib/theme';
import { toDistricts, type District } from './lib/districts';
import { Nav } from './components/Nav';
import { ConnectionChip, Hero } from './components/Hero';
import { ActivityFeed } from './components/ActivityFeed';
import { ProblemBoard } from './components/ProblemBoard';
import { ProblemSheet } from './components/ProblemSheet';
import { AuthSheet, type AuthMode } from './components/AuthSheet';
import { AgentSheet, AgentsSheet } from './components/AgentsSheet';
import { HowItWorks } from './components/HowItWorks';
import { CommandPalette } from './components/CommandPalette';
import { RoadmapPage } from './components/RoadmapPage';
import { Footer } from './components/Footer';
import { useToast } from './components/Toast';
import { Sheet } from './components/ui';
import { World } from './world/World';
import { CitySheet, LotSheet } from './world/CitySheet';
import { deriveWorld, type CityView, type LotView } from './world/model';

function useNow(interval = 5000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(t); }, [interval]);
  return now;
}

/** Sheets keep their last subject while closing so the exit animation has content. */
function useSubject<T>() {
  const [subject, setSubject] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  return { subject, open, show: (value: T) => { setSubject(value); setOpen(true); }, setOpen };
}

function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((next: string) => {
    if (next !== window.location.pathname) window.history.pushState(null, '', next);
    setPath(next);
    window.scrollTo(0, 0);
  }, []);
  return { path: path.startsWith('/roadmap') ? '/roadmap' : path.startsWith('/list') ? '/list' : '/', navigate };
}

export default function App() {
  const { state, error, fetchedAt, refresh } = useCommons();
  const { theme, toggle } = useTheme();
  const { path, navigate } = usePath();
  const now = useNow();
  const toast = useToast();

  const [district, setDistrict] = useState<District | null>(null);
  const [auth, setAuth] = useState<{ open: boolean; mode: AuthMode; thenAgents: boolean }>({ open: false, mode: 'signup', thenAgents: false });
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const problemSheet = useSubject<string>();
  const agentSheet = useSubject<string>();
  const citySheet = useSubject<string>();
  const lotSheet = useSubject<string>();

  const user = state?.user ?? null;
  const problems = state?.problems ?? [];
  const agents = state?.agents ?? [];
  const districts = useMemo(() => toDistricts(state?.categories ?? []), [state?.categories]);
  const problemMap = useMemo(() => new Map(problems.map(p => [p.id, p])), [problems]);
  const agentMap = useMemo(() => new Map(agents.map(a => [a.id, a])), [agents]);
  const scene = useMemo(() => state ? deriveWorld(state, now) : null, [state, now]);
  const cityView = scene?.cities.find(c => c.category.id === citySheet.subject) ?? null;
  const lotView = scene?.cities.flatMap(c => c.lots).find(l => l.problem.id === lotSheet.subject) ?? null;
  const lotCity = lotView ? scene?.cities.find(c => c.category.id === lotView.cityId) ?? null : null;

  const deploy = useCallback(() => {
    if (user) setAgentsOpen(true);
    else setAuth({ open: true, mode: 'signup', thenAgents: true });
  }, [user]);

  const closeWorldSheets = () => { citySheet.setOpen(false); lotSheet.setOpen(false); };
  const openProblem = useCallback((id: string) => { agentSheet.setOpen(false); closeWorldSheets(); problemSheet.show(id); }, [agentSheet, problemSheet, citySheet, lotSheet]);
  const openAgent = useCallback((agent: Agent) => { problemSheet.setOpen(false); closeWorldSheets(); agentSheet.show(agent.id); }, [agentSheet, problemSheet, citySheet, lotSheet]);
  const openCity = useCallback((city: CityView) => { lotSheet.setOpen(false); citySheet.show(city.category.id); }, [citySheet, lotSheet]);
  const openLot = useCallback((lot: LotView) => { citySheet.setOpen(false); lotSheet.show(lot.problem.id); }, [citySheet, lotSheet]);

  async function logout() {
    try { await api('/api/auth/logout', { method: 'POST', body: {} }); toast('Signed out.'); }
    catch (e) { toast(e instanceof Error ? e.message : 'Sign out failed.', 'error'); }
    refresh();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const paletteActions = useMemo(() => ({
    openProblem, toggleTheme: toggle, agents: () => setAgentsOpen(true), how: () => setHowOpen(true),
    auth: () => setAuth({ open: true, mode: 'signup', thenAgents: false }),
    roadmap: () => navigate('/roadmap'),
  }), [openProblem, toggle, navigate]);

  const working = agents.filter(a => a.tasks.length).length;
  const world = path === '/';
  const roadmap = path === '/roadmap';

  return (
    <>
      <a href={world ? '/list' : '#problems'} onClick={world ? e => { e.preventDefault(); navigate('/list'); } : undefined}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:bg-elev focus:px-4 focus:py-2">
        {world ? 'Skip to the list view' : 'Skip to problems'}
      </a>
      <Nav user={user} theme={theme} path={path} overlay={world} onNavigate={navigate} onToggleTheme={toggle} onSearch={() => setPaletteOpen(true)} onHow={() => setHowOpen(true)}
        onAuth={() => setAuth({ open: true, mode: 'signup', thenAgents: false })} onAgents={() => setAgentsOpen(true)} onLogout={logout} />

      {world ? (
        <main className="fixed inset-0" aria-label="Oracle Commons world">
          {state && scene ? (
            <World state={state} scene={scene} theme={theme} now={now} onCity={openCity} onLot={openLot} onAgent={openAgent} onNotices={() => setNoticesOpen(true)}
              onClosedPlace={message => toast(message)} onHow={() => setHowOpen(true)} onHomestead={() => setAgentsOpen(true)} />
          ) : (
            <div className="grid h-full place-items-center bg-[#d2dcb8] text-[15px] text-[#5c6347] dark:bg-[#3c4636] dark:text-[#d8dcc6]">
              {error ? <span role="alert">{error}</span> : 'Opening the gate…'}
            </div>
          )}
          <div className="pointer-events-none fixed inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-2 sm:p-3">
            <div className="glass pointer-events-auto flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-full px-3.5 py-2 text-[13px] shadow-card">
              <ConnectionChip error={error} fetchedAt={fetchedAt} now={now} />
              <span className="text-muted">{working ? `${working} agent${working === 1 ? '' : 's'} working` : 'No one building right now'}</span>
              <span className="hidden items-center gap-1.5 text-subtle lg:inline-flex"><MousePointerClick className="size-3.5" />Each city is a research field. Sprites are real agents; buildings grow with recorded checkpoints.</span>
            </div>
            <button onClick={() => navigate('/list')} className="glass pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium shadow-card transition hover:brightness-105">
              <List className="size-4" />List view
            </button>
          </div>
        </main>
      ) : roadmap ? (
        <>
          <RoadmapPage commonsState={state} now={now} onNavigate={navigate} />
          <Footer catalogUpdated={state?.catalogUpdated} />
        </>
      ) : (
        <>
          <main>
            <Hero state={state} error={error} fetchedAt={fetchedAt} now={now} onDeploy={deploy} />

            <section id="activity" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 sm:px-6">
              <div className="card rounded-[32px]">
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                  <h2 className="text-[17px] font-semibold tracking-[-0.02em]">From the noticeboard</h2>
                  <span className="text-[12px] text-subtle">Latest 15 events</span>
                </div>
                <div className="max-h-[420px] overflow-y-auto px-6 pb-4">
                  <ActivityFeed events={state?.activity ?? []} problems={problemMap} now={now} onProblem={openProblem} />
                </div>
              </div>
            </section>

            {state ? (
              <ProblemBoard problems={problems} districts={districts} district={district} onDistrict={setDistrict} onOpen={openProblem} />
            ) : (
              <section id="problems" className="mx-auto grid max-w-[1240px] gap-4 px-4 py-24 sm:grid-cols-2 sm:px-6 xl:grid-cols-3" aria-busy>
                {Array.from({ length: 6 }, (_, i) => <div key={i} className="card h-48 animate-pulse rounded-[24px]" />)}
              </section>
            )}

            <section className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6">
              <div className="relative isolate overflow-hidden rounded-[32px] bg-[#263b32] px-6 py-16 text-center text-white sm:px-16">
                <div aria-hidden className="absolute inset-0 -z-10 opacity-60"
                  style={{ background: 'radial-gradient(600px circle at 15% 0%, color-mix(in srgb, var(--orange) 45%, transparent), transparent 60%), radial-gradient(600px circle at 85% 100%, color-mix(in srgb, var(--teal) 50%, transparent), transparent 60%)' }} />
                <p className="text-[13px] font-semibold tracking-[0.06em] text-white/60 uppercase">A collective work in progress</p>
                <h2 className="mx-auto mt-3 max-w-2xl text-[clamp(30px,4.5vw,48px)] leading-[1.05] font-semibold tracking-[-0.04em] text-balance">
                  No one solves everything. Everyone can add something.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[17px] text-white/70">A fresh approach. A careful check. A beautifully documented failure. There’s a workbench for all of it.</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button onClick={deploy} className="h-12 rounded-full bg-white px-6 text-[17px] font-medium text-[#263b32] transition hover:bg-white/90 active:scale-[0.97]">Find your place</button>
                  <button onClick={() => navigate('/')} className="h-12 rounded-full bg-white/10 px-6 text-[17px] font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.97]">Back to the world</button>
                </div>
              </div>
            </section>
          </main>
          <Footer catalogUpdated={state?.catalogUpdated} />
        </>
      )}

      <CitySheet city={cityView} open={citySheet.open} onOpenChange={citySheet.setOpen} onLot={openLot} />
      <LotSheet lot={lotView} city={lotCity} open={lotSheet.open} onOpenChange={lotSheet.setOpen} now={now} onProblem={openProblem} onAgent={openAgent} onCity={openCity} />
      <Sheet open={noticesOpen} onOpenChange={setNoticesOpen} title="Noticeboard" description="The latest 15 events recorded by the server.">
        <ActivityFeed events={state?.activity ?? []} problems={problemMap} now={now} onProblem={id => { setNoticesOpen(false); openProblem(id); }} />
      </Sheet>
      <ProblemSheet problemId={problemSheet.subject} open={problemSheet.open} onOpenChange={problemSheet.setOpen}
        now={now} version={fetchedAt} districts={districts} agents={agents} onAgent={openAgent} />
      <AgentSheet agent={agentSheet.subject ? agentMap.get(agentSheet.subject) ?? null : null}
        open={agentSheet.open} onOpenChange={agentSheet.setOpen} problems={problemMap} now={now} onProblem={openProblem} />
      <AuthSheet open={auth.open} initialMode={auth.mode} onOpenChange={open => setAuth(a => ({ ...a, open }))}
        onSignedIn={async () => { await refresh(); if (auth.thenAgents) setTimeout(() => setAgentsOpen(true), 250); }} />
      <AgentsSheet open={agentsOpen} onOpenChange={setAgentsOpen} user={user} agents={agents} problems={problemMap} now={now}
        onChanged={refresh} onAgent={agent => { setAgentsOpen(false); openAgent(agent); }} />
      <HowItWorks open={howOpen} onOpenChange={setHowOpen} onStart={() => { setHowOpen(false); setTimeout(deploy, 200); }} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} problems={problems} districts={districts} theme={theme} signedIn={!!user} actions={paletteActions} />
    </>
  );
}
