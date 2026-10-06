import {
  META, COUNTRIES, STUBS, getCountry, fullCountryIds, globalFeed,
  filterSignals, opportunityNote, metricLabel,
} from './data.js';
import { parseHash, buildHash, normalizeTab, normalizeView, TABS } from './nav.js';
import {
  clampZoom, resetTransform, zoomAt, panBy,
  wheelToScale, stepZoom, exceededDragThreshold,
  pinchDistance, pinchCenter, ZOOM_MIN, ZOOM_MAX,
} from './zoom.js';
import {
  industriesForMindMap, mindMapLayout, getValueChain, getCompany, chainStages,
} from './chains.js';

const state = {
  country: null,
  tab: 'signals',
  sector: null,
  region: null,
  view: 'desk',
  company: null,
};

const mapXform = resetTransform();

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
  state.view = normalizeView(h.view);
  state.company = h.company;
  render();
}

function navigate(patch) {
  Object.assign(state, patch);
  if (patch.country !== undefined && patch.view === undefined && !patch.tab) {
    state.tab = 'signals';
  }
  if (patch.view === undefined && patch.sector && state.view === 'desk') {
    state.tab = 'industries';
    state.region = null;
  }
  if (patch.view === undefined && patch.region && state.view === 'desk') {
    state.tab = 'regions';
    state.sector = null;
  }
  if (patch.view === 'desk') {
    state.company = null;
  }
  if (patch.view === 'mindmap') {
    state.company = null;
  }
  if (patch.view === 'chain') {
    state.company = null;
  }
  const hash = buildHash(state);
  const cur = location.hash.replace(/^#/, '');
  if (cur !== hash) {
    if (!hash) history.pushState(null, '', location.pathname + location.search);
    else location.hash = hash;
  }
  render();
}

/* ---------- Map zoom / pan ---------- */
function applyMapTransform() {
  const viewport = $('#map-viewport');
  const host = $('#world-map-host');
  if (!viewport || !host) return;
  // Enlarge viewport in pixels so the SVG reflows as true vectors.
  // Translate only — never CSS scale() / will-change (those rasterize at 1×).
  const { scale, tx, ty } = mapXform;
  const rect = host.getBoundingClientRect();
  const w = Math.max(1, rect.width) * scale;
  const h = Math.max(1, rect.height) * scale;
  viewport.style.width = `${w}px`;
  viewport.style.height = `${h}px`;
  viewport.style.transform = `translate(${tx}px, ${ty}px)`;
  const label = $('#zoom-level');
  if (label) label.textContent = `${scale.toFixed(1)}×`;
  const stage = $('.map-stage');
  if (stage) stage.classList.toggle('is-zoomed', scale > 1.02);
}

function setZoom(nextScale, focalX, focalY) {
  const host = $('#world-map-host');
  if (!host) return;
  const rect = host.getBoundingClientRect();
  const fx = focalX == null ? rect.width / 2 : focalX;
  const fy = focalY == null ? rect.height / 2 : focalY;
  Object.assign(mapXform, zoomAt(mapXform, nextScale, fx, fy));
  if (mapXform.scale <= ZOOM_MIN + 0.001) {
    Object.assign(mapXform, resetTransform());
  }
  applyMapTransform();
}

function wireZoomControls() {
  const host = $('#world-map-host');
  const stage = $('.map-stage');
  if (!host || !stage) return;

  $('#zoom-in')?.addEventListener('click', () => {
    setZoom(stepZoom(mapXform.scale, +1));
  });
  $('#zoom-out')?.addEventListener('click', () => {
    setZoom(stepZoom(mapXform.scale, -1));
  });
  $('#zoom-reset')?.addEventListener('click', () => {
    Object.assign(mapXform, resetTransform());
    applyMapTransform();
  });

  host.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = host.getBoundingClientRect();
    const next = wheelToScale(mapXform.scale, e.deltaY);
    setZoom(next, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });

  let pointers = new Map();
  let dragMoved = false;
  let panOrigin = null;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let clickTimer = null;
  let lastTap = { id: null, t: 0 };
  let longPressTimer = null;
  let longPressFired = false;
  let pendingCountry = null;

  function clearLongPress() {
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  function countryFromEvent(e) {
    const t = e.target;
    if (t && t.tagName === 'path' && t.id) return t.id.toLowerCase();
    return null;
  }

  function openDesk(id) {
    navigate({ country: id, view: 'desk', sector: null, region: null, company: null, tab: 'signals' });
  }

  function openMindMap(id) {
    navigate({ country: id, view: 'mindmap', sector: null, region: null, company: null });
  }

  host.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    host.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, e);
    dragMoved = false;
    longPressFired = false;
    pendingCountry = countryFromEvent(e);

    if (pointers.size === 1) {
      panOrigin = { x: e.clientX, y: e.clientY, tx: mapXform.tx, ty: mapXform.ty };
      clearLongPress();
      if (pendingCountry) {
        longPressTimer = setTimeout(() => {
          longPressFired = true;
          openMindMap(pendingCountry);
        }, 550);
      }
    } else if (pointers.size === 2) {
      clearLongPress();
      const [a, b] = [...pointers.values()];
      pinchStartDist = pinchDistance(a, b);
      pinchStartScale = mapXform.scale;
      panOrigin = null;
    }
  });

  host.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e);

    if (pointers.size === 2) {
      clearLongPress();
      const [a, b] = [...pointers.values()];
      const dist = pinchDistance(a, b);
      if (pinchStartDist > 0) {
        const rect = host.getBoundingClientRect();
        const center = pinchCenter(a, b, rect);
        const next = clampZoom(pinchStartScale * (dist / pinchStartDist));
        setZoom(next, center.x, center.y);
        dragMoved = true;
      }
      return;
    }

    if (pointers.size === 1 && panOrigin) {
      const dx = e.clientX - panOrigin.x;
      const dy = e.clientY - panOrigin.y;
      if (exceededDragThreshold(dx, dy)) {
        clearLongPress();
        dragMoved = true;
        if (mapXform.scale > 1.02) {
          Object.assign(mapXform, panBy(
            { scale: mapXform.scale, tx: panOrigin.tx, ty: panOrigin.ty },
            dx, dy
          ));
          applyMapTransform();
          stage.classList.add('is-panning');
        }
      }
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    stage.classList.remove('is-panning');
    if (pointers.size === 0) {
      clearLongPress();
      const id = pendingCountry;
      const moved = dragMoved || longPressFired;
      const wasLong = longPressFired;
      pendingCountry = null;
      panOrigin = null;
      if (!moved && id && !wasLong) {
        const now = Date.now();
        if (lastTap.id === id && now - lastTap.t < 350) {
          if (clickTimer) clearTimeout(clickTimer);
          clickTimer = null;
          lastTap = { id: null, t: 0 };
          openMindMap(id);
        } else {
          lastTap = { id, t: now };
          if (clickTimer) clearTimeout(clickTimer);
          clickTimer = setTimeout(() => {
            clickTimer = null;
            openDesk(id);
          }, 280);
        }
      }
    } else if (pointers.size === 1) {
      const only = [...pointers.values()][0];
      panOrigin = { x: only.clientX, y: only.clientY, tx: mapXform.tx, ty: mapXform.ty };
      pinchStartDist = 0;
    }
  }

  host.addEventListener('pointerup', endPointer);
  host.addEventListener('pointercancel', endPointer);
  host.addEventListener('lostpointercapture', (e) => {
    if (pointers.has(e.pointerId)) endPointer(e);
  });

  // Native dblclick as backup (desktop)
  host.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (clickTimer) clearTimeout(clickTimer);
    const id = countryFromEvent(e);
    if (id) openMindMap(id);
  });

  applyMapTransform();
}

