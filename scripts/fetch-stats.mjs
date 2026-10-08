#!/usr/bin/env node
/**
 * Long Haul Ledger stats pipeline ($0, no keys). Usage:
 *   node scripts/fetch-stats.mjs fred        → data/stats/us.json
 *   node scripts/fetch-stats.mjs worldbank   → data/stats/world.json
 *   node scripts/fetch-stats.mjs pinksheet   → data/stats/benchmarks.json (World Bank Pink Sheet: gold, silver, copper)
 * A failed series keeps its last good value (flagged lastError) and is logged.
 * Files are rewritten only when a value / as-of changes.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { inflateRawSync } from 'zlib';
import { FRED_SERIES, DXY_LEGS, dxyRows, WB_INDICATORS, SECTOR_INDICATORS, compactWb, OWID_ENERGY_CSV, OWID_MIX_PAGE, MIX_SOURCES, owidMix, PINK_SERIES, PINK_SHEET_PAGE, fredCsv, parseCsv, buildRecord, mergeSeries, wbPage, validateStat } from '../stats.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', 'data', 'stats');
const UA = 'LongHaulLedgerBot/0.3 (+https://casswaters.github.io/long-haul-ledger/; public statistics)';

async function get(url, accept = '*/*', tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) { last = e; await new Promise((r) => setTimeout(r, 1500 * (i + 1))); } finally { clearTimeout(t); }
  }
  throw last;
}

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const stripVolatile = (o) => JSON.stringify(o, (k, v) => (['generatedAt', 'retrievedAt', 'at', 'lastErrorAt'].includes(k) ? undefined : v));

export async function runFred({ fetchText = get, now = new Date() } = {}) {
  const nowIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const results = [];
  for (const def of FRED_SERIES) {
    try {
      let rows;
      if (def.composite === 'dxy') {
        const legs = {};
        for (const leg of DXY_LEGS) legs[leg.seriesId] = parseCsv(await fetchText(fredCsv(leg.seriesId), 'text/csv'));
        rows = dxyRows(legs);
      } else rows = parseCsv(await fetchText(fredCsv(def.seriesId), 'text/csv'));
      if (!rows.length) throw new Error('no observations parsed');
      const last = rows[rows.length - 1];
      if (Date.parse(`${last.date}T00:00:00Z`) > now.getTime() + 86400000) throw new Error(`future date ${last.date}`);
      results.push({ id: def.id, seriesId: def.seriesId, record: buildRecord(def, rows, nowIso) });
    } catch (e) {
      results.push({ id: def.id, seriesId: def.seriesId, error: String(e?.message || e) });
    }
  }
  return results;
}

export async function runWorldBank({ fetchText = get, now = new Date(), prev = null, indicators = WB_INDICATORS, note = null } = {}) {
  const nowIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const countries = JSON.parse(JSON.stringify(prev?.countries || {}));
  const world = JSON.parse(JSON.stringify(prev?.world || {}));
  const log = [];
  const meta = {};
  for (const ind of indicators) {
    try {
      // Two most recent non-empty years per economy: the latest value and the prior reading it changed from.
      const body = JSON.parse(await fetchText(`https://api.worldbank.org/v2/country/all/indicator/${ind.code}?format=json&mrnev=2&per_page=1200`, 'application/json'));
      const rows = Array.isArray(body?.[1]) ? body[1] : [];
      if (!rows.length) throw new Error('no rows');
      meta[ind.id] = { ...ind, lastUpdated: body[0]?.lastupdated || null };
      const byEconomy = new Map();
      for (const r of rows) {
        if (!Number.isFinite(r?.value)) continue;
        const iso3 = r.countryiso3code;
        const iso2 = iso3 === 'WLD' ? 'world' : String(r?.country?.id || '').toLowerCase();
        if (iso2 !== 'world' && !/^[a-z]{2}$/.test(iso2)) continue;
        if (!byEconomy.has(iso2)) byEconomy.set(iso2, { name: r.country.value, rows: [] });
        byEconomy.get(iso2).rows.push({ value: r.value, year: String(r.date) });
      }
      for (const [iso2, e] of byEconomy) {
        const [cur, prior] = e.rows.sort((a, b) => b.year.localeCompare(a.year));
        const rec = { value: cur.value, year: cur.year, sourceUrl: ind.page || wbPage(ind.code, iso2 === 'world' ? '1W' : iso2) };
        if (prior) rec.prior = { value: prior.value, year: prior.year };
        if (iso2 === 'world') { world.name = 'World'; world[ind.id] = rec; continue; }
        countries[iso2] = countries[iso2] || { name: e.name };
        countries[iso2][ind.id] = rec;
      }
    } catch (e) {
      meta[ind.id] = prev?.indicators?.[ind.id] || { ...ind };
      log.push({ indicator: ind.code, error: String(e?.message || e), at: nowIso, keptLastGood: true });
    }
  }
  return { generatedAt: nowIso, note: note || 'World Bank World Development Indicators (API, no key). Latest and prior non-empty year per economy; annual data.', source: 'https://data.worldbank.org/', indicators: meta, world, countries, fetchLog: log };
}

