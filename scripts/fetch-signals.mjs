#!/usr/bin/env node
/**
 * Long Haul Ledger — news feed builder (public RSS/Atom + GDELT DOC 2.0; no keys, no paid APIs).
 * Pulls public feeds from data/sources.json → data/signals-live.json, tags every item
 * with a location (locate.js gazetteer) and a topic category, and tops up thin
 * countries from the free GDELT DOC API (cached per country in data/news-cache/gdelt.json).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { classifyItems, tierCounts, VERIFY_WINDOW_HOURS, looksLikeAnalysisTitle } from '../verify.js';
import { applyCurated, validateCurated } from '../curated.js';
import { existsSync } from 'fs';
import { buildGazetteer, tagLocation, categorize } from '../locate.js';
import { COUNTRY_NAMES } from '../places.js';
import { withSectorTags, filterSector } from '../sectors.js';
import { SECTOR_TABS } from '../tabs.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const SOURCES_PATH = join(ROOT, 'data', 'sources.json');
const OUT_PATH = join(ROOT, 'data', 'signals-live.json');

const UA =
  'LongHaulLedgerBot/0.1 (+https://casswaters.github.io/long-haul-ledger/; soft-launch public RSS; no scraping beyond feed XML)';
const FETCH_TIMEOUT_MS = 14000;
const PER_FEED_CAP = 18;
const GLOBAL_CAP = 700;
const MIN_SCORE = 28;
/** Per-location caps keep the file small while every country keeps its best stories. */
export const PER_COUNTRY_CAP = 40;
export const WORLD_ONLY_CAP = 60;
const FEED_CONCURRENCY = 6;
const CITIES_PATH = join(ROOT, 'data', 'geo', 'cities.geojson');

let gazetteer = null;
/** Gazetteer with major cities from data/geo/cities.geojson (built once per run). */
export function getGazetteer() {
  if (gazetteer) return gazetteer;
  let cities = [];
  try { cities = JSON.parse(readFileSync(CITIES_PATH, 'utf8')).features || []; } catch { cities = []; }
  gazetteer = buildGazetteer({ cities });
  return gazetteer;
}

/** Economic-activity keyword weights (light scorer, same for every country). */
export const SCORE_TERMS = [
  [/\b(oil|gas|lng|opec|refiner\w*|pipeline|coal|uranium|electricity|power prices?)\b/i, 10],
  [/\b(sanctions?|tariffs?|trade (deal|war|talks)|export controls?|central bank|interest rates?|inflation)\b/i, 9],
  [/\b(mining|mine|copper|lithium|nickel|steel|aluminium|aluminum|exports?|investment|capex)\b/i, 8],
  [/\b(grid|transmission|interconnection|nuclear|fusion|solar|wind|battery|geothermal|permitting)\b/i, 12],
  [/\b(semiconductor|chip|fab|gpu|ai infra|data center|hyperscale|compute)\b/i, 12],
  [/\b(manufactur|factory|industrial|reshor|nearshor|supply chain|shipyard)\b/i, 10],
  [/\b(infrastructure|port|rail|highway|broadband|housing|construction)\b/i, 10],
  [/\b(progress|abundance|state capacity|industrial policy|productivity)\b/i, 11],
  [/\b(agency|ministry|regulator|government|parliament|federal)\b/i, 6],
  [/\b(energy|climate|power|utility|electric)\b/i, 7],
  [/\b(research|science|engineering|innovation)\b/i, 5],
];

const NEG_TERMS = [
  /\b(celebrity|gossip|sports score|box office|reality tv)\b/i,
  /\b(horoscope|crossword|recipe|fashion week|premier league|cricket score|football transfer)\b/i,
];

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '\u2013', mdash: '\u2014',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D', hellip: '\u2026', middot: '\u00B7',
  copy: '\u00A9', reg: '\u00AE', trade: '\u2122', eacute: '\u00E9', deg: '\u00B0',
};

/**
 * Decode HTML/XML entities to plain text. Feeds often double-encode
 * (&amp;#039;), so decode up to 3 passes until stable. Output is plain text;
 * the site escapes it once at render, which keeps it XSS-safe.
 */
