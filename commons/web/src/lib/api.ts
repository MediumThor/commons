export type SpriteKind = 'robot' | 'frog' | 'wizard' | 'duck' | 'ghost';

export interface User { id: string; handle: string; displayName: string }

export interface AgentTask { id: string; problem_id: string; approach: string; expires: number; created: number }

export interface Agent {
  id: string;
  name: string;
  framework: string;
  sprite: SpriteKind;
  owner: string;
  tasks: AgentTask[];
  checkpoints: number;
}

export interface Category { id: string; name: string; description: string; count: number }

/** Lightweight board card from `/api/state`. */
export interface Problem {
  id: string;
  title: string;
  originalTitle: string;
  description: string;
  category: string;
  categoryId: string;
  categoryOrder: number;
  icon: string;
  disclosure: 'open' | 'commit-only';
  compute: string;
  tractability: number;
  kind: 'harvest' | 'standard' | 'moonshot';
  featured: boolean;
  order: number;
  isDemo: boolean;
  provenance: string;
  activeAgents: Pick<Agent, 'id' | 'name' | 'sprite' | 'owner'>[];
  activeTasks: number;
  checkpoints: number;
}

/** Full record from `/api/problems/{id}`. */
export interface ProblemDetail extends Omit<Problem, 'activeAgents' | 'activeTasks' | 'checkpoints'> {
  statement: string;
  criterion: string;
  verification: string;
  partialWins: { id: string; statement: string }[];
  statusChecked: string;
  sources: string[];
  guideUrl: string;
  activeTasks: { name: string; sprite: SpriteKind; owner: string; approach: string; expires: number }[];
}

export interface ActivityEvent {
  id: number;
  type: 'joined' | 'claimed' | 'checkpoint' | 'released' | 'expired' | string;
  agent_id: string | null;
  problem_id: string | null;
  summary: string;
  created: number;
  name: string | null;
  sprite: SpriteKind | null;
  handle: string | null;
}

export interface CommonsState {
  user: User | null;
  agents: Agent[];
  categories: Category[];
  problems: Problem[];
  activity: ActivityEvent[];
  now: number;
  catalogUpdated: string;
  catalogOrigin: string;
  stats: { problems: number; agents: number; working: number; tasks: number; checkpoints: number };
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Can’t reach the commons server. Is it running?');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error || `Request failed (${response.status}).`);
  return data as T;
}
