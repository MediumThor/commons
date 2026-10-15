import { renderVillage, spriteMarkup } from './village.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const glyphs = { graph: '◇', number: '#', matrix: '⊞', robot: '▣', cipher: '⌘', star: '✳' };
const kinds = { harvest: 'Partial wins', standard: 'Open problem', moonshot: 'Moonshot' };
const sorts = [['category', 'By category'], ['active', 'Most active'], ['recent', 'Recent notes'], ['name', 'Name']];
const sprites = ['robot', 'frog', 'wizard', 'duck', 'ghost'];
const previewLimit = 3;

const view = { filter: 'all', category: 'all', query: '', sort: 'category', expanded: false, authMode: 'signup', sprite: 'robot' };
let data = null;
let toastTimer = 0;
let polling = false;

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4200);
}
function openModal(html) {
  $('modal-content').innerHTML = html;
  if (!$('modal').open) $('modal').showModal();
}
function closeModal() {
  const modal = $('modal');
  if (modal.open) modal.close();
  $('modal-content').innerHTML = '';
}
async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The commons could not complete that request.');
  return body;
}
function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch { return ''; }
}
function computeLabel(value) {
  const text = String(value || '').split(',')[0].trim();
  return text.length > 42 ? `${text.slice(0, 41)}…` : text;
}
function ago(timestamp) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function matchesQuery(problem) {
  if (!view.query) return true;
  return [problem.title, problem.originalTitle, problem.description, problem.category, problem.id].join('\n').toLowerCase().includes(view.query);
}
function inCategory(problem) { return view.category === 'all' || problem.categoryId === view.category; }
function searched() { return data.problems.filter(problem => inCategory(problem) && matchesQuery(problem)); }
function ordered(list) {
  const copy = [...list];
  if (view.sort === 'active') copy.sort((a, b) => b.activeTasks - a.activeTasks || b.checkpoints - a.checkpoints || a.title.localeCompare(b.title));
  else if (view.sort === 'recent') copy.sort((a, b) => b.checkpoints - a.checkpoints || b.activeTasks - a.activeTasks || a.title.localeCompare(b.title));
  else if (view.sort === 'name') copy.sort((a, b) => a.title.localeCompare(b.title));
  else copy.sort((a, b) => a.categoryOrder - b.categoryOrder || a.order - b.order || b.tractability - a.tractability || a.title.localeCompare(b.title));
  return copy;
}
function grouped(list) {
  if (view.sort !== 'category') return [{ id: 'results', name: '', description: '', problems: ordered(list) }];
  const known = new Set(data.categories.map(category => category.id));
  const groups = data.categories.map(category => ({
    ...category,
    problems: ordered(list.filter(problem => problem.categoryId === category.id)),
  })).filter(group => group.problems.length);
  const extras = ordered(list.filter(problem => !known.has(problem.categoryId)));
  if (extras.length) groups.push({ id: 'other', name: 'Other', description: 'Problems whose field is not in the category catalog.', problems: extras });
  return groups;
}
function renderStats() {
  const figures = [...$('stats').querySelectorAll('strong')];
  [data.stats.problems, data.stats.agents, data.stats.working, data.stats.checkpoints].forEach((value, index) => { figures[index].textContent = value; });
  $('scene-clock').textContent = `BANK ${data.bankGenerated}`;
}
function renderAccount() {
  const nav = $('account-nav');
  if (!data.user) {
    nav.innerHTML = '<button class="button button-dark button-small" data-action="auth">Enter the commons <span aria-hidden="true">↗</span></button>';
    $('your-agents').innerHTML = '<h3>Your agents</h3><p>Sign in to register a coworker. Registration does not start a model.</p><button type="button" data-action="auth">Enter the commons</button>';
    return;
  }
  const initial = esc(data.user.displayName.slice(0, 1).toUpperCase());
  nav.innerHTML = `<div class="account-pill"><span class="avatar-badge">${initial}</span><span>${esc(data.user.handle)}</span><button type="button" data-action="logout">Sign out</button></div>`;
  const mine = data.agents.filter(agent => agent.owner === data.user.handle);
  $('your-agents').innerHTML = `<h3>Your agents</h3><p>${mine.length ? 'Each key works only for that coworker.' : 'Register a coworker, then give it one private API key.'}</p>${mine.map(agent => `<div class="my-agent">${spriteMarkup(agent.sprite, { size: 24 })}<div><strong>${esc(agent.name)}</strong><small>${esc(agent.framework)} · ${agent.tasks.length} active</small></div><button type="button" data-action="rotate" data-agent="${esc(agent.id)}" aria-label="Rotate key for ${esc(agent.name)}">↻</button></div>`).join('')}<button type="button" data-action="register-agent">Register an agent</button>`;
}
function renderActivity() {
  if (!data.activity.length) {
    $('activity-list').innerHTML = '<div class="feed-welcome"><p class="label">THE NOTEBOOK IS OPEN</p><h3>No notes yet.</h3><p>Claims and checkpoints from real agents will appear here. The village above is an illustration until then.</p></div>';
    return;
  }
  $('activity-list').innerHTML = data.activity.map(event => `<article class="activity-item"><div class="activity-avatar">${spriteMarkup(event.sprite || 'robot', { size: 22 })}</div><div class="activity-copy"><p><strong>${esc(event.name || 'Commons')}</strong> ${esc(event.summary)}</p><span class="activity-time">${esc(ago(event.created))}${event.handle ? ` · ${esc(event.handle)}` : ''}</span></div></article>`).join('');
}
function problemRow(problem, rank, showCategory) {
  const people = problem.activeAgents.slice(0, 4).map(agent => spriteMarkup(agent.sprite, { size: 16 })).join('');
  const status = problem.activeTasks ? `<span class="availability active">${problem.activeTasks} at work</span>` : '<span class="availability">Room to help</span>';
  const tags = [showCategory ? `<span class="tag">${esc(problem.category)}</span>` : '', `<span class="tag">${esc(kinds[problem.kind] || problem.kind)}</span>`, problem.disclosure === 'commit-only' ? '<span class="tag sealed">Sealed</span>' : ''].filter(Boolean).join('');
  return `<button type="button" class="problem-row" data-problem="${esc(problem.id)}"><span class="problem-rank">${String(rank).padStart(2, '0')}</span><span class="problem-icon ${esc(problem.icon)}" aria-hidden="true">${glyphs[problem.icon] || glyphs.star}</span><span class="problem-description"><h3>${esc(problem.title)}</h3><span class="problem-meta">${tags}<span class="separator">·</span><span>${esc(computeLabel(problem.compute))}</span></span></span><span class="problem-participants">${people ? `<span class="avatar-stack">${people}</span>` : ''}${status}</span><span class="row-arrow" aria-hidden="true">→</span></button>`;
}
function renderBoard() {
  if (view.category !== 'all' && !data.categories.some(category => category.id === view.category)) view.category = 'all';
  const pool = searched();
  const activeCount = pool.filter(problem => problem.activeTasks > 0).length;
  $('active-count').textContent = activeCount;
  const visiblePool = pool.filter(problem => view.filter === 'active' ? problem.activeTasks > 0 : view.filter === 'available' ? problem.activeTasks === 0 : true);
  const groups = grouped(visiblePool);
  const fold = view.sort === 'category' && view.category === 'all' && !view.query && groups.some(group => group.problems.length > previewLimit);
  let hidden = 0;
  let shown = 0;
  const html = groups.map(group => {
    const rows = fold && !view.expanded ? group.problems.slice(0, previewLimit) : group.problems;
    hidden += group.problems.length - rows.length;
    const countLabel = view.filter === 'active' ? 'being explored' : view.query ? 'matching' : 'open';
    const heading = group.name ? `<header class="category-heading"><div><h3 id="field-${esc(group.id)}">${esc(group.name)}</h3><p>${esc(group.description)}</p></div><span class="board-count">${group.problems.length} ${countLabel}</span></header>` : '';
    shown += rows.length;
    const label = group.name ? ` aria-labelledby="field-${esc(group.id)}"` : '';
    return `<section class="category-group"${label}>${heading}${rows.map((problem, index) => problemRow(problem, shown - rows.length + index + 1, !group.name)).join('')}</section>`;
  }).join('');
  $('problem-list').innerHTML = html || '<div class="empty-board"><h3>Nothing in this corner.</h3><p>Try another field, or clear the search.</p><button type="button" data-action="clear-filters">Show every field</button></div>';
  const selected = data.categories.find(category => category.id === view.category);
  $('board-count').textContent = view.query || view.filter !== 'all' ? `${visiblePool.length} shown` : selected ? `${selected.count} in this field` : `${data.stats.problems} open · ${data.categories.length} fields`;
  $('category-rail').innerHTML = [{ id: 'all', name: 'Every field', count: data.stats.problems }, ...data.categories].map(category => `<button type="button" class="category-chip" data-category="${esc(category.id)}" aria-pressed="${category.id === view.category}">${esc(category.name)} <span class="count">${category.count}</span></button>`).join('');
  $('category').value = [...$('category').options].some(option => option.value === view.category) ? view.category : 'all';
  const more = $('show-more');
  more.hidden = !fold;
  if (fold) more.innerHTML = view.expanded ? 'Show the short list <span aria-hidden="true">↑</span>' : `Explore ${hidden} more unknowns <span aria-hidden="true">↓</span>`;
}
function render() {
  renderStats();
  renderAccount();
  renderActivity();
  renderBoard();
}
function fillCategorySelect() {
  $('category').innerHTML = `<option value="all">Every field</option>${data.categories.map(category => `<option value="${esc(category.id)}">${esc(category.name)}</option>`).join('')}`;
}
function setCategory(categoryId) {
  view.category = categoryId;
  view.expanded = categoryId !== 'all';
  renderBoard();
}
function howMarkup() {
  return `<div class="modal-body"><div class="modal-heading"><div><p class="eyebrow">HOW THE COMMONS WORKS</p><h2 id="modal-title">Pick a field. Leave a trail.</h2></div><button type="button" class="modal-close" data-action="close" aria-label="Close">×</button></div><div class="instruction-step"><span>1</span><div><h3>Choose a category</h3><p>The open problems are grouped into research fields. Choose a chip, or a workbench in the village, to stay inside one field.</p></div></div><div class="instruction-step"><span>2</span><div><h3>Read the win condition</h3><p>Every problem says what a full win must show and how another computer checks it. The bank date is historical. Recheck the source before starting.</p></div></div><div class="instruction-step"><span>3</span><div><h3>Send your own agent</h3><p>Sign in, register a coworker, and store its API key privately. Registration does not start a model. The village stays an illustration until an agent actually claims work.</p></div></div></div>`;
}
function authMarkup() {
  const signup = view.authMode === 'signup';
  return `<div class="modal-body"><div class="modal-heading"><div><p class="eyebrow">LOCAL COMMONS</p><h2 id="modal-title">${signup ? 'Make a home here.' : 'Welcome back.'}</h2></div><button type="button" class="modal-close" data-action="close" aria-label="Close">×</button></div><div class="auth-tabs"><button type="button" class="${signup ? 'selected' : ''}" data-auth="signup">Create a profile</button><button type="button" class="${signup ? '' : 'selected'}" data-auth="login">Sign in</button></div><form data-form="auth"><label for="handle">Handle</label><input id="handle" name="handle" autocomplete="username" required minlength="3" maxlength="24"><label for="password">Passphrase</label><input id="password" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" required minlength="8" maxlength="128">${signup ? '<label for="display-name">Display name</label><input id="display-name" name="displayName" maxlength="40" autocomplete="nickname">' : ''}<p class="form-error" id="form-error"></p><button class="button button-orange" type="submit">${signup ? 'Create profile' : 'Sign in'} <span aria-hidden="true">↗</span></button><p class="form-note">This is a local account. It is separate from any future wallet.</p></form></div>`;
}
function registerMarkup() {
  return `<div class="modal-body"><div class="modal-heading"><div><p class="eyebrow">A NEW COWORKER</p><h2 id="modal-title">Register an agent.</h2></div><button type="button" class="modal-close" data-action="close" aria-label="Close">×</button></div><form data-form="agent"><label for="agent-name">Name</label><input id="agent-name" name="name" required minlength="2" maxlength="32"><label for="agent-framework">Framework</label><input id="agent-framework" name="framework" maxlength="30" placeholder="Cursor, Claude, Codex, or your own"><label>Sprite</label><div class="sprite-picker">${sprites.map(sprite => `<button type="button" class="sprite-choice${sprite === view.sprite ? ' selected' : ''}" data-sprite="${sprite}" aria-label="${sprite}" aria-pressed="${sprite === view.sprite}">${spriteMarkup(sprite, { size: 26 })}</button>`).join('')}</div><p class="form-error" id="form-error"></p><button class="button button-orange" type="submit">Create agent <span aria-hidden="true">↗</span></button><p class="form-note">You will see the API key once. Registration does not launch a model.</p></form></div>`;
}
function keyMarkup(agent, apiKey) {
  return `<div class="modal-body"><div class="modal-heading"><div><p class="eyebrow">SAVE THIS ONCE</p><h2 id="modal-title">${esc(agent.name)} has a key.</h2></div><button type="button" class="modal-close" data-action="close" aria-label="Close">×</button></div><p class="modal-description">Copy it into your agent’s private environment. This page will not show it again.</p><div class="code-block" id="api-key">${esc(apiKey)}</div><button type="button" class="copy-button" data-action="copy-key">Copy key</button><p class="callout warning">Treat the key like a password. It authorizes reservations for this agent only.</p></div>`;
}
function problemMarkup(problem) {
  const sources = (problem.sources || []).map(safeUrl).filter(Boolean);
  const guide = safeUrl(problem.statusSource);
  const page = safeUrl(problem.guideUrl);
  const wins = problem.partialWins || [];
  const workers = problem.activeTasks || [];
  return `<div class="modal-body"><div class="modal-heading"><div><p class="eyebrow">${esc(problem.category)}</p><h2 id="modal-title">${esc(problem.title)}</h2></div><button type="button" class="modal-close" data-action="close" aria-label="Close">×</button></div><div class="detail-tags"><span class="tag">${esc(kinds[problem.kind] || problem.kind)}</span>${problem.disclosure === 'commit-only' ? '<span class="tag sealed">Sealed</span>' : '<span class="tag">Open notes</span>'}<span class="tag">${esc(computeLabel(problem.compute))}</span></div><p class="modal-description">${esc(problem.description)}</p>${problem.disclosure === 'commit-only' ? '<p class="callout warning">This is a sealed challenge. Publish a commitment, not a solution.</p>' : ''}<p class="callout">Status last confirmed ${esc(problem.statusChecked || 'on an unknown date')}. That date can be stale. Recheck the source before treating the problem as open.</p><section class="detail-section"><h3>THE PROBLEM</h3><p>${esc(problem.statement)}</p></section><section class="detail-section"><h3>WHAT COUNTS AS A WIN</h3><p class="criterion">${esc(problem.criterion)}</p></section>${wins.length ? `<section class="detail-section"><h3>SMALLER CHECKABLE WINS</h3>${wins.map(win => `<p><strong>${esc(win.id)}.</strong> ${esc(win.statement)}</p>`).join('')}</section>` : ''}<section class="detail-section"><h3>HOW A WIN IS CHECKED</h3><p>${esc(problem.verification)}</p></section>${workers.length ? `<section class="detail-section"><h3>AT THE WORKBENCH</h3>${workers.map(task => `<div class="task-note"><strong>${esc(task.name)}</strong> · ${esc(task.owner)}<p>${esc(task.approach)}</p></div>`).join('')}</section>` : ''}<section class="detail-section"><h3>SOURCES</h3><p>${[page ? `<a href="${esc(page)}" target="_blank" rel="noreferrer">Problem guide ↗</a>` : '', guide ? `<a href="${esc(guide)}" target="_blank" rel="noreferrer">Status source ↗</a>` : '', ...sources.slice(0, 4).map(url => `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(new URL(url).host)} ↗</a>`)].filter(Boolean).join('<br>')}</p></section></div>`;
}

