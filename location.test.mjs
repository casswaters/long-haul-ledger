/**
 * Long Haul Ledger: location tagging, news ranking per place, fallback labels,
 * curated location overrides, GDELT top-up, news-column UI wiring, copy cleanup.
 */
import { readFileSync } from 'fs';
import { buildGazetteer, tagLocation, categorize } from './locate.js';
import { COUNTRY_NAMES, countryName } from './places.js';
import { placeOf, parentPlace, buildColumn, topStories, rankedForPlace, matchesPlace, moreLabel, placeLabel, rankScore, TOP_N, MIN_N } from './newsrank.js';
import { validateCurated, applyCurated } from './curated.js';
import { normalizeItem, capByLocation, gdeltTopUp, gdeltDate, gdeltUrl, serializeFeed, coverage } from './scripts/fetch-signals.mjs';

let pass = 0, fail = 0;
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const cities = JSON.parse(read('./data/geo/cities.geojson')).features;
const gaz = buildGazetteer({ cities });
const tag = (title, summary = '', o = {}) => tagLocation({ title, summary, ...o }, gaz);
const cs = (r) => r.countries.join(',');

console.log('\n--- Place names ---');
assert('185 map countries named', Object.keys(COUNTRY_NAMES).length === 185);
const svgIds = [...read('./world.svg').matchAll(/<path id="([a-z]{2})"/g)].map((m) => m[1]);
assert('every world.svg country has a name', svgIds.every((id) => COUNTRY_NAMES[id]), svgIds.filter((id) => !COUNTRY_NAMES[id]).join(','));
assert('countryName falls back to code', countryName('zz') === 'ZZ' && countryName('lu') === 'Luxembourg');

console.log('\n--- Tagging: plain hits ---');
assert('country name in title', cs(tag('Canada approves LNG export terminal')) === 'ca');
assert('demonym', cs(tag('German factory orders rise')) === 'de');
assert('city → country + state equivalent + city', (() => { const r = tag('Houston refinery shuts after fire'); return cs(r) === 'us' && r.admin1.includes('us-tx') && r.cities.includes('us-city-houston'); })());
assert('US state → us + admin1', (() => { const r = tag('Texas grid operator warns of tight supply'); return cs(r) === 'us' && r.admin1[0] === 'us-tx'; })());
assert('Canadian province', (() => { const r = tag("Alberta oil sands output hits record"); return cs(r) === 'ca' && r.admin1[0] === 'ca-ab'; })());
assert('German state (English name)', (() => { const r = tag('Bavaria opens hydrogen hub'); return cs(r) === 'de' && r.admin1[0] === 'de-by'; })());
assert('Indian state', tag('Gujarat approves new semiconductor fab').admin1[0] === 'in-gj');
assert('title countries lead summary countries', tag('Japan signs LNG deal', 'Cargoes from Australia').countries.join(',') === 'jp,au');
assert('multi-country story keeps both', cs(tag('Thailand at last paragraph of US trade deal')) === 'th,us');
assert('more than 4 countries capped at 4', tag('France, Germany, Italy, Spain and Poland back EU steel plan').countries.length === 4);
assert('no place named → world level', tag('OPEC+ agrees to raise output').basis === 'none');
assert('national outlet with no place → home country', (() => { const r = tag('Central bank holds rates', '', { home: 'ph', assumeHome: true }); return cs(r) === 'ph' && r.basis === 'source'; })());
assert('global outlet with no place → world level', tag('Central bank holds rates', '', { home: 'gb', assumeHome: false }).countries.length === 0);
assert('official source always speaks for its home country', cs(tag('Crew photo shows Canadian astronaut', '', { home: 'us', assumeHome: true, alwaysHome: true })) === 'us,ca');

