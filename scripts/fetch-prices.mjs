#!/usr/bin/env node
/**
 * Long Haul Ledger: Prices desk fetcher ($0, no API key).
 * Pulls public EIA series mirrored on FRED (graph CSV, no key) into
 * data/desks/prices.json. Append-only history; the file is rewritten only
 * when a value or as-of date changes, so scheduled runs don't churn commits.
 * A failed fetch keeps the last good line (with its as-of date) and logs it.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { PRICE_SERIES, parseFredCsv, applyObservation, validateRecord, fredCsvUrl } from '../desks.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dir, '..', 'data', 'desks', 'prices.json');
const UA = 'LongHaulLedgerBot/0.2 (+https://casswaters.github.io/long-haul-ledger/; public series CSV)';

async function defaultFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/csv,*/*' }, signal: ctrl.signal });
    return { ok: res.ok, status: res.status, body: await res.text() };
  } finally {
    clearTimeout(t);
  }
}

export function emptyDesk() {
  return {
    desk: 'prices',
    note: 'Public sample: current lines from public series. Values as published by the source on the as-of date; may be revised.',
    updatedAt: null,
    records: [],
    fetchLog: [],
  };
}

export async function updatePrices(desk, { fetchImpl = defaultFetch, now = new Date() } = {}) {
  const nowIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const out = { ...desk, records: [...(desk.records || [])] };
  let changed = false;
  const failures = [];
  for (const s of PRICE_SERIES) {
    const idx = out.records.findIndex((r) => r.id === s.id);
    const prev = idx >= 0 ? out.records[idx] : null;
    try {
      const res = await fetchImpl(fredCsvUrl(s.seriesId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = parseFredCsv(res.body);
      if (!rows.length) throw new Error('no observations parsed');
      const obs = rows[rows.length - 1];
      const prior = rows.length > 1 ? rows[rows.length - 2] : null;
      if (!(obs.value > 0)) throw new Error(`implausible value ${obs.value}`);
      if (Date.parse(`${obs.date}T00:00:00Z`) > now.getTime() + 86400000) throw new Error(`future date ${obs.date}`);
      const { record, changed: c } = applyObservation(prev, s, obs, prior, nowIso);
      const problems = validateRecord(record);
      if (problems.length) throw new Error(`invalid record: ${problems.join('; ')}`);
      if (c) {
        changed = true;
        if (idx >= 0) out.records[idx] = record; else out.records.push(record);
      }
    } catch (err) {
      failures.push({ id: s.id, seriesId: s.seriesId, error: String(err?.message || err) });
    }
  }
  if (changed) {
    out.updatedAt = nowIso;
    out.fetchLog = failures;
  }
  return { desk: out, changed, failures };
}

const invoked = process.argv[1] ? resolvePath(process.argv[1]) : '';
if (invoked && fileURLToPath(import.meta.url) === invoked) {
  const desk = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, 'utf8')) : emptyDesk();
  const { desk: next, changed, failures } = await updatePrices(desk);
  for (const f of failures) console.warn(`WARN ${f.seriesId}: ${f.error} (kept last good line)`);
  if (changed) {
    mkdirSync(dirname(OUT_PATH), { recursive: true });
    writeFileSync(OUT_PATH, JSON.stringify(next, null, 2) + '\n');
    console.log(`prices.json updated: ${next.records.map((r) => `${r.seriesId} ${r.current.value} ${r.current.unit} as of ${r.current.asOf}`).join(' · ')}`);
  } else {
    console.log('prices.json unchanged');
  }
}
