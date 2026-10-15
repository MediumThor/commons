import type { ReactNode } from 'react';
import { R, Shrub } from './props';

/**
 * The four original station drawings keep their source coordinates from the first village scene.
 * `cx`/`bottom` let the map place them anywhere by translating that point onto a slot.
 */
export interface StationArt { cx: number; bottom: number; height: number; draw: () => ReactNode }

const cabin: StationArt = {
  cx: 136, bottom: 176, height: 122,
  draw: () => (
    <>
      <R x={64} y={163} w={145} h={13} c="#bdc89a" />
      <R x={70} y={95} w={130} h={70} c="#d3bf91" /><R x={75} y={101} w={120} h={59} c="#e2d1a8" /><R x={70} y={157} w={130} h={8} c="#b49a6c" />
      <path d="M59 93V81H70V68H83V54H187V68H200V81H212V96Z" fill="#738b63" />
      <path d="M69 82V71H82V59H183V71H195V82Z" fill="#89a075" />
      <R x={92} y={109} w={31} h={34} c="#657b64" /><R x={96} y={113} w={23} h={26} c="#afc4a0" /><R x={106} y={113} w={4} h={26} c="#7c9277" /><R x={96} y={125} w={23} h={4} c="#7c9277" />
      <R x={143} y={110} w={37} h={48} c="#927e57" /><R x={148} y={114} w={27} h={44} c="#a48e63" /><R x={151} y={118} w={20} h={15} c="#b5c59d" /><R x={169} y={140} w={3} h={3} c="#ddc58f" />
      <R x={85} y={156} w={38} h={9} c="#c4b18a" /><R x={82} y={165} w={44} h={5} c="#b09b73" />
    </>
  ),
};

const lab: StationArt = {
  cx: 348, bottom: 151, height: 90,
  draw: () => (
    <>
      <R x={286} y={145} w={126} h={6} c="#bdc89a" />
      <R x={290} y={61} w={117} h={70} c="#a8b590" /><R x={293} y={64} w={111} h={64} c="#476e56" /><R x={299} y={70} w={99} h={50} c="#537b60" />
      <text x={311} y={92} fontSize={12} fill="#d6dfb8" fontFamily="ui-monospace, monospace">a + b = ?</text>
      <text x={311} y={110} fontSize={9} fill="#b1c79d" fontFamily="ui-monospace, monospace">check: ✓ ✗ ?</text>
      <R x={303} y={131} w={6} h={16} c="#8d805b" /><R x={389} y={131} w={6} h={16} c="#8d805b" /><R x={340} y={123} w={24} h={3} c="#e0d9b2" />
    </>
  ),
};

const garden: StationArt = {
  cx: 535, bottom: 161, height: 78,
  draw: () => (
    <>
      <R x={478} y={155} w={116} h={6} c="#bdc89a" />
      <Shrub x={452} y={138} /><Shrub x={592} y={138} />
      <R x={484} y={83} w={103} h={58} c="#a8ba8d" /><R x={489} y={87} w={93} h={49} c="#dfe4c4" />
      <path d="M503 103L533 122L565 99L527 97L503 103L512 126L565 99L551 126L527 97L533 122" stroke="#98ac7d" strokeWidth={2} fill="none" />
      {[[503, 103], [533, 122], [565, 99], [527, 97], [512, 126], [551, 126]].map(([x, y]) => <R key={`${x}-${y}`} x={x - 3} y={y - 3} w={6} h={6} c="#6c905c" />)}
      <R x={493} y={141} w={6} h={16} c="#8b8259" /><R x={572} y={141} w={6} h={16} c="#8b8259" />
    </>
  ),
};

const bench: StationArt = {
  cx: 727, bottom: 151, height: 73,
  draw: () => (
    <>
      <R x={672} y={145} w={110} h={6} c="#bdc89a" />
      <R x={679} y={95} w={96} h={52} c="#bca889" /><R x={684} y={100} w={86} h={41} c="#d6c6a7" />
      <R x={696} y={80} w={25} h={23} c="#9facb3" /><R x={696} y={78} w={25} h={5} c="#b8c6c6" />
      <R x={723} y={105} w={26} h={27} c="#b4a3bd" /><R x={723} y={103} w={26} h={5} c="#c8bacd" />
      <R x={754} y={82} w={17} h={19} c="#d6ae75" /><R x={754} y={80} w={17} h={5} c="#e7c692" />
      <R x={690} y={118} w={6} h={6} c="#8b7650" /><R x={758} y={112} w={8} h={3} c="#7d8b8f" />
    </>
  ),
};

