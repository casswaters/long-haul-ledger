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
    'Long Haul Ledger follows economic activity from the macro to the micro: zoom from the whole world to a country, a state equivalent or a city, as general or as specific as you want at any moment, and the panels and news column follow. What is sourced: the news column (outbound links to public feeds, a location tag and a verification tier on every story), the What changed indicators (Activity, Prices, Capital), where every line carries its value, the change from the prior reading, an as-of date and a source link; Who\u2019s in the seat, where every seat is confirmed on an official page; and leadership channels. What is PROTOTYPE: the example scores on 20 country stubs, the industry mind maps and their value chains are example data for UX testing; the six full example country profiles were retired on Oct 8, 2026. Leadership lists public channels only; anything we have not confirmed says source pending or Not yet covered.',
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

/** Lighter stubs — clickable, minimal panel. */
export const STUBS = {
  cn: { id: 'cn', name: 'China', iso: 'CN', tier: 'stub', snapshot: 'Manufacturing scale and infrastructure depth; PROTOTYPE stub.', metrics: { stability: 70, frontierPressure: 78, opportunity: 72 } },
  br: { id: 'br', name: 'Brazil', iso: 'BR', tier: 'stub', snapshot: 'Agri–minerals–energy commons with logistics distance; PROTOTYPE stub.', metrics: { stability: 62, frontierPressure: 72, opportunity: 70 } },
  de: { id: 'de', name: 'Germany', iso: 'DE', tier: 'stub', snapshot: 'Industrial Mittelstand under energy and demography pressure; PROTOTYPE stub.', metrics: { stability: 76, frontierPressure: 68, opportunity: 66 } },
  gb: { id: 'gb', name: 'United Kingdom', iso: 'GB', tier: 'stub', snapshot: 'Services and science strength; energy and industrial depth thinner; PROTOTYPE stub.', metrics: { stability: 74, frontierPressure: 65, opportunity: 64 } },
  fr: { id: 'fr', name: 'France', iso: 'FR', tier: 'stub', snapshot: 'Nuclear baseload and industrial policy experiments; PROTOTYPE stub.', metrics: { stability: 73, frontierPressure: 66, opportunity: 65 } },
  ca: { id: 'ca', name: 'Canada', iso: 'CA', tier: 'stub', snapshot: 'Resources, immigration, and allied supply-chain adjacency; PROTOTYPE stub.', metrics: { stability: 80, frontierPressure: 62, opportunity: 68 } },
  au: { id: 'au', name: 'Australia', iso: 'AU', tier: 'stub', snapshot: 'Critical minerals and energy export geography; PROTOTYPE stub.', metrics: { stability: 82, frontierPressure: 64, opportunity: 69 } },
  za: { id: 'za', name: 'South Africa', iso: 'ZA', tier: 'stub', snapshot: 'Minerals and logistics hub potential gated by power and institutions; PROTOTYPE stub.', metrics: { stability: 55, frontierPressure: 75, opportunity: 68 } },
  ke: { id: 'ke', name: 'Kenya', iso: 'KE', tier: 'stub', snapshot: 'East African digital and logistics corridor node; PROTOTYPE stub.', metrics: { stability: 58, frontierPressure: 70, opportunity: 71 } },
  sa: { id: 'sa', name: 'Saudi Arabia', iso: 'SA', tier: 'stub', snapshot: 'Energy surplus pivoting toward industry and compute; PROTOTYPE stub.', metrics: { stability: 72, frontierPressure: 73, opportunity: 74 } },
  kr: { id: 'kr', name: 'South Korea', iso: 'KR', tier: 'stub', snapshot: 'Chip and shipbuilding depth under demographic squeeze; PROTOTYPE stub.', metrics: { stability: 78, frontierPressure: 74, opportunity: 70 } },
  mx: { id: 'mx', name: 'Mexico', iso: 'MX', tier: 'stub', snapshot: 'Nearshoring manufacturing and energy–logistics binding constraints; PROTOTYPE stub.', metrics: { stability: 60, frontierPressure: 77, opportunity: 75 } },
  id: { id: 'id', name: 'Indonesia', iso: 'ID', tier: 'stub', snapshot: 'Nickel–EV chain and archipelago logistics; PROTOTYPE stub.', metrics: { stability: 64, frontierPressure: 76, opportunity: 74 } },
  eg: { id: 'eg', name: 'Egypt', iso: 'EG', tier: 'stub', snapshot: 'Suez logistics and energy corridor geography; PROTOTYPE stub.', metrics: { stability: 56, frontierPressure: 71, opportunity: 67 } },
  pl: { id: 'pl', name: 'Poland', iso: 'PL', tier: 'stub', snapshot: 'Central European manufacturing and energy security rebuild; PROTOTYPE stub.', metrics: { stability: 71, frontierPressure: 67, opportunity: 68 } },
  se: { id: 'se', name: 'Sweden', iso: 'SE', tier: 'stub', snapshot: 'Green steel and nordic industrial transition; PROTOTYPE stub.', metrics: { stability: 86, frontierPressure: 60, opportunity: 66 } },
  tr: { id: 'tr', name: 'Türkiye', iso: 'TR', tier: 'stub', snapshot: 'Manufacturing bridge between Europe and Near East; PROTOTYPE stub.', metrics: { stability: 58, frontierPressure: 72, opportunity: 69 } },
  ar: { id: 'ar', name: 'Argentina', iso: 'AR', tier: 'stub', snapshot: 'Lithium–agri–energy potential under institutional volatility; PROTOTYPE stub.', metrics: { stability: 48, frontierPressure: 73, opportunity: 70 } },
  vn: { id: 'vn', name: 'Vietnam', iso: 'VN', tier: 'stub', snapshot: 'Electronics assembly climb and energy reliability race; PROTOTYPE stub.', metrics: { stability: 72, frontierPressure: 80, opportunity: 78 } },
  sg: { id: 'sg', name: 'Singapore', iso: 'SG', tier: 'stub', snapshot: 'Hub-state logistics, capital, and compute density; PROTOTYPE stub.', metrics: { stability: 90, frontierPressure: 58, opportunity: 65 } },
};

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
