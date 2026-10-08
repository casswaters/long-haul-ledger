#!/usr/bin/env node
/**
 * Long Haul Ledger: candidate stories for sector-tab briefs (writer input) and
 * brief validation, for Energy and the five sector tabs. No keys, no network;
 * reads data/signals-live.json.
 *
 *   node scripts/build-energy-brief.mjs
 *       Writes data/news-cache/{tab}-candidates.json for every tab (repo-only,
 *       excluded from Pages): for every place with stories (world, countries,
 *       state equivalents, cities) and every source or segment, the ranked
 *       candidate stories a writer should read, plus brief status.
 *   node scripts/build-energy-brief.mjs --place us --source nuclear
 *   node scripts/build-energy-brief.mjs --sector services --place us --source health
 *       Prints one candidate list as Markdown with the writing rules.
 *   node scripts/build-energy-brief.mjs --validate [--sector <tab>]
 *       Validates data/{tab}-briefs.json (all tabs by default); exits 1 on errors.
 * Tabs: energy, materials, manufacturing, services, technology, policy.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { ENERGY } from '../energy.js';
import { SECTOR_TABS, sectorById } from '../tabs.js';
import { filterSector, sectorTagsOf, validateBriefs, placeKey, briefFor } from '../sectors.js';
import { rankedForPlace, placeLabel } from '../newsrank.js';
import { countryName } from '../places.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = join(ROOT, 'data', 'signals-live.json');
const briefsPath = (id) => join(ROOT, 'data', `${id}-briefs.json`);
const outPath = (id) => join(ROOT, 'data', 'news-cache', `${id}-candidates.json`);
export const CANDIDATES_PER_KEY = 12;
export const CANDIDATE_MAX_AGE_DAYS = 10;

const readJson = (p, d = null) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return d; } };

export function placeNamesFromGeo(root = ROOT) {
  const a1 = new Map();
  const ct = new Map();
  for (const f of readJson(join(root, 'data', 'geo', 'admin1.geojson'), { features: [] }).features) a1.set(f.properties.id, f.properties.name);
  for (const f of readJson(join(root, 'data', 'geo', 'cities.geojson'), { features: [] }).features) ct.set(f.properties.id, String(f.properties.name).replace(/\s+/g, ' '));
  return { country: (id) => countryName(id), admin1: (id) => a1.get(id) || id, city: (id) => ct.get(id) || id };
}

/** Every place that has at least one energy story, as place objects. */
export function placesWithStories(items, sector = ENERGY) {
  const out = new Map([['world', { level: 'world', country: null, admin1: null, city: null }]]);
  for (const it of filterSector(items, sector, { maxAgeDays: CANDIDATE_MAX_AGE_DAYS })) {
    const loc = it.loc || {};
    for (const c of loc.countries || []) out.set(c, { level: 'country', country: c, admin1: null, city: null });
    for (const a of loc.admin1 || []) out.set(a, { level: 'admin1', country: a.split('-')[0], admin1: a, city: null });
    for (const c of loc.cities || []) out.set(c, { level: 'city', country: c.split('-')[0], admin1: null, city: c });
  }
  return [...out.values()];
}

/** Candidate list for one place + source, best first. */
export function candidatesFor(items, place, sub, { now = new Date(), limit = CANDIDATES_PER_KEY, sector = ENERGY } = {}) {
  const pool = filterSector(items, sector, { sub, now, maxAgeDays: CANDIDATE_MAX_AGE_DAYS });
  return rankedForPlace(pool, place, { now }).slice(0, limit).map((it) => ({
    title: it.title,
    url: it.url,
    source: it.source,
    published: it.published,
    verification: it.verification?.status || 'unconfirmed',
    outlets: (it.verification?.sources || []).map((s) => ({ name: s.name, url: s.url, primary: !!s.primary })),
    stages: sectorTagsOf(sector, it).stages || [],
    via: sectorTagsOf(sector, it).via?.[sub] || null,
    blurb: it.blurb || '',
  }));
}

export function buildCandidates(items, briefsDoc, { now = new Date(), names = placeNamesFromGeo(), sector = ENERGY } = {}) {
  const { valid } = validateBriefs(briefsDoc || { briefs: {} }, sector, { now });
  const out = { generatedAt: now.toISOString(), sector: sector.id, maxAgeDays: CANDIDATE_MAX_AGE_DAYS, places: {} };
  for (const place of placesWithStories(items, sector)) {
    const key = placeKey(place);
    const bySub = {};
    for (const sub of sector.subs) {
      const list = candidatesFor(items, place, sub.id, { now, sector });
      if (!list.length) continue;
      const b = briefFor(valid, place, sub.id);
      bySub[sub.id] = { brief: b ? (b.stale ? 'stale' : 'ready') : 'missing', candidates: list };
    }
    if (Object.keys(bySub).length) out.places[key] = { label: placeLabel(place, names), level: place.level, sources: bySub };
  }
  return out;
}

