/** Phase 1, batch 2 (SW v32): stubs retired with real figures, US state figures, hand-confirmed heads, safe pushes. */
import { readFileSync, existsSync } from 'fs';
import { STUBS, COUNTRIES, getCountry } from './data.js';
import { WB_INDICATORS } from './stats.js';
import { placeIndicators, lineFromWorldBank, coverageLine } from './whatchanged.js';
import { US_STATES, stateFigures, stateLines, stateMix, fredLatest, EIA_MIX } from './usstates.js';
import { mixFor, energyMixHtml } from './sectorstrip.js';
let pass = 0, fail = 0;
const assert = (n, c) => { if (c) { pass++; console.log('  PASS ', n); } else { fail++; console.log('  FAIL ', n); } };
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const json = (p) => JSON.parse(read(p));
const NOW = new Date('2026-10-08T12:00:00Z');

console.log('\n--- Example stubs retired; real figures instead ---');
assert('no example stubs or profiles left', Object.keys(STUBS).length === 0 && Object.keys(COUNTRIES).length === 0);
for (const id of ['fr', 'cn', 'de', 'br', 'za']) assert(`getCountry(${id}) is null (no invented scores)`, getCountry(id) === null);
const ds = read('./data.js');
assert('data.js has no stability/frontierPressure/opportunity numbers', !/(stability|frontierPressure|opportunity)\s*:\s*\d/.test(ds));
const stab = WB_INDICATORS.find((i) => i.id === 'stability');
assert('political stability line uses the World Bank WGI score', stab && stab.code === 'GOV_WGI_PV.SC' && stab.desk === 'capital' && /worldwide-governance-indicators/.test(stab.page));
const world = json('./data/stats/world.json');
const withStab = Object.values(world.countries).filter((c) => c.stability).length;
assert('WGI political stability present for 150+ countries, each dated', withStab > 150 && Object.values(world.countries).every((c) => !c.stability || /^\d{4}$/.test(c.stability.year)));
const frModel = placeIndicators({ level: 'country', country: 'fr' }, { world }, NOW);
const frStab = frModel.groups.flatMap((g) => g.lines).find((l) => l.id === 'wb-stability');
assert('France shows a sourced, dated political stability score in Capital', frStab && frStab.desk === 'capital' && /^\d{4}$/.test(frStab.asOf) && /Worldwide Governance Indicators GOV_WGI_PV\.SC/.test(frStab.detail));
const { line } = lineFromWorldBank(stab, { value: 63.99, year: '2025', sourceUrl: stab.page, prior: { value: 62.84, year: '2024' } }, NOW);
assert('stability line: value, unit, change vs prior year', line.display === '64.0' && line.unit === 'score 0-100' && line.change?.dir === 'up');

const tw = world.countries.tw;
assert('Taiwan: IMF GDP, growth, inflation for a completed year (no projections)', tw && ['gdp', 'growth', 'inflation'].every((k) => tw[k]?.source === 'IMF' && Number(tw[k].year) < 2026 && /imf\.org/.test(tw[k].sourceUrl)));
const twLines = placeIndicators({ level: 'country', country: 'tw' }, { world }, NOW).groups.flatMap((g) => g.lines);
assert('Taiwan lines credit the IMF, not the World Bank', twLines.length === 3 && twLines.every((l) => l.source.name === 'IMF' && /World Bank does not publish Taiwan/.test(l.detail)));


const em = json('./data/stats/energy-mix.json');
assert('Cambodia and Kosovo electricity mix now parsed (blank OWID shares are unused sources; Kosovo has no iso code)', em.countries.kh?.year >= 2024 && em.countries.xk?.year >= 2024 && em.countries.xk.shares.coal > 50);

