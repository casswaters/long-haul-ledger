/** Phase 1 (SW v31): heads of state and government, sector share strips, electricity mix, example profiles retired. */
import { readFileSync } from 'fs';
import { COUNTRIES, getCountry } from './data.js';
import { stripScope, sectorLines, sectorStripHtml, mixFor, energyMixHtml, MAX_AGE_YEARS } from './sectorstrip.js';
import { owidMix, compactWb, SECTOR_INDICATORS, MIX_SOURCES } from './stats.js';
import { coverageLine } from './whatchanged.js';
let pass = 0, fail = 0;
const assert = (n, c) => { if (c) { pass++; console.log('  PASS ', n); } else { fail++; console.log('  FAIL ', n); } };
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const json = (p) => JSON.parse(read(p));

console.log('\n--- Heads of state and government ---');
const lead = json('./data/leadership.json');
const ids = [...new Set([...read('./world.svg').matchAll(/<path id="([a-z0-9_-]+)"/g)].map((m) => m[1]))];
assert('187 map countries', ids.length === 187);
assert('every map country has a leadership block', ids.every((c) => lead.areas[c]?.roles));
const HEAD = new Set(['Head of state', 'Head of government', 'Head of state and government']);
const heads = ids.flatMap((c) => lead.areas[c].roles.filter((r) => HEAD.has(r.kind)).map((r) => ({ c, r })));
const filled = heads.filter(({ r }) => r.name && !r.notCovered);
assert('every filled head seat has an https official source and a checked date', filled.every(({ r }) => /^https:\/\/|^http:\/\//.test(r.source?.url || '') && /^\d{4}-\d{2}-\d{2}$/.test(r.asOf || r.checked || '')));
assert('filled head seats from this pass carry the official site', filled.filter(({ r }) => r.checked === '2026-10-08').every(({ r }) => r.contact?.site));
assert('start dates only with the page they were confirmed on', filled.every(({ r }) => !r.since || (r.since.text && r.since.confirmedOn)));
assert('unconfirmed head seats say Not yet covered with a checked date', heads.filter(({ r }) => r.notCovered).every(({ r }) => !r.name && r.checked));
assert('each country shows both seats (filled or Not yet covered)', ids.every((c) => {
  const k = new Set(lead.areas[c].roles.filter((r) => HEAD.has(r.kind)).map((r) => r.kind));
  return k.has('Head of state and government') || (k.has('Head of state') && k.has('Head of government'));
}));
assert('Vietnam keeps the hand-verified Prime Minister (stale candidate rejected)', lead.areas.vn.roles.some((r) => r.kind === 'Head of government' && r.name === 'Le Minh Hung') && !JSON.stringify(lead.areas.vn).includes('Pham Minh Chinh'));
assert('France head of state spelled as on elysee.fr', lead.areas.fr.roles.some((r) => r.kind === 'Head of state' && r.name === 'Emmanuel Macron'));
assert('meta records the method and counts', lead.meta.heads?.method?.includes('official government page') && Number.isFinite(lead.meta.heads.counts.hsFilled));

console.log('\n--- Example profiles retired ---');
assert('no example profiles', Object.keys(COUNTRIES).length === 0);
assert('US, IN, AE, JP, NG, CL fall back to sourced pieces', ['us', 'in', 'ae', 'jp', 'ng', 'cl'].every((c) => getCountry(c) === null));
const app = read('./app.js');
assert('mind map for a country without a profile says Not yet covered', /Mind map for \$\{nm\}/.test(app) && !/Unknown country\./.test(app));

console.log('\n--- Sector share strips ---');
const sectors = json('./data/stats/sectors.json');
assert('11 indicators across the five tabs', SECTOR_INDICATORS.length === 11 && ['materials', 'manufacturing', 'services', 'technology', 'policy'].every((t) => SECTOR_INDICATORS.some((d) => d.tab === t)));
assert('compact rows [value, year, prior, priorYear]', compactWb({ value: 9.4862, year: '2025', prior: { value: 9.5664, year: '2024' } }).join(',') === '9.49,2025,9.57,2024');
assert('world aggregate present', Array.isArray(sectors.world?.mfgshare));
assert('state equivalents use national figures, labeled', stripScope({ level: 'admin1', country: 'fr', admin1: 'fr-x' }).national === true && stripScope({ level: 'world' }).id === 'world');
const fake = { indicators: { a: { id: 'a', tab: 'policy', code: 'X', label: 'A', unit: '% of GDP' }, b: { id: 'b', tab: 'policy', code: 'Y', label: 'B', unit: '% of GDP' } }, countries: { zz: { a: [10, 2025, 9.5, 2024], b: [5, 2010] } } };
const sl = sectorLines('policy', 'zz', fake, 2026);
assert('values older than 10 years hidden with a note', sl.lines.length === 1 && sl.hidden.length === 1 && /2010, not shown/.test(sl.hidden[0]) && MAX_AGE_YEARS === 10);
assert('change vs prior year in pts', sl.lines[0].change.text === '+0.5 pts');
const html = sectorStripHtml('manufacturing', { level: 'country', country: 'fr' }, sectors, { placeLabel: 'France', checked: 'Oct 8, 2026' });
assert('France manufacturing strip renders with World Bank links', /Share of the economy/.test(html) && /data\.worldbank\.org\/indicator\/NV\.IND\.MANF\.ZS\?locations=FR/.test(html));
// Official national statistics where the World Bank publishes nothing (Taiwan: DGBAS, NSTC, MOF; Falklands: FIG national accounts).
const twM = sectorLines('manufacturing', 'tw', sectors, 2026).lines;
assert('Taiwan manufacturing share comes from DGBAS table 5-3', twM.some((l) => l.id === 'mfgshare' && l.by === 'DGBAS' && l.year >= 2025 && /stat\.gov\.tw/.test(l.url)));
assert('Falklands agriculture line includes fishing and says so', sectorLines('materials', 'fk', sectors, 2026).lines.some((l) => l.by === 'Falkland Islands Government' && /fishing/i.test(l.def || '')));
assert('Taiwan policy strip header names its national sources', /DGBAS and Ministry of Finance, annual/.test(sectorStripHtml('policy', { level: 'country', country: 'tw' }, sectors, { placeLabel: 'Taiwan' })));
assert('World Bank rows still win for France', sectorLines('manufacturing', 'fr', sectors, 2026).lines.every((l) => l.by === 'World Bank'));
assert('empty place says Not yet covered', /Not yet covered/.test(sectorStripHtml('policy', { level: 'country', country: 'zz' }, sectors, { checked: 'Oct 8, 2026' })));

console.log('\n--- Electricity mix ---');
const csv = 'country,year,iso_code,electricity_generation,' + MIX_SOURCES.map((m) => m.col).join(',') + '\nTestland,2023,TST,10,50,10,0,20,10,5,5,0,0\nTestland,2024,TST,11,40,10,0,20,10,10,10,0,0\nWorld,2024,,100,30,20,3,9,14,9,9,2,4\n';
const m = owidMix(csv);
assert('owidMix keeps the latest complete year', m.TST.year === 2024 && m.TST.shares.coal === 40 && m.OWID_WRL.year === 2024);
const mix = json('./data/stats/energy-mix.json');
assert('energy-mix.json covers 150+ countries plus the World', Object.keys(mix.countries).length >= 150 && mix.world?.year >= 2020);
const mf = mixFor({ level: 'country', country: 'fr' }, mix);
assert('France mix sorted by share', mf.rec && mf.parts[0].share >= mf.parts[mf.parts.length - 1].share);
assert('mix panel cites Our World in Data (Ember, Energy Institute)', /Our World in Data/.test(energyMixHtml({ level: 'country', country: 'fr' }, mix)) && /Ember/.test(energyMixHtml({ level: 'country', country: 'fr' }, mix)));
assert('Energy and the economy tabs wired separately', /energyMix: sector\.id === 'energy'/.test(app) && /sectorStrip: sector\.economicType/.test(app));

console.log('\n--- Coverage, SW, deploy hygiene ---');
const cov = json('./data/coverage.json');
assert('coverage counts heads, sectors and mix', cov.heads && cov.sectors && cov.energyMix && /heads of state confirmed for \d+ of 187/.test(coverageLine(cov)));
const sw = read('./sw.js');
assert('SW v31+ caches the strip module and data', Number((sw.match(/long-haul-ledger-v(\d+)/) || [])[1]) >= 31 && ['sectorstrip.js', 'data/stats/sectors.json', 'data/stats/energy-mix.json'].every((f) => sw.includes(`'./${f}'`)));
for (const w of ['stats.yml', 'soft-launch.yml']) assert(`${w} keeps phase1.test.mjs off Pages`, read(`./.github/workflows/${w}`).includes('phase1.test.mjs'));
const copy = read('./sectorstrip.js') + JSON.stringify(lead.meta);
assert('no em dashes, tildes or admin-1 wording in new copy', !/[\u2014~]/.test(copy) && !/admin-1/i.test(copy));
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