export function candidatesMarkdown(cands, key, sub, sector = sectorById(cands.sector) || ENERGY) {
  const p = cands.places[key];
  const s = p?.sources?.[sub];
  const name = sector.subs.find((x) => x.id === sub)?.noun || sub;
  if (!s) return `No ${name} candidates for ${key} in the last ${cands.maxAgeDays} days.`;
  const lines = [
    `# ${name} brief candidates: ${p.label} (${key})`,
    `Generated ${cands.generatedAt}. Brief status: ${s.brief}.`,
    '',
    'Write "The 4 most important things happening in ' + name + ' this week": 4 numbered plain-language paragraphs for a lay reader.',
    'Short sentences. Explain jargon (uprate, conditional loan). Concrete numbers with units and dates. Say what is and is not settled. End with a crisp line.',
    'Verify every number, date and @handle against the primary source (company release, agency, regulator). Handles only if checked live, as text.',
    `Each item: {"text", "sources":[{"title","url","date":"YYYY-MM-DD"}]}. No em dashes or tildes. Write it into data/${sector.id}-briefs.json under briefs["${key}"]["${sub}"], then run --validate.`,
    'Only primary sources or reputable outlets count. No social sign-off.',
    '',
  ];
  s.candidates.forEach((c, i) => {
    lines.push(`${i + 1}. ${c.title}`);
    lines.push(`   ${c.source} · ${String(c.published || '').slice(0, 10)} · ${c.verification}${c.stages.length ? ` · stages: ${c.stages.join(', ')}` : ''}${c.via ? ` · cross-listed from ${c.via.from} (${c.via.stage})` : ''}`);
    lines.push(`   ${c.url}`);
    for (const o of c.outlets.filter((o) => o.url && o.url !== c.url)) lines.push(`   also: ${o.name}${o.primary ? ' (primary)' : ''} ${o.url}`);
  });
  return lines.join('\n');
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
}

function main() {
  const only = arg('--sector');
  if (only && !sectorById(only)) { console.log(`Unknown tab "${only}". Tabs: ${SECTOR_TABS.map((t) => t.id).join(', ')}`); process.exit(1); }
  const tabs = only ? [sectorById(only)] : SECTOR_TABS;
  const docFor = (t) => readJson(briefsPath(t.id), { version: 1, sector: t.id, briefs: {} });
  if (process.argv.includes('--validate')) {
    let errs = 0;
    for (const t of tabs) {
      const { errors, warnings, valid } = validateBriefs(docFor(t), t);
      for (const w of warnings) console.log(`WARN  ${t.id}: ${w}`);
      for (const e of errors) console.log(`ERROR ${t.id}: ${e}`);
      const n = Object.values(valid.briefs).reduce((a, b) => a + Object.keys(b).length, 0);
      console.log(`${t.id}: ${n} brief(s) accepted, ${errors.length} error(s), ${warnings.length} warning(s)`);
      errs += errors.length;
    }
    process.exit(errs ? 1 : 0);
  }
  const live = readJson(LIVE, { items: [] });
  const place = arg('--place');
  const source = arg('--source');
  if (place && source) {
    const t = only ? sectorById(only) : ENERGY;
    console.log(candidatesMarkdown(buildCandidates(live.items || [], docFor(t), { sector: t }), place, source, t));
    return;
  }
  const names = placeNamesFromGeo();
  for (const t of tabs) {
    const cands = buildCandidates(live.items || [], docFor(t), { sector: t, names });
    const out = outPath(t.id);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(cands, null, 1) + '\n');
    const keys = Object.keys(cands.places);
    const missing = keys.reduce((a, k) => a + Object.values(cands.places[k].sources).filter((s) => s.brief !== 'ready').length, 0);
    console.log(`${t.id}: wrote candidates for ${keys.length} places → ${out} (${missing} place/${t.subNoun || 'source'} pairs without a fresh brief)`);
  }
}

const invoked = process.argv[1] ? resolvePath(process.argv[1]) : '';
if (invoked && fileURLToPath(import.meta.url) === invoked) main();
void existsSync;
