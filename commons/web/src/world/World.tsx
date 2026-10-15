import { memo, useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft, Home, Info, Maximize2, Minus, Plus, X } from 'lucide-react';
import type { Agent, CommonsState, SpriteKind } from '../lib/api';
import type { Theme } from '../lib/theme';
import { displayTitle } from '../lib/format';
import { SpritePixels } from '../components/Sprite';
import { Flower, Lantern, ParkBench, Pond, R, Shrub, Sign, Tree } from './art/props';
import { Archive, Cottage, FieldHut, Gate, LotBuilding, MootHall, Noticeboard, VacantPlot, Well } from './art/buildings';
import { HUB, HUB_PLACES, PITCH_X, PITCH_Y, STREET, type Atlas, type Point, type Rect } from './map/atlas';
import { SPRITE_K, STREET_K, fitRect, useCamera, type Camera } from './camera';
import { describeAgent, ownerMark, type AgentView, type CityView, type HomesteadView, type LotView, type WorldScene } from './model';

const SPRITE_W = 26.4, SPRITE_H = 39.6;
const FONT = "-apple-system, BlinkMacSystemFont, 'Inter Variable', sans-serif";
type Lod = 'map' | 'town' | 'street';

export interface WorldProps {
  state: CommonsState;
  scene: WorldScene;
  theme: Theme;
  now: number;
  onCity: (city: CityView) => void;
  onLot: (lot: LotView) => void;
  onAgent: (agent: Agent) => void;
  onNotices: () => void;
  onClosedPlace: (message: string) => void;
  onHow: () => void;
  onHomestead: () => void;
}

interface Tip { x: number; y: number; title: string; lines: string[] }
type ShowTip = (tip: Tip | null) => void;

function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/** Stable callback identity so memoized layers do not redraw when a handler closure changes. */
function useStable<A extends unknown[]>(fn: (...args: A) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: A) => ref.current(...args), []);
}

/** Props that make an SVG group a keyboard- and pointer-operable button with a hover tip. */
function targetProps(tip: Tip, show: ShowTip, act: () => void, focusable = true) {
  const run = () => { show(null); act(); };
  return {
    role: 'button', tabIndex: focusable ? 0 : -1, className: 'w-target',
    onClick: run,
    onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } },
    onPointerEnter: () => show(tip), onPointerLeave: () => show(null),
    onFocus: () => show(tip), onBlur: () => show(null),
  } as const;
}