console.log('\n--- Tagging: ambiguous names ---');
assert('Georgia + Atlanta → US state', (() => { const r = tag('Georgia Power to build gas plant near Atlanta'); return cs(r) === 'us' && r.admin1.includes('us-ga') && !r.countries.includes('ge'); })());
assert('Georgia + Tbilisi → country Georgia', cs(tag("Georgia's ruling party passes law", 'Protests in Tbilisi continue')) === 'ge');
assert('Georgia with no cue from a global outlet → no tag', tag('Georgia weighs new energy law', '', { home: 'gb' }).countries.length === 0);
assert('Georgia with no cue from a US outlet → US state', tag('Georgia weighs new energy law', '', { home: 'us' }).admin1[0] === 'us-ga');
assert('Michael Jordan → no country', tag('Michael Jordan buys stake in team').countries.length === 0);
assert('Jordan Peterson → no country', tag('Jordan Peterson speaks at energy forum').countries.length === 0);
assert('Jordan with Egypt → Jordan', tag('Jordan signs gas deal with Egypt').countries.includes('jo'));
assert('Jordan with Amman cue', cs(tag('Jordan opens new solar park', 'Near Amman')) === 'jo');
assert('Chad Smith → no country', tag('Chad Smith joins utility board').countries.length === 0);
assert('Chad with Lake Chad → Chad', cs(tag('Floods hit Chad as Lake Chad swells')) === 'td');
assert('Niger Delta → Nigeria, not Niger', cs(tag('Shell restarts Niger Delta pipeline')) === 'ng');
assert('Niger junta + uranium → Niger', cs(tag('Niger junta revokes Orano uranium permit')) === 'ne');
assert('Nigeria not matched as Niger', cs(tag('Nigeria raises power tariffs')) === 'ng');
assert('Thanksgiving turkey → no country', tag('Turkey prices jump ahead of Thanksgiving').countries.length === 0);
assert('Turkey (country) → tr', cs(tag('Turkey raises interest rates as lira slides')) === 'tr');
assert('Türkiye → tr', cs(tag('Türkiye signs gas deal')) === 'tr');
assert('Washington (government) → us, no state', (() => { const r = tag('Washington weighs chip export controls on China'); return r.countries.join(',') === 'us,cn' && !r.admin1.length; })());
assert('Washington state → us-wa', tag('Washington state utility signs hydro deal').admin1[0] === 'us-wa');
assert('Washington Post → not a place', tag('Washington Post reports on Brazil ethanol').countries.join(',') === 'br');
assert('New Mexico is a US state, not Mexico', (() => { const r = tag('New Mexico approves solar farm'); return cs(r) === 'us' && r.admin1[0] === 'us-nm'; })());
assert('Gulf of Mexico → no country', tag('Gulf of Mexico lease sale draws bids').countries.length === 0);
assert('Papua New Guinea / Equatorial Guinea / Guinea-Bissau distinct', cs(tag('Papua New Guinea LNG')) === 'pg' && cs(tag('Equatorial Guinea oil')) === 'gq' && cs(tag('Guinea-Bissau cashew exports')) === 'gw');
assert('Gulf of Guinea → no country', tag('Piracy returns to the Gulf of Guinea').countries.length === 0);
assert('DRC vs Republic of the Congo', cs(tag('DRC cobalt exports rise')) === 'cd' && cs(tag('Republic of the Congo oil output')) === 'cg');
assert('US$ amount is not a US tag', cs(tag('US$2bn port deal signed in Mombasa')) === 'ke');
assert('Latin American → no US', tag('Latin American lithium boom').countries.length === 0);
assert('Indian Ocean → no India', tag('Indian Ocean shipping rates climb').countries.length === 0);
assert('lowercase china/chile/turkey ignored', tag('fine china and chile peppers and turkey sandwiches').countries.length === 0);
assert('South Sudan vs Sudan', cs(tag('South Sudan oil pipeline')) === 'ss' && cs(tag('Sudan war hits exports')) === 'sd');
assert('North vs South Korea', cs(tag('North Korea missile test')) === 'kp' && cs(tag('South Korea chip exports')) === 'kr');
assert('Northern Ireland → United Kingdom', cs(tag('Northern Ireland grid link approved')) === 'gb');
assert('New York → city + state', (() => { const r = tag('New York congestion pricing revenue'); return r.cities.includes('us-city-new-york') && r.admin1.includes('us-ny'); })());

