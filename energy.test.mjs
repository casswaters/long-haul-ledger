/**
 * Long Haul Ledger: Energy tab (sector-tab engine) tests.
 * Tagging, stage references, location filtering + backfill, empty states,
 * brief schema validation, hash tokens, feed top-up, UI wiring.
 */
import { readFileSync } from 'fs';
import { ENERGY, SECTOR_IDS, ENERGY_SUB_IDS } from './energy.js';
import {
  tagSector, sectorColumn, sectorCounts, validateBriefs, briefFor, nearestParentBrief, placeKey,
  briefHeading, parseSectorToken, sectorToken, naicsUrl, ECONOMIC_TYPES, topChildren, inSentence, filterSector,
} from './sectors.js';
import { parseHash, buildHash } from './nav.js';
import { stageReference, renderSectorOverlay } from './sectorui.js';
import { topUpSectors, sortNewestFirst } from './scripts/fetch-signals.mjs';

let pass = 0, fail = 0;
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const subs = (title, summary = '') => tagSector(ENERGY, { title, summary }).subs;
const stages = (title, summary = '') => tagSector(ENERGY, { title, summary }).stages;

console.log('\n--- Energy sources: Cassidy\'s order and copy ---');
assert('nine sources in order', ENERGY_SUB_IDS.join(',') === 'nuclear,oil,gas,coal,wind,solar,hydro,geothermal,emerging');
assert('names', ENERGY.subs.map((s) => s.name).join('|') === 'Nuclear|Oil|Natural gas|Coal|Wind|Solar|Hydro|Geothermal|Emerging');
assert('nuclear copy verbatim', ENERGY.subs[0].copy === 'Heat from splitting atoms. That heat is turned into electricity, and it can also supply heat for industry. Firm power. A fuel load lasts a long time.');
assert('wind copy verbatim', ENERGY.subs[4].copy === 'Moving air turns a blade. The blade turns a generator.');
assert('emerging copy ends cleanly, nothing invented', ENERGY.subs[8].copy.endsWith('Biofuel is a liquid from plants or waste.') && ENERGY.subs[8].copy.startsWith('Hydrogen, biofuel, batteries, synthetic fuels'));
assert('headline neutral to place', ENERGY.headline('the world') === 'Every major way the world makes power or fuel, each in its own slot.');
assert('in-sentence names', inSentence('World') === 'the world' && inSentence('United States') === 'the United States' && inSentence('Ohio') === 'Ohio' && inSentence('Netherlands') === 'the Netherlands');
assert('no em dash or tilde in source copy', ENERGY.subs.every((s) => !/[\u2014~]/.test(s.copy + s.name)));

console.log('\n--- Tagging ---');
assert('uprate story → nuclear', subs('Google and Constellation reach 11-unit uprate plan').includes('nuclear'));
assert('NRC (case-sensitive) → nuclear', subs('NRC opens comment on Palisades amendment')[0] === 'nuclear');
assert('weapons talks are not nuclear energy', !subs('Iran nuclear talks resume in Vienna').includes('nuclear'));
assert('test nuclear launch is not energy', !subs("Kremlin says France's test nuclear launch is a dead end").includes('nuclear'));
assert('nuclear plus power words stays nuclear even with a veto term', subs('Nuclear deal brings power plant to Ghana').includes('nuclear'));
assert('crude → oil', subs('Oil dips as Middle East flows recover')[0] === 'oil');
assert('palm oil is not oil', !subs('Palm oil prices rise in Malaysia').includes('oil'));
assert('LNG → natural gas', subs('LNG market tightens into winter as Europe pulls US cargoes')[0] === 'gas');
assert('coal-fired → coal', subs('Poland delays closure of coal-fired plants')[0] === 'coal');
assert('charcoal is not coal', !subs('Charcoal exports banned').includes('coal'));
assert('offshore wind → wind', subs('Floating offshore wind specialist Eolink put up for sale')[0] === 'wind');
assert('solar farm → solar', subs('Seven lessons for faster utility-scale solar installs')[0] === 'solar');
assert('solar wind (space) is not solar', !subs('NASA probe studies the solar wind').includes('solar'));
assert('hydropower → hydro', subs('Two Indian hydropower projects get consultants')[0] === 'hydro');
assert('hydrogen is not hydro', !subs('Hydrogen station opens for trucks').includes('hydro') && subs('Hydrogen station opens for trucks')[0] === 'emerging');
assert('geothermal → geothermal', subs('Next-generation geothermal for data centres').includes('geothermal'));
assert('batteries → emerging', subs('Chinese battery storage shipments keep growing')[0] === 'emerging');
assert('SAF (case-sensitive) → emerging', subs('Airline signs SAF offtake').includes('emerging') && !subs('A safe harbour for shipping').includes('emerging'));
assert('summary-only single word does not tag', subs('Factory output rises', 'Some plants use coal.').length === 0);
assert('unrelated story → no tags', subs('Central bank holds rates').length === 0 && stages('Central bank holds rates').length === 0);

