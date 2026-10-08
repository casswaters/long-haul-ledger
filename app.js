import { sparkSvg } from './stats.js';
import { sectorStripHtml, energyMixHtml } from './sectorstrip.js';
import { coverageLine, placeIndicators, groupCounts, whatChangedHtml, lineHtml, notCoveredHtml, GROUPS, NOT_COVERED, changeOf, asOfLabel, fmtNumber } from './whatchanged.js';
import { seatsFor, seatsHtml, isSeatChange, validateSeats, dayText } from './seats.js';
import { xSearchUrl, xQueryForStory, xQueryForPanel, xLinkHtml } from './xsearch.js';
import {
  META, COUNTRIES, STUBS, getCountry, fullCountryIds, globalFeed,
  filterSignals, opportunityNote, metricLabel,
} from './data.js';
import { parseHash, buildHash, normalizeTab, normalizeView, TABS, TAB_LABELS } from './nav.js';
import {
  DESKS, EMPTY_STATE, PROTOTYPE, renderableRecords, formatValue, formatDelta,
  isStale, ageDays,
} from './desks.js';
import {
  clampZoom, resetTransform, zoomAt, panBy,
  wheelToScale, stepZoom, exceededDragThreshold,
  pinchDistance, pinchCenter, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP,
  svgBoxToHostRect, fitScale, clampPan, edgeBumpCounter,
} from './zoom.js';
import {
  industriesForMindMap, mindMapLayout, getValueChain, getCompany, chainStages,
} from './chains.js';
import {
  geometryToPath, featureBbox, padBbox, bboxToViewBox,
  countriesWithAdmin1, adminFeaturesForCountry, findAdminFeature,
  citiesForAdmin, findCityFeature, countryBboxFromAdmin,
  drillBreadcrumb, mindMapAllowed, project, SVG_W, SVG_H,
  projectorFor, insetsForCountry, countryDrillSvgBox, geometrySvgBox,
  svgBoxToViewBox, levelLabel, clipAdminToWorld,
} from './geo.js';
import {
  ensureVerification, tierCounts, filterByStatus, STATUS_META, STATUS_ORDER,
} from './verify.js';
import {
  layoutLabels, labelFontPx, dotRadiusPx, labelPriority, estimateTextWidth,
} from './labels.js';
import {
  resolveLeadership, leadershipStack, roleBadge, hasPublicContact, isEmptyLeadership,
} from './leadership.js';
import { countryName } from './places.js';
import {
  placeOf, buildColumn, rankedForPlace, placeLabel, parentPlace, CATEGORIES, CATEGORY_LABELS, categoryOf, LEVEL_NAMES,
} from './newsrank.js';
import { validateBriefs, ECONOMIC_TYPES, naicsUrl, OFFICIAL_SOURCES } from './sectors.js';
import { SECTOR_TABS } from './tabs.js';
import { renderSectorOverlay, wireSectorOverlay } from './sectorui.js';
import { mountSignup } from './signup.js';

const state = {
  country: null,
  tab: 'signals',
  sector: null,
  region: null,
  view: 'desk',
  company: null,
  admin1: null,
  city: null,
  desk: null,
  /** Sector tab (energy), its selected source and whether the brief is open. */
  stab: null,
  ssub: null,
  sbrief: false,
  /** "Who's in the seat" opened from the URL (#seats, or an old #d=people link). */
  seats: false,
};

/** Validated briefs per sector id (data/energy-briefs.json). */
const sectorBriefs = {};
/** Sector-tab view state that is not in the URL. */
let sectorStage = null;
let sectorExpanded = false;
let sectorViewKey = '';
/** Last selected segment per tab, so reopening a tab returns to it. */
const lastSectorSub = {};

/** @type {any} Prices desk (data/desks/prices.json) */
let pricesDesk = null;
/** @type {any} Official stats (data/stats/us.json, world.json) */
let statsUs = null;
let statsWorld = null;
/** World Bank Pink Sheet benchmarks (data/stats/benchmarks.json) and key seats (data/seats.json). */
let statsBench = null;
/** Sector share strips (data/stats/sectors.json) and electricity mix (data/stats/energy-mix.json). */
let sectorsData = null;
let energyMixData = null;
let seatsData = null;
/** Build-time coverage counts (data/coverage.json) for the Method page. */
let coverageData = null;

/** @type {any} */
let admin1Geo = null;
/** @type {any} */
let citiesGeo = null;
/** @type {any} */
let leadershipCatalog = null;
/** @type {Set<string>} */
let admin1Countries = new Set();
let lastFitKey = null;

/** @type {{ generatedAt?: string, itemCount?: number, items: any[], sourcesFailed?: any[] } | null} */
let liveFeed = null;

const mapXform = resetTransform();
/** SVG-space box of the selected country (the pan/zoom bounds below World level), or null at World. */
let countryFrame = null;
let countryFrameKey = '';
const edgeBumps = edgeBumpCounter({ count: 3, windowMs: 6000 });

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

function formatDateStamp(d = new Date()) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function applyHash() {
  const h = parseHash(location.hash);
  state.country = h.country;
  state.tab = normalizeTab(h.tab);
  state.sector = h.sector;
  state.region = h.region;
  state.admin1 = h.admin1;
  state.city = h.city;
  let view = normalizeView(h.view);
  // Mind map / chain / company only at country level
  if (!mindMapAllowed(state.admin1, state.city) && view !== 'desk') {
    view = 'desk';
  }
  state.view = view;
  state.company = h.company;
  state.desk = h.desk;
  state.stab = h.stab;
  state.ssub = h.ssub;
  state.sbrief = h.sbrief;
  state.seats = !!h.seats;
  if (h.redirected) history.replaceState(null, '', `${location.pathname}${location.search}#${buildHash(state)}`);
  render();
  if (state.seats) revealSeats();
}