console.log('\n--- Categories ---');
assert('energy', categorize({ title: 'Poland updates nuclear strategy' }) === 'energy');
assert('infrastructure', categorize({ title: 'Delhi metro expansion approved' }) === 'infrastructure');
assert('industry', categorize({ title: 'Factory production hits 18-month high' }) === 'industry');
assert('geopolitics', categorize({ title: 'EU agrees new sanctions package' }) === 'geopolitics');
assert('general when nothing matches', categorize({ title: 'Mint unveils new coins' }) === 'general');
assert('lone summary hit stays general', categorize({ title: 'Amazon kills Alexa AUX control', summary: 'No Echo with a 3.5mm port in six years.' }) === 'general');
assert('generic "security" is not geopolitics', categorize({ title: 'Microsoft brings more AI to PCs', summary: 'New security technology for AI agents.' }) === 'general');

console.log('\n--- Ranking per place ---');
const NOW = new Date('2026-10-07T18:00:00Z');
const h = (hrs) => new Date(NOW.getTime() - hrs * 3.6e6).toISOString();
let n = 0;
const mk = (o) => ({ id: `t${++n}`, url: `https://example.com/${n}`, title: o.title || `Story ${n}`, published: o.published || h(2), quality: o.quality ?? 2, category: o.category || 'energy', verification: { status: o.status || 'unconfirmed', clusterId: o.cluster || `c${n}`, clusterSize: o.clusterSize || 1 }, loc: { countries: o.countries || [], admin1: o.admin1 || [], cities: o.cities || [], titleCountries: o.titleCountries || o.countries || [] } });
const items = [
  ...['energy', 'energy', 'energy', 'infrastructure', 'industry', 'geopolitics'].map((c, i) => mk({ countries: ['us'], category: c, published: h(1 + i) })),
  mk({ countries: ['us'], admin1: ['us-tx'], category: 'energy', title: 'Texas solar factory' }),
  mk({ countries: ['us'], admin1: ['us-tx'], cities: ['us-city-houston'], category: 'industry', title: 'Houston plant' }),
  ...['energy', 'industry', 'geopolitics', 'infrastructure', 'energy'].map((c, i) => mk({ countries: ['ca'], category: c, published: h(3 + i) })),
  mk({ countries: ['de'], category: 'industry' }),
  mk({ countries: [], category: 'geopolitics', title: 'OPEC meeting' }),
  mk({ countries: ['cn'], category: 'energy', published: h(1) }), mk({ countries: ['cn'], category: 'energy', published: h(1) }), mk({ countries: ['cn'], category: 'energy', published: h(1) }),
];
const names = { country: countryName, admin1: (id) => ({ 'us-tx': 'Texas' }[id] || id), city: (id) => ({ 'us-city-houston': 'Houston' }[id] || id) };
assert('placeOf maps map state to levels', placeOf({}).level === 'world' && placeOf({ country: 'ca' }).level === 'country' && placeOf({ country: 'us', admin1: 'us-tx' }).level === 'admin1' && placeOf({ country: 'us', admin1: 'us-tx', city: 'us-city-houston' }).level === 'city');
assert('parent chain city → state → country → world', (() => { let p = placeOf({ country: 'us', admin1: 'us-tx', city: 'c' }); const lv = []; while (p) { lv.push(p.level); p = parentPlace(p); } return lv.join('>') === 'city>admin1>country>world'; })());
const us = topStories(items, placeOf({ country: 'us' }), { now: NOW });
assert('country view: 5 stories, all tagged to the country', us.length === TOP_N && us.every((i) => i.loc.countries.includes('us')));
assert('country view balanced across the four categories', ['energy', 'infrastructure', 'industry', 'geopolitics'].every((c) => us.some((i) => i.category === c)));
const world = topStories(items, placeOf({}), { now: NOW });
assert('world view: 5 stories, at most 2 per country', world.length === 5 && Object.values(world.reduce((m, i) => { const k = i.loc.countries[0] || '_'; m[k] = (m[k] || 0) + 1; return m; }, {})).every((v) => v <= 2));
assert('world view includes untagged world-level stories', rankedForPlace(items, placeOf({}), { now: NOW }).some((i) => i.title === 'OPEC meeting'));
assert('Canada view only Canada', topStories(items, placeOf({ country: 'ca' }), { now: NOW }).every((i) => i.loc.countries.includes('ca')));
assert('confirmed beats unconfirmed at equal age', (() => { const a = mk({ countries: ['fr'], status: 'confirmed', published: h(5) }); const b = mk({ countries: ['fr'], status: 'unconfirmed', published: h(5) }); return topStories([b, a], placeOf({ country: 'fr' }), { now: NOW })[0] === a; })());
assert('fresh beats week-old at equal tier', (() => { const a = mk({ countries: ['fr'], published: h(2) }); const b = mk({ countries: ['fr'], published: h(170) }); return topStories([b, a], placeOf({ country: 'fr' }), { now: NOW })[0] === a; })());
assert('same story cluster shown once', (() => { const a = mk({ countries: ['it'], cluster: 'x', clusterSize: 2 }); const b = mk({ countries: ['it'], cluster: 'x', clusterSize: 2 }); return rankedForPlace([a, b], placeOf({ country: 'it' }), { now: NOW }).length === 1; })());
assert('category filter narrows', topStories(items, placeOf({ country: 'us' }), { now: NOW, category: 'energy' }).every((i) => i.category === 'energy'));
assert('state-equivalent match uses admin1 tag', matchesPlace(items[6], placeOf({ country: 'us', admin1: 'us-tx' })) && !matchesPlace(items[0], placeOf({ country: 'us', admin1: 'us-tx' })));

