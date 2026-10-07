/**
 * Long Haul Ledger: news column ranking per map location.
 * World > Country > State equivalent > City. Each level shows 4–5 stories,
 * balanced across energy / infrastructure / industry / geopolitics where
 * possible, ranked by recency + verification tier + source quality. When a
 * place has fewer than 4 stories, the column shows what exists and then
 * clearly labeled stories from the parent level ("More from Canada",
 * "More worldwide"); it never pads silently.
 * Pure functions; shared by app.js and tests.
 */
import { CATEGORIES, CATEGORY_LABELS } from './locate.js';

export const TOP_N = 5;
export const MIN_N = 4;
export const WORLD_PER_COUNTRY = 2;
export const TIER_WEIGHT = { confirmed: 18, multiple: 15, unconfirmed: 9, analysis: 4, sample: 0 };
const TRANSCRIPT_RE = /^(?:remarks|speech|keynote|statement|opening remarks|factsheet|daily news|readout|press remarks)\b/i;
export { CATEGORIES, CATEGORY_LABELS };

/** Map state → place { level, country, admin1, city }. */
export function placeOf({ country = null, admin1 = null, city = null } = {}) {
  if (country && city) return { level: 'city', country, admin1, city };
  if (country && admin1) return { level: 'admin1', country, admin1, city: null };
  if (country) return { level: 'country', country, admin1: null, city: null };
  return { level: 'world', country: null, admin1: null, city: null };
}

/** One level up: city → state equivalent (or country) → country → world. */
export function parentPlace(place) {
  if (place.level === 'city') return place.admin1 ? { level: 'admin1', country: place.country, admin1: place.admin1, city: null } : { level: 'country', country: place.country, admin1: null, city: null };
  if (place.level === 'admin1') return { level: 'country', country: place.country, admin1: null, city: null };
  if (place.level === 'country') return { level: 'world', country: null, admin1: null, city: null };
  return null;
}

const locOf = (it) => it.loc || { countries: it.countryId ? [String(it.countryId).toLowerCase()] : [], admin1: [], cities: [], titleCountries: [] };

export function matchesPlace(it, place) {
  const loc = locOf(it);
  switch (place.level) {
    case 'world': return true;
    case 'country': return loc.countries.includes(place.country);
    case 'admin1': return (loc.admin1 || []).includes(place.admin1);
    case 'city': return (loc.cities || []).includes(place.city);
    default: return false;
  }
}

export function categoryOf(it) {
  return CATEGORIES.includes(it.category) ? it.category : 'general';
}

/** Ranking score: recency (half-life 36 h) + verification tier + source quality + topic + place relevance. */
export function rankScore(it, place, now = new Date()) {
  const t = Date.parse(it.published || '');
  const ageH = Number.isFinite(t) ? Math.max(0, (now.getTime() - t) / 3.6e6) : null;
  const recency = ageH == null ? 4 : 32 * Math.pow(0.5, ageH / 36);
  const tier = TIER_WEIGHT[it.verification?.status] ?? 6;
  const quality = (Number(it.quality) || 2) * 4;
  const topic = categoryOf(it) === 'general' ? -18 : 4;
  let rel = 0;
  const loc = locOf(it);
  // Filed by outlet home country only (no place named in the text): weaker signal.
  if (loc.basis === 'source') rel -= 8;
  // Speech transcripts / factsheets / daily digests rank below reported news.
  if (TRANSCRIPT_RE.test(String(it.title || ''))) rel -= 8;
  if (place.level !== 'world' && (loc.titleCountries || []).includes(place.country)) rel += 6;
  if (place.level !== 'world' && loc.countries[0] === place.country) rel += 3;
  if (it.curated) rel += 4;
  return recency + tier + quality + topic + rel;
}

const normTitle = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).slice(0, 8).join(' ');

/** All stories for a place, deduped (same story cluster / same headline), best first. */
export function rankedForPlace(items, place, { category = null, now = new Date(), exclude = new Set() } = {}) {
  const scored = [];
  for (const it of items || []) {
    if (!it || !it.url || exclude.has(it.url)) continue;
    if (!matchesPlace(it, place)) continue;
    if (category && categoryOf(it) !== category) continue;
    scored.push({ it, s: rankScore(it, place, now) });
  }
  scored.sort((a, b) => b.s - a.s);
  const seenCluster = new Set(), seenTitle = new Set(), out = [];
  for (const { it } of scored) {
    const c = it.verification?.clusterId && (it.verification.clusterSize || 1) > 1 ? it.verification.clusterId : null;
    const nt = normTitle(it.title);
    if ((c && seenCluster.has(c)) || seenTitle.has(nt)) continue;
    if (c) seenCluster.add(c);
    seenTitle.add(nt);
    out.push(it);
  }
  return out;
}

