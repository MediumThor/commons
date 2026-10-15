import type { Agent, AgentTask, Category, CommonsState, Problem } from '../lib/api';
import { displayTitle } from '../lib/format';
import { knownStations, pennantShapes, type StationArt } from './art/buildings';
import { HUB_PLACES, layoutAtlas, type Atlas, type Point } from './map/atlas';

export type AgentMode = 'working' | 'stale' | 'idle';

export interface AgentView {
  agent: Agent;
  mode: AgentMode;
  own: boolean;
  anchor: Point;
  place: 'lot' | 'porch';
  task?: AgentTask;
  problem?: Problem;
  /** Minutes since the last heartbeat, estimated from the lease expiry; only set when stale. */
  quietMinutes?: number;
}

/** One reservation on a lot: the agent, its approach, and whether its sprite stands here. */
export interface GroupMember extends AgentView { here: boolean }

export interface LotView {
  problem: Problem;
  cityId: string;
  x: number;
  y: number;
  group: GroupMember[];
  shown: GroupMember[];
  overflow: number;
  working: number;
  stale: number;
  /** Building height. Floors record checkpoints; they are not reviewed results. */
  floors: number;
}

export interface CityView {
  category: Category;
  name: string;
  landmark?: string;
  art?: StationArt;
  roof: string;
  x: number;
  y: number;
  halfW: number;
  halfH: number;
  rings: number;
  lots: LotView[];
  vacant: Point[];
  /** Distinct agents holding at least one live reservation in this city. */
  population: number;
  working: number;
  stale: number;
  checkpoints: number;
}

export interface HomesteadView { owner: string; x: number; y: number; roof: string; shape: string; own: boolean; idle: AgentView[]; overflow: number; agents: number }

export interface WorldScene {
  atlas: Atlas;
  cities: CityView[];
  homesteads: HomesteadView[];
  hiddenOwners: number;
  idle: number;
  population: number;
  agents: AgentView[];
  ownHomestead?: HomesteadView;
}

export const SEAT_OFFSETS = [-44, -22, 0, 22, 44];
export const PORCH_OFFSETS = [-22, 0, 22];
const LOT_FEET = 62;

const ownerColors = ['#d6633e', '#5b8aa6', '#7d9e52', '#8a83a4', '#d9a441', '#c8615a', '#5f9c8f', '#9d835a'];
const roofs = ['#c8615a', '#5b8aa6', '#8a83a4', '#5f9c8f', '#d9a441', '#7d9e52', '#b0705a', '#6f8fb0'];
const hash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export const ownerMark = (owner: string) => ({ color: ownerColors[hash(owner) % ownerColors.length], shape: pennantShapes[(hash(owner) >> 3) % pennantShapes.length] });

/** 0 checkpoints is a foundation; then 1, 2–3, 4–7 and 8+ checkpoints give one to four floors. */
export const floorsFor = (checkpoints: number) => checkpoints <= 0 ? 0 : Math.min(4, 1 + Math.floor(Math.log2(checkpoints)));

export function describeAgent(view: AgentView, now: number) {
  const title = view.problem ? `“${displayTitle(view.problem)}”` : '';
  if (view.mode === 'idle') return 'At home · no reservation right now';
  const left = view.task ? Math.max(0, Math.round((view.task.expires - now) / 60000)) : 0;
  if (view.mode === 'stale') return `No heartbeat for about ${view.quietMinutes} min (estimated) · ${title}`;
  return `Working on ${title} · lease ${left} min left`;
}

const LEASE_MS = 10 * 60 * 1000;
const CAP_MS = 2 * 60 * 60 * 1000;
const STALE_MS = 4 * 60 * 1000;

/**
 * The server does not store heartbeat times yet. A heartbeat resets the lease to 10 minutes,
 * so remaining time below 6 minutes means at least 4 minutes without one, except at the 2-hour cap.
 */
export function quietMinutes(task: AgentTask, now: number): number | undefined {
  if (task.expires >= task.created + CAP_MS) return undefined;
  const quiet = now - (task.expires - LEASE_MS);
  return quiet >= STALE_MS ? Math.floor(quiet / 60000) : undefined;
}

let cached: Atlas | null = null;
/** Reuses the previous atlas while categories and problem counts are unchanged, so scenery stays put. */
function atlasFor(categories: Category[], problems: Problem[]) {
  const specs = categories.map(c => ({ id: c.id, lots: problems.filter(p => p.categoryId === c.id).length }));
  const key = specs.map(s => `${s.id}:${s.lots}`).join('|');
  if (!cached || cached.key !== key) cached = layoutAtlas(specs);
  return cached;
}

