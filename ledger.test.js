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
assert('sw.js cache name long-haul-ledger-v6', /long-haul-ledger-v6/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')));
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



console.log('\n--- Geo drill + leadership ---');
{
  const {
    project, geometryToPath, featureBbox, bboxToViewBox, padBbox,
    insetsForCountry, projectorFor, geometrySvgBox, countryDrillSvgBox, levelLabel, clipAdminToWorld,
    countriesWithAdmin1, adminFeaturesForCountry, findAdminFeature,
    citiesForAdmin, findCityFeature, countryBboxFromAdmin,
    drillBreadcrumb, mindMapAllowed, SVG_W, SVG_H,
  } = await import('./geo.js');
  const {
    resolveLeadership, leadershipStack, roleBadge, leadershipKeys,
  } = await import('./leadership.js');

  assert('project x plate carrée', (() => {
    const [x0] = project(-180, 10);
    const [x1] = project(180, 10);
    return Math.abs(x0) < 0.01 && Math.abs(x1 - SVG_W) < 0.01;
  })());
  assert('project equator calibrated to world.svg (y≈578.5)', Math.abs(project(0, 0)[1] - 578.5) < 0.01);
  assert('project y scale = 1001/180 per degree', Math.abs((project(0, 0)[1] - project(0, 10)[1]) - (SVG_H / 180) * 10) < 0.001);
  assert('admin1.geojson exists', existsSync(new URL('./data/geo/admin1.geojson', import.meta.url)));
  assert('cities.geojson exists', existsSync(new URL('./data/geo/cities.geojson', import.meta.url)));
  assert('leadership.json exists', existsSync(new URL('./data/leadership.json', import.meta.url)));
  assert('geo.js + leadership.js exist', existsSync(new URL('./geo.js', import.meta.url)) && existsSync(new URL('./leadership.js', import.meta.url)));

  const admin = JSON.parse(readFileSync(new URL('./data/geo/admin1.geojson', import.meta.url), 'utf8'));
  const cities = JSON.parse(readFileSync(new URL('./data/geo/cities.geojson', import.meta.url), 'utf8'));
  const lead = JSON.parse(readFileSync(new URL('./data/leadership.json', import.meta.url), 'utf8'));

  // Layer alignment: state-equivalent rings projected with project() must land
  // on world.svg country paths (the old centred projection was ~78 units off).
  {
    const worldSvg = readFileSync(new URL('./world.svg', import.meta.url), 'utf8');
    const svgBox = (id) => {
      const m = worldSvg.match(new RegExp(`id="${id}" d="([^"]+)"`));
      const pts = [...m[1].matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((a) => [+a[1], +a[2]]);
      const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    };
    for (const [id, tol] of [['us', 2], ['in', 2], ['jp', 3], ['ae', 3]]) {
      const b = countryBboxFromAdmin(admin, id);
      const [ax0, ay0] = project(b[0], b[3]);
      const [ax1, ay1] = project(b[2], b[1]);
      const w = svgBox(id);
      // top edge (northernmost) + x extent must agree; southern islands may differ in resolution
      const dTop = Math.abs(ay0 - w.y0);
      const dX = id === 'jp' ? 0 : Math.abs(ax1 - w.x1);
      assert(`${id}: admin layer aligned with world.svg (Δtop ${dTop.toFixed(2)}, Δx ${dX.toFixed(2)})`, dTop < tol && dX < tol);
    }
    const usB = countryBboxFromAdmin(admin, 'us');
    const [, usBottom] = project(0, usB[1]);
    assert('us: southern edge (Hawaii) aligned', Math.abs(usBottom - svgBox('us').y1) < 2, `${usBottom} vs ${svgBox('us').y1}`);
  }

  // Insets: Alaska / Hawaii drawn inside their frames, contiguous US untouched
  {
    const insets = insetsForCountry('us');
    assert('us insets: Alaska + Hawaii', insets.map((i) => i.admin1).sort().join(',') === 'us-ak,us-hi');
    for (const inset of insets) {
      const f = findAdminFeature(admin, inset.admin1);
      const b = geometrySvgBox(f.geometry, projectorFor('us', inset.admin1));
      const fr = inset.frame;
      assert(`${inset.admin1} drawn inside inset frame`, b.x >= fr.x && b.y >= fr.y && b.x + b.width <= fr.x + fr.w && b.y + b.height <= fr.y + fr.h, JSON.stringify(b));
    }
    const tx = findAdminFeature(admin, 'us-tx');
    const txBox = geometrySvgBox(tx.geometry, projectorFor('us', 'us-tx'));
    const [txX] = project(featureBbox(tx)[0], 0);
    assert('contiguous states use plain projection', Math.abs(txBox.x - txX) < 0.01);
    const fit = countryDrillSvgBox(admin, 'us');
    const [farWest] = project(-171, 60);
    assert('US drill fit excludes true Alaska position (uses inset)', fit.x > farWest + 100 && fit.width < 400, JSON.stringify(fit));
    assert('no insets for India', insetsForCountry('in').length === 0);
    assert('JP/AE approximations clip to coastline', clipAdminToWorld('jp') && clipAdminToWorld('ae') && !clipAdminToWorld('us'));
  }

  // User-facing wording: World → Country → State equivalent → City
  assert('levelLabel admin1 → State equivalent', levelLabel('admin1') === 'State equivalent');
  assert('breadcrumb carries level labels', drillBreadcrumb({ country: 'us', admin1: 'us-ca', city: 'x' }).map((b) => b.levelLabel).join(' → ') === 'World → Country → State equivalent → City');
  {
    const appSrc = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
    const dataSrc = readFileSync(new URL('./data.js', import.meta.url), 'utf8');
    assert('no visible admin-1 wording (html/brief/readme/data/app)', ![html, brief, readFileSync(new URL('./README.md', import.meta.url), 'utf8'), dataSrc, appSrc].some((t) => /admin-1/i.test(t)));
    assert('legend says State equivalent', /World → Country → State equivalent → City/.test(html));
  }

  const seeded = countriesWithAdmin1(admin);
  assert('admin1 seeds us/in/ae/jp', seeded.has('us') && seeded.has('in') && seeded.has('ae') && seeded.has('jp'), [...seeded].join(','));
  assert('US has 50+ states', adminFeaturesForCountry(admin, 'us').length >= 50, String(adminFeaturesForCountry(admin, 'us').length));
  assert('India has many states', adminFeaturesForCountry(admin, 'in').length >= 20);
  assert('UAE emirates seeded', adminFeaturesForCountry(admin, 'ae').length >= 5);
  assert('Japan regions seeded', adminFeaturesForCountry(admin, 'jp').length >= 5);
  const ca = findAdminFeature(admin, 'us-ca');
  assert('us-ca feature + path', !!ca && geometryToPath(ca.geometry).includes('M'));
  assert('us-ca bbox', !!featureBbox(ca) && featureBbox(ca)[0] < -114);
  assert('bboxToViewBox string', /^-?\d/.test(bboxToViewBox(padBbox(featureBbox(ca)))));
  assert('cities for us-ca', citiesForAdmin(cities, { country: 'us', admin1: 'us-ca' }).length >= 1);
  assert('find city LA', !!findCityFeature(cities, 'us-city-los-angeles'));
  assert('country bbox us', !!countryBboxFromAdmin(admin, 'us'));
  assert('breadcrumb depth', drillBreadcrumb({ country: 'us', countryName: 'United States', admin1: 'us-ca', admin1Name: 'California', city: 'us-city-los-angeles', cityName: 'Los Angeles' }).length === 4);
  assert('mindMapAllowed country only', mindMapAllowed(null, null) === true && mindMapAllowed('us-ca', null) === false);

  assert('leadership us federal', resolveLeadership(lead, { country: 'us' })?.roles?.length >= 4);
  assert('leadership prefers city', resolveLeadership(lead, { country: 'us', admin1: 'us-ca', city: 'us-city-los-angeles' })?.key === 'us-city-los-angeles');
  assert('leadership stack grows', leadershipStack(lead, { country: 'us', admin1: 'us-ca', city: 'us-city-los-angeles' }).length === 3);
  assert('leadership keys order', leadershipKeys({ country: 'us', admin1: 'us-ca', city: 'x' })[0] === 'x');
  const usPresident = lead.areas.us.roles[0];
  assert('public contact only', !!usPresident.contact.site || !!usPresident.contact.form);
  assert('response badge ESTIMATE or plain', !!usPresident.responseTime);
  assert('nav parse admin1+city', parseHash('c=us&a=us-ca&city=us-city-los-angeles').admin1 === 'us-ca' && parseHash('c=us&a=us-ca&city=us-city-los-angeles').city === 'us-city-los-angeles');
  assert('buildHash admin1', buildHash({ country: 'us', admin1: 'us-tx' }) === 'c=us&a=us-tx');
  assert('buildHash suppresses mindmap below country', !buildHash({ country: 'us', admin1: 'us-ca', view: 'mindmap' }).includes('v=mindmap'));
  assert('HTML documents mind map country-only', /mind map: country level only/i.test(html));
  assert('SW caches geo + leadership', /data\/geo\/admin1\.geojson/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')) && /leadership\.json/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')));
  assert('app has leadership accordion', /leadership-acc/.test(readFileSync(new URL('./app.js', import.meta.url), 'utf8')));
  assert('css leadership + breadcrumb', /leadership-acc/.test(css) && /map-breadcrumb/.test(css) && /admin1-path/.test(css));
}

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