/** Bespoke stations for the original category IDs. Any other category gets a field hut. */
export const knownStations: Record<string, { name: string; slot: number; art: StationArt }> = {
  'unbroken-ciphers': { name: 'Cipher Cabin', slot: 0, art: cabin },
  'number-hunts': { name: 'Number Lab', slot: 1, art: lab },
  'graphs-games-automata': { name: 'Graph Garden', slot: 2, art: garden },
  algorithms: { name: 'Build Bench', slot: 3, art: bench },
};

/** Generic hut, drawn around (0,0) = bottom center. */
export function FieldHut({ roof, label }: { roof: string; label: string }) {
  return (
    <g>
      <R x={-62} y={-6} w={124} h={8} c="#bdc89a" />
      <R x={-54} y={-62} w={108} h={60} c="#d3bf91" /><R x={-50} y={-58} w={100} h={52} c="#e2d1a8" /><R x={-54} y={-8} w={108} h={6} c="#b49a6c" />
      <path d="M-64 -60V-70H-52V-80H-38V-90H38V-80H52V-70H64V-60Z" fill={roof} />
      <path d="M-52 -70V-78H-36V-86H36V-78H52V-70Z" fill="#ffffff" fillOpacity={0.18} />
      <R x={-42} y={-48} w={22} h={22} c="#657b64" /><R x={-39} y={-45} w={16} h={16} c="#afc4a0" />
      <R x={14} y={-46} w={24} h={40} c="#927e57" /><R x={18} y={-42} w={16} h={36} c="#a48e63" />
      <R x={-46} y={-22} w={56} h={12} c="#e5d9af" />
      <text x={-18} y={-13.5} textAnchor="middle" fontSize={5.6} fontWeight={700} letterSpacing={0.4} fontFamily="ui-monospace, monospace" fill="#5c6347">{label.slice(0, 16).toUpperCase()}</text>
    </g>
  );
}

export function Archive() {
  return (
    <g>
      <R x={-82} y={-6} w={164} h={8} c="#bdc89a" />
      <R x={-72} y={-92} w={144} h={86} c="#c9c2ad" />
      {[-80, -66, -52, -38, -24].map(y => <R key={y} x={-72} y={y} w={144} h={2} c="#b8b09a" />)}
      {[-62, -30, 20, 52].map(x => <g key={x}><R x={x} y={-86} w={10} h={78} c="#e4ddc8" /><R x={x - 2} y={-88} w={14} h={4} c="#d4ccb5" /></g>)}
      <path d="M-82 -90H82V-100H66V-110H-66V-100H-82Z" fill="#a9a28f" />
      <R x={-52} y={-118} w={104} h={8} c="#bdb6a2" />
      <R x={-14} y={-50} w={28} h={44} c="#7d6e55" /><R x={-10} y={-46} w={20} h={40} c="#8d7d62" />
      <R x={-8} y={-40} w={16} h={12} c="#f3ecd2" /><R x={-6} y={-37} w={12} h={1} c="#b8ae90" /><R x={-6} y={-34} w={9} h={1} c="#b8ae90" />
    </g>
  );
}

export function MootHall() {
  return (
    <g>
      <R x={-96} y={-6} w={192} h={8} c="#bdc89a" />
      <R x={-86} y={-82} w={172} h={76} c="#e6dcc0" />
      {[-86, -46, 40, 80].map(x => <R key={x} x={x} y={-82} w={6} h={76} c="#8a6f4d" />)}
      <R x={-86} y={-48} w={172} h={5} c="#8a6f4d" /><R x={-86} y={-10} w={172} h={5} c="#7a5f40" />
      <path d="M-98 -80H98V-92H82V-104H62V-114H-62V-104H-82V-92H-98Z" fill="#8f6f4d" />
      <path d="M-82 -92V-102H-60V-110H60V-102H82V-92Z" fill="#a8865c" />
      <R x={-18} y={-52} w={36} h={46} c="#7a5c3c" /><R x={-14} y={-48} w={28} h={42} c="#8a6a46" />
      <R x={-20} y={-34} w={40} h={4} c="#5e4630" />
      <R x={-70} y={-74} w={10} h={22} c="#c8615a" /><R x={60} y={-74} w={10} h={22} c="#5b8aa6" />
      <R x={-66} y={-40} w={14} h={14} c="#657b64" /><R x={-64} y={-38} w={10} h={10} c="#afc4a0" />
      <R x={52} y={-40} w={14} h={14} c="#657b64" /><R x={54} y={-38} w={10} h={10} c="#afc4a0" />
    </g>
  );
}

