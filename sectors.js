/**
 * Long Haul Ledger: reusable sector-tab engine.
 *
 * A "sector tab" (Energy is the first) is a definition object:
 *   { id, emoji, label, subs: [{ id, name, copy, rules, neg? }], stages: [...], ... }
 * This module tags stories with a sector's subs (e.g. energy sources) and
 * lifecycle stages, builds the per-place story column with labeled backfill
 * from parent places, and validates the precomputed briefs file.
 *
 * Plain stage labels always point back to an official category: the
 * economic type (Primary to Quinary) plus NAICS code(s) on census.gov.
 * The future five-sector tabs (Primary, Secondary, Tertiary, Quaternary,
 * Quinary) reuse the same pattern.
 * Pure functions; shared by app.js, scripts and tests.
 */
import { placeOf, parentPlace, placeLabel, rankedForPlace, moreLabel, LEVEL_NAMES } from './newsrank.js';

/** The five economic types. Plain label + official reference. */
export const ECONOMIC_TYPES = {
  primary: { id: 'primary', label: 'Primary', plain: 'Extract raw materials', examples: 'farming, mining, fishing, forestry, oil and gas extraction' },
  secondary: { id: 'secondary', label: 'Secondary', plain: 'Turn raw materials into products', examples: 'manufacturing, construction, food processing, power generation, refining' },
  tertiary: { id: 'tertiary', label: 'Tertiary', plain: 'Services', examples: 'healthcare, education, retail, banking, hospitality, utilities that deliver and sell power' },
  quaternary: { id: 'quaternary', label: 'Quaternary', plain: 'Knowledge work', examples: 'IT, research and development, consulting, design' },
  quinary: { id: 'quinary', label: 'Quinary', plain: 'High-level decisions', examples: 'government leadership, higher-education administration, top non-profit management' },
};

/** Official classification sources used by stage references. */
export const OFFICIAL_SOURCES = {
  naics: { name: 'NAICS 2022 (U.S. Census Bureau)', url: 'https://www.census.gov/naics/' },
  blsIndustries: { name: 'BLS Industries at a Glance', url: 'https://www.bls.gov/iag/tgs/iag_index_alpha.htm' },
};

/** census.gov NAICS page for a code (2022 edition). */
export function naicsUrl(code) {
  const c = encodeURIComponent(String(code));
  return `https://www.census.gov/naics/?input=${c}&year=2022&details=${c}`;
}

export const MAX_AGE_DAYS = 45;
export const SECTOR_TOP_N = 6;
export const SECTOR_MIN_N = 4;
export const WORLD_PER_COUNTRY = 3;
export const BRIEF_STALE_DAYS = 7;
export const BRIEF_MAX_ITEMS = 4;

/** Count rule hits: title hits count double, summary hits once. */
function hits(rules, title, summary) {
  let score = 0;
  for (const re of rules) {
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    score += 2 * (String(title).match(r) || []).length;
    score += (String(summary).match(r) || []).length;
  }
  return score;
}

/**
 * Tag one story with a sector's subs and stages.
 * Returns { subs: [ids best first], stages: [ids best first] }. A sub needs a
 * title hit or two summary hits (score >= 2), the same bar the topic tagger uses.
 * `neg` patterns veto a sub unless one of its `keep` patterns also matches.
 */