/* ---------- Map load ---------- */
async function loadMap() {
  const host = $('#world-map-host');
  const viewport = document.createElement('div');
  viewport.id = 'map-viewport';
  viewport.className = 'map-viewport';
  host.innerHTML = '';
  host.appendChild(viewport);
  try {
    const res = await fetch('./world.svg');
    const text = await res.text();
    viewport.innerHTML = text;
    const svg = viewport.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('shape-rendering', 'geometricPrecision');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'World atlas sketch — click desk, double-click or long-press mind map');
      const seed = new Set(fullCountryIds());
      const stubs = new Set(Object.keys(STUBS));
      $$('path[id]', svg).forEach((p) => {
        const id = p.id.toLowerCase();
        if (seed.has(id)) p.classList.add('seed');
        else if (stubs.has(id)) p.classList.add('stub-known');
        const name = getCountry(id)?.name || id.toUpperCase();
        p.setAttribute('aria-label', name);
      });
    }
  } catch (err) {
    viewport.innerHTML = `<p style="color:#9a9386;padding:2rem;text-align:center">Map failed to load. Use country chips below.</p>`;
    console.warn(err);
  }
  wireZoomControls();
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

/* ---------- Overlay: mind map / chain / company ---------- */
function renderOverlay() {
  let root = $('#ledger-overlay');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ledger-overlay';
    root.className = 'ledger-overlay';
    root.hidden = true;
    document.body.appendChild(root);
  }

  const view = state.view;
  if (!state.country || view === 'desk') {
    root.hidden = true;
    root.innerHTML = '';
    document.body.classList.remove('overlay-open');
    return;
  }

  document.body.classList.add('overlay-open');
  root.hidden = false;
  const c = getCountry(state.country);
  if (!c) {
    root.innerHTML = `<div class="overlay-panel"><p class="section-note">Unknown country.</p><button type="button" class="btn-brass" data-close-overlay>Close</button></div>`;
    wireOverlay(root);
    return;
  }

  if (view === 'mindmap') root.innerHTML = renderMindMap(c);
  else if (view === 'chain') root.innerHTML = renderChain(c);
  else if (view === 'company') root.innerHTML = renderCompanyDesk(c);
  else root.innerHTML = '';

  wireOverlay(root);
}