export function decodeEntities(s) {
  let out = String(s ?? '');
  for (let i = 0; i < 3; i++) {
    const next = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
      }
      const v = NAMED_ENTITIES[e.toLowerCase()];
      return v === undefined ? m : v;
    });
    if (next === out) break;
    out = next;
  }
  return out;
}

export function stripHtml(s) {
  const noCdata = String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  // Decode first so entity-encoded markup (&lt;b&gt;) is stripped too, then strip tags.
  return decodeEntities(noCdata.replace(/<[^>]+>/g, ' '))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeXmlEntities(s) {
  return stripHtml(s);
}

function tagContents(block, tag) {
  const re = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${tag}>`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : '';
}

function attr(block, name) {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i');
  const m = block.match(re);
  return m ? m[1] : '';
}

/** Parse RSS 2.0 or Atom XML into raw items. */
export function parseFeedXml(xml) {
  const text = String(xml || '');
  const items = [];

  // RSS <item>
  const itemBlocks = text.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks) {
    const title = decodeXmlEntities(tagContents(block, 'title'));
    let link = decodeXmlEntities(tagContents(block, 'link'));
    if (!link) {
      const enc = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      link = enc ? enc[1] : '';
    }
    if (!link) {
      const guid = decodeXmlEntities(tagContents(block, 'guid'));
      if (/^https?:/i.test(guid)) link = guid;
    }
    const pub =
      tagContents(block, 'pubDate') ||
      tagContents(block, 'published') ||
      tagContents(block, 'date') ||
      tagContents(block, 'dc:date');
    const summary =
      tagContents(block, 'description') ||
      tagContents(block, 'summary') ||
      tagContents(block, 'content:encoded') ||
      '';
    if (title && link) items.push({ title, link, published: pub, summary });
  }

  // Atom <entry>
  const entryBlocks = text.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of entryBlocks) {
    const title = decodeXmlEntities(tagContents(block, 'title'));
    let link = '';
    const linkTags = block.match(/<link\b[^>]*>/gi) || [];
    for (const lt of linkTags) {
      const rel = attr(lt, 'rel') || 'alternate';
      const href = attr(lt, 'href');
      if (href && (rel === 'alternate' || rel === '')) {
        link = href;
        break;
      }
      if (!link && href) link = href;
    }
    if (!link) link = decodeXmlEntities(tagContents(block, 'id'));
    const pub =
      tagContents(block, 'published') ||
      tagContents(block, 'updated') ||
      tagContents(block, 'dc:date');
    const summary =
      tagContents(block, 'summary') ||
      tagContents(block, 'content') ||
      '';
    if (title && link && /^https?:/i.test(link)) {
      items.push({ title, link, published: pub, summary });
    }
  }

  return items;
}

export function toIsoDate(raw) {
  if (!raw) return null;
  const d = new Date(stripHtml(raw));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function dateStamp(iso) {
  if (!iso) return 'n/a';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'n/a';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function scoreItem({ title, summary, tags = [], country = 'US', kind = 'hard-news' }) {
  const blob = `${title} ${summary} ${(tags || []).join(' ')}`;
  let score = 40;
  if (kind === 'hard-news') score += 3;
  if (kind === 'analysis') score += 2;
  for (const [re, w] of SCORE_TERMS) {
    if (re.test(blob)) score += w;
  }
  for (const re of NEG_TERMS) {
    if (re.test(blob)) score -= 25;
  }
  void country;
  // Recency bump handled separately when published known
  return Math.max(0, Math.min(100, score));
}

/** Location + category for an item; curated/explicit `loc` always wins. */
export function locateItem(it, { home = null, assumeHome = false, alwaysHome = false } = {}, gaz = getGazetteer()) {
  const loc = it.loc && Array.isArray(it.loc.countries) ? it.loc : tagLocation({ title: it.title, summary: it.blurb, home, assumeHome, alwaysHome }, gaz);
  const primaryCountry = loc.countries[0] || '';
  return {
    ...it,
    loc,
    country: primaryCountry ? primaryCountry.toUpperCase() : '',
    countryId: primaryCountry,
    category: it.category || categorize({ title: it.title, summary: it.blurb }),
  };
}

export function normalizeItem(raw, source) {
  const title = stripHtml(raw.title).slice(0, 240);
  const url = stripHtml(raw.link).trim();
  const published = toIsoDate(raw.published);
  const blurb = stripHtml(raw.summary).slice(0, 280);
  const home = String(source.home || source.countryDefault || '').toLowerCase() || null;
  const assumeHome = source.assumeHome ?? !!source.countryDefault;
  const tags = [...(source.tags || [])];
  // Promote opinion / explainer / trend-roundup titles to Analysis even when
  // the parent feed is hard-news (e.g. NPR Science explainers, NYT How/Why).
  let kind = source.kind || 'hard-news';
  if (kind !== 'analysis' && looksLikeAnalysisTitle(title)) {
    kind = 'analysis';
    if (!tags.includes('analysis')) tags.push('analysis');
  }
  let score = scoreItem({ title, summary: blurb, tags, kind });
  if (published) {
    const ageDays = (Date.now() - new Date(published).getTime()) / 86400000;
    if (ageDays <= 2) score += 10;
    else if (ageDays <= 7) score += 6;
    else if (ageDays <= 30) score += 2;
    else if (ageDays > 120) score -= 8;
  }
  score = Math.max(0, Math.min(100, score));
  const id = `live-${hashId(url || title)}`;
  return locateItem({
    id,
    title,
    url,
    source: source.name,
    sourceId: source.id,
    kind,
    published,
    publishedLabel: dateStamp(published),
    tags,
    score,
    blurb,
    real: true,
    primary: !!source.primary,
    outlet: source.outlet || source.id,
    quality: Number(source.quality) || 2,
    home,
  }, { home, assumeHome, alwaysHome: !!source.primary && assumeHome });
}

function hashId(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': UA,
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      redirect: 'follow',
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(t);
  }
}

export function mergeAndCap(items, cap = GLOBAL_CAP) {
  const seen = new Set();
  const out = [];
  const sorted = [...items].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const da = a.published || '';
    const db = b.published || '';
    return db < da ? -1 : db > da ? 1 : 0;
  });
  for (const it of sorted) {
    if (!it.url || !it.title) continue;
    if (it.score < MIN_SCORE) continue;
    const key = it.url.replace(/#.*$/, '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Keep the best stories per location: up to PER_COUNTRY_CAP per primary country
 * (an item also counts toward every other country it is tagged with only if it
 * is kept), up to WORLD_ONLY_CAP untagged (world-level) items, GLOBAL_CAP overall.
 * Curated items are always kept.
 */
export function capByLocation(items, { perCountry = PER_COUNTRY_CAP, worldOnly = WORLD_ONLY_CAP, cap = GLOBAL_CAP } = {}) {
  const sorted = [...items].sort((a, b) => (b.score - a.score) || String(b.published || '').localeCompare(String(a.published || '')));
  const per = new Map();
  const seen = new Set();
  const out = [];
  for (const it of sorted) {
    if (!it.url || !it.title) continue;
    if (!it.curated && it.score < MIN_SCORE) continue;
    const key = it.url.replace(/#.*$/, '').toLowerCase();
    if (seen.has(key)) continue;
    const bucket = it.loc?.countries?.[0] || '_world';
    const limit = bucket === '_world' ? worldOnly : perCountry;
    const n = per.get(bucket) || 0;
    if (!it.curated && (n >= limit || out.length >= cap)) continue;
    per.set(bucket, n + 1);
    seen.add(key);
    out.push(it);
  }
  return out;
}

async function pool(list, n, fn) {
  const results = new Array(list.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, list.length) }, async () => {
    while (i < list.length) { const k = i++; results[k] = await fn(list[k], k); }
  });
  await Promise.all(workers);
  return results;
}

/** Feed items newest first (undated items keep their order, after dated ones). */
export function sortNewestFirst(raw) {
  const t = (r) => { const d = Date.parse(stripHtml(r.published || '')); return Number.isFinite(d) ? d : -Infinity; };
  return raw.map((r, i) => [r, t(r), i]).sort((a, b) => (b[1] - a[1]) || (a[2] - b[2])).map(([r]) => r);
}

/** Sector tags (energy sources + lifecycle stages) for every item. */
export function tagSectors(items, sectors = SECTOR_TABS) {
  return items.map((it) => withSectorTags(it, sectors));
}

/** Extra sector depth: stories per sector source and primary country kept beyond the location caps. */
export const SECTOR_PER_KEY = 10;
/** The five sector tabs get a lighter top-up than the featured Energy tab, to keep the payload small on phones. */
export const SECTOR_PER_KEY_ECON = 5;
export const SECTOR_EXTRA_CAP = 380;

/**
 * Sector top-up: after the per-location caps, add the best sector-tagged
 * stories that were cut, up to SECTOR_PER_KEY per (source, country) and
 * SECTOR_EXTRA_CAP overall, so each energy source keeps depth per place.
 */
export function topUpSectors(kept, pool, { sectors = SECTOR_TABS, perKey = SECTOR_PER_KEY, perKeyEcon = SECTOR_PER_KEY_ECON, cap = SECTOR_EXTRA_CAP } = {}) {
  const limit = (sector) => (sector.id === 'energy' ? perKey : Math.min(perKey, perKeyEcon));
  const have = new Set(kept.map((i) => i.url.replace(/#.*$/, '').toLowerCase()));
  const per = new Map();
  for (const sector of sectors) {
    for (const it of filterSector(kept, sector, { maxAgeDays: 3650 })) {
      for (const sub of it.sectors?.[sector.id]?.subs || []) {
        const k = `${sector.id}|${sub}|${it.loc?.countries?.[0] || '_'}`;
        per.set(k, (per.get(k) || 0) + 1);
      }
    }
  }
  const extra = [];
  const sorted = [...pool].sort((a, b) => (b.score - a.score) || String(b.published || '').localeCompare(String(a.published || '')));
  for (const it of sorted) {
    if (extra.length >= cap) break;
    if (!it.url || !it.title || it.score < MIN_SCORE) continue;
    const key = it.url.replace(/#.*$/, '').toLowerCase();
    if (have.has(key)) continue;
    let room = false;
    const keys = [];
    for (const sector of sectors) {
      for (const sub of it.sectors?.[sector.id]?.subs || []) {
        const k = `${sector.id}|${sub}|${it.loc?.countries?.[0] || '_'}`;
        keys.push(k);
        if ((per.get(k) || 0) < limit(sector)) room = true;
      }
    }
    if (!room) continue;
    keys.forEach((k) => per.set(k, (per.get(k) || 0) + 1));
    have.add(key);
    extra.push(it);
  }
  return [...kept, ...extra];
}

async function fetchOneFeed(source, fetchImpl) {
  try {
    const res = await fetchImpl(source.url);
    if (!res.ok) return { fail: { id: source.id, status: res.status, reason: `HTTP ${res.status}` } };
    const look = res.body.slice(0, 200).toLowerCase();
    if (!look.includes('<rss') && !look.includes('<feed') && !look.includes('<rdf')) {
      // Some feeds still work with odd wrappers; try parse anyway if <item> present
      if (!/<item[\s>]/i.test(res.body) && !/<entry[\s>]/i.test(res.body)) {
        return { fail: { id: source.id, status: res.status, reason: 'not RSS/Atom' } };
      }
    }
    // Newest first before the per-feed cap: some feeds (NRC, World Nuclear News) are not date-ordered.
    const raw = sortNewestFirst(parseFeedXml(res.body)).slice(0, PER_FEED_CAP);
    if (!raw.length) return { fail: { id: source.id, status: res.status, reason: 'zero items' } };
    const normalized = raw.map((r) => normalizeItem(r, source)).filter((it) => !source.requireTopic || it.category !== 'general');
    return { ok: { id: source.id, count: normalized.length }, items: normalized };
  } catch (err) {
    return { fail: { id: source.id, status: 0, reason: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) } };
  }
}

export async function fetchAll(sources, { fetchImpl = fetchText, extra = async () => [], concurrency = FEED_CONCURRENCY } = {}) {
  const ok = [];
  const failed = [];
  const items = [];
  const results = await pool(sources, concurrency, (s) => fetchOneFeed(s, fetchImpl));
  results.forEach((r) => {
    if (r.ok) { ok.push(r.ok); items.push(...r.items); } else failed.push(r.fail);
  });
  // Top-up stage (GDELT) sees what RSS already covers.
  const more = await extra(items);
  items.push(...(more || []));

  // Classify across everything fetched (pre-cap) so a primary-source item that
  // misses the cap can still confirm a cluster that made it in.
  const classified = tagSectors(classifyItems(items));
  const merged = topUpSectors(capByLocation(classified), classified);
  return { ok, failed, items: merged, pool: classified };
}

/* ---------- GDELT DOC 2.0 top-up (free, no key; 1 request / 5 s) ---------- */
export const GDELT_CACHE_PATH = join(ROOT, 'data', 'news-cache', 'gdelt.json');
export const GDELT_BUDGET = 24;          // country queries per run (~2.5 min at 6 s spacing)
export const GDELT_REFRESH_HOURS = 12;   // re-query a country at most twice a day
export const GDELT_KEEP_DAYS = 7;        // cached articles older than this are dropped
const GDELT_GAP_MS = 6000;
/** Larger economies first, then every other map country. */
export const GDELT_PRIORITY = ['cn', 'in', 'jp', 'de', 'gb', 'fr', 'br', 'ca', 'it', 'kr', 'au', 'mx', 'es', 'id', 'tr', 'sa', 'nl', 'ch', 'pl', 'se', 'be', 'ar', 'no', 'ie', 'ae', 'il', 'at', 'ng', 'za', 'eg', 'th', 'sg', 'my', 'ph', 'vn', 'bd', 'pk', 'cl', 'co', 'pe', 'ke', 'et', 'gh', 'ma', 'dz', 'qa', 'kw', 'kz', 'ua', 'ro', 'cz', 'pt', 'gr', 'dk', 'fi', 'nz', 'hu', 'iq', 'ir'];
const GDELT_TOPICS = '(energy OR electricity OR oil OR gas OR mining OR infrastructure OR railway OR port OR factory OR manufacturing OR industry OR exports OR tariffs OR sanctions OR investment)';

export function gdeltCountryName(cc) {
  const special = { gb: 'unitedkingdom', us: 'unitedstates', cd: 'congo', cg: 'congo', ci: 'ivorycoast', kr: 'southkorea', kp: 'northkorea', ae: 'unitedarabemirates', cz: 'czechrepublic', tr: 'turkey', mm: 'burma', ps: 'westbank' };
  return special[cc] || String(COUNTRY_NAMES[cc] || cc).toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
}

export function gdeltUrl(cc) {
  const q = `sourcecountry:${gdeltCountryName(cc)} sourcelang:english ${GDELT_TOPICS}`;
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&format=json&maxrecords=25&timespan=7d&sort=hybridrel`;
}

/** GDELT seendate 20261007T121500Z → ISO. */
export function gdeltDate(s) {
  const m = String(s || '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z` : null;
}

/** GDELT article → feed item (outlet = domain; filed to the outlet's country when the text names no place). */
export function gdeltToItem(a, cc) {
  if (!a?.url || !/^https?:/i.test(a.url) || !a.title) return null;
  const domain = String(a.domain || new URL(a.url).hostname).replace(/^www\./, '');
  return normalizeItem(
    { title: a.title, link: a.url, published: gdeltDate(a.seendate), summary: '' },
    { id: `gdelt-${domain}`, name: domain, kind: 'hard-news', home: cc, assumeHome: true, quality: 1, tags: ['gdelt'], outlet: domain },
  );
}

export function loadGdeltCache(path = GDELT_CACHE_PATH) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return { version: 1, countries: {} }; }
}