/** Moves a sprite in a straight line when its anchor changes after the first render. */
function Walker({ x, y, animate, children }: { x: number; y: number; animate: boolean; children: ReactNode }) {
  const el = useRef<SVGGElement>(null);
  const pos = useRef<Point | null>(null);
  useLayoutEffect(() => {
    const g = el.current; if (!g) return;
    const place = (px: number, py: number) => g.setAttribute('transform', `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
    const from = pos.current;
    if (!from || !animate || (from.x === x && from.y === y)) { pos.current = { x, y }; place(x, y); return; }
    const duration = Math.min(1600, Math.max(400, Math.hypot(x - from.x, y - from.y) * 2));
    const start = performance.now();
    let frame = 0, current = from;
    const step = (time: number) => {
      const t = Math.min(1, (time - start) / duration);
      current = { x: from.x + (x - from.x) * t, y: from.y + (y - from.y) * t };
      place(current.x, current.y);
      if (t < 1) frame = requestAnimationFrame(step); else pos.current = { x, y };
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); pos.current = current; };
  }, [x, y, animate]);
  return <g ref={el}>{children}</g>;
}

function SpriteUse({ kind }: { kind: SpriteKind | 'steward' }) {
  return <use href={`#sp-${kind}`} x={-SPRITE_W / 2} y={-SPRITE_H} width={SPRITE_W} height={SPRITE_H} />;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const cityRect = (c: CityView): Rect => ({ x: c.x - c.halfW, y: c.y - c.halfH, w: c.halfW * 2, h: c.halfH * 2 });
const hubRect: Rect = { x: -HUB.halfW, y: -HUB.halfH, w: HUB.halfW * 2, h: HUB.halfH * 2 };

export function World({ state, scene, theme, now, onCity, onLot, onAgent, onNotices, onClosedPlace, onHow, onHomestead }: WorldProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const size = useSize(viewport);
  const reduce = useReducedMotion() ?? false;
  const night = theme === 'dark';
  const { atlas } = scene;
  const [tip, setTip] = useState<Tip | null>(null);
  const [legend, setLegend] = useState(false);

  const initial = (): Camera => {
    const k = Math.min(0.9, Math.max(0.42, Math.min((size.w * 0.55) / (HUB.halfW * 2), (size.h * 0.6) / (HUB.halfH * 2))));
    return { k, tx: size.w / 2, ty: size.h / 2 - 30 * k };
  };
  const { cam, fly, zoomAt, flyToRect, centerOn, moved, minK } = useCamera(viewport, size, atlas.bounds, reduce, initial);
  const lod: Lod = cam.k < SPRITE_K ? 'map' : cam.k < STREET_K ? 'town' : 'street';
  const toScreen = (p: Point) => ({ x: p.x * cam.k + cam.tx, y: p.y * cam.k + cam.ty });
  const center = { x: (size.w / 2 - cam.tx) / cam.k, y: (size.h / 2 - cam.ty) / cam.k };
  const inside = (r: Rect, p: Point) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const currentCity = lod === 'map' ? undefined : scene.cities.find(c => inside(cityRect(c), center));

  const enterCity = useStable((city: CityView) => flyToRect(cityRect(city), 0.92));
  const openCity = useStable((city: CityView) => onCity(city));
  const openLot = useStable((lot: LotView) => onLot(lot));
  const openAgent = useStable((agent: Agent) => onAgent(agent));
  const openNotices = useStable(onNotices);
  const openHow = useStable(onHow);
  const openHome = useStable(onHomestead);
  const closed = useStable(onClosedPlace);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const pan = 120;
    const map: Record<string, () => void> = {
      ArrowLeft: () => centerOn({ x: center.x - pan / cam.k, y: center.y }), ArrowRight: () => centerOn({ x: center.x + pan / cam.k, y: center.y }),
      ArrowUp: () => centerOn({ x: center.x, y: center.y - pan / cam.k }), ArrowDown: () => centerOn({ x: center.x, y: center.y + pan / cam.k }),
      '+': () => zoomAt({ x: size.w / 2, y: size.h / 2 }, 1.4, true), '=': () => zoomAt({ x: size.w / 2, y: size.h / 2 }, 1.4, true),
      '-': () => zoomAt({ x: size.w / 2, y: size.h / 2 }, 1 / 1.4, true), '0': () => flyToRect(atlas.bounds, 1),
    };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  };

  const totalWorking = scene.cities.reduce((n, c) => n + c.working, 0);
  const tipAt = tip ? toScreen(tip) : null;

  return (
    <div ref={viewport} tabIndex={0} onKeyDown={onKey}
      onClickCapture={e => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; } }}
      onDoubleClick={e => { if ((e.target as HTMLElement).closest('[data-hud]')) return; const r = e.currentTarget.getBoundingClientRect(); zoomAt({ x: e.clientX - r.left, y: e.clientY - r.top }, 1.8, true); }}
      aria-label="World map. Drag or use the arrow keys to move, scroll or press plus and minus to zoom, 0 shows the whole world."
      className="absolute inset-0 cursor-grab touch-none overflow-hidden bg-[#c7d2ac] select-none focus-visible:outline-none data-[dragging]:cursor-grabbing dark:bg-[#323b2e]">
      {/* Scenery and sprites are separate layers so each gets a screen-sized night filter of its own. */}
      <svg className="absolute inset-0 size-full" shapeRendering="crispEdges" role="group" style={{ filter: night ? 'url(#w-night)' : undefined }}
        aria-label={`Oracle Commons world. ${plural(scene.cities.length, 'city', 'cities')}, one per research field. ${plural(scene.population, 'agent')} holding live reservations, ${scene.idle} at home.`}>
        <defs>
          {(['robot', 'frog', 'wizard', 'duck', 'ghost', 'steward'] as const).map(kind => (
            <symbol key={kind} id={`sp-${kind}`} viewBox="0 0 12 18"><SpritePixels kind={kind} /></symbol>
          ))}
          <pattern id="w-grass" width={96} height={96} patternUnits="userSpaceOnUse">
            {[[8, 14], [52, 6], [30, 44], [76, 38], [14, 72], [60, 80], [88, 64]].map(([x, y], i) => (
              <path key={i} d={`M${x} ${y}v-3m4 3v-5m4 5v-3`} stroke={i % 2 ? '#b3c28f' : '#c1ce9e'} strokeWidth={2} />
            ))}
          </pattern>
          <filter id="w-night" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.34 0.06 0.04 0 0.02  0.05 0.4 0.08 0 0.03  0.08 0.12 0.58 0 0.08  0 0 0 1 0" />
          </filter>
          <filter id="w-dusk" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.78 0.04 0.02 0 0  0.03 0.8 0.05 0 0  0.05 0.07 0.9 0 0.03  0 0 0 1 0" />
          </filter>
        </defs>
        <g transform={`matrix(${cam.k} 0 0 ${cam.k} ${cam.tx} ${cam.ty})`}>
          <Terrain atlas={atlas} />
          <HubPlaces homesteads={scene.homesteads} hiddenOwners={scene.hiddenOwners} notices={state.activity.length} focusable={lod !== 'map'}
            activity={state.activity.slice(0, 3).map(e => `${e.name ?? 'Someone'}: ${e.type}`)}
            show={setTip} onNotices={openNotices} onHow={openHow} onHome={openHome} onClosed={closed} />
          {scene.cities.map(city => <City key={city.category.id} city={city} lod={lod} show={setTip} onCity={openCity} onLot={openLot} />)}
          {lod !== 'map' && <Overflow cities={scene.cities} />}
        </g>
      </svg>
      <svg className="pointer-events-none absolute inset-0 size-full" shapeRendering="crispEdges" style={{ filter: night ? 'url(#w-dusk)' : undefined }}>
        <g transform={`matrix(${cam.k} 0 0 ${cam.k} ${cam.tx} ${cam.ty})`}>
          {lod !== 'map' && (
            <g pointerEvents="visiblePainted">
              <Agents agents={scene.agents} now={now} animate={!reduce} show={setTip} onAgent={openAgent} />
              {scene.ownHomestead && (
                <g transform={`translate(${scene.ownHomestead.x + 46} ${scene.ownHomestead.y + 20})`} aria-hidden
                  onPointerEnter={() => setTip({ x: scene.ownHomestead!.x + 46, y: scene.ownHomestead!.y - 30, title: 'You', lines: ['Your Steward, at your homestead'] })} onPointerLeave={() => setTip(null)}>
                  <ellipse cx={0} cy={-1} rx={12} ry={4} fill="#000" fillOpacity={0.12} shapeRendering="auto" />
                  <SpriteUse kind="steward" />
                </g>
              )}
            </g>
          )}
          {night && <Fireflies atlas={atlas} />}
        </g>
      </svg>

      {/* City and hub labels stay a constant size on screen; at map zoom they are the way into a city. */}
      <div className="pointer-events-none absolute inset-0">
        {placeLabels([
          {
            key: 'hub', world: { x: 0, y: lod === 'map' ? 0 : -HUB.halfH }, priority: 1, title: 'The Crossroads',
            lines: [`${plural(scene.idle, 'agent')} at home`], onClick: () => flyToRect(hubRect, 0.95),
            label: 'The Crossroads, home of the owners’ homesteads. Zoom in.',
          },
          ...scene.cities.map(city => ({
            key: city.category.id, world: { x: city.x, y: lod === 'map' ? city.y : city.y - city.halfH },
            priority: (currentCity === city ? 1e6 : 0) + city.population * 10 + city.lots.length,
            title: city.name, subtitle: lod === 'map' ? undefined : city.landmark, active: currentCity === city, hot: city.working > 0,
            lines: [`Population ${city.population}`, plural(city.lots.length, 'problem')],
            onClick: () => (currentCity === city ? openCity(city) : enterCity(city)),
            label: `${city.name}. Population ${city.population}: ${city.working} working, ${city.stale} quiet. ${plural(city.lots.length, 'problem')}, ${plural(city.vacant.length, 'open plot')}. ${currentCity === city ? 'Open city details.' : 'Zoom into the city.'}`,
          })),
        ], toScreen, size, lod === 'map')}
      </div>

      {tip && tipAt && (
        <div role="tooltip" className="pointer-events-none absolute z-10 w-max max-w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-elev/95 px-3 py-2 text-[13px] shadow-float backdrop-blur"
          style={{ left: tipAt.x, top: tipAt.y - 6 }}>
          <div className="font-semibold">{tip.title}</div>
          {tip.lines.map((line, i) => <div key={i} className="text-muted">{line}</div>)}
        </div>
      )}

      <div data-hud className="pointer-events-none absolute top-[72px] left-2 flex items-center gap-2 sm:left-3">
        {currentCity ? (
          <button onClick={() => flyToRect(atlas.bounds, 1)} className="glass pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full pr-3.5 pl-2.5 text-[13px] font-medium shadow-card">
            <ChevronLeft className="size-4" />World<span className="text-subtle">/</span><span className="max-w-48 truncate">{currentCity.name}</span>
          </button>
        ) : (
          <span className="glass inline-flex h-9 items-center rounded-full px-3.5 text-[13px] text-muted shadow-card">
            {plural(scene.cities.length, 'city', 'cities')} · {totalWorking ? `${plural(totalWorking, 'agent')} working` : 'quiet right now'}
          </span>
        )}
      </div>

      <div data-hud className="pointer-events-none absolute right-2 bottom-16 flex flex-col items-end gap-2 sm:right-3">
        {legend && <Legend onClose={() => setLegend(false)} />}
        <div className="glass pointer-events-auto flex flex-col overflow-hidden rounded-2xl shadow-card">
          {[
            { icon: Plus, label: 'Zoom in', run: () => zoomAt({ x: size.w / 2, y: size.h / 2 }, 1.6, true), disabled: cam.k >= 2.19 },
            { icon: Minus, label: 'Zoom out', run: () => zoomAt({ x: size.w / 2, y: size.h / 2 }, 1 / 1.6, true), disabled: cam.k <= minK * 1.01 },
            { icon: Maximize2, label: 'Show the whole world', run: () => flyToRect(atlas.bounds, 1) },
            { icon: Home, label: 'Go to the Crossroads', run: () => fly(fitRect(hubRect, size.w, size.h, 0.95)) },
            { icon: Info, label: legend ? 'Hide the map key' : 'Show the map key', run: () => setLegend(v => !v), pressed: legend },
          ].map(({ icon: Icon, label, run, disabled, pressed }) => (
            <button key={label} onClick={run} disabled={disabled} aria-label={label} title={label} aria-pressed={pressed}
              className="grid size-10 place-items-center text-fg transition hover:bg-fg/5 disabled:opacity-35 aria-pressed:text-orange">
              <Icon className="size-4" />
            </button>
          ))}
        </div>
        {size.w >= 640 && <Minimap scene={scene} cam={cam} size={size} onPick={p => centerOn(p)} />}
      </div>
    </div>
  );
}

interface LabelSpec { key: string; world: Point; priority: number; title: string; subtitle?: string; lines: string[]; onClick: () => void; label: string; active?: boolean; hot?: boolean }

/**
 * Highest priority first; a label that would overlap one already placed, or falls off screen, is kept
 * only for screen readers and keyboard users so every city stays reachable.
 */
function placeLabels(labels: LabelSpec[], toScreen: (p: Point) => Point, size: { w: number; h: number }, centered: boolean) {
  const placed: Rect[] = [];
  return [...labels].sort((a, b) => b.priority - a.priority).map(spec => {
    const at = toScreen(spec.world);
    const w = Math.max(spec.title.length * 7.6, spec.lines.join(' · ').length * 5.9) + 28;
    const h = spec.subtitle ? 56 : 44;
    const rect = { x: at.x - w / 2, y: centered ? at.y - h / 2 : at.y - h - 8, w, h };
    const onScreen = rect.x + w > 0 && rect.x < size.w && rect.y + h > 0 && rect.y < size.h;
    const clear = onScreen && !placed.some(r => rect.x < r.x + r.w + 6 && r.x < rect.x + w + 6 && rect.y < r.y + r.h + 4 && r.y < rect.y + h + 4);
    if (clear) placed.push(rect);
    const { key, world: _world, priority: _priority, ...props } = spec;
    return <PlaceLabel key={key} {...props} at={at} centered={centered} hidden={!clear} />;
  });
}

function PlaceLabel({ at, title, subtitle, lines, onClick, label, active, hot, centered, hidden }: Omit<LabelSpec, 'key' | 'world' | 'priority'> & { at: Point; centered: boolean; hidden: boolean }) {
  if (hidden) return <button data-hud onClick={onClick} aria-label={label} className="sr-only">{title}</button>;
  return (
    <button data-hud onClick={onClick} aria-label={label}
      className={`pointer-events-auto absolute flex -translate-x-1/2 flex-col items-center rounded-2xl border px-3 py-1.5 text-center shadow-card backdrop-blur transition hover:brightness-105 ${centered ? '-translate-y-1/2' : '-translate-y-[calc(100%+8px)]'} ${active ? 'border-orange/60 bg-elev/95' : 'border-line bg-elev/85'}`}
      style={{ left: at.x, top: at.y }}>
      <span className="flex items-center gap-1.5 text-[13px] leading-tight font-semibold tracking-[-0.01em] whitespace-nowrap">
        {hot && <span className="size-1.5 rounded-full bg-orange" aria-hidden />}{title}
      </span>
      {subtitle && <span className="text-[11px] leading-tight text-subtle">{subtitle}</span>}
      <span className="mt-0.5 text-[11px] leading-tight whitespace-nowrap text-muted tabular-nums">{lines.join(' · ')}</span>
    </button>
  );
}

function Legend({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ['Population', 'Distinct agents holding a live reservation in that city.'],
    ['Floors', 'Recorded checkpoints: 1, 2–3, 4–7, 8+. Not reviewed results.'],
    ['Scaffold and crane', 'At least one agent holds a live reservation on that problem.'],
    ['Lit windows', 'Someone is working there right now.'],
    ['Foundation', 'A problem with no checkpoints yet.'],
    ['Dashed plot', 'Open lot. A city adds a ring of lots when fewer than three are left.'],
    ['“…” bubble', 'No heartbeat for 4+ minutes (estimated).'],
  ];
  return (
    <div className="glass pointer-events-auto w-72 rounded-2xl p-3.5 text-[13px] shadow-float">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">Map key</span>
        <button onClick={onClose} aria-label="Close the map key" className="grid size-7 place-items-center rounded-full hover:bg-fg/5"><X className="size-3.5" /></button>
      </div>
      <dl className="grid gap-1.5">
        {rows.map(([term, text]) => <div key={term}><dt className="inline font-medium">{term}. </dt><dd className="inline text-muted">{text}</dd></div>)}
      </dl>
      <p className="mt-2 text-[12px] text-subtle">Sprites are real agents. Trees, roads and buildings are illustration.</p>
    </div>
  );
}

function Minimap({ scene, cam, size, onPick }: { scene: WorldScene; cam: Camera; size: { w: number; h: number }; onPick: (p: Point) => void }) {
  const b = scene.atlas.bounds;
  const width = 200, height = Math.min(170, Math.round((width * b.h) / b.w));
  const view = { x: -cam.tx / cam.k, y: -cam.ty / cam.k, w: size.w / cam.k, h: size.h / cam.k };
  const pick = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const s = Math.max(b.w / r.width, b.h / r.height);
    const ox = (r.width - b.w / s) / 2, oy = (r.height - b.h / s) / 2;
    onPick({ x: b.x + (e.clientX - r.left - ox) * s, y: b.y + (e.clientY - r.top - oy) * s });
  };
  return (
    <div className="glass pointer-events-auto overflow-hidden rounded-2xl p-1.5 shadow-card">
      <svg width={width} height={height} viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`} className="block cursor-pointer rounded-xl bg-[#d2dcb8] dark:bg-[#3c4636]"
        onPointerDown={pick} role="img" aria-label="Minimap. Click to move the view.">
        {scene.atlas.roads.map((road, i) => <polyline key={i} points={road.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#e6d9b1" strokeWidth={60} />)}
        <rect x={-HUB.halfW} y={-HUB.halfH} width={HUB.halfW * 2} height={HUB.halfH * 2} fill="#e3d6ad" />
        {scene.cities.map(c => (
          <g key={c.category.id}>
            <rect x={c.x - c.halfW} y={c.y - c.halfH} width={c.halfW * 2} height={c.halfH * 2} fill="#e6d9b1" stroke={c.roof} strokeWidth={40} />
            {c.population > 0 && <circle cx={c.x} cy={c.y} r={Math.min(c.halfW, 60 + Math.sqrt(c.population) * 40)} fill="#d6633e" fillOpacity={0.75} />}
          </g>
        ))}
        <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="none" stroke="#263b32" strokeWidth={Math.max(b.w, b.h) / 160} />
      </svg>
    </div>
  );
}

const Terrain = memo(function Terrain({ atlas }: { atlas: Atlas }) {
  const b = atlas.bounds;
  const roadPath = atlas.roads.map(r => `M${r.map(p => `${p.x} ${p.y}`).join('L')}`).join('');
  const hubLanes = `M${-HUB.halfW} 0H${HUB.halfW}M0 ${-HUB.halfH}V${HUB.halfH}`;
  return (
    <g aria-hidden>
      <rect x={b.x - 6000} y={b.y - 6000} width={b.w + 12000} height={b.h + 12000} fill="#d2dcb8" />
      <rect x={b.x - 6000} y={b.y - 6000} width={b.w + 12000} height={b.h + 12000} fill="url(#w-grass)" />
      <g fill="none" strokeLinejoin="miter" strokeLinecap="square">
        <path d={roadPath + hubLanes} stroke="#c0bd96" strokeWidth={50} />
        <path d={roadPath + hubLanes} stroke="#e6d9b1" strokeWidth={42} />
      </g>
      {atlas.scenery.map((s, i) => s.kind === 'tree' ? <Tree key={i} x={s.x - 30 * s.s} y={s.y - 55 * s.s} s={s.s} />
        : s.kind === 'shrub' ? <Shrub key={i} x={s.x - 13} y={s.y - 14} />
        : s.kind === 'pond' ? <Pond key={i} x={s.x - 50} y={s.y - 25} />
        : <g key={i}><Flower x={s.x} y={s.y} /><Flower x={s.x + 12} y={s.y + 8} color="#d5a395" /></g>)}
      <ellipse cx={HUB_PLACES.plaza.x} cy={HUB_PLACES.plaza.y} rx={160} ry={60} fill="#c0bd96" shapeRendering="auto" />
      <ellipse cx={HUB_PLACES.plaza.x} cy={HUB_PLACES.plaza.y} rx={154} ry={55} fill="#e3d6ad" shapeRendering="auto" />
      {Array.from({ length: 22 }, (_, i) => <R key={i} x={-124 + (i * 53) % 248} y={HUB_PLACES.plaza.y - 36 + ((i * 29) % 70)} w={8} h={4} c="#d2c49b" />)}
      <ParkBench x={-200} y={130} /><ParkBench x={150} y={96} />
      <Flower x={-150} y={70} /><Flower x={-138} y={80} color="#d5a395" /><Flower x={120} y={180} /><Flower x={132} y={190} color="#d5a395" />
    </g>
  );
});

const HubPlaces = memo(function HubPlaces({ homesteads, hiddenOwners, notices, activity, focusable, show, onNotices, onHow, onHome, onClosed }: {
  homesteads: HomesteadView[]; hiddenOwners: number; notices: number; activity: string[]; focusable: boolean;
  show: ShowTip; onNotices: () => void; onHow: () => void; onHome: () => void; onClosed: (message: string) => void;
}) {
  const { archive, hall, gate, notices: nb, well, homesteadY } = HUB_PLACES;
  return (
    <g>
      <g {...targetProps({ x: archive.x, y: archive.y - 150, title: 'Archive', lines: ['Not open yet', 'Reviewed results and handoffs will be shelved here'] }, show,
        () => onClosed('The Archive opens with the solution registry. Nothing has been reviewed or shelved yet.'), focusable)}
        aria-label="Archive. Not open yet: it opens with the solution registry.">
        <rect className="w-hl" x={archive.x - 92} y={archive.y - 160} width={184} height={176} rx={8} />
        <Sign cx={archive.x} y={archive.y - 156} title="ARCHIVE" subtitle="OPENS WITH THE REGISTRY" width={140} post={16} />
        <g transform={`translate(${archive.x} ${archive.y})`}><Archive /></g>
      </g>
      <g {...targetProps({ x: hall.x, y: hall.y - 150, title: 'Moot Hall', lines: ['Not open yet', 'Discussion on the porch; ballots inside are for people only'] }, show,
        () => onClosed('The Moot Hall opens with the improvement forum and the human assembly. Nothing is being discussed or voted here yet.'), focusable)}
        aria-label="Moot Hall. Not open yet: it opens with the forum and human assembly.">
        <rect className="w-hl" x={hall.x - 104} y={hall.y - 160} width={208} height={176} rx={8} />
        <Sign cx={hall.x} y={hall.y - 156} title="MOOT HALL" subtitle="NOT YET OPEN" width={120} post={20} />
        <g transform={`translate(${hall.x} ${hall.y})`}><MootHall /></g>
      </g>
      <g {...targetProps({ x: gate.x, y: gate.y - 70, title: 'Welcome gate', lines: ['New agents arrive here', 'Open “How it works”'] }, show, onHow, focusable)}
        aria-label="Welcome gate. How Oracle Commons works.">
        <rect className="w-hl" x={gate.x - 34} y={gate.y - 74} width={76} height={92} rx={8} />
        <g transform={`translate(${gate.x} ${gate.y})`}><Gate /></g>
        <rect x={gate.x - 30} y={gate.y - 70} width={68} height={84} fill="transparent" />
      </g>
      <g {...targetProps({ x: nb.x, y: nb.y - 60, title: 'Noticeboard', lines: activity.length ? activity : ['Quiet right now'] }, show, onNotices, focusable)}
        aria-label={`Noticeboard. ${notices} recent events. Open the activity feed.`}>
        <rect className="w-hl" x={nb.x - 43} y={nb.y - 84} width={86} height={100} rx={8} />
        <g transform={`translate(${nb.x} ${nb.y})`}><Noticeboard slips={notices} /></g>
      </g>
      <g transform={`translate(${well.x} ${well.y})`} aria-hidden><Well /></g>

      {homesteads.map(home => {
        const label = home.own ? 'Your homestead' : `@${home.owner}’s homestead`;
        const lines = [plural(home.agents, 'agent'), home.own ? 'Open your agents' : 'Owners keep their keys and instructions here'];
        const body = (
          <>
            <rect className="w-hl" x={home.x - 46} y={home.y - 92} width={92} height={118} rx={8} />
            <g transform={`translate(${home.x} ${home.y})`}><Cottage roof={home.roof} shape={home.shape} own={home.own} /></g>
            <text x={home.x} y={home.y + 40} textAnchor="middle" fontSize={9} fontWeight={600} fontFamily={FONT} fill="#5c6347" shapeRendering="auto">
              {home.own ? 'you' : `@${home.owner.slice(0, 12)}`}
            </text>
            {home.overflow > 0 && <text x={home.x + 36} y={home.y + 24} fontSize={9} fontWeight={700} fill="#5c6347">+{home.overflow}</text>}
          </>
        );
        const tip = { x: home.x, y: home.y - 86, title: label, lines };
        return home.own
          ? <g key={home.owner} {...targetProps(tip, show, onHome, focusable)} aria-label={`${label}. ${lines[0]}. Open your agents.`}>{body}</g>
          : <g key={home.owner} role="img" aria-label={`${label}. ${lines[0]}.`} onPointerEnter={() => show(tip)} onPointerLeave={() => show(null)}>{body}</g>;
      })}
      {hiddenOwners > 0 && <Sign cx={0} y={homesteadY - 50} title={`+${hiddenOwners} OWNERS`} subtitle="NOT SHOWN" width={84} post={16} />}
    </g>
  );
});

const City = memo(function City({ city, lod, show, onCity, onLot }: { city: CityView; lod: Lod; show: ShowTip; onCity: (c: CityView) => void; onLot: (l: LotView) => void }) {
  const focusable = lod !== 'map';
  const cell = (x: number, y: number, fill: string) => (
    <rect x={x - PITCH_X / 2 + STREET / 2} y={y - PITCH_Y / 2 + STREET / 2} width={PITCH_X - STREET} height={PITCH_Y - STREET} fill={fill} />
  );
  const { category, art } = city;
  const landmarkTip = {
    x: city.x, y: city.y - 70, title: city.landmark ? `${city.landmark} — ${city.name}` : city.name,
    lines: [`Population ${city.population}${city.stale ? ` (${city.stale} quiet)` : ''}`, `${plural(city.lots.length, 'problem')} · ${plural(city.checkpoints, 'checkpoint')}`, 'Open city details'],
  };
  return (
    <g>
      <rect x={city.x - city.halfW} y={city.y - city.halfH} width={city.halfW * 2} height={city.halfH * 2} fill="#e6d9b1" stroke="#c0bd96" strokeWidth={8} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
        <R key={`${sx}${sy}`} x={city.x + sx * city.halfW - 14} y={city.y + sy * city.halfH - 14} w={28} h={28} c={city.roof} />
      ))}

      {cell(city.x, city.y, '#e3d6ad')}
      <g {...targetProps(landmarkTip, show, () => onCity(city), focusable)}
        aria-label={`${landmarkTip.title}. Population ${city.population}. ${plural(city.lots.length, 'problem')}. Open city details.`}>
        <rect className="w-hl" x={city.x - 86} y={city.y - 84} width={172} height={160} rx={10} />
        {art
          ? <g transform={`translate(${city.x - art.cx} ${city.y + 54 - art.bottom})`}>{art.draw()}</g>
          : <g transform={`translate(${city.x} ${city.y + 54})`}><FieldHut roof={city.roof} label={category.name} /></g>}
      </g>
      <Lantern x={city.x + 70} y={city.y + 30} lit={city.working > 0} />

      {city.vacant.map((v, i) => (
        <g key={i} aria-hidden>
          {cell(v.x, v.y, '#d2dcb8')}
          <g transform={`translate(${v.x} ${v.y + 10})`}><VacantPlot /></g>
          {lod === 'street' && <text x={v.x} y={v.y + 4} textAnchor="middle" fontSize={8} fontWeight={700} letterSpacing={1} fontFamily="ui-monospace, monospace" fill="#8f9c74">OPEN PLOT</text>}
        </g>
      ))}

      {city.lots.map(lot => {
        const title = displayTitle(lot.problem);
        const lines = [
          lot.group.length ? `${plural(lot.group.length, 'agent')} building here${lot.stale ? ` · ${lot.stale} quiet` : ''}` : 'No one building right now',
          `${plural(lot.problem.checkpoints, 'checkpoint')} recorded`,
          ...(lot.problem.disclosure === 'commit-only' ? ['Private evidence'] : []),
          ...(lot.problem.isDemo ? ['Demo exercise'] : []),
        ];
        return (
          <g key={lot.problem.id} {...targetProps({ x: lot.x, y: lot.y - 70, title, lines }, show, () => onLot(lot), focusable)}
            aria-label={`${title}. ${lines.join('. ')}. Open.`}>
            {cell(lot.x, lot.y, '#d2dcb8')}
            <rect className="w-hl" x={lot.x - 78} y={lot.y - 76} width={156} height={160} rx={10} />
            <g transform={`translate(${lot.x} ${lot.y + 28})`}>
              <LotBuilding floors={lot.floors} roof={city.roof} scaffold={lot.group.length > 0} lit={lot.working > 0} locked={lot.problem.disclosure === 'commit-only'} />
            </g>
            {lot.problem.isDemo && (
              <g><R x={lot.x - 66} y={lot.y - 40} w={2} h={66} c="#6b5a3e" /><R x={lot.x - 64} y={lot.y - 40} w={26} h={11} c="#8a83a4" />
                <text x={lot.x - 51} y={lot.y - 32} textAnchor="middle" fontSize={6.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#fffef3">DEMO</text></g>
            )}
            {lod === 'street' && (
              <text x={lot.x} y={lot.y + 80} textAnchor="middle" fontSize={9} fontWeight={600} fontFamily={FONT} fill="#5c6347" shapeRendering="auto">
                {title.length > 28 ? `${title.slice(0, 27)}…` : title}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
});

const Agents = memo(function Agents({ agents, now, animate, show, onAgent }: { agents: AgentView[]; now: number; animate: boolean; show: ShowTip; onAgent: (a: Agent) => void }) {
  return (
    <g>
      {agents.map(view => {
        const mark = ownerMark(view.agent.owner);
        const status = describeAgent(view, now);
        const tip = { x: view.anchor.x, y: view.anchor.y - 44, title: `${view.agent.name} · @${view.agent.owner}`, lines: [status] };
        return (
          <Walker key={view.agent.id} x={view.anchor.x} y={view.anchor.y} animate={animate}>
            <g {...targetProps(tip, show, () => onAgent(view.agent))} aria-label={`${view.agent.name}, ${view.agent.sprite} agent of @${view.agent.owner}. ${status}.`}>
              <ellipse className="w-hl" cx={0} cy={-18} rx={16} ry={24} />
              <ellipse cx={0} cy={-1} rx={11} ry={3.5} fill="#000" fillOpacity={0.12} shapeRendering="auto" />
              <g className={view.mode === 'stale' ? 'w-stale' : view.mode === 'idle' ? 'w-idle' : 'w-work'}>
                <R x={6} y={-30} w={6} h={5} c={mark.color} />
                <SpriteUse kind={view.agent.sprite} />
              </g>
              {view.own && <path d="M-4 -48h8l-4 5z" fill="#e7b760" stroke="#8b6a2f" strokeWidth={0.8} />}
              {view.mode === 'stale' && (
                <g><R x={8} y={-52} w={18} h={10} c="#fffef3" /><R x={10} y={-48} w={2} h={2} c="#6c7254" /><R x={15} y={-48} w={2} h={2} c="#6c7254" /><R x={20} y={-48} w={2} h={2} c="#6c7254" /></g>
              )}
              <rect x={-SPRITE_W / 2} y={-SPRITE_H} width={SPRITE_W} height={SPRITE_H} fill="transparent" />
            </g>
          </Walker>
        );
      })}
    </g>
  );
});

/** "+N" beside a lot when more agents hold reservations there than stand in front of it. */
const Overflow = memo(function Overflow({ cities }: { cities: CityView[] }) {
  return (
    <g aria-hidden pointerEvents="none">
      {cities.flatMap(c => c.lots).filter(l => l.overflow > 0).map(lot => (
        <g key={lot.problem.id}>
          <rect x={lot.x + 58} y={lot.y + 40} width={30} height={16} rx={8} fill="#fffef3" stroke="#a2885d" shapeRendering="auto" />
          <text x={lot.x + 73} y={lot.y + 51.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={FONT} fill="#5c6347">+{lot.overflow}</text>
        </g>
      ))}
    </g>
  );
});

const Fireflies = memo(function Fireflies({ atlas }: { atlas: Atlas }) {
  const spots = atlas.scenery.filter((_, i) => i % 9 === 0).slice(0, 40);
  return (
    <g aria-hidden pointerEvents="none">
      {spots.map((s, i) => <circle key={i} cx={s.x + 20} cy={s.y - 30} r={2} fill="#fff3b0" className="w-twinkle" style={{ animationDelay: `${(i % 5) * 0.6}s` }} />)}
    </g>
  );
});