console.log('\n--- Fallback labels ---');
const tx = buildColumn(items, placeOf({ country: 'us', admin1: 'us-tx' }), { names, now: NOW });
assert('state with 2 stories shows them first', tx.primary.length === 2 && tx.primary.every((i) => i.loc.admin1.includes('us-tx')));
assert('then "More from United States", labeled', tx.more[0]?.label === 'More from United States' && tx.more[0].items.length === TOP_N - 2);
assert('few-stories note is plain', tx.fewText === 'Only 2 recent stories are tagged to Texas.');
const hou = buildColumn(items, placeOf({ country: 'us', admin1: 'us-tx', city: 'us-city-houston' }), { names, now: NOW });
assert('city fallback walks up: Texas then United States', hou.primary.length === 1 && hou.more.map((g) => g.label).join('|') === 'More from Texas|More from United States');
assert('fallback never repeats a story', (() => { const urls = [...hou.primary, ...hou.more.flatMap((g) => g.items)].map((i) => i.url); return new Set(urls).size === urls.length && urls.length === TOP_N; })());
const lu = buildColumn(items, placeOf({ country: 'lu' }), { names, now: NOW });
assert('empty country: plain empty text', lu.primary.length === 0 && lu.emptyText === 'No recent stories tagged to Luxembourg yet.');
assert('empty country falls back to "More worldwide"', lu.more.length === 1 && lu.more[0].label === 'More worldwide' && lu.more[0].items.length === TOP_N);
const ca = buildColumn(items, placeOf({ country: 'ca' }), { names, now: NOW });
assert('4+ stories: no fallback, no padding', ca.primary.length >= MIN_N && ca.more.length === 0 && !ca.fewText);
assert('labels: World / More worldwide / place names', placeLabel(placeOf({}), names) === 'World' && moreLabel(placeOf({}), names) === 'More worldwide' && moreLabel(placeOf({ country: 'ca' }), names) === 'More from Canada');
assert('category empty text names the topic', buildColumn(items, placeOf({ country: 'de' }), { names, now: NOW, category: 'energy' }).emptyText === 'No recent energy stories tagged to Germany yet.');
assert('counts per category for chips', ca.counts.all === 5 && ca.counts.energy === 2);

