import {
  META, COUNTRIES, STUBS, getCountry, fullCountryIds, globalFeed,
  filterSignals, opportunityNote, metricLabel,
} from './data.js';
import { parseHash, buildHash, normalizeTab, TABS } from './nav.js';

const state = {
  country: null,
  tab: 'signals',
  sector: null,
  region: null,
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function formatDateStamp(d = new Date()) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · sketch ledger`;
}

function applyHash() {
  const h = parseHash(location.hash);
  state.country = h.country;
  state.tab = normalizeTab(h.tab);
  state.sector = h.sector;
  state.region = h.region;
  render();
}

function navigate(patch) {
  Object.assign(state, patch);
  if (patch.country !== undefined && !patch.tab) state.tab = 'signals';
  if (patch.sector) { state.tab = 'industries'; state.region = null; }
  if (patch.region) { state.tab = 'regions'; state.sector = null; }
  const hash = buildHash(state);
  const next = hash ? `#${hash}` : '';
  if (location.hash.replace(/^#/, '') !== hash) {
    if (!hash) history.pushState(null, '', location.pathname + location.search);
    else location.hash = hash;
  }
  render();
}

/* ---------- Map ---------- */
async function loadMap() {
  const host = $('#world-map-host');
  try {
    const res = await fetch('./world.svg');
    const text = await res.text();
    host.innerHTML = text;
    const svg = host.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'World atlas sketch — click a country');
      const seed = new Set(fullCountryIds());
      const stubs = new Set(Object.keys(STUBS));
      $$('path[id]', svg).forEach((p) => {
        const id = p.id.toLowerCase();
        if (seed.has(id)) p.classList.add('seed');
        else if (stubs.has(id)) p.classList.add('stub-known');
        p.addEventListener('click', (e) => {
          e.preventDefault();
          navigate({ country: id, sector: null, region: null, tab: 'signals' });
        });
        const name = getCountry(id)?.name || id.toUpperCase();
        p.setAttribute('aria-label', name);
      });
    }
  } catch (err) {
    host.innerHTML = `<p style="color:#9a9386;padding:2rem;text-align:center">Map failed to load. Use country chips below.</p>`;
    console.warn(err);
  }
  paintMapSelection();
}

function paintMapSelection() {
  const svg = $('#world-map-host svg');
  if (!svg) return;
  $$('path.selected', svg).forEach((p) => p.classList.remove('selected'));
  if (state.country) {
    const p = svg.querySelector(`#${CSS.escape(state.country)}`);
    if (p) p.classList.add('selected');
  }
}