console.log('\n--- Lifecycle stages ---');
assert('four plain stage labels', ENERGY.stages.map((s) => s.label).join('|') === 'Extraction|Generation and refining|Grid and distribution|Innovation');
assert('stages map to Primary..Quaternary', ENERGY.stages.map((s) => s.economicType).join(',') === 'primary,secondary,tertiary,quaternary' && ENERGY.stages.every((s) => ECONOMIC_TYPES[s.economicType]));
assert('every stage has NAICS codes (2 to 6 digits) with titles', ENERGY.stages.every((s) => s.naics.length && s.naics.every((n) => /^\d{2,6}$/.test(n.code) && n.title)));
assert('verified codes present', ['211', '2121', '212290', '213111', '22111', '324110', '325193', '22112', '2212', '486', '541715'].every((c) => ENERGY.stages.some((s) => s.naics.some((n) => n.code === c))));
assert('NAICS links go to census.gov 2022', naicsUrl('211') === 'https://www.census.gov/naics/?input=211&year=2022&details=211');
assert('stage reference summary', stageReference(ENERGY.stages[0]).summary === 'Extraction: Primary sector (extract raw materials). NAICS 211, 2121, 212290, 213111.');
assert('drilling → extraction', stages('Shale drillers add rigs in Texas oil fields').includes('extraction'));
assert('refinery → generation and refining', stages('Refinery restarts after crude unit fire').includes('generation'));
assert('transmission → grid and distribution', stages('Nuclear plant output tied to new transmission line').includes('grid'));
assert('utility-scale is not grid', !stages('Utility-scale solar farm finished').includes('grid'));
assert('prototype → innovation', stages('Startup tests microreactor prototype').includes('innovation'));
assert('stages only when a source matched', stages('New transmission line approved').length === 0);
assert('uprate output is not extraction', !stages('Constellation adds 890 MW of new output with nuclear uprates').includes('extraction'));