console.log('\n--- Curated location ---');
const base = { version: 1, add: [], overrides: [] };
const add = { id: 'cur-test-loc', title: 'T', url: 'https://example.com/x', source: 'S', published: '2026-10-06T00:00:00Z', addedAt: '2026-10-07T00:00:00Z', status: 'unconfirmed', sources: [{ name: 'S', url: 'https://example.com/x' }] };
assert('location optional', validateCurated({ ...base, add: [add] }).length === 0);
assert('valid location accepted', validateCurated({ ...base, add: [{ ...add, location: { countries: ['us'], admin1: ['us-md'], cities: ['us-city-baltimore'] } }] }).length === 0);
assert('bad country id rejected', validateCurated({ ...base, add: [{ ...add, location: { countries: ['USA'] } }] }).length > 0);
assert('admin1 without its country rejected', validateCurated({ ...base, add: [{ ...add, location: { countries: ['ca'], admin1: ['us-md'] } }] }).length > 0);
assert('location-only override needs no status', validateCurated({ ...base, overrides: [{ match: { url: 'https://example.com/y' }, location: { countries: ['ca'], admin1: ['ca-ab'] }, addedAt: '2026-10-07T00:00:00Z' }] }).length === 0);
{
  const live = [{ id: 'live-1', url: 'https://example.com/y', title: 'Alberta', score: 50, published: '2026-10-07T00:00:00Z', loc: { countries: ['au'], admin1: [], cities: [] }, country: 'AU', countryId: 'au', verification: { status: 'unconfirmed' } }];
  const r = applyCurated(live, { ...base, overrides: [{ match: { url: 'https://example.com/y' }, location: { countries: ['ca'], admin1: ['ca-ab'] }, addedAt: '2026-10-07T00:00:00Z' }] }, new Date('2026-10-07T12:00:00Z'));
  const it = r.items[0];
  assert('override sets location, keeps tier', it.loc.countries[0] === 'ca' && it.loc.admin1[0] === 'ca-ab' && it.loc.basis === 'curated' && it.country === 'CA' && it.verification.status === 'unconfirmed');
  const r2 = applyCurated([], { ...base, add: [{ ...add, location: { countries: ['us'], admin1: ['us-md'] } }] }, new Date('2026-10-07T12:00:00Z'));
  assert('curated add carries its location', r2.items[0].loc.admin1[0] === 'us-md' && r2.items[0].countryId === 'us');
}
const curatedDoc = JSON.parse(read('./data/signals-curated.json'));
assert('signals-curated.json valid', validateCurated(curatedDoc).length === 0);
assert('seed entry has a location', curatedDoc.add.every((a) => !a.location || Array.isArray(a.location.countries)));
assert('RESEARCH-RUNS documents location field', /4a\. Location/.test(read('./RESEARCH-RUNS.md')) && /"location":/.test(read('./RESEARCH-RUNS.md')));