function renderMindMap(c) {
  const industries = industriesForMindMap(c.id);
  const nodes = mindMapLayout(industries);
  const W = 900;
  const H = 560;
  const edges = nodes
    .filter((n) => n.kind === 'industry')
    .map((n) => {
      const x1 = 0.5 * W, y1 = 0.5 * H;
      const x2 = n.x * W, y2 = n.y * H;
      return `<line class="mm-edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    })
    .join('');

  const nodeEls = nodes.map((n) => {
    const cx = n.x * W;
    const cy = n.y * H;
    if (n.kind === 'country') {
      return `
        <g class="mm-node mm-country" transform="translate(${cx},${cy})">
          <circle r="54" />
          <text class="mm-label" text-anchor="middle" dy="0.35em">${escapeXml(c.name)}</text>
        </g>`;
    }
    return `
      <g class="mm-node mm-industry" data-sector="${n.id}" transform="translate(${cx},${cy})" role="button" tabindex="0">
        <rect x="-72" y="-28" width="144" height="56" rx="8" />
        <text class="mm-label" text-anchor="middle" dy="-0.15em">${escapeXml(shortLabel(n.name))}</text>
        <text class="mm-sub" text-anchor="middle" dy="1.15em">value chain →</text>
      </g>`;
  }).join('');

  return `
    <div class="overlay-panel mindmap-panel">
      <div class="overlay-head">
        <div>
          <div class="overlay-kicker">Industry mind map · SAMPLE</div>
          <h2>${escapeHtml(c.name)} <span class="tier-tag">${c.tier === 'full' ? 'SAMPLE · full desk' : 'SAMPLE · stub industries'}</span></h2>
          <p class="overlay-hint">Skilltree of primary industries. Click a node for upstream → midstream → downstream players. Single-click on the atlas still opens the country desk; double-click / long-press / this view opens the mind map.</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-ghost" data-to-desk>Country desk</button>
          <button type="button" class="btn-brass" data-close-overlay>Close</button>
        </div>
      </div>
      <div class="mindmap-wrap">
        <svg class="mindmap-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(c.name)} industry mind map">
          ${edges}
          ${nodeEls}
        </svg>
      </div>
    </div>`;
}

function renderChain(c) {
  const sector = state.sector;
  const chain = getValueChain(c.id, sector);
  if (!chain) {
    return `<div class="overlay-panel"><p class="section-note">No chain for this sector.</p><button type="button" class="btn-brass" data-back-mindmap>Back to mind map</button></div>`;
  }
  const stages = chainStages().map((stage) => {
    const players = chain[stage] || [];
    const cards = players.map((p) => `
      <button type="button" class="player-card" data-company="${p.id}">
        <div class="player-name">${escapeHtml(p.name)}</div>
        <div class="player-role">${escapeHtml(p.role)}</div>
        <div class="player-go">Company desk →</div>
      </button>`).join('');
    return `
      <div class="chain-col">
        <div class="chain-stage">${stage}</div>
        <div class="chain-cards">${cards}</div>
      </div>`;
  }).join('');

  return `
    <div class="overlay-panel chain-panel">
      <div class="overlay-head">
        <div>
          <div class="overlay-kicker">Value chain · SAMPLE${chain.stub ? ' · stub' : ''}</div>
          <h2>${escapeHtml(c.name)} · ${escapeHtml(chain.label)}</h2>
          <p class="overlay-hint">Upstream (inputs) → midstream (processing / transmission) → downstream (demand). Click a company for announcements and pipeline. All names are SAMPLE fiction.</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-ghost" data-back-mindmap>Mind map</button>
          <button type="button" class="btn-ghost" data-to-desk>Country desk</button>
          <button type="button" class="btn-brass" data-close-overlay>Close</button>
        </div>
      </div>
      <div class="chain-grid">${stages}</div>
    </div>`;
}

function renderCompanyDesk(c) {
  const co = getCompany(state.company);
  if (!co) {
    return `<div class="overlay-panel"><p class="section-note">Unknown company.</p><button type="button" class="btn-brass" data-back-chain>Back to chain</button></div>`;
  }
  const anns = (co.announcements || []).map((a) => `
    <article class="signal-card">
      <div class="top"><h3>${escapeHtml(a.title)}</h3><span class="weight">SAMPLE</span></div>
      <p>${escapeHtml(a.blurb)}</p>
      <div class="signal-meta"><span class="tag">${escapeHtml(a.date)}</span></div>
    </article>`).join('');
  const pipe = (co.pipeline || []).map((p) => `
    <div class="pipeline-item">
      <div class="pipeline-title">${escapeHtml(p.title)}</div>
      <div class="pipeline-status">${escapeHtml(p.status)}</div>
    </div>`).join('');

  return `
    <div class="overlay-panel company-panel">
      <div class="overlay-head">
        <div>
          <div class="overlay-kicker">Company desk · SAMPLE${co.stub ? ' · stub' : ''}</div>
          <h2>${escapeHtml(co.name)}</h2>
          <p class="snapshot">${escapeHtml(co.role)} · ${escapeHtml(co.stage)} · ${escapeHtml(co.countryName)} · ${escapeHtml(co.sectorLabel)}</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-ghost" data-back-chain>Value chain</button>
          <button type="button" class="btn-ghost" data-back-mindmap>Mind map</button>
          <button type="button" class="btn-brass" data-close-overlay>Close</button>
        </div>
      </div>
      <div class="company-body">
        <section>
          <h3 class="company-section">Recent major announcements</h3>
          <p class="section-note">Invented SAMPLE items for UX — not live filings.</p>
          <div class="signal-list">${anns}</div>
        </section>
        <section>
          <h3 class="company-section">Working on next · pipeline</h3>
          <p class="section-note">SAMPLE forward book — illustrative only.</p>
          <div class="pipeline-list">${pipe}</div>
        </section>
      </div>
    </div>`;
}

function wireOverlay(root) {
  const close = () => navigate({ view: 'desk', company: null });
  $$('[data-close-overlay]', root).forEach((b) => b.addEventListener('click', close));
  $$('[data-to-desk]', root).forEach((b) => b.addEventListener('click', () => {
    navigate({ view: 'desk', company: null, tab: 'signals', sector: null, region: null });
  }));
  $$('[data-back-mindmap]', root).forEach((b) => b.addEventListener('click', () => {
    navigate({ view: 'mindmap', company: null, sector: null });
  }));
  $$('[data-back-chain]', root).forEach((b) => b.addEventListener('click', () => {
    navigate({ view: 'chain', company: null });
  }));
  $$('[data-sector]', root).forEach((el) => {
    const go = () => navigate({ view: 'chain', sector: el.dataset.sector, company: null });
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
  $$('[data-company]', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ view: 'company', company: btn.dataset.company }));
  });
  root.onclick = (e) => {
    if (e.target === root) close();
  };
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}
function escapeXml(s) { return escapeHtml(s); }
function shortLabel(name) {
  if (!name) return '';
  return name.length > 22 ? name.slice(0, 20) + '…' : name;
}

/* ---------- Panel ---------- */
function renderPanel() {
  const root = $('#country-panel');
  const c = getCountry(state.country);
  if (!c) {
    root.innerHTML = `
      <div class="panel-empty">
        <h2>Select a country</h2>
        <p>Click the atlas for the country desk · double-click (or long-press on mobile) for the industry mind map. Zoom with wheel / pinch or the +/− controls so small states are reachable.</p>
        <p>Fully fleshed SAMPLE desks: United States, India, UAE, Japan, Nigeria, Chile. Other highlighted states open as lighter stubs — mind maps invent coherent primary industries.</p>
        <div class="seed-list" id="seed-chips"></div>
      </div>`;
    const box = $('#seed-chips');
    for (const id of fullCountryIds()) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.textContent = COUNTRIES[id].name;
      btn.addEventListener('click', () => navigate({ country: id, view: 'desk', sector: null, region: null, company: null, tab: 'signals' }));
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
        <strong>${escapeHtml(c.name)}</strong> is a lighter stub in Version 0. Metrics are illustrative SAMPLE scores.
        Open the <strong>industry mind map</strong> for invented primary industries and light value-chain stubs — or drill a fully seeded nation for full desks.
      </div>
      <div class="tab-body">
        <p class="section-note">${escapeHtml(c.snapshot)}</p>
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
      <h2>${escapeHtml(c.name)} <span class="tier-tag">${tier}</span></h2>
      <p class="snapshot">${escapeHtml(c.snapshot)}</p>
      <div class="metrics">
        <div class="metric"><div class="label">Stability</div><div class="value">${m.stability}</div><div class="hint">${metricLabel(m.stability)}</div></div>
        <div class="metric"><div class="label">Frontier pressure</div><div class="value">${m.frontierPressure}</div><div class="hint">${metricLabel(m.frontierPressure)}</div></div>
        <div class="metric"><div class="label">Opportunity</div><div class="value">${m.opportunity}</div><div class="hint">${metricLabel(m.opportunity)}</div></div>
      </div>
      <div class="desk-actions">
        <button type="button" class="btn-brass" data-open-mindmap>Mind map</button>
        <span class="desk-hint">Atlas: single-click = desk · double-click / long-press = mind map</span>
      </div>
    </div>
    ${body}`;

  $$('.tab', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ tab: btn.dataset.tab, sector: null, region: null, view: 'desk' }));
  });
  $('[data-open-mindmap]', root)?.addEventListener('click', () => {
    navigate({ view: 'mindmap', company: null, sector: null, region: null });
  });
  if (c.tier === 'stub') {
    const box = $('#seed-chips');
    for (const id of fullCountryIds()) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.textContent = COUNTRIES[id].name;
      btn.addEventListener('click', () => navigate({ country: id, view: 'desk', sector: null, region: null, company: null, tab: 'signals' }));
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
      ? `<div class="filter-bar"><span class="section-note" style="margin:0">Filtered · ${escapeHtml(state.sector || state.region)}</span><button type="button" class="clear" data-clear>Clear filter</button></div>`
      : `<p class="section-note">Civilization-weighted headlines (SAMPLE). Higher weight ≈ more impact on long-horizon development capacity.</p>`;
    return filterNote + `<div class="signal-list">${list.map(signalCard).join('') || '<p class="section-note">No signals for this filter.</p>'}</div>`;
  }
  if (tab === 'industries') {
    const cards = (c.industries || []).map((ind) => `
      <button type="button" class="industry-card ${state.sector === ind.id ? 'active' : ''}" data-sector="${ind.id}">
        <h3>${escapeHtml(ind.name)}</h3>
        <p>${escapeHtml(ind.note)}</p>
      </button>`).join('');
    let detail = '';
    if (state.sector) {
      const note = opportunityNote(c, state.sector);
      const sigs = filterSignals(c, { sector: state.sector });
      detail = `
        <div class="filter-bar" style="margin-top:1rem">
          <span class="section-note" style="margin:0">Industry drill · ${escapeHtml(state.sector)}</span>
          <button type="button" class="clear" data-clear>Clear</button>
          <button type="button" class="btn-ghost btn-inline" data-sector-chain="${escapeHtml(state.sector)}">Value chain</button>
        </div>
        ${note ? `<div class="opening-card" style="margin-bottom:0.75rem"><div class="gap-label">Opportunity note</div><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.gap)}</p><div class="horizon">${escapeHtml(note.horizon)}</div></div>` : ''}
        <div class="signal-list">${sigs.map(signalCard).join('') || '<p class="section-note">No sector signals in SAMPLE set.</p>'}</div>`;
    }
    return `<p class="section-note">Sectors as skilltree nodes. Click to filter SAMPLE signals — or open the <strong>Mind map</strong> for the radiating industry view and value chains.</p><div class="grid-cards">${cards}</div>${detail}`;
  }
  if (tab === 'regions') {
    const cards = (c.regions || []).map((r) => `
      <button type="button" class="region-card ${state.region === r.id ? 'active' : ''}" data-region="${r.id}">
        <h3>${escapeHtml(r.name)}</h3>
        <p>${escapeHtml(r.note)}</p>
      </button>`).join('');
    let detail = '';
    if (state.region) {
      const sigs = filterSignals(c, { region: state.region });
      detail = `
        <div class="filter-bar" style="margin-top:1rem"><span class="section-note" style="margin:0">Region drill · ${escapeHtml(state.region)}</span><button type="button" class="clear" data-clear>Clear</button></div>
        <div class="signal-list">${sigs.map(signalCard).join('') || '<p class="section-note">No regional signals in SAMPLE set.</p>'}</div>`;
    }
    return `<p class="section-note">Subregions for geographic drill-down (SAMPLE).</p><div class="grid-cards">${cards}</div>${detail}`;
  }
  if (tab === 'openings') {
    const cards = (c.openings || []).map((o) => `
      <div class="opening-card">
        <div class="gap-label">Weak spot / opening</div>
        <h3>${escapeHtml(o.title)}</h3>
        <p>${escapeHtml(o.gap)}</p>
        <div class="horizon">Horizon · ${escapeHtml(o.horizon)}</div>
        <div class="signal-meta">${o.sectors.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
      </div>`).join('');
    return `<p class="section-note">Long-horizon openings — framed as civilization skilltree gaps, not day-trade tips. SAMPLE.</p><div class="opening-list">${cards}</div>`;
  }
  return '';
}

