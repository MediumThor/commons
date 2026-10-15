import { memo } from 'react';

export const R = ({ x, y, w, h, c, o }: { x: number; y: number; w: number; h: number; c: string; o?: number }) =>
  <rect x={x} y={y} width={w} height={h} fill={c} fillOpacity={o} />;

export function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <R x={3} y={46} w={52} h={9} c="#b5c695" /><R x={25} y={30} w={10} h={24} c="#977b52" /><R x={32} y={32} w={5} h={21} c="#786646" />
      <path d="M18 0H42V6H52V16H58V37H49V44H10V37H2V17H9V7H18Z" fill="#72975d" />
      <path d="M18 0H42V6H49V15H43V23H34V30H13V36H3V17H9V7H18Z" fill="#8aab69" />
      <R x={14} y={11} w={10} h={6} c="#a2bd7b" /><R x={8} y={23} w={6} h={6} c="#a2bd7b" /><R x={43} y={29} w={8} h={6} c="#5e8451" />
    </g>
  );
}

export function Shrub({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <R x={x} y={y + 9} w={27} h={8} c="#adc08d" /><R x={x + 5} y={y} w={17} h={6} c="#8eaa67" /><R x={x} y={y + 5} w={27} h={9} c="#8eaa67" />
      <R x={x + 3} y={y + 4} w={8} h={4} c="#a4bb7b" /><R x={x + 19} y={y + 9} w={6} h={5} c="#789954" />
    </g>
  );
}

export function Flower({ x, y, color = '#e5d38a' }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <R x={x + 2} y={y + 4} w={2} h={6} c="#8fa55e" /><R x={x} y={y + 2} w={6} h={3} c={color} /><R x={x + 2} y={y} w={2} h={7} c={color} />
      <R x={x + 2} y={y + 2} w={2} h={3} c="#c89965" />
    </g>
  );
}

export function ParkBench({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <R x={x + 2} y={y + 22} w={47} h={5} c="#b7c493" /><R x={x + 7} y={y + 7} w={5} h={17} c="#997b4f" /><R x={x + 39} y={y + 7} w={5} h={17} c="#997b4f" />
      <R x={x} y={y} w={52} h={6} c="#c5a979" /><R x={x} y={y + 9} w={52} h={5} c="#b79766" /><R x={x} y={y + 16} w={52} h={5} c="#c5a979" />
    </g>
  );
}

/** Wooden sign on a post. `post` extends the post downward to meet whatever stands below the sign. */
export function Sign({ cx, y, title, subtitle, width, post = 18 }: { cx: number; y: number; title: string; subtitle?: string; width: number; post?: number }) {
  const x = cx - width / 2, h = subtitle ? 30 : 21;
  return (
    <g>
      <R x={cx - 3} y={y + h - 4} w={6} h={post} c="#a38b5d" />
      <R x={x - 2} y={y + 2} w={width + 4} h={h + 1} c="#a2885d" />
      <R x={x} y={y} w={width} h={h} c="#e5d9af" />
      <text x={cx} y={y + 13} textAnchor="middle" fontSize={7.5} fontWeight={700} letterSpacing={1} fontFamily="ui-monospace, 'SF Mono', monospace" fill="#5c6347">{title}</text>
      {subtitle && <text x={cx} y={y + 24} textAnchor="middle" fontSize={6.2} letterSpacing={0.6} fontFamily="ui-monospace, 'SF Mono', monospace" fill="#7d8466">{subtitle}</text>}
    </g>
  );
}

/** Lantern on a short pole: lit means at least one agent is working there right now. */
export function Lantern({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g>
      <R x={x + 2} y={y + 8} w={3} h={20} c="#7d6a48" />
      <R x={x - 1} y={y} w={9} h={10} c="#5e5139" />
      <R x={x + 1} y={y + 2} w={5} h={6} c={lit ? '#ffd37a' : '#9a9a88'} />
      {lit && <circle cx={x + 3.5} cy={y + 5} r={14} fill="#ffd37a" fillOpacity={0.28} className="w-flicker" />}
    </g>
  );
}

export const GrassTufts = memo(function GrassTufts() {
  let seed = 134;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const tufts = Array.from({ length: 420 }, (_, i) => {
    const x = Math.floor((rand() * 1700 - 210) / 4) * 4, y = Math.floor((rand() * 1100 - 190) / 4) * 4;
    return <path key={i} d={`M${x} ${y}v-3m4 3v-5m4 5v-3`} stroke={rand() > 0.5 ? '#b3c28f' : '#c1ce9e'} strokeWidth={2} />;
  });
  return <g>{tufts}</g>;
});

export function Pond({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 30} ${y - 267})`}>
      <path d="M30 278H44V267H104V273H123V283H139V311H127V324H53V318H30Z" fill="#b5c79d" />
      <path d="M37 281H49V272H102V279H119V289H132V307H119V318H57V311H37Z" fill="#9bbdb0" />
      <g className="w-water"><R x={55} y={286} w={20} h={3} c="#c0d7c3" /><R x={92} y={299} w={22} h={3} c="#c0d7c3" /><R x={52} y={306} w={15} h={2} c="#c0d7c3" /></g>
      <R x={76} y={292} w={10} h={6} c="#7f9f62" /><R x={79} y={290} w={4} h={2} c="#7f9f62" />
      <R x={101} y={286} w={12} h={7} c="#8aa373" /><Flower x={106} y={283} color="#ead4bd" />
    </g>
  );
}

export function Butterfly({ x, y }: { x: number; y: number }) {
  return <g className="w-flutter"><R x={x} y={y} w={4} h={4} c="#dfb67a" /><R x={x + 6} y={y} w={4} h={4} c="#dfb67a" /><R x={x + 4} y={y + 2} w={2} h={4} c="#7f8b63" /></g>;
}

/** Long worktable in front of a station. Agents stand behind it; the table front hides their feet. */
export function WorkTable({ cx, y, notes }: { cx: number; y: number; notes: number }) {
  const sheets = Math.min(notes, 3);
  return (
    <g>
      <R x={cx - 68} y={y + 22} w={136} h={6} c="#b6c495" />
      <R x={cx - 58} y={y + 10} w={6} h={14} c="#9d835a" /><R x={cx + 52} y={y + 10} w={6} h={14} c="#9d835a" />
      <R x={cx - 64} y={y} w={128} h={8} c="#c6ab7e" /><R x={cx - 63} y={y + 8} w={126} h={4} c="#b3966b" />
      {Array.from({ length: sheets }, (_, i) => (
        <g key={i}><R x={cx - 62 + i} y={y - 3 - i * 2} w={12} h={3} c={i % 2 ? '#efe7cb' : '#f6f0da'} /></g>
      ))}
      {notes > 3 && <text x={cx - 56} y={y - 11} textAnchor="middle" fontSize={6} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#6c7254">{notes}</text>}
    </g>
  );
}
