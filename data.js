/**
 * Long Haul Ledger — PROTOTYPE seed data (example data for UX testing).
 * Not live news, not sourced. Invented country profiles, metrics, signals and
 * constraints. Never read by any sourced view.
 */
export const prototype = true;
export const META = {
  name: 'Long Haul Ledger',
  tagline: 'Economic activity at every scale, from the world to your city.',
  version: '0.4-drill',
  domainIntent: 'longhaulledger.com',
  sample: true,
  prototype: true,
  softLaunch: true,
  sketchNote:
    'Long Haul Ledger follows economic activity from the macro to the micro: zoom from the whole world to a country, a state equivalent or a city, as general or as specific as you want at any moment, and the panels and news column follow. What is sourced: the news column (outbound links to public feeds, a location tag and a verification tier on every story), the What changed indicators (Activity, Prices, Capital), where every line carries its value, the change from the prior reading, an as-of date and a source link; Who\u2019s in the seat, where every seat is confirmed on an official page; and leadership channels. Nothing on the country panels is example data any more: the six example profiles and the 20 example stubs were retired on Oct 8, 2026, and the old industry mind maps with them. Leadership lists public channels only; anything we have not confirmed says source pending or Not yet covered.',
};

/** @typedef {{ id: string, title: string, blurb: string, weight: number, sector?: string, region?: string, date: string }} Signal */
/** @typedef {{ id: string, name: string, note: string }} Industry */
/** @typedef {{ id: string, name: string, note: string }} Region */
/** @typedef {{ id: string, title: string, gap: string, horizon: string, sectors: string[] }} Opening */

/**
 * Example country profiles: retired Oct 8, 2026 (Phase 1, approved by Cassidy).
 * The six invented profiles (US, IN, AE, JP, NG, CL) are gone; those countries now show
 * sourced pieces only (What changed, leadership, seats, news), like every other country.
 */
export const COUNTRIES = {};

/**
 * Example country stubs: retired Oct 8, 2026 (Phase 1). Their invented scores (stability,
 * frontier pressure, opportunity) and snapshots are gone. Real figures replace them in What changed:
 * World Bank lines per country, including the Worldwide Governance Indicators political stability score.
 */
export const STUBS = {};

export function getCountry(id) {
  if (!id) return null;
  const key = String(id).toLowerCase();
  return COUNTRIES[key] || STUBS[key] || null;
}

export function allCountryIds() {
  return [...Object.keys(COUNTRIES), ...Object.keys(STUBS)];
}

export function fullCountryIds() {
  return Object.keys(COUNTRIES);
}

export function globalFeed(limit = 24) {
  const items = [];
  for (const c of Object.values(COUNTRIES)) {
    for (const s of c.signals) {
      items.push({ ...s, countryId: c.id, countryName: c.name });
    }
  }
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.weight - a.weight));
  return items.slice(0, limit);
}

export function filterSignals(country, { sector, region } = {}) {
  if (!country || !country.signals) return [];
  return country.signals.filter((s) => {
    if (sector && s.sector !== sector) return false;
    if (region && s.region !== region) return false;
    return true;
  });
}

export function opportunityNote(country, sectorId) {
  if (!country || !country.openings) return null;
  const hit = country.openings.find((o) => o.sectors.includes(sectorId));
  if (hit) return hit;
  const ind = (country.industries || []).find((i) => i.id === sectorId);
  return ind
    ? { id: `${country.id}-${sectorId}-note`, title: `${ind.name} constraint`, gap: ind.note, horizon: 'multi-decade', sectors: [sectorId] }
    : null;
}

export function metricLabel(n) {
  if (n >= 80) return 'high';
  if (n >= 65) return 'elevated';
  if (n >= 50) return 'moderate';
  return 'strained';
}