function navigate(patch) {
  Object.assign(state, patch);
  if (patch.country !== undefined && patch.admin1 === undefined && patch.city === undefined) {
    // Selecting a new country clears sub-area unless explicitly set
    if (!('admin1' in patch)) state.admin1 = null;
    if (!('city' in patch)) state.city = null;
  }
  if (patch.admin1 !== undefined && patch.city === undefined && !('city' in patch)) {
    state.city = null;
  }
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
  if (patch.view === 'mindmap' || patch.view === 'chain' || patch.view === 'company') {
    state.company = patch.view === 'company' ? state.company : null;
    // Force country-level for overlays
    state.admin1 = null;
    state.city = null;
  }
  if (!mindMapAllowed(state.admin1, state.city) && state.view !== 'desk') {
    state.view = 'desk';
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
  scheduleLabelLayout();
}

/**
 * Pan/zoom bounds. At World: the whole map, zoom 1 to ZOOM_MAX. Below World (a country,
 * a state equivalent or a city is chosen): the whole selected country, so the view can
 * zoom out until the full country fits and pan anywhere across it, but not beyond it.
 */
function mapBounds() {
  const host = $('#world-map-host');
  const svg = $('#world-map-host svg');
  const vb = svg?.viewBox?.baseVal;
  if (!host || !vb || !vb.width) return null;
  const r = host.getBoundingClientRect();
  const W = r.width, H = r.height;
  if (!W || !H) return null;
  if (state.country && countryFrame) {
    const rect = svgBoxToHostRect(countryFrame, vb, W, H);
    const min = Math.min(1, fitScale(rect, W, H, 0.06));
    return { W, H, rect, min, max: ZOOM_MAX, pad: Math.round(Math.min(W, H) * 0.06), country: true };
  }
  return { W, H, rect: { x0: 0, y0: 0, x1: W, y1: H }, min: ZOOM_MIN, max: ZOOM_MAX, pad: 0, country: false };
}

/** Clamp the current transform to the bounds; returns true when a bound stopped it. */
function clampMapXform(b = mapBounds()) {
  if (!b) return false;
  const c = clampPan(mapXform, b.rect, b.W, b.H, b.pad);
  mapXform.tx = c.tx; mapXform.ty = c.ty;
  return !!(c.hitX || c.hitY);
}

function setZoom(nextScale, focalX, focalY) {
  const host = $('#world-map-host');
  if (!host) return false;
  const rect = host.getBoundingClientRect();
  const fx = focalX == null ? rect.width / 2 : focalX;
  const fy = focalY == null ? rect.height / 2 : focalY;
  const b = mapBounds();
  const min = b?.min ?? ZOOM_MIN, max = b?.max ?? ZOOM_MAX;
  const before = mapXform.scale;
  const atMin = before <= min + 0.001 && nextScale < before - 0.0005;
  Object.assign(mapXform, zoomAt(mapXform, nextScale, fx, fy, min, max));
  if (!b?.country && mapXform.scale <= ZOOM_MIN + 0.001) {
    Object.assign(mapXform, resetTransform());
  } else {
    clampMapXform(b);
  }
  applyMapTransform();
  return atMin;
}

/**
 * Edge bumps: dragging against the country bounds, or zooming out past the whole
 * country. One gesture counts once; 3 bumps within 6 s make the World button pulse.
 */
function registerEdgeBump() {
  if (!state.country) return;
  if (edgeBumps.bump(Date.now())) nudgeWorldButton();
}

function nudgeWorldButton() {
  const btn = $('#map-breadcrumb [data-bc-level="world"]');
  if (!btn) return;
  btn.classList.remove('is-nudge');
  void btn.offsetWidth; // restart the animation
  btn.classList.add('is-nudge');
  const live = $('#map-nudge-live');
  if (live) live.textContent = 'Edge of the country. Use World to step back out to the world map.';
  clearTimeout(nudgeWorldButton.t);
  nudgeWorldButton.t = setTimeout(() => {
    btn.classList.remove('is-nudge');
    if (live) live.textContent = '';
  }, 3200);
}

function wireZoomControls() {
  const host = $('#world-map-host');
  const stage = $('.map-stage');
  if (!host || !stage) return;

  $('#zoom-in')?.addEventListener('click', () => {
    setZoom(mapXform.scale * ZOOM_STEP);
  });
  $('#zoom-out')?.addEventListener('click', () => {
    if (setZoom(mapXform.scale / ZOOM_STEP)) registerEdgeBump();
  });
  $('#zoom-reset')?.addEventListener('click', () => {
    Object.assign(mapXform, resetTransform());
    applyMapTransform();
  });

  // Wheel / trackpad: one burst (events less than 400 ms apart) counts as one edge bump.
  let wheelLast = 0;
  let wheelBumped = false;
  host.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - wheelLast > 400) wheelBumped = false;
    wheelLast = now;
    const rect = host.getBoundingClientRect();
    const next = mapXform.scale * Math.exp(-e.deltaY * 0.0015);
    if (setZoom(next, e.clientX - rect.left, e.clientY - rect.top) && !wheelBumped) {
      wheelBumped = true;
      registerEdgeBump();
    }
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
  let pendingHit = null;
  let gestureBumped = false;

  function clearLongPress() {
    if (longPressTimer) clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  function hitFromEvent(e) {
    let t = e.target;
    while (t && t !== host) {
      if (t.dataset?.city) return { kind: 'city', id: t.dataset.city, admin1: t.dataset.admin1 || null, country: t.dataset.country || state.country };
      if (t.dataset?.admin1) return { kind: 'admin1', id: t.dataset.admin1, country: t.dataset.country || state.country };
      if (t.tagName === 'path' && t.id && !t.closest?.('#drill-layer')) {
        return { kind: 'country', id: t.id.toLowerCase() };
      }
      t = t.parentElement;
    }
    return null;
  }

  function countryFromEvent(e) {
    const hit = hitFromEvent(e);
    return hit?.kind === 'country' ? hit.id : (hit?.country || null);
  }

  function openDesk(id) {
    navigate({
      country: id, view: 'desk', sector: null, region: null, company: null,
      tab: 'signals', admin1: null, city: null,
    });
  }

  function openHit(hit) {
    if (!hit) return;
    if (hit.kind === 'city') {
      navigate({
        country: hit.country, admin1: hit.admin1 || state.admin1, city: hit.id,
        view: 'desk', sector: null, region: null, company: null, tab: 'signals',
      });
      return;
    }
    if (hit.kind === 'admin1') {
      navigate({
        country: hit.country, admin1: hit.id, city: null,
        view: 'desk', sector: null, region: null, company: null, tab: 'signals',
      });
      return;
    }
    openDesk(hit.id);
  }

  function openMindMap(id) {
    if (!mindMapAllowed(state.admin1, state.city) && state.country === id) {
      // Already below country — ignore mind map
      return;
    }
    navigate({
      country: id, view: 'mindmap', sector: null, region: null, company: null,
      admin1: null, city: null,
    });
  }

  host.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    try { host.setPointerCapture?.(e.pointerId); } catch { /* pointer already gone */ }
    pointers.set(e.pointerId, e);
    dragMoved = false;
    longPressFired = false;
    if (pointers.size === 1) gestureBumped = false;
    pendingHit = hitFromEvent(e);

    if (pointers.size === 1) {
      panOrigin = { x: e.clientX, y: e.clientY, tx: mapXform.tx, ty: mapXform.ty };
      clearLongPress();
      if (pendingHit?.kind === 'country') {
        longPressTimer = setTimeout(() => {
          longPressFired = true;
          openMindMap(pendingHit.id);
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
        const next = pinchStartScale * (dist / pinchStartDist);
        if (setZoom(next, center.x, center.y) && !gestureBumped) {
          gestureBumped = true;
          registerEdgeBump();
        }
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
        // World: pan only when zoomed in. Below World: pan anywhere across the whole country.
        if (mapXform.scale > 1.02 || state.country) {
          Object.assign(mapXform, panBy(
            { scale: mapXform.scale, tx: panOrigin.tx, ty: panOrigin.ty },
            dx, dy, mapXform.scale, mapXform.scale
          ));
          const hit = clampMapXform();
          applyMapTransform();
          stage.classList.add('is-panning');
          if (hit && !gestureBumped) {
            gestureBumped = true; // one long drag counts once
            registerEdgeBump();
          }
        }
      }
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    stage.classList.remove('is-panning');
    if (pointers.size === 0) {
      clearLongPress();
      const hit = pendingHit;
      const moved = dragMoved || longPressFired;
      const wasLong = longPressFired;
      pendingHit = null;
      panOrigin = null;
      if (!moved && hit && !wasLong) {
        const now = Date.now();
        const tapKey = `${hit.kind}:${hit.id}`;
        if (hit.kind === 'country' && lastTap.id === tapKey && now - lastTap.t < 350) {
          if (clickTimer) clearTimeout(clickTimer);
          clickTimer = null;
          lastTap = { id: null, t: 0 };
          openMindMap(hit.id);
        } else {
          lastTap = { id: tapKey, t: now };
          if (clickTimer) clearTimeout(clickTimer);
          clickTimer = setTimeout(() => {
            clickTimer = null;
            openHit(hit);
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
    const hit = hitFromEvent(e);
    if (hit?.kind === 'country') openMindMap(hit.id);
    // Below country: mind map disabled — single-click already opened desk
  });

  applyMapTransform();
}

/* ---------- Geo + leadership data ---------- */
async function loadGeoAndLeadership() {
  try {
    const [a, c, l] = await Promise.all([
      fetch('./data/geo/admin1.geojson', { cache: 'no-store' }).then((r) => r.json()),
      fetch('./data/geo/cities.geojson', { cache: 'no-store' }).then((r) => r.json()),
      fetch('./data/leadership.json', { cache: 'no-store' }).then((r) => r.json()),
    ]);
    admin1Geo = a;
    citiesGeo = c;
    leadershipCatalog = l;
    admin1Countries = countriesWithAdmin1(admin1Geo);
  } catch (err) {
    console.warn('Geo/leadership load failed', err);
    admin1Geo = { features: [] };
    citiesGeo = { features: [] };
    leadershipCatalog = { areas: {} };
    admin1Countries = new Set();
  }
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
    const svgText = await res.text();
    viewport.innerHTML = svgText;
    const svg = viewport.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('shape-rendering', 'geometricPrecision');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'World map: click a country to focus the panels and news on it; double-click / long-press opens the mind map at country level; drill into state equivalents and cities');
      svg.dataset.baseViewBox = svg.getAttribute('viewBox') || `0 0 ${SVG_W} ${SVG_H}`;
      const seed = new Set(fullCountryIds());
      const stubs = new Set(Object.keys(STUBS));
      $$('path[id]', svg).forEach((p) => {
        const id = p.id.toLowerCase();
        if (seed.has(id)) p.classList.add('seed');
        else if (stubs.has(id)) p.classList.add('stub-known');
        if (admin1Countries.has(id)) p.classList.add('has-admin1');
        const name = getCountry(id)?.name || id.toUpperCase();
        p.setAttribute('aria-label', name);
      });
      // Drill overlay group
      let drill = svg.querySelector('#drill-layer');
      if (!drill) {
        drill = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        drill.setAttribute('id', 'drill-layer');
        svg.appendChild(drill);
      }
    }
  } catch (err) {
    viewport.innerHTML = `<p style="color:#9a9386;padding:2rem;text-align:center">Map failed to load. Use country chips below.</p>`;
    console.warn(err);
  }
  wireZoomControls();
  paintMapSelection();
  renderDrillLayer();
  renderBreadcrumb();
}

function paintMapSelection() {
  const svg = $('#world-map-host svg');
  if (!svg) return;
  $$('path.selected', svg).forEach((p) => p.classList.remove('selected'));
  $$('path.dimmed', svg).forEach((p) => p.classList.remove('dimmed'));
  $$('path.drill-under', svg).forEach((p) => p.classList.remove('drill-under'));
  if (state.country) {
    const p = svg.querySelector(`#${CSS.escape(state.country)}`);
    const drilled = admin1Countries.has(state.country);
    if (p) {
      // Drilled countries: the world-level fill is hidden and the outline is
      // redrawn from the state-equivalent geometry (same projection as the
      // states) so nothing can sit offset under the drill layer.
      p.classList.add(drilled ? 'drill-under' : 'selected');
    }
    if (state.admin1 || drilled) {
      $$('path[id]', svg).forEach((path) => {
        if (path.id.toLowerCase() !== state.country && !path.closest('#drill-layer')) {
          path.classList.add('dimmed');
        }
      });
    }
  }
}

function setViewBox(vb) {
  const svg = $('#world-map-host svg');
  if (!svg) return;
  svg.setAttribute('viewBox', vb);
  Object.assign(mapXform, resetTransform());
  applyMapTransform();
}

function fitToBbox(bbox) {
  const svg = $('#world-map-host svg');
  if (!svg) return;
  const base = svg.dataset.baseViewBox || `0 0 ${SVG_W} ${SVG_H}`;
  setViewBox(bbox ? bboxToViewBox(padBbox(bbox, 0.35), 0.1) : base);
}

function fitToSvgBox(box, padRatio = 0.08) {
  if (!box) return fitToBbox(null);
  setViewBox(svgBoxToViewBox(box, padRatio));
}

/** The selected country's SVG box, the same box the Country level fits to. */
function updateCountryFrame(svg, country) {
  const key = `${country || ''}|${admin1Countries.has(country) ? 1 : 0}`;
  if (key === countryFrameKey && (countryFrame || !country)) return;
  countryFrameKey = key;
  edgeBumps.reset();
  countryFrame = null;
  if (!country || !svg) return;
  const worldPath = svg.querySelector(`#${CSS.escape(country)}`);
  try {
    if (!admin1Countries.has(country) || clipAdminToWorld(country)) {
      const b = worldPath?.getBBox();
      if (b && b.width) countryFrame = { x: b.x, y: b.y, width: b.width, height: b.height };
    } else {
      countryFrame = countryDrillSvgBox(admin1Geo, country) || null;
    }
  } catch { countryFrame = null; }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** City point in drill space (inset-aware). */
function cityPoint(country, f) {
  const [lon, lat] = f.geometry.coordinates;
  return projectorFor(country, f.properties?.admin1)(lon, lat);
}

function renderDrillLayer() {
  const svg = $('#world-map-host svg');
  const drill = svg?.querySelector('#drill-layer');
  if (!drill) return;
  drill.innerHTML = '';

  const country = state.country;
  updateCountryFrame(svg, country);
  if (!country) {
    if (lastFitKey !== '') {
      lastFitKey = '';
      fitToBbox(null);
    }
    return;
  }

  const hasAdmin = admin1Countries.has(country);
  if (!hasAdmin) {
    const fitKey = `${country}|`;
    if (fitKey !== lastFitKey) {
      lastFitKey = fitKey;
      const path = svg.querySelector(`#${CSS.escape(country)}`);
      if (path) {
        try {
          const b = path.getBBox();
          fitToSvgBox(b, 0.15);
        } catch { /* empty path */ }
      }
    }
    return;
  }

  const adminFeats = adminFeaturesForCountry(admin1Geo, country);
  const insets = insetsForCountry(country);

  // Inset frames (Alaska / Hawaii etc.) — opaque boxes so the far-off true
  // location never shows through as a stray shape.
  if (insets.length) {
    const insetG = svgEl('g', { class: 'drill-insets' });
    for (const inset of insets) {
      const { x, y, w, h } = inset.frame;
      insetG.appendChild(svgEl('rect', { class: 'inset-frame', x, y, width: w, height: h, rx: 1.5 }));
      const t = svgEl('text', { class: 'inset-label', x: x + 2.5, y: y + h - 2.5 });
      t.dataset.fx = x;
      t.dataset.fy = y + h;
      t.textContent = inset.label;
      insetG.appendChild(t);
    }
    drill.appendChild(insetG);
  }

  const paths = adminFeats.map((f) => {
    const proj = projectorFor(country, f.properties.id);
    return { f, d: geometryToPath(f.geometry, proj) };
  }).filter((x) => x.d);

  // Country outline drawn in the same projection as the states: a wide gold
  // stroke underneath, so only the outer half shows as the country border.
  const worldPath = svg.querySelector(`#${CSS.escape(country)}`);
  const clip = clipAdminToWorld(country) && worldPath?.getAttribute('d');
  const outlineG = svgEl('g', { class: 'drill-outline', 'aria-hidden': 'true' });
  if (clip) {
    // Coarse state-equivalent approximation: base + outline come from the
    // world.svg coastline (now the same projection) and admin areas are clipped to it.
    outlineG.appendChild(svgEl('path', { d: clip, class: 'country-outline' }));
    outlineG.appendChild(svgEl('path', { d: clip, class: 'country-base' }));
    const defs = svgEl('defs');
    const cp = svgEl('clipPath', { id: 'drill-clip' });
    cp.appendChild(svgEl('path', { d: clip }));
    defs.appendChild(cp);
    drill.appendChild(defs);
  } else {
    for (const { d } of paths) outlineG.appendChild(svgEl('path', { d, class: 'country-outline' }));
  }
  drill.appendChild(outlineG);

  const adminG = svgEl('g', { class: 'drill-admin' });
  if (clip) adminG.setAttribute('clip-path', 'url(#drill-clip)');
  for (const { f, d } of paths) {
    const p = svgEl('path', {
      d,
      class: 'admin1-path' + (state.admin1 === f.properties.id ? ' selected' : ''),
      'aria-label': `${f.properties.name} (State equivalent)`,
    });
    p.dataset.admin1 = f.properties.id;
    p.dataset.country = country;
    adminG.appendChild(p);
  }
  drill.appendChild(adminG);

  // Cities only after a state equivalent is chosen. Country view shows the
  // outline + state-equivalent borders; city markers/labels appear on drill-in.
  const cityFeats = state.admin1
    ? citiesForAdmin(citiesGeo, { country, admin1: state.admin1 })
    : [];
  const leaderG = svgEl('g', { class: 'drill-leaders', 'aria-hidden': 'true' });
  const cityG = svgEl('g', { class: 'drill-cities' });
  const labelG = svgEl('g', { class: 'drill-labels', 'aria-hidden': 'true' });
  for (const f of cityFeats) {
    const [x, y] = cityPoint(country, f);
    const g = svgEl('g', {
      class: 'city-marker' + (state.city === f.properties.id ? ' selected' : ''),
      transform: `translate(${x.toFixed(2)},${y.toFixed(2)})`,
      role: 'button',
      'aria-label': f.properties.name,
    });
    g.dataset.city = f.properties.id;
    g.dataset.admin1 = f.properties.admin1 || '';
    g.dataset.country = country;
    g.dataset.x = x;
    g.dataset.y = y;
    g.dataset.pop = f.properties.pop || 0;
    g.dataset.capital = f.properties.capital ? '1' : '';
    g.dataset.name = f.properties.name;
    g.appendChild(svgEl('circle', { r: 3, class: 'city-dot' }));
    cityG.appendChild(g);
  }
  drill.appendChild(leaderG);
  drill.appendChild(cityG);
  drill.appendChild(labelG);

  // Fit view only when drill focus changes (preserve user pan/zoom otherwise)
  const fitKey = `${country}|${state.admin1 || ''}|${state.city || ''}`;
  if (fitKey !== lastFitKey) {
    lastFitKey = fitKey;
    if (state.city) {
      const cf = findCityFeature(citiesGeo, state.city);
      if (cf) {
        const [x, y] = cityPoint(country, cf);
        const span = insetsForCountry(country).some((i) => i.admin1 === cf.properties.admin1) ? 6 : 13;
        fitToSvgBox({ x: x - span, y: y - span * 0.75, width: span * 2, height: span * 1.5 }, 0);
      }
    } else if (state.admin1) {
      const af = findAdminFeature(admin1Geo, state.admin1);
      fitToSvgBox(af && geometrySvgBox(af.geometry, projectorFor(country, af.properties.id)), 0.12);
    } else if (clip && worldPath) {
      fitToSvgBox(worldPath.getBBox(), 0.08);
    } else {
      fitToSvgBox(countryDrillSvgBox(admin1Geo, country), 0.06);
    }
  }
  layoutCityLabels();
}

/* ---------- City label layout (collision-aware, zoom-aware) ---------- */
let labelRaf = 0;
let lastLabelSig = '';
function scheduleLabelLayout() {
  if (labelRaf) return;
  labelRaf = requestAnimationFrame(() => {
    labelRaf = 0;
    layoutCityLabels();
  });
}

let measureCtx = null;
function measureText(text, fontPx) {
  try {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = `${fontPx}px "IBM Plex Sans", system-ui, sans-serif`;
    return measureCtx.measureText(text).width + 1;
  } catch {
    return estimateTextWidth(text, fontPx);
  }
}

function layoutCityLabels(force = false) {
  const svg = $('#world-map-host svg');
  const drill = svg?.querySelector('#drill-layer');
  if (!drill) return;
  const markers = $$('.city-marker', drill);
  const labelG = drill.querySelector('.drill-labels');
  const leaderG = drill.querySelector('.drill-leaders');
  if (!labelG || !leaderG) return;
  const vb = svg.viewBox?.baseVal;
  const rect = svg.getBoundingClientRect();
  if (!vb || !vb.width || !rect.width) return;
  // px per SVG unit under preserveAspectRatio="xMidYMid meet"
  const k = Math.min(rect.width / vb.width, rect.height / vb.height);
  const zoom = mapXform.scale || 1;
  // Inset captions: constant ~9px on screen at any zoom
  $$('.inset-label', drill).forEach((t) => {
    t.style.fontSize = `${(9 / k).toFixed(3)}px`;
    t.setAttribute('x', (Number(t.dataset.fx) + 4 / k).toFixed(3));
    t.setAttribute('y', (Number(t.dataset.fy) - 4 / k).toFixed(3));
  });
  const sig = `${markers.length}|${k.toFixed(4)}|${zoom.toFixed(3)}|${state.city || ''}`;
  if (!force && sig === lastLabelSig && labelG.childNodes.length) return;
  lastLabelSig = sig;

  const fontPx = labelFontPx(zoom);
  const items = markers.map((m) => {
    const capital = !!m.dataset.capital;
    const r = dotRadiusPx(zoom, capital);
    const dot = m.querySelector('.city-dot');
    if (dot) dot.setAttribute('r', (r / k).toFixed(3));
    return {
      id: m.dataset.city,
      x: Number(m.dataset.x) * k,
      y: Number(m.dataset.y) * k,
      r,
      text: m.dataset.name,
      priority: labelPriority({ id: m.dataset.city, pop: Number(m.dataset.pop), capital }, state.city),
      w: measureText(m.dataset.name, fontPx),
    };
  });
  const layout = layoutLabels(items, { fontPx, pad: 2 });

  labelG.innerHTML = '';
  leaderG.innerHTML = '';
  const fontU = fontPx / k;
  let hidden = 0;
  for (const it of items) {
    const l = layout.get(it.id);
    const marker = markers.find((m) => m.dataset.city === it.id);
    marker?.classList.toggle('label-hidden', !l?.visible);
    if (!l?.visible) { hidden++; continue; }
    const t = svgEl('text', {
      class: 'city-label' + (state.city === it.id ? ' selected' : ''),
      x: (l.x / k).toFixed(3),
      y: (l.y / k).toFixed(3),
      'text-anchor': l.anchor,
    });
    t.style.fontSize = `${fontU.toFixed(3)}px`;
    t.style.strokeWidth = `${(2.4 / k).toFixed(3)}px`;
    t.textContent = it.text;
    labelG.appendChild(t);
    if (l.leader) {
      // Leader from dot edge to the nearest point on the label box
      const bx = Math.max(l.box.x0, Math.min(it.x, l.box.x1));
      const by = Math.max(l.box.y0, Math.min(it.y, l.box.y1));
      const dx = bx - it.x, dy = by - it.y;
      const len = Math.hypot(dx, dy) || 1;
      const sx = it.x + (dx / len) * it.r;
      const sy = it.y + (dy / len) * it.r;
      leaderG.appendChild(svgEl('line', {
        class: 'city-leader',
        x1: (sx / k).toFixed(3), y1: (sy / k).toFixed(3),
        x2: (bx / k).toFixed(3), y2: (by / k).toFixed(3),
      }));
    }
  }
  drill.dataset.labelsHidden = String(hidden);
  drill.dataset.labelsShown = String(items.length - hidden);
}

function renderBreadcrumb() {
  let el = $('#map-breadcrumb');
  if (!el) {
    const stage = $('.map-stage');
    if (!stage) return;
    el = document.createElement('nav');
    el.id = 'map-breadcrumb';
    el.className = 'map-breadcrumb';
    el.setAttribute('aria-label', 'Map drill-down');
    stage.appendChild(el);
  }
  const c = getCountry(state.country);
  const af = findAdminFeature(admin1Geo, state.admin1);
  const cf = findCityFeature(citiesGeo, state.city);
  const bits = drillBreadcrumb({
    country: state.country,
    countryName: c?.name || (state.country ? countryName(state.country) : undefined),
    admin1: state.admin1,
    admin1Name: af?.properties?.name,
    city: state.city,
    cityName: cf?.properties?.name,
  });
  el.innerHTML = bits.map((b, i) => {
    const sep = i ? '<span class="bc-sep">→</span>' : '';
    if (i === bits.length - 1) {
      return `${sep}<span class="bc-current" title="${escapeHtml(b.levelLabel || '')}">${escapeHtml(b.label)}</span>`;
    }
    return `${sep}<button type="button" class="bc-link" title="${escapeHtml(b.levelLabel || '')}" data-bc-level="${b.level}" data-bc-id="${escapeHtml(b.id || '')}">${escapeHtml(b.label)}</button>`;
  }).join('');
  $$('[data-bc-level]', el).forEach((btn) => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.bcLevel;
      if (level === 'world') {
        navigate({ country: null, admin1: null, city: null, view: 'desk', sector: null, region: null, company: null });
        fitToBbox(null);
      } else if (level === 'country') {
        navigate({ country: btn.dataset.bcId, admin1: null, city: null, view: 'desk', tab: 'signals' });
      } else if (level === 'admin1') {
        navigate({ admin1: btn.dataset.bcId, city: null, view: 'desk' });
      }
    });
  });
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

  if (state.stab) {
    renderSectorTab(root);
    return;
  }
  syncSectorNav();
  if (sectorViewKey) {
    // A sector tab just closed: return focus to its header tab (unless another panel takes over).
    const closedTab = sectorViewKey.split('|')[0];
    setTimeout(() => {
      const ae = document.activeElement;
      if (!state.stab && !state.desk && (!ae || ae === document.body || !ae.isConnected)) document.getElementById(`nav-${closedTab}`)?.focus({ preventScroll: true });
    }, 0);
  }
  sectorViewKey = '';

  if (state.desk) {
    document.body.classList.add('overlay-open');
    root.hidden = false;
    root.innerHTML = renderDesks();
    wireOverlay(root);
    return;
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
    const nm = countryName(state.country);
    root.innerHTML = `
      <div class="overlay-panel">
        <div class="overlay-head">
          <div>
            <div class="overlay-kicker">Mind map</div>
            <h2>${escapeHtml(nm)}</h2>
          </div>
          <div class="overlay-actions">
            <button type="button" class="btn-ghost" data-to-desk>Country panel</button>
            <button type="button" class="btn-primary" data-close-overlay>Close</button>
          </div>
        </div>
        ${notCoveredHtml({ field: `Mind map for ${nm}`, planned: 'a project mind map built only from sourced, dated facts (players, investors and firms, proposed projects, blockers, milestones, next steps)', checked: CHECKED_DAY() })}
      </div>`;
    wireOverlay(root);
    return;
  }

  if (view === 'mindmap') root.innerHTML = renderMindMap(c);
  else if (view === 'chain') root.innerHTML = renderChain(c);
  else if (view === 'company') root.innerHTML = renderCompanyDesk(c);
  else root.innerHTML = '';

  wireOverlay(root);
}

/* ---------- Sector tab (Energy first; same component for future sector tabs) ---------- */
function sectorDef() {
  return SECTOR_TABS.find((s) => s.id === state.stab) || null;
}

/** Header tab buttons show which sector tab is open. */
function syncSectorNav() {
  document.querySelectorAll('[data-open-sector]').forEach((a) => {
    if (a.dataset.openSector === state.stab) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
  scrollActiveSectorTab();
}

/** Phones: the sector row scrolls sideways. Fade the edge that has more tabs. */
function updateSectorNavFade() {
  const nav = document.querySelector('.sector-nav');
  if (!nav) return;
  const max = nav.scrollWidth - nav.clientWidth;
  nav.classList.toggle('fade-start', max > 2 && nav.scrollLeft > 2);
  nav.classList.toggle('fade-end', max > 2 && nav.scrollLeft < max - 2);
}

let sectorNavScrolledFor = null;
/** Keep the open tab visible in the swipeable row (deep links included). Only scrolls the row, never the page. */
function scrollActiveSectorTab() {
  const nav = document.querySelector('.sector-nav');
  if (!nav) return;
  const active = nav.querySelector('[aria-current="true"]');
  if (!active || nav.scrollWidth <= nav.clientWidth + 2) { sectorNavScrolledFor = state.stab; updateSectorNavFade(); return; }
  if (sectorNavScrolledFor === state.stab) return;
  const first = sectorNavScrolledFor === null;
  sectorNavScrolledFor = state.stab;
  const n = nav.getBoundingClientRect();
  const r = active.getBoundingClientRect();
  if (r.left >= n.left + 24 && r.right <= n.right - 24) { updateSectorNavFade(); return; }
  const target = nav.scrollLeft + (r.left - n.left) - (nav.clientWidth - r.width) / 2;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  nav.scrollTo({ left: Math.max(0, target), behavior: first || reduce ? 'auto' : 'smooth' });
  updateSectorNavFade();
}

function wireSectorNav() {
  const nav = document.querySelector('.sector-nav');
  if (!nav) return;
  nav.addEventListener('scroll', updateSectorNavFade, { passive: true });
  window.addEventListener('resize', () => { sectorNavScrolledFor = undefined; scrollActiveSectorTab(); updateSectorNavFade(); });
  updateSectorNavFade();
}

function renderSectorTab(root) {
  const sector = sectorDef();
  syncSectorNav();
  if (!sector) {
    const wasOpen = !root.hidden && sectorViewKey;
    const closedTab = wasOpen ? sectorViewKey.split('|')[0] : null;
    const focusLost = !document.activeElement || document.activeElement === document.body || root.contains(document.activeElement);
    state.stab = null; root.hidden = true; root.innerHTML = ''; sectorViewKey = '';
    // Return focus to the header tab that opened the panel.
    if (closedTab && focusLost) document.getElementById(`nav-${closedTab}`)?.focus({ preventScroll: true });
    return;
  }
  if (state.ssub && !sector.subs.some((s) => s.id === state.ssub)) state.ssub = null;
  const place = placeOf(state);
  const placeKeyNow = `${place.level}|${place.country || ''}|${place.admin1 || ''}|${place.city || ''}`;
  const key = `${sector.id}|${state.ssub || ''}|${state.sbrief ? 1 : 0}|${placeKeyNow}`;
  const prev = sectorViewKey;
  const opening = !prev || prev.split('|')[0] !== sector.id;
  if (prev.split('|').slice(0, 2).join('|') !== key.split('|').slice(0, 2).join('|') || !prev.endsWith(placeKeyNow)) {
    sectorStage = null;
    sectorExpanded = false;
  }
  if (state.ssub) lastSectorSub[sector.id] = state.ssub;
  const names = placeNames();
  const ctx = {
    sector, state, place, names,
    items: liveItems(),
    briefs: sectorBriefs[sector.id] || { briefs: {} },
    stage: sectorStage,
    expanded: sectorExpanded,
    card: (it, extra) => newsCard(it, names, extra),
    tabs: SECTOR_TABS,
    energyPrices: sector.id === 'energy' ? energyPricesHtml() : '',
    energyMix: sector.id === 'energy' ? energyMixHtml(place, energyMixData, { placeLabel: placeLabel(place, names), countryLabel: place.country ? countryName(place.country) : '', checked: CHECKED_DAY() }) : '',
    sectorStrip: sector.economicType ? sectorStripHtml(sector.id, place, sectorsData, { placeLabel: placeLabel(place, names), countryLabel: place.country ? countryName(place.country) : '', checked: CHECKED_DAY() }) : '',
    checked: CHECKED_DAY(),
    xLink: (subDef) => xLinkHtml(xQueryForPanel(subDef.name, placeLabel(place, names), { tab: sector.id, sub: subDef.id }), { cls: 'x-link-panel' }),
  };
  const panelScroll = root.querySelector('.sector-panel')?.scrollTop || 0;
  // Re-renders replace the DOM (navigate + hashchange both render); keep focus on the same control.
  const fa = document.activeElement && root.contains(document.activeElement) ? document.activeElement : null;
  const focusSel = fa ? (fa.id ? `#${fa.id}` : ['data-ssub', 'data-sstage'].filter((k) => fa.hasAttribute(k)).map((k) => `[${k}="${fa.getAttribute(k)}"]`)[0]
    || ['brief-h', 'sector-detail-h', 'brief-missing', 'brief-btn'].filter((c) => fa.classList.contains(c)).map((c) => `.${c}`)[0] || (fa.hasAttribute('data-brief-missing') ? '[data-brief-missing]' : null)) : null;
  const fromSwitch = !!fa?.hasAttribute('data-sswitch');
  document.body.classList.add('overlay-open');
  root.hidden = false;
  root.innerHTML = renderSectorOverlay(ctx);
  wireSectorOverlay(root, {
    selectSub: (id) => navigate({ ssub: id, sbrief: false }),
    openBrief: () => navigate({ sbrief: true }),
    closeBrief: () => navigate({ sbrief: false }),
    setStage: (id) => { sectorStage = id; sectorExpanded = false; renderSectorTab(root); },
    expand: (on) => { sectorExpanded = on; renderSectorTab(root); },
    goPlace: (p, { brief = false } = {}) => {
      navigate({ country: p.country || null, admin1: p.admin1 || null, city: p.city || null, view: 'desk', sbrief: brief ? true : state.sbrief });
      if (!p.country) fitToBbox(null);
    },
    switchTab: (id) => openSectorTab(id),
    close: () => navigate({ stab: null, ssub: null, sbrief: false }),
    method: () => { navigate({ stab: null, ssub: null, sbrief: false }); document.getElementById('method-sectors')?.scrollIntoView({ behavior: 'smooth' }); },
  });
  wireVerifyBadges(root);
  const panel = root.querySelector('.sector-panel');
  if (opening) {
    root.querySelector('#sector-title')?.focus({ preventScroll: true });
  } else if (prev === key && panel) {
    panel.scrollTop = panelScroll;
    if (focusSel) { const el = root.querySelector(focusSel); if (el) { if (!el.matches('button, a, [tabindex]')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } }
  } else if (panel) {
    panel.scrollTop = 0;
    const target = root.querySelector('.sector-detail .sector-detail-h, .sector-detail .brief-h, .sector-detail [data-brief-missing]');
    if (state.ssub && target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    else if (!state.ssub && prev.split('|')[1]) root.querySelector(`[data-ssub="${prev.split('|')[1]}"]`)?.focus({ preventScroll: true });
  }
  // Switching sectors from the emoji row keeps focus on the row (the new current sector).
  if (fromSwitch) root.querySelector('.sswitch.is-current')?.focus({ preventScroll: true });
  sectorViewKey = key;
}

function openSectorTab(id = 'energy') {
  const sector = SECTOR_TABS.find((s) => s.id === id);
  const keep = state.stab === id && state.ssub ? state.ssub : null;
  const sub = keep || lastSectorSub[id] || null;
  navigate({ stab: id, ssub: sector && sub && sector.subs.some((x) => x.id === sub) ? sub : null, sbrief: false, desk: null });
}

async function loadSectorBriefs() {
  await Promise.all(SECTOR_TABS.map(async (sector) => {
    try {
      const res = await fetch(`./data/${sector.id}-briefs.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const { valid } = validateBriefs(await res.json(), sector);
      sectorBriefs[sector.id] = valid;
    } catch {
      sectorBriefs[sector.id] = { briefs: {} };
    }
  }));
  if (state.stab) renderOverlay();
}

/** Plain description of a tab's energy cross-listing, from its definition. */
function crossSummary(tab) {
  const energy = SECTOR_TABS.find((t) => t.id === 'energy');
  const out = [];
  for (const st of energy.stages) {
    const subs = new Set();
    for (const c of tab.cross || []) {
      for (const subIds of [['oil'], ['gas'], ['coal'], ['nuclear'], ['emerging'], ['wind'], ['solar'], ['hydro'], ['geothermal']]) {
        for (const m of c.map({ subs: subIds, stages: [st.id] })) subs.add(m.sub);
      }
    }
    if (subs.size) out.push(`${st.label} to ${[...subs].map((id) => tab.subs.find((x) => x.id === id).name).join(' or ')}`);
  }
  return out.join('; ');
}

/** Method page: the stage mapping (plain label, economic type, NAICS codes), from the same schema the tab uses. */
function renderMethodSectors() {
  const host = document.getElementById('method-stage-map');
  if (!host) return;
  const rows = SECTOR_TABS.flatMap((sector) => sector.stages.map((st) => {
    const type = ECONOMIC_TYPES[st.economicType];
    const codes = st.naics.map((n) => `<a href="${escapeHtml(naicsUrl(n.code))}" target="_blank" rel="noopener noreferrer">${escapeHtml(n.code)}</a> ${escapeHtml(n.title)}`).join('; ');
    return `<li><strong>${escapeHtml(st.label)}</strong> = ${escapeHtml(type.label)} sector (${escapeHtml(type.plain.toLowerCase())}). NAICS ${codes}.</li>`;
  }));
  const tabsHost = document.getElementById('method-tab-map');
  if (tabsHost) {
    tabsHost.innerHTML = SECTOR_TABS.filter((t) => t.economicType).map((t) => {
      const type = ECONOMIC_TYPES[t.economicType];
      const segs = t.subs.map((sub) => `<li><strong>${escapeHtml(sub.name)}</strong>: ${escapeHtml(sub.copy)} NAICS ${sub.naics.map((n) => `<a href="${escapeHtml(naicsUrl(n.code))}" target="_blank" rel="noopener noreferrer">${escapeHtml(n.code)}</a> ${escapeHtml(n.title)}`).join('; ')}.</li>`).join('');
      const cross = (t.cross || []).length ? `<p class="method-cross">Energy stories also appear here by stage: ${escapeHtml(crossSummary(t))}.</p>` : '';
      const conv = t.convention ? `<p class="method-conv">${escapeHtml(t.convention.text)} Source: <a href="${escapeHtml(t.convention.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.convention.source.title)}</a>.</p>` : '';
      return `<details class="method-tab"><summary><strong>${escapeHtml(t.label)}</strong> = ${escapeHtml(type.label)} sector (${escapeHtml(type.plain.toLowerCase())}) · ${t.subs.length} segments</summary>${conv}<ul class="method-list">${segs}</ul>${cross}</details>`;
    }).join('');
  }
  host.innerHTML = `<ul class="method-list">${rows.join('')}</ul><p class="method-src">Codes and titles from <a href="${escapeHtml(OFFICIAL_SOURCES.naics.url)}" target="_blank" rel="noopener noreferrer">NAICS 2022 (U.S. Census Bureau)</a>; industry taxonomy from <a href="${escapeHtml(OFFICIAL_SOURCES.blsIndustries.url)}" target="_blank" rel="noopener noreferrer">BLS Industries at a Glance</a>.</p>`;
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
          <div class="overlay-kicker">Industry mind map</div>
          <h2>${escapeHtml(c.name)} ${protoBadge()}</h2>
          ${protoNote()}
          <p class="overlay-hint">Primary industries for this country. Click a node for upstream → midstream → downstream players. Single-click on the map opens the country panel; double-click / long-press opens this mind map.</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-ghost" data-to-desk>Country panel</button>
          <button type="button" class="btn-primary" data-close-overlay>Close</button>
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
    return `<div class="overlay-panel"><p class="section-note">No chain for this sector.</p><button type="button" class="btn-primary" data-back-mindmap>Back to mind map</button></div>`;
  }
  const stages = chainStages().map((stage) => {
    const players = chain[stage] || [];
    const cards = players.map((p) => `
      <button type="button" class="player-card" data-company="${p.id}">
        <div class="player-name">${escapeHtml(p.name)}</div>
        <div class="player-role">${escapeHtml(p.role)}</div>
        <div class="player-go">Company profile →</div>
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
          <div class="overlay-kicker">Value chain${chain.stub ? ' · stub' : ''}</div>
          <h2>${escapeHtml(c.name)} · ${escapeHtml(chain.label)} ${protoBadge()}</h2>
          ${protoNote()}
          <p class="overlay-hint">Upstream (inputs) → midstream (processing / transmission) → downstream (demand). Click a company for its prototype profile. All company names are invented.</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-ghost" data-back-mindmap>Mind map</button>
          <button type="button" class="btn-ghost" data-to-desk>Country panel</button>
          <button type="button" class="btn-primary" data-close-overlay>Close</button>
        </div>
      </div>
      <div class="chain-grid">${stages}</div>
    </div>`;
}

function renderCompanyDesk(c) {
  const co = getCompany(state.company);
  if (!co) {
    return `<div class="overlay-panel"><p class="section-note">Unknown company.</p><button type="button" class="btn-primary" data-back-chain>Back to chain</button></div>`;
  }
  const anns = (co.announcements || []).map((a) => `
    <article class="signal-card">
      <div class="top"><h3>${escapeHtml(a.title)}</h3>${verifyBadge({ verification: { status: 'sample' } })}</div>
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
          <div class="overlay-kicker">Company profile${co.stub ? ' · stub' : ''}</div>
          <h2>${escapeHtml(co.name)} ${protoBadge()}</h2>
          ${protoNote()}
          <p class="snapshot">${escapeHtml(co.role)} · ${escapeHtml(co.stage)} · ${escapeHtml(co.countryName)} · ${escapeHtml(co.sectorLabel)}</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-ghost" data-back-chain>Value chain</button>
          <button type="button" class="btn-ghost" data-back-mindmap>Mind map</button>
          <button type="button" class="btn-primary" data-close-overlay>Close</button>
        </div>
      </div>
      <div class="company-body">
        <section>
          <h3 class="company-section">Recent major announcements</h3>
          <p class="section-note">Invented items for UX testing, not filings.</p>
          <div class="signal-list">${anns}</div>
        </section>
        <section>
          <h3 class="company-section">Working on next · pipeline</h3>
          <p class="section-note">Invented forward book, illustrative only.</p>
          <div class="pipeline-list">${pipe}</div>
        </section>
      </div>
    </div>`;
}

function wireOverlay(root) {
  const close = () => (state.desk ? navigate({ desk: null }) : navigate({ view: 'desk', company: null }));
  $$('[data-desk-tab]', root).forEach((b) => b.addEventListener('click', () => navigate({ desk: b.dataset.deskTab })));
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

/* ---------- PROTOTYPE labeling (one badge, one explainer, used everywhere) ---------- */
function protoBadge(extra = '') {
  return `<span class="proto-badge${extra ? ` ${extra}` : ''}" title="${escapeHtml(PROTOTYPE.title)}">${PROTOTYPE.label}</span>`;
}
function exampleTag() {
  return `<span class="example-tag" title="${escapeHtml(PROTOTYPE.title)}">Example data</span>`;
}
function protoNote() {
  return `<p class="proto-note">${escapeHtml(PROTOTYPE.note)}</p>`;
}

/* ---------- Indicators (Activity, Prices, Capital): "What changed" for the selected place ---------- */
function currentPlace() { return placeOf(state); }
function currentPlaceLabel() { return placeLabel(currentPlace(), placeNames()); }
function indicatorModel(place = currentPlace()) {
  return placeIndicators(place, { us: statsUs, benchmarks: statsBench, world: statsWorld });
}
/** Parent place button for empty states ("See United States"). */
function parentLink(place) {
  const par = parentPlace(place);
  if (!par) return { parentLabel: '', parentAttr: '' };
  return { parentLabel: placeLabel(par, placeNames()), parentAttr: `data-goto-place="${escapeHtml(JSON.stringify(par))}"` };
}
const CHECKED_DAY = () => dayText(coverageData?.checked || seatsData?.checked || '');

function renderWhatChanged() {
  const place = currentPlace();
  const m = indicatorModel(place);
  return whatChangedHtml(m, { placeLabel: currentPlaceLabel(), checked: CHECKED_DAY(), ...(m.empty ? parentLink(place) : {}) });
}

function renderDesks() {
  const place = currentPlace();
  const m = indicatorModel(place);
  const counts = groupCounts(m);
  const active = DESKS.find((d) => d.id === state.desk) || DESKS.find((d) => d.id === 'prices');
  const tabs = DESKS.map((d) => `<button type="button" class="desk-tab${d.id === active.id ? ' active' : ''}" data-desk-tab="${d.id}" role="tab" aria-selected="${d.id === active.id}">
      <span class="desk-tab-name">${escapeHtml(d.title)}</span><span class="desk-tab-n${counts[d.id] ? '' : ' is-zero'}">${counts[d.id]}</span></button>`).join('');
  const group = m.groups.find((g) => g.id === active.id);
  const body = group
    ? `<div class="wc-lines wc-lines-full">${group.lines.map((l) => lineHtml(l, { spark: l.spark ? `<p class="wc-spark"><span class="k">Trend</span> ${sparkSvg(l.spark)}</p>` : '' })).join('')}</div>
       ${m.hidden.length ? `<p class="wc-hidden">${m.hidden.map(escapeHtml).join(' ')}</p>` : ''}`
    : notCoveredHtml({ field: active.title, planned: m.planned, checked: CHECKED_DAY(), ...parentLink(place) });
  const sources = active.sources.map((src) => `<li><a href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.name)}</a></li>`).join('');
  return `
    <div class="overlay-panel desks-panel" role="dialog" aria-modal="true" aria-labelledby="desks-title">
      <div class="overlay-head">
        <div>
          <div class="overlay-kicker">Indicators · ${escapeHtml(currentPlaceLabel())}</div>
          <h2 id="desks-title">${escapeHtml(active.title)}</h2>
          <p class="overlay-hint">${escapeHtml(active.scope)}</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-primary" data-close-overlay>Close</button>
        </div>
      </div>
      <div class="desk-tabs" role="tablist" aria-label="Indicators">${tabs}</div>
      <div class="desk-body">
        ${body}
        <dl class="desk-spec">
          <dt>Update trigger</dt><dd>${escapeHtml(active.trigger)}</dd>
          <dt>Sources</dt><dd><ul>${sources}</ul></dd>
        </dl>
        <p class="desk-foot">Every line: latest value, change vs the prior reading, as-of date and source. Values as published; sources may revise them. Indicators follow the place you pick on the map. Not investment advice. Not real-time.</p>
      </div>
    </div>`;
}

/** Diesel moved from Prices to the Energy tab: one sourced line, US retail. */
function energyPricesHtml() {
  const place = currentPlace();
  if (!(place.level === 'world' || (place.level === 'country' && place.country === 'us'))) return '';
  const r = renderableRecords(pricesDesk).find((x) => x.id === 'prices.diesel-us-retail');
  if (!r) return '';
  const c = r.current;
  const ch = c.prior ? changeOf(c.value, c.prior.value, { unit: c.unit, decimals: 3 }) : null;
  const line = {
    id: r.id, label: 'Diesel, US retail', display: formatValue(c.value, r.id), unit: c.unit, change: ch,
    asOfText: asOfLabel(c.asOf, 'weekly'), prior: c.prior ? { display: `${formatValue(c.prior.value, r.id)} ${c.unit}`, asOfText: asOfLabel(c.prior.asOf, 'weekly') } : null,
    detail: r.industrialUse, caveat: r.caveat, source: { name: c.sourceName, url: c.sourceUrl }, stale: isStale(r),
  };
  return `<div class="energy-prices"><span class="k">Energy prices</span>${lineHtml(line)}</div>`;
}

function shortLabel(name) {
  if (!name) return '';
  return name.length > 22 ? name.slice(0, 20) + '…' : name;
}

/* ---------- Leadership accordion ---------- */
function renderLeadRole(role) {
          const badges = roleBadge(role).map((b) => `<span class="badge-sm ${b === 'SAMPLE' || b === 'ESTIMATE' ? 'sample' : 'kind'}">${escapeHtml(b)}</span>`).join(' ');
          const contact = role.contact || {};
          const links = [];
          if (contact.site && contact.site !== role.source?.url) links.push(`<a href="${escapeHtml(contact.site)}" target="_blank" rel="noopener noreferrer">Official site</a>`);
          if (contact.form) links.push(`<a href="${escapeHtml(contact.form)}" target="_blank" rel="noopener noreferrer">Public form</a>`);
          if (contact.switchboard) links.push(`<span class="lead-switch">${escapeHtml(contact.switchboard)}</span>`);
          if (contact.email) links.push(`<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>`);
          const asOf = role.asOf ? `<div><span class="lead-k">As of</span> ${escapeHtml(role.asOf)}</div>` : '';
          const srcLine = role.source?.url
            ? `<div><span class="lead-k">Source</span> <a href="${escapeHtml(role.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(role.source.name || 'Official source')}</a></div>`
            : `<div><span class="lead-k">Source</span> <span class="ink-mute">source pending</span></div>`;
          const respLine = role.responseTime?.text
            ? `<div><span class="lead-k">Response</span> ${escapeHtml(role.responseTime.text)} ${role.responseTime.badge ? `<span class="badge-sm sample" title="Unverified estimate, not a measured response time">${escapeHtml(role.responseTime.badge)}</span>` : ''}</div>` : '';
          const kindTag = role.kind && role.kind !== role.title ? ` <span class="lead-kind">${escapeHtml(role.kind)}</span>` : '';
          const sinceLine = role.since?.text
            ? `<div><span class="lead-k">Since</span> ${escapeHtml(role.since.text)}${role.since.confirmedOn && role.since.confirmedOn !== role.source?.url ? ` (<a href="${escapeHtml(role.since.confirmedOn)}" target="_blank" rel="noopener noreferrer">official page</a>)` : ''}</div>`
            : (role.sinceNote ? `<div><span class="lead-k">Since</span> <span class="ink-mute">${escapeHtml(role.sinceNote)}</span></div>` : '');
          const termLine = role.term?.text
            ? `<div><span class="lead-k">Term</span> ${escapeHtml(role.term.text)} ${role.term.badge ? `<span class="badge-sm sample">${escapeHtml(role.term.badge)}</span>` : ''}</div>` : '';
          if (role.notCovered) {
            return `
        <article class="lead-role lead-pending" data-not-covered>
          <div class="lead-role-top"><div>
            <div class="lead-title">${escapeHtml(role.title)}${role.kind && role.kind !== role.title ? ` <span class="lead-kind">${escapeHtml(role.kind)}</span>` : ''}</div>
            <div class="lead-name ink-mute">${NOT_COVERED}</div>
          </div></div>
          <div class="lead-meta"><div class="ink-mute">Planned source: ${role.plannedSource ? `<a href="${escapeHtml(role.plannedSource)}" target="_blank" rel="noopener noreferrer">${escapeHtml(role.plannedSource.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a> (official site)` : 'official government site'}. Checked ${escapeHtml(dayText(role.checked || ''))}.</div></div>
        </article>`;
          }
          if (role.sourcePending) {
            return `
        <article class="lead-role lead-pending">
          <div class="lead-role-top"><div>
            <div class="lead-title">${escapeHtml(role.title)}</div>
            <div class="lead-name ink-mute">Not filled · source pending</div>
          </div></div>
          <div class="lead-meta"><div class="ink-mute">${escapeHtml(role.pendingNote || 'No official source verified yet.')}</div>${asOf}</div>
        </article>`;
          }
          return `
        <article class="lead-role">
          <div class="lead-role-top">
            <div>
              <div class="lead-title">${escapeHtml(role.title)}${kindTag}</div>
              <div class="lead-name">${escapeHtml(role.name)}${role.party ? ` <span class="lead-party">(${escapeHtml(PARTY_ABBR[role.party] || role.party)})</span>` : ''}${role.vacant ? ' <span class="lead-party">seat vacant</span>' : ''}</div>
            </div>
            <div class="lead-badges">${badges}</div>
          </div>
          <div class="lead-contact">${links.join(' · ') || (role.source?.url ? '' : '<span class="ink-mute">No public channel listed</span>')}</div>
          <div class="lead-meta">
            ${srcLine}
            ${asOf}
            ${sinceLine}
            ${termLine}
            ${respLine}
          </div>
        </article>`;
}


const PARTY_ABBR = { R: 'R', D: 'D', I: 'I', ID: 'I', Republican: 'R', Democratic: 'D', Independent: 'I' };
function renderLeadGroups(block) {
  if (!block?.groups?.length) return '';
  return block.groups.map((g) => {
    let inner;
    if (g.compact) {
      const rows = (g.rows || []).map((r) => `<li class="lead-row${r.vacant ? ' is-vacant' : ''}"><span class="lr-d">${escapeHtml(r.district)}</span><span class="lr-n">${r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.name)}</a>` : escapeHtml(r.name)}</span><span class="lr-p">${escapeHtml(r.vacant ? 'vacant' : (PARTY_ABBR[r.party] || r.party || ''))}</span></li>`).join('');
      inner = `<ul class="lead-rows"><li class="lead-row lead-row-head"><span class="lr-d">District</span><span class="lr-n">Member</span><span class="lr-p">Party</span></li>${rows}</ul>
        <p class="lead-group-src">Source <a href="${escapeHtml(g.source?.url || '')}" target="_blank" rel="noopener noreferrer">${escapeHtml(g.source?.name || '')}</a> · as of ${escapeHtml(g.asOf || '')}</p>`;
    } else {
      inner = (g.roles || []).map(renderLeadRole).join('') || '<p class="section-note">None listed.</p>';
    }
    return `<details class="lead-group"${g.collapsed ? '' : ' open'}><summary>${escapeHtml(g.title)}</summary><div class="lead-group-body">${inner}</div></details>`;
  }).join('');
}

function leadPlanned(level) {
  if (level === 'city') return 'the city government site and mayor\'s office page';
  if (level === 'admin1') return 'the state-equivalent government site and governor or premier page';
  return 'the head of state and head of government pages on the official government site';
}

function renderLeadershipAccordion() {
  if (!state.country) return '';
  const af = findAdminFeature(admin1Geo, state.admin1);
  const cf = findCityFeature(citiesGeo, state.city);
  const stack = leadershipStack(leadershipCatalog, {
    country: state.country,
    admin1: state.admin1,
    city: state.city,
    admin1Name: af?.properties?.name,
    cityName: cf?.properties?.name,
  });
  const hasDrill = admin1Countries.has(state.country);
  const finerNote = !hasDrill
    ? `<p class="lead-finer-note">Finer map coming: state-equivalent borders not seeded for this country yet. The country panel still works.</p>`
    : '';

  if (!stack.length) {
    return `
      <details class="leadership-acc">
        <summary>Leadership <span class="tier-tag">public channels</span></summary>
        <div class="leadership-body">
          ${notCoveredHtml({ field: 'Leadership', planned: leadPlanned(state.city ? 'city' : state.admin1 ? 'admin1' : 'country'), checked: CHECKED_DAY() })}
          ${finerNote}
        </div>
      </details>`;
  }

  const levels = stack.map((block, idx) => {
    const empty = isEmptyLeadership(block);
    const roles = empty
      ? notCoveredHtml({ field: 'Leadership', planned: leadPlanned(block.level), checked: CHECKED_DAY() })
      : (block.roles || []).map(renderLeadRole).join('');
    const groups = renderLeadGroups(block);
    const nest = idx > 0 ? ' lead-level-nested' : '';
    return `
      <div class="lead-level${nest}">
        <div class="lead-level-label">${escapeHtml(block.label || block.key)} · ${escapeHtml(levelLabel(block.level))}</div>
        ${roles}
        ${groups}
      </div>`;
  }).join(stack.length > 1 ? '<div class="lead-more">Parent state equivalent</div>' : '');

  const focusTag = state.admin1 || state.city ? 'public channels' : 'public channels';
  return `
    <details class="leadership-acc">
      <summary>Leadership <span class="tier-tag">${focusTag}</span></summary>
      <div class="leadership-body">
        <p class="section-note">Public sites, switchboards and forms only, never private phones. Verified entries list an official source and as-of date; seats we have not confirmed say source pending or Not yet covered. Country-level rosters stay on the country panel; a state equivalent shows its own public channels.</p>
        ${finerNote}
        ${levels}
      </div>
    </details>`;
}

/** Method page: the coverage line built from the data files (data/coverage.json). */
function renderCoverageLine() {
  const el = document.getElementById('method-coverage');
  if (!el) return;
  const line = coverageLine(coverageData);
  el.hidden = !line;
  el.textContent = line ? `${line} Counted from the data files on ${dayText(coverageData.checked)}.` : '';
}

/* ---------- Who's in the seat ---------- */
function renderSeats() {
  const place = currentPlace();
  const model = seatsFor(place, seatsData || {});
  const names = placeNames();
  const news = liveItems().filter(isSeatChange);
  const inPlace = (i) => {
    const loc = i.loc || { countries: i.countryId ? [String(i.countryId).toLowerCase()] : [], admin1: [], cities: [] };
    if (!(loc.countries || []).includes(place.country)) return false;
    if (place.level === 'admin1') return (loc.admin1 || []).includes(place.admin1);
    if (place.level === 'city') return (loc.cities || []).includes(place.city);
    return true;
  };
  const placed = place.level === 'world' ? news : news.filter(inPlace);
  return seatsHtml(model, {
    placeLabel: placeLabel(place, names), news: placed, open: !!state.seats,
    ...(model.seats.length ? {} : parentLink(place)),
  });
}
/** Scroll "Who's in the seat" into view (from #seats or an old #d=people link). */
function revealSeats() {
  requestAnimationFrame(() => {
    const el = document.getElementById('seats-panel');
    if (!el) return;
    el.open = true;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    el.querySelector('summary')?.focus({ preventScroll: true });
  });
}
/** Shared wiring for the place panels: parent links in empty states, seats toggle in the URL. */
function wirePanelCommon(root) {
  $$('[data-goto-place]', root).forEach((b) => b.addEventListener('click', () => {
    let p; try { p = JSON.parse(b.dataset.gotoPlace); } catch { return; }
    navigate({ country: p.country || null, admin1: p.admin1 || null, city: p.city || null, view: 'desk', tab: 'signals', sector: null, region: null, company: null });
  }));
  const seats = $('#seats-panel', root);
  seats?.addEventListener('toggle', () => {
    if (seats.open === !!state.seats) return;
    state.seats = seats.open;
    const h = buildHash(state);
    history.replaceState(null, '', `${location.pathname}${location.search}${h ? `#${h}` : ''}`);
  });
}

/* ---------- Panel ---------- */
function renderPanel() {
  const root = $('#country-panel');
  const c = getCountry(state.country);
  if (!c && state.country) {
    // Any map country without an example profile: sourced pieces only.
    const af = findAdminFeature(admin1Geo, state.admin1);
    const cf = findCityFeature(citiesGeo, state.city);
    const name = countryName(state.country);
    const areaLabel = [name, af?.properties?.name, cf ? String(cf.properties.name).replace(/\s+/g, ' ') : null].filter(Boolean).join(' · ');
    const drillHint = admin1Countries.has(state.country)
      ? 'Drill: World → Country → State equivalent → City.'
      : 'Finer map coming for this country.';
    root.innerHTML = `
      <div class="country-head">
        <h2>${escapeHtml(areaLabel)}</h2>
        ${renderWhatChanged()}
        ${renderLeadershipAccordion()}
        ${renderSeats()}
        <div class="desk-actions"><span class="desk-hint">${escapeHtml(drillHint)}</span></div>
      </div>`;
    wirePanelCommon(root);
    return;
  }
  if (!c) {
    root.innerHTML = `
      <div class="panel-home">
        <section class="home-index" aria-label="World">
          <div class="home-head"><h2>World</h2></div>
          <p class="home-help">Pick a place on the map; the numbers, seats and news follow it.</p>
        </section>
        ${renderWhatChanged()}
        ${renderSeats()}
      </div>`;
    wirePanelCommon(root);
    return;
  }

  const m = c.metrics;
  const tier = c.tier === 'full' ? 'example country profile' : 'example stub';
  let body = '';
  if (c.tier === 'stub') {
    body = `
      <div class="block-label">Country profile ${exampleTag()}</div>
      <div class="stub-note">
        <strong>${escapeHtml(c.name)}</strong> is a lighter prototype stub; its scores are illustrative example data.
        Open the <strong>industry mind map</strong> for invented primary industries and light value-chain stubs.
      </div>
      <div class="tab-body">
        <p class="section-note">${escapeHtml(c.snapshot)}</p>
      </div>`;
  } else {
    body = `
      <div class="block-label">Country profile ${exampleTag()} <span class="block-label-note">${escapeHtml(tier)}: signals, industries and companies below are illustrative, not sourced</span></div>
      <div class="tabs" role="tablist">
        ${TABS.map((t) => `<button type="button" class="tab ${state.tab === t ? 'active' : ''}" data-tab="${t}" role="tab">${escapeHtml(TAB_LABELS[t] || t)}</button>`).join('')}
      </div>
      <div class="tab-body">${renderTab(c)}</div>`;
  }

  const areaLabel = (() => {
    const af = findAdminFeature(admin1Geo, state.admin1);
    const cf = findCityFeature(citiesGeo, state.city);
    if (cf) return `${c.name} · ${af?.properties?.name || ''} · ${cf.properties.name}`.replace(/ · $/,'').replace(/ ·  · /,' · ');
    if (af) return `${c.name} · ${af.properties.name}`;
    return c.name;
  })();
  const mmOk = mindMapAllowed(state.admin1, state.city);
  const drillHint = admin1Countries.has(c.id)
    ? 'Drill: World → Country → State equivalent → City. Mind map only at country level.'
    : 'Finer map coming for this country. Mind map at country level.';

  root.innerHTML = `
    <div class="country-head">
      <h2>${escapeHtml(areaLabel)}</h2>
      ${renderWhatChanged()}
      <p class="snapshot">${exampleTag()} ${escapeHtml(c.snapshot)}</p>
      <div class="block-label">Scores ${exampleTag()}</div>
      <div class="metrics" aria-label="Prototype scores, example data">
        <div class="metric is-proto"><div class="label">Stability <span class="metric-unit">score 0–100</span></div><div class="value">${m.stability}</div><div class="hint">${metricLabel(m.stability)} · example</div></div>
        <div class="metric is-proto"><div class="label">Build pressure <span class="metric-unit">score 0–100</span></div><div class="value">${m.frontierPressure}</div><div class="hint">${metricLabel(m.frontierPressure)} · example</div></div>
        <div class="metric is-proto"><div class="label">Headroom <span class="metric-unit">score 0–100</span></div><div class="value">${m.opportunity}</div><div class="hint">${metricLabel(m.opportunity)} · example</div></div>
      </div>
      ${renderLeadershipAccordion()}
      ${renderSeats()}
      <div class="desk-actions">
        <button type="button" class="btn-primary" data-open-mindmap ${mmOk ? '' : 'disabled title="Mind map is country-level only"'}>Mind map</button>
        <span class="desk-hint">Map: single-click = focus · double-click / long-press = mind map (country only). ${escapeHtml(drillHint)}</span>
      </div>
    </div>
    ${body}`;

  $$('.tab', root).forEach((btn) => {
    btn.addEventListener('click', () => navigate({ tab: btn.dataset.tab, sector: null, region: null, view: 'desk' }));
  });
  $('[data-open-mindmap]', root)?.addEventListener('click', () => {
    if (!mindMapAllowed(state.admin1, state.city)) return;
    navigate({ view: 'mindmap', company: null, sector: null, region: null, admin1: null, city: null });
  });
  wirePanelCommon(root);
  wireTabInteractions(c, root);
}

function renderTab(c) {
  const tab = state.tab;
  if (tab === 'signals') {
    const list = filterSignals(c, { sector: state.sector, region: state.region });
    const filterNote = state.sector || state.region
      ? `<div class="filter-bar"><span class="section-note" style="margin:0">Filtered · ${escapeHtml(state.sector || state.region)}</span><button type="button" class="clear" data-clear>Clear filter</button></div>`
      : `<p class="section-note">${protoBadge('proto-badge-sm')} Invented headlines. “w” is an invented 0–100 impact weight.</p>`;
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
        ${note ? `<div class="opening-card" style="margin-bottom:0.75rem"><div class="gap-label">Constraint note ${protoBadge('proto-badge-sm')}</div><h3>${escapeHtml(note.title.replace(/ frontier$/, ' constraint'))}</h3><p>${escapeHtml(note.gap)}</p><div class="horizon">${escapeHtml(note.horizon)}</div></div>` : ''}
        <div class="signal-list">${sigs.map(signalCard).join('') || '<p class="section-note">No sector signals in the prototype set.</p>'}</div>`;
    }
    return `<p class="section-note">${protoBadge('proto-badge-sm')} Sectors for this prototype profile. Click to filter its invented signals, or open the <strong>Mind map</strong> for value chains.</p><div class="grid-cards">${cards}</div>${detail}`;
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
        <div class="signal-list">${sigs.map(signalCard).join('') || '<p class="section-note">No regional signals in the prototype set.</p>'}</div>`;
    }
    return `<p class="section-note">${protoBadge('proto-badge-sm')} Subregions for this prototype profile.</p><div class="grid-cards">${cards}</div>${detail}`;
  }
  if (tab === 'openings') {
    const cards = (c.openings || []).map((o) => `
      <div class="opening-card">
        <div class="gap-label">Binding constraint</div>
        <h3>${escapeHtml(o.title)}</h3>
        <p>${escapeHtml(o.gap)}</p>
        <div class="horizon">Horizon · ${escapeHtml(o.horizon)}</div>
        <div class="signal-meta">${o.sectors.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
      </div>`).join('');
    return `<p class="section-note">${protoBadge('proto-badge-sm')} Prototype constraints: invented examples of what binds a build-out (power, permits, skills, logistics). Not research, not a recommendation.</p><div class="opening-list">${cards}</div>`;
  }
  return '';
}

function signalCard(s) {
  return `
    <article class="signal-card">
      <div class="top"><h3>${escapeHtml(s.title)}</h3><span class="weight" title="Invented impact weight (prototype)">w${s.weight}</span></div>
      <p>${escapeHtml(s.blurb)}</p>
      <div class="signal-meta">
        ${verifyBadge({ verification: { status: 'sample' } })}
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

/* ---------- News column: follows the selected map place ---------- */
let railCategory = null;
let railExpanded = false;
let railPlaceKey = '';

function liveItems() {
  return Array.isArray(liveFeed?.items) ? liveFeed.items : [];
}

/** Small colored verification badge; tap / hover lists the outlets. */
function verifyBadge(item, { pop = false } = {}) {
  const v = item.verification || {};
  const status = v.status && STATUS_META[v.status] ? v.status : 'unconfirmed';
  const meta = STATUS_META[status];
  if (!pop) {
    return `<span class="vbadge vb-${status}" title="${escapeHtml(meta.hint)}">${escapeHtml(meta.label)}</span>`;
  }
  const sources = v.sources || [];
  const rows = sources.map((src) => `
      <li>${src.url ? `<a href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.name)}</a>` : escapeHtml(src.name)}${src.primary ? ' <span class="vpop-primary">primary</span>' : ''}</li>`).join('');
  const heading = status === 'analysis' ? 'Published by' : sources.length > 1 ? `Reported by ${sources.length} outlets` : 'Reported by';
  const confirmed = status === 'confirmed' && v.confirmedBy?.length
    ? `<p class="vpop-note">Confirmed by ${escapeHtml(v.confirmedBy.join(', '))} (subject / official source).</p>` : '';
  return `
    <span class="vwrap">
      <button type="button" class="vbadge vb-${status}" aria-expanded="false" aria-label="${escapeHtml(meta.label)}: show sources" data-vbadge>${escapeHtml(meta.label)}</button>
      <span class="vpop" role="tooltip">
        <span class="vpop-hint">${escapeHtml(meta.hint)}</span>
        <span class="vpop-h">${escapeHtml(heading)}</span>
        <ul>${rows || '<li>n/a</li>'}</ul>
        ${confirmed}
        ${v.curated ? `<p class="vpop-note">Hand-verified by the Ledger${v.note ? `: ${escapeHtml(v.note)}` : '.'}</p>` : ''}
      </span>
    </span>`;
}

function railLegend() {
  return `<p class="rail-legend"><span class="vbadge vb-confirmed">Confirmed</span> subject / official source confirmed · <span class="vbadge vb-multiple">Multiple sources</span> 2+ independent outlets, not yet confirmed · <span class="vbadge vb-unconfirmed">Unconfirmed</span> factual claim, one non-primary outlet · <span class="vbadge vb-analysis">Analysis</span> opinion / commentary / trend / explainer. Tap a badge for outlets.</p>`;
}

function wireVerifyBadges(root) {
  $$('[data-vbadge]', root).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wrap = btn.closest('.vwrap');
      const open = !wrap.classList.contains('open');
      $$('.vwrap.open', document).forEach((w) => {
        w.classList.remove('open');
        w.querySelector('[data-vbadge]')?.setAttribute('aria-expanded', 'false');
      });
      wrap.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

/** Name lookups for World > Country > State equivalent > City. */
function placeNames() {
  return {
    country: (id) => getCountry(id)?.name || countryName(id),
    admin1: (id) => findAdminFeature(admin1Geo, id)?.properties?.name || id,
    city: (id) => String(findCityFeature(citiesGeo, id)?.properties?.name || id).replace(/\s+/g, ' '),
  };
}

/** Where a story is filed, for the card's top line. */
function storyPlace(i, names) {
  const cs = i.loc?.countries || (i.countryId ? [i.countryId] : []);
  if (!cs.length) return 'World';
  const first = names.country(cs[0]);
  return cs.length > 1 ? `${first} +${cs.length - 1}` : first;
}

function newsCard(i, names, extra = '') {
  const cat = categoryOf(i);
  return `
      <article class="feed-item is-live" data-real="1" data-vstatus="${escapeHtml(i.verification?.status || '')}" data-cat="${cat}">
        <div class="country">
          <span>${escapeHtml(storyPlace(i, names))} · ${escapeHtml(i.source || '')}</span>
          <span class="feed-badges">${verifyBadge(i, { pop: true })}</span>
        </div>
        <a class="title" href="${escapeHtml(i.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(i.title)}</a>
        <div class="meta">
          <span>${escapeHtml(i.publishedLabel || dateStampShort(i.published))}</span>
          <span class="badge-sm kind">${escapeHtml(cat === 'general' ? (i.verification?.status === 'analysis' ? 'analysis' : 'news') : CATEGORY_LABELS[cat].toLowerCase())}</span>${isSeatChange(i) ? '<span class="badge-sm seat-tag" title="Reports a confirmation, appointment or resignation in a named seat">seat change</span>' : ''}${extra}
          ${xLinkHtml(xQueryForStory(i))}
        </div>
      </article>`;
}

function railCategoryChips(col) {
  const chip = (id, label, n) => `<button type="button" class="ncat${(railCategory || 'all') === id ? ' active' : ''}" data-ncat="${id}" aria-pressed="${(railCategory || 'all') === id}">${escapeHtml(label)} <span class="vf-n">${n}</span></button>`;
  return `<div class="ncats" role="group" aria-label="Filter by topic">
    ${chip('all', 'All', col.counts.all)}
    ${CATEGORIES.map((c) => chip(c, CATEGORY_LABELS[c], col.counts[c])).join('')}
  </div>`;
}

/** Breadcrumb for the column header: World › United States › Texas. */
function railPath(place, names) {
  const bits = [];
  let p = place;
  while (p) { bits.unshift(placeLabel(p, names)); p = parentPlace(p); }
  return bits.length > 1 ? bits.slice(0, -1).join(' › ') + ' ›' : '';
}

function renderFeed() {
  const feed = $('#feed');
  if (!feed) return;
  const live = liveItems();
  const sub = $('#rail-sub');
  const title = $('#rail-title');
  const level = $('#rail-level');
  const path = $('#rail-path');
  const place = placeOf(state);
  const key = `${place.level}|${place.country || ''}|${place.admin1 || ''}|${place.city || ''}`;
  if (key !== railPlaceKey) { railPlaceKey = key; railExpanded = false; }
  const names = placeNames();
  const label = placeLabel(place, names);
  if (title) title.textContent = label;
  if (level) level.textContent = LEVEL_NAMES[place.level];
  if (path) path.textContent = railPath(place, names);
  $('.rail')?.setAttribute('aria-label', `News: ${label}`);

  if (live.length) {
    const col = buildColumn(live, place, { names, category: railCategory });
    if (sub) {
      const gen = liveFeed?.generatedAt ? ` · updated ${dateStampShort(liveFeed.generatedAt)}` : '';
      sub.textContent = `Top stories · ${col.counts.all} tagged here${gen} · not real-time`;
    }
    const cards = (list) => list.map((i) => newsCard(i, names)).join('');
    let body = '';
    if (railExpanded) {
      const all = rankedForPlace(live, place, { category: railCategory }).slice(0, 30);
      body = cards(all) + `<button type="button" class="feed-more-btn" data-feed-less>Show top stories only</button>`;
    } else {
      if (col.emptyText) body += `<p class="feed-note" data-feed-empty>${escapeHtml(col.emptyText)}</p>`;
      body += cards(col.primary);
      if (col.fewText) body += `<p class="feed-note">${escapeHtml(col.fewText)}</p>`;
      for (const g of col.more) {
        body += `<h3 class="feed-more-h" data-more-level="${g.level}">${escapeHtml(g.label)}</h3>` + cards(g.items);
      }
      if (col.total > col.primary.length) {
        body += `<button type="button" class="feed-more-btn" data-feed-more>Show all ${Math.min(col.total, 30)} stories for ${escapeHtml(label)}</button>`;
      }
    }
    feed.innerHTML = railCategoryChips(col) + body
      + `<details class="rail-legend-wrap"><summary>What the badges mean</summary>${railLegend()}</details>`;
    $$('[data-ncat]', feed).forEach((btn) => {
      btn.addEventListener('click', () => {
        railCategory = btn.dataset.ncat === 'all' ? null : btn.dataset.ncat;
        railExpanded = false;
        renderFeed();
      });
    });
    $('[data-feed-more]', feed)?.addEventListener('click', () => { railExpanded = true; renderFeed(); });
    $('[data-feed-less]', feed)?.addEventListener('click', () => { railExpanded = false; renderFeed(); });
    wireVerifyBadges(feed);
    return;
  }

  if (liveFeed === null) {
    if (sub) sub.textContent = 'Loading stories…';
    feed.innerHTML = '';
    return;
  }
  // Fallback SAMPLE (live file missing)
  let items = globalFeed(30);
  const filterId = state.country || null;
  if (filterId && COUNTRIES[filterId]) items = items.filter((i) => i.countryId === filterId);
  if (sub) {
    sub.textContent = filterId
      ? `Filtered to ${COUNTRIES[filterId]?.name || countryName(filterId)} · PROTOTYPE fallback`
      : 'PROTOTYPE fallback · live news not loaded';
  }
  feed.innerHTML = items.map((i) => `
    <article class="feed-item" data-c="${i.countryId}">
      <div class="country"><span>${escapeHtml(i.countryName)}</span>${verifyBadge({ verification: { status: 'sample' } })}</div>
      <div class="title">${escapeHtml(i.title)}</div>
      <div class="meta"><span>${escapeHtml(i.date)}</span><span>w${i.weight}</span></div>
    </article>`).join('') || '<p class="feed-note">No stories to show.</p>';
  $$('.feed-item', feed).forEach((el) => {
    el.addEventListener('click', () => navigate({ country: el.dataset.c, view: 'desk', tab: 'signals', sector: null, region: null, company: null }));
  });
}

function dateStampShort(iso) {
  if (!iso) return 'n/a';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'n/a';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

/** Show the left-column $ only when the empty space under the details can hold it. */
function watchPanelDollar() {
  const el = document.getElementById('panel-dollar');
  if (!el || typeof ResizeObserver === 'undefined') return;
  const check = () => el.classList.toggle('is-roomy', el.clientHeight >= 260);
  new ResizeObserver(check).observe(el);
  check();
}

async function loadStats() {
  const get = async (p) => { try { const r = await fetch(p, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } };
  [statsUs, statsWorld, statsBench, seatsData, coverageData, sectorsData, energyMixData] = await Promise.all([
    get('./data/stats/us.json'), get('./data/stats/world.json'), get('./data/stats/benchmarks.json'),
    get('./data/seats.json'), get('./data/coverage.json'), get('./data/stats/sectors.json'), get('./data/stats/energy-mix.json'),
  ]);
  if (seatsData && validateSeats(seatsData).length) seatsData = null;
  renderCoverageLine();
  if (state.country) renderPanel(); else renderPanel();
  if (state.desk || state.stab) renderOverlay();
}

async function loadPricesDesk() {
  try {
    const res = await fetch('./data/desks/prices.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    pricesDesk = await res.json();
  } catch {
    pricesDesk = { records: [] };
  }
  if (!state.country) renderPanel();
  if (state.desk) renderOverlay();
}

async function loadLiveFeed() {
  try {
    const res = await fetch('./data/signals-live.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    liveFeed = await res.json();
    // Client fallback: classify if the feed predates fetcher-side statuses
    liveFeed.items = ensureVerification(liveFeed.items || []);
  } catch {
    liveFeed = { items: [], itemCount: 0 };
  }
  renderFeed();
  if (state.stab) renderOverlay();
}

/* Header "Example data" badge: only while the view shows example scores
   (an example country profile, its mind map, chains or companies). Hidden on
   the World home, sourced-only countries and the Indicators overlay. */
function viewShowsExampleScores(st, hasProfile) {
  return !st.desk && !st.stab && !!st.country && !!hasProfile;
}
function syncExampleBadge() {
  const b = $('#header-example-badge');
  if (b) b.hidden = !viewShowsExampleScores(state, getCountry(state.country));
}

function render() {
  paintMapSelection();
  renderDrillLayer();
  renderBreadcrumb();
  renderPanel();
  renderFeed();
  renderOverlay();
  syncExampleBadge();
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

function wireAtlasLegend() {
  const label = $('#map-label');
  const toggle = $('#map-label-toggle');
  if (!label || !toggle) return;
  const setOpen = (open) => {
    label.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!label.classList.contains('is-open'));
  });
  document.addEventListener('click', (e) => {
    if (!label.classList.contains('is-open')) return;
    if (e.target.closest?.('#map-label')) return;
    setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && label.classList.contains('is-open')) setOpen(false);
  });
}


/** Reorient: back to the top of the page (the map and the selected place). Keeps the selection. */
function reorientToTop() {
  const raw = (location.hash || '').replace(/^#/, '');
  if (raw === 'about') {
    history.pushState(null, '', location.pathname + location.search);
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  const stage = $('.map-stage');
  if (stage) {
    if (!stage.hasAttribute('tabindex')) stage.setAttribute('tabindex', '-1');
    stage.focus({ preventScroll: true });
  }
}

function wireMethodTop() {
  const btn = $('#about-top');
  btn?.addEventListener('click', (e) => {
    e.preventDefault();
    reorientToTop();
  });
  // The header stays pinned, but the map scrolls away. Once it has, a compact
  // "Top" button shows in the header so the reorient control is always one tap away.
  const top = $('#reorient-top');
  const stage = $('.map-stage');
  const header = $('.site-header');
  if (!top || !stage || !header) return;
  top.addEventListener('click', (e) => {
    e.preventDefault();
    reorientToTop();
  });
  const show = (away) => {
    top.hidden = !away;
    header.classList.toggle('is-away', away);
  };
  if (!('IntersectionObserver' in window)) {
    const onScroll = () => show(stage.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom + 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return;
  }
  let io = null;
  const observe = () => {
    io?.disconnect();
    const h = Math.round(header.getBoundingClientRect().height);
    io = new IntersectionObserver((entries) => {
      for (const en of entries) show(!en.isIntersecting);
    }, { rootMargin: `-${h + 8}px 0px 0px 0px`, threshold: 0 });
    io.observe(stage);
  };
  observe();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(observe, 200); });
}

function boot() {
  $('#date-stamp').textContent = formatDateStamp();
  $('#about-text').textContent = META.sketchNote;
  wireAtlasLegend();
  wireMethodTop();
  // Desk entry points keep the current atlas focus (no hash reset)
  document.addEventListener('click', (e) => {
    const opener = e.target.closest?.('[data-open-desk]');
    if (opener) {
      e.preventDefault();
      navigate({ desk: opener.dataset.openDesk, stab: null, ssub: null, sbrief: false });
      return;
    }
    if (e.target.closest?.('#nav-desks')) {
      e.preventDefault();
      navigate({ desk: state.desk || 'prices', stab: null, ssub: null, sbrief: false });
      return;
    }
    const sectorBtn = e.target.closest?.('[data-open-sector]');
    if (sectorBtn) {
      e.preventDefault();
      openSectorTab(sectorBtn.dataset.openSector);
    }
  });
  renderMethodSectors();
  loadSectorBriefs();
  loadPricesDesk();
  loadStats();
  watchPanelDollar();
  loadGeoAndLeadership()
    .then(() => loadMap())
    .then(() => applyHash());
  loadLiveFeed();
  window.addEventListener('resize', () => applyMapTransform());
  window.addEventListener('hashchange', applyHash);
  wireSectorNav();
  mountSignup(document);
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('.vwrap')) return;
    $$('.vwrap.open').forEach((w) => {
      w.classList.remove('open');
      w.querySelector('[data-vbadge]')?.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.stab) {
      const openChips = $$('.stage-chip.open');
      if (openChips.length) {
        openChips.forEach((w) => { w.classList.remove('open'); w.querySelector('[data-stage-info]')?.setAttribute('aria-expanded', 'false'); });
        openChips[0].querySelector('[data-stage-info]')?.focus({ preventScroll: true });
        return;
      }
      if (state.sbrief) navigate({ sbrief: false });
      else navigate({ stab: null, ssub: null, sbrief: false });
    } else if (e.key === 'Escape' && state.desk) {
      navigate({ desk: null });
    } else if (e.key === 'Escape' && state.view !== 'desk') {
      navigate({ view: 'desk', company: null });
    } else if (e.key === 'Escape' && state.city) {
      navigate({ city: null });
    } else if (e.key === 'Escape' && state.admin1) {
      navigate({ admin1: null, city: null });
    } else if (e.key === 'Escape' && state.country) {
      navigate({ country: null, admin1: null, city: null });
      fitToBbox(null);
    }
  });
  registerSW();
}

boot();
