import assert from 'node:assert/strict';
import test from 'node:test';
import { HUB, MIN_VACANT, layoutAtlas, planCity } from '../web/src/world/map/atlas.ts';

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('a city holds one lot per problem and grows a ring before open plots fall below the minimum', () => {
  for (const lots of [0, 1, 5, 6, 20, 21, 45, 200]) {
    const plan = planCity(lots);
    assert.ok(plan.cells.length - lots >= MIN_VACANT, `${lots} problems leave at least ${MIN_VACANT} open plots`);
    const smaller = plan.rings > 1 ? plan.cells.length - 8 * plan.rings : 0;
    assert.ok(plan.rings === 1 || smaller - lots < MIN_VACANT, `${lots} problems do not get a needless extra ring`);
    assert.equal(new Set(plan.cells.map(c => `${c.x},${c.y}`)).size, plan.cells.length, 'lots never share a cell');
    assert.ok(plan.cells.every(c => !(c.x === 0 && c.y === 0)), 'the centre cell is kept for the landmark');
  }
  assert.equal(planCity(0).rings, 1);
  assert.equal(planCity(6).rings, 2);
});

test('cities never overlap each other or the hub, and the layout is deterministic', () => {
  const specs = Array.from({ length: 12 }, (_, i) => ({ id: `field-${i}`, lots: (i * 7) % 30 }));
  const atlas = layoutAtlas(specs);
  const hub = { x: -HUB.halfW, y: -HUB.halfH, w: HUB.halfW * 2, h: HUB.halfH * 2 };
  atlas.cities.forEach((city, i) => {
    assert.equal(overlaps(city.rect, hub), false, `${city.id} clears the hub`);
    for (const other of atlas.cities.slice(i + 1)) assert.equal(overlaps(city.rect, other.rect), false, `${city.id} clears ${other.id}`);
    for (const r of [city.rect, hub]) {
      assert.ok(r.x >= atlas.bounds.x && r.x + r.w <= atlas.bounds.x + atlas.bounds.w, 'world bounds contain every place');
    }
  });
  assert.deepEqual(layoutAtlas(specs), atlas);
});

test('every city has one orthogonal road that starts at a hub exit and ends on its wall', () => {
  const atlas = layoutAtlas([{ id: 'a', lots: 1 }, { id: 'b', lots: 0 }, { id: 'c', lots: 12 }, { id: 'd', lots: 3 }]);
  assert.equal(atlas.roads.length, atlas.cities.length);
  atlas.roads.forEach((road, i) => {
    const [start] = road, end = road[road.length - 1], { rect } = atlas.cities[i];
    assert.ok(Math.abs(start.x) === HUB.halfW || Math.abs(start.y) === HUB.halfH, 'road leaves from a hub edge');
    assert.ok(end.x === rect.x || end.x === rect.x + rect.w || end.y === rect.y || end.y === rect.y + rect.h, 'road ends on the city wall');
    for (let j = 1; j < road.length; j++) assert.ok(road[j].x === road[j - 1].x || road[j].y === road[j - 1].y, 'segments are orthogonal');
  });
});
