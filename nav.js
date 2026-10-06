/**
 * Navigation / filter helpers (pure) — tested by ledger.test.js
 */

export const TABS = ['signals', 'industries', 'regions', 'openings'];
export const VIEWS = ['desk', 'mindmap', 'chain', 'company'];

export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  if (!raw) {
    return {
      country: null, tab: 'signals', sector: null, region: null,
      view: 'desk', company: null,
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
  };
}

export function buildHash({
  country,
  tab = 'signals',
  sector = null,
  region = null,
  view = 'desk',
  company = null,
} = {}) {
  if (!country) return '';
  const bits = [`c=${encodeURIComponent(country)}`];
  const v = normalizeView(view);
  if (v && v !== 'desk') bits.push(`v=${encodeURIComponent(v)}`);
  if (tab && tab !== 'signals' && v === 'desk') bits.push(`t=${encodeURIComponent(tab)}`);
  if (sector) bits.push(`s=${encodeURIComponent(sector)}`);
  if (region && v === 'desk') bits.push(`r=${encodeURIComponent(region)}`);
  if (company && v === 'company') bits.push(`co=${encodeURIComponent(company)}`);
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