console.log('\n--- Location filtering and backfill ---');
const now = new Date('2026-10-07T20:00:00Z');
const mk = (id, title, loc, h = 10, extra = {}) => ({ id, url: `https://x.test/${id}`, title, blurb: '', published: new Date(now - h * 3.6e6).toISOString(), quality: 2, loc: { countries: [], admin1: [], cities: [], titleCountries: [], ...loc }, category: 'energy', verification: { status: 'unconfirmed' }, ...extra });
const items = [
  mk('a', 'Vistra nuclear uprate loan for Perry plant', { countries: ['us'], admin1: ['us-oh'] }, 5),
  mk('b', 'NRC reviews Palisades reactor amendment', { countries: ['us'], admin1: ['us-mi'] }, 8),
  mk('c', 'Constellation nuclear uprates in Illinois', { countries: ['us'], admin1: ['us-il'] }, 9),
  mk('d', 'Westinghouse AP1000 reactor plan', { countries: ['us'] }, 12),
  mk('e', 'Poland nuclear reactor timeline slips', { countries: ['pl'] }, 6),
  mk('f', 'Swiss vote on new reactors', { countries: ['ch'] }, 7),
  mk('g', 'Oil prices rise on OPEC cut', { countries: [] }, 3),
  mk('h', 'Old nuclear reactor story', { countries: ['us'] }, 24 * 60),
  mk('i', 'Same Vistra nuclear uprate loan story, other outlet', { countries: ['us'] }, 6, { verification: { status: 'multiple', clusterId: 'k1', clusterSize: 2 } }),
];
items[0].verification = { status: 'multiple', clusterId: 'k1', clusterSize: 2 };
const names = { country: (id) => ({ us: 'United States', pl: 'Poland', ch: 'Switzerland' }[id] || id), admin1: (id) => ({ 'us-oh': 'Ohio', 'us-tx': 'Texas', 'us-mi': 'Michigan', 'us-il': 'Illinois' }[id] || id), city: (id) => ({ 'us-city-houston': 'Houston' }[id] || id) };
const world = { level: 'world', country: null, admin1: null, city: null };
const us = { level: 'country', country: 'us', admin1: null, city: null };
const ohio = { level: 'admin1', country: 'us', admin1: 'us-oh', city: null };
const texas = { level: 'admin1', country: 'us', admin1: 'us-tx', city: null };
const houston = { level: 'city', country: 'us', admin1: 'us-tx', city: 'us-city-houston' };
const colW = sectorColumn(items, world, ENERGY, { sub: 'nuclear', names, now });
assert('world: nuclear stories from every country, oil excluded', colW.primary.length >= 4 && colW.primary.every((i) => i.id !== 'g'));
assert('older than 45 days dropped', !colW.ranked.some((i) => i.id === 'h'));
const colUS = sectorColumn(items, us, ENERGY, { sub: 'nuclear', names, now });
assert('country: only US-tagged stories', colUS.primary.every((i) => i.loc.countries.includes('us')) && colUS.primary.length >= 4 && !colUS.more.length);
const colOH = sectorColumn(items, ohio, ENERGY, { sub: 'nuclear', names, now });
assert('state: Ohio story first, then "More from United States"', colOH.primary[0]?.id === 'a' && colOH.more[0]?.label === 'More from United States');
assert('state: same story cluster not repeated in backfill', !colOH.more.flatMap((g) => g.items).some((i) => i.id === 'i'));
assert('state with few stories: fewText', colOH.fewText === 'Only 1 recent story is tagged to Ohio.');
const colTX = sectorColumn(items, texas, ENERGY, { sub: 'nuclear', names, now });
assert('empty state is honest and names the fallback', colTX.emptyText === 'No recent nuclear stories tagged to Texas. Showing the United States.', colTX.emptyText);
const colHou = sectorColumn(items, houston, ENERGY, { sub: 'nuclear', names, now });
assert('city with nothing: walks up past the state', colHou.emptyText === 'No recent nuclear stories tagged to Houston. Showing the United States.' && colHou.more[0].label === 'More from United States', colHou.emptyText);
const colGeo = sectorColumn(items, us, ENERGY, { sub: 'geothermal', names, now });
assert('nothing anywhere: plain empty text, no fallback', colGeo.emptyText === 'No recent geothermal stories tagged to United States.' && !colGeo.more.length);
const colWorldEmpty = sectorColumn(items, world, ENERGY, { sub: 'hydro', names, now });
assert('world empty text', colWorldEmpty.emptyText === 'No recent hydro stories yet.');
const counts = sectorCounts(items, us, ENERGY, { now });
assert("counts per source at a place (one story per cluster)", counts.subs.nuclear === 4 && counts.subs.oil === 0, JSON.stringify(counts.subs));
assert('top children at world are countries', topChildren(items, world, ENERGY, { sub: 'nuclear', now })[0].id === 'us');
assert('precomputed tags win over recomputing', filterSector([{ ...mk('z', 'Plain title', { countries: ['us'] }), sectors: { energy: { subs: ['wind'], stages: [] } } }], ENERGY, { sub: 'wind', now }).length === 1);

