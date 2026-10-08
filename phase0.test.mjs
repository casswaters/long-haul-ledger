/** Phase 0 (SW v29): What changed strip, Prices benchmarks, Who's in the seat, Not yet covered, X links, coverage line. */
import { readFileSync } from 'fs';
import { placeIndicators, changeOf, lineFromWorldBank, whatChangedHtml, notCoveredHtml, lineHtml, coverageLine, STRIP_MAX, asOfLabel } from './whatchanged.js';
import { PRICES_ORDER, PINK_SERIES, FRED_SERIES, WB_INDICATORS } from './stats.js';
import { seatsFor, seatsHtml, isSeatChange, validateSeats } from './seats.js';
import { keyTerms, xQueryForStory, xQueryForPanel, xSearchUrl, xLinkHtml, X_LABEL } from './xsearch.js';
import { parseHash, buildHash, DESK_TABS } from './nav.js';
import { DESKS } from './desks.js';
import { pinkObservations, unzipEntry } from './scripts/fetch-stats.mjs';
import { buildCoverage } from './scripts/build-coverage.mjs';

let pass = 0, fail = 0;
const assert = (n, c) => { if (c) { pass++; console.log('  PASS ', n); } else { fail++; console.log('  FAIL ', n); } };
const read = (p) => readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));
const data = { us: json('./data/stats/us.json'), benchmarks: json('./data/stats/benchmarks.json'), world: json('./data/stats/world.json') };
const NOW = new Date('2026-10-08T18:00:00Z');