console.log('\n--- Pipeline ---');
{
  const src = { id: 'cbcx', name: 'Test CA', kind: 'hard-news', home: 'ca', assumeHome: true, quality: 3, tags: [] };
  const it = normalizeItem({ title: 'Ontario signs nuclear deal', link: 'https://example.com/on', published: new Date().toUTCString(), summary: '' }, src);
  assert('normalizeItem tags location + category + quality', it.loc.admin1[0] === 'ca-on' && it.countryId === 'ca' && it.category === 'energy' && it.quality === 3);
  const capped = capByLocation(Array.from({ length: 60 }, (_, i) => ({ ...it, id: `x${i}`, url: `https://example.com/c${i}`, score: 60 })), { perCountry: 10, worldOnly: 5 });
  assert('capByLocation keeps per-country cap', capped.length === 10);
  assert('gdeltDate parses seendate', gdeltDate('20261007T121500Z') === '2026-10-07T12:15:00.000Z');
  assert('GDELT query: source country + English + topics, no key', /sourcecountry%3Acanada/.test(gdeltUrl('ca')) && /sourcelang%3Aenglish/.test(gdeltUrl('ca')) && !/key=/i.test(gdeltUrl('ca')));
  const now = new Date('2026-10-07T18:00:00Z');
  const okFetch = async (u) => ({ ok: true, status: 200, body: JSON.stringify({ articles: [{ url: `https://news.example.ca/${encodeURIComponent(u).length}`, title: 'Port of Vancouver expansion approved', seendate: '20261007T100000Z', domain: 'news.example.ca', language: 'English' }] }) });
  const r = await gdeltTopUp([], { fetchImpl: okFetch, now, cache: { version: 1, countries: {} }, budget: 2, sleep: async () => {}, log: () => {} });
  assert('GDELT top-up queries thin countries within budget', r.stats.queried.length === 2 && Object.keys(r.cache.countries).length === 2);
  assert('GDELT items keep real link, tier-ready fields, location', r.items.length >= 1 && r.items.every((i) => /^https:/.test(i.url) && i.loc && i.quality === 1 && i.real));
  const limited = await gdeltTopUp([], { fetchImpl: async () => ({ ok: false, status: 429, body: 'Please limit requests to one every 5 seconds' }), now, cache: { version: 1, countries: {} }, budget: 5, sleep: async () => {}, log: () => {} });
  assert('GDELT rate limit stops the run cleanly', limited.stats.rateLimited && limited.stats.failed.length === 1 && limited.items.length === 0);
  const reused = await gdeltTopUp([], { fetchImpl: async () => { throw new Error('should not fetch'); }, now, cache: r.cache, budget: 0, sleep: async () => {}, log: () => {} });
  assert('GDELT cache reused between runs', reused.items.length === r.items.length);
  const old = await gdeltTopUp([], { fetchImpl: okFetch, now: new Date('2026-10-20T18:00:00Z'), cache: JSON.parse(JSON.stringify(r.cache)), budget: 0, sleep: async () => {}, log: () => {} });
  assert('GDELT cached articles expire after 7 days', old.items.length === 0);
  const ser = serializeFeed({ a: 1, items: [{ x: 1 }, { x: 2 }] });
  assert('serializeFeed round-trips', JSON.parse(ser).items.length === 2 && JSON.parse(ser).a === 1);
}

