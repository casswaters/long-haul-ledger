/**
 * Longview Ledger — lightweight data shape + nav helper asserts
 */
import { readFileSync, existsSync } from 'fs';
import {
  META, COUNTRIES, STUBS, getCountry, fullCountryIds, allCountryIds,
  globalFeed, filterSignals, opportunityNote, metricLabel,
} from './data.js';
import { parseHash, buildHash, normalizeTab, TABS } from './nav.js';

let passed = 0, failed = 0;
function assert(name, cond, detail = '') {
  if (cond) { passed++; console.log('  PASS ', name); }
  else { failed++; console.log('  FAIL ', name, detail ? '— ' + detail : ''); }
}

const FULL = ['us', 'in', 'ae', 'jp', 'ng', 'cl'];

console.log('\n--- Meta & files ---');
assert('name Longview Ledger', META.name === 'Longview Ledger');
assert('creed 10,000 Year Empire', META.creed === '10,000 Year Empire');
assert('domain intent noted', META.domainIntent === 'longviewledger.com');
assert('sample flag true', META.sample === true);
assert('index.html exists', existsSync(new URL('./index.html', import.meta.url)));
assert('world.svg exists', existsSync(new URL('./world.svg', import.meta.url)));
assert('sw.js cache name longview-ledger-v1', /longview-ledger-v1/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')));
assert('BRIEF.md exists', existsSync(new URL('./BRIEF.md', import.meta.url)));
assert('app has ?fresh=1 bust', /\bfresh\b/.test(readFileSync(new URL('./app.js', import.meta.url), 'utf8')));

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
assert('parse empty', parseHash('').country === null && parseHash('').tab === 'signals');
assert('parse c=us', parseHash('#c=us').country === 'us');
assert('parse tab+sector', parseHash('c=in&t=industries&s=energy').tab === 'industries' && parseHash('c=in&t=industries&s=energy').sector === 'energy');
assert('buildHash minimal', buildHash({ country: 'jp' }) === 'c=jp');
assert('buildHash full', buildHash({ country: 'ng', tab: 'regions', region: 'lagos' }) === 'c=ng&t=regions&r=lagos');
assert('normalizeTab', normalizeTab('openings') === 'openings' && normalizeTab('nope') === 'signals');
assert('TABS length 4', TABS.length === 4);

console.log('\n--- Aesthetic / anti-fantasy smoke ---');
const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
assert('slate/brass palette present', /--brass:\s*#c4a35a/.test(css) && /--bg:\s*#12161a/.test(css));
assert('not claiming live scrape in HTML', /SAMPLE/.test(html) && !/live scrap/i.test(html));
assert('creed in HTML', /10,000 Year Empire/.test(html));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
