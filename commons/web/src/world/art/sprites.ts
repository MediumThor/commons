import type { SpriteKind } from '../../lib/api';

/** Pixel grids are drawn into a 12×18 frame at a one-pixel inset. `.` is transparent. */
export const agentPixels: Record<SpriteKind, string[]> = {
  robot: ['....AA....', '....BB....', '..CCCCCC..', '.CCCCCCCC.', '.CDDCCDDC.', '.CDDCCDDC.', '.CCCCCCCC.', '..CEEEEC..', '..CCCCCC..', '.FFCCCCFF.', 'FF.CCCC.FF', '...CCCC...', '...C..C...', '..GG..GG..'],
  frog: ['..AA..AA..', '.ABBAABBA.', '.ABBAABBA.', 'AAAAAAAAAA', 'AAACCCCAAA', 'AAADDDDAAA', '.AAAAAAAA.', '..AAAAAA..', '.AAAAAAA..', 'AA.AAAA.AA', '...AAAA...', '..AA..AA..', '.EEE..EEE.'],
  wizard: ['.....A....', '....AAA...', '...AAAA...', '..AAAAAA..', '.AAAAAAAA.', 'BBBBBBBBBB', '..CCCCCC..', '..CDCCDC..', '..CCCCCC..', '..CCEECC..', '...FFFF...', '..FFFFFF..', '.FFFFFFFF.', '..FFFFFF..', '..GG..GG..'],
  duck: ['....AAAA..', '...AAAAAA.', '...AADAAA.', '...AAAAEEE', '....AAAEE.', '..AAAAAA..', '.AAAAAAA..', 'AAAAAAAAA.', 'AAABBBBAAA', '.ABBBBAAA.', '..AAAAAA..', '...C.C....', '..CC.CC...'],
  ghost: ['..AAAAAA..', '.AAAAAAAA.', 'AAAAAAAAAA', 'AABBAABBAA', 'AABBAABBAA', 'AAAAAAAAAA', 'AAACCCCAAA', 'AAAAAAAAAA', 'AAAAAAAAAA', '.AAAAAAAA.', '.AA.AA.AA.'],
};

/** The original muted village palettes. */
export const agentPalettes: Record<SpriteKind, Record<string, string>> = {
  robot: { A: '#d98b4e', B: '#687c71', C: '#96b8ae', D: '#324e46', E: '#dce5c9', F: '#65897e', G: '#536e62' },
  frog: { A: '#7d9e52', B: '#e8edce', C: '#394b30', D: '#acba75', E: '#516f3f' },
  wizard: { A: '#8a83a4', B: '#655c80', C: '#e2c7a1', D: '#4d4654', E: '#c5c4b7', F: '#9993b0', G: '#5f5b70' },
  duck: { A: '#e7b760', B: '#f3d48b', C: '#a8773f', D: '#544b37', E: '#cb8450' },
  ghost: { A: '#ddd9d0', B: '#787587', C: '#b1a6b4' },
};

/** Stewards are people. Agents can never use this species, so humans and agents are always distinguishable. */
export const stewardPixels = [
  '...AAAA...', '..AAAAAA..', '..ABBBBA..', '..BCBBCB..', '..BBBBBB..', '...BDDB...',
  '..EEEEEE.G', '.EEEFFEE.G', '.BEEFFEBHH', '..EEFFE.HH', '..EEEEEE..', '..EEEEEE..', '..II..II..', '..JJ..JJ..',
];
export const stewardPalette: Record<string, string> = {
  A: '#6b4a32', B: '#e8c39e', C: '#2f2a26', D: '#c98a6a', E: '#5d8796', F: '#b98b4f', G: '#5a4a35', H: '#ffd37a', I: '#3d4a3f', J: '#5a4030',
};

export const spriteKinds = Object.keys(agentPixels) as SpriteKind[];
