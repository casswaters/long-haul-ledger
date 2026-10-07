/**
 * Long Haul Ledger — data shape + nav + zoom + chains asserts
 */
import { readFileSync, existsSync } from 'fs';
import {
  META, COUNTRIES, STUBS, getCountry, fullCountryIds, allCountryIds,
  globalFeed, filterSignals, opportunityNote, metricLabel,
} from './data.js';
import { parseHash, buildHash, normalizeTab, normalizeView, TABS, VIEWS, TAB_LABELS } from './nav.js';
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
assert('creed retired from META', !('creed' in META));
assert('META tagline is sober industrial framing', META.tagline === 'A sourced record of what moved in US industry, with a world index.');
assert('domain intent noted', META.domainIntent === 'longhaulledger.com');
assert('sample flag true', META.sample === true);
assert('index.html exists', existsSync(new URL('./index.html', import.meta.url)));
assert('world.svg exists', existsSync(new URL('./world.svg', import.meta.url)));
assert('sw.js cache name long-haul-ledger-v16', /long-haul-ledger-v16/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')) && !/long-haul-ledger-v(?:[678]|9)'/.test(readFileSync(new URL('./sw.js', import.meta.url), 'utf8')));
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
assert('neutral slate palette + one accent', /--bg:\s*#0f1215/.test(css) && /--accent:\s*#d08a45/.test(css) && !/--brass/.test(css));
assert('PROTOTYPE desks labeled in header', /PROTOTYPE desks/.test(html));
assert('US Progress rail in HTML', /US Progress/.test(html) && /id="feed"/.test(html));
assert('vertical zoom controls CSS', /flex-direction:\s*column/.test(css) && /zoom-controls/.test(css));
assert('tagline in HTML', html.includes('A sourced record of what moved in US industry, with a world index.'));
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
    assert('JP/AE use real NE admin-1 (no approx clip)', !clipAdminToWorld('jp') && !clipAdminToWorld('ae') && !clipAdminToWorld('us'));
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
  assert('admin1 worldwide (100+ countries)', seeded.size >= 100, String(seeded.size));
  assert('admin1 includes us/in/ae/jp/ca', seeded.has('us') && seeded.has('in') && seeded.has('ae') && seeded.has('jp') && seeded.has('ca'), [...seeded].join(','));
  assert('US has 50+ states', adminFeaturesForCountry(admin, 'us').length >= 50, String(adminFeaturesForCountry(admin, 'us').length));
  assert('India has many states', adminFeaturesForCountry(admin, 'in').length >= 20);
  assert('UAE emirates seeded', adminFeaturesForCountry(admin, 'ae').length >= 5);
  assert('Japan regions seeded', adminFeaturesForCountry(admin, 'jp').length >= 5);
  const ca = findAdminFeature(admin, 'us-ca');
  assert('us-ca feature + path', !!ca && geometryToPath(ca.geometry).includes('M'));
  assert('us-ca bbox', !!featureBbox(ca) && featureBbox(ca)[0] < -114);
  assert('bboxToViewBox string', /^-?\d/.test(bboxToViewBox(padBbox(featureBbox(ca)))));
  assert('cities for us-ca', citiesForAdmin(cities, { country: 'us', admin1: 'us-ca' }).length >= 1);
  {
    const appDrill = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
    // Country level: empty city list; state level: citiesForAdmin with admin1
    assert('country drill hides cities (empty cityFeats without admin1)',
      /const cityFeats = state\.admin1\s*\?\s*citiesForAdmin\(citiesGeo, \{ country, admin1: state\.admin1 \}\)\s*:\s*\[\]/.test(appDrill),
      'expected cityFeats = admin1 ? … : []');
    assert('state drill still loads cities for admin1',
      /citiesForAdmin\(citiesGeo, \{ country, admin1: state\.admin1 \}\)/.test(appDrill));
    assert('cities helper still filters by country alone when asked',
      citiesForAdmin(cities, { country: 'us' }).length > citiesForAdmin(cities, { country: 'us', admin1: 'us-ca' }).length);
  }
  assert('find city LA', !!findCityFeature(cities, 'us-city-los-angeles'));
  assert('country bbox us', !!countryBboxFromAdmin(admin, 'us'));
  assert('breadcrumb depth', drillBreadcrumb({ country: 'us', countryName: 'United States', admin1: 'us-ca', admin1Name: 'California', city: 'us-city-los-angeles', cityName: 'Los Angeles' }).length === 4);
  assert('mindMapAllowed country only', mindMapAllowed(null, null) === true && mindMapAllowed('us-ca', null) === false);

  assert('leadership us federal', resolveLeadership(lead, { country: 'us' })?.roles?.length >= 4);
  assert('leadership prefers city', resolveLeadership(lead, { country: 'us', admin1: 'us-ca', city: 'us-city-los-angeles' })?.key === 'us-city-los-angeles');
  assert('leadership stack at city = city + state (country stays at country)', leadershipStack(lead, { country: 'us', admin1: 'us-ca', city: 'us-city-los-angeles' }).length === 2);
  assert('leadership stack at state = state only', leadershipStack(lead, { country: 'us', admin1: 'us-ca' }).length === 1 && leadershipStack(lead, { country: 'us', admin1: 'us-ca' })[0].key === 'us-ca');
  assert('leadership stack at country = federal', leadershipStack(lead, { country: 'us' }).length === 1 && leadershipStack(lead, { country: 'us' })[0].key === 'us');
  const usKeys = Object.keys(lead.areas).filter((k) => /^us-[a-z]{2}$/.test(k));
  assert('leadership: 50 states + DC seeded', usKeys.length === 51);
  assert('leadership: every state/DC has sourced governor/mayor with as-of', usKeys.every((k) => { const g = lead.areas[k].roles[0]; return g && /Governor|Mayor/.test(g.title) && g.name && g.source?.url && g.asOf; }));
  const allRoles = Object.values(lead.areas).flatMap((a) => a.roles || []);
  assert('leadership: verified roles carry source + as-of, no response estimate', allRoles.filter((r) => r.verified).every((r) => r.source?.url && r.asOf && !r.responseTime && !r.badge));
  assert('leadership: pending seats have no invented name', allRoles.filter((r) => r.sourcePending).every((r) => !r.name));
  const stateBlocks = usKeys.filter((k) => k !== 'us-dc').map((k) => lead.areas[k]);
  assert('congress: every state has 2 verified senators', stateBlocks.every((b) => (b.groups || []).find((g) => g.title === 'U.S. Senate')?.roles.filter((r) => r.verified && r.name).length === 2));
  assert('congress: 435 House seats across states', stateBlocks.reduce((n, b) => n + ((b.groups || []).find((g) => g.compact)?.rows.length || 0), 0) === 435);
  assert('congress: House delegations collapsed by default', stateBlocks.every((b) => (b.groups || []).find((g) => g.compact)?.collapsed === true));
  assert('congress: no SAMPLE senator/delegation rows left', stateBlocks.every((b) => !b.roles.some((r) => /congressional delegation|U\.S\. Senators/.test(r.title))));
  assert('congress: national leadership groups', (lead.areas.us.groups || []).length === 2);
  assert('leadership: trading partners seeded', ['ca','mx','cn','jp','de','kr','gb','in','tw','vn'].every((k) => lead.areas[k]?.roles?.filter((r) => r.verified).length >= 2));
  assert('Speaker named (not house.gov placeholder)', /Mike Johnson/.test(lead.areas.us.groups.flatMap((g) => g.roles).find((r) => /Speaker/.test(r.title))?.name || ''));
  assert('Majority Leader named (not senate.gov placeholder)', /John Thune/.test(lead.areas.us.groups.flatMap((g) => g.roles).find((r) => /Senate Majority Leader/.test(r.title))?.name || ''));
  assert('no cryptic see house.gov name', !/see house\.gov/i.test(JSON.stringify(lead.areas.us)));
  assert('handful of US states have real governor roles', ['us-ca','us-tx','us-ny','us-fl','us-il','us-wa'].every((k) => (lead.areas[k]?.roles || []).some((r) => r.title === 'Governor' && r.name && !/see /i.test(r.name))));
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

console.log('\n--- Retone: sober framing + PROTOTYPE labels ---');
{
  const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const appSrc = read('./app.js');
  const dataSrc = read('./data.js');
  const chainsSrc = read('./chains.js');
  const readme = read('./README.md');
  const manifest = read('./manifest.webmanifest');
  const pub = { html, manifest, readme, brief, app: appSrc, data: dataSrc };
  for (const [name, txt] of Object.entries(pub)) {
    assert(`${name}: no '10,000 Year Empire'`, !/10,000 Year Empire/i.test(txt));
    assert(`${name}: no 'Civilization news' / 'opportunity desk'`, !/civilization news|opportunity desk/i.test(txt));
  }
  for (const [name, txt] of Object.entries({ html, app: appSrc, data: dataSrc, css })) {
    assert(`${name}: no 'America first' branding`, !/america first/i.test(txt));
    assert(`${name}: no flag emoji / stars-and-stripes styling`, !/🇺🇸|stars-and-stripes|old-glory/i.test(txt));
  }
  assert('no visible skilltree / civilization wording in app or data', !/skilltree|civilization/i.test(appSrc + dataSrc));
  assert('Openings tab relabeled (not tip-like)', TAB_LABELS.openings && !/opening/i.test(TAB_LABELS.openings) && TABS.every((t) => TAB_LABELS[t]));
  assert('openings hash id kept for old links', normalizeTab('openings') === 'openings');
  assert('data.js flagged prototype', /export const prototype = true/.test(dataSrc) && META.prototype === true);
  assert('chains.js flagged prototype', /export const prototype = true/.test(chainsSrc));
  assert('PROTOTYPE badge helper + explainer', /function protoBadge/.test(appSrc) && /function protoNote/.test(appSrc) && /proto-badge/.test(css) && /proto-note/.test(css));
  const fnBody = (name) => {
    const i = appSrc.indexOf(`function ${name}(`);
    const j = appSrc.indexOf('\nfunction ', i + 10);
    return appSrc.slice(i, j < 0 ? undefined : j);
  };
  for (const fn of ['renderMindMap', 'renderChain', 'renderCompanyDesk']) {
    const body = fnBody(fn);
    assert(`${fn} renders PROTOTYPE badge + explainer`, /protoBadge\(/.test(body) && /protoNote\(\)/.test(body));
  }
  {
    const p = fnBody('renderPanel');
    assert('country panel: no panel-wide prototype banner', !/protoNote\(\)/.test(p));
    assert('country panel: example tag on snapshot, scores and desk tabs', (p.match(/exampleTag\(\)/g) || []).length >= 4);
    assert('country panel: World Bank macro sits outside example blocks', p.indexOf('renderWorldMacro(c.id)') < p.indexOf('class="snapshot"'));
  }
  assert('country metrics marked example', /metric is-proto/.test(fnBody('renderPanel')) && /· example/.test(fnBody('renderPanel')));
  assert('prototype tabs badged (signals/industries/regions/constraints)', (fnBody('renderTab').match(/protoBadge\('proto-badge-sm'\)/g) || []).length >= 4);
  assert('home names the fictional desks as prototype', /country-desk tabs are example data for UX testing and are tagged/.test(appSrc));
  assert('leadership keeps SAMPLE/ESTIMATE, response times flagged estimate', /SAMPLE \/ ESTIMATE/.test(appSrc) && /source pending/.test(appSrc));
  const lead = JSON.parse(read('./data/leadership.json'));
  assert('leadership ESTIMATE badges still present in data', JSON.stringify(lead).includes('"ESTIMATE"'));
  assert('footer: Not investment advice', /Not investment advice/.test(html));
  assert('footer: no real-time coverage', /No real-time coverage/.test(html));
  assert('Monday Haul coming soon, no email capture', /Monday Haul, coming soon/.test(html) && !/<form|type="email"|mailto:/i.test(html));
  assert('Method nav targets about strip', /id="nav-method"/.test(html) && /href="#about"/.test(html) && /id="about"/.test(html));
  assert('Method ↑ Top control present', /id="about-top"/.test(html) && /↑ Top/.test(html) && /\.about-top/.test(css) && /about-toolbar/.test(css));
  assert('wireMethodTop scrolls home + clears #about', /function wireMethodTop/.test(appSrc) && /wireMethodTop\(\)/.test(appSrc) && /scrollTo\(\{ top: 0/.test(appSrc));
  assert('no paywall / pricing / login in UI', !/\$49|\$490|subscribe|log ?in|paywall/i.test(html + fnBody('renderDesks') + fnBody('renderHomeDesks')));
  assert('atlas neutral: seeded/stub fills equal plain land', /--map-seed:\s*var\(--map-land\)/.test(css) && /path\.stub-known \{ fill: var\(--map-land\); \}/.test(css));
  assert('atlas legend keeps State equivalent drill + i toggle', /World → Country → State equivalent → City/.test(html) && /map-label-toggle-icon[^>]*>i</.test(html));
  assert('tabular numerals', /font-variant-numeric:\s*tabular-nums/.test(css));
  assert('BUILD-PLAN.md kept in repo', existsSync(new URL('./BUILD-PLAN.md', import.meta.url)));
  {
    const wf = readFileSync(new URL('./.github/workflows/soft-launch.yml', import.meta.url), 'utf8');
    const ex = (wf.match(/exclude_assets:\s*'([^']*)'/) || [])[1] || '';
    assert('deploy excludes BUILD-PLAN.md from Pages', ex.split(',').map((x) => x.trim()).includes('BUILD-PLAN.md'), ex);
    const swSrc = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
    assert('SW does not cache/serve .md docs', /endsWith\('\.md'\)\) return;/.test(swSrc) && !/BUILD-PLAN/.test(swSrc));
    const pub = [html, appSrc, readme, brief, manifest, css];
    assert('nothing published links to BUILD-PLAN.md', !pub.some((t) => /\]\(\.?\/?BUILD-PLAN\.md|href="[^"]*BUILD-PLAN/i.test(t)));
  }
  assert('BRIEF points to subscription brief + prototype layer', /subscription brief/i.test(brief) && /PROTOTYPE/.test(brief));
}


console.log('\n--- Rail dollar watermark + worldwide drill ---');
{
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
  const app = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
  assert('rail dollar markup present', /rail-dollar/.test(html) && /rail-dollar-glyph/.test(html));
  assert('rail dollar aria-hidden', /rail-dollar"[^>]*aria-hidden="true"/.test(html) || /aria-hidden="true"[^>]*rail-dollar/.test(html) || /class="rail-dollar" aria-hidden="true"/.test(html));
  assert('rail dollar pointer-events none', /rail-dollar[^]*pointer-events:\s*none/.test(css) || /\.rail-dollar[\s\S]*?pointer-events:\s*none/.test(css));
  assert('rail dollar spin + pulse keyframes', /rail-dollar-spin/.test(css) && /rail-dollar-pulse/.test(css));
  assert('rail dollar respects reduced motion', /prefers-reduced-motion:\s*reduce/.test(css) && /rail-dollar/.test(css));
  assert('emerald restrained (rgba green, low alpha)', /rgba\(46,\s*140,\s*105/.test(css) || /rgba\(52,\s*158,\s*118/.test(css));
  const admin = JSON.parse(readFileSync(new URL('./data/geo/admin1.geojson', import.meta.url), 'utf8'));
  const cities = JSON.parse(readFileSync(new URL('./data/geo/cities.geojson', import.meta.url), 'utf8'));
  const { countriesWithAdmin1, citiesForAdmin } = await import('./geo.js');
  const seeded = countriesWithAdmin1(admin);
  assert('Canada has provinces', seeded.has('ca') && admin.features.filter(f=>f.properties.country==='ca').length >= 10);
  assert('cities hidden without admin1 filter still works', citiesForAdmin(cities, { country: 'ca', admin1: 'ca-on' }).length >= 1);
  assert('country-level city list empty in app drill pattern', /const cityFeats = state\.admin1\s*\?[\s\S]*?:\s*\[\]/.test(app));
}

console.log('\n--- US desks ---');
{
  const D = await import('./desks.js');
  const nav = await import('./nav.js');
  const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  assert('four US desks in order', D.DESKS.map((d) => d.id).join(',') === 'activity,people,prices,capital');
  assert('every desk has scope, trigger, https sources, columns', D.DESKS.every((d) => d.scope && d.trigger && d.columns?.length >= 6 && d.sources.length && d.sources.every((x) => /^https:\/\//.test(x.url))));
  assert('honest empty state text', D.EMPTY_STATE === 'No sourced entries yet. Updates when a sourced change lands.');
  assert('nav: #d=prices opens desks', nav.parseHash('#d=prices').desk === 'prices' && nav.buildHash({ desk: 'people' }) === 'd=people');
  assert('nav: desk keeps country focus', nav.buildHash({ country: 'us', desk: 'capital' }) === 'c=us&d=capital');
  assert('nav: no desk by default', nav.parseHash('').desk === null && nav.parseHash('#c=us').desk === null);
  assert('nav: unknown desk → prices', nav.normalizeDesk('zz') === 'prices');

  // FRED CSV parsing
  const csv = 'observation_date,DHHNGSP\n2026-09-25,3.21\n2026-09-26,.\n2026-09-28,3.13\nbad,1\n2026-09-29,3.18\n';
  const rows = D.parseFredCsv(csv);
  assert('parseFredCsv skips missing + bad rows', rows.length === 3 && rows.at(-1).value === 3.18 && rows.at(-1).date === '2026-09-29');
  assert('parseFredCsv empty', D.parseFredCsv('').length === 0);

  // Append-only history
  const s = D.PRICE_SERIES[1];
  const t0 = '2026-10-06T23:00:00Z';
  const first = D.applyObservation(null, s, { date: '2026-09-29', value: 3.18 }, { date: '2026-09-28', value: 3.13 }, t0);
  assert('first entry: revision note + empty history', first.changed && first.record.current.revisionNote === 'First entry' && first.record.history.length === 0);
  assert('first entry validates', D.validateRecord(first.record).length === 0, D.validateRecord(first.record).join('; '));
  const same = D.applyObservation(first.record, s, { date: '2026-09-29', value: 3.18 }, null, '2026-10-07T05:00:00Z');
  assert('unchanged observation → no write', same.changed === false && same.record === first.record);
  const next = D.applyObservation(first.record, s, { date: '2026-09-30', value: 3.05 }, { date: '2026-09-29', value: 3.18 }, '2026-10-07T05:00:00Z');
  assert('new observation supersedes, old line kept', next.changed && next.record.history.length === 1 && next.record.history[0].value === 3.18 && next.record.history[0].supersededAt === '2026-10-07');
  assert('new observation revision note', next.record.current.revisionNote === 'New observation from source');
  const rev = D.applyObservation(next.record, s, { date: '2026-09-30', value: 3.07 }, null, '2026-10-08T05:00:00Z');
  assert('same-date revision recorded as source revision', rev.record.current.revisionNote.startsWith('Source revised') && rev.record.history.length === 2);
  const older = D.applyObservation(next.record, s, { date: '2026-09-01', value: 9 }, null, '2026-10-08T05:00:00Z');
  assert('older observation never overwrites', older.changed === false);
  assert('validator rejects estimate status', D.validateRecord({ ...first.record, status: 'estimate' }).length > 0);
  assert('validator rejects non-https source', D.validateRecord({ ...first.record, current: { ...first.record.current, sourceUrl: 'http://x' } }).length > 0);
  assert('validator rejects missing revision note', D.validateRecord({ ...first.record, current: { ...first.record.current, revisionNote: '' } }).length > 0);
  assert('renderable filters non-verified', D.renderableRecords({ records: [first.record, { ...first.record, status: 'sample' }] }).length === 1);
  assert('formatValue decimals per series', D.formatValue(6.199, 'prices.diesel-us-retail') === '6.199' && D.formatValue(3.1, 'prices.henry-hub') === '3.10');
  assert('formatDelta signed', D.formatDelta(6.199, 6.382, 'prices.diesel-us-retail') === '−0.183' && D.formatDelta(3.18, 3.13, 'prices.henry-hub') === '+0.05');
  assert('stale flag after cadence', D.isStale(first.record, new Date('2026-10-20T00:00:00Z')) && !D.isStale(first.record, new Date('2026-10-02T00:00:00Z')));
  assert('desk status: empty desks honest', D.deskStatus('people', null).count === 0);

  // Fetcher (mocked, no network)
  const { updatePrices, emptyDesk } = await import('./scripts/fetch-prices.mjs');
  const mockCsv = { GASDESW: 'observation_date,GASDESW\n2026-09-28,6.382\n2026-10-05,6.199\n', DHHNGSP: 'observation_date,DHHNGSP\n2026-09-28,3.13\n2026-09-29,3.18\n' };
  const ok = await updatePrices(emptyDesk(), { now: new Date(t0), fetchImpl: async (u) => ({ ok: true, status: 200, body: mockCsv[new URL(u).searchParams.get('id')] }) });
  assert('fetcher builds two verified lines', ok.changed && ok.desk.records.length === 2 && ok.desk.records.every((r) => D.validateRecord(r).length === 0));
  const again = await updatePrices(ok.desk, { now: new Date('2026-10-07T05:00:00Z'), fetchImpl: async (u) => ({ ok: true, status: 200, body: mockCsv[new URL(u).searchParams.get('id')] }) });
  assert('fetcher: no churn when unchanged', again.changed === false);
  const down = await updatePrices(ok.desk, { now: new Date(t0), fetchImpl: async () => ({ ok: false, status: 503, body: '' }) });
  assert('fetcher: outage keeps last good lines', down.changed === false && down.failures.length === 2 && down.desk.records.length === 2);
  const junk = await updatePrices(emptyDesk(), { now: new Date(t0), fetchImpl: async () => ({ ok: true, status: 200, body: 'observation_date,X\n2026-10-05,-4\n' }) });
  assert('fetcher: rejects implausible value', junk.changed === false && junk.failures.length === 2);

  // Committed public sample
  const prices = JSON.parse(read('./data/desks/prices.json'));
  const recs = D.renderableRecords(prices);
  assert('prices.json: only GASDESW + DHHNGSP', prices.records.map((r) => r.seriesId).sort().join(',') === 'DHHNGSP,GASDESW');
  assert('prices.json: every line verified + valid', recs.length === prices.records.length && recs.length === 2);
  assert('prices.json: source URL, as-of, revision note, history array', recs.every((r) => /^https:\/\/fred\.stlouisfed\.org\/series\//.test(r.current.sourceUrl) && /^\d{4}-\d{2}-\d{2}$/.test(r.current.asOf) && r.current.revisionNote && Array.isArray(r.history)));
  assert('prices.json: real values (numeric, positive)', recs.every((r) => Number.isFinite(r.current.value) && r.current.value > 0));
  assert('prices.json: no invented ranges', recs.every((r) => r.range === null || (r.range.reason && r.range.setOn)));
  assert('prices.json: no SAMPLE / ESTIMATE / PROTOTYPE strings', !/SAMPLE|ESTIMATE|PROTOTYPE/.test(read('./data/desks/prices.json')));
  const app = read('./app.js');
  assert('app renders desks overlay + empty state', /function renderDesks/.test(app) && /EMPTY_STATE/.test(app) && /data-open-desk/.test(app));
  assert('app shows history (struck-through) + revision note', /<s>/.test(app) && /revisionNote/.test(app));
  assert('header entry point to US desks', /id="nav-desks"/.test(html) && /US desks/.test(html));
  const sw = read('./sw.js');
  assert('SW caches desks.js + prices.json', /desks\.js/.test(sw) && /data\/desks\/prices\.json/.test(sw));
  const wf = read('./.github/workflows/soft-launch.yml');
  assert('Action fetches prices and commits prices.json', /fetch-prices\.mjs/.test(wf) && /data\/desks\/prices\.json/.test(wf));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