/**
 * Query GDELT for countries that RSS left with fewer than 4 stories; reuse cached
 * results between runs. Returns items to add. Never throws (logs and keeps cache).
 */
export async function gdeltTopUp(items, {
  fetchImpl = fetchText, now = new Date(), cache = loadGdeltCache(), budget = GDELT_BUDGET,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = console.log,
} = {}) {
  const counts = new Map();
  for (const it of items) for (const c of it.loc?.countries || []) counts.set(c, (counts.get(c) || 0) + 1);
  const thin = Object.keys(COUNTRY_NAMES).filter((c) => (counts.get(c) || 0) < 4);
  const order = [...GDELT_PRIORITY.filter((c) => thin.includes(c)), ...thin.filter((c) => !GDELT_PRIORITY.includes(c)).sort()];
  const stale = (c) => { const e = cache.countries[c]; return !e || (now - Date.parse(e.fetchedAt)) / 3.6e6 >= GDELT_REFRESH_HOURS; };
  let used = 0, blocked = false;
  const stats = { queried: [], failed: [], rateLimited: false };
  for (const cc of order) {
    if (used >= budget || blocked) break;
    if (!stale(cc)) continue;
    if (used) await sleep(GDELT_GAP_MS);
    used++;
    try {
      const res = await fetchImpl(gdeltUrl(cc));
      const body = String(res.body || '');
      if (!res.ok || /^Please limit requests/i.test(body.trim())) {
        stats.failed.push(cc);
        if (res.status === 429 || /limit requests/i.test(body)) { stats.rateLimited = true; blocked = true; }
        continue;
      }
      let data = {};
      try { data = JSON.parse(body); } catch { stats.failed.push(cc); continue; }
      const arts = (data.articles || []).filter((a) => !a.language || /english/i.test(a.language)).slice(0, 12);
      cache.countries[cc] = { fetchedAt: now.toISOString(), articles: arts.map((a) => ({ url: a.url, title: a.title, seendate: a.seendate, domain: a.domain })) };
      stats.queried.push(cc);
    } catch (e) {
      stats.failed.push(cc);
    }
  }
  // Items from cache (fresh + previously cached), dropping old articles.
  const out = [];
  const seen = new Set(items.map((i) => i.url.toLowerCase()));
  for (const [cc, e] of Object.entries(cache.countries)) {
    e.articles = (e.articles || []).filter((a) => { const d = Date.parse(gdeltDate(a.seendate) || ''); return Number.isFinite(d) && (now - d) / 86400000 <= GDELT_KEEP_DAYS; });
    for (const a of e.articles) {
      const it = gdeltToItem(a, cc);
      if (!it || seen.has(it.url.toLowerCase())) continue;
      seen.add(it.url.toLowerCase());
      out.push(it);
    }
  }
  cache.updatedAt = now.toISOString();
  log(`GDELT: queried ${stats.queried.length} (${stats.queried.join(',') || 'none'}), failed ${stats.failed.length}${stats.rateLimited ? ' (rate limited; will retry next run)' : ''}, ${out.length} cached items in play`);
  return { items: out, cache, stats };
}

