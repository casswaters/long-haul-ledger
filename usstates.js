/**
 * US state figures (What changed lines and the Energy tab electricity mix) from official US agencies:
 * BEA state GDP (SAGDP1), Census ACS 1-year population, BLS state unemployment via FRED, EIA generation by fuel.
 * Pure functions: the fetcher (scripts/fetch-us-states.mjs) builds data/stats/us-states.json box-side or in CI;
 * the browser only reads that file. No keys here.
 */
import { changeOf, fmtNumber, fmtMoneyShort } from './whatchanged.js';

export const US_STATES = [
  ['Alabama', 'AL', '01'], ['Alaska', 'AK', '02'], ['Arizona', 'AZ', '04'], ['Arkansas', 'AR', '05'], ['California', 'CA', '06'],
  ['Colorado', 'CO', '08'], ['Connecticut', 'CT', '09'], ['Delaware', 'DE', '10'], ['District of Columbia', 'DC', '11'], ['Florida', 'FL', '12'],
  ['Georgia', 'GA', '13'], ['Hawaii', 'HI', '15'], ['Idaho', 'ID', '16'], ['Illinois', 'IL', '17'], ['Indiana', 'IN', '18'], ['Iowa', 'IA', '19'],
  ['Kansas', 'KS', '20'], ['Kentucky', 'KY', '21'], ['Louisiana', 'LA', '22'], ['Maine', 'ME', '23'], ['Maryland', 'MD', '24'],
  ['Massachusetts', 'MA', '25'], ['Michigan', 'MI', '26'], ['Minnesota', 'MN', '27'], ['Mississippi', 'MS', '28'], ['Missouri', 'MO', '29'],
  ['Montana', 'MT', '30'], ['Nebraska', 'NE', '31'], ['Nevada', 'NV', '32'], ['New Hampshire', 'NH', '33'], ['New Jersey', 'NJ', '34'],
  ['New Mexico', 'NM', '35'], ['New York', 'NY', '36'], ['North Carolina', 'NC', '37'], ['North Dakota', 'ND', '38'], ['Ohio', 'OH', '39'],
  ['Oklahoma', 'OK', '40'], ['Oregon', 'OR', '41'], ['Pennsylvania', 'PA', '42'], ['Rhode Island', 'RI', '44'], ['South Carolina', 'SC', '45'],
  ['South Dakota', 'SD', '46'], ['Tennessee', 'TN', '47'], ['Texas', 'TX', '48'], ['Utah', 'UT', '49'], ['Vermont', 'VT', '50'],
  ['Virginia', 'VA', '51'], ['Washington', 'WA', '53'], ['West Virginia', 'WV', '54'], ['Wisconsin', 'WI', '55'], ['Wyoming', 'WY', '56'],
].map(([name, postal, fips]) => ({ name, postal, fips, id: `us-${postal.toLowerCase()}` }));

export const US_STATE_SOURCES = {
  gdp: { name: 'BEA', url: 'https://apps.bea.gov/itable/?ReqID=70&step=1', title: 'Gross domestic product by state, current dollars (BEA SAGDP1)' },
  growth: { name: 'BEA', url: 'https://apps.bea.gov/itable/?ReqID=70&step=1', title: 'Real GDP growth by state, chained 2017 dollars (BEA SAGDP1)' },
  population: { name: 'Census Bureau', url: 'https://data.census.gov/table/ACSDT1Y2024.B01003', title: 'Total population, American Community Survey 1-year estimate (B01003)' },
  unemployment: { name: 'BLS via FRED', url: 'https://fred.stlouisfed.org/', title: 'Unemployment rate, seasonally adjusted (BLS Local Area Unemployment Statistics)' },
  mix: { name: 'EIA', url: 'https://www.eia.gov/electricity/data/browser/', title: 'Net generation by fuel, all sectors, utility-scale (EIA Electric Power Monthly, annual)' },
};

/** EIA fuel ids per electricity mix bucket (same buckets as the OWID country mix). */
export const EIA_MIX = { coal: 'COW', gas: 'NGO', oil: 'PET', nuclear: 'NUC', hydro: 'HYC', wind: 'WND', solar: 'SUN', bio: 'BIO', other: 'GEO' };