export function deriveWorld(state: CommonsState, now: number): WorldScene {
  const ownHandle = state.user?.handle;
  const problems = [...state.problems].sort((a, b) => a.categoryOrder - b.categoryOrder || a.order - b.order);
  const atlas = atlasFor(state.categories, problems);

  const lotFor = new Map<string, LotView>();
  const cities: CityView[] = state.categories.map((category, i) => {
    const placed = atlas.cities[i];
    const known = knownStations[category.id];
    const inCity = problems.filter(p => p.categoryId === category.id);
    const lots = inCity.map((problem, j): LotView => {
      const cell = placed.plan.cells[j];
      const lot: LotView = {
        problem, cityId: category.id, x: placed.x + cell.x, y: placed.y + cell.y,
        group: [], shown: [], overflow: 0, working: 0, stale: 0, floors: floorsFor(problem.checkpoints),
      };
      lotFor.set(problem.id, lot);
      return lot;
    });
    return {
      category, name: category.name, landmark: known?.name, art: known?.art,
      roof: roofs[hash(category.id) % roofs.length], x: placed.x, y: placed.y,
      halfW: placed.plan.halfW, halfH: placed.plan.halfH, rings: placed.plan.rings, lots,
      vacant: placed.plan.cells.slice(lots.length).map(c => ({ x: placed.x + c.x, y: placed.y + c.y })),
      population: 0, working: 0, stale: 0, checkpoints: inCity.reduce((n, p) => n + p.checkpoints, 0),
    };
  });

  const owners: string[] = [];
  for (const agent of state.agents) if (!owners.includes(agent.owner)) owners.push(agent.owner);
  if (ownHandle && !owners.includes(ownHandle)) owners.push(ownHandle);
  const slots = HUB_PLACES.homesteadX.length;
  let shown = owners.slice(0, slots);
  if (ownHandle && !shown.includes(ownHandle)) shown = [...shown.slice(0, slots - 1), ownHandle];
  shown.sort((a, b) => Number(b === ownHandle) - Number(a === ownHandle));
  const homesteads: HomesteadView[] = shown.map((owner, index) => ({
    owner, x: HUB_PLACES.homesteadX[index], y: HUB_PLACES.homesteadY,
    ...(({ color, shape }) => ({ roof: color, shape }))(ownerMark(owner)), own: owner === ownHandle,
    idle: [], overflow: 0, agents: state.agents.filter(a => a.owner === owner).length,
  }));
  const homeFor = new Map(homesteads.map(h => [h.owner, h]));

  const views: AgentView[] = [];
  const cityAgents = new Map<string, Map<string, AgentMode>>();
  let idle = 0;
  for (const agent of state.agents) {
    const own = agent.owner === ownHandle;
    const live = agent.tasks.filter(t => t.expires > now && lotFor.has(t.problem_id)).sort((a, b) => a.created - b.created);
    live.forEach((task, i) => {
      const lot = lotFor.get(task.problem_id)!;
      const quiet = quietMinutes(task, now);
      const mode: AgentMode = quiet === undefined ? 'working' : 'stale';
      lot.group.push({ agent, own, task, problem: lot.problem, mode, quietMinutes: quiet, place: 'lot', anchor: { x: lot.x, y: lot.y + LOT_FEET }, here: i === 0 });
      const seen = cityAgents.get(lot.cityId) ?? new Map<string, AgentMode>();
      if (seen.get(agent.id) !== 'working') seen.set(agent.id, mode);
      cityAgents.set(lot.cityId, seen);
    });
    if (live.length) continue;
    idle++;
    const home = homeFor.get(agent.owner);
    if (!home) continue;
    if (home.idle.length < PORCH_OFFSETS.length) {
      const view: AgentView = { agent, own, mode: 'idle', place: 'porch', anchor: { x: home.x + PORCH_OFFSETS[home.idle.length], y: home.y + 20 } };
      home.idle.push(view); views.push(view);
    } else home.overflow++;
  }

  for (const city of cities) {
    for (const lot of city.lots) {
      lot.group.sort((a, b) => Number(b.own) - Number(a.own) || a.task!.created - b.task!.created);
      lot.working = lot.group.filter(m => m.mode === 'working').length;
      lot.stale = lot.group.length - lot.working;
      lot.shown = lot.group.filter(m => m.here).slice(0, SEAT_OFFSETS.length);
      lot.overflow = lot.group.length - lot.shown.length;
      lot.shown.forEach((member, i) => { member.anchor = { x: lot.x + SEAT_OFFSETS[i], y: lot.y + LOT_FEET }; views.push(member); });
    }
    const seen = cityAgents.get(city.category.id);
    city.population = seen?.size ?? 0;
    city.working = seen ? [...seen.values()].filter(m => m === 'working').length : 0;
    city.stale = city.population - city.working;
  }

  const distinct = new Set<string>();
  for (const seen of cityAgents.values()) for (const id of seen.keys()) distinct.add(id);
  return {
    atlas, cities, homesteads, hiddenOwners: owners.length - shown.length, idle, population: distinct.size,
    agents: views, ownHomestead: homesteads.find(h => h.own),
  };
}
