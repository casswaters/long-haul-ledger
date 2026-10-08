/**
 * Long Haul Ledger: indicators (internal id: desks): Activity, Prices, Capital. People moved to "Who's in the seat" (seats.js).
 * Pure helpers shared by the browser, scripts/fetch-prices.mjs and ledger.test.js.
 *
 * Record rules (BUILD-PLAN.md §3):
 *  - every line has a source URL (https), an as-of date and a revision note;
 *  - `history` is append-only: when `current` changes, the old line moves to
 *    history with `supersededAt` and stays visible (struck through);
 *  - values are copied from the source, never typed from memory;
 *  - only `status: "verified"` records render on a desk.
 */

export const DESK_IDS = ['activity', 'prices', 'capital'];

export const EMPTY_STATE = 'Not yet covered';

export const PROTOTYPE = {
  label: 'PROTOTYPE',
  title: 'Example data for UX testing. Not sourced.',
  note: 'PROTOTYPE · example data. Figures, names and scores here are fiction for UX testing: no sources, not advice.',
};

export const DESKS = [
  {
    id: 'activity',
    title: 'Activity',
    scope: 'Output, orders, freight and jobs: did the physical economy speed up, slow or hold?',
    trigger: 'A tracked release publishes, or a prior value is revised.',
    columns: ['Series', 'Value', 'Unit', 'As of', 'Prior', 'Source', 'Revision note'],
    sources: [
      { name: 'AAR Weekly Railroad Traffic', url: 'https://www.aar.org/data-center/rail-traffic-data/' },
      { name: 'EIA Weekly Petroleum Status Report', url: 'https://www.eia.gov/petroleum/supply/weekly/' },
      { name: 'Fed G.17 Industrial Production and Capacity Utilization', url: 'https://www.federalreserve.gov/releases/g17/current/default.htm' },
      { name: 'EIA Electric Power Monthly', url: 'https://www.eia.gov/electricity/monthly/' },
      { name: 'World Bank World Development Indicators (countries, annual)', url: 'https://data.worldbank.org/' },
    ],
  },
  {
    id: 'prices',
    title: 'Prices',
    scope: 'Globally watched benchmarks: gold, silver, bitcoin, WTI and Brent crude, then copper, natural gas, the dollar index (DXY formula) and US CPI inflation.',
    trigger: 'A new observation from the source. The prior reading stays visible as the change.',
    columns: ['Series', 'Value', 'Unit', 'Change', 'As of', 'Source'],
    sources: [
      { name: 'World Bank Pink Sheet (gold, silver, copper; monthly averages)', url: 'https://www.worldbank.org/en/research/commodity-markets' },
      { name: 'Coinbase bitcoin price via FRED (CBBTCUSD)', url: 'https://fred.stlouisfed.org/series/CBBTCUSD' },
      { name: 'EIA WTI and Brent spot via FRED (DCOILWTICO, DCOILBRENTEU)', url: 'https://fred.stlouisfed.org/series/DCOILWTICO' },
      { name: 'EIA Henry Hub spot via FRED (DHHNGSP)', url: 'https://fred.stlouisfed.org/series/DHHNGSP' },
      { name: 'Dollar index (DXY formula) rebuilt from Federal Reserve H.10 rates via FRED; not the official ICE DXY', url: 'https://www.federalreserve.gov/releases/h10/' },
      { name: 'BLS CPI via FRED (CPIAUCSL)', url: 'https://fred.stlouisfed.org/series/CPIAUCSL' },
      { name: 'World Bank consumer price inflation (countries, annual)', url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG' },
    ],
  },
  {
    id: 'capital',
    title: 'Capital',
    scope: 'The price of money and where investment goes: rates, investment share of GDP, foreign direct investment.',
    trigger: 'A stage change, a federal financing step, a material SEC filing or a cancellation.',
    columns: ['Project', 'Sponsor', 'Stage', 'Amount (as stated)', 'As of', 'Source', 'Revision note'],
    sources: [
      { name: 'SEC EDGAR filings', url: 'https://www.sec.gov/search-filings/edgar-application-programming-interfaces' },
      { name: 'DOE Loan Programs Office portfolio', url: 'https://www.energy.gov/lpo/portfolio-projects' },
      { name: 'Census construction spending', url: 'https://www.census.gov/construction/c30/c30index.html' },
      { name: 'Federal Reserve H.15 rates via FRED (DGS10, DFF)', url: 'https://www.federalreserve.gov/releases/h15/' },
      { name: 'World Bank investment and FDI (countries, annual)', url: 'https://data.worldbank.org/indicator/BX.KLT.DINV.WD.GD.ZS' },
    ],
  },
];

/** Public price series wired into the GitHub Action (FRED CSV, no key). */
export const PRICE_SERIES = [
  {
    id: 'prices.diesel-us-retail',
    seriesId: 'GASDESW',
    primarySeriesId: 'EMD_EPD2D_PTE_NUS_DPG',
    title: 'Diesel, US retail on-highway',
    unit: '$/gal',
    decimals: 3,
    frequency: 'weekly',
    staleAfterDays: 10,
    sourceName: 'EIA via FRED (GASDESW)',
    sourceUrl: 'https://fred.stlouisfed.org/series/GASDESW',
    primaryUrl: 'https://www.eia.gov/petroleum/gasdiesel/',
    industrialUse: 'Truck, rail and off-road equipment fuel; a direct input to freight cost.',
    connects: ['freight', 'refining'],
    caveat: 'Weekly national average, normally published Monday.',
  },
  {
    id: 'prices.henry-hub',
    seriesId: 'DHHNGSP',
    primarySeriesId: 'RNGWHHD',
    title: 'Henry Hub natural gas spot',
    unit: '$/MMBtu',
    decimals: 2,
    frequency: 'daily',
    staleAfterDays: 10,
    sourceName: 'EIA via FRED (DHHNGSP)',
    sourceUrl: 'https://fred.stlouisfed.org/series/DHHNGSP',
    primaryUrl: 'https://www.eia.gov/dnav/ng/hist/rngwhhdD.htm',
    industrialUse: 'US gas benchmark; feeds power prices, process heat and ammonia costs.',
    connects: ['power'],
    caveat: 'Daily spot, posted by EIA with a lag of several days.',
  },
];

export const fredCsvUrl = (id) => `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(id)}`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a FRED graph CSV → [{ date, value }] ascending; skips missing ('.') rows. */
export function parseFredCsv(text) {
  const lines = String(text || '').trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const out = [];
  for (const line of lines.slice(1)) {
    const [date, raw] = line.split(',');
    if (!DATE_RE.test(date || '')) continue;
    const v = Number(raw);
    if (raw == null || raw.trim() === '' || raw.trim() === '.' || !Number.isFinite(v)) continue;
    out.push({ date, value: v });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/** Problems with a desk record (empty array = renderable). */
export function validateRecord(r) {
  const p = [];
  if (!r || typeof r !== 'object') return ['not a record'];
  if (!r.id) p.push('missing id');
  if (!DESK_IDS.includes(r.desk)) p.push('unknown desk');
  if (r.status !== 'verified') p.push(`status ${r.status || 'missing'} (only verified renders)`);
  const c = r.current || {};
  if (!/^https:\/\//.test(c.sourceUrl || '')) p.push('sourceUrl must be https');
  if (!DATE_RE.test(c.asOf || '')) p.push('asOf must be YYYY-MM-DD');
  if (!c.revisionNote) p.push('missing revisionNote');
  if (c.value != null && !Number.isFinite(c.value)) p.push('value not numeric');
  if (c.value != null && !c.sourceUrl) p.push('value with no source');
  if (!Array.isArray(r.history)) p.push('history must be an array');
  for (const h of r.history || []) {
    if (!h.supersededAt || !DATE_RE.test(h.asOf || '') || !/^https:\/\//.test(h.sourceUrl || '')) {
      p.push('history line missing supersededAt / asOf / sourceUrl');
      break;
    }
  }
  return p;
}

/** Records that may render on a desk: verified and valid only. */
export function renderableRecords(desk) {
  const recs = Array.isArray(desk?.records) ? desk.records : [];
  return recs.filter((r) => validateRecord(r).length === 0);
}

/**
 * Fold a new source observation into a record (append-only history).
 * Returns { record, changed }. Same asOf + same value → unchanged.
 */
export function applyObservation(record, series, obs, prior, nowIso) {
  const today = nowIso.slice(0, 10);
  const nextCurrent = (revisionNote) => ({
    value: obs.value,
    unit: series.unit,
    asOf: obs.date,
    sourceUrl: series.sourceUrl,
    sourceName: series.sourceName,
    primaryUrl: series.primaryUrl,
    retrievedAt: nowIso,
    revisionNote,
    prior: prior ? { value: prior.value, asOf: prior.date } : null,
  });
  const base = {
    id: series.id,
    desk: 'prices',
    status: 'verified',
    title: series.title,
    seriesId: series.seriesId,
    primarySeriesId: series.primarySeriesId,
    frequency: series.frequency,
    industrialUse: series.industrialUse,
    proxy: false,
    caveat: series.caveat,
    range: record?.range ?? null,
    connects: series.connects,
  };
  if (!record?.current) {
    return { changed: true, record: { ...base, current: nextCurrent('First entry'), history: [] } };
  }
  const cur = record.current;
  if (cur.asOf === obs.date && cur.value === obs.value) {
    return { changed: false, record };
  }
  if (obs.date < cur.asOf) return { changed: false, record };
  const note = cur.asOf === obs.date
    ? 'Source revised the value for the same as-of date'
    : 'New observation from source';
  const superseded = {
    value: cur.value,
    unit: cur.unit,
    asOf: cur.asOf,
    sourceUrl: cur.sourceUrl,
    recordedAt: (cur.retrievedAt || '').slice(0, 10) || today,
    supersededAt: today,
    revisionNote: cur.revisionNote,
  };
  return {
    changed: true,
    record: { ...base, current: nextCurrent(note), history: [...(record.history || []), superseded] },
  };
}

/** Days between an as-of date and now (UTC days). */
export function ageDays(asOf, now = new Date()) {
  const t = Date.parse(`${asOf}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86400000);
}

export function isStale(record, now = new Date()) {
  const s = PRICE_SERIES.find((x) => x.id === record?.id);
  const age = ageDays(record?.current?.asOf, now);
  return !!s && age != null && age > s.staleAfterDays;
}

export function formatValue(value, id) {
  if (value == null || !Number.isFinite(value)) return 'n/a';
  const s = PRICE_SERIES.find((x) => x.id === id);
  return value.toFixed(s?.decimals ?? 2);
}

/** Signed change vs the source's prior observation, formatted. */
export function formatDelta(cur, prior, id) {
  if (cur == null || prior == null) return '';
  const s = PRICE_SERIES.find((x) => x.id === id);
  const d = cur - prior;
  const fixed = Math.abs(d).toFixed(s?.decimals ?? 2);
  if (Number(fixed) === 0) return '±0';
  return `${d > 0 ? '+' : '−'}${fixed}`;
}

/** Short status line for a desk tile. */
export function deskStatus(deskId, pricesDesk) {
  if (deskId !== 'prices') return { count: 0, text: EMPTY_STATE };
  const recs = renderableRecords(pricesDesk);
  if (!recs.length) return { count: 0, text: EMPTY_STATE };
  const latest = recs.map((r) => r.current.asOf).sort().pop();
  return { count: recs.length, text: `${recs.length} sourced line${recs.length === 1 ? '' : 's'} · latest ${latest}` };
}