console.log('\n--- US state figures (BEA, Census, BLS via FRED, EIA) ---');
assert('51 state equivalents (50 states and DC) with us-xx ids', US_STATES.length === 51 && US_STATES.every((s) => /^us-[a-z]{2}$/.test(s.id)));
const fx = stateFigures({
  nominal: [{ GeoFips: '49000', TimePeriod: '2024', DataValue: '302,630.2' }, { GeoFips: '49000', TimePeriod: '2025', DataValue: '319178.6' }],
  real: [{ GeoFips: '49000', TimePeriod: '2023', DataValue: '200' }, { GeoFips: '49000', TimePeriod: '2024', DataValue: '210' }, { GeoFips: '49000', TimePeriod: '2025', DataValue: '215.67' }],
  acsNow: [['NAME', 'B01003_001E', 'state'], ['Utah', '3503613', '49']], acsPrior: [['NAME', 'B01003_001E', 'state'], ['Utah', '3417734', '49']],
  eiaRows: [['ALL', 1000], ['COW', 481], ['NGO', 308], ['SUN', 149], ['WND', 21], ['HYC', 22], ['GEO', 13]].map(([f, g]) => ({ period: '2025', location: 'UT', fueltypeid: f, generation: String(g) })),
  unemployment: { UT: 'observation_date,UTUR\n2026-07-01,3.6\n2026-08-01,3.5\n' }, now: NOW,
});
const ut = fx.states['us-ut'];
assert('state GDP in dollars with prior year', ut.gdp.value === 319178.6e6 && ut.gdp.year === '2025' && ut.gdp.prior.year === '2024');
assert('real growth computed from chained dollars', ut.growth.value === 2.7 && ut.growth.prior.value === 5);
assert('population from ACS with prior year', ut.population.value === 3503613 && ut.population.prior.value === 3417734);
assert('unemployment latest month from FRED with link', ut.unemployment.value === 3.5 && ut.unemployment.date === '2026-08-01' && /UTUR$/.test(ut.unemployment.url));
assert('EIA mix shares of utility-scale total', ut.mix.shares.coal === 48.1 && ut.mix.shares.gas === 30.8 && ut.mix.year === 2025 && Object.keys(EIA_MIX).length === 9);
assert('fredLatest ignores blank values', fredLatest('observation_date,X\n2026-07-01,4.1\n2026-08-01,.\n').value === 4.1);
const lines = stateLines('us-ut', fx);
assert('Utah What changed: GDP, growth, unemployment, population, each sourced and dated', ['st-gdp', 'st-growth', 'st-unemployment', 'st-population'].every((id) => lines.some((l) => l.id === id && l.source?.url && l.asOfText)));
assert('unemployment reads like Aug 2026', lines.find((l) => l.id === 'st-unemployment').asOfText === 'Aug 2026');
const utModel = placeIndicators({ level: 'admin1', country: 'us', admin1: 'us-ut' }, { usStates: fx }, NOW);
assert('placeIndicators fills the Utah panel (Activity)', !utModel.empty && utModel.groups[0].id === 'activity' && utModel.groups[0].lines.length === 4);
const mix = { sources: [{ id: 'coal', label: 'Coal' }, { id: 'gas', label: 'Gas' }, { id: 'solar', label: 'Solar' }], countries: { us: { year: 2025, shares: { gas: 40 } } }, states: { 'us-ut': stateMix('us-ut', fx) } };
const m = mixFor({ level: 'admin1', country: 'us', admin1: 'us-ut' }, mix, 2026);
assert('Energy mix uses the state EIA record, not the national one', m.rec?.shares?.coal === 48.1 && m.scope.state === true);
const mh = energyMixHtml({ level: 'admin1', country: 'us', admin1: 'us-ut' }, mix, { placeLabel: 'Utah', countryLabel: 'United States' });
assert('state mix credits EIA, says rooftop solar is excluded', /eia\.gov/.test(mh) && /small-scale rooftop solar not included/.test(mh) && /Utah/.test(mh));
const live = json('./data/stats/us-states.json');
assert('us-states.json covers 51 places with GDP, unemployment, population and mix', ['gdp', 'unemployment', 'population', 'mix'].every((k) => live.counts[k] === 51));
const secrets = /api_key=|UserID=|[?&]key=[A-Za-z0-9]{10}/;
assert('no API keys or key parameters in the committed data or client code', !secrets.test(read('./data/stats/us-states.json')) && !secrets.test(read('./usstates.js')) && !/process\.env/.test(read('./usstates.js')));
assert('fetcher reads keys from the environment only', /process\.env/.test(read('./scripts/fetch-us-states.mjs')) && !/[A-Fa-f0-9]{32,}/.test(read('./scripts/fetch-us-states.mjs')));

console.log('\n--- Heads hand pass, coverage line, safe pushes ---');
const lead = json('./data/leadership.json');
const hand = json('./scripts/leadership-sources/heads-manual-2026-10-08b.json');
const handSeats = Object.entries(hand.countries).flatMap(([c, e]) => ['hs', 'hg'].filter((k) => e[k]).map((k) => ({ c, k, e: e[k] })));
assert('hand pass: 60+ seats, each with an https official source', handSeats.length >= 60 && handSeats.every(({ e }) => /^https:\/\//.test(e.source)));
assert('hand seats are live in leadership.json', handSeats.every(({ c, e }) => lead.areas[c].roles.some((r) => r.name === e.name.replace(/\s+of\s+[A-Z][A-Za-z ]+$/, '') && r.verified && !r.notCovered)));
assert('start dates only where the page states them (Denmark: Jan 14, 2024)', lead.areas.dk.roles.find((r) => r.name === 'Frederik X')?.since?.date === '2024-01-14');
const cov = json('./data/coverage.json');
assert('coverage counts US states', cov.usStates?.whatChanged === 51 && cov.energyMix?.usStates === 51);
assert('coverage line names US states', /all 50 US states and the District of Columbia/.test(coverageLine(cov)));
assert('push helper rebases, retries and stops cleanly on conflicts', existsSync(new URL('./scripts/push-main.sh', import.meta.url)) && /rebase --autostash/.test(read('./scripts/push-main.sh')) && /for attempt in 1 2 3 4 5/.test(read('./scripts/push-main.sh')) && /rebase --abort/.test(read('./scripts/push-main.sh')));
assert('ROADMAP.md and RESEARCH-RUNS.md use union merges', /ROADMAP\.md merge=union/.test(read('./.gitattributes')) && /RESEARCH-RUNS\.md merge=union/.test(read('./.gitattributes')));
assert('RESEARCH-RUNS tells runs to push with the helper', /scripts\/push-main\.sh/.test(read('./RESEARCH-RUNS.md')));
const sw = read('./sw.js');
assert('SW v32+ caches the US state module and data', Number((sw.match(/long-haul-ledger-v(\d+)/) || [])[1]) >= 32 && ["'./usstates.js'", "'./data/stats/us-states.json'"].every((f) => sw.includes(f)));
for (const wf of ['soft-launch.yml', 'stats.yml']) {
  const y = read(`./.github/workflows/${wf}`);
  assert(`${wf}: keeps phase1b test and .gitattributes off Pages`, /phase1b\.test\.mjs/.test(y) && /\.gitattributes/.test(y));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