console.log('\n--- Briefs: schema validation ---');
const src = { title: 'DOE release', url: 'https://www.energy.gov/x', date: '2026-10-05' };
const text = 'The Department of Energy offered a conditional loan commitment of up to $4.2 billion. Conditional means the money is not wired.';
const good = { version: 1, sector: 'energy', briefs: { us: { nuclear: { generated_at: '2026-10-07T23:00:00Z', items: [{ text, sources: [src] }] } } } };
let r = validateBriefs(good, ENERGY, { now });
assert('valid brief accepted', !r.errors.length && r.valid.briefs.us.nuclear.items.length === 1 && r.valid.briefs.us.nuclear.stale === false);
r = validateBriefs({ ...good, briefs: { us: { nuclear: { generated_at: '2026-10-07T23:00:00Z', items: [{ text, sources: [] }, { text, sources: [src] }] } } } }, ENERGY, { now });
assert('item without sources rejected, others kept', r.errors.some((e) => /item 1: rejected/.test(e)) && r.valid.briefs.us.nuclear.items.length === 1);
r = validateBriefs({ ...good, briefs: { us: { nuclear: { generated_at: '2026-10-07T23:00:00Z', items: [{ text, sources: [{ title: 'x', url: 'ftp://x', date: '2026-10-05' }, { title: 'y', url: 'https://y', date: 'Oct 5' }] }] } } } }, ENERGY, { now });
assert('bad url / bad date sources do not count; brief rejected', r.errors.some((e) => /no accepted items/.test(e)) && !r.valid.briefs.us);
r = validateBriefs({ ...good, briefs: { us: { nuclear: { generated_at: '2026-09-20T00:00:00Z', items: [{ text, sources: [src] }] } } } }, ENERGY, { now });
assert('older than 7 days flagged stale', r.valid.briefs.us.nuclear.stale === true && r.warnings.some((w) => /stale/.test(w)));
r = validateBriefs({ ...good, briefs: { us: { fusion: { generated_at: '2026-10-07T00:00:00Z', items: [{ text, sources: [src] }] } } } }, ENERGY, { now });
assert('unknown source id rejected', r.errors.some((e) => /unknown energy source/.test(e)));
r = validateBriefs({ ...good, briefs: { us: { nuclear: { generated_at: '2026-10-07T00:00:00Z', items: Array(5).fill({ text, sources: [src] }) } } } }, ENERGY, { now });
assert('more than 4 items rejected', r.errors.some((e) => /more than 4/.test(e)));
r = validateBriefs({ ...good, briefs: { us: { nuclear: { generated_at: '2026-10-07T00:00:00Z', items: [{ text: text + ' \u2014 dash', sources: [src] }] } } } }, ENERGY, { now });
assert('em dash in brief text rejected', r.errors.some((e) => /em dash/.test(e)));
r = validateBriefs({ ...good, briefs: { us: { nuclear: { items: [{ text, sources: [src] }] } } } }, ENERGY, { now });
assert('missing generated_at rejected', r.errors.some((e) => /generated_at/.test(e)));
assert('missing top-level briefs rejected', validateBriefs({}, ENERGY).errors.length === 1);
const v = validateBriefs(good, ENERGY, { now }).valid;
assert('placeKey per level', placeKey(world) === 'world' && placeKey(us) === 'us' && placeKey(ohio) === 'us-oh' && placeKey(houston) === 'us-city-houston');
assert('briefFor finds US nuclear, not Ohio', !!briefFor(v, us, 'nuclear') && !briefFor(v, ohio, 'nuclear'));
assert('nearest parent brief from Ohio is United States', nearestParentBrief(v, ohio, 'nuclear')?.place.country === 'us');
assert('heading format', briefHeading(ENERGY, 'nuclear', 4) === 'The 4 most important things happening in nuclear this week' && briefHeading(ENERGY, 'gas', 3) === 'The 3 most important things happening in natural gas this week');

console.log('\n--- Seed briefs (data/energy-briefs.json) ---');
const seed = JSON.parse(read('./data/energy-briefs.json'));
const sv = validateBriefs(seed, ENERGY, { now });
assert('seed briefs validate with no errors', !sv.errors.length, sv.errors.join(' | '));
assert('world and US nuclear briefs present, 4 items each', sv.valid.briefs.world?.nuclear?.items.length === 4 && sv.valid.briefs.us?.nuclear?.items.length === 4);
const allItems = [...sv.valid.briefs.world.nuclear.items, ...sv.valid.briefs.us.nuclear.items];
assert('every seed item has a primary source', allItems.every((i) => i.sources.some((s) => s.primary)));
assert('seed corrections: exigent (not emergency), no unsourced March 2027 promise', allItems.some((i) => /exigent/.test(i.text)) && !allItems.some((i) => /emergency license/.test(i.text)) && !allItems.some((i) => /Holtec still says/.test(i.text)));
assert('no social sign-off on the site', !JSON.stringify(seed).toLowerCase().includes('comment section') && !JSON.stringify(seed).toLowerCase().includes('spicy'));

console.log('\n--- Hash tokens (deep links) ---');
assert('sector ids', SECTOR_IDS.join(',') === 'energy');
assert('token parse', JSON.stringify(parseSectorToken('energy/nuclear/brief', SECTOR_IDS)) === '{"tab":"energy","sub":"nuclear","brief":true}' && parseSectorToken('about', SECTOR_IDS) === null);
assert('token build', sectorToken({ tab: 'energy', sub: 'nuclear', brief: true }) === 'energy/nuclear/brief' && sectorToken({ tab: 'energy', brief: true }) === 'energy');
const h = parseHash('#c=us&a=us-oh&energy/nuclear');
assert('#c=us&a=us-oh&energy/nuclear parses', h.stab === 'energy' && h.ssub === 'nuclear' && h.country === 'us' && h.admin1 === 'us-oh' && !h.sbrief);
assert('#energy/nuclear round-trips', buildHash(parseHash('#energy/nuclear')) === 'energy/nuclear');
assert('location + brief round-trips', buildHash(parseHash('#c=us&energy/nuclear/brief')) === 'c=us&energy/nuclear/brief');
assert('old links unaffected', buildHash(parseHash('#c=us&t=industries')) === 'c=us&t=industries' && parseHash('#c=us').stab === null);