/* ---------- Taiwan (World Bank does not publish it): IMF DataMapper, no key ---------- */
export const IMF_TAIWAN = [
  { id: 'gdp', code: 'NGDPD', title: 'GDP', label: 'GDP', unit: 'current US$', kind: 'money', desk: 'activity' },
  { id: 'growth', code: 'NGDP_RPCH', title: 'Real GDP growth', label: 'GDP growth', unit: '% y/y', kind: 'pct', desk: 'activity' },
  { id: 'inflation', code: 'PCPIPCH', title: 'Inflation, average consumer prices', label: 'Consumer price inflation', unit: '% y/y', kind: 'pct', desk: 'prices' },
];
export async function runImfTaiwan({ fetchText = get, now = new Date(), prev = null } = {}) {
  const nowIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const countries = JSON.parse(JSON.stringify(prev?.countries || {}));
  const log = [];
  const year = String(now.getUTCFullYear());
  const rec = { name: 'Taiwan' };
  for (const ind of IMF_TAIWAN) {
    try {
      const d = JSON.parse(await fetchText(`https://www.imf.org/external/datamapper/api/v1/${ind.code}/TWN`, 'application/json'));
      const v = d?.values?.[ind.code]?.TWN || {};
      const yrs = Object.keys(v).filter((y) => Number.isFinite(v[y]) && y < year).sort(); // completed years only, never projections
      const cur = yrs.at(-1); const prior = yrs.at(-2);
      if (!cur) throw new Error('no year');
      const row = { value: ind.id === 'gdp' ? v[cur] * 1e9 : v[cur], year: cur, sourceUrl: `https://www.imf.org/external/datamapper/${ind.code}@WEO/TWN`, source: 'IMF', dataset: 'World Economic Outlook (DataMapper)', code: ind.code };
      if (prior) row.prior = { value: ind.id === 'gdp' ? v[prior] * 1e9 : v[prior], year: prior };
      rec[ind.id] = row;
    } catch (e) { log.push({ indicator: ind.code, error: String(e?.message || e), at: nowIso }); }
  }
  if (Object.keys(rec).length > 1) countries.tw = rec;
  return { ...prev, generatedAt: nowIso, countries, fetchLog: [...(prev?.fetchLog || []), ...log] };
}

/* ---------- Energy mix (Our World in Data energy dataset, CSV, no key) ---------- */
export async function runEnergyMix({ fetchText = get, now = new Date() } = {}) {
  const nowIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const csv = await fetchText(OWID_ENERGY_CSV, 'text/csv');
  const byIso3 = owidMix(csv, { minYear: now.getUTCFullYear() - 10 });
  // ISO3 -> ISO2 from the World Bank country list; OWID codes for Kosovo, Taiwan and the World handled here.
  const wb = JSON.parse(await fetchText('https://api.worldbank.org/v2/country?format=json&per_page=400', 'application/json'));
  const map = { OWID_KOS: 'xk', TWN: 'tw', OWID_WRL: 'world', ESH: 'eh', FLK: 'fk', GRL: 'gl', NCL: 'nc', PRI: 'pr', PSE: 'ps' };
  for (const c of wb?.[1] || []) if (/^[A-Z]{2}$/.test(c.iso2Code) && c.region?.value !== 'Aggregates') map[c.id] = map[c.id] || c.iso2Code.toLowerCase();
  const countries = {}; let world = null;
  for (const [iso3, rec] of Object.entries(byIso3)) {
    const id = map[iso3];
    if (!id) continue;
    if (id === 'world') world = rec; else countries[id] = rec;
  }
  return { generatedAt: nowIso, note: 'Electricity generation mix, share of generation by source, latest full year. Our World in Data energy dataset (CC BY 4.0), based on Ember and the Energy Institute Statistical Review of World Energy.', source: OWID_MIX_PAGE, dataFile: OWID_ENERGY_CSV, sources: MIX_SOURCES.map(({ id, label }) => ({ id, label })), world, countries };
}