export function tagSector(sector, { title = '', summary = '' } = {}) {
  const text = `${title} ${summary}`;
  const scored = [];
  for (const sub of sector.subs) {
    let s = hits(sub.rules, title, summary);
    if (s && sub.neg && sub.neg.some((re) => re.test(text)) && !(sub.keep || []).some((re) => re.test(text))) s = 0;
    if (s >= 2) scored.push([sub.id, s]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  const subs = scored.slice(0, 3).map(([id]) => id);
  const stages = [];
  if (subs.length) {
    const st = [];
    for (const stage of sector.stages) {
      const s = hits(stage.rules, title, summary);
      if (s >= 1) st.push([stage.id, s]);
    }
    st.sort((a, b) => b[1] - a[1]);
    stages.push(...st.slice(0, 2).map(([id]) => id));
  }
  return { subs, stages };
}

/** Sector tags for an item: precomputed (fetch time) when present, else computed now. */
export function sectorTagsOf(sector, it) {
  const pre = it?.sectors?.[sector.id];
  if (pre && Array.isArray(pre.subs)) return pre;
  return tagSector(sector, { title: it?.title, summary: it?.blurb });
}

/** Attach tags for every sector definition (used by the feed builder). */
export function withSectorTags(it, sectors) {
  const out = {};
  for (const s of sectors) {
    const t = tagSector(s, { title: it.title, summary: it.blurb });
    if (t.subs.length) out[s.id] = t;
  }
  return Object.keys(out).length ? { ...it, sectors: out } : it;
}

const ageDays = (it, now) => {
  const t = Date.parse(it.published || '');
  return Number.isFinite(t) ? (now.getTime() - t) / 86400000 : 0;
};

/** Stories for one sub (and optional stage) within maxAge. */
export function filterSector(items, sector, { sub = null, stage = null, now = new Date(), maxAgeDays = MAX_AGE_DAYS } = {}) {
  return (items || []).filter((it) => {
    if (!it || !it.url) return false;
    const t = sectorTagsOf(sector, it);
    if (!t.subs.length) return false;
    if (sub && !t.subs.includes(sub)) return false;
    if (stage && !(t.stages || []).includes(stage)) return false;
    return ageDays(it, now) <= maxAgeDays;
  });
}

/** Ranked list for a place, at most `perCountry` per primary country at world level. */
function pick(ranked, place, limit, perCountry = WORLD_PER_COUNTRY) {
  const per = new Map();
  const out = [];
  for (const it of ranked) {
    if (out.length >= limit) break;
    if (place.level === 'world') {
      const k = it.loc?.countries?.[0] || '_';
      if ((per.get(k) || 0) >= perCountry) continue;
      per.set(k, (per.get(k) || 0) + 1);
    }
    out.push(it);
  }
  return out;
}

/**
 * Column for one sub at a place, with labeled backfill:
 *   { label, levelName, primary[], more: [{ label, level, items[] }], total,
 *     emptyText, fewText, showingFrom }
 * When the place has no stories, emptyText reads e.g.
 *   "No recent nuclear stories tagged to Ohio. Showing United States."
 */
export function sectorColumn(items, place, sector, { sub = null, stage = null, names = {}, now = new Date(), limit = SECTOR_TOP_N, min = SECTOR_MIN_N } = {}) {
  const subDef = sector.subs.find((s) => s.id === sub);
  const noun = subDef ? subDef.noun || subDef.name.toLowerCase() : sector.label.toLowerCase();
  const stageDef = stage ? sector.stages.find((s) => s.id === stage) : null;
  const what = stageDef ? `${noun} stories (${stageDef.label.toLowerCase()})` : `${noun} stories`;
  const pool = filterSector(items, sector, { sub, stage, now });
  const label = placeLabel(place, names);
  const ranked = rankedForPlace(pool, place, { now });
  const primary = pick(ranked, place, limit);
  const shown = new Set(primary.map((i) => i.url));
  // Same story from another outlet (one verification cluster) never repeats in the backfill.
  const clusterOf = (i) => (i.verification?.clusterId && (i.verification.clusterSize || 1) > 1 ? i.verification.clusterId : null);
  const shownClusters = new Set(primary.map(clusterOf).filter(Boolean));
  const more = [];
  let showingFrom = null;
  if (primary.length < min) {
    let up = parentPlace(place);
    let total = primary.length;
    while (up && total < limit) {
      const fresh = rankedForPlace(pool, up, { now, exclude: shown }).filter((i) => !shownClusters.has(clusterOf(i)));
      const extra = pick(fresh, up, limit - total);
      if (extra.length) {
        if (!showingFrom) showingFrom = up;
        more.push({ label: moreLabel(up, names), level: up.level, items: extra });
        extra.forEach((i) => { shown.add(i.url); const c = clusterOf(i); if (c) shownClusters.add(c); });
        total += extra.length;
      }
      up = parentPlace(up);
    }
  }
  let emptyText = '';
  if (!primary.length) {
    const base = place.level === 'world' ? `No recent ${what} yet.` : `No recent ${what} tagged to ${label}.`;
    emptyText = showingFrom ? `${base} Showing ${showingFrom.level === 'world' ? 'worldwide stories' : inSentence(placeLabel(showingFrom, names))}.` : base;
  }
  const fewText = primary.length && primary.length < min
    ? `${primary.length === 1 ? 'Only 1 recent story is' : `Only ${primary.length} recent stories are`} tagged to ${label}.` : '';
  return { label, level: place.level, levelName: LEVEL_NAMES[place.level], primary, more, total: ranked.length, ranked, emptyText, fewText, showingFrom };
}

/** Story counts per sub (and per stage within a sub) for a place. */
export function sectorCounts(items, place, sector, { now = new Date() } = {}) {
  const subs = {};
  const stages = {};
  for (const s of sector.subs) { subs[s.id] = 0; stages[s.id] = Object.fromEntries(sector.stages.map((st) => [st.id, 0])); }
  const seen = new Set();
  for (const it of rankedForPlace(filterSector(items, sector, { now }), place, { now })) {
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    const t = sectorTagsOf(sector, it);
    for (const id of t.subs) {
      if (subs[id] === undefined) continue;
      subs[id]++;
      for (const st of t.stages || []) if (stages[id][st] !== undefined) stages[id][st]++;
    }
  }
  return { subs, stages };
}

/** Child places with the most stories for a sub (countries at world level, state equivalents in a country). */
export function topChildren(items, place, sector, { sub = null, now = new Date(), n = 6 } = {}) {
  if (place.level === 'admin1' || place.level === 'city') return [];
  const pool = rankedForPlace(filterSector(items, sector, { sub, now }), place, { now });
  const counts = new Map();
  for (const it of pool) {
    const keys = place.level === 'world' ? (it.loc?.countries || []) : (it.loc?.admin1 || []);
    for (const k of new Set(keys)) counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n)
    .map(([id, count]) => ({ id, count, level: place.level === 'world' ? 'country' : 'admin1', country: place.level === 'world' ? id : place.country }));
}

/** Place name as used inside a sentence: "the United States", "the Netherlands", "Ohio". */
const THE_RE = /^(?:United |Republic of|Democratic Republic|Central African Republic|Czech Republic|Dominican Republic|Netherlands|Philippines|Bahamas|Gambia|Maldives|Solomon Islands|Marshall Islands|Comoros|Seychelles|Ivory Coast|Vatican|Falkland|Gulf |Northern Territory|Australian Capital Territory|Basque Country)/;
export function inSentence(name) {
  const n = String(name || '');
  if (n === 'World' || !n) return 'the world';
  return THE_RE.test(n) ? `the ${n}` : n;
}

/* ---------- Briefs ---------- */

/** Location id used as the briefs key: world, us, us-oh, us-city-houston. */
export function placeKey(place) {
  const p = place?.level ? place : placeOf(place || {});
  return p.city || p.admin1 || p.country || 'world';
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const BAD_VOICE = /[\u2014\u007E]/;

/**
 * Validate a briefs document. Returns { errors[], warnings[], valid } where
 * `valid` is a cleaned copy holding only accepted briefs/items. Rules:
 *  - every item needs text and at least one source { title, url (http/https), date YYYY-MM-DD }
 *  - items without a usable source are rejected (dropped, reported as errors)
 *  - a brief needs 1 to 4 accepted items and a parseable generated_at
 *  - no em dash or tilde in brief text (house voice)
 *  - briefs older than 7 days are flagged stale (warning; UI shows the flag)
 */
export function validateBriefs(doc, sector, { now = new Date(), staleDays = BRIEF_STALE_DAYS } = {}) {
  const errors = [];
  const warnings = [];
  const valid = { version: doc?.version || 1, sector: sector.id, briefs: {} };
  if (!doc || typeof doc !== 'object' || typeof doc.briefs !== 'object' || !doc.briefs) {
    errors.push('briefs: missing top-level "briefs" object');
    return { errors, warnings, valid };
  }
  if (doc.sector && doc.sector !== sector.id) errors.push(`sector: expected "${sector.id}", got "${doc.sector}"`);
  const subIds = new Set(sector.subs.map((s) => s.id));
  for (const [loc, bySub] of Object.entries(doc.briefs)) {
    if (!/^[a-z0-9-]+$/.test(loc)) { errors.push(`${loc}: location id must be lowercase letters, digits and dashes`); continue; }
    for (const [sub, b] of Object.entries(bySub || {})) {
      const at = `${loc}/${sub}`;
      if (!subIds.has(sub)) { errors.push(`${at}: unknown ${sector.id} source "${sub}"`); continue; }
      const gen = Date.parse(b?.generated_at || '');
      if (!Number.isFinite(gen)) { errors.push(`${at}: generated_at missing or not a date`); continue; }
      const items = [];
      (b.items || []).forEach((it, i) => {
        const where = `${at} item ${i + 1}`;
        if (!it || typeof it.text !== 'string' || it.text.trim().length < 40) { errors.push(`${where}: text missing or too short`); return; }
        if (BAD_VOICE.test(it.text)) { errors.push(`${where}: em dash or tilde in text`); return; }
        const sources = (it.sources || []).filter((s) => s && typeof s.title === 'string' && s.title.trim() && /^https?:\/\//i.test(String(s.url || '')) && ISO_DAY.test(String(s.date || '')));
        if (!sources.length) { errors.push(`${where}: rejected, no source with title, http(s) url and YYYY-MM-DD date`); return; }
        if (sources.length < (it.sources || []).length) warnings.push(`${where}: ${(it.sources || []).length - sources.length} malformed source(s) dropped`);
        items.push({ ...it, sources });
      });
      if (items.length > BRIEF_MAX_ITEMS) { errors.push(`${at}: more than ${BRIEF_MAX_ITEMS} items`); continue; }
      if (!items.length) { errors.push(`${at}: no accepted items; brief rejected`); continue; }
      const age = (now.getTime() - gen) / 86400000;
      const stale = age > staleDays;
      if (stale) warnings.push(`${at}: stale (${Math.floor(age)} days old)`);
      valid.briefs[loc] = valid.briefs[loc] || {};
      valid.briefs[loc][sub] = { ...b, items, stale };
    }
  }
  return { errors, warnings, valid };
}

/** Brief for a place + sub from a validated doc, else null. */
export function briefFor(validDoc, place, sub) {
  return validDoc?.briefs?.[placeKey(place)]?.[sub] || null;
}

/** Nearest ancestor (excluding the place itself) that has a brief for this sub. */
export function nearestParentBrief(validDoc, place, sub) {
  let up = parentPlace(place);
  while (up) {
    const b = briefFor(validDoc, up, sub);
    if (b) return { place: up, brief: b };
    up = parentPlace(up);
  }
  return null;
}

/** Heading for a brief: "The 4 most important things happening in nuclear this week". */
export function briefHeading(sector, sub, n) {
  const subDef = sector.subs.find((s) => s.id === sub);
  const noun = subDef ? subDef.noun || subDef.name.toLowerCase() : sector.label.toLowerCase();
  const count = n === 1 ? 'The most important thing' : `The ${n} most important things`;
  return `${count} happening in ${noun} this week`;
}

/** Latest source date across a brief's items (YYYY-MM-DD), for the as-of line. */
export function briefAsOf(brief) {
  const ds = (brief?.items || []).flatMap((i) => (i.sources || []).map((s) => s.date)).filter(Boolean).sort();
  return ds[ds.length - 1] || null;
}

/* ---------- Hash tokens: "energy", "energy/nuclear", "energy/nuclear/brief" ---------- */

export function parseSectorToken(key, sectorIds) {
  const m = String(key || '').match(/^([a-z]+)(?:\/([a-z-]+))?(?:\/(brief))?$/);
  if (!m || !sectorIds.includes(m[1])) return null;
  return { tab: m[1], sub: m[2] || null, brief: !!m[2] && m[3] === 'brief' };
}

export function sectorToken({ tab = null, sub = null, brief = false } = {}) {
  if (!tab) return '';
  return [tab, sub, sub && brief ? 'brief' : null].filter(Boolean).join('/');
}
