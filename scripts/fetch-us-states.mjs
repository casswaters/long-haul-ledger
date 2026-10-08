#!/usr/bin/env node
/**
 * US state figures for What changed and the Energy tab, from official US statistical agencies.
 * Needs BEA_API_KEY, EIA_API_KEY and CENSUS_API_KEY in the environment (box-side or CI secrets;
 * never committed, never sent to the browser). FRED state unemployment needs no key.
 * Writes data/stats/us-states.json. Usage: node scripts/fetch-us-states.mjs
 */
import fs from 'fs';
import { US_STATES, stateFigures } from '../usstates.js';

const OUT = new URL('../data/stats/us-states.json', import.meta.url);
const need = ['BEA_API_KEY', 'EIA_API_KEY', 'CENSUS_API_KEY'].filter((k) => !process.env[k]);
if (need.length) { console.log(`Skipping US state figures: missing ${need.join(', ')}.`); process.exit(0); }
const { BEA_API_KEY, EIA_API_KEY, CENSUS_API_KEY } = process.env;
const scrub = (s) => String(s).split(BEA_API_KEY).join('<key>').split(EIA_API_KEY).join('<key>').split(CENSUS_API_KEY).join('<key>');

async function getJson(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'long-haul-ledger (stats)' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i >= tries) throw new Error(scrub(`${e.message} for ${url}`));
      await new Promise((res) => setTimeout(res, 1500 * i));
    }
  }
}
async function getText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'long-haul-ledger (stats)' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.text();
}

const bea = (line) => `https://apps.bea.gov/api/data/?UserID=${BEA_API_KEY}&method=GetData&datasetname=Regional&TableName=SAGDP1&LineCode=${line}&GeoFips=STATE&Year=LAST5&ResultFormat=json`;
const beaRows = async (line) => (await getJson(bea(line))).BEAAPI.Results.Data;
const nominal = await beaRows(3);
const real = await beaRows(1);

const acs = async (year) => getJson(`https://api.census.gov/data/${year}/acs/acs1?get=NAME,B01003_001E&for=state:*&key=${CENSUS_API_KEY}`);
const acsNow = await acs(2024);
const acsPrior = await acs(2023);

const eiaRows = [];
for (let offset = 0; ; offset += 5000) {
  const j = await getJson(`https://api.eia.gov/v2/electricity/electric-power-operational-data/data/?api_key=${EIA_API_KEY}&frequency=annual&data%5B0%5D=generation&facets%5Bsectorid%5D%5B%5D=99&start=2023&offset=${offset}&length=5000`);
  eiaRows.push(...j.response.data);
  if (j.response.data.length < 5000) break;
}

const unemployment = {};
for (const s of US_STATES) {
  try {
    unemployment[s.postal] = await getText(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${s.postal}UR`);
  } catch (e) { console.log(`FRED ${s.postal}UR: ${e.message}`); }
}

const out = stateFigures({ nominal, real, acsNow, acsPrior, eiaRows, unemployment, now: new Date() });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`us-states.json: ${Object.keys(out.states).length} states; GDP ${out.counts.gdp}, population ${out.counts.population}, unemployment ${out.counts.unemployment}, electricity mix ${out.counts.mix}`);
