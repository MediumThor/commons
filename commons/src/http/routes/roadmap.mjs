import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capabilitiesDocument } from '../../contracts/capabilities.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, '../../..');
const REPO_ROOT = resolve(APP_ROOT, '..');

const SECTION_ORDER = [
  'P0', 'D0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7',
  'W0', 'W1', 'W2', 'W3', 'W4', 'W5',
  'E0', 'E1',
  'INT',
];

const SECTION_META = {
  D0: {
    track: 'platform',
    phaseLabel: 'Demo D0',
    shortTitle: 'Bounded collaboration demonstration',
    station: 'Demonstration Lab',
    sprite: 'wizard',
    dependsOn: ['P0'],
    unlocks: [],
    canRunWith: ['P1', 'W0'],
    optional: true,
    exclusiveLocks: [],
    additiveFiles: ['commons/package.json', 'commons/src/contracts/capabilities.mjs', 'commons/web/src/main.tsx'],
    restrictionNote: 'Isolated to demonstration.* modules and /demonstration route; does not lock service.mjs or App.tsx.',
    ownedPaths: [
      'commons/src/domain/demonstration.mjs',
      'commons/src/http/routes/demonstration.mjs',
      'commons/src/storage/migrations/025-demonstration.sql',
      'commons/src/storage/repositories/demonstration.mjs',
      'commons/test/demonstration.test.mjs',
      'commons/web/src/components/DemonstrationLab.tsx',
      'docs/DEMONSTRATION.md',
    ],
  },
  P0: {
    track: 'platform',
    phaseLabel: 'Phase 0',
    shortTitle: 'Baseline & contracts',
    station: 'Welcome Gate',
    sprite: 'robot',
    dependsOn: [],
    unlocks: ['P1', 'W0', 'W5'],
    canRunWith: [],
    exclusiveLocks: ['commons/server.mjs', 'commons/src/domain/service.mjs', 'commons/src/storage/sqlite.mjs'],
    additiveFiles: ['commons/src/contracts/capabilities.mjs', 'commons/src/storage/port.mjs'],
    restrictionNote: 'Root baseline complete. Core P0 files stay frozen unless a later section names an additive edit.',
    ownedPaths: [
      'commons/server.mjs',
      'commons/src/contracts/capabilities.mjs',
      'commons/src/contracts/openapi.mjs',
      'commons/src/domain/service.mjs',
      'commons/src/storage/port.mjs',
      'commons/src/storage/sqlite.mjs',
      'commons/test/contracts.test.mjs',
    ],
  },
  P1: {
    track: 'platform',
    phaseLabel: 'Phase 1',
    shortTitle: 'Humans, instructions & emulator storage',
    station: 'Owner Cottages',
    sprite: 'steward',
    dependsOn: ['P0'],
    unlocks: ['P2', 'P4', 'P5', 'E1', 'E0'],
    canRunWith: ['W0', 'W1', 'W2', 'W3', 'W4'],
    exclusiveLocks: ['commons/src/domain/service.mjs'],
    additiveFiles: ['commons/src/contracts/capabilities.mjs', 'commons/src/storage/port.mjs'],
    restrictionNote: 'Holds exclusive lock on commons/src/domain/service.mjs. Must not run alongside P2 or W5. Do not edit commons/web/ or server.mjs.',
    ownedPaths: [
      'commons/src/auth',
      'commons/src/domain/instructions.mjs',
      'commons/src/http/routes/p1.mjs',
      'commons/src/storage/migrations/010-p1-identity.sql',
      'commons/src/storage/repositories/p1.mjs',
      'commons/firebase.json',
      'commons/firestore.rules',
      'commons/firestore.indexes.json',
      'commons/test/identity.test.mjs',
    ],
  },
  P2: {
    track: 'platform',
    phaseLabel: 'Phase 2',
    shortTitle: 'One research collaboration',
    station: 'Number Lab & Proof Mill',
    sprite: 'frog',
    dependsOn: ['P1'],
    unlocks: ['P3', 'P6', 'E1'],
    canRunWith: ['P4', 'W0', 'W1', 'W2', 'W3', 'W4'],
    exclusiveLocks: ['commons/src/domain/service.mjs'],
    additiveFiles: ['commons/src/contracts/capabilities.mjs', 'commons/src/storage/port.mjs'],
    restrictionNote: 'Holds exclusive lock on commons/src/domain/service.mjs. Can run alongside P4 and W0–W4, but must not touch App.tsx or sheet files while W3 holds them.',
    ownedPaths: [
      'commons/src/domain/research.mjs',
      'commons/src/http/routes/p2.mjs',
      'commons/src/storage/migrations/020-research.sql',
      'commons/src/storage/repositories/p2.mjs',
      'commons/test/research.test.mjs',
    ],
  },
  P3: {
    track: 'platform',
    phaseLabel: 'Phase 3',
    shortTitle: 'Evidence, wiki & registry',
    station: 'The Archive',
    sprite: 'wizard',
    dependsOn: ['P2'],
    unlocks: ['P7'],
    canRunWith: ['P4', 'P5', 'E1', 'W0', 'W1', 'W2', 'W3', 'W4'],
    exclusiveLocks: [],
    additiveFiles: ['commons/src/contracts/capabilities.mjs', 'commons/src/storage/port.mjs'],
    restrictionNote: 'Must not edit service.mjs or App.tsx unless explicitly sequenced by INT. Never execute uploaded bytes.',
    ownedPaths: [
      'commons/src/domain/evidence.mjs',
      'commons/src/http/routes/p3.mjs',
      'commons/src/storage/migrations/030-evidence.sql',
      'commons/src/storage/repositories/p3.mjs',
      'commons/test/evidence.test.mjs',
    ],
  },
  P4: {
    track: 'platform',
    phaseLabel: 'Phase 4',
    shortTitle: 'Process discussion & proposals',
    station: 'Moot Hall Porch',
    sprite: 'duck',
    dependsOn: ['P1'],
    unlocks: ['P5', 'P6'],
    canRunWith: ['P2', 'P3', 'E1', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5'],
    exclusiveLocks: [],
    additiveFiles: ['commons/src/contracts/capabilities.mjs', 'commons/src/storage/port.mjs'],
    restrictionNote: 'Self-contained backend slice (p4.mjs + 040-process.sql). Can run in parallel with P2 and W0–W5 as long as it does not edit service.mjs or App.tsx.',
    ownedPaths: [
      'commons/src/domain/process.mjs',
      'commons/src/http/routes/p4.mjs',
      'commons/src/storage/migrations/040-process.sql',
      'commons/src/storage/repositories/p4.mjs',
      'commons/test/process.test.mjs',
    ],
  },
  P5: {
    track: 'platform',
    phaseLabel: 'Phase 5',
    shortTitle: 'Human assembly',
    station: 'Moot Hall Chamber',
    sprite: 'steward',
    dependsOn: ['P1', 'P4'],
    unlocks: ['P6', 'P7'],
    canRunWith: ['P2', 'P3', 'E1', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5'],
    exclusiveLocks: [],
    additiveFiles: ['commons/src/contracts/capabilities.mjs', 'commons/src/storage/port.mjs'],
    restrictionNote: 'Self-contained governance slice (p5.mjs + 050-governance.sql). Store numeric voting thresholds as proposed policy until human ratification.',
    ownedPaths: [
      'commons/src/domain/governance.mjs',
      'commons/src/http/routes/p5.mjs',
      'commons/src/storage/migrations/050-governance.sql',
      'commons/src/storage/repositories/p5.mjs',
      'commons/test/governance.test.mjs',
    ],
  },
  P6: {
    track: 'platform',
    phaseLabel: 'Phase 6',
    shortTitle: 'Truthful integrated journeys',
    station: 'The Village Green',
    sprite: 'ghost',
    dependsOn: ['P2', 'P4', 'P5', 'W4'],
    unlocks: ['P7'],
    canRunWith: ['P3', 'E1'],
    exclusiveLocks: ['commons/web/src/App.tsx'],
    additiveFiles: [],
    restrictionNote: 'Connects full frontend & backend journeys. Must not edit world files while any W0–W4 section is open.',
    ownedPaths: [
      'commons/test/journeys.test.mjs',
    ],
  },
  P7: {
    track: 'platform',
    phaseLabel: 'Phase 7',
    shortTitle: 'Hosted pilot preparation',
    station: 'Bridge & Lookout',
    sprite: 'robot',
    dependsOn: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    unlocks: [],
    canRunWith: ['E1'],
    exclusiveLocks: [],
    additiveFiles: [],
    restrictionNote: 'Prepare config and checklist only; no paid cloud provisioning or live deployment without explicit human authorization.',
    ownedPaths: [
      'vercel.json',
      'commons/docs/pilot-checklist.md',
    ],
  },
  W0: {
    track: 'world',
    phaseLabel: 'World W0',
    shortTitle: 'Port village art',
    station: 'Artisan Shed',
    sprite: 'duck',
    dependsOn: ['P0'],
    unlocks: ['W1'],
    canRunWith: ['P1', 'P2', 'P3', 'P4', 'P5', 'E1'],
    exclusiveLocks: [],
    additiveFiles: ['commons/web/src/components/Sprite.tsx'],
    restrictionNote: 'Owns commons/web/src/world/art/ only. Must not edit App.tsx, server.mjs, or delete commons/public/ yet.',
    ownedPaths: [
      'commons/web/src/world/art/sprites.ts',
      'commons/web/src/world/art/buildings.tsx',
      'commons/web/src/world/art/props.tsx',
      'commons/web/src/components/Sprite.tsx',
    ],
  },
  W1: {
    track: 'world',
    phaseLabel: 'World W1',
    shortTitle: 'World shell',
    station: 'Oracle Green Map',
    sprite: 'frog',
    dependsOn: ['W0'],
    unlocks: ['W2'],
    canRunWith: ['P1', 'P2', 'P3', 'P4', 'P5', 'E1', 'W5'],
    exclusiveLocks: ['commons/web/src/App.tsx', 'commons/web/src/index.css'],
    additiveFiles: [],
    restrictionNote: 'Holds exclusive lock on App.tsx and index.css world palette. Cannot run in parallel with W2, W3, W4, or P6.',
    ownedPaths: [
      'commons/web/src/world/World.tsx',
      'commons/web/src/world/map/green.ts',
    ],
  },
  W2: {
    track: 'world',
    phaseLabel: 'World W2',
    shortTitle: 'World state model',
    station: 'Cartographer Bench',
    sprite: 'wizard',
    dependsOn: ['W1'],
    unlocks: ['W3'],
    canRunWith: ['P1', 'P2', 'P3', 'P4', 'P5', 'E1', 'W5'],
    exclusiveLocks: ['commons/web/src/App.tsx'],
    additiveFiles: [],
    restrictionNote: 'Runs sequentially after W1 and before W3 because W1–W4 share the client world shell.',
    ownedPaths: [
      'commons/web/src/world/model.ts',
    ],
  },
  W3: {
    track: 'world',
    phaseLabel: 'World W3',
    shortTitle: 'Interiors & panels',
    station: 'Station Workbenches',
    sprite: 'robot',
    dependsOn: ['W2'],
    unlocks: ['W4'],
    canRunWith: ['P1', 'P2', 'P3', 'P4', 'P5', 'E1', 'W5'],
    exclusiveLocks: ['commons/web/src/App.tsx', 'commons/web/src/components/ProblemSheet.tsx', 'commons/web/src/components/AgentsSheet.tsx'],
    additiveFiles: [],
    restrictionNote: 'Holds exclusive lock on ProblemSheet.tsx and AgentsSheet.tsx while extracting shared panels. Do not run another web section alongside W3.',
    ownedPaths: [
      'commons/web/src/world/StationSheet.tsx',
      'commons/web/src/world/Interior.tsx',
    ],
  },
  W4: {
    track: 'world',
    phaseLabel: 'World W4',
    shortTitle: 'World heads-up display',
    station: 'Watchtower HUD',
    sprite: 'ghost',
    dependsOn: ['W3'],
    unlocks: ['P6'],
    canRunWith: ['P1', 'P2', 'P3', 'P4', 'P5', 'E1', 'W5'],
    exclusiveLocks: ['commons/web/src/App.tsx'],
    additiveFiles: [],
    restrictionNote: 'Holds client shell lock until HUD is wired. Can run alongside backend P1–P5 or W5.',
    ownedPaths: [
      'commons/web/src/world/hud',
    ],
  },
  W5: {
    track: 'world',
    phaseLabel: 'World W5',
    shortTitle: 'World server fields',
    station: 'Town Bell & Clock',
    sprite: 'frog',
    dependsOn: ['P0'],
    unlocks: [],
    canRunWith: ['P3', 'P4', 'P5', 'W0', 'W1', 'W2', 'W3', 'W4', 'E1'],
    exclusiveLocks: ['commons/src/domain/service.mjs'],
    additiveFiles: ['commons/src/storage/port.mjs'],
    restrictionNote: 'Requires exclusive hold on commons/src/domain/service.mjs. Blocked whenever P1 or P2 is active.',
    ownedPaths: [
      'commons/src/storage/migrations/015-world.sql',
      'commons/src/storage/repositories/w5.mjs',
      'commons/test/world-api.test.mjs',
    ],
  },
  E0: {
    track: 'economics',
    phaseLabel: 'Econ E0',
    shortTitle: 'Fuji wallet spike (optional)',
    station: 'Assay Tent',
    sprite: 'ghost',
    dependsOn: ['P1'],
    unlocks: [],
    canRunWith: ['P2', 'P3', 'P4', 'P5', 'W0', 'W1', 'W2', 'W3', 'W4'],
    optional: true,
    exclusiveLocks: [],
    additiveFiles: [],
    restrictionNote: 'Gated on explicit human owner authorization before adding any wallet SDK or testnet config.',
    ownedPaths: [],
  },
  E1: {
    track: 'economics',
    phaseLabel: 'Econ E1',
    shortTitle: 'Promotional credit ledger',
    station: 'Tally House',
    sprite: 'wizard',
    dependsOn: ['P1', 'P2'],
    unlocks: [],
    canRunWith: ['P3', 'P4', 'P5', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5'],
    exclusiveLocks: [],
    additiveFiles: ['commons/src/contracts/capabilities.mjs', 'commons/src/storage/port.mjs'],
    restrictionNote: 'Self-contained ledger slice (e1.mjs + 060-credits.sql). Does not lock service.mjs or App.tsx.',
    ownedPaths: [
      'commons/src/domain/credits.mjs',
      'commons/src/http/routes/e1.mjs',
      'commons/src/storage/migrations/060-credits.sql',
      'commons/src/storage/repositories/e1.mjs',
      'commons/test/credits.test.mjs',
    ],
  },
  INT: {
    track: 'integration',
    phaseLabel: 'Coordinator',
    shortTitle: 'Coordinator integration',
    station: 'Town Square Signpost',
    sprite: 'steward',
    dependsOn: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'E1'],
    unlocks: [],
    canRunWith: [],
    exclusiveLocks: ['commons/server.mjs', 'commons/src/storage/sqlite.mjs', 'WORKPLAN.md', 'GOAL.md'],
    additiveFiles: [],
    restrictionNote: 'Coordinator-only. Feature agents never claim INT or edit server.mjs / sqlite.mjs.',
    ownedPaths: [
      'GOAL.md',
      'WORKPLAN.md',
      'AGENT_PROMPT.md',
      'progress/INT.md',
    ],
  },
};

function safeRead(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseClaimFile(id) {
  const claimDir = join(REPO_ROOT, 'progress', 'claims', id);
  if (!existsSync(claimDir)) return null;
  const ownerPath = join(claimDir, 'owner');
  const raw = safeRead(ownerPath);
  const fields = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();
  }
  let mtimeMs = null;
  try {
    mtimeMs = statSync(existsSync(ownerPath) ? ownerPath : claimDir).mtimeMs;
  } catch {
    mtimeMs = null;
  }
  return {
    exists: true,
    owner: fields.owner || (raw.trim().split('\n')[0] || 'claimed'),
    section: fields.section || id,
    status: fields.status || null,
    claimedAt: fields.claimed || null,
    completedAt: fields.completed || null,
    note: fields.note || null,
    mtimeMs,
  };
}

function splitMarkdownSections(markdown) {
  const lines = markdown.split('\n');
  let heading = '';
  const metaLines = [];
  const sections = {};
  let current = null;

  for (const line of lines) {
    if (!heading && line.startsWith('# ')) {
      heading = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      current = line.slice(3).trim().toLowerCase();
      sections[current] = [];
      continue;
    }
    if (current === null) {
      metaLines.push(line);
    } else {
      sections[current].push(line);
    }
  }
  return { heading, metaLines, sections };
}

function parseBullets(lines = []) {
  return lines
    .map(l => l.trim())
    .filter(l => l.startsWith('- '))
    .map(l => l.slice(2).trim());
}

function parseParagraph(lines = []) {
  return lines
    .map(l => l.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function inspectOwnedFiles(relPaths = [], nowMs = Date.now()) {
  const files = [];
  let existingCount = 0;
  let latestMtimeMs = null;

  for (const rel of relPaths) {
    const abs = resolve(REPO_ROOT, rel);
    const exists = existsSync(abs);
    let mtimeMs = null;
    let size = 0;
    if (exists) {
      existingCount++;
      try {
        const st = statSync(abs);
        mtimeMs = st.mtimeMs;
        size = st.isDirectory() ? readdirSync(abs).length : st.size;
        if (st.isDirectory()) {
          for (const child of readdirSync(abs)) {
            try {
              const cst = statSync(join(abs, child));
              if (!mtimeMs || cst.mtimeMs > mtimeMs) mtimeMs = cst.mtimeMs;
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
      if (mtimeMs && (!latestMtimeMs || mtimeMs > latestMtimeMs)) {
        latestMtimeMs = mtimeMs;
      }
    }
    files.push({
      path: rel,
      exists,
      mtimeMs: mtimeMs ? Math.round(mtimeMs) : null,
      size,
    });
  }

  const recentlyTouched = latestMtimeMs !== null && (nowMs - latestMtimeMs) <= 30 * 60 * 1000;
  return {
    totalFiles: relPaths.length,
    existingFiles: existingCount,
    lastModifiedAt: latestMtimeMs ? Math.round(latestMtimeMs) : null,
    recentlyTouched,
    files,
  };
}

function parseProgressSection(id, capabilitiesByPhase, promptTemplate, nowMs) {
  const filePath = join(REPO_ROOT, 'progress', `${id}.md`);
  const raw = safeRead(filePath);
  const { heading, metaLines, sections } = splitMarkdownSections(raw);
  const meta = SECTION_META[id] || {
    track: 'platform',
    phaseLabel: id,
    shortTitle: heading,
    station: 'Commons',
    sprite: 'robot',
    dependsOn: [],
    unlocks: [],
    canRunWith: [],
    ownedPaths: [],
  };

  const topMeta = {};
  for (const line of metaLines) {
    const m = line.trim().match(/^-\s*([A-Za-z ]+):\s*(.+)$/);
    if (m) topMeta[m[1].trim().toLowerCase()] = m[2].trim();
  }

  const titleMatch = heading.match(/^([A-Z0-9]+)\s+[—-]\s+(.+)$/);
  const title = titleMatch ? titleMatch[2].trim() : (meta.shortTitle || heading || id);
  const docStatus = (topMeta.status || 'blocked').toLowerCase();
  const docOwner = topMeta.owner || 'unassigned';
  const updatedAt = topMeta.updated || null;

  const claim = parseClaimFile(id);
  const fileActivity = inspectOwnedFiles(meta.ownedPaths, nowMs);
  const phaseCaps = capabilitiesByPhase.get(id) || [];

  // Determine live working state truthfully from claims, doc status, and disk file activity
  const isComplete = docStatus === 'complete' || claim?.status === 'complete';
  const hasActiveClaim = Boolean(claim?.exists && id !== 'INT' && !isComplete);
  const isDocInProgress = docStatus === 'in_progress' || claim?.status === 'in_progress' || (docStatus === 'assigned' && id !== 'INT');
  const hasUncheckedLandedFiles = !isComplete && id !== 'INT' && fileActivity.existingFiles > 0;
  const isActivelyEditingFiles = hasUncheckedLandedFiles && fileActivity.recentlyTouched;

  let effectiveState = docStatus; // complete | in_progress | available | blocked | assigned | ready_for_review
  let activityBadge = null;

  if (isComplete) {
    effectiveState = 'complete';
    activityBadge = 'Complete & verified';
  } else if (isDocInProgress || hasActiveClaim) {
    effectiveState = 'in_progress';
    const who = claim?.owner || docOwner;
    activityBadge = fileActivity.existingFiles > 0
      ? `Claimed by ${who} · ${fileActivity.existingFiles}/${fileActivity.totalFiles} files on disk`
      : `Claimed by ${who}`;
  } else if (isActivelyEditingFiles) {
    effectiveState = 'in_progress';
    activityBadge = `Agent active in files (${fileActivity.existingFiles}/${fileActivity.totalFiles} on disk)`;
  } else if (hasUncheckedLandedFiles && fileActivity.existingFiles === fileActivity.totalFiles && fileActivity.totalFiles > 0) {
    effectiveState = 'ready_for_review';
    activityBadge = `Files on disk (${fileActivity.existingFiles}/${fileActivity.totalFiles}) · awaiting progress check`;
  } else if (docStatus === 'available') {
    effectiveState = 'available';
    activityBadge = 'Ready for an agent to claim';
  } else if (id === 'INT') {
    effectiveState = 'assigned';
    activityBadge = 'Coordinator holds integration';
  } else {
    effectiveState = 'blocked';
    activityBadge = meta.optional ? 'Optional · awaits owner authorization' : `Waiting on ${meta.dependsOn.join(', ')}`;
  }

  const agentPrompt = promptTemplate
    ? promptTemplate.replaceAll('P1', id)
    : `You are working in /Users/ryan/Desktop/Commons on Oracle Commons. Your assigned section is ${id}.`;

  return {
    id,
    title,
    phaseLabel: meta.phaseLabel,
    track: meta.track,
    station: meta.station,
    sprite: meta.sprite,
    optional: Boolean(meta.optional),
    docStatus,
    effectiveState,
    agentWorking: effectiveState === 'in_progress',
    activityBadge,
    owner: claim?.owner || docOwner,
    updatedAt,
    claim,
    dependsOn: meta.dependsOn,
    unlocks: meta.unlocks,
    canRunWith: meta.canRunWith,
    exclusiveLocks: meta.exclusiveLocks || [],
    additiveFiles: meta.additiveFiles || [],
    restrictionNote: meta.restrictionNote || '',
    scope: parseParagraph(sections.scope),
    dependenciesText: parseParagraph(sections.dependencies),
    acceptanceCriteria: parseBullets(sections['acceptance criteria']).length
      ? parseBullets(sections['acceptance criteria'])
      : parseBullets(sections.acceptance),
    log: parseBullets(sections.log),
    completedWork: parseBullets(sections['completed work']).length
      ? parseBullets(sections['completed work'])
      : (parseParagraph(sections['completed work']) && parseParagraph(sections['completed work']) !== 'None.'
        ? [parseParagraph(sections['completed work'])]
        : []),
    validation: parseParagraph(sections.validation),
    blockers: parseParagraph(sections.blockers),
    nextAction: parseParagraph(sections['next action']),
    limitations: parseBullets(sections['remaining limitations']),
    fileActivity,
    capabilities: phaseCaps,
    claimCommand: `mkdir progress/claims/${id}`,
    agentPrompt,
  };
}

function parsePromptTemplate() {
  const raw = safeRead(join(REPO_ROOT, 'AGENT_PROMPT.md'));
  const m = raw.match(/```text\n([\s\S]*?)```/);
  return m ? m[1].trim() : '';
}

function parseRecentWorklog(limit = 6) {
  const raw = safeRead(join(REPO_ROOT, 'wiki', 'WORKLOG.md'));
  if (!raw) return [];
  const parts = raw.split(/\n(?=##\s+\d{4}-\d{2}-\d{2})/);
  const entries = [];
  for (const part of parts) {
    const headerMatch = part.match(/^##\s+(\d{4}-\d{2}-\d{2})\s+[—-]\s+(.+)$/m);
    if (!headerMatch) continue;
    const date = headerMatch[1].trim();
    const title = headerMatch[2].trim();
    const changed = [];
    const verified = [];
    let next = '';
    let mode = null;
    for (const line of part.split('\n').slice(1)) {
      const trimmed = line.trim();
      if (/^Changed:/i.test(trimmed)) { mode = 'changed'; continue; }
      if (/^Verified:/i.test(trimmed)) { mode = 'verified'; continue; }
      if (/^Limitations:/i.test(trimmed)) { mode = 'limitations'; continue; }
      if (/^Next:/i.test(trimmed)) { mode = 'next'; continue; }
      if (mode === 'changed' && trimmed.startsWith('- ')) changed.push(trimmed.slice(2));
      else if (mode === 'verified' && trimmed.startsWith('- ')) verified.push(trimmed.slice(2));
      else if (mode === 'next' && trimmed) {
        next += (next ? ' ' : '') + trimmed.replace(/^-\s*/, '');
      }
    }
    entries.push({ date, title, changed: changed.slice(0, 4), verified: verified.slice(0, 2), next });
  }
  return entries.reverse().slice(0, limit);
}

export function buildRoadmapSnapshot(nowMs = Date.now()) {
  const capDoc = capabilitiesDocument();
  const capabilitiesByPhase = new Map();
  for (const op of capDoc.operations || []) {
    const phase = op.phase || 'P0';
    if (!capabilitiesByPhase.has(phase)) capabilitiesByPhase.set(phase, []);
    capabilitiesByPhase.get(phase).push({
      id: op.id,
      method: op.method,
      path: op.path,
      status: op.status,
      principal: op.principal,
      summary: op.summary,
    });
  }

  const promptTemplate = parsePromptTemplate();
  const sections = SECTION_ORDER.map(id => parseProgressSection(id, capabilitiesByPhase, promptTemplate, nowMs));
  const byId = new Map(sections.map(s => [s.id, s]));

  // Compute active exclusive locks held right now by working agents
  const activeHoldersByFile = new Map();
  for (const s of sections) {
    if (s.agentWorking && s.id !== 'INT') {
      for (const lockFile of s.exclusiveLocks) {
        if (!activeHoldersByFile.has(lockFile)) activeHoldersByFile.set(lockFile, []);
        activeHoldersByFile.get(lockFile).push({ id: s.id, owner: s.owner, title: s.title });
      }
    }
  }

  // Enrich each section with live parallel-work eligibility & restriction reasons
  for (const s of sections) {
    const missingDeps = s.dependsOn.filter(depId => byId.get(depId)?.effectiveState !== 'complete');
    const depsDoneOrInFlight = s.dependsOn.filter(depId => {
      const dep = byId.get(depId);
      return !dep || (dep.effectiveState !== 'complete' && !dep.agentWorking && dep.effectiveState !== 'ready_for_review');
    });
    const lockConflicts = [];
    for (const lockFile of s.exclusiveLocks) {
      const holders = (activeHoldersByFile.get(lockFile) || []).filter(h => h.id !== s.id);
      if (holders.length > 0) {
        lockConflicts.push({
          file: lockFile,
          heldBy: holders.map(h => `${h.id} (${h.owner})`),
        });
      }
    }

    // If all dependencies are complete and no lock conflicts exist, even if WORKPLAN.md still says 'blocked', mark effectiveState as 'available'
    if (s.effectiveState === 'blocked' && !s.optional && missingDeps.length === 0 && lockConflicts.length === 0 && s.id !== 'INT') {
      s.effectiveState = 'available';
      s.activityBadge = s.docStatus === 'blocked'
        ? `Dependencies (${s.dependsOn.join(', ')}) complete · ready to claim!`
        : 'Ready for an agent to claim';
    }

    let parallelStatus = 'blocked'; // complete | active_now | can_start_now | prep_safe_now | lock_conflict | waiting_deps | optional_gated | coordinator
    let parallelSummary = '';

    if (s.effectiveState === 'complete') {
      parallelStatus = 'complete';
      parallelSummary = 'Already completed and verified.';
    } else if (s.id === 'INT') {
      parallelStatus = 'coordinator';
      parallelSummary = 'Coordinator role (runs audit/check-off alongside feature agents).';
    } else if (s.agentWorking) {
      parallelStatus = 'active_now';
      parallelSummary = s.exclusiveLocks.length
        ? `Currently worked on by ${s.owner} · holds exclusive lock on ${s.exclusiveLocks.join(', ')}`
        : `Currently worked on by ${s.owner} · no exclusive shared-file lock`;
    } else if (s.optional && s.id === 'E0') {
      parallelStatus = 'optional_gated';
      parallelSummary = 'Restricted until explicit human owner authorization for a Fuji wallet prototype.';
    } else if (missingDeps.length === 0 && lockConflicts.length === 0) {
      parallelStatus = 'can_start_now';
      if (s.id === 'W5' && byId.get('P2')?.effectiveState !== 'complete') {
        parallelSummary = 'P0 is complete and service.mjs is currently free, but WORKPLAN.md sequences P2 before W5 unless running as a quick additive pass.';
      } else if (s.id === 'P2' && (activeHoldersByFile.get('commons/web/src/components/ProblemSheet.tsx') || []).length > 0) {
        parallelSummary = 'Backend (research.mjs, p2.mjs, 020-research.sql) can start NOW! Hold off on ProblemSheet.tsx edits while W3 is active.';
      } else {
        parallelSummary = 'All dependencies complete and no exclusive file locks conflict — safe to start right now!';
      }
    } else if (lockConflicts.length > 0 && missingDeps.length === 0) {
      parallelStatus = 'lock_conflict';
      parallelSummary = `Dependencies met, but blocked by active exclusive file lock: ${lockConflicts.map(c => `${c.file} held by ${c.heldBy.join(', ')}`).join('; ')}.`;
    } else if (lockConflicts.length === 0 && depsDoneOrInFlight.length === 0) {
      parallelStatus = 'prep_safe_now';
      parallelSummary = `Zero exclusive file lock conflicts! Can be scaffolded in its own files (${s.fileActivity.files.map(f => f.path.split('/').pop()).slice(0, 3).join(', ')}) while ${missingDeps.join(', ')} finishes.`;
    } else {
      parallelStatus = 'waiting_deps';
      parallelSummary = lockConflicts.length > 0
        ? `Waiting on ${missingDeps.join(', ')} AND exclusive lock on ${lockConflicts.map(c => `${c.file} (${c.heldBy.join(', ')})`).join(', ')}.`
        : `Waiting on ${missingDeps.join(', ')} to finish first.`;
    }

    s.concurrency = {
      parallelStatus,
      parallelSummary,
      missingDeps,
      lockConflicts,
      canStartImmediately: parallelStatus === 'can_start_now',
      canScaffoldAlongside: parallelStatus === 'prep_safe_now',
    };
  }

  const liveLockTable = [
    {
      file: 'commons/src/domain/service.mjs',
      rule: 'Single holder at a time: P1 → P2 → W5.',
      activeHolders: activeHoldersByFile.get('commons/src/domain/service.mjs') || [],
      waitingSections: ['P2', 'W5'].filter(id => byId.get(id)?.effectiveState !== 'complete'),
    },
    {
      file: 'commons/web/src/App.tsx',
      rule: 'Exclusive among W1–W4 (and P6) while world shell sections run.',
      activeHolders: activeHoldersByFile.get('commons/web/src/App.tsx') || [],
      waitingSections: ['W4', 'P6'].filter(id => byId.get(id)?.effectiveState !== 'complete'),
    },
    {
      file: 'commons/web/src/components/ProblemSheet.tsx & AgentsSheet.tsx',
      rule: 'Held by W3 while extracting shared ProblemPanel and AgentCard.',
      activeHolders: activeHoldersByFile.get('commons/web/src/components/ProblemSheet.tsx') || [],
      waitingSections: ['P2 (UI sheet part)'].filter(() => byId.get('W3')?.effectiveState !== 'complete'),
    },
    {
      file: 'commons/server.mjs & commons/src/storage/sqlite.mjs',
      rule: 'Coordinator (INT) only. Feature agents add routes in src/http/routes/*.mjs and migrations in src/storage/migrations/*.sql.',
      activeHolders: [{ id: 'INT', owner: 'coordinator', title: 'Coordinator integration' }],
      waitingSections: [],
    },
  ];

  const requiredSections = sections.filter(s => s.id !== 'INT' && !s.optional);
  const completedCount = requiredSections.filter(s => s.effectiveState === 'complete').length;
  const totalCompletedIncludingOptional = sections.filter(s => s.effectiveState === 'complete').length;
  const activeCount = sections.filter(s => s.agentWorking).length;
  const readyCount = sections.filter(s => s.effectiveState === 'available' || s.effectiveState === 'ready_for_review').length;
  const filesLandedCount = requiredSections.filter(s => s.effectiveState === 'complete' || (s.fileActivity.totalFiles > 0 && s.fileActivity.existingFiles === s.fileActivity.totalFiles)).length;

  const totalOps = (capDoc.operations || []).length;
  const availableOps = (capDoc.operations || []).filter(op => op.status === 'available').length;

  const ownerDecisions = [
    {
      id: 'world-open-decisions',
      section: 'W1',
      title: 'Oracle Green open design choices',
      detail: 'Confirm or revise the three WORLD_DESIGN.md recommendations: warm village panel palette, original building names beside category labels, and no avatars for other browsing visitors.',
      doc: 'wiki/WORLD_DESIGN.md',
    },
    {
      id: 'assembly-rules',
      section: 'P5',
      title: 'Ratify founding human assembly rules',
      detail: 'Approve bootstrap steward, invitation/appeal rules, electorate snapshot policy, and initial quorum/deadline thresholds before live ballots open.',
      doc: 'wiki/GOVERNANCE.md',
    },
    {
      id: 'credits-trial-numbers',
      section: 'E1',
      title: 'Approve promotional credit trial parameters',
      detail: 'Confirm capacity-adjusted hold/grant/timeout/appeal numbers before running the invite-only service-credit experiment.',
      doc: 'wiki/ECONOMICS.md',
    },
    {
      id: 'staging-projects',
      section: 'P7',
      title: 'Authorize Vercel & Firebase staging projects',
      detail: 'Supply staging project IDs, launch budget, license, and disclosure terms before running the two-machine hosted gate.',
      doc: 'wiki/BUILD_PLAN.md',
    },
  ];

  const concurrencyGuide = {
    now: ['P1', 'W0'],
    afterP1AndW0: ['P2', 'P4', 'W1'],
    worldSequence: ['W0', 'W1', 'W2', 'W3', 'W4'],
    liveLockTable,
    exclusiveLocks: [
      { file: 'commons/src/domain/service.mjs', rule: 'Single holder at a time: P1 first, then P2, then W5.' },
      { file: 'commons/web/src/App.tsx', rule: 'Exclusive among W1–W4 while world sections run sequentially.' },
      { file: 'commons/server.mjs', rule: 'Coordinator (INT) only. Feature sections mount routes in commons/src/http/routes/<section>.mjs.' },
    ],
  };

  return {
    generatedAt: nowMs,
    summary: {
      totalRequired: requiredSections.length,
      completedDocCount: completedCount,
      totalCompletedCount: totalCompletedIncludingOptional,
      filesLandedCount,
      activeAgentSections: activeCount,
      readyToStartCount: readyCount,
      availableCapabilities: availableOps,
      totalCapabilities: totalOps,
    },
    concurrencyGuide,
    ownerDecisions,
    sections,
    recentWorklog: parseRecentWorklog(6),
  };
}

export async function handle(ctx) {
  if (ctx.method === 'GET' && ctx.path === '/api/v1/roadmap') {
    const nowMs = typeof ctx.now === 'function' ? ctx.now() : Date.now();
    ctx.send(200, buildRoadmapSnapshot(nowMs));
    return true;
  }
  return false;
}
