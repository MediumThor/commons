import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight, CheckCircle2, Compass, FileCode2,
  FolderGit2, Lock, Play, RefreshCw, Search,
  Sparkles, Wrench,
} from 'lucide-react';
import { api, type CommonsState, type SpriteKind } from '../lib/api';
import { relative } from '../lib/format';
import { CodeBlock, CopyButton } from './Code';
import { ConnectionChip } from './Hero';
import { Sprite, SpriteAvatar, SpritePixels } from './Sprite';
import { Badge, Button, LiveDot, Segmented, Sheet, cx, spring, type Tone } from './ui';
import { Archive, Cottage, Gate, MootHall, Noticeboard, Well } from '../world/art/buildings';
import { Butterfly, Flower, Lantern, R, Sign, Tree, WorkTable } from '../world/art/props';

export interface RoadmapFileStatus {
  path: string;
  exists: boolean;
  mtimeMs: number | null;
  size: number;
}

export interface RoadmapCapability {
  id: string;
  method: string;
  path: string;
  status: 'available' | 'unavailable';
  principal: string;
  summary: string;
}

export interface RoadmapSection {
  id: string;
  title: string;
  phaseLabel: string;
  track: 'platform' | 'world' | 'economics' | 'integration';
  station: string;
  sprite: SpriteKind | 'steward';
  optional: boolean;
  docStatus: string;
  effectiveState: 'complete' | 'in_progress' | 'available' | 'ready_for_review' | 'assigned' | 'blocked' | string;
  agentWorking: boolean;
  activityBadge: string;
  owner: string;
  updatedAt: string | null;
  claim: {
    exists: boolean;
    owner: string;
    section: string;
    status: string | null;
    claimedAt: string | null;
    completedAt: string | null;
    note: string | null;
    mtimeMs: number | null;
  } | null;
  dependsOn: string[];
  unlocks: string[];
  canRunWith: string[];
  exclusiveLocks: string[];
  additiveFiles: string[];
  restrictionNote: string;
  concurrency?: {
    parallelStatus: 'complete' | 'active_now' | 'can_start_now' | 'prep_safe_now' | 'lock_conflict' | 'waiting_deps' | 'optional_gated' | 'coordinator' | string;
    parallelSummary: string;
    missingDeps: string[];
    lockConflicts: { file: string; heldBy: string[] }[];
    canStartImmediately: boolean;
    canScaffoldAlongside: boolean;
  };
  scope: string;
  dependenciesText: string;
  acceptanceCriteria: string[];
  log: string[];
  completedWork: string[];
  validation: string;
  blockers: string;
  nextAction: string;
  limitations: string[];
  fileActivity: {
    totalFiles: number;
    existingFiles: number;
    lastModifiedAt: number | null;
    recentlyTouched: boolean;
    files: RoadmapFileStatus[];
  };
  capabilities: RoadmapCapability[];
  claimCommand: string;
  agentPrompt: string;
}

export interface RoadmapSnapshot {
  generatedAt: number;
  summary: {
    totalRequired: number;
    completedDocCount: number;
    totalCompletedCount?: number;
    filesLandedCount: number;
    activeAgentSections: number;
    readyToStartCount: number;
    availableCapabilities: number;
    totalCapabilities: number;
  };
  concurrencyGuide: {
    now: string[];
    afterP1AndW0: string[];
    worldSequence: string[];
    liveLockTable?: {
      file: string;
      rule: string;
      activeHolders: { id: string; owner: string; title: string }[];
      waitingSections: string[];
    }[];
    exclusiveLocks: { file: string; rule: string }[];
  };
  ownerDecisions: {
    id: string;
    section: string;
    title: string;
    detail: string;
    doc: string;
  }[];
  sections: RoadmapSection[];
  recentWorklog: {
    date: string;
    title: string;
    changed: string[];
    verified: string[];
    next: string;
  }[];
}

type StatusFilter = 'all' | 'actionable' | 'working' | 'done' | 'blocked';
type TrackFilter = 'all' | 'platform' | 'world' | 'economics' | 'integration';

const TRACK_INFO: Record<RoadmapSection['track'], { label: string; color: string; tone: Tone; description: string }> = {
  platform: {
    label: 'Core Platform (P0–P7)',
    color: 'var(--orange)',
    tone: 'orange',
    description: 'Contracts, human identity & instructions, research leases, evidence registry, process forum, human assembly, and pilot.',
  },
  world: {
    label: 'Oracle Green World (W0–W5)',
    color: 'var(--green)',
    tone: 'green',
    description: 'Pixel-art village scenery, interactive world shell, truthful state model, station interiors, HUD, and server event cursors.',
  },
  economics: {
    label: 'Commons Economics (E0–E1)',
    color: 'var(--indigo)',
    tone: 'indigo',
    description: 'Emulator-backed promotional credit ledger and optional owner-authorized Fuji testnet wallet spike.',
  },
  integration: {
    label: 'Coordinator (INT)',
    color: 'var(--blue)',
    tone: 'blue',
    description: 'Single-owner file locks, section assignments, shared schema sequencing, and final completion bar checks.',
  },
};

const HOURLY_AUDITOR_PROMPT = `You are the Hourly Coordinator & Roadmap Auditor (section INT) running in /Users/ryan/Desktop/Commons on a persistent 1-hour loop (/loop 1h).

Every hour, perform this audit and roadmap check-off pass:

1. INSPECT LIVE STATE & CLAIMS
- Read WORKPLAN.md, progress/*.md, progress/claims/*/owner, and the tail of wiki/WORKLOG.md.
- Query or inspect the owned files for every section that is currently 'in_progress', 'ready_for_review', 'available', or has files on disk.
- Check file modification times: if an agent edited files in the last 10 minutes, do NOT overwrite its active code—let it finish its turn.

2. RUN VERIFICATION GATES
- From /Users/ryan/Desktop/Commons/commons, run:
  - npm test
  - npm run check
  - npm run check:web
- For any section whose owned files exist on disk (e.g. P1, W0–W4, P2–P7, E1), verify each acceptance criterion listed in progress/<ID>.md (including route capabilities in /api/v1/capabilities, tests, and browser checks for UI sections).

3. CHECK OFF COMPLETED SECTIONS & UNBLOCK NEXT STEPS
- When a section satisfies EVERY acceptance criterion in progress/<ID>.md and passes its tests:
  - Update progress/<ID>.md: set '- Status: complete', update '- Updated: <UTC ISO timestamp>', record concrete test/check evidence under '## Validation' and '## Completed work', and append a timestamped entry under '## Log'.
  - If progress/claims/<ID>/owner exists, set 'status: complete' and 'completed: <UTC ISO timestamp>' in that file.
  - Update WORKPLAN.md: set that section's '- Status: complete'.
  - Check all sections in WORKPLAN.md and progress/*.md whose 'Depends on' list is now 100% complete (and that do not conflict on an active exclusive lock like service.mjs or App.tsx): flip their status from 'blocked' to 'available' so the Roadmap page shows them ready to claim next.
- If a section has landed files on disk but fails a test or misses an acceptance criterion, do NOT mark it complete; record the exact remaining gap under '## Blockers' or '## Validation' in progress/<ID>.md.

4. RECORD HANDOFF
- Append a concise hourly audit summary to wiki/WORKLOG.md (reread the end of the file first) and update wiki/NEXT.md if the available frontier changed.
- Rebuild the web bundle ('npm --prefix commons run build') if frontend files changed and check:web passes.`;

