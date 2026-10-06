/**
 * Long Haul Ledger — data shape + nav + zoom + chains asserts
 */
import { readFileSync, existsSync } from 'fs';
import {
  META, COUNTRIES, STUBS, getCountry, fullCountryIds, allCountryIds,
  globalFeed, filterSignals, opportunityNote, metricLabel,
} from './data.js';
import { parseHash, buildHash, normalizeTab, normalizeView, TABS, VIEWS } from './nav.js';
import {
  clampZoom, resetTransform, transformCss, zoomAt, panBy,
  wheelToScale, stepZoom, exceededDragThreshold, ZOOM_MIN, ZOOM_MAX,
} from './zoom.js';
import {
  VALUE_CHAINS, getValueChain, getCompany, industriesForMindMap,
  mindMapLayout, seededChainCoverage, chainStages, COMPANIES,
} from './chains.js';

let passed = 0, failed = 0;
function assert(name, cond, detail = '') {
  if (cond) { passed++; console.log('  PASS ', name); }
  else { failed++; console.log('  FAIL ', name, detail ? '— ' + detail : ''); }
}

const FULL = ['us', 'in', 'ae', 'jp', 'ng', 'cl'];

console.log('\n--- Meta & files ---');
assert('name Long Haul Ledger', META.name === 'Long Haul Ledger');
assert('creed 10,000 Year Empire', META.creed === '10,000 Year Empire');
assert('domain intent noted', META.domainIntent === 'longhaulledger.com');
assert('sample flag true', META.sample === true);
assert('index.html exists', existsSync(new URL('./index.html', import.meta.url)));
assert('world.svg exists', existsSync(new URL('./world.svg', import.meta.url)));
assert('sw.js cache name long-haul-ledger-v2', /long-haul-ledger-v2/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')));
assert('BRIEF.md exists', existsSync(new URL('./BRIEF.md', import.meta.url)));
assert('app has ?fresh=1 bust', /\bfresh\b/.test(readFileSync(new URL('./app.js', import.meta.url), 'utf8')));
assert('zoom.js exists', existsSync(new URL('./zoom.js', import.meta.url)));
assert('chains.js exists', existsSync(new URL('./chains.js', import.meta.url)));

console.log('\n--- Seed countries ---');
assert('six full desks', FULL.every((id) => COUNTRIES[id]) && fullCountryIds().length === 6, String(fullCountryIds()));
for (const id of FULL) {
  const c = COUNTRIES[id];
  assert(`${id}: name + snapshot`, !!c.name && !!c.snapshot);
  assert(`${id}: metrics 0–100`, ['stability', 'frontierPressure', 'opportunity'].every((k) => c.metrics[k] >= 0 && c.metrics[k] <= 100));
  assert(`${id}: 4–6+ headlines`, c.signals.length >= 4 && c.signals.length <= 8, String(c.signals.length));
  assert(`${id}: industries 4–8`, c.industries.length >= 4 && c.industries.length <= 8, String(c.industries.length));
  assert(`${id}: regions 2–4`, c.regions.length >= 2 && c.regions.length <= 4, String(c.regions.length));
  assert(`${id}: ≥2 openings`, c.openings.length >= 2, String(c.openings.length));
  assert(`${id}: signal weights numeric`, c.signals.every((s) => typeof s.weight === 'number' && s.weight > 0));
  assert(`${id}: openings have sectors`, c.openings.every((o) => Array.isArray(o.sectors) && o.sectors.length > 0));
}

console.log('\n--- Stubs & helpers ---');
assert('stubs present', Object.keys(STUBS).length >= 8);
assert('getCountry us full', getCountry('us')?.tier === 'full');
assert('getCountry CN stub case-insensitive', getCountry('CN')?.tier === 'stub');
assert('getCountry unknown null', getCountry('zz') === null);
assert('allCountryIds includes full+stubs', allCountryIds().length === fullCountryIds().length + Object.keys(STUBS).length);
const feed = globalFeed(10);
assert('globalFeed sorted & capped', feed.length === 10 && feed.every((i) => i.countryId && i.title));
assert('filterSignals by sector', filterSignals(COUNTRIES.us, { sector: 'energy' }).every((s) => s.sector === 'energy'));
assert('opportunityNote finds opening', opportunityNote(COUNTRIES.us, 'energy')?.sectors.includes('energy'));
assert('metricLabel bands', metricLabel(90) === 'high' && metricLabel(40) === 'strained');

console.log('\n--- Nav helpers ---');
assert('parse empty', parseHash('').country === null && parseHash('').tab === 'signals' && parseHash('').view === 'desk');
assert('parse c=us', parseHash('#c=us').country === 'us');
assert('parse tab+sector', parseHash('c=in&t=industries&s=energy').tab === 'industries' && parseHash('c=in&t=industries&s=energy').sector === 'energy');
assert('parse mindmap view', parseHash('c=us&v=mindmap').view === 'mindmap');
assert('parse chain+company', parseHash('c=us&v=company&s=energy&co=us-gridforge').view === 'company' && parseHash('c=us&v=company&s=energy&co=us-gridforge').company === 'us-gridforge');
assert('buildHash minimal', buildHash({ country: 'jp' }) === 'c=jp');
assert('buildHash full desk', buildHash({ country: 'ng', tab: 'regions', region: 'lagos' }) === 'c=ng&t=regions&r=lagos');
assert('buildHash mindmap', buildHash({ country: 'us', view: 'mindmap' }) === 'c=us&v=mindmap');
assert('buildHash company', buildHash({ country: 'us', view: 'company', sector: 'energy', company: 'us-gridforge' }) === 'c=us&v=company&s=energy&co=us-gridforge');
assert('normalizeTab', normalizeTab('openings') === 'openings' && normalizeTab('nope') === 'signals');
assert('normalizeView', normalizeView('chain') === 'chain' && normalizeView('nope') === 'desk');
assert('TABS length 4', TABS.length === 4);
assert('VIEWS includes mindmap/chain/company', VIEWS.includes('mindmap') && VIEWS.includes('chain') && VIEWS.includes('company'));

console.log('\n--- Zoom helpers ---');
assert('clampZoom bounds', clampZoom(0) === ZOOM_MIN && clampZoom(99) === ZOOM_MAX && clampZoom(2.5) === 2.5);
assert('resetTransform identity', resetTransform().scale === 1 && resetTransform().tx === 0);
assert('transformCss string', /scale\(2\)/.test(transformCss({ scale: 2, tx: 10, ty: -5 })) && /translate\(10px, -5px\)/.test(transformCss({ scale: 2, tx: 10, ty: -5 })));
{
  const z = zoomAt({ scale: 1, tx: 0, ty: 0 }, 2, 100, 100);
  assert('zoomAt keeps focal', Math.abs(z.tx - (-100)) < 0.01 && Math.abs(z.ty - (-100)) < 0.01 && z.scale === 2);
}
assert('panBy adds deltas', panBy({ scale: 2, tx: 5, ty: 5 }, 10, -3).tx === 15 && panBy({ scale: 2, tx: 5, ty: 5 }, 10, -3).ty === 2);
assert('wheelToScale zooms in on negative delta', wheelToScale(1, -200) > 1);
assert('wheelToScale zooms out on positive delta', wheelToScale(2, 200) < 2);
assert('stepZoom in/out', stepZoom(1, +1) > 1 && stepZoom(2, -1) < 2);
assert('drag threshold', exceededDragThreshold(10, 0) === true && exceededDragThreshold(2, 2) === false);

console.log('\n--- Value chains & companies ---');
const coverage = seededChainCoverage();
assert('all 6 seeds have chains', FULL.every((id) => coverage[id]?.length >= 2), JSON.stringify(coverage));
for (const id of FULL) {
  assert(`${id}: ≥2–3 full chain industries`, coverage[id].length >= 2 && coverage[id].length <= 6, String(coverage[id]));
  for (const sid of coverage[id]) {
    const chain = getValueChain(id, sid);
    assert(`${id}/${sid}: three stages`, chainStages().every((st) => Array.isArray(chain[st]) && chain[st].length >= 2));
    for (const st of chainStages()) {
      for (const p of chain[st]) {
        const co = getCompany(p.id);
        assert(`${p.id}: company desk`, !!co && co.announcements?.length >= 3 && co.pipeline?.length >= 2);
        assert(`${p.id}: SAMPLE flag`, co.sample === true);
      }
    }
  }
}
assert('companies populated', Object.keys(COMPANIES).length >= 40, String(Object.keys(COMPANIES).length));
{
  const stubInd = industriesForMindMap('cn');
  assert('stub mindmap industries invented', stubInd.length >= 4);
  const layout = mindMapLayout(stubInd);
  assert('mindMapLayout center + industries', layout[0].kind === 'country' && layout.length === stubInd.length + 1);
  const stubChain = getValueChain('cn', stubInd[0].id);
  assert('stub chain generated', stubChain?.stub === true && stubChain.upstream.length >= 2);
  assert('stub company desk', !!getCompany(stubChain.upstream[0].id)?.announcements?.length);
}

console.log('\n--- Aesthetic / anti-fantasy smoke ---');
const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const brief = readFileSync(new URL('./BRIEF.md', import.meta.url), 'utf8');
assert('slate/brass palette present', /--brass:\s*#c4a35a/.test(css) && /--bg:\s*#12161a/.test(css));
assert('SAMPLE desks still labeled', /SAMPLE/.test(html));
assert('US Progress / soft launch in HTML', /US Progress/i.test(html) && /SOFT LAUNCH/i.test(html));
assert('vertical zoom controls CSS', /flex-direction:\s*column/.test(css) && /zoom-controls/.test(css));
assert('creed in HTML', /10,000 Year Empire/.test(html));
assert('zoom controls in HTML', /id="zoom-in"/.test(html) && /id="zoom-out"/.test(html));
assert('BRIEF documents click distinction', /single-click/i.test(brief) && /double-click/i.test(brief) && /mind map/i.test(brief));
assert('overlay styles present', /ledger-overlay/.test(css) && /mindmap-svg/.test(css) && /chain-grid/.test(css));
assert('no will-change transform on map viewport', !/will-change:\s*transform/.test(css));
assert('shape-rendering geometricPrecision in CSS', /shape-rendering:\s*geometricPrecision/.test(css));
assert('app uses size-based map zoom', /rect\.width\) \* scale/.test(readFileSync(new URL('./app.js', import.meta.url), 'utf8')));


console.log('\n--- Soft-launch normalize / score ---');
{
  const {
    stripHtml, parseFeedXml, normalizeItem, scoreItem, mergeAndCap, toIsoDate,
  } = await import('./scripts/fetch-signals.mjs');
  assert('stripHtml removes tags', stripHtml('<b>Hi &amp; bye</b>') === 'Hi & bye');
  const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
    <item><title>US grid transmission reform</title><link>https://example.com/a</link><pubDate>Tue, 06 Oct 2026 12:00:00 GMT</pubDate><description>Nuclear and battery storage on the interconnection queue.</description></item>
    <item><title>Celebrity gossip night</title><link>https://example.com/b</link><pubDate>Tue, 06 Oct 2026 11:00:00 GMT</pubDate><description>Reality TV box office.</description></item>
  </channel></rss>`;
  const parsed = parseFeedXml(rss);
  assert('parseFeedXml item count', parsed.length === 2, String(parsed.length));
  assert('parseFeedXml title/link', parsed[0].title.includes('grid') && parsed[0].link.includes('example.com/a'));
  const src = { id: 't', name: 'Test Feed', kind: 'hard-news', countryDefault: 'US', tags: ['energy'] };
  const n = normalizeItem(parsed[0], src);
  assert('normalize fields', n.real === true && n.country === 'US' && n.url.startsWith('http') && typeof n.score === 'number');
  assert('toIsoDate parses', !!toIsoDate(parsed[0].published));
  const high = scoreItem({ title: 'US semiconductor fab and grid transmission', summary: 'AI data center power', tags: ['compute'], country: 'US', kind: 'hard-news' });
  const low = scoreItem({ title: 'Celebrity gossip reality tv', summary: 'box office', tags: [], country: 'US', kind: 'hard-news' });
  assert('score prefers progress keywords', high > low && high >= 50, `high=${high} low=${low}`);
  const merged = mergeAndCap([
    { ...n, score: 90 },
    { ...n, id: 'dup', score: 80 },
    { ...normalizeItem(parsed[1], src), score: 10 },
  ], 50);
  assert('mergeAndCap dedupes URL + drops low score', merged.length === 1 && merged[0].score === 90, String(merged.length));
  assert('sources.json exists', existsSync(new URL('./data/sources.json', import.meta.url)));
  assert('signals-live.json exists', existsSync(new URL('./data/signals-live.json', import.meta.url)));
  const live = JSON.parse(readFileSync(new URL('./data/signals-live.json', import.meta.url), 'utf8'));
  assert('live items capped 80–120', live.itemCount >= 80 && live.itemCount <= 120, String(live.itemCount));
  assert('live items REAL with urls', live.items.every((i) => i.real && /^https?:/i.test(i.url)));
  assert('soft-launch workflow exists', existsSync(new URL('./.github/workflows/soft-launch.yml', import.meta.url)));
  assert('BRIEF documents soft launch', /soft launch/i.test(brief) && /US Progress/i.test(brief));
  assert('META softLaunch', META.softLaunch === true);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