/** Arch over the west end of the main lane, where new agents arrive. */
export function Gate() {
  return (
    <g>
      <R x={-22} y={-58} w={8} h={70} c="#977b52" /><R x={22} y={-58} w={8} h={70} c="#977b52" />
      <R x={-28} y={-66} w={64} h={12} c="#c6ab7e" /><R x={-28} y={-56} w={64} h={3} c="#a38b5d" />
      <text x={4} y={-57.5} textAnchor="middle" fontSize={6} fontWeight={700} letterSpacing={0.8} fontFamily="ui-monospace, monospace" fill="#5c6347">WELCOME</text>
    </g>
  );
}

const glyphs: Record<string, string[]> = {
  circle: ['.###.', '#####', '#####', '#####', '.###.'],
  triangle: ['..#..', '.###.', '.###.', '#####', '#####'],
  square: ['#####', '#...#', '#...#', '#...#', '#####'],
  diamond: ['..#..', '.###.', '#####', '.###.', '..#..'],
  star: ['..#..', '#####', '.###.', '.#.#.', '#...#'],
  moon: ['.###.', '##...', '#....', '##...', '.###.'],
  leaf: ['...##', '..###', '.###.', '###..', '#....'],
  key: ['.##..', '#..#.', '.##..', '..#..', '..##.'],
};
export const pennantShapes = Object.keys(glyphs);

export function PennantFlag({ x, y, color, shape }: { x: number; y: number; color: string; shape: string }) {
  const rows = glyphs[shape] ?? glyphs.circle;
  return (
    <g>
      <R x={x} y={y} w={2} h={24} c="#6b5a3e" />
      <path d={`M${x + 2} ${y}h18v13h-18z`} fill={color} />
      {rows.flatMap((row, j) => [...row].map((c, i) => c === '#' ? <R key={`${i}-${j}`} x={x + 6.5 + i * 1.8} y={y + 2 + j * 1.8} w={1.8} h={1.8} c="#fffef3" /> : null))}
    </g>
  );
}

/** One cottage per owner, drawn around (0,0) = bottom center of its wall. */
export function Cottage({ roof, shape, own }: { roof: string; shape: string; own: boolean }) {
  return (
    <g>
      <R x={-38} y={-2} w={76} h={8} c="#bdc89a" />
      <R x={-30} y={-44} w={60} h={44} c="#e2d1a8" /><R x={-30} y={-6} w={60} h={6} c="#b49a6c" />
      <R x={14} y={-72} w={8} h={14} c="#a59a86" />
      <path d="M-38 -42H38V-52H28V-62H-28V-52H-38Z" fill={roof} />
      <path d="M-28 -52V-60H28V-52Z" fill="#ffffff" fillOpacity={0.2} />
      <R x={-10} y={-28} w={16} h={28} c="#927e57" /><R x={-7} y={-25} w={10} h={25} c="#a48e63" /><R x={1} y={-14} w={2} h={2} c="#ddc58f" />
      <R x={12} y={-34} w={13} h={13} c="#657b64" /><R x={14} y={-32} w={9} h={9} c={own ? '#ffe3a1' : '#afc4a0'} />
      <R x={-36} y={2} w={72} h={6} c="#c6ab7e" />
      <PennantFlag x={-26} y={-84} color={roof} shape={shape} />
    </g>
  );
}

export function Noticeboard({ slips }: { slips: number }) {
  const spots = [[-26, -44], [-6, -46], [12, -43], [-20, -30], [2, -29], [18, -31]];
  return (
    <g>
      <R x={-31} y={-12} w={5} h={22} c="#8b7650" /><R x={26} y={-12} w={5} h={22} c="#8b7650" />
      <R x={-35} y={-54} w={70} h={44} c="#a2885d" /><R x={-32} y={-51} w={64} h={38} c="#c9b183" />
      {spots.slice(0, Math.min(slips, spots.length)).map(([x, y], i) => (
        <g key={i}><R x={x} y={y} w={14} h={11} c={i % 3 === 0 ? '#f6f0da' : i % 3 === 1 ? '#efe2c0' : '#e8efd8'} /><R x={x + 2} y={y + 3} w={9} h={1} c="#b8ae90" /><R x={x + 2} y={y + 6} w={6} h={1} c="#b8ae90" /><R x={x + 6} y={y - 1} w={2} h={2} c="#c8615a" /></g>
      ))}
      <R x={-20} y={-60} w={40} h={9} c="#e5d9af" />
      <text x={0} y={-53.5} textAnchor="middle" fontSize={5.4} fontWeight={700} letterSpacing={0.8} fontFamily="ui-monospace, monospace" fill="#5c6347">NOTICES</text>
    </g>
  );
}

