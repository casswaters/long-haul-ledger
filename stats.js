/**
 * Long Haul Ledger: official stats pipeline definitions (shared by the
 * GitHub Action fetchers and the site). Real public sources only; every
 * value carries unit, as-of date and source link. Cadence is the source's own.
 */
export const FRED_SERIES = [
  // Prices desk
  { id: 'wti', desk: 'prices', seriesId: 'DCOILWTICO', title: 'Crude oil, WTI spot (Cushing)', unit: '$/bbl', decimals: 2, frequency: 'daily', staleAfterDays: 10, primary: 'EIA' },
  { id: 'brent', desk: 'prices', seriesId: 'DCOILBRENTEU', title: 'Crude oil, Brent spot (Europe)', unit: '$/bbl', decimals: 2, frequency: 'daily', staleAfterDays: 10, primary: 'EIA' },
  { id: 'copper', desk: 'prices', seriesId: 'PCOPPUSDM', title: 'Copper, global price', unit: '$/metric ton', decimals: 0, frequency: 'monthly', staleAfterDays: 120, primary: 'IMF' },
  { id: 'steel-ppi', desk: 'prices', seriesId: 'WPU101704', title: 'PPI: hot-rolled steel bars, plates & structural shapes', unit: 'index 1982=100', decimals: 1, frequency: 'monthly', staleAfterDays: 75, primary: 'BLS', caveat: 'Producer price index, not a spot HRC price.' },
  { id: 'cpi', desk: 'prices', seriesId: 'CPIAUCSL', title: 'CPI, all urban consumers (SA)', unit: 'index 1982-84=100', decimals: 1, frequency: 'monthly', staleAfterDays: 80, primary: 'BLS', yoy: true },
  // Activity desk
  { id: 'indpro', desk: 'activity', seriesId: 'INDPRO', title: 'Industrial production, total', unit: 'index 2017=100', decimals: 1, frequency: 'monthly', staleAfterDays: 80, primary: 'Federal Reserve', yoy: true },
  { id: 'ipman', desk: 'activity', seriesId: 'IPMAN', title: 'Industrial production, manufacturing', unit: 'index 2017=100', decimals: 1, frequency: 'monthly', staleAfterDays: 80, primary: 'Federal Reserve', yoy: true },
  { id: 'manemp', desk: 'activity', seriesId: 'MANEMP', title: 'Manufacturing employment', unit: 'thousand jobs', decimals: 0, frequency: 'monthly', staleAfterDays: 70, primary: 'BLS' },
  { id: 'neworder', desk: 'activity', seriesId: 'NEWORDER', title: 'New orders, core capital goods (nondefense ex aircraft)', unit: '$ million', decimals: 0, frequency: 'monthly', staleAfterDays: 80, primary: 'Census' },
  { id: 'philly', desk: 'activity', seriesId: 'GACDFSA066MSFRBPHI', title: 'Philadelphia Fed manufacturing, current activity', unit: 'diffusion index', decimals: 1, frequency: 'monthly', staleAfterDays: 70, primary: 'Philadelphia Fed', caveat: 'Regional survey; a public stand-in for ISM, which is not free to republish.' },
  { id: 'cass-ship', desk: 'activity', seriesId: 'FRGSHPUSM649NCIS', title: 'Cass Freight Index, shipments', unit: 'index', decimals: 3, frequency: 'monthly', staleAfterDays: 75, primary: 'Cass Information Systems' },
  { id: 'cass-exp', desk: 'activity', seriesId: 'FRGEXPUSM649NCIS', title: 'Cass Freight Index, expenditures', unit: 'index', decimals: 3, frequency: 'monthly', staleAfterDays: 75, primary: 'Cass Information Systems' },
  { id: 'rail', desk: 'activity', seriesId: 'RAILFRTCARLOADSD11', title: 'Rail freight carloads (SA)', unit: 'carloads', decimals: 0, frequency: 'monthly', staleAfterDays: 120, primary: 'BTS' },
  { id: 'truck', desk: 'activity', seriesId: 'TRUCKD11', title: 'Truck tonnage index (SA)', unit: 'index 2015=100', decimals: 1, frequency: 'monthly', staleAfterDays: 120, primary: 'BTS / ATA' },
  // Capital desk
  { id: 'dgs10', desk: 'capital', seriesId: 'DGS10', title: 'US 10-year Treasury yield', unit: '%', decimals: 2, frequency: 'daily', staleAfterDays: 7, primary: 'Federal Reserve (H.15)' },
  { id: 'usd', desk: 'capital', seriesId: 'DTWEXBGS', title: 'US dollar, nominal broad index', unit: 'index Jan 2006=100', decimals: 2, frequency: 'daily', staleAfterDays: 10, primary: 'Federal Reserve (H.10)' },
];