/* ---------- World Bank Pink Sheet (xlsx, read with a small built-in unzip; no dependencies) ---------- */

/** Read one file out of a zip buffer (stored or deflated entries). */
export function unzipEntry(buf, name) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip directory');
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const fname = buf.toString('utf8', p + 46, p + 46 + nlen);
    if (fname === name) {
      const lnlen = buf.readUInt16LE(local + 26), lxlen = buf.readUInt16LE(local + 28);
      const data = buf.subarray(local + 30 + lnlen + lxlen, local + 30 + lnlen + lxlen + csize);
      return (method === 0 ? data : inflateRawSync(data)).toString('utf8');
    }
    p += 46 + nlen + xlen + clen;
  }
  return null;
}

const xmlText = (s) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const colIndex = (ref) => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

/** Rows (arrays of cell text) of a named sheet in an xlsx buffer. */
export function xlsxSheetRows(buf, sheetName) {
  const shared = [];
  const ss = unzipEntry(buf, 'xl/sharedStrings.xml');
  if (ss) for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(xmlText(m[1]));
  const wb = unzipEntry(buf, 'xl/workbook.xml') || '';
  const rels = unzipEntry(buf, 'xl/_rels/workbook.xml.rels') || '';
  const sheet = [...wb.matchAll(/<sheet\b[^>]*>/g)].map((m) => m[0]).find((t) => new RegExp(`name="${sheetName}"`).test(t));
  if (!sheet) throw new Error(`sheet ${sheetName} not found`);
  const rid = (sheet.match(/r:id="([^"]+)"/) || [])[1];
  const rel = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((t) => t.includes(`Id="${rid}"`));
  const target = (rel.match(/Target="([^"]+)"/) || [])[1].replace(/^\/?(xl\/)?/, '');
  const xml = unzipEntry(buf, `xl/${target}`);
  const rows = [];
  for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
      const t = (attrs.match(/t="([^"]+)"/) || [])[1];
      const inner = cm[2] || '';
      let v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      if (t === 's' && v != null) v = shared[Number(v)];
      else if (t === 'inlineStr') v = xmlText((inner.match(/<is>([\s\S]*?)<\/is>/) || [])[1] || '');
      else if (v != null) v = xmlText(v);
      if (ref) row[colIndex(ref)] = v ?? null;
    }
    rows.push(row);
  }
  return rows;
}

/** Monthly observations for each Pink Sheet series from the "Monthly Prices" rows (pure). */
export function pinkObservations(rows, series = PINK_SERIES) {
  const hi = rows.findIndex((r) => r && r.some((c) => typeof c === 'string' && /^Crude oil, Brent/.test(c)));
  if (hi < 0) throw new Error('header row not found');
  const header = rows[hi], units = rows[hi + 1] || [];
  const updated = (rows.slice(0, hi).flat().find((c) => typeof c === 'string' && /^Updated on /.test(c)) || '').replace(/^Updated on /, '');
  const out = {};
  for (const def of series) {
    const col = header.findIndex((c) => typeof c === 'string' && c.trim() === def.column);
    if (col < 0) { out[def.id] = { error: `column ${def.column} not found` }; continue; }
    const obs = [];
    for (const r of rows.slice(hi + 2)) {
      const m = /^(\d{4})M(\d{2})$/.exec(String(r?.[0] || ''));
      const v = Number(r?.[col]);
      if (!m || r?.[col] == null || r[col] === '' || !Number.isFinite(v)) continue;
      obs.push({ date: `${m[1]}-${m[2]}-01`, value: v });
    }
    out[def.id] = { unitText: units[col] || '', rows: obs };
  }
  return { updated, series: out };
}