function stateMeta(section: RoadmapSection): { label: string; tone: Tone; dot: 'green' | 'orange' | 'red' | 'muted' } {
  if (section.docStatus === 'complete') {
    return { label: 'Done', tone: 'green', dot: 'green' };
  }
  if (section.agentWorking) {
    return { label: 'Agent working', tone: 'orange', dot: 'orange' };
  }
  if (section.effectiveState === 'ready_for_review') {
    return { label: 'Files on disk · needs check', tone: 'blue', dot: 'green' };
  }
  if (section.docStatus === 'available' || section.effectiveState === 'available') {
    return { label: 'Ready next', tone: 'orange', dot: 'green' };
  }
  if (section.id === 'INT') {
    return { label: 'Coordinator standby', tone: 'indigo', dot: 'muted' };
  }
  return { label: section.optional ? 'Optional · gated' : 'Blocked', tone: 'neutral', dot: 'muted' };
}

export function useRoadmap(pollMs = 8000) {
  const [data, setData] = useState<RoadmapSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await api<RoadmapSnapshot>('/api/v1/roadmap');
      setData(next);
      setError(null);
      setFetchedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load roadmap.');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { data, error, fetchedAt, refresh };
}

export function RoadmapPage({
  commonsState,
  now,
  onNavigate,
}: {
  commonsState: CommonsState | null;
  now: number;
  onNavigate: (path: string) => void;
}) {
  const { data, error, fetchedAt, refresh } = useRoadmap();
  const reduce = useReducedMotion() ?? false;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [trackFilter, setTrackFilter] = useState<TrackFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sectionMap = useMemo(
    () => new Map((data?.sections ?? []).map(s => [s.id, s])),
    [data?.sections],
  );

  const selected = selectedId ? sectionMap.get(selectedId) ?? null : null;

  const openSection = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  const readySections = useMemo(
    () => (data?.sections ?? []).filter(s =>
      (s.docStatus === 'available' || s.effectiveState === 'available' || s.concurrency?.canStartImmediately)
      && s.effectiveState !== 'complete'
      && !s.agentWorking,
    ),
    [data?.sections],
  );

  const canWorkAlongsideSections = useMemo(
    () => (data?.sections ?? []).filter(s =>
      (s.concurrency?.canStartImmediately || s.concurrency?.canScaffoldAlongside)
      && s.effectiveState !== 'complete'
      && !s.agentWorking,
    ),
    [data?.sections],
  );

  const lockRestrictedSections = useMemo(
    () => (data?.sections ?? []).filter(s =>
      s.effectiveState !== 'complete'
      && !s.agentWorking
      && s.id !== 'INT'
      && ((s.concurrency?.lockConflicts?.length ?? 0) > 0 || (s.concurrency?.missingDeps?.length ?? 0) > 0 || s.optional),
    ),
    [data?.sections],
  );

  const activeSections = useMemo(
    () => (data?.sections ?? []).filter(s => s.agentWorking || s.effectiveState === 'ready_for_review'),
    [data?.sections],
  );

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.sections ?? []).filter(s => {
      if (trackFilter !== 'all' && s.track !== trackFilter) return false;
      if (statusFilter === 'actionable' && !(s.docStatus === 'available' || s.agentWorking || s.effectiveState === 'ready_for_review')) return false;
      if (statusFilter === 'working' && !s.agentWorking && s.effectiveState !== 'ready_for_review') return false;
      if (statusFilter === 'done' && s.docStatus !== 'complete') return false;
      if (statusFilter === 'blocked' && (s.docStatus === 'complete' || s.docStatus === 'available' || s.agentWorking)) return false;
      if (q) {
        const hay = [s.id, s.title, s.phaseLabel, s.station, s.scope, s.activityBadge, ...s.dependsOn].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data?.sections, trackFilter, statusFilter, query]);

  const rise = (delay: number) => reduce ? {} : {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  };

  const summary = data?.summary;
  const liveBoardAgents = commonsState?.agents.filter(a => a.tasks.length > 0) ?? [];

  return (
    <main className="pb-24">
      {/* Hero header */}
      <section className="relative isolate overflow-hidden pt-12 pb-10 sm:pt-16">
        <div aria-hidden className="grid-fade pointer-events-none absolute inset-0 -z-10" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-36 left-1/2 -z-10 h-[440px] w-[860px] -translate-x-1/2 rounded-full opacity-45 blur-[115px] dark:opacity-35"
          style={{
            background:
              'radial-gradient(closest-side, var(--orange), transparent), radial-gradient(closest-side at 25% 60%, var(--green), transparent), radial-gradient(closest-side at 80% 50%, var(--indigo), transparent)',
          }}
        />

        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <motion.div {...rise(0)} className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-elev/80 py-1 pr-3.5 pl-1.5 text-[13px] text-muted backdrop-blur">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--green)_16%,transparent)] px-2.5 py-0.5 font-medium text-green">
                <Compass className="size-3.5" /> Live Docs & Disk
              </span>
              <span>Synced from <code className="font-mono text-[12px] text-fg">WORKPLAN.md</code>, <code className="font-mono text-[12px] text-fg">progress/*.md</code> &amp; owned files</span>
            </div>

            <div className="flex items-center gap-2">
              <ConnectionChip error={error} fetchedAt={fetchedAt} now={now} />
              <Button size="sm" variant="secondary" onClick={refresh} aria-label="Refresh roadmap">
                <RefreshCw className="size-3.5" /> Refresh
              </Button>
            </div>
          </motion.div>

          <motion.div {...rise(0.06)} className="mt-6 max-w-3xl">
            <p className="eyebrow">The Village Masterplan</p>
            <h1 className="mt-2 text-[clamp(36px,6vw,68px)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
              Building Oracle Commons,{' '}
              <span className="text-gradient">one bench at a time.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[clamp(16px,1.8vw,19px)] leading-relaxed text-muted">
              Every phase in <code className="font-mono text-[14px] text-fg">BUILD_PLAN.md</code> and <code className="font-mono text-[14px] text-fg">WORLD_DESIGN.md</code> is a bounded slice with its own claim lock, owned files, and acceptance gate. Click any station or card to see who is working, what has landed on disk, and what to run next.
            </p>
          </motion.div>

          {/* Summary stat bar */}
          <motion.div {...rise(0.12)} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card rounded-[24px] p-4 sm:p-5">
              <div className="flex items-center justify-between text-[13px] text-muted">
                <span>Checked off in docs</span>
                <CheckCircle2 className="size-4 text-green" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-rounded text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                  {summary ? `${summary.completedDocCount}/${summary.totalRequired}` : '—'}
                </span>
                <span className="text-[12px] text-subtle">required slices</span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                {summary
                  ? `${summary.totalCompletedCount ?? summary.completedDocCount} total complete (incl. D0) · ${summary.filesLandedCount} have all files on disk`
                  : 'Reading progress/…'}
              </p>
            </div>

            <div className="card rounded-[24px] p-4 sm:p-5">
              <div className="flex items-center justify-between text-[13px] text-muted">
                <span>Agents building now</span>
                <LiveDot tone={activeSections.length ? 'orange' : 'muted'} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-rounded text-[32px] leading-none font-semibold tracking-[-0.03em] text-orange tabular-nums">
                  {summary ? activeSections.length : '—'}
                </span>
                <span className="text-[12px] text-subtle">active steps</span>
              </div>
              <p className="mt-1.5 truncate text-[12px] text-muted">
                {activeSections.length
                  ? activeSections.map(s => s.id).join(', ') + ' active on disk / claimed'
                  : 'No active section claims right now'}
              </p>
            </div>

            <div className="card rounded-[24px] p-4 sm:p-5">
              <div className="flex items-center justify-between text-[13px] text-muted">
                <span>Ready to assign next</span>
                <Play className="size-4 text-orange" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-rounded text-[32px] leading-none font-semibold tracking-[-0.03em] text-green tabular-nums">
                  {readySections.length || '—'}
                </span>
                <span className="text-[12px] text-subtle">unblocked in docs</span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                {readySections.length ? `Start ${readySections.map(s => s.id).join(' & ')} in parallel` : 'Checking dependencies…'}
              </p>
            </div>

            <div className="card rounded-[24px] p-4 sm:p-5">
              <div className="flex items-center justify-between text-[13px] text-muted">
                <span>Live API capabilities</span>
                <Sparkles className="size-4 text-indigo" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-rounded text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                  {summary ? `${summary.availableCapabilities}/${summary.totalCapabilities}` : '—'}
                </span>
                <span className="text-[12px] text-subtle">routes live</span>
              </div>
              <p className="mt-1.5 text-[12px] text-muted">
                From <code className="font-mono text-[11px]">/api/v1/capabilities</code>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Village Expedition Map */}
      {data && (
        <section className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <VillageRoadmapMap
            sections={data.sections}
            selectedId={selectedId}
            reduce={reduce}
            onSelect={openSection}
          />
        </section>
      )}

      {/* What CAN Be Worked On While Other Agents Are Working (Live Concurrency & Restrictions Matrix) */}
      {data && (
        <section id="parallel-matrix" className="mx-auto mt-10 max-w-[1240px] px-4 sm:px-6">
          <div className="card overflow-hidden rounded-[32px] border border-line p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div>
                <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-green uppercase">
                  <Lock className="size-3.5" /> Live Concurrency &amp; File-Lock Matrix
                </div>
                <h2 className="mt-1.5 text-[clamp(22px,2.8vw,32px)] leading-tight font-semibold tracking-[-0.03em]">
                  What can be worked on right now while other agents are active
                </h2>
                <p className="mt-1.5 max-w-3xl text-[14.5px] text-muted">
                  Computed live from <code className="font-mono text-[13px] text-fg">progress/*.md</code> completions, active <code className="font-mono text-[13px] text-fg">progress/claims/*</code>, and the exclusive file-ownership rules in <code className="font-mono text-[13px] text-fg">WORKPLAN.md</code>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green"><LiveDot tone="green" /> {canWorkAlongsideSections.length} safe to run alongside</Badge>
                <Badge tone="orange"><LiveDot tone="orange" /> {activeSections.length} currently held by agents</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-12">
              {/* Left 5 cols: Safe to Run Right Now Alongside Active Agents */}
              <div className="flex flex-col rounded-[24px] bg-[color-mix(in_srgb,var(--green)_7%,var(--bg-sunken))] p-5 ring-1 ring-green/25 lg:col-span-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-fg">
                    <CheckCircle2 className="size-4 text-green" /> Safe to Run Alongside Active Agents
                  </span>
                  <Badge tone="green">Zero lock conflicts</Badge>
                </div>
                <p className="mt-1.5 text-[13px] text-muted">
                  These sections have all prerequisite phases finished and do not collide with any file currently locked by another working agent.
                </p>

                <div className="mt-4 space-y-3">
                  {canWorkAlongsideSections.map(sec => {
                    const hasPartialRestriction = sec.id === 'P2' || sec.id === 'W5';
                    return (
                      <div key={sec.id} className="rounded-2xl border border-line bg-elev p-4 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <button onClick={() => openSection(sec.id)} className="group flex items-center gap-2.5 text-left">
                            <SpriteAvatar kind={sec.sprite} size={30} />
                            <div>
                              <span className="text-[15px] font-semibold group-hover:text-orange">
                                {sec.id} — {sec.title}
                              </span>
                              <span className="block text-[12px] text-muted">{sec.station}</span>
                            </div>
                          </button>
                          <Badge tone={hasPartialRestriction ? 'orange' : 'green'}>
                            {hasPartialRestriction ? 'Safe w/ boundary' : '100% Independent'}
                          </Badge>
                        </div>

                        <p className="mt-2.5 text-[13px] font-medium text-fg">
                          {sec.concurrency?.parallelSummary}
                        </p>
                        {sec.restrictionNote && (
                          <p className="mt-1.5 rounded-xl bg-sunken/80 px-3 py-2 text-[12px] leading-relaxed text-muted ring-1 ring-line">
                            <strong className="text-fg">Restriction rule:</strong> {sec.restrictionNote}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                          <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-subtle">
                            {sec.exclusiveLocks.length > 0 ? (
                              <span>Locks: <code className="font-mono text-orange">{sec.exclusiveLocks.map(f => f.split('/').pop()).join(', ')}</code></span>
                            ) : (
                              <span className="text-green">No exclusive shared files</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CopyButton value={sec.agentPrompt} label={`Copy ${sec.id} prompt`} />
                            <button
                              onClick={() => openSection(sec.id)}
                              className="inline-flex h-7 items-center gap-1 rounded-full bg-fg px-2.5 text-[12px] font-medium text-bg transition hover:opacity-90"
                            >
                              Inspect <ArrowRight className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Middle 3 cols: Live Exclusive File Locks */}
              <div className="flex flex-col rounded-[24px] bg-sunken/70 p-5 ring-1 ring-line lg:col-span-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                    <Lock className="size-4 text-orange" /> Exclusive File Locks
                  </span>
                  <Badge tone="orange">Live Holders</Badge>
                </div>
                <p className="mt-1.5 text-[13px] text-muted">
                  Only one assigned section may edit an exclusive file at a time.
                </p>

                <div className="mt-4 space-y-3">
                  {(data.concurrencyGuide.liveLockTable ?? []).map(item => {
                    const isLocked = item.activeHolders.length > 0;
                    return (
                      <div key={item.file} className="rounded-2xl border border-line bg-elev p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <code className="truncate font-mono text-[12px] font-semibold text-fg">{item.file.replace('commons/', '')}</code>
                          <Badge tone={isLocked ? 'orange' : 'green'}>
                            {isLocked ? 'LOCKED' : 'FREE'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[12px] text-muted">{item.rule}</p>
                        {isLocked ? (
                          <div className="mt-2 rounded-xl bg-[color-mix(in_srgb,var(--orange)_12%,transparent)] px-2.5 py-1.5 text-[11.5px] font-medium text-orange">
                            Held by: {item.activeHolders.map(h => `${h.id} (${h.owner})`).join(', ')}
                          </div>
                        ) : (
                          <div className="mt-2 rounded-xl bg-[color-mix(in_srgb,var(--green)_12%,transparent)] px-2.5 py-1.5 text-[11.5px] font-medium text-green">
                            Available to claim ({item.waitingSections.join(' or ') || 'none waiting'})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 4 cols: Restricted / Blocked Right Now & Why */}
              <div className="flex flex-col rounded-[24px] bg-sunken/70 p-5 ring-1 ring-line lg:col-span-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                    <Lock className="size-4 text-subtle" /> Restricted Right Now &amp; Why
                  </span>
                  <Badge tone="neutral">{lockRestrictedSections.length} waiting</Badge>
                </div>
                <p className="mt-1.5 text-[13px] text-muted">
                  Why these sections cannot be started until an active agent or dependency finishes:
                </p>

                <div className="mt-4 space-y-2.5">
                  {lockRestrictedSections.map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => openSection(sec.id)}
                      className="block w-full rounded-2xl border border-line bg-elev p-3 text-left transition hover:border-line-strong"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-semibold">{sec.id} · {sec.title}</span>
                        {sec.concurrency?.lockConflicts?.length ? (
                          <Badge tone="red">File Lock Conflict</Badge>
                        ) : sec.optional ? (
                          <Badge tone="indigo">Owner Gate</Badge>
                        ) : (
                          <Badge tone="neutral">Needs {sec.concurrency?.missingDeps.join(', ')}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">
                        {sec.concurrency?.parallelSummary}
                      </p>
                      {sec.restrictionNote && (
                        <p className="mt-1 text-[11.5px] text-subtle">
                          Rule: {sec.restrictionNote}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* What Needs to Be Done Next According to the Docs */}
      {data && (
        <section id="up-next" className="mx-auto mt-10 max-w-[1240px] px-4 sm:px-6">
          <div className="card overflow-hidden rounded-[32px] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-orange uppercase">
                  <Wrench className="size-3.5" /> Coordinator’s Dispatch Desk · What needs to be done next
                </div>
                <h2 className="mt-1.5 text-[clamp(24px,3vw,34px)] leading-tight font-semibold tracking-[-0.03em]">
                  Next steps according to <code className="font-mono text-[0.88em]">WORKPLAN.md</code> &amp; <code className="font-mono text-[0.88em]">NEXT.md</code>
                </h2>
                <p className="mt-1.5 max-w-2xl text-[15px] text-muted">
                  Phase <strong>P0</strong> (Baseline &amp; contracts) is complete. The workplan unlocks two independent tracks right now without shared file locks: backend identity (<strong>P1</strong>) and the sprite world (<strong>W0–W4</strong>).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={HOURLY_AUDITOR_PROMPT} label="Copy 1h Cron Auditor Prompt" />
                <Button size="sm" variant="secondary" onClick={() => onNavigate('/')}>
                  Visit The Green
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onNavigate('/list')}>
                  Problem Board
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {/* Column 1: Ready Right Now */}
              <div className="flex flex-col rounded-[24px] bg-sunken/70 p-5 ring-1 ring-line">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
                    <span className="grid size-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--green)_18%,transparent)] text-green">1</span>
                    Ready to Claim &amp; Run Now
                  </span>
                  <Badge tone="green">Unblocked</Badge>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  These sections have all dependencies satisfied (<code className="font-mono text-[12px]">P0</code> complete) and do not share exclusive files.
                </p>

                <div className="mt-4 space-y-3">
                  {readySections.map(sec => (
                    <div key={sec.id} className="rounded-2xl border border-line bg-elev p-4 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => openSection(sec.id)} className="group text-left">
                          <div className="flex items-center gap-2">
                            <SpriteAvatar kind={sec.sprite} size={28} />
                            <div>
                              <span className="text-[15px] font-semibold group-hover:text-orange">
                                {sec.id} — {sec.title}
                              </span>
                              <span className="block text-[12px] text-muted">{sec.station}</span>
                            </div>
                          </div>
                        </button>
                        {sec.agentWorking ? (
                          <Badge tone="orange"><LiveDot tone="orange" /> Active on disk</Badge>
                        ) : (
                          <Badge tone="green">Available</Badge>
                        )}
                      </div>
                      <p className="mt-2.5 line-clamp-2 text-[13px] text-muted">{sec.scope}</p>
                      {sec.fileActivity.existingFiles > 0 && (
                        <p className="mt-2 text-[12px] font-medium text-orange">
                          ⚡ {sec.fileActivity.existingFiles}/{sec.fileActivity.totalFiles} owned files already exist on disk — verify &amp; mark complete!
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                        <code className="rounded-md bg-sunken px-2 py-0.5 font-mono text-[11.5px] text-muted">
                          {sec.claimCommand}
                        </code>
                        <div className="flex items-center gap-1.5">
                          <CopyButton value={sec.agentPrompt} label={`Copy ${sec.id} prompt`} />
                          <button
                            onClick={() => openSection(sec.id)}
                            className="inline-flex h-7 items-center gap-1 rounded-full bg-fg px-2.5 text-[12px] font-medium text-bg transition hover:opacity-90"
                          >
                            Details <ArrowRight className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Active Agent Work Detected */}
              <div className="flex flex-col rounded-[24px] bg-sunken/70 p-5 ring-1 ring-line">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
                    <span className="grid size-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--orange)_18%,transparent)] text-orange">2</span>
                    Agents Working Right Now
                  </span>
                  <Badge tone="orange">
                    <LiveDot tone={activeSections.length ? 'orange' : 'muted'} />
                    {activeSections.length} active
                  </Badge>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  Live check of <code className="font-mono text-[12px]">progress/claims/*</code> and recent edits to each section’s owned files on disk.
                </p>

                <div className="mt-4 space-y-2.5">
                  {activeSections.length ? (
                    activeSections.map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => openSection(sec.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-elev p-3 text-left transition hover:border-line-strong"
                      >
                        <SpriteAvatar kind={sec.sprite} size={34} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold">{sec.id} · {sec.title}</span>
                          </div>
                          <div className="mt-0.5 truncate text-[12px] text-orange">{sec.activityBadge}</div>
                          {sec.fileActivity.lastModifiedAt && (
                            <div className="text-[11.5px] text-subtle">
                              Last file edit {relative(sec.fileActivity.lastModifiedAt, now)} · doc status: {sec.docStatus}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-subtle" />
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line-strong p-5 text-center text-[13px] text-muted">
                      No agent claims or recent file edits detected right now. Copy a prompt from column 1 to dispatch an agent!
                    </div>
                  )}

                  {liveBoardAgents.length > 0 && (
                    <div className="mt-3 rounded-2xl border border-line bg-elev/80 p-3">
                      <div className="text-[12px] font-semibold text-green">
                        + {liveBoardAgents.length} research agent{liveBoardAgents.length === 1 ? '' : 's'} holding live problem leases on the board
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {liveBoardAgents.map(a => (
                          <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-[11.5px]">
                            <Sprite kind={a.sprite} size={12} /> {a.name} (@{a.owner})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: What Unlocks Next & Owner Decisions */}
              <div className="flex flex-col rounded-[24px] bg-sunken/70 p-5 ring-1 ring-line">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
                    <span className="grid size-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--indigo)_18%,transparent)] text-indigo">3</span>
                    Unlocks Next &amp; Human Decisions
                  </span>
                  <Badge tone="indigo">Sequencing</Badge>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  How the next waves unlock once <code className="font-mono text-[12px]">P1</code> and <code className="font-mono text-[12px]">W0</code> finish, plus open human-only gates.
                </p>

                <div className="mt-4 space-y-2.5">
                  <div className="rounded-2xl border border-line bg-elev p-3.5">
                    <div className="text-[12px] font-semibold tracking-[0.04em] text-subtle uppercase">After P1 completes</div>
                    <p className="mt-1 text-[13px] text-fg">
                      Run <button onClick={() => openSection('P2')} className="font-semibold text-orange underline decoration-orange/40 underline-offset-2">P2 (Research loop)</button> and{' '}
                      <button onClick={() => openSection('P4')} className="font-semibold text-orange underline decoration-orange/40 underline-offset-2">P4 (Process forum)</button> in parallel while{' '}
                      <button onClick={() => openSection('W1')} className="font-semibold text-green underline decoration-green/40 underline-offset-2">W1 → W4</button> proceed sequentially.
                    </p>
                    <p className="mt-1.5 text-[12px] text-muted">
                      ⚠️ Lock rule: <code className="font-mono text-[11px]">service.mjs</code> is single-owner (<code className="font-mono text-[11px]">P1</code> → <code className="font-mono text-[11px]">P2</code> → <code className="font-mono text-[11px]">W5</code>).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="px-1 text-[12px] font-semibold tracking-[0.04em] text-subtle uppercase">
                      Open Human Owner Decisions ({data.ownerDecisions.length})
                    </div>
                    {data.ownerDecisions.map(dec => (
                      <button
                        key={dec.id}
                        onClick={() => openSection(dec.section)}
                        className="block w-full rounded-2xl border border-line bg-elev p-3 text-left transition hover:border-line-strong"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold">{dec.title}</span>
                          <Badge tone="indigo">{dec.section}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[12px] text-muted">{dec.detail}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter & Search Bar for All Roadmap Steps */}
      <section id="steps" className="mx-auto mt-14 max-w-[1240px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Every slice in WORKPLAN.md</p>
            <h2 className="mt-1.5 text-[clamp(28px,4vw,44px)] leading-[1.04] font-semibold tracking-[-0.035em]">
              All 17 build sections
            </h2>
          </div>
          <Segmented
            label="Filter steps by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'actionable', label: <>Up next &amp; active <span className="text-subtle tabular-nums">{readySections.length + activeSections.length}</span></> },
              { value: 'working', label: <>Working <span className="text-subtle tabular-nums">{activeSections.length}</span></> },
              { value: 'done', label: <>Done <span className="text-subtle tabular-nums">{summary?.completedDocCount ?? 0}</span></> },
              { value: 'blocked', label: 'Waiting' },
            ]}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="search"
              placeholder="Search sections (e.g. P1, W0, Firestore, handoff, Moot Hall)…"
              aria-label="Search roadmap sections"
              className="h-11 w-full rounded-full border border-line bg-elev pr-4 pl-10 text-[15px] outline-none transition placeholder:text-subtle focus:border-blue focus:ring-4 focus:ring-[color-mix(in_srgb,var(--blue)_18%,transparent)]"
            />
          </label>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <TrackChip active={trackFilter === 'all'} onClick={() => setTrackFilter('all')}>Every track</TrackChip>
            {(Object.keys(TRACK_INFO) as RoadmapSection['track'][]).map(t => (
              <TrackChip
                key={t}
                active={trackFilter === t}
                color={TRACK_INFO[t].color}
                onClick={() => setTrackFilter(trackFilter === t ? 'all' : t)}
              >
                {TRACK_INFO[t].label}
              </TrackChip>
            ))}
          </div>
        </div>

        {/* Grouped by Track */}
        <div className="mt-8 space-y-12">
          {(['platform', 'world', 'economics', 'integration'] as const).map(trackKey => {
            const items = filteredSections.filter(s => s.track === trackKey);
            if (!items.length) return null;
            const info = TRACK_INFO[trackKey];
            const trackDone = items.filter(s => s.docStatus === 'complete').length;
            const trackWorking = items.filter(s => s.agentWorking || s.effectiveState === 'ready_for_review').length;

            return (
              <div key={trackKey} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div className="flex items-center gap-3">
                    <span className="size-3 rounded-full" style={{ background: info.color }} />
                    <h3 className="text-[20px] font-semibold tracking-[-0.02em]">{info.label}</h3>
                    <Badge tone={info.tone}>{trackDone}/{items.length} complete</Badge>
                    {trackWorking > 0 && (
                      <Badge tone="orange"><LiveDot tone="orange" /> {trackWorking} active on disk</Badge>
                    )}
                  </div>
                  <p className="text-[13px] text-muted">{info.description}</p>
                </div>

                <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {items.map(section => (
                      <RoadmapSectionCard
                        key={section.id}
                        section={section}
                        sectionMap={sectionMap}
                        now={now}
                        onOpen={openSection}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}

          {!filteredSections.length && (
            <div className="rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
              <p className="text-[17px] font-medium">No roadmap steps match</p>
              <p className="mt-1 text-[14px] text-muted">Try clearing the status filter or search query.</p>
            </div>
          )}
        </div>
      </section>

      {/* Shared File Locks & Recent Worklog Handoffs */}
      {data && (
        <section className="mx-auto mt-16 max-w-[1240px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Exclusive File Locks */}
            <div className="card rounded-[28px] p-6 lg:col-span-5">
              <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.05em] text-subtle uppercase">
                <Lock className="size-3.5" /> Multi-Agent Guardrails
              </div>
              <h3 className="mt-1.5 text-[22px] font-semibold tracking-[-0.025em]">Exclusive &amp; Shared File Rules</h3>
              <p className="mt-1.5 text-[14px] text-muted">
                Agents coordinate through atomic <code className="font-mono text-[12.5px] text-fg">progress/claims/&lt;id&gt;</code> directories and strict file ownership in <code className="font-mono text-[12.5px] text-fg">WORKPLAN.md</code>.
              </p>

              <ul className="mt-5 space-y-3">
                {data.concurrencyGuide.exclusiveLocks.map(lock => (
                  <li key={lock.file} className="rounded-2xl bg-sunken/80 p-3.5 ring-1 ring-line">
                    <div className="flex items-center gap-2 font-mono text-[13px] font-semibold text-fg">
                      <FileCode2 className="size-4 text-orange" /> {lock.file}
                    </div>
                    <p className="mt-1 text-[13px] text-muted">{lock.rule}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-2xl border border-line bg-elev-2 p-4">
                <div className="text-[13px] font-semibold">Completion Bar (<code className="font-mono text-[12px]">GOAL.md</code>)</div>
                <ul className="mt-2 space-y-1.5 text-[13px] text-muted">
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-green shrink-0" /> <code className="font-mono text-[12px]">npm test</code>, <code className="font-mono text-[12px]">npm run check</code> &amp; <code className="font-mono text-[12px]">npm run check:web</code> pass</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-green shrink-0" /> Firestore emulator auth &amp; transaction tests pass</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-green shrink-0" /> Two owners stay isolated; agent keys fail human ballots</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-green shrink-0" /> Browser coverage for world journeys; demos stay labelled</li>
                </ul>
              </div>
            </div>

            {/* Recent Worklog Handoffs */}
            <div className="card rounded-[28px] p-6 lg:col-span-7">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.05em] text-subtle uppercase">
                  <FolderGit2 className="size-3.5" /> From <code className="font-mono">wiki/WORKLOG.md</code>
                </div>
                <Badge tone="neutral">Latest {data.recentWorklog.length} handoffs</Badge>
              </div>
              <h3 className="mt-1.5 text-[22px] font-semibold tracking-[-0.025em]">Recent Agent Handoffs</h3>
              <p className="mt-1 text-[14px] text-muted">
                Verified changes and next-step notes appended by agents at the end of each completed slice.
              </p>

              <ol className="mt-5 space-y-3.5">
                {data.recentWorklog.map((entry, idx) => (
                  <li key={`${entry.date}-${entry.title}-${idx}`} className="rounded-2xl bg-sunken/60 p-4 ring-1 ring-line">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold tracking-[-0.015em]">{entry.title}</span>
                      <Badge tone={idx === 0 ? 'green' : 'neutral'}>{entry.date}</Badge>
                    </div>
                    {entry.changed.length > 0 && (
                      <ul className="mt-2 space-y-1 text-[13px] text-muted">
                        {entry.changed.slice(0, 2).map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-subtle" />
                            <span className="line-clamp-2">{c}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {entry.next && (
                      <div className="mt-2.5 rounded-xl bg-elev px-3 py-2 text-[12.5px] text-fg ring-1 ring-line">
                        <span className="font-semibold text-orange">Next handoff: </span>
                        <span className="text-muted">{entry.next}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Detail Sheet for Selected Roadmap Section */}
      <RoadmapStepSheet
        section={selected}
        sectionMap={sectionMap}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        now={now}
        onSelectSection={openSection}
      />
    </main>
  );
}

function TrackChip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition',
        active ? 'border-transparent bg-fg text-bg' : 'border-line bg-elev text-muted hover:border-line-strong hover:text-fg',
      )}
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  );
}

function RoadmapSectionCard({
  section,
  sectionMap,
  now,
  onOpen,
}: {
  section: RoadmapSection;
  sectionMap: Map<string, RoadmapSection>;
  now: number;
  onOpen: (id: string) => void;
}) {
  const meta = stateMeta(section);
  const track = TRACK_INFO[section.track];
  const { totalFiles, existingFiles, lastModifiedAt } = section.fileActivity;
  const availCaps = section.capabilities.filter(c => c.status === 'available').length;
  const totalCaps = section.capabilities.length;

  return (
    <motion.div
      layout
      transition={spring}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={() => onOpen(section.id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(section.id); } }}
      className={cx(
        'group card relative flex cursor-pointer flex-col overflow-hidden rounded-[24px] p-5 text-left transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-float',
        section.agentWorking && 'ring-2 ring-orange/45',
        section.docStatus === 'complete' && 'border-green/30',
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25"
        style={{ background: track.color }}
      />

      {/* Top row: ID + station + status badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-7 items-center rounded-full px-2.5 font-mono text-[13px] font-bold text-white shadow-2xs"
            style={{ background: track.color }}
          >
            {section.id}
          </span>
          <span className="truncate text-[12.5px] font-medium text-muted">{section.station}</span>
        </div>

        <Badge tone={meta.tone}>
          <LiveDot tone={meta.dot} />
          {meta.label}
        </Badge>
      </div>

      {/* Title & Sprite */}
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[18px] leading-snug font-semibold tracking-[-0.025em] text-balance group-hover:text-orange">
            {section.title}
          </h4>
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
            {section.scope}
          </p>
        </div>
        <div className="relative shrink-0">
          <SpriteAvatar
            kind={section.sprite}
            size={42}
            className={cx(section.agentWorking && 'ring-2 !ring-orange', section.docStatus === 'complete' && 'ring-2 !ring-green')}
          />
          {section.agentWorking && (
            <span
              title="Agent activity detected"
              className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-orange text-[10px] text-white shadow"
            >
              ⚡
            </span>
          )}
          {section.docStatus === 'complete' && (
            <span
              title="Complete"
              className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-green text-[10px] text-white shadow"
            >
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Live activity pill */}
      <div className="mt-3.5 rounded-xl bg-sunken/80 px-3 py-2 text-[12px] ring-1 ring-line">
        <div className="flex items-center justify-between gap-2">
          <span className={cx('font-medium truncate', section.agentWorking ? 'text-orange' : section.effectiveState === 'complete' ? 'text-green' : 'text-fg')}>
            {section.activityBadge}
          </span>
          {lastModifiedAt && (
            <span className="shrink-0 text-[11px] text-subtle">
              touched {relative(lastModifiedAt, now)}
            </span>
          )}
        </div>
        {section.concurrency && section.effectiveState !== 'complete' && section.id !== 'INT' && (
          <div className="mt-1.5 border-t border-line pt-1.5 text-[11.5px] text-muted">
            <span className={cx(
              'font-semibold',
              section.concurrency.canStartImmediately ? 'text-green' : section.agentWorking ? 'text-orange' : 'text-subtle',
            )}>
              {section.concurrency.canStartImmediately
                ? '✓ Safe alongside active agents: '
                : section.agentWorking
                  ? '⚡ Active lock: '
                  : '⏳ Restriction: '}
            </span>
            <span>{section.concurrency.parallelSummary}</span>
          </div>
        )}
      </div>

      {/* Dependencies & file progress */}
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-subtle">
          <div className="flex flex-wrap items-center gap-1">
            {section.dependsOn.length === 0 ? (
              <span>No prerequisites</span>
            ) : (
              <>
                <span>Needs:</span>
                {section.dependsOn.slice(0, 4).map(depId => {
                  const dep = sectionMap.get(depId);
                  const depDone = dep?.docStatus === 'complete';
                  return (
                    <span
                      key={depId}
                      className={cx(
                        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium',
                        depDone ? 'bg-[color-mix(in_srgb,var(--green)_15%,transparent)] text-green' : 'bg-sunken text-muted',
                      )}
                    >
                      {depDone ? '✓' : '○'} {depId}
                    </span>
                  );
                })}
                {section.dependsOn.length > 4 && <span>+{section.dependsOn.length - 4}</span>}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[11.5px]">
            {totalFiles > 0 && (
              <span className={cx(existingFiles === totalFiles ? 'text-green font-semibold' : existingFiles > 0 ? 'text-orange' : 'text-subtle')}>
                {existingFiles}/{totalFiles} files
              </span>
            )}
            {totalCaps > 0 && (
              <span className={cx(availCaps === totalCaps ? 'text-green font-semibold' : 'text-subtle')}>
                · {availCaps}/{totalCaps} API
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Interactive pixel-art village construction map showing the 3 parallel expedition trails:
 * Platform (P0–P7), World (W0–W5), and Economics (E0–E1) + INT.
 */
function VillageRoadmapMap({
  sections,
  selectedId,
  reduce,
  onSelect,
}: {
  sections: RoadmapSection[];
  selectedId: string | null;
  reduce: boolean;
  onSelect: (id: string) => void;
}) {
  const byId = useMemo(() => new Map(sections.map(s => [s.id, s])), [sections]);

  const platformNodes = [
    { id: 'P0', x: 95, y: 120 },
    { id: 'P1', x: 240, y: 120 },
    { id: 'P2', x: 390, y: 120 },
    { id: 'P3', x: 540, y: 120 },
    { id: 'P4', x: 690, y: 120 },
    { id: 'P5', x: 840, y: 120 },
    { id: 'P6', x: 990, y: 120 },
    { id: 'P7', x: 1125, y: 120 },
  ];

  const worldNodes = [
    { id: 'W0', x: 240, y: 265 },
    { id: 'W1', x: 390, y: 265 },
    { id: 'W2', x: 540, y: 265 },
    { id: 'W3', x: 690, y: 265 },
    { id: 'W4', x: 840, y: 265 },
    { id: 'W5', x: 990, y: 265 },
  ];

  const econNodes = [
    { id: 'D0', x: 240, y: 385 },
    { id: 'E0', x: 390, y: 385 },
    { id: 'E1', x: 540, y: 385 },
    { id: 'INT', x: 1125, y: 265 },
  ];

  const allNodes = [...platformNodes, ...worldNodes, ...econNodes];

  return (
    <div className="card overflow-hidden rounded-[32px] border border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-elev px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-2.5 rounded-full bg-green" />
          <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
            Oracle Green Construction Map
          </h2>
          <span className="hidden text-[13px] text-muted sm:inline">
            — Click any milestone bench to inspect its docs, owned files, and agent prompt
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-green" /> Complete</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-orange" /> Agent Working / Ready Next</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-subtle/50" /> Waiting on Dependencies</span>
        </div>
      </div>

      <div className="relative overflow-x-auto bg-[#d2dcb8] dark:bg-[#2a3325]">
        <svg
          viewBox="0 0 1220 445"
          className="block h-auto min-w-[920px] w-full select-none"
          shapeRendering="crispEdges"
          role="group"
          aria-label="Interactive roadmap trail across Platform, World, and Economics tracks"
        >
          <defs>
            {(['robot', 'frog', 'wizard', 'duck', 'ghost', 'steward'] as const).map(kind => (
              <symbol key={kind} id={`rm-sp-${kind}`} viewBox="0 0 12 18">
                <SpritePixels kind={kind} />
              </symbol>
            ))}
          </defs>

          {/* Village Meadow Background */}
          <R x={0} y={0} w={1220} h={445} c="#d2dcb8" o={0.35} />
          <Tree x={18} y={24} s={0.72} />
          <Tree x={1165} y={18} s={0.75} />
          <Tree x={25} y={320} s={0.8} />
          <Tree x={1155} y={330} s={0.78} />
          <Flower x={150} y={365} />
          <Flower x={165} y={375} color="#d5a395" />
          <Flower x={780} y={385} />
          <Flower x={910} y={370} color="#d5a395" />
          {!reduce && <Butterfly x={310} y={195} />}
          {!reduce && <Butterfly x={770} y={195} />}

          {/* Decorative Village Landmarks in Background */}
          <g transform="translate(95 62) scale(0.55)" opacity={0.9}><Gate /></g>
          <g transform="translate(240 60) scale(0.55)" opacity={0.9}><Cottage roof="#d6633e" shape="circle" own /></g>
          <g transform="translate(540 58) scale(0.45)" opacity={0.9}><Archive /></g>
          <g transform="translate(840 58) scale(0.45)" opacity={0.9}><MootHall /></g>
          <g transform="translate(990 65) scale(0.65)" opacity={0.9}><Noticeboard slips={5} /></g>
          <g transform="translate(690 385) scale(0.7)" opacity={0.85}><Well /></g>

          {/* Track Paths (Cobblestone Lanes) */}
          <g fill="none" shapeRendering="auto">
            {/* Main Platform Lane P0 -> P7 */}
            <path d="M95 120 H1125" stroke="#b6b38b" strokeWidth={28} strokeLinecap="round" />
            <path d="M95 120 H1125" stroke="#e6d9b1" strokeWidth={22} strokeLinecap="round" />

            {/* Branch P0 -> W0 and World Lane W0 -> W5 */}
            <path d="M95 120 Q160 265 240 265 H990" stroke="#b6b38b" strokeWidth={24} strokeLinecap="round" />
            <path d="M95 120 Q160 265 240 265 H990" stroke="#e6d9b1" strokeWidth={18} strokeLinecap="round" />

            {/* W4 -> P6 Integration Bridge */}
            <path d="M840 265 Q915 195 990 120" stroke="#b6b38b" strokeWidth={14} strokeDasharray="4 4" />

            {/* Branch P1/P2 -> E0/E1 Economics Lane */}
            <path d="M240 120 Q310 385 390 385 H540" stroke="#b6b38b" strokeWidth={20} strokeLinecap="round" />
            <path d="M240 120 Q310 385 390 385 H540" stroke="#e6d9b1" strokeWidth={14} strokeLinecap="round" />

            {/* P7 -> INT Coordinator Link */}
            <path d="M1125 120 V265" stroke="#b6b38b" strokeWidth={18} strokeLinecap="round" />
            <path d="M1125 120 V265" stroke="#e6d9b1" strokeWidth={12} strokeLinecap="round" />
          </g>

          {/* Track Signposts on Left */}
          <Sign cx={88} y={248} title="WORLD TRACK" subtitle="W0 — W5" width={104} post={12} />
          <Sign cx={210} y={376} title="ECONOMICS" subtitle="E0 — E1" width={96} post={12} />

          {/* Render Each Section Milestone Node */}
          {allNodes.map(node => {
            const sec = byId.get(node.id);
            if (!sec) return null;
            const isDone = sec.docStatus === 'complete';
            const isWorking = sec.agentWorking;
            const isReady = sec.docStatus === 'available' || sec.effectiveState === 'available' || sec.effectiveState === 'ready_for_review';
            const isSelected = selectedId === sec.id;

            const ringColor = isDone
              ? '#5f8f45'
              : isWorking
                ? '#d6633e'
                : isReady
                  ? '#d9a441'
                  : sec.id === 'INT'
                    ? '#4f84a3'
                    : '#8f9c74';

            const pillFill = isDone
              ? '#5f8f45'
              : isWorking
                ? '#d6633e'
                : isReady
                  ? '#d9a441'
                  : sec.id === 'INT'
                    ? '#4f84a3'
                    : '#6c7559';

            return (
              <g
                key={sec.id}
                transform={`translate(${node.x} ${node.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${sec.id}: ${sec.title}. ${sec.activityBadge}`}
                className="w-target"
                onClick={() => onSelect(sec.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(sec.id); } }}
              >
                {/* Selection / hover halo */}
                <circle
                  cx={0}
                  cy={0}
                  r={40}
                  className="w-hl"
                  style={isSelected ? { fillOpacity: 0.28, strokeOpacity: 1, stroke: '#d6633e' } : undefined}
                />

                {/* Milestone base pad */}
                <ellipse cx={0} cy={14} rx={36} ry={16} fill="#fffef7" stroke={ringColor} strokeWidth={isSelected || isWorking || isReady ? 3 : 2} shapeRendering="auto" />

                {/* Worktable or bench when active/done */}
                {(isDone || isWorking || isReady) && (
                  <g transform="translate(0 12) scale(0.45)">
                    <WorkTable cx={0} y={0} notes={isDone ? 4 : isWorking ? 2 : 0} />
                  </g>
                )}

                {/* Lantern lights up when done or agent working */}
                <Lantern x={28} y={-2} lit={isDone || isWorking || isReady} />

                {/* Sprite character stationed at milestone */}
                <g
                  className={cx(
                    !reduce && (isWorking ? 'w-work' : isDone || isReady ? 'w-idle' : ''),
                    !isDone && !isWorking && !isReady && sec.id !== 'INT' && 'w-stale',
                  )}
                >
                  <use href={`#rm-sp-${sec.sprite}`} x={-11} y={-28} width={22} height={33} />
                </g>

                {/* Status floating badge above sprite */}
                {isWorking && (
                  <g transform="translate(0 -40)" shapeRendering="auto">
                    <rect x={-28} y={-10} width={56} height={14} rx={7} fill="#d6633e" />
                    <text x={0} y={0} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">
                      WORKING
                    </text>
                  </g>
                )}
                {!isWorking && isReady && (
                  <g transform="translate(0 -40)" shapeRendering="auto">
                    <rect x={-26} y={-10} width={52} height={14} rx={7} fill="#d9a441" />
                    <text x={0} y={0} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#263b32" fontFamily="system-ui, sans-serif">
                      UP NEXT
                    </text>
                  </g>
                )}
                {isDone && (
                  <g transform="translate(0 -40)" shapeRendering="auto">
                    <rect x={-20} y={-10} width={40} height={14} rx={7} fill="#5f8f45" />
                    <text x={0} y={0} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#fff" fontFamily="system-ui, sans-serif">
                      DONE ✓
                    </text>
                  </g>
                )}

                {/* Section ID & short title plaque below node */}
                <g transform="translate(0 36)" shapeRendering="auto">
                  <rect x={-52} y={-11} width={104} height={28} rx={7} fill="#fffef9" stroke={ringColor} strokeWidth={1.5} />
                  <rect x={-48} y={-7} width={24} height={13} rx={4} fill={pillFill} />
                  <text x={-36} y={2} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff" fontFamily="ui-monospace, monospace">
                    {sec.id}
                  </text>
                  <text x={-20} y={2} fontSize={7.5} fontWeight={600} fill="#263b32" fontFamily="system-ui, sans-serif">
                    {sec.title.length > 13 ? sec.title.slice(0, 12) + '…' : sec.title}
                  </text>
                  <text x={0} y={12} textAnchor="middle" fontSize={6.8} fill="#626d5d" fontFamily="system-ui, sans-serif">
                    {sec.station}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function RoadmapStepSheet({
  section,
  sectionMap,
  open,
  onOpenChange,
  now,
  onSelectSection,
}: {
  section: RoadmapSection | null;
  sectionMap: Map<string, RoadmapSection>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  now: number;
  onSelectSection: (id: string) => void;
}) {
  if (!section) return null;
  const meta = stateMeta(section);
  const track = TRACK_INFO[section.track];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      width={620}
      title={
        <span className="flex flex-wrap items-center gap-2.5">
          <span
            className="inline-flex h-7 items-center rounded-full px-2.5 font-mono text-[14px] font-bold text-white"
            style={{ background: track.color }}
          >
            {section.id}
          </span>
          <span>{section.title}</span>
        </span>
      }
      description={`${section.phaseLabel} · ${section.station} · Official progress/${section.id}.md status: ${section.docStatus}`}
    >
      <div className="space-y-6 pt-2">
        {/* Status & Owner banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sunken p-4 ring-1 ring-line">
          <div className="flex items-center gap-3">
            <SpriteAvatar kind={section.sprite} size={44} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={meta.tone}><LiveDot tone={meta.dot} /> {meta.label}</Badge>
                <span className="text-[13px] font-medium text-fg">{section.activityBadge}</span>
              </div>
              <div className="mt-1 text-[12.5px] text-muted">
                Owner: <strong className="text-fg">{section.owner}</strong>
                {section.claim?.exists && <span className="ml-2 text-green">· Claim lock present (<code className="font-mono text-[11px]">progress/claims/{section.id}</code>)</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Scope */}
        <section>
          <h3 className="eyebrow mb-1.5">Scope</h3>
          <p className="text-[14.5px] leading-relaxed text-fg">{section.scope}</p>
        </section>

        {/* Concurrency & File Lock Restrictions */}
        <section className="rounded-2xl border border-line bg-sunken/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="eyebrow">Parallel Work &amp; File-Lock Restrictions</h3>
            {section.concurrency?.canStartImmediately && (
              <Badge tone="green">Safe to run alongside active agents</Badge>
            )}
            {(section.concurrency?.lockConflicts?.length ?? 0) > 0 && (
              <Badge tone="red">Blocked by active file lock</Badge>
            )}
          </div>
          {section.concurrency && (
            <p className="mt-2 text-[13.5px] font-medium text-fg">{section.concurrency.parallelSummary}</p>
          )}
          {section.restrictionNote && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              <strong className="text-fg">Workplan Rule:</strong> {section.restrictionNote}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            {section.exclusiveLocks.length > 0 ? (
              section.exclusiveLocks.map(lock => (
                <span key={lock} className="inline-flex items-center gap-1 rounded-lg bg-elev px-2.5 py-1 font-mono text-[11.5px] text-orange ring-1 ring-line">
                  <Lock className="size-3" /> Exclusive: {lock}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg bg-elev px-2.5 py-1 text-[11.5px] text-green ring-1 ring-line">
                ✓ Requires no exclusive shared-file locks
              </span>
            )}
            {section.additiveFiles.map(af => (
              <span key={af} className="inline-flex items-center gap-1 rounded-lg bg-elev px-2.5 py-1 font-mono text-[11.5px] text-muted ring-1 ring-line">
                + Additive: {af.split('/').pop()}
              </span>
            ))}
          </div>
        </section>

        {/* Dependencies & Unlocks */}
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-sunken/60 p-3.5 ring-1 ring-line">
            <div className="text-[12px] font-semibold text-subtle uppercase">Depends on</div>
            {section.dependsOn.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {section.dependsOn.map(depId => {
                  const dep = sectionMap.get(depId);
                  const done = dep?.docStatus === 'complete';
                  return (
                    <button
                      key={depId}
                      onClick={() => onSelectSection(depId)}
                      className={cx(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 ring-line transition hover:ring-line-strong',
                        done ? 'bg-[color-mix(in_srgb,var(--green)_15%,transparent)] text-green' : 'bg-elev text-fg',
                      )}
                    >
                      {done ? '✓' : '○'} {depId} {dep ? `· ${dep.title}` : ''}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1.5 text-[13px] text-muted">None — root foundation step.</p>
            )}
          </div>

          <div className="rounded-2xl bg-sunken/60 p-3.5 ring-1 ring-line">
            <div className="text-[12px] font-semibold text-subtle uppercase">Unlocks / Can run beside</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {section.unlocks.map(uId => (
                <button
                  key={uId}
                  onClick={() => onSelectSection(uId)}
                  className="inline-flex items-center gap-1 rounded-full bg-elev px-2.5 py-1 text-[12px] font-medium text-fg ring-1 ring-line transition hover:ring-line-strong"
                >
                  → {uId}
                </button>
              ))}
              {section.canRunWith.map(cId => (
                <button
                  key={cId}
                  onClick={() => onSelectSection(cId)}
                  className="inline-flex items-center gap-1 rounded-full bg-sunken px-2.5 py-1 text-[12px] text-muted ring-1 ring-line transition hover:text-fg"
                >
                  ∥ {cId}
                </button>
              ))}
              {!section.unlocks.length && !section.canRunWith.length && (
                <span className="text-[13px] text-muted">Final stage in track</span>
              )}
            </div>
          </div>
        </section>

        {/* Next Action & Blockers */}
        {(section.nextAction || section.blockers) && (
          <section className="rounded-2xl border border-line bg-elev-2 p-4">
            {section.nextAction && (
              <div>
                <span className="text-[12px] font-semibold tracking-[0.04em] text-orange uppercase">Next Action in Docs</span>
                <p className="mt-1 text-[14px] text-fg">{section.nextAction}</p>
              </div>
            )}
            {section.blockers && section.blockers !== 'None.' && (
              <div className="mt-3 border-t border-line pt-2.5">
                <span className="text-[12px] font-semibold tracking-[0.04em] text-subtle uppercase">Blockers</span>
                <p className="mt-1 text-[13.5px] text-muted">{section.blockers}</p>
              </div>
            )}
          </section>
        )}

        {/* Acceptance Criteria */}
        {section.acceptanceCriteria.length > 0 && (
          <section>
            <h3 className="eyebrow mb-2">Acceptance Criteria ({section.acceptanceCriteria.length})</h3>
            <ul className="space-y-2">
              {section.acceptanceCriteria.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl bg-sunken/60 p-3 text-[13.5px] leading-relaxed ring-1 ring-line">
                  <span className={cx('mt-0.5 text-[14px]', section.docStatus === 'complete' ? 'text-green' : 'text-subtle')}>
                    {section.docStatus === 'complete' ? '✓' : '○'}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Live Owned Files Telemetry */}
        {section.fileActivity.totalFiles > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="eyebrow">Owned Files on Disk ({section.fileActivity.existingFiles}/{section.fileActivity.totalFiles})</h3>
              <span className="text-[12px] text-muted">Live filesystem check</span>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sunken/50">
              {section.fileActivity.files.map(file => (
                <li key={file.path} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
                  <span className="flex min-w-0 items-center gap-2 font-mono text-[12px]">
                    <span className={file.exists ? 'text-green' : 'text-subtle'}>{file.exists ? '●' : '○'}</span>
                    <span className="truncate">{file.path}</span>
                  </span>
                  <span className="shrink-0 text-[11.5px] text-subtle">
                    {file.exists
                      ? file.mtimeMs ? `exists · edited ${relative(file.mtimeMs, now)}` : 'exists'
                      : 'not created yet'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Associated API Capabilities */}
        {section.capabilities.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="eyebrow">Phase API Capabilities ({section.capabilities.filter(c => c.status === 'available').length}/{section.capabilities.length} live)</h3>
              <span className="text-[12px] text-muted">From /api/v1/capabilities</span>
            </div>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sunken/50">
              {section.capabilities.map(cap => (
                <li key={cap.id} className="flex items-center justify-between gap-2 px-3.5 py-2 text-[12.5px]">
                  <div className="min-w-0">
                    <span className="font-mono font-semibold text-fg">{cap.method} {cap.path}</span>
                    <p className="truncate text-[12px] text-muted">{cap.summary}</p>
                  </div>
                  <Badge tone={cap.status === 'available' ? 'green' : 'neutral'}>
                    {cap.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Completed work & log */}
        {section.completedWork.length > 0 && (
          <section>
            <h3 className="eyebrow mb-2">Completed Work</h3>
            <ul className="space-y-1.5 text-[13.5px] text-muted">
              {section.completedWork.map((w, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green">✓</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Startup Prompt for Dispatching an Agent */}
        {section.id === 'INT' ? (
          <section>
            <h3 className="eyebrow mb-2">Hourly Roadmap Auditor Cron Prompt (use with /loop 1h)</h3>
            <CodeBlock
              title="Coordinator hourly check-off & unblock loop"
              code={HOURLY_AUDITOR_PROMPT}
            />
          </section>
        ) : (
          <section>
            <h3 className="eyebrow mb-2">Agent Dispatch Prompt (from AGENT_PROMPT.md)</h3>
            <CodeBlock
              title={`Assign section ${section.id} · claim with: ${section.claimCommand}`}
              code={section.agentPrompt}
            />
          </section>
        )}
      </div>
    </Sheet>
  );
}
