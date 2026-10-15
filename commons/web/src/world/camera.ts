import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Point, Rect } from './map/atlas';

/** screen = world × k + (tx, ty) */
export interface Camera { k: number; tx: number; ty: number }

export const MAX_K = 2.2;
/** Below this zoom the world is a map: cities and labels only, no individual sprites. */
export const SPRITE_K = 0.4;
/** At and above this zoom, lot plaques and open-plot signs are drawn. */
export const STREET_K = 0.8;

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function fitRect(rect: Rect, w: number, h: number, pad = 0.9): Camera {
  const k = Math.min((w * pad) / rect.w, (h * pad) / rect.h);
  return { k, tx: w / 2 - (rect.x + rect.w / 2) * k, ty: h / 2 - (rect.y + rect.h / 2) * k };
}

export function useCamera(el: RefObject<HTMLElement | null>, size: { w: number; h: number }, bounds: Rect, reduce: boolean, initial: () => Camera) {
  const [cam, setCam] = useState<Camera>({ k: 0.5, tx: 0, ty: 0 });
  const camRef = useRef(cam);
  camRef.current = cam;
  const frame = useRef(0);
  const started = useRef(false);
  const minK = size.w && size.h ? Math.min(fitRect(bounds, size.w, size.h, 1).k, SPRITE_K) * 0.9 : 0.1;

  const clamp = useCallback((c: Camera): Camera => {
    const k = Math.min(MAX_K, Math.max(minK, c.k));
    const { w, h } = size;
    const left = -bounds.x * k + w * 0.5, right = w * 0.5 - (bounds.x + bounds.w) * k;
    const top = -bounds.y * k + h * 0.5, bottom = h * 0.5 - (bounds.y + bounds.h) * k;
    return { k, tx: Math.min(left, Math.max(right, c.tx)), ty: Math.min(top, Math.max(bottom, c.ty)) };
  }, [bounds, size, minK]);

  const set = useCallback((next: Camera) => { cancelAnimationFrame(frame.current); setCam(clamp(next)); }, [clamp]);

  const lastSize = useRef(size);
  useEffect(() => {
    if (!size.w || !size.h) return;
    const prev = lastSize.current;
    lastSize.current = size;
    if (!started.current) { started.current = true; setCam(clamp(initial())); return; }
    setCam(c => clamp({ ...c, tx: c.tx + (size.w - prev.w) / 2, ty: c.ty + (size.h - prev.h) / 2 }));
  }, [size.w, size.h, clamp]);

  const fly = useCallback((to: Camera) => {
    cancelAnimationFrame(frame.current);
    const target = clamp(to);
    if (reduce) { setCam(target); return; }
    const from = camRef.current, start = performance.now(), duration = 650;
    const step = (time: number) => {
      const t = ease(Math.min(1, (time - start) / duration));
      const k = Math.exp(Math.log(from.k) + (Math.log(target.k) - Math.log(from.k)) * t);
      const c0 = { x: (size.w / 2 - from.tx) / from.k, y: (size.h / 2 - from.ty) / from.k };
      const c1 = { x: (size.w / 2 - target.tx) / target.k, y: (size.h / 2 - target.ty) / target.k };
      const cx = c0.x + (c1.x - c0.x) * t, cy = c0.y + (c1.y - c0.y) * t;
      setCam({ k, tx: size.w / 2 - cx * k, ty: size.h / 2 - cy * k });
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [clamp, reduce, size]);

  const zoomAt = useCallback((screen: Point, factor: number, animate = false) => {
    const c = camRef.current;
    const k = Math.min(MAX_K, Math.max(minK, c.k * factor));
    const wx = (screen.x - c.tx) / c.k, wy = (screen.y - c.ty) / c.k;
    const next = { k, tx: screen.x - wx * k, ty: screen.y - wy * k };
    if (animate) fly(next); else set(next);
  }, [fly, set, minK]);

  const flyToRect = useCallback((rect: Rect, pad = 0.9) => fly(fitRect(rect, size.w, size.h, pad)), [fly, size]);
  const centerOn = useCallback((p: Point, k = camRef.current.k) => fly({ k, tx: size.w / 2 - p.x * k, ty: size.h / 2 - p.y * k }), [fly, size]);

  /** Drag to pan, wheel or pinch to zoom. Returns whether the last pointer gesture moved, so clicks can be ignored. */
  const moved = useRef(false);
  useEffect(() => {
    const node = el.current; if (!node) return;
    const pointers = new Map<number, Point>();
    let last: { cam: Camera; mid: Point; dist: number } | null = null;
    const local = (e: { clientX: number; clientY: number }) => { const r = node.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const snapshot = () => {
      const pts = [...pointers.values()];
      const mid = pts.length > 1 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0];
      const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
      last = { cam: camRef.current, mid, dist };
    };
    let origin: Point | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if ((e.target as HTMLElement).closest?.('[data-hud]')) return;
      pointers.set(e.pointerId, local(e));
      if (pointers.size === 1) { origin = local(e); moved.current = false; }
      snapshot();
    };
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId) || !last) return;
      pointers.set(e.pointerId, local(e));
      const p = local(e);
      if (!moved.current && origin && Math.hypot(p.x - origin.x, p.y - origin.y) < 5 && pointers.size === 1) return;
      if (!moved.current) { moved.current = true; node.setPointerCapture(e.pointerId); node.dataset.dragging = 'true'; }
      const pts = [...pointers.values()];
      const mid = pts.length > 1 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0];
      const scale = pts.length > 1 && last.dist ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) / last.dist : 1;
      const k = last.cam.k * scale;
      const wx = (last.mid.x - last.cam.tx) / last.cam.k, wy = (last.mid.y - last.cam.ty) / last.cam.k;
      set({ k, tx: mid.x - wx * k, ty: mid.y - wy * k });
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size) snapshot(); else { last = null; origin = null; delete node.dataset.dragging; }
    };
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest?.('[data-hud]')) return;
      e.preventDefault();
      const mouseWheel = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
      if (e.ctrlKey || e.metaKey || mouseWheel) zoomAt(local(e), Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)));
      else { const c = camRef.current; set({ ...c, tx: c.tx - e.deltaX, ty: c.ty - e.deltaY }); }
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('wheel', wheel, { passive: false });
    return () => {
      node.removeEventListener('pointerdown', down); node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up);
      node.removeEventListener('wheel', wheel);
    };
  }, [el, set, zoomAt]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return { cam, set, fly, zoomAt, flyToRect, centerOn, moved, minK };
}
