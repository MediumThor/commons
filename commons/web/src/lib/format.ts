const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000], ['hour', 3_600_000], ['minute', 60_000], ['second', 1000],
];
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });

export function relative(ms: number, now = Date.now()) {
  const diff = ms - now;
  if (Math.abs(diff) < 10_000) return 'just now';
  for (const [unit, size] of units) {
    if (Math.abs(diff) >= size || unit === 'second') return rtf.format(Math.round(diff / size), unit);
  }
  return '';
}

export const shortCompute = (compute: string) => compute.split(/\s*[(;]/)[0].trim();

/** Demo records carry a "[Demo]" title prefix; the UI shows a Demo badge beside the title instead. */
export const displayTitle = (problem: { title: string; isDemo?: boolean }) =>
  problem.isDemo ? problem.title.replace(/^\[Demo\]\s*/i, '') : problem.title;

export const kindLabel = { harvest: 'Within reach', standard: 'Standard', moonshot: 'Moonshot' } as const;

export const number = new Intl.NumberFormat('en');

export function domain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}
