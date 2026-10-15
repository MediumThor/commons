import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const clip = (value, max) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
};

const iconFor = categoryId => {
  if (/cipher|script|ancient|herculaneum/.test(categoryId)) return 'cipher';
  if (/number|erdos/.test(categoryId)) return 'number';
  if (/algorithm|optimization/.test(categoryId)) return 'matrix';
  if (/graph|packing/.test(categoryId)) return 'graph';
  if (categoryId.includes('ml')) return 'robot';
  return 'star';
};

export function loadCatalog(root = APP_ROOT) {
  const catalog = JSON.parse(readFileSync(resolve(root, 'data/problems.json'), 'utf8'));
  const categoryById = new Map(catalog.categories.map((category, index) => [category.id, { ...category, order: index }]));
  const problems = catalog.problems.map((problem, index) => {
    const category = categoryById.get(problem.categoryId);
    if (!category) throw new Error(`Unknown Commons category: ${problem.categoryId}`);
    return {
      id: problem.id,
      title: problem.title,
      originalTitle: problem.title,
      description: clip(problem.summary, 180),
      category: category.name,
      categoryId: problem.categoryId,
      categoryOrder: category.order,
      icon: problem.icon || iconFor(problem.categoryId),
      criterion: problem.acceptanceCriteria,
      statement: problem.objective,
      verification: problem.reproduction,
      partialWins: [],
      disclosure: problem.disclosure,
      statusChecked: catalog.updated,
      statusSource: '',
      sources: [],
      compute: 'laptop-minutes',
      tractability: 5,
      kind: 'standard',
      guideUrl: '',
      sourceUrl: '',
      featured: true,
      order: index,
      isDemo: true,
      provenance: 'Original Commons development exercise; not an unsolved scientific problem.',
    };
  });
  const publicCategories = catalog.categories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    count: problems.filter(problem => problem.categoryId === category.id).length,
  }));
  return { updated: catalog.updated, origin: catalog.origin, problems, publicCategories, byId: new Map(problems.map(problem => [problem.id, problem])) };
}

export function legacyCard(problem) {
  return {
    id: problem.id,
    title: problem.title,
    originalTitle: problem.originalTitle,
    description: problem.description,
    category: problem.category,
    categoryId: problem.categoryId,
    categoryOrder: problem.categoryOrder,
    icon: problem.icon,
    kind: problem.kind,
    compute: problem.compute,
    tractability: problem.tractability,
    disclosure: problem.disclosure,
    featured: problem.featured,
    order: problem.order,
    isDemo: problem.isDemo,
    provenance: problem.provenance,
  };
}

export function v1Card(problem) {
  return {
    schemaVersion: 1,
    id: problem.id,
    title: problem.title,
    summary: problem.description,
    category: problem.category,
    categoryId: problem.categoryId,
    icon: problem.icon,
    disclosure: problem.disclosure,
    isDemo: problem.isDemo,
    provenance: problem.provenance,
  };
}

export function v1Detail(problem, activeTasks) {
  return {
    ...v1Card(problem),
    statement: problem.statement,
    criterion: problem.criterion,
    verification: problem.verification,
    partialWins: problem.partialWins,
    sources: problem.sources,
    guideUrl: problem.guideUrl,
    statusChecked: problem.statusChecked,
    visibility: 'public',
    activeTasks,
  };
}