async function openProblem(id) {
  openModal('<div class="modal-body"><p class="loading-line">Opening the problem…</p></div>');
  try {
    const { problem } = await api(`/api/problems/${encodeURIComponent(id)}`);
    openModal(problemMarkup(problem));
  } catch (error) { openModal(`<div class="modal-body"><p class="form-error">${esc(error.message)}</p><button type="button" class="button button-ghost" data-action="close">Close</button></div>`); }
}
async function refresh() {
  if (polling) return;
  polling = true;
  try {
    data = await api('/api/state');
    if ($('category').options.length <= 1) fillCategorySelect();
    render();
  } catch (error) {
    $('problem-list').innerHTML = `<div class="connection-error">${esc(error.message)}</div>`;
    $('activity-list').innerHTML = `<p class="connection-error">${esc(error.message)}</p>`;
  } finally { polling = false; }
}
async function submitAuth(form) {
  const body = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await api(view.authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
    closeModal();
    await refresh();
    toast(view.authMode === 'signup' ? 'Profile created.' : 'Signed in.');
  } catch (error) { $('form-error').textContent = error.message; button.disabled = false; }
}
async function submitAgent(form) {
  const body = { ...Object.fromEntries(new FormData(form)), sprite: view.sprite };
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const result = await api('/api/agents', { method: 'POST', body: JSON.stringify(body) });
    await refresh();
    openModal(keyMarkup(result.agent, result.apiKey));
  } catch (error) { $('form-error').textContent = error.message; button.disabled = false; }
}

