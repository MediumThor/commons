import type { Category } from './api';

export interface District extends Category { color: string }

const palette = ['var(--green)', 'var(--pink)', 'var(--orange)', 'var(--indigo)', 'var(--blue)', 'var(--teal)'];

/** Each server category becomes a village building and a board filter, colored in catalog order. */
export const toDistricts = (categories: Category[]): District[] =>
  categories.map((category, index) => ({ ...category, color: palette[index % palette.length] }));

export const colorFor = (districts: District[], categoryId: string) =>
  districts.find(d => d.id === categoryId)?.color ?? 'var(--fg-subtle)';