/* ---------- Panel ---------- */
function renderPanel() {
  const root = $('#country-panel');
  const c = getCountry(state.country);
  if (!c) {
    root.innerHTML = `
      <div class="panel-empty">
        <h2>Select a country</h2>
        <p>Click the atlas, or a seed nation below. Fully fleshed SAMPLE desks: United States, India, UAE, Japan, Nigeria, Chile. Other highlighted states open as lighter stubs.</p>
        <p>Weight is on civilization development — infrastructure, energy, compute, manufacturing, demographics, institutions, logistics, resource commons.</p>
        <div class="seed-list" id="seed-chips"></div>
      </div>`;
    const box = $('#seed-chips');
    for (const id of fullCountryIds()) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.textContent = COUNTRIES[id].name;
      btn.addEventListener('click', () => navigate({ country: id, sector: null, region: null, tab: 'signals' }));
      box.appendChild(btn);
    }
    return;
  }

  const m = c.metrics;
  const tier = c.tier === 'full' ? 'SAMPLE · full desk' : 'SAMPLE · stub';
  let body = '';
  if (c.tier === 'stub') {
    body = `
      <div class="stub-note">
        <strong>${c.name}</strong> is a lighter stub in Version 0. Metrics are illustrative SAMPLE scores.
        Drill into a fully seeded nation for signals, industries, regions, and openings.
      </div>
      <div class="tab-body">
        <p class="section-note">${c.snapshot}</p>
        <div class="seed-list" id="seed-chips"></div>
      </div>`;
  } else {
    body = `
      <div class="tabs" role="tablist">
        ${TABS.map((t) => `<button type="button" class="tab ${state.tab === t ? 'active' : ''}" data-tab="${t}" role="tab">${t}</button>`).join('')}
      </div>
      <div class="tab-body">${renderTab(c)}</div>`;
  }

  root.innerHTML = `
    <div class="country-head">
      <h2>${c.name} <span class="tier-tag">${tier}</span></h2>
      <p class="snapshot">${c.snapshot}</p>
      <div class="metrics">
        <div class="metric"><div class="label">Stability</div><div class="value">${m.stability}</div><div class="hint">${metricLabel(m.stability)}</div></div>
        <div class="metric"><div class="label">Frontier pressure</div><div class="value">${m.frontierPressure}</div><div class="hint">${metricLabel(m.frontierPressure)}</div></div>
        <div class="metric"><div class="label">Opportunity</div><div class="value">${m.opportunity}</div><div class="hint">${metricLabel(m.opportunity)}</div></div>
      </div>
    </div>
    ${body}`;

  $$('.tab', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ tab: btn.dataset.tab, sector: null, region: null }));
  });
  if (c.tier === 'stub') {
    const box = $('#seed-chips');
    for (const id of fullCountryIds()) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.textContent = COUNTRIES[id].name;
      btn.addEventListener('click', () => navigate({ country: id, sector: null, region: null, tab: 'signals' }));
      box.appendChild(btn);
    }
  }
  wireTabInteractions(c, root);
}

function renderTab(c) {
  const tab = state.tab;
  if (tab === 'signals') {
    const list = filterSignals(c, { sector: state.sector, region: state.region });
    const filterNote = state.sector || state.region
      ? `<div class="filter-bar"><span class="section-note" style="margin:0">Filtered · ${state.sector || state.region}</span><button type="button" class="clear" data-clear>Clear filter</button></div>`
      : `<p class="section-note">Civilization-weighted headlines (SAMPLE). Higher weight ≈ more impact on long-horizon development capacity.</p>`;
    return filterNote + `<div class="signal-list">${list.map(signalCard).join('') || '<p class="section-note">No signals for this filter.</p>'}</div>`;
  }
  if (tab === 'industries') {
    const cards = (c.industries || []).map((ind) => `
      <button type="button" class="industry-card ${state.sector === ind.id ? 'active' : ''}" data-sector="${ind.id}">
        <h3>${ind.name}</h3>
        <p>${ind.note}</p>
      </button>`).join('');
    let detail = '';
    if (state.sector) {
      const note = opportunityNote(c, state.sector);
      const sigs = filterSignals(c, { sector: state.sector });
      detail = `
        <div class="filter-bar" style="margin-top:1rem"><span class="section-note" style="margin:0">Industry drill · ${state.sector}</span><button type="button" class="clear" data-clear>Clear</button></div>
        ${note ? `<div class="opening-card" style="margin-bottom:0.75rem"><div class="gap-label">Opportunity note</div><h3>${note.title}</h3><p>${note.gap}</p><div class="horizon">${note.horizon}</div></div>` : ''}
        <div class="signal-list">${sigs.map(signalCard).join('') || '<p class="section-note">No sector signals in SAMPLE set.</p>'}</div>`;
    }
    return `<p class="section-note">Sectors as skilltree nodes. Click to filter SAMPLE signals and surface an opening note.</p><div class="grid-cards">${cards}</div>${detail}`;
  }
  if (tab === 'regions') {
    const cards = (c.regions || []).map((r) => `
      <button type="button" class="region-card ${state.region === r.id ? 'active' : ''}" data-region="${r.id}">
        <h3>${r.name}</h3>
        <p>${r.note}</p>
      </button>`).join('');
    let detail = '';
    if (state.region) {
      const sigs = filterSignals(c, { region: state.region });
      detail = `
        <div class="filter-bar" style="margin-top:1rem"><span class="section-note" style="margin:0">Region drill · ${state.region}</span><button type="button" class="clear" data-clear>Clear</button></div>
        <div class="signal-list">${sigs.map(signalCard).join('') || '<p class="section-note">No regional signals in SAMPLE set.</p>'}</div>`;
    }
    return `<p class="section-note">Subregions for geographic drill-down (SAMPLE).</p><div class="grid-cards">${cards}</div>${detail}`;
  }
  if (tab === 'openings') {
    const cards = (c.openings || []).map((o) => `
      <div class="opening-card">
        <div class="gap-label">Weak spot / opening</div>
        <h3>${o.title}</h3>
        <p>${o.gap}</p>
        <div class="horizon">Horizon · ${o.horizon}</div>
        <div class="signal-meta">${o.sectors.map((s) => `<span class="tag">${s}</span>`).join('')}</div>
      </div>`).join('');
    return `<p class="section-note">Long-horizon openings — framed as civilization skilltree gaps, not day-trade tips. SAMPLE.</p><div class="opening-list">${cards}</div>`;
  }
  return '';
}

