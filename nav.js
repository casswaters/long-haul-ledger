/**
 * Navigation / filter helpers (pure) — tested by ledger.test.js
 */
import { parseSectorToken, sectorToken } from './sectors.js';
import { SECTOR_IDS } from './tabs.js';

export const TABS = ['signals', 'industries', 'regions', 'openings'];
export const VIEWS = ['desk', 'mindmap', 'chain', 'company'];
/** Visible tab labels. The 'openings' id stays for old links; the label is non-tip-like. */
export const TAB_LABELS = {
  signals: 'Signals',
  industries: 'Industries',
  regions: 'Regions',
  openings: 'Constraints',
};
/** Indicators (sourced record; internal id "desk") — opened with #d=<desk>. */
export const DESK_TABS = ['activity', 'people', 'prices', 'capital'];

export function normalizeDesk(desk) {
  if (desk == null || desk === '') return null;
  return DESK_TABS.includes(desk) ? desk : 'prices';
}

export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  if (!raw) {
    return {
      country: null, tab: 'signals', sector: null, region: null,
      view: 'desk', company: null, admin1: null, city: null, desk: null,
      stab: null, ssub: null, sbrief: false,
    };
  }
  // Sector tab token (no "="): energy, energy/nuclear, energy/nuclear/brief
  let st = null;
  const parts = Object.fromEntries(
    raw.split('&').filter(Boolean).map((p) => {
      const [k, v = ''] = p.split('=');
      const key = decodeURIComponent(k);
      if (!p.includes('=')) { const t = parseSectorToken(key, SECTOR_IDS); if (t) st = t; }
      return [key, decodeURIComponent(v)];
    })
  );
  return {
    stab: st ? st.tab : null,
    ssub: st ? st.sub : null,
    sbrief: st ? st.brief : false,
    country: parts.c || parts.country || null,
    tab: parts.t || parts.tab || 'signals',
    sector: parts.s || parts.sector || null,
    region: parts.r || parts.region || null,
    view: normalizeView(parts.v || parts.view || 'desk'),
    company: parts.co || parts.company || null,
    admin1: parts.a || parts.admin1 || null,
    city: parts.city || null,
    desk: normalizeDesk(parts.d ?? parts.desk ?? null),
  };
}

export function buildHash({
  country,
  tab = 'signals',
  sector = null,
  region = null,
  view = 'desk',
  company = null,
  admin1 = null,
  city = null,
  desk = null,
  stab = null,
  ssub = null,
  sbrief = false,
} = {}) {
  const d = normalizeDesk(desk);
  const tok = stab ? sectorToken({ tab: stab, sub: ssub, brief: sbrief }) : '';
  if (!country) return [d ? `d=${encodeURIComponent(d)}` : '', tok].filter(Boolean).join('&');
  const bits = [`c=${encodeURIComponent(country)}`];
  if (admin1) bits.push(`a=${encodeURIComponent(admin1)}`);
  if (city) bits.push(`city=${encodeURIComponent(city)}`);
  const v = normalizeView(view);
  // Mind map / chain / company only at country level
  if (v && v !== 'desk' && !admin1 && !city) bits.push(`v=${encodeURIComponent(v)}`);
  if (tab && tab !== 'signals' && v === 'desk') bits.push(`t=${encodeURIComponent(tab)}`);
  if (sector) bits.push(`s=${encodeURIComponent(sector)}`);
  if (region && v === 'desk') bits.push(`r=${encodeURIComponent(region)}`);
  if (company && v === 'company') bits.push(`co=${encodeURIComponent(company)}`);
  if (d) bits.push(`d=${encodeURIComponent(d)}`);
  if (tok) bits.push(tok);
  return bits.join('&');
}

export function setHash(state) {
  const h = buildHash(state);
  const next = h ? `#${h}` : '#';
  if (location.hash !== next && location.hash !== h) {
    if (!h) history.replaceState(null, '', location.pathname + location.search);
    else location.hash = h;
  }
}

export function normalizeTab(tab) {
  return TABS.includes(tab) ? tab : 'signals';
}

export function normalizeView(view) {
  return VIEWS.includes(view) ? view : 'desk';
}
