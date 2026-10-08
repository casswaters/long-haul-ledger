#!/usr/bin/env node
/**
 * Long Haul Ledger: build-time coverage counts → data/coverage.json (shown on the Method page).
 * Real counts from the data files, so the line cannot drift from what the site shows.
 * Usage: node scripts/build-coverage.mjs [--check]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { placeIndicators, coverageLine } from '../whatchanged.js';
import { sectorLines, mixFor } from '../sectorstrip.js';
export { coverageLine };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const readOr = (p, d) => (existsSync(join(ROOT, p)) ? read(p) : d);

export function buildCoverage({ now = new Date() } = {}) {
  const svg = readFileSync(join(ROOT, 'world.svg'), 'utf8');
  const countries = [...new Set([...svg.matchAll(/<path id="([a-z0-9_-]+)"/g)].map((m) => m[1]))];
  const admin1 = read('data/geo/admin1.geojson').features.map((f) => f.properties);
  const cities = read('data/geo/cities.geojson').features.map((f) => f.properties);
  const lead = read('data/leadership.json').areas || {};
  const sourced = (blk) => !!blk && [...(blk.roles || []), ...(blk.groups || []).flatMap((g) => g.roles || [])].some((r) => r.source?.url && r.name && !r.notCovered);
  const stats = { us: readOr('data/stats/us.json', null), benchmarks: readOr('data/stats/benchmarks.json', null), world: readOr('data/stats/world.json', null) };
  const seats = readOr('data/seats.json', { places: {} });
  const live = readOr('data/signals-live.json', { items: [] });
  const storyCountries = new Set();
  for (const it of live.items || []) for (const c of it.loc?.countries || (it.countryId ? [String(it.countryId).toLowerCase()] : [])) storyCountries.add(c);
  const briefFiles = ['energy', 'materials', 'manufacturing', 'services', 'technology', 'policy'];
  let energySlots = 0, sectorSlots = 0;
  for (const id of briefFiles) {
    const f = readOr(`data/${id}-briefs.json`, { briefs: {} });
    const n = Object.values(f.briefs || {}).reduce((a, place) => a + Object.keys(place || {}).length, 0);
    if (id === 'energy') energySlots = n; else sectorSlots += n;
  }
  const kindsOf = (blk) => new Set([...(blk?.roles || [])].filter((r) => r.name && !r.notCovered && r.source?.url).map((r) => r.kind));
  const hasHs = (c) => { const k = kindsOf(lead[c]); return k.has('Head of state') || k.has('Head of state and government'); };
  const hasHg = (c) => { const k = kindsOf(lead[c]); return k.has('Head of government') || k.has('Head of state and government'); };
  const sectors = readOr('data/stats/sectors.json', null);
  const usStates = readOr('data/stats/us-states.json', null);
  const usStateLines = usStates ? Object.values(usStates.states || {}).filter((r) => r.gdp || r.unemployment || r.population).length : 0;
  const usStateMix = usStates ? Object.values(usStates.states || {}).filter((r) => r.mix).length : 0;
  const mix = readOr('data/stats/energy-mix.json', null);
  const tabs = ['materials', 'manufacturing', 'services', 'technology', 'policy'];
  const nowYear = now.getUTCFullYear();
  const withSectors = sectors ? countries.filter((c) => tabs.some((t) => sectorLines(t, c, sectors, nowYear).lines.length)).length : 0;
  const withMix = mix ? countries.filter((c) => mixFor({ level: 'country', country: c }, mix, nowYear).rec).length : 0;
  const withLines = countries.filter((c) => !placeIndicators({ level: 'country', country: c }, stats, now).empty).length;
  const out = {
    version: 1,
    checked: now.toISOString().slice(0, 10),
    note: 'Built from the data files by scripts/build-coverage.mjs. Real counts of what the site shows.',
    countries: countries.length,
    stateEquivalents: admin1.length,
    cities: cities.length,
    leaders: {
      countries: countries.filter((c) => sourced(lead[c])).length,
      stateEquivalents: admin1.filter((a) => sourced(lead[a.id])).length,
      cities: cities.filter((c) => sourced(lead[c.id]) || sourced(lead[`${c.country}-city-${String(c.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`])).length,
    },
    indicators: { world: !placeIndicators({ level: 'world' }, stats, now).empty, countries: withLines },
    seats: { places: Object.values(seats.places || {}).filter((p) => (p.seats || []).length).length, seats: Object.values(seats.places || {}).reduce((a, p) => a + (p.seats || []).length, 0) },
    news: { countriesWithStories: countries.filter((c) => storyCountries.has(c)).length },
    briefs: { energySlots, sectorSlots },
    heads: { headOfState: countries.filter(hasHs).length, headOfGovernment: countries.filter(hasHg).length, both: countries.filter((c) => hasHs(c) && hasHg(c)).length },
    sectors: { countries: withSectors },
    energyMix: { countries: withMix, usStates: usStateMix },
    usStates: { whatChanged: usStateLines },
  };
  return out;
}

const invoked = process.argv[1] ? resolvePath(process.argv[1]) : '';
if (invoked && fileURLToPath(import.meta.url) === invoked) {
  const c = buildCoverage();
  const p = join(ROOT, 'data', 'coverage.json');
  const prev = existsSync(p) ? readFileSync(p, 'utf8') : '';
  const next = JSON.stringify(c, null, 1) + '\n';
  if (prev.replace(/"checked": "[^"]*"/, '') !== next.replace(/"checked": "[^"]*"/, '')) writeFileSync(p, next);
  console.log(coverageLine(c));
}