/** Readable header, one compact line per item (keeps the file ~half the size of pretty JSON). */
export function serializeFeed(payload) {
  const { items = [], ...head } = payload;
  const headJson = JSON.stringify(head, null, 2).replace(/\n}$/, '');
  return `${headJson},\n  "items": [\n${items.map((it) => `    ${JSON.stringify(it)}`).join(',\n')}\n  ]\n}\n`;
}

/** Per-country story counts (an item counts for every country it is tagged with). */
export function coverage(items) {
  const byCountry = {};
  for (const it of items) for (const c of it.loc?.countries || []) byCountry[c] = (byCountry[c] || 0) + 1;
  const withFour = Object.values(byCountry).filter((n) => n >= 4).length;
  const worldOnly = items.filter((i) => !(i.loc?.countries || []).length).length;
  return { countriesTagged: Object.keys(byCountry).length, countriesWith4: withFour, worldOnly, byCountry };
}

const CURATED_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'signals-curated.json');

/** Load + validate curated overrides; invalid file is skipped (logged), never fatal. */
export function loadCurated(path = CURATED_PATH) {
  if (!existsSync(path)) return null;
  try {
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    const errs = validateCurated(doc);
    if (errs.length) { console.warn(`WARN curated file invalid, skipped:\n  ${errs.join('\n  ')}`); return null; }
    return doc;
  } catch (e) {
    console.warn(`WARN curated file unreadable, skipped: ${e.message}`);
    return null;
  }
}

