/**
 * Navigation / filter helpers (pure) — tested by ledger.test.js
 */
export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  if (!raw) return { country: null, tab: 'signals', sector: null, region: null };
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
  };
}

export function buildHash({ country, tab = 'signals', sector = null, region = null } = {}) {
  if (!country) return '';
  const bits = [`c=${encodeURIComponent(country)}`];
  if (tab && tab !== 'signals') bits.push(`t=${encodeURIComponent(tab)}`);
  if (sector) bits.push(`s=${encodeURIComponent(sector)}`);
  if (region) bits.push(`r=${encodeURIComponent(region)}`);
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

export const TABS = ['signals', 'industries', 'regions', 'openings'];

export function normalizeTab(tab) {
  return TABS.includes(tab) ? tab : 'signals';
}