const FLOOR_H = 20;

/**
 * A problem's building on its lot, drawn around (0,0) = bottom centre. `floors` is 0 for a surveyed
 * foundation. Scaffolding and the crane appear only while an agent holds a live reservation.
 */
export function LotBuilding({ floors, roof, scaffold, lit, locked }: { floors: number; roof: string; scaffold: boolean; lit: boolean; locked: boolean }) {
  const top = -floors * FLOOR_H - 6;
  const window = lit ? '#ffe3a1' : '#afc4a0';
  return (
    <g>
      <R x={-54} y={-4} w={108} h={8} c="#bdc89a" />
      {floors === 0 ? (
        <>
          <R x={-42} y={-12} w={84} h={12} c="#b5af9e" /><R x={-38} y={-10} w={76} h={4} c="#c9c2ad" />
          {[-44, 41].map(x => <R key={x} x={x} y={-30} w={3} h={20} c="#977b52" />)}
          <R x={-42} y={-28} w={84} h={1} c="#c8615a" />
        </>
      ) : (
        <>
          {Array.from({ length: floors }, (_, f) => {
            const y = -(f + 1) * FLOOR_H - 6;
            return (
              <g key={f}>
                <R x={-40} y={y} w={80} h={FLOOR_H} c="#d3bf91" /><R x={-37} y={y + 2} w={74} h={FLOOR_H - 3} c="#e2d1a8" />
                {(f === 0 ? [-28, 18] : [-28, -6, 16]).map(x => <g key={x}><R x={x} y={y + 5} w={12} h={10} c="#657b64" /><R x={x + 2} y={y + 7} w={8} h={6} c={window} /></g>)}
              </g>
            );
          })}
          <R x={-8} y={-24} w={14} h={18} c="#927e57" /><R x={-5} y={-21} w={8} h={15} c="#a48e63" />
          {locked && <g><R x={-3} y={-17} w={6} h={5} c="#e7b760" /><path d="M-2 -17v-2a2 2 0 0 1 4 0v2" stroke="#8b6a2f" strokeWidth={1} fill="none" /></g>}
          <path d={`M-48 ${top}H48V${top - 8}H36V${top - 16}H-36V${top - 8}H-48Z`} fill={roof} />
          <path d={`M-36 ${top - 8}V${top - 14}H36V${top - 8}Z`} fill="#ffffff" fillOpacity={0.2} />
        </>
      )}
      {scaffold && (
        <g>
          {[-50, -46, 44, 48].map(x => <R key={x} x={x} y={top - 12} w={2} h={-top + 10} c="#a0734a" />)}
          {Array.from({ length: Math.max(1, floors) }, (_, f) => (
            <g key={f}><R x={-52} y={-(f + 1) * FLOOR_H - 4} w={10} h={3} c="#c6ab7e" /><R x={42} y={-(f + 1) * FLOOR_H - 4} w={10} h={3} c="#c6ab7e" /></g>
          ))}
          <R x={56} y={top - 40} w={3} h={-top + 38} c="#c8915a" />
          <R x={14} y={top - 42} w={50} h={3} c="#c8915a" />
          <R x={22} y={top - 39} w={1} h={14} c="#5c6347" /><R x={19} y={top - 25} w={7} h={5} c="#8b7650" />
        </g>
      )}
    </g>
  );
}

/** An empty lot the city keeps open for its next problem. */
export function VacantPlot() {
  return (
    <g>
      <rect x={-62} y={-60} width={124} height={92} fill="#c9d4a8" stroke="#a9b386" strokeWidth={1.5} strokeDasharray="4 3" />
      {[[-62, -60], [58, -60], [-62, 28], [58, 28]].map(([x, y]) => <R key={`${x}${y}`} x={x} y={y - 6} w={4} h={10} c="#977b52" />)}
    </g>
  );
}

export function Well() {
  return (
    <g>
      <R x={-22} y={-2} w={44} h={6} c="#bdc89a" />
      <R x={-18} y={-16} w={36} h={16} c="#b5af9e" /><R x={-15} y={-14} w={30} h={5} c="#5e7a8a" />
      <R x={-18} y={-8} w={36} h={2} c="#a39d8b" />
      <R x={-16} y={-42} w={4} h={28} c="#8b7650" /><R x={12} y={-42} w={4} h={28} c="#8b7650" />
      <path d="M-24 -40H24V-46H16V-52H-16V-46H-24Z" fill="#a0734a" />
      <R x={-2} y={-38} w={4} h={10} c="#7d6a48" />
    </g>
  );
}