const num = (v) => { const n = Number(String(v).replace(/,/g, '')); return Number.isFinite(n) ? n : null; };
const r1 = (x) => Math.round(x * 10) / 10;

function latestTwo(rows) {
  const s = rows.filter((r) => r.value != null).sort((a, b) => String(b.period).localeCompare(String(a.period)));
  return s.length ? { value: s[0].value, period: s[0].period, prior: s[1] ? { value: s[1].value, period: s[1].period } : null } : null;
}

/** FRED CSV (observation_date,SERIES) to the latest two monthly values. */
export function fredLatest(csv) {
  const rows = String(csv || '').trim().split(/\r?\n/).slice(1).map((l) => l.split(',')).map(([d, v]) => ({ period: d, value: num(v) }));
  return latestTwo(rows);
}

export function stateFigures({ nominal = [], real = [], acsNow = [], acsPrior = [], eiaRows = [], unemployment = {}, now = new Date() }) {
  const states = {};
  const counts = { gdp: 0, growth: 0, population: 0, unemployment: 0, mix: 0 };
  const byFips = (rows) => {
    const m = {};
    for (const r of rows) {
      const f = String(r.GeoFips || '').slice(0, 2);
      (m[f] ||= []).push({ period: r.TimePeriod, value: num(r.DataValue) });
    }
    return m;
  };
  const nom = byFips(nominal); const rl = byFips(real);
  const acsMap = (rows) => Object.fromEntries((rows || []).slice(1).map((r) => [r[2], num(r[1])]));
  const pNow = acsMap(acsNow); const pPrior = acsMap(acsPrior);
  const eia = {};
  for (const r of eiaRows) {
    const g = num(r.generation); if (g == null) continue;
    ((eia[r.location] ||= {})[r.period] ||= {})[r.fueltypeid] = g;
  }
  for (const s of US_STATES) {
    const rec = { name: s.name, postal: s.postal };
    const g = latestTwo(nom[s.fips] || []);
    if (g) { rec.gdp = { value: g.value * 1e6, year: g.period, prior: g.prior ? { value: g.prior.value * 1e6, year: g.prior.period } : null }; counts.gdp++; }
    const rr = (rl[s.fips] || []).filter((x) => x.value != null).sort((a, b) => b.period.localeCompare(a.period));
    if (rr.length >= 2) {
      const gr = (a, b) => r1((a.value / b.value - 1) * 100);
      rec.growth = { value: gr(rr[0], rr[1]), year: rr[0].period, prior: rr[2] ? { value: gr(rr[1], rr[2]), year: rr[1].period } : null };
      counts.growth++;
    }
    if (pNow[s.fips] != null) { rec.population = { value: pNow[s.fips], year: '2024', prior: pPrior[s.fips] != null ? { value: pPrior[s.fips], year: '2023' } : null }; counts.population++; }
    const u = fredLatest(unemployment[s.postal]);
    if (u) { rec.unemployment = { value: u.value, date: u.period, prior: u.prior ? { value: u.prior.value, date: u.prior.period } : null, url: `https://fred.stlouisfed.org/series/${s.postal}UR` }; counts.unemployment++; }
    const years = Object.keys(eia[s.postal] || {}).sort().reverse();
    const yr = years.find((y) => eia[s.postal][y].ALL > 0);
    if (yr) {
      const f = eia[s.postal][yr]; const total = f.ALL;
      const shares = Object.fromEntries(Object.entries(EIA_MIX).map(([k, id]) => [k, f[id] > 0 ? r1(f[id] / total * 100) : 0]));
      rec.mix = { year: Number(yr), generationTWh: r1(total / 1000), shares };
      counts.mix++;
    }
    states[s.id] = rec;
  }
  return {
    generatedAt: now.toISOString(),
    note: 'US state figures from BEA, Census ACS, BLS (via FRED) and EIA. Built by scripts/fetch-us-states.mjs; keys stay off the site.',
    sources: US_STATE_SOURCES, counts, states,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthText = (d) => { const [y, m] = String(d).split('-'); return `${MONTHS[Number(m) - 1]} ${y}`; };
const money = (v) => fmtMoneyShort(v);
const people = (v) => (v >= 1e6 ? `${fmtNumber(v / 1e6, 2)} million` : fmtNumber(v, 0));

/** What changed lines for a US state (admin1 place id like us-oh). */
export function stateLines(stateId, data) {
  const rec = data?.states?.[stateId];
  if (!rec) return [];
  const src = data.sources || US_STATE_SOURCES;
  const lines = [];
  if (rec.gdp) {
    lines.push({ id: 'st-gdp', desk: 'activity', label: 'GDP', value: rec.gdp.value, display: money(rec.gdp.value), unit: '',
      change: rec.gdp.prior ? changeOf(rec.gdp.value, rec.gdp.prior.value, { unit: 'current US$', decimals: 1, money: true }) : null,
      asOf: rec.gdp.year, asOfText: rec.gdp.year, frequency: 'annual',
      prior: rec.gdp.prior ? { display: money(rec.gdp.prior.value), asOfText: rec.gdp.prior.year } : null,
      detail: `${src.gdp.title}.`, source: { name: src.gdp.name, url: src.gdp.url }, caveat: null, older: false, stale: false, spark: null });
  }
  if (rec.growth) {
    lines.push({ id: 'st-growth', desk: 'activity', label: 'Real GDP growth', value: rec.growth.value, display: fmtNumber(rec.growth.value, 1), unit: '% y/y',
      change: rec.growth.prior ? changeOf(rec.growth.value, rec.growth.prior.value, { unit: '% y/y', decimals: 1 }) : null,
      asOf: rec.growth.year, asOfText: rec.growth.year, frequency: 'annual',
      prior: rec.growth.prior ? { display: `${fmtNumber(rec.growth.prior.value, 1)} % y/y`, asOfText: rec.growth.prior.year } : null,
      detail: `${src.growth.title}.`, source: { name: src.growth.name, url: src.growth.url }, caveat: null, older: false, stale: false, spark: null });
  }
  if (rec.unemployment) {
    lines.push({ id: 'st-unemployment', desk: 'activity', label: 'Unemployment rate', value: rec.unemployment.value, display: fmtNumber(rec.unemployment.value, 1), unit: '%',
      change: rec.unemployment.prior ? changeOf(rec.unemployment.value, rec.unemployment.prior.value, { unit: '%', decimals: 1 }) : null,
      asOf: rec.unemployment.date, asOfText: monthText(rec.unemployment.date), frequency: 'monthly',
      prior: rec.unemployment.prior ? { display: `${fmtNumber(rec.unemployment.prior.value, 1)}%`, asOfText: monthText(rec.unemployment.prior.date) } : null,
      detail: `${src.unemployment.title}.`, source: { name: src.unemployment.name, url: rec.unemployment.url || src.unemployment.url }, caveat: null, older: false, stale: false, spark: null });
  }
  if (rec.population) {
    lines.push({ id: 'st-population', desk: 'activity', label: 'Population', value: rec.population.value, display: people(rec.population.value), unit: '',
      change: rec.population.prior ? changeOf(rec.population.value, rec.population.prior.value, { unit: 'people', decimals: 0 }) : null,
      asOf: rec.population.year, asOfText: rec.population.year, frequency: 'annual',
      prior: rec.population.prior ? { display: people(rec.population.prior.value), asOfText: rec.population.prior.year } : null,
      detail: `${src.population.title}.`, source: { name: src.population.name, url: src.population.url }, caveat: null, older: false, stale: false, spark: null });
  }
  return lines;
}

/** Electricity mix record for a US state, shaped like the OWID country records. */
export function stateMix(stateId, data) {
  const rec = data?.states?.[stateId];
  if (!rec?.mix) return null;
  const src = data.sources?.mix || US_STATE_SOURCES.mix;
  return { ...rec.mix, country: rec.name, sourceName: src.name, sourceUrl: src.url, sourceText: 'U.S. Energy Information Administration, utility-scale net generation (small-scale rooftop solar not included)' };
}