console.log('\n--- Live data ---');
{
  const live = JSON.parse(read('./data/signals-live.json'));
  assert('every live item has loc + category', live.items.every((i) => i.loc && Array.isArray(i.loc.countries) && i.category));
  assert('every live item has a real https/http link', live.items.every((i) => /^https?:\/\//.test(i.url)));
  const cov = coverage(live.items);
  assert('20+ countries have 4+ stories', cov.countriesWith4 >= 20, String(cov.countriesWith4));
  assert('US, Canada and Germany each have stories', ['us', 'ca', 'de'].every((c) => (cov.byCountry[c] || 0) >= 1));
  assert('coverage summary written', live.coverage && typeof live.coverage.countriesWith4 === 'number');
  const sources = JSON.parse(read('./data/sources.json')).sources;
  assert('sources: all https, no keys', sources.every((s) => /^https:\/\//.test(s.url) && !/api[_-]?key|token=/i.test(s.url)));
  assert('sources: home + quality on every feed', sources.every((s) => s.home && s.quality >= 1 && s.quality <= 3));
  assert('sources: 25+ non-US outlets', sources.filter((s) => s.home !== 'us').length >= 25);
}

console.log('\n--- News column UI wiring ---');
{
  const app = read('./app.js');
  const html = read('./index.html');
  const fn = (name) => { const i = app.indexOf(`function ${name}(`); return i < 0 ? '' : app.slice(i, app.indexOf('\nfunction ', i + 10)); };
  assert('renderFeed follows map state via placeOf(state)', /placeOf\(state\)/.test(fn('renderFeed')) && /buildColumn\(/.test(fn('renderFeed')));
  assert('render() re-renders the column on every selection / back / zoom-out', /renderFeed\(\);/.test(fn('render')) && /window\.addEventListener\('hashchange', applyHash\)/.test(app));
  assert('fallback groups rendered with their labels', /feed-more-h/.test(fn('renderFeed')) && /g\.label/.test(fn('renderFeed')));
  assert('topic chips (All + four categories)', /data-ncat/.test(app) && /CATEGORIES\.map/.test(fn('railCategoryChips')));
  assert('header shows place name + level', /rail-title/.test(fn('renderFeed')) && /LEVEL_NAMES/.test(fn('renderFeed')) && /id="rail-path"/.test(html));
  assert('no admin-1 wording', !/admin-1/i.test(app + html + read('./newsrank.js') + read('./locate.js')));
  assert('SW caches new modules', ['places.js', 'locate.js', 'newsrank.js'].every((f) => read('./sw.js').includes(`./${f}`)));
}

console.log('\n--- Copy: neutral, macro-to-micro, no tier / paid / US-first framing ---');
{
  const pub = { 'index.html': read('./index.html'), 'app.js': read('./app.js'), 'data.js': read('./data.js'), 'desks.js': read('./desks.js'), 'README.md': read('./README.md'), 'manifest.webmanifest': read('./manifest.webmanifest'), 'package.json': read('./package.json') };
  const banned = /US industrial ledger|US Industrial Desk|free world atlas|free atlas|US desks|US Progress|subscription|paywall|\bpaid\b|\$0\b|Free\./i;
  for (const [f, t] of Object.entries(pub)) assert(`${f}: no tier / paid / US-first wording`, !banned.test(t), (t.match(banned) || [])[0]);
  const html = pub['index.html'];
  assert('header: name + one neutral tagline, no kicker', /class="brand-title">Long Haul Ledger</.test(html) && !/brand-kicker/.test(html) && /Economic activity at every scale, from the world to your city\./.test(html));
  assert('meta + OG description carry the scale framing', /name="description" content="Economic activity at every scale/.test(html) && /og:description" content="Economic activity at every scale/.test(html));
  assert('Method copy: world → country → state equivalent → city', /zoom from the whole world to a country, a state equivalent or a city/i.test(pub['data.js']));
  const wf = read('./.github/workflows/soft-launch.yml');
  const ex = (wf.match(/exclude_assets:\s*'([^']*)'/) || [])[1] || '';
  assert('Pages excludes BUILD-PLAN.md, RESEARCH-RUNS.md, BRIEF.md', ['BUILD-PLAN.md', 'RESEARCH-RUNS.md', 'BRIEF.md'].every((f) => ex.split(',').includes(f)));
  assert('workflow commits GDELT cache', /data\/news-cache/.test(wf.match(/git add[^\n]*/)[0]));
}

{
  const now = new Date('2026-10-07T12:00:00Z');
  const base = { title: 'Port expansion approved', published: '2026-10-07T10:00:00Z', quality: 2, category: 'infrastructure', verification: { status: 'unconfirmed' } };
  const named = { ...base, loc: { countries: ['ca'], admin1: [], cities: [], titleCountries: [], basis: 'text' } };
  const homeOnly = { ...base, loc: { countries: ['ca'], admin1: [], cities: [], titleCountries: [], basis: 'source' } };
  assert('outlet-home-only tag ranks below a named place', rankScore(homeOnly, { country: 'ca' }, now) < rankScore(named, { country: 'ca' }, now));
  const speech = { ...named, title: 'Remarks by the Commissioner at the port forum' };
  assert('speech transcripts rank below reported news', rankScore(speech, { country: 'ca' }, now) < rankScore(named, { country: 'ca' }, now));
  const gen = { ...named, category: 'general' };
  const picks = topStories([gen, named, { ...named, title: 'Rail link opens', url: 'x2' }], { country: 'ca' }, { limit: 2, now });
  assert('topical stories fill before general ones', picks.every((p) => p.category !== 'general'));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