console.log('\n--- City label collision avoidance ---');
{
  const {
    layoutLabels, countOverlaps, labelFontPx, dotRadiusPx, labelPriority, estimateTextWidth, boxesOverlap,
  } = await import('./labels.js');
  const { project, citiesForAdmin } = await import('./geo.js');
  const cities = JSON.parse(readFileSync(new URL('./data/geo/cities.geojson', import.meta.url), 'utf8'));
  assert('font smaller zoomed out', labelFontPx(1) < labelFontPx(3) && labelFontPx(6) <= 12.5);
  assert('dot radius stays small', dotRadiusPx(1) >= 3 && dotRadiusPx(6) < 6 && dotRadiusPx(1, true) > dotRadiusPx(1));

  // Stacked dots: only the biggest city keeps its label; others hide, never stack
  const stack = [
    { id: 'big', x: 100, y: 100, text: 'Big City', priority: 9e6, r: 3 },
    { id: 'mid', x: 101, y: 100.5, text: 'Mid City', priority: 5e6, r: 3 },
    { id: 'small', x: 100.5, y: 101, text: 'Small City', priority: 1e6, r: 3 },
  ];
  const ls = layoutLabels(stack, { fontPx: 10 });
  assert('every city gets a layout entry (dots stay)', ls.size === 3);
  assert('highest priority label always placed', ls.get('big').visible);
  assert('stacked labels never overlap', countOverlaps(ls) === 0);

  // Labels must not cover other dots
  const pair = [
    { id: 'a', x: 50, y: 50, text: 'Alpha', priority: 2, r: 3 },
    { id: 'b', x: 62, y: 50, text: 'Beta', priority: 1, r: 3 },
  ];
  const lp = layoutLabels(pair, { fontPx: 10 });
  const dotB = { x0: 59, y0: 47, x1: 65, y1: 53 };
  assert('label avoids neighbour dot', !lp.get('a').visible || !boxesOverlap(lp.get('a').box, dotB));
  assert('far slot uses leader line', [...lp.values()].every((l) => !l.visible || typeof l.leader === 'boolean'));

  // Real US cities at zoomed-out vs zoomed-in pixel densities
  const us = citiesForAdmin(cities, { country: 'us' });
  const mk = (k) => us.map((f) => {
    const [x, y] = project(...f.geometry.coordinates);
    return { id: f.properties.id, x: x * k, y: y * k, text: f.properties.name, r: dotRadiusPx(1, f.properties.capital), priority: labelPriority(f.properties) };
  });
  const out = layoutLabels(mk(0.7), { fontPx: labelFontPx(1) });  // narrow / mobile density
  const zin = layoutLabels(mk(8), { fontPx: labelFontPx(3.3) });
  const shownOut = [...out.values()].filter((l) => l.visible).length;
  const shownIn = [...zin.values()].filter((l) => l.visible).length;
  assert('US zoomed out: no label overlaps', countOverlaps(out) === 0);
  assert('US zoomed in: no label overlaps', countOverlaps(zin) === 0);
  assert('zooming in reveals more labels', shownIn >= shownOut && shownIn === us.length, `${shownOut} → ${shownIn}`);
  assert('zoomed out keeps New York label (priority)', out.get('us-city-new-york').visible);
  const hiddenOut = [...out.entries()].filter(([, l]) => !l.visible).map(([id]) => id);
  const minShownPop = Math.min(...us.filter((f) => out.get(f.properties.id).visible).map((f) => labelPriority(f.properties)));
  assert('some dense labels hide when zoomed out', hiddenOut.length > 0, String(hiddenOut.length));
  assert('selected city forced visible', layoutLabels(mk(1.2).map((i) => ({ ...i, priority: i.id === 'us-city-fort-worth' ? labelPriority({ id: 'us-city-fort-worth' }, 'us-city-fort-worth') : i.priority })), { fontPx: 9.5 }).get('us-city-fort-worth').visible);
  assert('estimateTextWidth scales with font', estimateTextWidth('Dallas', 12) > estimateTextWidth('Dallas', 9));
  void minShownPop;
}

