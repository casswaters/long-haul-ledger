/**
 * Long Haul Ledger: official stats pipeline definitions (shared by the
 * GitHub Action fetchers and the site). Real public sources only; every
 * value carries unit, as-of date and source link. Cadence is the source's own.
 */
export const FRED_SERIES = [
  // Prices: globally watched benchmarks (World), plus the US lines that are also benchmarks.
  { id: 'bitcoin', desk: 'prices', seriesId: 'CBBTCUSD', title: 'Bitcoin (Coinbase, US dollars)', label: 'Bitcoin', unit: '$', decimals: 0, frequency: 'daily', staleAfterDays: 7, primary: 'Coinbase', places: ['world'] },
  { id: 'wti', desk: 'prices', seriesId: 'DCOILWTICO', title: 'Crude oil, WTI spot (Cushing)', label: 'WTI crude oil', unit: '$/bbl', decimals: 2, frequency: 'daily', staleAfterDays: 10, primary: 'EIA', places: ['world', 'us'] },
  { id: 'brent', desk: 'prices', seriesId: 'DCOILBRENTEU', title: 'Crude oil, Brent spot (Europe)', label: 'Brent crude oil', unit: '$/bbl', decimals: 2, frequency: 'daily', staleAfterDays: 10, primary: 'EIA', places: ['world'] },
  { id: 'natgas', desk: 'prices', seriesId: 'DHHNGSP', title: 'Natural gas, Henry Hub spot', label: 'Natural gas (Henry Hub)', unit: '$/MMBtu', decimals: 2, frequency: 'daily', staleAfterDays: 10, primary: 'EIA', places: ['world', 'us'] },
  { id: 'usd', desk: 'prices', seriesId: 'DXY-H10', composite: 'dxy', title: 'Dollar index rebuilt from the DXY formula (Federal Reserve H.10 rates)', label: 'Dollar index (DXY formula)', unit: 'index', decimals: 2, frequency: 'daily', staleAfterDays: 10, primary: 'Federal Reserve (H.10)', places: ['world', 'us'], caveat: 'Rebuilt daily from Federal Reserve H.10 exchange rates using the published DXY weights; not the official ICE DXY.' },
  { id: 'cpi', desk: 'prices', seriesId: 'CPIAUCSL', title: 'CPI, all urban consumers (SA)', label: 'US CPI inflation', unit: 'index 1982-84=100', decimals: 1, frequency: 'monthly', staleAfterDays: 80, primary: 'BLS', yoy: true, showYoy: true, places: ['world', 'us'] },
  // Activity (United States)
  { id: 'indpro', desk: 'activity', seriesId: 'INDPRO', title: 'Industrial production, total', label: 'Industrial production', unit: 'index 2017=100', decimals: 1, frequency: 'monthly', staleAfterDays: 80, primary: 'Federal Reserve', yoy: true, places: ['us'] },
  { id: 'ipman', desk: 'activity', seriesId: 'IPMAN', title: 'Industrial production, manufacturing', label: 'Manufacturing output', unit: 'index 2017=100', decimals: 1, frequency: 'monthly', staleAfterDays: 80, primary: 'Federal Reserve', yoy: true, places: ['us'] },
  { id: 'manemp', desk: 'activity', seriesId: 'MANEMP', title: 'Manufacturing employment', label: 'Manufacturing jobs', unit: 'thousand jobs', decimals: 0, frequency: 'monthly', staleAfterDays: 70, primary: 'BLS', places: ['us'] },
  { id: 'neworder', desk: 'activity', seriesId: 'NEWORDER', title: 'New orders, core capital goods (nondefense ex aircraft)', label: 'Core capital goods orders', unit: '$ million', decimals: 0, frequency: 'monthly', staleAfterDays: 80, primary: 'Census', places: ['us'] },
  { id: 'philly', desk: 'activity', seriesId: 'GACDFSA066MSFRBPHI', title: 'Philadelphia Fed manufacturing, current activity', label: 'Philadelphia Fed factory survey', unit: 'diffusion index', decimals: 1, frequency: 'monthly', staleAfterDays: 70, primary: 'Philadelphia Fed', caveat: 'Regional survey; a public stand-in for ISM, which is not free to republish.', places: ['us'] },
  { id: 'cass-ship', desk: 'activity', seriesId: 'FRGSHPUSM649NCIS', title: 'Cass Freight Index, shipments', label: 'Freight shipments (Cass)', unit: 'index', decimals: 3, frequency: 'monthly', staleAfterDays: 75, primary: 'Cass Information Systems', places: ['us'] },
  { id: 'cass-exp', desk: 'activity', seriesId: 'FRGEXPUSM649NCIS', title: 'Cass Freight Index, expenditures', label: 'Freight spending (Cass)', unit: 'index', decimals: 3, frequency: 'monthly', staleAfterDays: 75, primary: 'Cass Information Systems', places: ['us'] },
  { id: 'rail', desk: 'activity', seriesId: 'RAILFRTCARLOADSD11', title: 'Rail freight carloads (SA)', label: 'Rail carloads', unit: 'carloads', decimals: 0, frequency: 'monthly', staleAfterDays: 120, primary: 'BTS', places: ['us'] },
  { id: 'truck', desk: 'activity', seriesId: 'TRUCKD11', title: 'Truck tonnage index (SA)', label: 'Truck tonnage', unit: 'index 2015=100', decimals: 1, frequency: 'monthly', staleAfterDays: 120, primary: 'BTS / ATA', places: ['us'] },
  // Capital (United States)
  { id: 'dgs10', desk: 'capital', seriesId: 'DGS10', title: 'US 10-year Treasury yield', label: '10-year Treasury yield', unit: '%', decimals: 2, frequency: 'daily', staleAfterDays: 7, primary: 'Federal Reserve (H.15)', places: ['us'] },
  { id: 'fedfunds', desk: 'capital', seriesId: 'DFF', title: 'Federal funds effective rate', label: 'Fed funds rate', unit: '%', decimals: 2, frequency: 'daily', staleAfterDays: 7, primary: 'Federal Reserve (H.15)', places: ['us'] },
];

