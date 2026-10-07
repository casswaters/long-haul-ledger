import { readFileSync, existsSync } from 'fs';
import { FRED_SERIES, parseCsv, buildRecord, mergeSeries, validateStat, yoyPct, sparkSvg, isStale } from './stats.js';
import { runFred } from './scripts/fetch-stats.mjs';
import { stripHtml } from './scripts/fetch-signals.mjs';
import { validateCurated, applyCurated, isExpired } from './curated.js';
let pass = 0, fail = 0;
const assert = (n, c) => { if (c) { pass++; console.log('  PASS ', n); } else { fail++; console.log('  FAIL ', n); } };
console.log('\n--- Official stats pipeline ---');
const csv = 'observation_date,X\n2025-08-01,100\n2025-09-01,.\n2026-07-01,103\n2026-08-01,104\n';
const rows = parseCsv(csv);
assert('parseCsv skips missing "." values', rows.length === 3 && rows[2].value === 104);
const def = { ...FRED_SERIES.find((s) => s.id === 'cpi') };
const rec = buildRecord(def, rows, '2026-10-07T00:00:00Z');
assert('record carries unit, as-of, source link, cadence', validateStat(rec).length === 0 && rec.asOf === '2026-08-01' && /fred\.stlouisfed\.org\/series\/CPIAUCSL/.test(rec.sourceUrl) && rec.frequency === 'monthly');
assert('yoy uses same month a year earlier', yoyPct(rows) === 4);
const prev = { series: [rec] };
const merged = mergeSeries(prev, [{ id: 'cpi', seriesId: 'CPIAUCSL', error: 'HTTP 503' }], '2026-10-08T00:00:00Z');
assert('failure keeps last good value', merged.series[0].value === 104 && merged.series[0].lastError === 'HTTP 503');
assert('failure is logged', merged.fetchLog.length === 1 && merged.fetchLog[0].keptLastGood);
const fresh = mergeSeries(null, [{ id: 'cpi', seriesId: 'CPIAUCSL', error: 'HTTP 503' }], 'x');
assert('failure with no prior writes nothing invented', fresh.series.length === 0);
const r = await runFred({ fetchText: async () => { throw new Error('offline'); }, now: new Date('2026-10-07') });
assert('offline run returns errors, no records', r.every((x) => x.error && !x.record));
assert('sparkline renders svg path', /<path d="M/.test(sparkSvg([['a', 1], ['b', 2], ['c', 1.5]])));
assert('stale detection honours cadence', isStale({ asOf: '2026-01-01', staleAfterDays: 60 }, new Date('2026-10-07')) && !isStale({ asOf: '2026-10-01', staleAfterDays: 7 }, new Date('2026-10-07')));
const us = existsSync('./data/stats/us.json') ? JSON.parse(readFileSync('./data/stats/us.json', 'utf8')) : null;
assert('us.json present with every defined series', us && FRED_SERIES.every((d) => us.series.some((s) => s.id === d.id)));
assert('us.json: every line valid (unit, as-of, https source)', us && us.series.every((s) => validateStat(s).length === 0));
assert('us.json: no SAMPLE/ESTIMATE strings', us && !/SAMPLE|ESTIMATE/.test(JSON.stringify(us)));
assert('us.json: monthly series keep monthly dates', us && us.series.filter((s) => s.frequency === 'monthly').every((s) => s.asOf.endsWith('-01')));
const w = existsSync('./data/stats/world.json') ? JSON.parse(readFileSync('./data/stats/world.json', 'utf8')) : null;
assert('world.json: >150 countries, each value has year + World Bank link', w && Object.keys(w.countries).length > 150 && Object.values(w.countries).every((c) => Object.entries(c).filter(([k]) => k !== 'name').every(([, v]) => /^\d{4}$/.test(v.year) && /data\.worldbank\.org/.test(v.sourceUrl))));
const wf = readFileSync('./.github/workflows/stats.yml', 'utf8');
assert('workflow: cron daily + weekly, contents write, deploys gh-pages', /cron: '20 14,22/.test(wf) && /cron: '40 6 \* \* 1'/.test(wf) && /contents: write/.test(wf) && /publish_branch: gh-pages/.test(wf));
const app = readFileSync('./app.js', 'utf8');
assert('app: no admin-1 wording', !/admin-1/i.test(app));
import { spawnSync } from 'child_process';
for (const f of ['app.js', 'stats.js', 'desks.js', 'leadership.js']) assert(`${f} parses as a module (no early errors)`, spawnSync(process.execPath, ['--check', f]).status === 0);
{
  const html = readFileSync('./index.html', 'utf8'), css = readFileSync('./styles.css', 'utf8');
  assert('$ mark: left-column placeholder after panel content', /id="country-panel"[^>]*><\/div>\s*<div class="panel-dollar"/.test(html));
  assert('$ mark: one per layout (rail hidden on desktop, panel hidden on mobile)', /min-width: 901px\)[^}]*\{[^}]*\.panel \{ overflow: visible; \}\s*\.rail-dollar \{ display: none; \}/.test(css) && /max-width: 900px\) \{ \.panel-dollar \{ display: none; \}/.test(css));
  assert('$ mark: carousel spin on vertical axis (rotateY, no in-plane rotate)', /@keyframes rail-dollar-spin\s*\{[^}]*rotateY\(0deg\)[^}]*\}[^}]*rotateY\(360deg\)/.test(css) && !/rotate\((?:0|360)deg\)/.test(css));
  assert('$ mark: perspective parent + preserve-3d spinner in both marks', /\.panel-dollar-glyph \{[^}]*perspective:/.test(css) && /\.rail-dollar-glyph \{[^}]*perspective:/.test(css) && /\.dollar-spin \{[^}]*transform-style: preserve-3d/.test(css) && (html.match(/class="dollar-spin"/g) || []).length === 2);
  assert('$ mark: carousel 12% faster (57.14s per turn), pulse unchanged', /\.dollar-spin \{[^}]*animation: rail-dollar-spin 57\.14s linear infinite/.test(css) && !/rail-dollar-spin 64s/.test(css) && /rail-dollar-pulse 7\.5s ease-in-out infinite/.test(css));
  assert('$ mark: reduced motion stops the carousel', /prefers-reduced-motion: reduce\)[\s\S]*?\.dollar-spin \{ animation: none/.test(css));
  assert('$ mark: reduced motion stops the spin', /prefers-reduced-motion: reduce\)\s*\{\s*\.panel-dollar-glyph \{ animation: rail-dollar-pulse-static/.test(css));
}
assert('feed: numeric entity decoded once (&#039;)', stripHtml('If you&#039;re') === "If you're");
assert('feed: double-encoded entities decoded (&amp;#039; / &amp;amp;)', stripHtml('AT&amp;amp;T &amp;#039;x&amp;#039;') === "AT&T 'x'");
assert('feed: hex + named entities', stripHtml('Caf&#xE9; &mdash; ok') === 'Café — ok');
assert('feed: encoded markup is stripped, not rendered', !/<script/i.test(stripHtml('&lt;script&gt;alert(1)&lt;/script&gt;Hi')));
{
  const live = readFileSync('./data/signals-live.json', 'utf8');
  assert('signals-live.json: no leftover HTML entities in text', !/&(#x?[0-9a-f]+|amp|quot|apos|lt|gt);/i.test(live.replace(/"(url|link|sourceUrl)":\s*"[^"]*"/g, '')));
  assert('app escapes feed titles once at render', /\$\{escapeHtml\(i\.title\)\}/.test(readFileSync('./app.js', 'utf8')));
}
{
  const cur = JSON.parse(readFileSync('./data/signals-curated.json', 'utf8'));
  assert('curated: seed file validates', validateCurated(cur).length === 0);
  const seed = cur.add.find((a) => a.id === 'cur-anduril-arsenal-2');
  assert('curated: Anduril Arsenal-2 confirmed with Anduril + MD governor primary + Reuters', seed?.status === 'confirmed' && seed.sources.some((s) => s.primary && /anduril\.com/.test(s.url)) && seed.sources.some((s) => s.primary && /governor\.maryland\.gov/.test(s.url)) && seed.sources.some((s) => /Reuters/.test(s.name)));
  const now = new Date('2026-10-08T00:00:00Z');
  const live = [
    { id: 'live-a', title: 'Dive copy', url: seed.aliases[0], score: 90, published: '2026-10-07T00:00:00Z', verification: { status: 'unconfirmed', sources: [] } },
    { id: 'live-b', title: 'Other', url: 'https://example.com/b', score: 50, published: '2026-10-07T00:00:00Z', verification: { status: 'unconfirmed', sources: [{ name: 'X', url: 'https://example.com/b' }] } },
  ];
  const doc = { ...cur, overrides: [{ match: { url: 'https://example.com/b/' }, status: 'analysis', addedAt: '2026-10-07T00:00:00Z' }] };
  const { items, applied } = applyCurated(live, doc, now);
  assert('curated: add is pinned and replaces live alias copy', items.some((i) => i.id === seed.id && i.verification.status === 'confirmed' && i.verification.curated) && !items.some((i) => i.id === 'live-a'));
  assert('curated: override changes tier by url (trailing slash tolerant)', items.find((i) => i.id === 'live-b').verification.status === 'analysis' && applied.overridden.includes('live-b'));
  assert('curated: auto-expires after maxAgeDays', isExpired(seed, new Date('2026-11-06T00:00:00Z'), 30) && !isExpired(seed, now, 30));
  assert('curated: explicit expires honoured', isExpired({ ...seed, expires: '2026-10-07T00:00:00Z' }, now, 30));
  const expiredRun = applyCurated(live, cur, new Date('2026-12-01T00:00:00Z'));
  assert('curated: expired add drops out, live items untouched', !expiredRun.items.some((i) => i.id === seed.id) && expiredRun.applied.expired.includes(seed.id) && expiredRun.items.some((i) => i.id === 'live-a'));
  assert('curated: rejects confirmed without a primary source', validateCurated({ version: 1, add: [{ ...seed, sources: seed.sources.filter((s) => !s.primary) }], overrides: [] }).some((e) => /primary/.test(e)));
  assert('curated: rejects non-https / missing fields', validateCurated({ version: 1, add: [{ id: 'cur-x', title: 'x', url: 'http://x', source: '', published: 'nope', addedAt: '2026-10-07', status: 'confirmed', sources: [] }], overrides: [] }).length >= 4);
  assert('curated: invalid file leaves items unchanged', applyCurated(live, { version: 2 }, now).items === live);
  const sig = JSON.parse(readFileSync('./data/signals-live.json', 'utf8'));
  assert('signals-live.json carries the curated Anduril item as Confirmed', sig.items.some((i) => i.id === seed.id && i.verification.status === 'confirmed'));
  assert('workflow: curated edits trigger a rebuild', /paths: \['data\/signals-curated\.json'\]/.test(readFileSync('./.github/workflows/soft-launch.yml', 'utf8')));
}
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