function signalCard(s) {
  return `
    <article class="signal-card">
      <div class="top"><h3>${escapeHtml(s.title)}</h3><span class="weight">w${s.weight}</span></div>
      <p>${escapeHtml(s.blurb)}</p>
      <div class="signal-meta">
        <span class="tag">${escapeHtml(s.date)}</span>
        ${s.sector ? `<span class="tag">${escapeHtml(s.sector)}</span>` : ''}
        ${s.region ? `<span class="tag">${escapeHtml(s.region)}</span>` : ''}
      </div>
    </article>`;
}

function wireTabInteractions(c, root) {
  const clear = $('[data-clear]', root);
  if (clear) clear.addEventListener('click', () => navigate({ sector: null, region: null }));
  $$('[data-sector]', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ sector: btn.dataset.sector, region: null, tab: 'industries', view: 'desk' }));
  });
  $$('[data-region]', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ region: btn.dataset.region, sector: null, tab: 'regions', view: 'desk' }));
  });
  $$('[data-sector-chain]', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ view: 'chain', sector: btn.dataset.sectorChain, company: null }));
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
      <div class="country">${escapeHtml(i.countryName)}</div>
      <div class="title">${escapeHtml(i.title)}</div>
      <div class="meta"><span>${escapeHtml(i.date)}</span><span>w${i.weight}</span></div>
    </article>`).join('') || '<p class="section-note" style="padding:0.5rem">No feed items.</p>';
  $$('.feed-item', feed).forEach((el) => {
    el.addEventListener('click', () => navigate({ country: el.dataset.c, view: 'desk', tab: 'signals', sector: null, region: null, company: null }));
  });
}

function render() {
  paintMapSelection();
  renderPanel();
  renderFeed();
  renderOverlay();
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
  window.addEventListener('resize', () => applyMapTransform());
  window.addEventListener('hashchange', applyHash);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.view !== 'desk') {
      navigate({ view: 'desk', company: null });
    }
  });
  registerSW();
}

boot();