console.log('\n--- Verification tiers ---');
{
  const V = await import('./verify.js');
  const t0 = '2026-10-06T12:00:00Z';
  const t1 = '2026-10-06T20:00:00Z';
  const t5d = '2026-10-11T12:00:00Z';
  const ars = { id: 'a', title: 'Neutrino physicist wins 2026 Nobel Physics Prize', blurb: 'Francis Halzen of University of Wisconsin-Madison led development of IceCube Neutrino Observatory.', url: 'https://arstechnica.com/x', source: 'Ars Technica', sourceId: 'ars-technica', kind: 'hard-news', published: t0, real: true };
  const npr = { id: 'b', title: 'Francis Halzen wins Nobel Prize in physics for work on high-energy neutrinos from space', blurb: 'The scientist is affiliated with the University of Wisconsin–Madison.', url: 'https://www.npr.org/y', source: 'NPR Science', sourceId: 'npr-science', kind: 'hard-news', published: t1, real: true };
  const wolf = { id: 'c', title: 'Physicist Jun Ye Wins Wolf Prize in Physics', blurb: 'The award cites Ye’s advances in the control of ultracold atomic systems.', url: 'https://www.nist.gov/z', source: 'NIST News', sourceId: 'nist-news', kind: 'hard-news', published: t0, real: true, primary: true };
  const lone = { id: 'd', title: 'Startup plans nuclear-powered data center on public land in Utah', blurb: 'A company wants federal land.', url: 'https://www.npr.org/u', source: 'NPR Science', sourceId: 'npr-science', kind: 'hard-news', published: t0, real: true };
  const doe = { id: 'e', title: 'Energy Department Announces $99 Million for 21 Geothermal Projects', blurb: 'DOE funds Fervo and others in Nevada.', url: 'https://www.energy.gov/a', source: 'U.S. Department of Energy', sourceId: 'doe-press', kind: 'hard-news', published: t0, real: true, primary: true };
  const doeEcho = { id: 'f', title: 'DOE awards $99 million for 21 geothermal projects in Nevada and Utah', blurb: 'The Energy Department funding includes Fervo.', url: 'https://www.utilitydive.com/b', source: 'Utility Dive', sourceId: 'utility-dive', kind: 'hard-news', published: t1, real: true };
  const doeEcho2 = { ...doeEcho, id: 'g', url: 'https://www.nytimes.com/c', source: 'NYT Climate / Energy', sourceId: 'nyt-energy', outlet: 'nyt', title: 'Energy Department awards $99 million to 21 geothermal projects' };
  const op = { id: 'h', title: 'Why geothermal is the sleeper energy story', url: 'https://www.volts.wtf/p', source: 'Volts', sourceId: 'volts', kind: 'analysis', published: t0, real: true };
  const opPath = { id: 'i', title: 'We need more transmission', url: 'https://www.nytimes.com/2026/10/06/opinion/grid.html', source: 'NYT Technology', sourceId: 'nyt-tech', outlet: 'nyt', kind: 'hard-news', published: t0, real: true };

  assert('normalizeTitle strips punctuation', V.normalizeTitle('U.S. Grid: “Big” Moves!') === 'u s grid big moves' || V.normalizeTitle('U.S. Grid: “Big” Moves!').includes('grid big moves'));
  assert('titleTokens drops stopwords + stems', V.titleTokens('The grids are getting new transformers').has('grid') && !V.titleTokens('The grids').has('the'));
  assert('keyEntities finds names', V.keyEntities('Francis Halzen wins Nobel Prize').has('francis halzen'));
  assert('48h window', V.withinWindow(t0, t1) && !V.withinWindow(t0, t5d));
  assert('outletKey groups NYT feeds', V.outletKey({ outlet: 'nyt' }) === V.outletKey({ url: 'https://www.nytimes.com/x' }.url ? { outlet: 'nyt' } : {}) && V.outletKey({ url: 'https://www.nytimes.com/a' }) === 'nytimes.com');
  assert('primary: agency feed + .gov', V.isPrimary(doe) && V.isPrimary({ url: 'https://www.eia.gov/x' }) && !V.isPrimary(ars));
  assert('primary: company press / IR', V.isPrimary({ url: 'https://investors.example.com/news/1' }) && V.isPrimary({ url: 'https://newsroom.example.com/2026/x' }));
  assert('analysis: kind / opinion path', V.isAnalysis(op) && V.isAnalysis(opPath) && !V.isAnalysis(ars));
  assert('analysis title: why/how/case for', V.looksLikeAnalysisTitle('Why geothermal is the sleeper energy story') && V.looksLikeAnalysisTitle('How Meta Uses A.I. Data Centers') && V.looksLikeAnalysisTitle('The case for abundance'));
  assert('analysis title: trend roundup', V.looksLikeAnalysisTitle('This week in science: Loud birds and asteroid samples'));
  assert('analysis title: not hard news', !V.looksLikeAnalysisTitle(lone.title) && !V.looksLikeAnalysisTitle(doe.title));
  const whyHard = { id: 'w1', title: 'Why a U.S. Diesel Export Ban May Backfire', url: 'https://www.nytimes.com/2026/10/06/climate/diesel.html', source: 'NYT Climate / Energy', sourceId: 'nyt-energy', outlet: 'nyt', kind: 'hard-news', published: t0, real: true };
  const howHard = { id: 'w2', title: 'How El Niño Is Shaping Storms on Two Sides of the U.S.', url: 'https://www.nytimes.com/2026/10/06/climate/elnino.html', source: 'NYT Climate / Energy', sourceId: 'nyt-energy', outlet: 'nyt', kind: 'hard-news', published: t0, real: true };
  assert('hard-news why/how → Analysis via heuristic', V.isAnalysis(whyHard) && V.isAnalysis(howHard));

  // Clustering
  const corpus = [ars, npr, wolf, lone, doe, doeEcho, doeEcho2];
  const clusters = V.clusterItems(corpus).map((g) => g.map((i) => corpus[i].id).sort().join(''));
  assert('clusters Nobel story across outlets', clusters.includes('ab'), clusters.join(' '));
  assert('Wolf Prize not merged with Nobel story', clusters.includes('c'), clusters.join(' '));
  assert('DOE release + echoes clustered', clusters.includes('efg'), clusters.join(' '));
  assert('same-outlet items never corroborate', V.clusterItems([lone, { ...lone, id: 'd2', url: 'https://www.npr.org/u2' }]).length === 2);
  assert('outside 48h → separate', V.clusterItems([ars, { ...npr, published: t5d }]).length === 2);

  // Tier assignment
  const out = V.classifyItems([...corpus, op, opPath, whyHard, howHard, { id: 's', title: 'Sample', real: false }]);
  const st = Object.fromEntries(out.map((i) => [i.id, i.verification.status]));
  assert('two independent outlets → multiple', st.a === 'multiple' && st.b === 'multiple');
  assert('single outlet → unconfirmed', st.d === 'unconfirmed');
  assert('primary source alone → confirmed', st.c === 'confirmed');
  assert('primary match promotes cluster → confirmed', st.e === 'confirmed' && st.f === 'confirmed' && st.g === 'confirmed');
  assert('analysis gets Analysis tag, not a tier', st.h === 'analysis' && st.i === 'analysis' && st.w1 === 'analysis' && st.w2 === 'analysis');
  assert('SAMPLE stays sample', st.s === 'sample');
  const fv = out.find((i) => i.id === 'f').verification;
  assert('sources list outlets + confirmer first', fv.sources.length === 3 && fv.sources[0].primary && fv.confirmedBy[0] === 'U.S. Department of Energy');
  assert('multiple lists both outlets', out.find((i) => i.id === 'a').verification.sources.map((s) => s.name).sort().join(',') === 'Ars Technica,NPR Science');
  const counts = V.tierCounts(out);
  assert('tierCounts', counts.confirmed === 4 && counts.multiple === 2 && counts.unconfirmed === 1 && counts.analysis === 4 && counts.sample === 1, JSON.stringify(counts));
  assert('filterByStatus', V.filterByStatus(out, 'multiple').length === 2 && V.filterByStatus(out, 'all').length === out.length);
  assert('ensureVerification passes through classified feed', V.ensureVerification(out) === out);
  assert('ensureVerification classifies raw feed (client fallback)', V.ensureVerification([ars, npr]).every((i) => i.verification.status === 'multiple'));

  // Fetcher integration (mock feeds; no network)
  const { fetchAll } = await import('./scripts/fetch-signals.mjs');
  const rss = (items) => `<?xml version="1.0"?><rss version="2.0"><channel>${items.map((i) => `<item><title>${i.t}</title><link>${i.u}</link><pubDate>${new Date().toUTCString()}</pubDate><description>${i.d}</description></item>`).join('')}</channel></rss>`;
  const feeds = {
    'https://doe.test/rss': rss([{ t: 'Energy Department Announces $4.2 Billion for Nuclear Grid Transmission in Pennsylvania', u: 'https://www.energy.gov/n1', d: 'DOE nuclear transmission funding for Pennsylvania utilities' }]),
    'https://dive.test/rss': rss([{ t: 'DOE awards $4.2 billion for nuclear transmission in Pennsylvania', u: 'https://www.utilitydive.com/n2', d: 'Energy Department grid funding, Pennsylvania' }, { t: 'Utility grid battery storage manufacturing expands in Texas', u: 'https://www.utilitydive.com/n3', d: 'US battery factory' }]),
  };
  const res = await fetchAll([
    { id: 'doe-press', name: 'U.S. Department of Energy', url: 'https://doe.test/rss', kind: 'hard-news', countryDefault: 'US', tags: ['energy'], primary: true },
    { id: 'utility-dive', name: 'Utility Dive', url: 'https://dive.test/rss', kind: 'hard-news', countryDefault: 'US', tags: ['energy', 'grid'] },
  ], { fetchImpl: async (u) => ({ ok: true, status: 200, body: feeds[u] }) });
  const byUrl = Object.fromEntries(res.items.map((i) => [i.url, i.verification?.status]));
  assert('fetcher attaches statuses', res.items.every((i) => i.verification?.status));
  assert('fetcher: echo of primary → confirmed', byUrl['https://www.utilitydive.com/n2'] === 'confirmed', JSON.stringify(byUrl));
  assert('fetcher: lone trade story → unconfirmed', byUrl['https://www.utilitydive.com/n3'] === 'unconfirmed');

  const feeds2 = {
    'https://npr.test/rss': rss([
      { t: 'This week in science: Loud birds and asteroid samples', u: 'https://www.npr.org/roundup1', d: 'Science roundup' },
      { t: 'Google launches Project Suncatcher for AI data centers in space', u: 'https://www.npr.org/event1', d: 'Google announced Project Suncatcher' },
      { t: 'Why nuclear-powered data centers keep showing up in Utah', u: 'https://www.npr.org/why1', d: 'Explainer on nuclear data centers' },
    ]),
  };
  const res2 = await fetchAll([
    { id: 'npr-science', name: 'NPR Science', url: 'https://npr.test/rss', kind: 'hard-news', countryDefault: 'US', tags: ['science'] },
  ], { fetchImpl: async (u) => ({ ok: true, status: 200, body: feeds2[u] }) });
  const by2 = Object.fromEntries(res2.items.map((i) => [i.url, { status: i.verification?.status, kind: i.kind }]));
  assert('fetcher: week-in roundup → analysis', by2['https://www.npr.org/roundup1']?.status === 'analysis' && by2['https://www.npr.org/roundup1']?.kind === 'analysis', JSON.stringify(by2));
  assert('fetcher: why title → analysis', by2['https://www.npr.org/why1']?.status === 'analysis', JSON.stringify(by2));
  assert('fetcher: discrete event stays unconfirmed', by2['https://www.npr.org/event1']?.status === 'unconfirmed' && by2['https://www.npr.org/event1']?.kind === 'hard-news', JSON.stringify(by2));

  // Live data carries statuses
  const live = JSON.parse(readFileSync(new URL('./data/signals-live.json', import.meta.url), 'utf8'));
  assert('live items all carry verification status', live.items.every((i) => ['confirmed', 'multiple', 'unconfirmed', 'analysis'].includes(i.verification?.status)));
  assert('live payload has tier counts', live.verification && Object.values(live.verification.counts).reduce((a, b) => a + b, 0) === live.items.length);
  assert('live: analysis-kind items tagged Analysis', live.items.filter((i) => i.kind === 'analysis').every((i) => i.verification.status === 'analysis'));
  const appSrc = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
  assert('app renders badges + filter + legend', /verifyBadge/.test(appSrc) && /data-vfilter/.test(appSrc) && /rail-legend/.test(appSrc));
  assert('css tier colors', /\.vb-unconfirmed/.test(css) && /\.vb-multiple/.test(css) && /\.vb-confirmed/.test(css));
  assert('SW caches labels.js + verify.js', /labels\.js/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')) && /verify\.js/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