/**
 * World Bank Commodity Price Data (the Pink Sheet), monthly averages in nominal US dollars.
 * Free, no key. Used for metals FRED does not carry (gold, silver) and for copper (fresher than IMF via FRED).
 * `column` is the header text in the "Monthly Prices" sheet.
 */
export const PINK_SHEET_PAGE = 'https://www.worldbank.org/en/research/commodity-markets';
export const PINK_SERIES = [
  { id: 'gold', desk: 'prices', column: 'Gold', title: 'Gold, monthly average (World Bank Pink Sheet)', label: 'Gold', unit: '$/troy oz', decimals: 0, frequency: 'monthly', staleAfterDays: 75, places: ['world'] },
  { id: 'silver', desk: 'prices', column: 'Silver', title: 'Silver, monthly average (World Bank Pink Sheet)', label: 'Silver', unit: '$/troy oz', decimals: 2, frequency: 'monthly', staleAfterDays: 75, places: ['world'] },
  { id: 'copper', desk: 'prices', column: 'Copper', title: 'Copper, monthly average (World Bank Pink Sheet)', label: 'Copper', unit: '$/metric ton', decimals: 0, frequency: 'monthly', staleAfterDays: 75, places: ['world'] },
];

/** Order of the Prices group on screen: gold, silver, bitcoin, WTI, Brent first, then copper, gas, dollar, CPI. */
export const PRICES_ORDER = ['gold', 'silver', 'bitcoin', 'wti', 'brent', 'copper', 'natgas', 'usd', 'cpi'];

export const WB_INDICATORS = [
  { id: 'gdp', code: 'NY.GDP.MKTP.CD', title: 'GDP', label: 'GDP', unit: 'current US$', kind: 'money', desk: 'activity' },
  { id: 'growth', code: 'NY.GDP.MKTP.KD.ZG', title: 'GDP growth', label: 'GDP growth', unit: '% y/y', kind: 'pct', desk: 'activity' },
  { id: 'mfg', code: 'NV.IND.MANF.ZS', title: 'Manufacturing value added', label: 'Manufacturing share of GDP', unit: '% of GDP', kind: 'pct', desk: 'activity' },
  { id: 'trade', code: 'NE.TRD.GNFS.ZS', title: 'Trade', label: 'Trade (exports + imports)', unit: '% of GDP', kind: 'pct', desk: 'activity' },
  { id: 'inflation', code: 'FP.CPI.TOTL.ZG', title: 'Inflation, consumer prices', label: 'Consumer price inflation', unit: '% y/y', kind: 'pct', desk: 'prices' },
  { id: 'gcf', code: 'NE.GDI.TOTL.ZS', title: 'Gross capital formation', label: 'Investment (gross capital formation)', unit: '% of GDP', kind: 'pct', desk: 'capital' },
  { id: 'stability', code: 'GOV_WGI_PV.SC', title: 'Political stability and absence of violence', label: 'Political stability score', unit: 'score 0-100', kind: 'num', desk: 'capital', dataset: 'Worldwide Governance Indicators', page: 'https://www.worldbank.org/en/publication/worldwide-governance-indicators' },
  { id: 'fdi', code: 'BX.KLT.DINV.WD.GD.ZS', title: 'Foreign direct investment, net inflows', label: 'Foreign direct investment, net inflows', unit: '% of GDP', kind: 'pct', desk: 'capital' },
];