function withCurated(items) {
  const doc = loadCurated();
  const { items: curatedOut, applied } = applyCurated(items, doc);
  const out = tagSectors(curatedOut.map((it) => (it.loc && it.category ? it : locateItem(it, { home: (it.country || '').toLowerCase() || null, assumeHome: !!it.country }))));
  console.log(`Curated: +${applied.added.length} added, ${applied.overridden.length} overridden, ${applied.expired.length} expired, ${applied.unmatched.length} unmatched`);
  return { items: out, applied };
}

async function main() {
  const pack = JSON.parse(readFileSync(SOURCES_PATH, 'utf8'));
  const sources = pack.sources || [];
  if (process.argv.includes('--curated-only')) {
    // Re-apply curated entries to the current live file without refetching feeds.
    const live = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
    const { items, applied } = withCurated((live.items || []).filter((it) => !it.curated));
    const payload = { ...live, itemCount: items.length, coverage: coverage(items), verification: { ...live.verification, counts: tierCounts(items) }, curated: applied, items };
    writeFileSync(OUT_PATH, serializeFeed(payload));
    console.log(`Re-applied curated → ${items.length} items`);
    return;
  }
  console.log(`Fetching ${sources.length} feeds…`);
  let gdeltCache = null, gdeltStats = null;
  const noGdelt = process.argv.includes('--no-gdelt');
  const fetched = await fetchAll(sources, {
    extra: async (rssItems) => {
      if (noGdelt) return [];
      try {
        const r = await gdeltTopUp(rssItems);
        gdeltCache = r.cache; gdeltStats = r.stats;
        return r.items;
      } catch (e) {
        // GDELT is a top-up only; any failure leaves the RSS feed intact.
        console.log(`GDELT: skipped (${e?.message || e})`);
        return [];
      }
    },
  });
  if (gdeltCache) {
    mkdirSync(dirname(GDELT_CACHE_PATH), { recursive: true });
    writeFileSync(GDELT_CACHE_PATH, JSON.stringify(gdeltCache, null, 1) + '\n');
  }
  const { ok, failed } = fetched;
  const { items, applied: curatedApplied } = withCurated(fetched.items);
  for (const f of failed) console.log(`  FAIL ${f.id}: ${f.reason}`);
  for (const o of ok) console.log(`  OK   ${o.id}: ${o.count} items`);

  const payload = {
    generatedAt: new Date().toISOString(),
    mode: pack.mode || 'location-news',
    itemCount: items.length,
    coverage: coverage(items),
    gdelt: gdeltStats ? { queried: gdeltStats.queried, failed: gdeltStats.failed, rateLimited: gdeltStats.rateLimited } : null,
    verification: {
      counts: tierCounts(items),
      windowHours: VERIFY_WINDOW_HOURS,
      note: 'confirmed = subject/primary confirmed; multiple = 2+ independent outlets, subject silent; unconfirmed = factual claim, one non-primary outlet; analysis = opinion/commentary/trend/explainer (title heuristics + analysis feeds).',
    },
    sourcesOk: ok,
    sourcesFailed: failed,
    curated: curatedApplied,
    items,
  };
  if (!items.length) {
    // Every feed failed: keep the last good file rather than publishing an empty column.
    console.log(`No items fetched (OK ${ok.length} / FAIL ${failed.length}); keeping the last good ${OUT_PATH}`);
    process.exit(0);
  }
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, serializeFeed(payload));
  console.log(`Wrote ${items.length} items → ${OUT_PATH}`);
  console.log(`OK ${ok.length} / FAIL ${failed.length}`);
  console.log('Verification tiers:', JSON.stringify(payload.verification.counts));
  console.log(`Coverage: ${payload.coverage.countriesTagged} countries tagged, ${payload.coverage.countriesWith4} with 4+ stories, ${payload.coverage.worldOnly} world-level`);
  process.exit(0);
}

const invoked = process.argv[1] ? resolvePath(process.argv[1]) : '';
const isMain = invoked && fileURLToPath(import.meta.url) === invoked;
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