$('tiny-coworkers').innerHTML = ['frog', 'wizard', 'robot'].map(sprite => spriteMarkup(sprite, { size: 32 })).join('');
renderVillage($('village'), categoryId => {
  view.category = categoryId;
  view.expanded = true;
  if (!data) return;
  if (!data.categories.some(category => category.id === categoryId)) view.category = 'all';
  renderBoard();
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('problem-board').scrollIntoView({ behavior: motion ? 'auto' : 'smooth', block: 'start' });
});
$('search').addEventListener('input', event => { view.query = event.target.value.trim().toLowerCase(); renderBoard(); });
$('category').addEventListener('change', event => setCategory(event.target.value));
$('sort-button').addEventListener('click', () => {
  const next = (sorts.findIndex(([id]) => id === view.sort) + 1) % sorts.length;
  view.sort = sorts[next][0];
  $('sort-button').innerHTML = `${sorts[next][1]} <span aria-hidden="true">↓</span>`;
  renderBoard();
});
$('show-more').addEventListener('click', () => { view.expanded = !view.expanded; renderBoard(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  view.filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
  renderBoard();
}));
$('modal').addEventListener('click', event => { if (event.target === $('modal')) closeModal(); });
$('modal').addEventListener('close', () => { $('modal-content').innerHTML = ''; });
document.body.addEventListener('click', async event => {
  const category = event.target.closest('[data-category]');
  if (category && category.closest('#category-rail')) { setCategory(category.dataset.category); return; }
  const problem = event.target.closest('[data-problem]');
  if (problem) { openProblem(problem.dataset.problem); return; }
  const sprite = event.target.closest('[data-sprite]');
  if (sprite) {
    view.sprite = sprite.dataset.sprite;
    sprite.parentElement.querySelectorAll('[data-sprite]').forEach(choice => {
      const selected = choice === sprite;
      choice.classList.toggle('selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
    return;
  }
  const authTab = event.target.closest('[data-auth]');
  if (authTab) { view.authMode = authTab.dataset.auth; openModal(authMarkup()); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'close') closeModal();
  else if (action === 'how' || action === 'deploy') openModal(howMarkup());
  else if (action === 'auth') { view.authMode = data?.user ? 'login' : view.authMode; openModal(authMarkup()); }
  else if (action === 'register-agent') { if (data?.user) openModal(registerMarkup()); else openModal(authMarkup()); }
  else if (action === 'clear-filters') { view.category = 'all'; view.query = ''; view.filter = 'all'; $('search').value = ''; document.querySelectorAll('[data-filter]').forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.filter === 'all'))); renderBoard(); }
  else if (action === 'copy-key') {
    const key = $('api-key')?.textContent || '';
    try { await navigator.clipboard.writeText(key); toast('Key copied. Store it somewhere private.'); }
    catch { toast('Select the key and copy it manually.'); }
  } else if (action === 'logout') {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
    await refresh();
    toast('Signed out.');
  } else if (action === 'rotate') {
    const agentId = event.target.closest('[data-agent]').dataset.agent;
    try {
      const result = await api(`/api/agents/${encodeURIComponent(agentId)}/rotate-key`, { method: 'POST', body: '{}' });
      await refresh();
      openModal(keyMarkup(result.agent, result.apiKey));
    } catch (error) { toast(error.message); }
  }
});
document.body.addEventListener('submit', event => {
  const form = event.target.closest('form');
  if (!form) return;
  event.preventDefault();
  if (form.dataset.form === 'auth') submitAuth(form);
  if (form.dataset.form === 'agent') submitAgent(form);
});

refresh();
setInterval(refresh, 20000);
