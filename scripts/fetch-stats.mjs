#!/usr/bin/env node
/**
 * Long Haul Ledger stats pipeline ($0, no keys). Usage:
 *   node scripts/fetch-stats.mjs fred        → data/stats/us.json
 *   node scripts/fetch-stats.mjs worldbank   → data/stats/world.json
 * A failed series keeps its last good value (flagged lastError) and is logged.
 * Files are rewritten only when a value / as-of changes.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { FRED_SERIES, WB_INDICATORS, fredCsv, parseCsv, buildRecord, mergeSeries, wbPage } from '../stats.js';

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
      const rows = parseCsv(await fetchText(fredCsv(def.seriesId), 'text/csv'));
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

export async function runWorldBank({ fetchText = get, now = new Date(), prev = null } = {}) {
  const nowIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const countries = JSON.parse(JSON.stringify(prev?.countries || {}));
  const log = [];
  const meta = {};
  for (const ind of WB_INDICATORS) {
    try {
      const body = JSON.parse(await fetchText(`https://api.worldbank.org/v2/country/all/indicator/${ind.code}?format=json&mrnev=1&per_page=400`, 'application/json'));
      const rows = Array.isArray(body?.[1]) ? body[1] : [];
      if (!rows.length) throw new Error('no rows');
      meta[ind.id] = { ...ind, lastUpdated: body[0]?.lastupdated || null };
      for (const r of rows) {
        const iso2 = String(r?.country?.id || '').toLowerCase();
        if (!/^[a-z]{2}$/.test(iso2) || !Number.isFinite(r.value)) continue;
        countries[iso2] = countries[iso2] || { name: r.country.value };
        countries[iso2][ind.id] = { value: r.value, year: r.date, sourceUrl: wbPage(ind.code, iso2) };
      }
    } catch (e) {
      meta[ind.id] = prev?.indicators?.[ind.id] || { ...ind };
      log.push({ indicator: ind.code, error: String(e?.message || e), at: nowIso, keptLastGood: true });
    }
  }
  return { generatedAt: nowIso, note: 'World Bank World Development Indicators (API, no key). Most recent non-empty year per country; annual data.', source: 'https://data.worldbank.org/', indicators: meta, countries, fetchLog: log };
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
    if (!Object.keys(next.countries).length) { console.error('no countries; not writing'); process.exit(1); }
    if (!prev || stripVolatile(prev) !== stripVolatile(next)) { writeFileSync(p, JSON.stringify(next) + '\n'); console.log(`world.json: ${Object.keys(next.countries).length} countries`); }
    else console.log('world.json unchanged');
  }
}
