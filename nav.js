/**
 * Navigation / filter helpers (pure) — tested by ledger.test.js
 */

export const TABS = ['signals', 'industries', 'regions', 'openings'];
export const VIEWS = ['desk', 'mindmap', 'chain', 'company'];
/** Visible tab labels. The 'openings' id stays for old links; the label is non-tip-like. */
export const TAB_LABELS = {
  signals: 'Signals',
  industries: 'Industries',
  regions: 'Regions',
  openings: 'Constraints',
};
/** US desks (sourced record) — opened with #d=<desk>. */
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
    };
  }
  const parts = Object.fromEntries(
    raw.split('&').filter(Boolean).map((p) => {
      const [k, v = ''] = p.split('=');
      return [decodeURIComponent(k), decodeURIComponent(v)];
    })
  );
  return {
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
} = {}) {
  const d = normalizeDesk(desk);
  if (!country) return d ? `d=${encodeURIComponent(d)}` : '';
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