/**
 * Top stories for one place: up to `limit`, one per category first (best
 * categories first), then the next best topical stories, then general items only if still short. At world level, at most
 * WORLD_PER_COUNTRY stories per primary country so the view stays global.
 */
export function topStories(items, place, { limit = TOP_N, category = null, now = new Date(), exclude = new Set() } = {}) {
  const ranked = rankedForPlace(items, place, { category, now, exclude });
  const perCountry = new Map();
  const okCountry = (it) => place.level !== 'world' || (perCountry.get(locOf(it).countries[0] || '_') || 0) < WORLD_PER_COUNTRY;
  const take = (it, picked) => { picked.push(it); const k = locOf(it).countries[0] || '_'; perCountry.set(k, (perCountry.get(k) || 0) + 1); };
  const picked = [];
  if (!category) {
    for (const cat of CATEGORIES) {
      if (picked.length >= limit) break;
      const best = ranked.find((it) => categoryOf(it) === cat && !picked.includes(it) && okCountry(it));
      if (best) take(best, picked);
    }
  }
  // Fill: topical stories first; general-interest items only if still short.
  for (const topical of [true, false]) {
    for (const it of ranked) {
      if (picked.length >= limit) break;
      if ((categoryOf(it) !== 'general') !== topical) continue;
      if (!picked.includes(it) && okCountry(it)) take(it, picked);
    }
  }
  const order = new Map(ranked.map((it, i) => [it, i]));
  return picked.sort((a, b) => order.get(a) - order.get(b));
}

/** Human label for a place; `names` supplies { country(id), admin1(id), city(id) } lookups. */
export function placeLabel(place, names = {}) {
  if (!place || place.level === 'world') return 'World';
  if (place.level === 'country') return names.country?.(place.country) || String(place.country).toUpperCase();
  if (place.level === 'admin1') return names.admin1?.(place.admin1) || place.admin1;
  return names.city?.(place.city) || place.city;
}

export const LEVEL_NAMES = { world: 'World', country: 'Country', admin1: 'State equivalent', city: 'City' };

export function moreLabel(place, names = {}) {
  return place.level === 'world' ? 'More worldwide' : `More from ${placeLabel(place, names)}`;
}

/**
 * Build the whole column for a place:
 *  { label, levelName, primary[], more: [{ label, items[] }], emptyText, counts, total }.
 * Fallback walks up the hierarchy until TOP_N stories are shown in total.
 */
export function buildColumn(items, place, { names = {}, category = null, now = new Date(), limit = TOP_N } = {}) {
  const label = placeLabel(place, names);
  const all = rankedForPlace(items, place, { now });
  const counts = { all: all.length };
  for (const c of CATEGORIES) counts[c] = all.filter((it) => categoryOf(it) === c).length;
  const primary = topStories(items, place, { limit, category, now });
  const shown = new Set(primary.map((it) => it.url));
  const more = [];
  if (primary.length < MIN_N) {
    let up = parentPlace(place);
    let total = primary.length;
    while (up && total < limit) {
      const extra = topStories(items, up, { limit: limit - total, category, now, exclude: shown });
      if (extra.length) {
        more.push({ label: moreLabel(up, names), level: up.level, items: extra });
        extra.forEach((it) => shown.add(it.url));
        total += extra.length;
      }
      up = parentPlace(up);
    }
  }
  const topic = category ? `${CATEGORY_LABELS[category].toLowerCase()} ` : '';
  const emptyText = primary.length ? '' : (place.level === 'world'
    ? `No recent ${topic}stories yet.`
    : `No recent ${topic}stories tagged to ${label} yet.`);
  const fewText = primary.length && primary.length < MIN_N
    ? `${primary.length === 1 ? 'Only 1 recent story is' : `Only ${primary.length} recent stories are`} tagged to ${label}.`
    : '';
  const totalForPlace = category ? counts[category] : counts.all;
  return { label, level: place.level, levelName: LEVEL_NAMES[place.level], primary, more, emptyText, fewText, counts, total: totalForPlace };
}
