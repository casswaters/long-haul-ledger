/**
 * Long Haul Ledger: curated feed overrides (data/signals-curated.json).
 * Hand-researched items and verification-tier corrections that survive every
 * 6-hour feed rebuild. Pure functions; used by scripts/fetch-signals.mjs and tests.
 */
import { STATUS_META } from './verify.js';

export const CURATED_TIERS = ['confirmed', 'multiple', 'unconfirmed', 'analysis'];
export const DEFAULT_MAX_AGE_DAYS = 30;

const isHttps = (u) => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u);
const isIso = (s) => typeof s === 'string' && !Number.isNaN(Date.parse(s)) && /^\d{4}-\d{2}-\d{2}/.test(s);
const normUrl = (u) => String(u || '').replace(/#.*$/, '').replace(/\/+$/, '').toLowerCase();

function validateSources(sources, where, errs, status) {
  if (!Array.isArray(sources) || !sources.length) { errs.push(`${where}: sources[] required`); return; }
  sources.forEach((s, i) => {
    if (!s?.name) errs.push(`${where}.sources[${i}]: name required`);
    if (!isHttps(s?.url)) errs.push(`${where}.sources[${i}]: https url required`);
  });
  if (status === 'confirmed' && !sources.some((s) => s.primary)) errs.push(`${where}: confirmed needs at least one primary (subject/official) source`);
  if (status === 'multiple' && new Set(sources.filter((s) => !s.primary).map((s) => s.name)).size < 2) errs.push(`${where}: multiple needs 2+ independent outlets`);
}

const CC_RE = /^[a-z]{2}$/;
const ADMIN1_RE = /^[a-z]{2}-[a-z0-9-]{1,12}$/;
const CITY_RE = /^[a-z]{2}-city-[a-z0-9-]{2,60}$/;

/** Optional `location` on an add or override: { countries[], admin1[], cities[] } (map ids, lowercase). */
function validateLocation(loc, where, errs) {
  if (loc == null) return;
  if (typeof loc !== 'object' || Array.isArray(loc)) { errs.push(`${where}: location must be an object`); return; }
  const arr = (k, re) => {
    if (loc[k] == null) return;
    if (!Array.isArray(loc[k]) || !loc[k].every((v) => typeof v === 'string' && re.test(v))) errs.push(`${where}: location.${k} must be an array of ids like ${k === 'countries' ? '"ca"' : k === 'admin1' ? '"ca-ab"' : '"ca-city-calgary"'}`);
  };
  arr('countries', CC_RE); arr('admin1', ADMIN1_RE); arr('cities', CITY_RE);
  if (!Array.isArray(loc.countries)) errs.push(`${where}: location.countries[] required (use [] for a world-level story)`);
  for (const id of [...(loc.admin1 || []), ...(loc.cities || [])]) {
    if (typeof id === 'string' && Array.isArray(loc.countries) && !loc.countries.includes(id.slice(0, 2))) errs.push(`${where}: location ${id} needs its country "${id.slice(0, 2)}" in location.countries`);
  }
}

/** Curated location → item.loc (basis "curated"). */
export function locFromCurated(loc) {
  return { countries: [...(loc.countries || [])], admin1: [...(loc.admin1 || [])], cities: [...(loc.cities || [])], titleCountries: [], basis: 'curated' };
}

/** Returns a list of human-readable schema errors (empty = valid). */
export function validateCurated(doc) {
  const errs = [];
  if (!doc || typeof doc !== 'object') return ['not an object'];
  if (doc.version !== 1) errs.push('version must be 1');
  if (!Array.isArray(doc.add)) errs.push('add[] required (may be empty)');
  if (!Array.isArray(doc.overrides)) errs.push('overrides[] required (may be empty)');
  const ids = new Set();
  (doc.add || []).forEach((a, i) => {
    const w = `add[${i}]${a?.id ? ` (${a.id})` : ''}`;
    if (!/^cur-[a-z0-9-]{3,60}$/.test(a?.id || '')) errs.push(`${w}: id must match cur-<slug>`);
    if (ids.has(a?.id)) errs.push(`${w}: duplicate id`); ids.add(a?.id);
    if (!a?.title || a.title.length > 240) errs.push(`${w}: title required (≤240 chars)`);
    if (!isHttps(a?.url)) errs.push(`${w}: https url required`);
    if (!a?.source) errs.push(`${w}: source (outlet name) required`);
    if (!isIso(a?.published)) errs.push(`${w}: published ISO date required`);
    if (!isIso(a?.addedAt)) errs.push(`${w}: addedAt ISO date required`);
    if (a?.expires != null && !isIso(a.expires)) errs.push(`${w}: expires must be ISO date`);
    if (!CURATED_TIERS.includes(a?.status)) errs.push(`${w}: status must be one of ${CURATED_TIERS.join('/')}`);
    if (a?.aliases != null && (!Array.isArray(a.aliases) || !a.aliases.every(isHttps))) errs.push(`${w}: aliases must be https urls`);
    validateLocation(a?.location, w, errs);
    validateSources(a?.sources, w, errs, a?.status);
  });
  (doc.overrides || []).forEach((o, i) => {
    const w = `overrides[${i}]`;
    if (!o?.match || (!isHttps(o.match.url) && !o.match.id)) errs.push(`${w}: match.url (https) or match.id required`);
    // A location-only override may omit status (it then keeps the item's tier).
    if (o?.status != null || o?.location == null) {
      if (!CURATED_TIERS.includes(o?.status)) errs.push(`${w}: status must be one of ${CURATED_TIERS.join('/')}`);
    }
    if (!isIso(o?.addedAt)) errs.push(`${w}: addedAt ISO date required`);
    if (o?.expires != null && !isIso(o.expires)) errs.push(`${w}: expires must be ISO date`);
    validateLocation(o?.location, w, errs);
    if (o?.sources != null) validateSources(o.sources, w, errs, o.status);
    else if (o?.status === 'confirmed' || o?.status === 'multiple') errs.push(`${w}: ${o.status} override needs sources[]`);
  });
  return errs;
}

/** Entry is live unless past explicit expires, or older than maxAgeDays since published/addedAt. */
export function isExpired(entry, now = new Date(), maxAgeDays = DEFAULT_MAX_AGE_DAYS) {
  const t = now.getTime();
  if (entry.expires && Date.parse(entry.expires) < t) return true;
  const ref = entry.published || entry.addedAt;
  if (ref && (t - Date.parse(ref)) / 86400000 > maxAgeDays) return true;
  return false;
}

function verificationFrom(entry, fallbackSources = []) {
  const status = entry.status;
  const sources = (entry.sources || fallbackSources).map((s) => ({ name: s.name, outlet: s.outlet || s.name, url: s.url, primary: !!s.primary, published: s.published || null }));
  return {
    status,
    label: STATUS_META[status].label,
    clusterId: `cur-${entry.id || 'override'}`,
    clusterSize: sources.length,
    outlets: new Set(sources.map((s) => s.outlet)).size,
    sources,
    confirmedBy: status === 'confirmed' ? sources.filter((s) => s.primary).map((s) => s.name) : [],
    curated: true,
    note: entry.note || null,
  };
}

/**
 * Apply curated adds + overrides to feed items. Adds are pinned (always kept,
 * regardless of score/cap) and replace any live item at the same url/alias.
 * Overrides change the tier/sources of a matching live item.
 * Returns { items, applied: {added, overridden, expired, unmatched} }.
 */
export function applyCurated(items, doc, now = new Date()) {
  const applied = { added: [], overridden: [], expired: [], unmatched: [] };
  if (!doc || validateCurated(doc).length) return { items, applied };
  const maxAge = Number(doc.maxAgeDays) || DEFAULT_MAX_AGE_DAYS;
  let out = items.map((it) => ({ ...it }));
  for (const o of doc.overrides) {
    if (isExpired(o, now, maxAge)) { applied.expired.push(o.match.url || o.match.id); continue; }
    const hit = out.find((it) => (o.match.id && it.id === o.match.id) || (o.match.url && normUrl(it.url) === normUrl(o.match.url)));
    if (!hit) { applied.unmatched.push(o.match.url || o.match.id); continue; }
    if (o.status) hit.verification = verificationFrom(o, hit.verification?.sources || []);
    if (o.location) {
      hit.loc = locFromCurated(o.location);
      hit.country = (hit.loc.countries[0] || '').toUpperCase();
      hit.countryId = hit.loc.countries[0] || '';
    }
    applied.overridden.push(hit.id);
  }
  const pinned = [];
  for (const a of doc.add) {
    if (isExpired(a, now, maxAge)) { applied.expired.push(a.id); continue; }
    const keys = new Set([a.url, ...(a.aliases || [])].map(normUrl));
    out = out.filter((it) => !keys.has(normUrl(it.url)));
    const d = new Date(a.published);
    pinned.push({
      id: a.id, title: a.title, url: a.url, source: a.source, sourceId: 'curated', kind: a.status === 'analysis' ? 'analysis' : (a.kind || 'hard-news'),
      published: d.toISOString(), publishedLabel: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
      ...(a.location
        ? { loc: locFromCurated(a.location), country: (a.location.countries[0] || '').toUpperCase(), countryId: a.location.countries[0] || '' }
        : { country: a.country || 'US', countryId: String(a.country || 'US').toLowerCase() }),
      tags: a.tags || [], score: Number.isFinite(a.score) ? a.score : 100, quality: 3, ...(a.category ? { category: a.category } : {}),
      blurb: a.blurb || '', real: true, primary: false, outlet: a.outlet || a.source, curated: true,
      verification: verificationFrom(a),
    });
    applied.added.push(a.id);
  }
  // Pinned items first by score/recency alongside live items.
  const all = [...pinned, ...out].sort((x, y) => (y.score - x.score) || String(y.published || '').localeCompare(String(x.published || '')));
  return { items: all, applied };
}
