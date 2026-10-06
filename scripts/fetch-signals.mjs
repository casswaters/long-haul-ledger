#!/usr/bin/env node
/**
 * Long Haul Ledger — soft-launch RSS fetcher ($0, no paid APIs).
 * Pulls public feeds from data/sources.json → data/signals-live.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { classifyItems, tierCounts, VERIFY_WINDOW_HOURS, looksLikeAnalysisTitle } from '../verify.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const SOURCES_PATH = join(ROOT, 'data', 'sources.json');
const OUT_PATH = join(ROOT, 'data', 'signals-live.json');

const UA =
  'LongHaulLedgerBot/0.1 (+https://casswaters.github.io/long-haul-ledger/; soft-launch public RSS; no scraping beyond feed XML)';
const FETCH_TIMEOUT_MS = 14000;
const PER_FEED_CAP = 18;
const GLOBAL_CAP = 110;
const MIN_SCORE = 28;

/** Progress / US civ-building keyword weights (light scorer). */
export const SCORE_TERMS = [
  [/united states|\bu\.?s\.?\b|\bamerica\b|\bwashington\b|\bd\.?c\.?\b/i, 14],
  [/\b(grid|transmission|interconnection|nuclear|fusion|solar|wind|battery|geothermal|permitting)\b/i, 12],
  [/\b(semiconductor|chip|fab|gpu|ai infra|data center|hyperscale|compute)\b/i, 12],
  [/\b(manufactur|factory|industrial|reshor|nearshor|supply chain|shipyard)\b/i, 10],
  [/\b(infrastructure|port|rail|highway|broadband|housing|construction)\b/i, 10],
  [/\b(progress|abundance|state capacity|industrial policy|productivity)\b/i, 11],
  [/\b(nasa|nist|doe|arpa|nsf|federal|congress|agency)\b/i, 8],
  [/\b(energy|climate|power|utility|electric)\b/i, 7],
  [/\b(research|science|engineering|innovation)\b/i, 5],
];

const NEG_TERMS = [
  /\b(celebrity|gossip|sports score|box office|reality tv)\b/i,
  /\b(horoscope|crossword)\b/i,
];

export function stripHtml(s) {
  return String(s ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function scoreItem({ title, summary, tags = [], country = 'US', kind = 'hard-news' }) {
  const blob = `${title} ${summary} ${(tags || []).join(' ')}`;
  let score = 40;
  if (String(country).toUpperCase() === 'US') score += 8;
  if (kind === 'hard-news') score += 3;
  if (kind === 'analysis') score += 2;
  for (const [re, w] of SCORE_TERMS) {
    if (re.test(blob)) score += w;
  }
  for (const re of NEG_TERMS) {
    if (re.test(blob)) score -= 25;
  }
  // Recency bump handled separately when published known
  return Math.max(0, Math.min(100, score));
}

export function normalizeItem(raw, source) {
  const title = stripHtml(raw.title).slice(0, 240);
  const url = stripHtml(raw.link).trim();
  const published = toIsoDate(raw.published);
  const blurb = stripHtml(raw.summary).slice(0, 280);
  const country = source.countryDefault || 'US';
  const tags = [...(source.tags || [])];
  // Promote opinion / explainer / trend-roundup titles to Analysis even when
  // the parent feed is hard-news (e.g. NPR Science explainers, NYT How/Why).
  let kind = source.kind || 'hard-news';
  if (kind !== 'analysis' && looksLikeAnalysisTitle(title)) {
    kind = 'analysis';
    if (!tags.includes('analysis')) tags.push('analysis');
  }
  let score = scoreItem({
    title,
    summary: blurb,
    tags,
    country,
    kind,
  });
  if (published) {
    const ageDays = (Date.now() - new Date(published).getTime()) / 86400000;
    if (ageDays <= 2) score += 10;
    else if (ageDays <= 7) score += 6;
    else if (ageDays <= 30) score += 2;
    else if (ageDays > 120) score -= 8;
  }
  score = Math.max(0, Math.min(100, score));
  const id = `live-${hashId(url || title)}`;
  return {
    id,
    title,
    url,
    source: source.name,
    sourceId: source.id,
    kind,
    published,
    publishedLabel: dateStamp(published),
    country,
    countryId: String(country).toLowerCase() === 'us' ? 'us' : String(country).toLowerCase(),
    tags,
    score,
    blurb,
    real: true,
    primary: !!source.primary,
    outlet: source.outlet || source.id,
  };
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

export async function fetchAll(sources, { fetchImpl = fetchText } = {}) {
  const ok = [];
  const failed = [];
  const items = [];

  for (const source of sources) {
    try {
      const res = await fetchImpl(source.url);
      if (!res.ok) {
        failed.push({ id: source.id, status: res.status, reason: `HTTP ${res.status}` });
        continue;
      }
      const look = res.body.slice(0, 200).toLowerCase();
      if (!look.includes('<rss') && !look.includes('<feed') && !look.includes('<rdf')) {
        // Some feeds still work with odd wrappers; try parse anyway if <item> present
        if (!/<item[\s>]/i.test(res.body) && !/<entry[\s>]/i.test(res.body)) {
          failed.push({ id: source.id, status: res.status, reason: 'not RSS/Atom' });
          continue;
        }
      }
      const raw = parseFeedXml(res.body).slice(0, PER_FEED_CAP);
      if (!raw.length) {
        failed.push({ id: source.id, status: res.status, reason: 'zero items' });
        continue;
      }
      const normalized = raw.map((r) => normalizeItem(r, source));
      items.push(...normalized);
      ok.push({ id: source.id, count: normalized.length });
    } catch (err) {
      failed.push({
        id: source.id,
        status: 0,
        reason: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err),
      });
    }
  }

  // Classify across everything fetched (pre-cap) so a primary-source item that
  // misses the cap can still confirm a cluster that made it in.
  const classified = classifyItems(items);
  const merged = mergeAndCap(classified, GLOBAL_CAP);
  return { ok, failed, items: merged, pool: classified };
}

async function main() {
  const pack = JSON.parse(readFileSync(SOURCES_PATH, 'utf8'));
  const sources = pack.sources || [];
  console.log(`Fetching ${sources.length} feeds…`);
  const { ok, failed, items } = await fetchAll(sources);
  for (const f of failed) console.log(`  FAIL ${f.id}: ${f.reason}`);
  for (const o of ok) console.log(`  OK   ${o.id}: ${o.count} items`);

  const payload = {
    generatedAt: new Date().toISOString(),
    mode: pack.mode || 'us-progress',
    itemCount: items.length,
    verification: {
      counts: tierCounts(items),
      windowHours: VERIFY_WINDOW_HOURS,
      note: 'confirmed = subject/primary confirmed; multiple = 2+ independent outlets, subject silent; unconfirmed = factual claim, one non-primary outlet; analysis = opinion/commentary/trend/explainer (title heuristics + analysis feeds).',
    },
    sourcesOk: ok,
    sourcesFailed: failed,
    items,
  };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Wrote ${items.length} items → ${OUT_PATH}`);
  console.log(`OK ${ok.length} / FAIL ${failed.length}`);
  console.log('Verification tiers:', JSON.stringify(payload.verification.counts));
  if (!items.length) process.exit(2);
  else process.exit(0);
}

const invoked = process.argv[1] ? resolvePath(process.argv[1]) : '';
const isMain = invoked && fileURLToPath(import.meta.url) === invoked;
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