/** World Bank values older than this many years are hidden (with a note), not shown as current. */
export const WB_MAX_AGE_YEARS = 10;

/**
 * Dollar index rebuilt from the published ICE DXY formula, using free daily
 * Federal Reserve H.10 noon buying rates via FRED. Not the official ICE DXY.
 * DXY = 50.14348112 x EURUSD^-0.576 x USDJPY^0.136 x GBPUSD^-0.119 x USDCAD^0.091 x USDSEK^0.042 x USDCHF^0.036
 * FRED quoting: DEXUSEU and DEXUSUK are US dollars per euro / pound; the rest are foreign units per US dollar.
 */
export const DXY_CONSTANT = 50.14348112;
export const DXY_LEGS = [
  { seriesId: 'DEXUSEU', pair: 'EURUSD', weight: -0.576 },
  { seriesId: 'DEXJPUS', pair: 'USDJPY', weight: 0.136 },
  { seriesId: 'DEXUSUK', pair: 'GBPUSD', weight: -0.119 },
  { seriesId: 'DEXCAUS', pair: 'USDCAD', weight: 0.091 },
  { seriesId: 'DEXSDUS', pair: 'USDSEK', weight: 0.042 },
  { seriesId: 'DEXSZUS', pair: 'USDCHF', weight: 0.036 },
];
export const H10_PAGE = 'https://www.federalreserve.gov/releases/h10/';
export function dxyValue(rates) {
  let v = DXY_CONSTANT;
  for (const leg of DXY_LEGS) {
    const r = rates[leg.seriesId];
    if (!Number.isFinite(r) || r <= 0) return null;
    v *= r ** leg.weight;
  }
  return v;
}
/** rowsBySeries: { DEXUSEU: [{date, value}], ... } -> [{date, value}] on dates where all six rates exist. */
export function dxyRows(rowsBySeries) {
  const maps = DXY_LEGS.map((l) => new Map((rowsBySeries[l.seriesId] || []).map((r) => [r.date, r.value])));
  const out = [];
  for (const date of [...maps[0].keys()].sort()) {
    const rates = {};
    DXY_LEGS.forEach((l, i) => { rates[l.seriesId] = maps[i].get(date); });
    const v = dxyValue(rates);
    if (v != null) out.push({ date, value: Math.round(v * 10000) / 10000 });
  }
  return out;
}

export const fredCsv = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(id)}`;
export const fredPage = (id) => `https://fred.stlouisfed.org/series/${encodeURIComponent(id)}`;
/**
 * Sectors of the Economy: World Bank shares shown as a strip on each of the five tabs (annual, no key).
 * Same 10-year age rule as the What changed lines.
 */
export const SECTOR_INDICATORS = [
  { id: 'agr', tab: 'materials', code: 'NV.AGR.TOTL.ZS', label: 'Agriculture, forestry and fishing', unit: '% of GDP' },
  { id: 'rents', tab: 'materials', code: 'NY.GDP.TOTL.RT.ZS', label: 'Natural resource rents', unit: '% of GDP' },
  { id: 'mfgshare', tab: 'manufacturing', code: 'NV.IND.MANF.ZS', label: 'Manufacturing', unit: '% of GDP' },
  { id: 'industry', tab: 'manufacturing', code: 'NV.IND.TOTL.ZS', label: 'Industry, including construction', unit: '% of GDP' },
  { id: 'services', tab: 'services', code: 'NV.SRV.TOTL.ZS', label: 'Services', unit: '% of GDP' },
  { id: 'srvjobs', tab: 'services', code: 'SL.SRV.EMPL.ZS', label: 'Jobs in services', unit: '% of employment' },
  { id: 'hitech', tab: 'technology', code: 'TX.VAL.TECH.MF.ZS', label: 'High-tech exports', unit: '% of manufactured exports' },
  { id: 'ict', tab: 'technology', code: 'BX.GSR.CCIS.ZS', label: 'ICT service exports', unit: '% of service exports' },
  { id: 'rnd', tab: 'technology', code: 'GB.XPD.RSDV.GD.ZS', label: 'R&D spending', unit: '% of GDP' },
  { id: 'govcons', tab: 'policy', code: 'NE.CON.GOVT.ZS', label: 'Government consumption', unit: '% of GDP' },
  { id: 'tax', tab: 'policy', code: 'GC.TAX.TOTL.GD.ZS', label: 'Tax revenue', unit: '% of GDP' },
];