console.log('\n--- Feed builder: sector depth ---');
const pool = [
  { url: 'https://a/1', title: 'x', score: 60, loc: { countries: ['us'] }, sectors: { energy: { subs: ['nuclear'], stages: [] } } },
  { url: 'https://a/2', title: 'y', score: 59, loc: { countries: ['us'] }, sectors: { energy: { subs: ['nuclear'], stages: [] } } },
  { url: 'https://a/3', title: 'z', score: 58, loc: { countries: ['us'] } },
];
const topped = topUpSectors([pool[0]], pool, { perKey: 2 });
assert('top-up adds cut sector stories only', topped.length === 2 && topped[1].url === 'https://a/2');
assert('top-up respects per-key cap', topUpSectors([pool[0]], pool, { perKey: 1 }).length === 1);
const sorted = sortNewestFirst([{ published: 'Mon, 14 Sep 2026 08:00:00 GMT' }, { published: '' }, { published: 'Wed, 07 Oct 2026 08:00:00 GMT' }]);
assert('feeds sorted newest first before the per-feed cap', sorted[0].published.startsWith('Wed') && sorted[2].published === '');
const srcs = JSON.parse(read('./data/sources.json')).sources;
assert('energy feeds registered (NRC, DOE NE, trade press per source)', ['nrc-news', 'doe-ne', 'ans-newswire', 'windpower-monthly', 'ogj', 'coal-age', 'thinkgeoenergy', 'hydro-review', 'energy-storage-news'].every((id) => srcs.some((s) => s.id === id)));
assert('trade-press energy feeds do not assume a home country', srcs.filter((s) => s.sector === 'energy' && !s.primary).every((s) => s.assumeHome === false));

console.log('\n--- UI wiring ---');
const html = read('./index.html');
assert('header Energy button with lightning emoji next to Indicators', /id="nav-energy"[^>]*data-open-sector="energy"[\s\S]*?\u26A1[\s\S]*?Energy<\/a>\s*<a class="hnav hnav-primary" href="#d=prices" id="nav-desks">/.test(html));
assert('Method page explains energy tagging, stages and briefs', /id="method-sectors"/.test(html) && /Lifecycle stages/.test(html) && /Top 4 this week/.test(html) && /id="method-stage-map"/.test(html));
assert('never shows admin-1 in UI copy', !/admin-1/i.test(html) && !/admin-1/i.test(read('./sectorui.js').replace(/\/\*[\s\S]*?\*\//g, '')));
const sw = read('./sw.js');
assert('SW v24 caches sector files and briefs', /long-haul-ledger-v24/.test(sw) && /sectors\.js/.test(sw) && /energy\.js/.test(sw) && /sectorui\.js/.test(sw) && /energy-briefs\.json/.test(sw));
const wf = read('./.github/workflows/soft-launch.yml');
assert('Pages excludes repo-only docs and candidates cache', /ROADMAP\.md/.test(wf) && /BRIEF\.md/.test(wf) && /data\/news-cache/.test(wf) && /energy\.test\.mjs/.test(wf));
const htmlOut = renderSectorOverlay({
  sector: ENERGY, state: { ssub: 'nuclear', sbrief: false }, place: ohio, names, items, briefs: v, stage: null, expanded: false,
  card: (it, extra) => `<article class="feed-item">${it.title}${extra}</article>`,
});
assert('overlay: nine slots, Ohio backfill heading, brief button', (htmlOut.match(/class="sector-slot/g) || []).length === 9 && /More from United States/.test(htmlOut) && /data-sbrief-open/.test(htmlOut));
assert('overlay: stage chips carry official reference popovers', (htmlOut.match(/data-stage-info/g) || []).length === 4 && /census\.gov\/naics/.test(htmlOut));
const briefOut = renderSectorOverlay({ sector: ENERGY, state: { ssub: 'nuclear', sbrief: true }, place: ohio, names, items, briefs: v, stage: null, expanded: false, card: (it) => `<article>${it.title}</article>` });
assert('overlay: no Ohio brief → says not ready, offers the US brief, shows stories', /isn't ready yet/.test(briefOut) && /Read the brief for the United States/.test(briefOut) && /data-brief-missing/.test(briefOut));
const briefUS = renderSectorOverlay({ sector: ENERGY, state: { ssub: 'nuclear', sbrief: true }, place: us, names, items, briefs: v, stage: null, expanded: false, card: (it) => `<article>${it.title}</article>` });
assert('overlay: US brief renders heading and sources', /The most important thing happening in nuclear this week/.test(briefUS) && /energy\.gov/.test(briefUS));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