console.log('\n--- What changed: follows the place, only sourced lines ---');
const world = placeIndicators({ level: 'world' }, data, NOW);
const prices = world.groups.find((g) => g.id === 'prices');
assert('World: Activity, Prices, Capital only (no People)', world.groups.every((g) => ['activity', 'prices', 'capital'].includes(g.id)) && !!prices);
assert('Prices lead with gold, silver, bitcoin, WTI, Brent', prices.lines.slice(0, 5).map((l) => l.id).join(',') === 'gold,silver,bitcoin,wti,brent');
assert('then copper, natural gas, dollar index, US CPI', prices.lines.slice(5, 9).map((l) => l.id).join(',') === 'copper,natgas,usd,cpi');
assert('no diesel and no steel PPI in Prices', !prices.lines.some((l) => /diesel|steel/i.test(l.id + l.label)));
assert('every line: value, unit or $, as-of, https source', world.groups.every((g) => g.lines.every((l) => l.display && l.asOfText && /^https:\/\//.test(l.source.url) && (l.unit || /^\$/.test(l.display)))));
assert('every benchmark line has a change vs the prior reading', prices.lines.filter((l) => !l.id.startsWith('wb-')).every((l) => l.change && /[↑↓→]/.test(l.change.arrow)));
assert('CPI line is y/y inflation with the change in points', (() => { const c = prices.lines.find((l) => l.id === 'cpi'); return c.unit === '% y/y' && /pts|unchanged|under/.test(c.change.text); })());
assert('gold and silver come from the World Bank Pink Sheet', ['gold', 'silver'].every((id) => /World Bank Pink Sheet/.test(prices.lines.find((l) => l.id === id).source.name)));
assert('bitcoin from Coinbase via FRED (CBBTCUSD)', /CBBTCUSD/.test(prices.lines.find((l) => l.id === 'bitcoin').source.url));
assert('Prices order constant matches the brief', PRICES_ORDER.join(',') === 'gold,silver,bitcoin,wti,brent,copper,natgas,usd,cpi');
const us = placeIndicators({ level: 'country', country: 'us' }, data, NOW);
assert('US: Activity has FRED lines, Capital has the 10-year yield', us.groups.find((g) => g.id === 'activity').lines.some((l) => l.id === 'indpro') && us.groups.find((g) => g.id === 'capital').lines.some((l) => l.id === 'dgs10'));
assert('US: annual World Bank inflation skipped (monthly CPI shown)', !us.groups.flatMap((g) => g.lines).some((l) => l.id === 'wb-inflation'));
const ng = placeIndicators({ level: 'country', country: 'ng' }, data, NOW);
assert('Nigeria: 1960 trade figure hidden with a note', !ng.groups.flatMap((g) => g.lines).some((l) => l.id === 'wb-trade') && ng.hidden.some((h) => /1960, not shown/.test(h)));
const oh = placeIndicators({ level: 'admin1', country: 'us', admin1: 'us-oh' }, data, NOW);
assert('State equivalent with nothing wired: empty with a planned source', oh.empty && /BLS/.test(oh.planned));
const tw = placeIndicators({ level: 'country', country: 'tw' }, data, NOW);
assert('Taiwan: empty, planned source names DGBAS', tw.empty && /DGBAS/.test(tw.planned));
const emptyHtml = whatChangedHtml(oh, { placeLabel: 'Ohio', checked: 'Oct 8, 2026', parentLabel: 'United States', parentAttr: 'data-goto-place="{}"' });
assert('empty strip: one quiet Not yet covered line, planned source, checked date, parent link', /Not yet covered\./.test(emptyHtml) && /Planned source:/.test(emptyHtml) && /Checked Oct 8, 2026/.test(emptyHtml) && /See United States/.test(emptyHtml) && !/wc-group/.test(emptyHtml));
const html = whatChangedHtml(world, { placeLabel: 'World' });
assert('groups with zero lines are not rendered', !/No sourced entries yet/.test(html) && (html.match(/class="wc-group"/g) || []).length === world.groups.length);
assert('labels are never truncated with an ellipsis', !/…|\.\.\./.test(html.replace(/<[^>]+>/g, '')));
assert('source opens on tap (details/summary per line)', /<details class="wc-line"/.test(html) && /<summary class="wc-sum">/.test(html) && /target="_blank" rel="noopener noreferrer"/.test(html));
assert(`strip shows ${STRIP_MAX} lines per group, the rest behind "more"`, /wc-morelines/.test(html));
assert('changeOf: arrow + signed delta; percent units in points', changeOf(3.4, 3.3, { unit: '% y/y', decimals: 1 }).text === '+0.1 pts' && changeOf(90, 100, { decimals: 0 }).arrow === '↓' && changeOf(5, 5).text === 'unchanged');
assert('changeOf: tiny moves say "under", not a fake zero', /^under /.test(changeOf(103.07, 103.05, { decimals: 1 }).text));
assert('World Bank value older than 10 years is hidden', lineFromWorldBank(WB_INDICATORS[0], { value: 1, year: '2004', sourceUrl: 'https://data.worldbank.org/x' }, NOW).line === null);
assert('as-of labels: daily, monthly, annual', asOfLabel('2026-10-06', 'daily') === 'Oct 6, 2026' && asOfLabel('2026-08-01', 'monthly') === 'Aug 2026' && asOfLabel('2025') === '2025');
assert('benchmarks.json: Pink Sheet series, monthly dates, https sources', data.benchmarks.series.length === PINK_SERIES.length && data.benchmarks.series.every((s) => s.asOf.endsWith('-01') && /^https:\/\//.test(s.sourceUrl) && s.prior));
assert('us.json holds only defined FRED series (no stale copper / steel lines)', data.us.series.every((s) => FRED_SERIES.some((d) => d.id === s.id)));
{
  const rows = [['World Bank Commodity Price Data (The Pink Sheet)'], ['Updated on October 02, 2026'], [null, 'Crude oil, Brent', 'Gold', 'Silver', 'Copper'], [null, '($/bbl)', '($/troy oz)', '($/troy oz)', '($/mt)'], ['2026M08', 90.9, 4411, 65.4, 14326], ['2026M09', 116.8, 4319, 64.6, 14474]];
  const o = pinkObservations(rows);
  assert('Pink Sheet parser: header, units, monthly rows', o.updated === 'October 02, 2026' && o.series.gold.rows.length === 2 && o.series.gold.rows[1].date === '2026-09-01' && o.series.copper.rows[1].value === 14474);
  let threw = false; try { unzipEntry(Buffer.from('not a zip'), 'x'); } catch { threw = true; }
  assert('zip reader rejects non-zip input', threw);
}

console.log('\n--- Indicators overlay and nav ---');
assert('desks: Activity, Prices, Capital (People removed)', DESKS.map((d) => d.id).join(',') === 'activity,prices,capital' && DESK_TABS.join(',') === 'activity,prices,capital');
assert('old #d=people link opens Who\'s in the seat (US)', (() => { const h = parseHash('#d=people'); return h.seats && h.country === 'us' && h.desk === null && h.redirected && buildHash(h) === 'c=us&seats'; })());
assert('#c=gb&d=people keeps the country', buildHash(parseHash('#c=gb&d=people')) === 'c=gb&seats');
assert('#seats round-trips at World', buildHash(parseHash('#seats')) === 'seats');
const app = read('./app.js');
assert('app redirects the URL after #d=people (replaceState)', /h\.redirected/.test(app) && /replaceState/.test(app));
assert('Diesel moved to the Energy tab', /function energyPricesHtml/.test(app) && /prices\.diesel-us-retail/.test(app) && /energyPrices/.test(read('./sectorui.js')));
assert('World panel: no PROTOTYPE notice, no example chips, one-line intro', !/proto-callout|seed-chips/.test(app) && /Pick a place on the map; the numbers, seats and news follow it\./.test(app));

console.log('\n--- Who\'s in the seat ---');
const seats = json('./data/seats.json');
assert('seats.json validates (names, https official source, checked date)', validateSeats(seats).length === 0);
assert('US seats include the Fed, FERC, NRC, SEC, EPA and DOE', ['Federal Reserve', 'FERC', 'NRC', 'SEC', 'EPA', 'Department of Energy'].every((b) => seats.places.us.seats.some((s) => s.body === b)));
assert('every seat source is an official .gov page', seats.places.us.seats.every((s) => /^https:\/\/(www\.|home\.)?[a-z]+\.gov\//.test(s.sourceUrl)));
assert('validator rejects a placeholder name', validateSeats({ places: { x: { seats: [{ seat: 'Chair', name: '(see x.gov)', sourceUrl: 'https://x.gov', checked: '2026-10-08' }] } } }).length > 0);
const mUs = seatsFor({ level: 'country', country: 'us' }, seats);
const sh = seatsHtml(mUs, { placeLabel: 'United States', news: [{ title: 'Senate confirms new FERC commissioner', url: 'https://example.org/a', published: '2026-10-07T00:00:00Z', source: 'X' }] });
assert('seats view: name, source link, checked date, recent changes, news', /Kevin Warsh/.test(sh) && /federalreserve\.gov/.test(sh) && /checked Oct 8, 2026/.test(sh) && /Recent seat changes/.test(sh) && /Seat changes in the news/.test(sh));
const mFr = seatsFor({ level: 'country', country: 'fr' }, seats);
const shFr = seatsHtml(mFr, { placeLabel: 'France' });
assert('no seats: Not yet covered with planned source, no fake entries', /Not yet covered\./.test(shFr) && /Planned source:/.test(shFr) && !/class="seat"/.test(shFr));
assert('seat change detection: confirmations and resignations, not unrelated news', isSeatChange({ title: 'Senate confirms Smith as SEC commissioner' }) && isSeatChange({ title: 'Bank of Japan governor steps down' }) && !isSeatChange({ title: 'Oil prices rise on supply worries' }));
assert('news cards tag seat changes', /isSeatChange\(i\)/.test(app) && /seat change/.test(app));

console.log('\n--- X links ---');
const story = { title: 'Westinghouse teams up with Hyundai E&C for Dutch FEED studies' };
const terms = keyTerms(story.title);
assert('story query: 2 to 5 key terms, multi-word names quoted', terms.length >= 2 && terms.length <= 5 && /"Hyundai E&C"/.test(xQueryForStory(story)));
assert('panel query: segment name plus the place when not World', xQueryForPanel('Metals, cement and glass', 'Ohio') === '(metals OR cement OR glass) Ohio' && xQueryForPanel('Natural gas', 'World', { tab: 'energy', sub: 'gas' }) === '"natural gas"');
assert('URL is X live search, query encoded', xSearchUrl('"natural gas" Ohio') === 'https://x.com/search?q=%22natural%20gas%22%20Ohio&f=live');
const xl = xLinkHtml('"natural gas"');
assert('label exactly "See what people are saying on X", new tab, rel=noopener', X_LABEL === 'See what people are saying on X' && />See what people are saying on X</.test(xl) && /target="_blank"/.test(xl) && /rel="noopener/.test(xl));
assert('X link on every news card and each source/segment panel', /xLinkHtml\(xQueryForStory\(i\)\)/.test(app) && /ctx\.xLink\(subDef\)/.test(read('./sectorui.js')));
assert('no X API, embeds or posts on the site', !/platform\.twitter|widgets\.js|api\.x\.com|twitter-tweet/.test(app + read('./index.html')));
const css = read('./styles.css');
assert('X link: 44px tap target on phones, quiet styling', /\.x-link \{ display: inline-flex; align-items: center; min-height: 44px;/.test(css) && /\.x-link \{ font-size: 0\.68rem; color: var\(--ink-mute\)/.test(css));

console.log('\n--- Not yet covered, hygiene, coverage line ---');
const lead = json('./data/leadership.json');
const ls = JSON.stringify(lead);
assert('leadership: no response-time estimates left', !/responseTime/.test(ls));
assert('leadership: no "(see ...)" names or SAMPLE rows', !/\(see |SAMPLE/.test(ls));
assert('former placeholders are Not yet covered rows with a planned source', lead.areas.cl.roles.every((r) => (r.notCovered && r.plannedSource) || (r.verified && /^https:\/\//.test(r.source?.url || ''))) && lead.areas['us-city-new-york'].roles.some((r) => r.notCovered));
assert('brief missing says Not yet covered with planned source and checked date', /Not yet covered\.<\/strong> Planned source:/.test(read('./sectorui.js')) && /Checked \$\{esc\(ctx\.checked\)\}/.test(read('./sectorui.js')));
const cov = buildCoverage({ now: NOW });
assert('coverage: real counts from the files (187 countries, 4,315 state equivalents, 1,122 cities)', cov.countries === 187 && cov.stateEquivalents === 4315 && cov.cities === 1122 && cov.leaders.countries > 0);
assert('coverage line reads like a sentence with counts', /^Coverage today: .*leaders for \d+ of 187 countries/.test(coverageLine(cov)));
const ix = read('./index.html');
assert('Method page has the data-built coverage line', /id="method-coverage" data-built/.test(ix) && /renderCoverageLine/.test(app));
assert('data/coverage.json committed', json('./data/coverage.json').countries === 187);

console.log('\n--- Release plumbing and copy ---');
const sw = read('./sw.js');
assert('SW v30+ caches the new modules and data', Number((sw.match(/long-haul-ledger-v(\d+)/) || [])[1]) >= 30 && ['whatchanged.js', 'seats.js', 'xsearch.js', 'data/stats/benchmarks.json', 'data/seats.json', 'data/coverage.json'].every((f) => sw.includes(`'./${f}'`)));
for (const wf of ['soft-launch.yml', 'stats.yml']) {
  const y = read(`./.github/workflows/${wf}`);
  assert(`${wf}: keeps tests, hauls, archive and internal docs off Pages`, /exclude_assets: '[^']*phase0\.test\.mjs[^']*hauls[^']*BUILD-PLAN\.md,RESEARCH-RUNS\.md,BRIEF\.md,ROADMAP\.md/.test(y) && /archive\.html/.test(y) && /reorient\.test\.mjs/.test(y));
}
assert('stats.yml fetches the Pink Sheet', /fetch-stats\.mjs pinksheet/.test(read('./.github/workflows/stats.yml')));
const road = read('./ROADMAP.md');
assert('ROADMAP: coverage plan Phases 0 to 4 and Most reliable voices', /Coverage fill plan/.test(road) && /Phase 4/.test(road) && /Most reliable voices/.test(road));
assert('ROADMAP Decided: X only for Most reliable voices profiles, news column direct-to-source', /X is used only for Most reliable voices profiles/.test(road) && /direct-to-source/.test(road));
assert('ROADMAP: Who\'s in the seat will link to Most reliable voices', /Who's in the seat[^\n]*Most reliable voices/.test(road));
const copy = [app, read('./whatchanged.js'), read('./seats.js'), read('./xsearch.js'), ix, read('./data/seats.json')].join('\n');
assert('no em dashes or tildes in new copy', !/\u2014|~/.test(read('./whatchanged.js') + read('./seats.js') + read('./xsearch.js') + read('./data/seats.json')));
assert('no admin-1 wording', !/admin-1/i.test(copy));
assert('no paid-tier wording', !/\$49|paywall|pricing|premium/i.test(copy));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