function signalCard(s) {
  return `
    <article class="signal-card">
      <div class="top"><h3>${s.title}</h3><span class="weight">w${s.weight}</span></div>
      <p>${s.blurb}</p>
      <div class="signal-meta">
        <span class="tag">${s.date}</span>
        ${s.sector ? `<span class="tag">${s.sector}</span>` : ''}
        ${s.region ? `<span class="tag">${s.region}</span>` : ''}
      </div>
    </article>`;
}

function wireTabInteractions(c, root) {
  const clear = $('[data-clear]', root);
  if (clear) clear.addEventListener('click', () => navigate({ sector: null, region: null }));
  $$('[data-sector]', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ sector: btn.dataset.sector, region: null, tab: 'industries' }));
  });
  $$('[data-region]', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ region: btn.dataset.region, sector: null, tab: 'regions' }));
  });
}

/* ---------- Feed ---------- */
function renderFeed() {
  const feed = $('#feed');
  const filterId = state.country && COUNTRIES[state.country] ? state.country : null;
  let items = globalFeed(30);
  if (filterId) items = items.filter((i) => i.countryId === filterId);
  const sub = $('#rail-sub');
  if (sub) {
    sub.textContent = filterId
      ? `Filtered to ${COUNTRIES[filterId].name} · SAMPLE`
      : 'Global civilization-weighted drops · SAMPLE';
  }
  feed.innerHTML = items.map((i) => `
    <article class="feed-item" data-c="${i.countryId}">
      <div class="country">${i.countryName}</div>
      <div class="title">${i.title}</div>
      <div class="meta"><span>${i.date}</span><span>w${i.weight}</span></div>
    </article>`).join('') || '<p class="section-note" style="padding:0.5rem">No feed items.</p>';
  $$('.feed-item', feed).forEach((el) => {
    el.addEventListener('click', () => navigate({ country: el.dataset.c, tab: 'signals', sector: null, region: null }));
  });
}

function render() {
  paintMapSelection();
  renderPanel();
  renderFeed();
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const params = new URLSearchParams(location.search);
  if (params.has('fresh') && 'caches' in window) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
      const u = new URL(location.href);
      u.searchParams.delete('fresh');
      location.replace(u.toString());
    });
    return;
  }
  navigator.serviceWorker.register('./sw.js').catch(() => {});
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
}

function boot() {
  $('#date-stamp').textContent = formatDateStamp();
  $('#about-text').textContent = META.sketchNote;
  $('#domain-note').textContent = `${META.domainIntent} — reserved intent (not purchased by this sketch).`;
  loadMap().then(() => applyHash());
  window.addEventListener('hashchange', applyHash);
  registerSW();
}

boot();