export const WB_INDICATORS = [
  { id: 'gdp', code: 'NY.GDP.MKTP.CD', title: 'GDP', unit: 'current US$', kind: 'money' },
  { id: 'growth', code: 'NY.GDP.MKTP.KD.ZG', title: 'GDP growth', unit: '% y/y', kind: 'pct' },
  { id: 'inflation', code: 'FP.CPI.TOTL.ZG', title: 'Inflation, consumer prices', unit: '% y/y', kind: 'pct' },
  { id: 'trade', code: 'NE.TRD.GNFS.ZS', title: 'Trade', unit: '% of GDP', kind: 'pct' },
  { id: 'mfg', code: 'NV.IND.MANF.ZS', title: 'Manufacturing value added', unit: '% of GDP', kind: 'pct' },
];

export const fredCsv = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(id)}`;
export const fredPage = (id) => `https://fred.stlouisfed.org/series/${encodeURIComponent(id)}`;
export const wbPage = (code, iso2) => `https://data.worldbank.org/indicator/${code}?locations=${String(iso2).toUpperCase()}`;

/** Parse FRED graph CSV → [{date, value}] (skips '.' / blanks). */
export function parseCsv(text) {
  const out = [];
  for (const line of String(text || '').trim().split(/\r?\n/).slice(1)) {
    const [date, v] = line.split(',');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) continue;
    const n = Number(v);
    if (v === '.' || v === '' || !Number.isFinite(n)) continue;
    out.push({ date, value: n });
  }
  return out;
}

/** Spark points sized to cadence: ~1y daily (weekly-sampled), 2y monthly. */
export function sparkPoints(rows, frequency) {
  if (frequency === 'daily') {
    const last = rows.slice(-260);
    return last.filter((_, i) => i % 5 === 0 || i === last.length - 1).map((r) => [r.date, r.value]);
  }
  if (frequency === 'weekly') return rows.slice(-52).map((r) => [r.date, r.value]);
  return rows.slice(-24).map((r) => [r.date, r.value]);
}

/** Year-over-year % from the same month a year earlier (monthly only). */
export function yoyPct(rows) {
  if (rows.length < 2) return null;
  const cur = rows[rows.length - 1];
  const target = `${Number(cur.date.slice(0, 4)) - 1}${cur.date.slice(4)}`;
  const base = rows.find((r) => r.date === target);
  if (!base || !base.value) return null;
  return Math.round(((cur.value / base.value) - 1) * 1000) / 10;
}

/** Build a series record from parsed rows (pure). */
export function buildRecord(def, rows, nowIso) {
  const cur = rows[rows.length - 1];
  const prior = rows.length > 1 ? rows[rows.length - 2] : null;
  const rec = {
    id: def.id, desk: def.desk, title: def.title, seriesId: def.seriesId, unit: def.unit,
    decimals: def.decimals, frequency: def.frequency, staleAfterDays: def.staleAfterDays,
    value: cur.value, asOf: cur.date, prior: prior ? { value: prior.value, asOf: prior.date } : null,
    sourceUrl: fredPage(def.seriesId), sourceName: `${def.primary} via FRED (${def.seriesId})`,
    caveat: def.caveat || null, retrievedAt: nowIso, spark: sparkPoints(rows, def.frequency),
  };
  if (def.yoy) rec.yoy = yoyPct(rows);
  return rec;
}

export function validateStat(r) {
  const p = [];
  if (!r || typeof r !== 'object') return ['not an object'];
  if (!Number.isFinite(r.value)) p.push('value');
  if (!r.unit) p.push('unit');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.asOf || '')) p.push('asOf');
  if (!/^https:\/\//.test(r.sourceUrl || '')) p.push('sourceUrl');
  if (!r.frequency) p.push('frequency');
  return p;
}

/** Merge fresh fetch results into the previous file; failures keep last good. */
export function mergeSeries(prev, results, nowIso) {
  const byId = new Map((prev?.series || []).map((s) => [s.id, s]));
  const log = [];
  for (const res of results) {
    if (res.record && validateStat(res.record).length === 0) {
      byId.set(res.id, res.record);
    } else {
      const old = byId.get(res.id);
      log.push({ id: res.id, seriesId: res.seriesId, error: res.error || `invalid: ${validateStat(res.record).join(',')}`, at: nowIso, keptLastGood: !!old });
      if (old) byId.set(res.id, { ...old, lastError: res.error || 'invalid', lastErrorAt: nowIso });
    }
  }
  const order = FRED_SERIES.map((d) => d.id);
  const series = [...byId.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return { generatedAt: nowIso, note: 'Official public series via FRED graph CSV (no key). Values as published on the as-of date; may be revised.', series, fetchLog: log };
}

export function isStale(r, now = new Date()) {
  const age = (now.getTime() - Date.parse(`${r.asOf}T00:00:00Z`)) / 86400000;
  return age > (r.staleAfterDays || 60);
}

/** Small inline SVG sparkline (no deps). */
export function sparkSvg(points, { w = 96, h = 24 } = {}) {
  if (!points || points.length < 2) return '';
  const vals = points.map((p) => p[1]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${((i / (points.length - 1)) * (w - 2) + 1).toFixed(1)},${(h - 1 - ((p[1] - min) / span) * (h - 2)).toFixed(1)}`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
}

export function fmtNum(v, decimals = 1) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtMoney(v) {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
}