export async function runPinkSheet({ fetchText = get, fetchBuf = getBuf, now = new Date(), prev = null } = {}) {
  const nowIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const page = await fetchText(PINK_SHEET_PAGE, 'text/html');
  const url = (page.match(/https:\/\/thedocs\.worldbank\.org\/[^"'\s]*CMO-Historical-Data-Monthly\.xlsx/) || [])[0];
  if (!url) throw new Error('Pink Sheet monthly xlsx link not found on the commodity markets page');
  const { updated, series } = pinkObservations(xlsxSheetRows(await fetchBuf(url), 'Monthly Prices'));
  const byId = new Map((prev?.series || []).map((s) => [s.id, s]));
  const log = [];
  for (const def of PINK_SERIES) {
    const got = series[def.id];
    if (!got || got.error || got.rows.length < 2) { log.push({ id: def.id, error: got?.error || 'no rows', at: nowIso, keptLastGood: byId.has(def.id) }); continue; }
    const cur = got.rows[got.rows.length - 1], prior = got.rows[got.rows.length - 2];
    const rec = {
      id: def.id, desk: def.desk, title: def.title, label: def.label, places: def.places, unit: def.unit, decimals: def.decimals,
      frequency: def.frequency, staleAfterDays: def.staleAfterDays, value: cur.value, asOf: cur.date,
      prior: { value: prior.value, asOf: prior.date }, sourceUrl: PINK_SHEET_PAGE, dataUrl: url,
      sourceName: 'World Bank Pink Sheet (monthly average)', caveat: `Monthly average price${updated ? `; sheet updated ${updated}` : ''}.`,
      retrievedAt: nowIso, spark: got.rows.slice(-24).map((r) => [r.date, r.value]),
    };
    if (validateStat(rec).length === 0) byId.set(def.id, rec);
  }
  const order = PINK_SERIES.map((d) => d.id);
  return { generatedAt: nowIso, note: 'World Bank Commodity Price Data (the Pink Sheet), monthly averages in nominal US dollars. Free, no key.', source: PINK_SHEET_PAGE, updated, series: [...byId.values()].filter((s) => order.includes(s.id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)), fetchLog: log };
}

async function getBuf(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) { last = e; await new Promise((r) => setTimeout(r, 1500 * (i + 1))); } finally { clearTimeout(t); }
  }
  throw last;
}

const invoked = process.argv[1] ? resolvePath(process.argv[1]) : '';
if (invoked && fileURLToPath(import.meta.url) === invoked) {
  mkdirSync(OUT, { recursive: true });
  const mode = process.argv[2] || 'fred';
  if (mode === 'fred') {
    const p = join(OUT, 'us.json'); const prev = readJson(p);
    const results = await runFred();
    const next = mergeSeries(prev, results, new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
    for (const l of next.fetchLog) console.warn(`WARN ${l.seriesId}: ${l.error} (kept last good: ${l.keptLastGood})`);
    if (!next.series.length) { console.error('no series at all; not writing'); process.exit(1); }
    if (!prev || stripVolatile(prev) !== stripVolatile(next) || next.fetchLog.length) { writeFileSync(p, JSON.stringify(next) + '\n'); console.log(`us.json: ${next.series.map((s) => `${s.seriesId} ${s.value} @${s.asOf}`).join(' · ')}`); }
    else console.log('us.json unchanged');
  } else if (mode === 'worldbank') {
    const p = join(OUT, 'world.json'); const prev = readJson(p);
    const next = await runWorldBank({ prev });
    for (const l of next.fetchLog) console.warn(`WARN ${l.indicator}: ${l.error} (kept last good)`);
    // Official national statistics for economies the World Bank skips (Taiwan, Falklands): hand-checked file, carried every run.
    const nat = readJson(join(OUT, 'sectors-national.json'));
    if (nat?.countries) next.national = nat.countries;
    if (!Object.keys(next.countries).length) { console.error('no countries; not writing'); process.exit(1); }
    if (!prev || stripVolatile(prev) !== stripVolatile(next)) { writeFileSync(p, JSON.stringify(next) + '\n'); console.log(`world.json: ${Object.keys(next.countries).length} countries`); }
    else console.log('world.json unchanged');
  } else if (mode === 'imf') {
    const p = join(OUT, 'world.json'); const prev = readJson(p);
    const next = await runImfTaiwan({ prev });
    for (const l of next.fetchLog) console.warn(`WARN IMF ${l.indicator}: ${l.error}`);
    if (stripVolatile(prev) !== stripVolatile(next)) { writeFileSync(p, JSON.stringify(next) + '\n'); console.log('world.json: Taiwan from IMF DataMapper'); }
    else console.log('world.json unchanged');
  } else if (mode === 'sectors') {
    const p = join(OUT, 'sectors.json'); const prev = readJson(p);
    const full = await runWorldBank({ prev: null, indicators: SECTOR_INDICATORS, note: 'World Bank World Development Indicators (API, no key): sector shares for the Sectors of the Economy tabs. Latest and prior non-empty year per economy; annual data. Rows: [value, year, prior value, prior year].' });
    const pack = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === 'name' ? v : compactWb(v)]).filter(([, v]) => v != null));
    const failed = new Set(full.fetchLog.map((l) => l.indicator));
    const next = { ...full, indicators: Object.fromEntries(SECTOR_INDICATORS.map((d) => [d.id, { ...d, lastUpdated: full.indicators[d.id]?.lastUpdated || null }])), world: pack(full.world), countries: Object.fromEntries(Object.entries(full.countries).map(([k, v]) => [k, pack(v)])) };
    // A failed indicator keeps last good values from the previous file.
    if (prev && failed.size) for (const d of SECTOR_INDICATORS) if (failed.has(d.code)) { for (const [k, v] of Object.entries(prev.countries || {})) if (v[d.id]) (next.countries[k] = next.countries[k] || { name: v.name })[d.id] = v[d.id]; if (prev.world?.[d.id]) next.world[d.id] = prev.world[d.id]; }
    for (const l of next.fetchLog) console.warn(`WARN ${l.indicator}: ${l.error} (kept last good)`);
    // Official national statistics for economies the World Bank skips (Taiwan, Falklands): hand-checked file, carried every run.
    const nat = readJson(join(OUT, 'sectors-national.json'));
    if (nat?.countries) next.national = nat.countries;
    if (!Object.keys(next.countries).length) { console.error('no countries; not writing'); process.exit(1); }
    if (!prev || stripVolatile(prev) !== stripVolatile(next)) { writeFileSync(p, JSON.stringify(next) + '\n'); console.log(`sectors.json: ${Object.keys(next.countries).length} economies`); }
    else console.log('sectors.json unchanged');
  } else if (mode === 'energymix') {
    const p = join(OUT, 'energy-mix.json'); const prev = readJson(p);
    const next = await runEnergyMix();
    if (Object.keys(next.countries).length < 100) { console.error('too few countries in energy mix; not writing'); process.exit(1); }
    if (!prev || stripVolatile(prev) !== stripVolatile(next)) { writeFileSync(p, JSON.stringify(next) + '\n'); console.log(`energy-mix.json: ${Object.keys(next.countries).length} countries`); }
    else console.log('energy-mix.json unchanged');
  } else if (mode === 'pinksheet') {
    const p = join(OUT, 'benchmarks.json'); const prev = readJson(p);
    const next = await runPinkSheet({ prev });
    for (const l of next.fetchLog) console.warn(`WARN ${l.id}: ${l.error} (kept last good: ${l.keptLastGood})`);
    if (!next.series.length) { console.error('no Pink Sheet series; not writing'); process.exit(1); }
    if (!prev || stripVolatile(prev) !== stripVolatile(next)) { writeFileSync(p, JSON.stringify(next) + '\n'); console.log(`benchmarks.json: ${next.series.map((s) => `${s.id} ${s.value} @${s.asOf}`).join(' · ')}`); }
    else console.log('benchmarks.json unchanged');
  }
}
