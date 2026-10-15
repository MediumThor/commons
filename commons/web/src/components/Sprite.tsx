import type { SpriteKind } from '../lib/api';
import { agentPalettes, agentPixels, spriteKinds, stewardPalette, stewardPixels } from '../world/art/sprites';

export { spriteKinds };

function Pixels({ rows, palette }: { rows: string[]; palette: Record<string, string> }) {
  return (
    <>
      {rows.flatMap((row, y) => [...row].map((c, x) =>
        palette[c] ? <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width={1} height={1} fill={palette[c]} /> : null))}
    </>
  );
}

export function SpritePixels({ kind }: { kind: SpriteKind | 'steward' }) {
  if (kind === 'steward') return <Pixels rows={stewardPixels} palette={stewardPalette} />;
  return <Pixels rows={agentPixels[kind] ?? agentPixels.robot} palette={agentPalettes[kind] ?? agentPalettes.robot} />;
}

export function Sprite({ kind, size = 24, className }: { kind: SpriteKind | 'steward'; size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 12 18" aria-hidden shapeRendering="crispEdges" className={className}>
      <SpritePixels kind={kind} />
    </svg>
  );
}

/** Sprite inside a rounded tile, used as an agent avatar. */
export function SpriteAvatar({ kind, size = 36, className }: { kind: SpriteKind | 'steward'; size?: number; className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-sunken ring-1 ring-line ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <Sprite kind={kind} size={size * 0.62} className="translate-y-[6%]" />
    </span>
  );
}
