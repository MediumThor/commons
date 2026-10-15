/**
 * The generative world map, in world units. A central crossroads (the hub) sits at (0, 0) and
 * every category becomes a city placed around it. A city is a grid of lots in square rings around
 * its landmark; it holds one lot per problem and grows a ring whenever fewer than MIN_VACANT plots
 * would stay open. Layout is deterministic for the same categories and problem counts.
 */
export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export const PITCH_X = 190;
export const PITCH_Y = 180;
export const STREET = 26;
export const MIN_VACANT = 3;
const GAP = 380;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export const HUB = { halfW: 580, halfH: 320 };
/** Hub places in hub-local coordinates (the hub centre is the world origin). */
export const HUB_PLACES = {
  archive: { x: -350, y: -70 },
  hall: { x: 350, y: -70 },
  gate: { x: -HUB.halfW + 46, y: 0 },
  plaza: { x: 0, y: 120 },
  notices: { x: -64, y: 130 },
  well: { x: 74, y: 150 },
  homesteadY: 262,
  homesteadX: [-470, -350, -230, 230, 350, 470],
};

export interface CityPlan { rings: number; cells: Point[]; halfW: number; halfH: number }

function ringCells(r: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) if (Math.max(Math.abs(i), Math.abs(j)) === r) cells.push([i, j]);
  const angle = ([i, j]: [number, number]) => (Math.atan2(i, -j) + 2 * Math.PI) % (2 * Math.PI);
  return cells.sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]) || angle(a) - angle(b));
}

/** Lot centres around the landmark (local coordinates), nearest ring first. */
export function planCity(lots: number): CityPlan {
  let rings = 1, capacity = 8;
  while (capacity < lots + MIN_VACANT) { rings++; capacity += 8 * rings; }
  const cells: Point[] = [];
  for (let r = 1; r <= rings; r++) for (const [i, j] of ringCells(r)) cells.push({ x: i * PITCH_X, y: j * PITCH_Y });
  return { rings, cells, halfW: (rings + 0.5) * PITCH_X, halfH: (rings + 0.5) * PITCH_Y };
}

export interface PlacedCity { id: string; x: number; y: number; plan: CityPlan; rect: Rect }
export interface Scenery { kind: 'tree' | 'shrub' | 'flower' | 'pond'; x: number; y: number; s: number }
export interface Atlas { key: string; hub: Rect; cities: PlacedCity[]; roads: Point[][]; bounds: Rect; scenery: Scenery[] }

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inflate = (r: Rect, m: number): Rect => ({ x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m });
const snap = (v: number) => Math.round(v / 10) * 10;

/** Orthogonal road from a hub exit to the nearest street entrance on the city wall. */
function roadTo(city: PlacedCity): Point[] {
  const { x, y, plan } = city;
  if (Math.abs(x) * HUB.halfH >= Math.abs(y) * HUB.halfW) {
    const side = Math.sign(x) || 1;
    const start = side * HUB.halfW, end = x - side * plan.halfW;
    const street = Math.abs(y - PITCH_Y / 2) < Math.abs(y + PITCH_Y / 2) ? y - PITCH_Y / 2 : y + PITCH_Y / 2;
    const mid = snap((start + end) / 2);
    return [{ x: start, y: 0 }, { x: mid, y: 0 }, { x: mid, y: street }, { x: end, y: street }];
  }
  const side = Math.sign(y) || 1;
  const start = side * HUB.halfH, end = y - side * plan.halfH;
  const street = Math.abs(x - PITCH_X / 2) < Math.abs(x + PITCH_X / 2) ? x - PITCH_X / 2 : x + PITCH_X / 2;
  const mid = snap((start + end) / 2);
  return [{ x: 0, y: start }, { x: 0, y: mid }, { x: street, y: mid }, { x: street, y: end }];
}

function nearRoad(p: Point, roads: Point[][], margin: number) {
  for (const road of roads) for (let i = 1; i < road.length; i++) {
    const a = road[i - 1], b = road[i];
    const minX = Math.min(a.x, b.x) - margin, maxX = Math.max(a.x, b.x) + margin;
    const minY = Math.min(a.y, b.y) - margin, maxY = Math.max(a.y, b.y) + margin;
    if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) return true;
  }
  return false;
}

function growScenery(bounds: Rect, blocked: Rect[], roads: Point[][], seed: number): Scenery[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const target = Math.min(420, Math.round((bounds.w * bounds.h) / 52000));
  const items: Scenery[] = [];
  let ponds = 0;
  for (let attempt = 0; attempt < target * 4 && items.length < target; attempt++) {
    const p = { x: bounds.x + rand() * bounds.w, y: bounds.y + rand() * bounds.h };
    const roll = rand();
    const kind: Scenery['kind'] = roll < 0.03 && ponds < 7 ? 'pond' : roll < 0.62 ? 'tree' : roll < 0.84 ? 'shrub' : 'flower';
    const margin = kind === 'pond' ? 150 : kind === 'tree' ? 70 : 30;
    if (blocked.some(r => p.x > r.x - margin && p.x < r.x + r.w + margin / 2 && p.y > r.y - margin && p.y < r.y + r.h + margin / 3)) continue;
    if (nearRoad(p, roads, margin / 2 + 24)) continue;
    if (kind === 'pond') ponds++;
    items.push({ kind, x: Math.round(p.x), y: Math.round(p.y), s: 0.75 + rand() * 0.5 });
  }
  return items.sort((a, b) => a.y - b.y);
}

/** Places cities on a golden-angle spiral, pushing each outward until it clears the hub and earlier cities. */
export function layoutAtlas(specs: { id: string; lots: number }[]): Atlas {
  const hub: Rect = { x: -HUB.halfW, y: -HUB.halfH, w: HUB.halfW * 2, h: HUB.halfH * 2 };
  const taken: Rect[] = [inflate(hub, GAP / 2)];
  const cities: PlacedCity[] = specs.map((spec, i) => {
    const plan = planCity(spec.lots);
    const angle = -Math.PI / 2 + i * GOLDEN;
    for (let d = 0; ; d += 30) {
      const x = snap(Math.cos(angle) * d * 1.25), y = snap(Math.sin(angle) * d);
      const rect = { x: x - plan.halfW, y: y - plan.halfH, w: plan.halfW * 2, h: plan.halfH * 2 };
      if (taken.some(t => overlaps(t, inflate(rect, GAP / 2)))) continue;
      taken.push(inflate(rect, GAP / 2));
      return { id: spec.id, x, y, plan, rect };
    }
  });
  const roads = cities.map(roadTo);
  const all = [hub, ...cities.map(c => c.rect)];
  const minX = Math.min(...all.map(r => r.x)), minY = Math.min(...all.map(r => r.y));
  const maxX = Math.max(...all.map(r => r.x + r.w)), maxY = Math.max(...all.map(r => r.y + r.h));
  const bounds = inflate({ x: minX, y: minY, w: maxX - minX, h: maxY - minY }, 420);
  const key = specs.map(s => `${s.id}:${s.lots}`).join('|');
  return { key, hub, cities, roads, bounds, scenery: growScenery(bounds, all, roads, 134 + specs.length) };
}