/**
 * Energy tab: electricity generation mix per country (shares of generation, latest full year).
 * Our World in Data energy dataset (CC BY 4.0), built on Ember and the Energy Institute Statistical Review.
 */
export const OWID_ENERGY_CSV = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';
export const OWID_MIX_PAGE = 'https://ourworldindata.org/electricity-mix';
export const MIX_SOURCES = [
  { id: 'coal', col: 'coal_share_elec', label: 'Coal' },
  { id: 'gas', col: 'gas_share_elec', label: 'Gas' },
  { id: 'oil', col: 'oil_share_elec', label: 'Oil' },
  { id: 'nuclear', col: 'nuclear_share_elec', label: 'Nuclear' },
  { id: 'hydro', col: 'hydro_share_elec', label: 'Hydro' },
  { id: 'wind', col: 'wind_share_elec', label: 'Wind' },
  { id: 'solar', col: 'solar_share_elec', label: 'Solar' },
  { id: 'bio', col: 'biofuel_share_elec', label: 'Bioenergy' },
  { id: 'other', col: 'other_renewables_share_elec_exc_biofuel', label: 'Other renewables' },
];

/** Parse the OWID energy CSV into the latest complete electricity mix per ISO3 code. */
export function owidMix(csvText, { minYear = 0 } = {}) {
  const lines = String(csvText || '').split(/\r?\n/);
  const head = lines.shift().split(',');
  const ix = (c) => head.indexOf(c);
  const iIso = ix('iso_code'), iYear = ix('year'), iCountry = ix('country'), iGen = ix('electricity_generation');
  const cols = MIX_SOURCES.map((m) => ix(m.col));
  const best = {};
  for (const line of lines) {
    if (!line) continue;
    const f = line.split(',');
    if (f.length !== head.length) continue;
    // OWID leaves iso_code blank for Kosovo (and the World aggregate); map those by name.
    const iso = f[iIso] || ({ World: 'OWID_WRL', Kosovo: 'OWID_KOS' }[f[iCountry]] || '');
    if (!iso || !/^([A-Z]{3}|OWID_KOS|OWID_WRL)$/.test(iso)) continue;
    const year = Number(f[iYear]);
    if (!(year >= minYear)) continue;
    const shares = cols.map((c) => (f[c] === '' ? null : Number(f[c])));
    // Blank shares are sources the country does not use (Cambodia has no gas or nuclear); the total check below guards the rest.
    if (shares.filter((v) => Number.isFinite(v)).length < 3) continue;
    const total = shares.reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0);
    if (total < 95 || total > 105) continue;
    if (!best[iso] || best[iso].year < year) {
      best[iso] = { country: f[iCountry], year, generationTWh: f[iGen] === '' ? null : Number(f[iGen]), shares: Object.fromEntries(MIX_SOURCES.map((m, k) => [m.id, Number.isFinite(shares[k]) ? Math.round(shares[k] * 10) / 10 : null])) };
    }
  }
  return best;
}

/** Compact a World Bank record for the sector strips: [value, year, priorValue, priorYear]. */
export function compactWb(rec) {
  if (!rec || !Number.isFinite(rec.value)) return null;
  const r2 = (v) => Math.round(v * 100) / 100;
  return rec.prior ? [r2(rec.value), Number(rec.year), r2(rec.prior.value), Number(rec.prior.year)] : [r2(rec.value), Number(rec.year)];
}

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
    id: def.id, desk: def.desk, title: def.title, label: def.label || def.title, places: def.places || ['us'], seriesId: def.seriesId, unit: def.unit,
    decimals: def.decimals, frequency: def.frequency, staleAfterDays: def.staleAfterDays,
    value: cur.value, asOf: cur.date, prior: prior ? { value: prior.value, asOf: prior.date } : null,
    sourceUrl: def.composite === 'dxy' ? H10_PAGE : fredPage(def.seriesId),
    sourceName: def.composite === 'dxy' ? `Federal Reserve H.10 exchange rates via FRED (${DXY_LEGS.map((l) => l.seriesId).join(', ')}), DXY formula` : `${def.primary} via FRED (${def.seriesId})`,
    caveat: def.caveat || null, retrievedAt: nowIso, spark: sparkPoints(rows, def.frequency),
  };
  if (def.yoy) {
    rec.yoy = yoyPct(rows);
    rec.yoyPrior = rows.length > 1 ? yoyPct(rows.slice(0, -1)) : null;
  }
  if (def.showYoy) rec.showYoy = true;
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
  const series = [...byId.values()].filter((s) => order.includes(s.id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
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
  if (!Number.isFinite(v)) return 'n/a';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtMoney(v) {
  if (!Number.isFinite(v)) return 'n/a';
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
}
