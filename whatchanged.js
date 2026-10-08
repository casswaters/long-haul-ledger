/**
 * Long Haul Ledger: "What changed" strip (Indicators = Activity, Prices, Capital).
 * Pure helpers shared by the browser and the tests. It follows the selected place
 * (World > Country > State equivalent > City) and only shows real sourced lines:
 * latest value, unit, direction and size of change vs the prior reading, as-of date,
 * and the source one tap away. Groups with no lines are hidden; a place with no
 * lines gets one quiet "Not yet covered" line with the planned source.
 */
import { FRED_SERIES, PINK_SERIES, PRICES_ORDER, WB_INDICATORS, WB_MAX_AGE_YEARS, fredPage } from './stats.js';

export const GROUPS = [
  { id: 'activity', title: 'Activity' },
  { id: 'prices', title: 'Prices' },
  { id: 'capital', title: 'Capital' },
];

export const NOT_COVERED = 'Not yet covered';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-06" daily → "Oct 6, 2026"; monthly → "Aug 2026"; "2025" annual → "2025". */
export function asOfLabel(asOf, frequency) {
  const s = String(asOf || '');
  if (/^\d{4}$/.test(s)) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const mon = MONTHS[Number(m[2]) - 1];
  return frequency === 'monthly' ? `${mon} ${m[1]}` : `${mon} ${Number(m[3])}, ${m[1]}`;
}

export function fmtNumber(v, decimals = 1) {
  if (!Number.isFinite(v)) return 'n/a';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtMoneyShort(v) {
  if (!Number.isFinite(v)) return 'n/a';
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
}

const isPctUnit = (unit) => /%/.test(unit || '');

/**
 * Direction and size of change. Percent units change in percentage points ("pts").
 * Returns { dir: 'up'|'down'|'flat', arrow, text, label } or null without a prior.
 */
export function changeOf(cur, prior, { unit = '', decimals = 2, money = false } = {}) {
  if (!Number.isFinite(cur) || !Number.isFinite(prior)) return null;
  const d = cur - prior;
  const abs = Math.abs(d);
  const shown = money ? fmtMoneyShort(abs) : fmtNumber(abs, decimals);
  const pts0 = isPctUnit(unit) ? ' pts' : '';
  if (d === 0) return { dir: 'flat', arrow: '→', text: 'unchanged', label: 'unchanged' };
  const tiny = money ? abs < 5e5 : Number(abs.toFixed(decimals)) === 0;
  if (tiny) {
    const step = money ? '$1M' : `${(1 / 10 ** decimals).toFixed(decimals)}${pts0}`;
    return { dir: 'flat', arrow: '→', text: `under ${step}`, label: `changed by under ${step}` };
  }
  const dir = d > 0 ? 'up' : 'down';
  const sign = d > 0 ? '+' : '−';
  const pts = isPctUnit(unit) ? ' pts' : '';
  const text = `${sign}${shown}${pts}`;
  return { dir, arrow: dir === 'up' ? '↑' : '↓', text, label: `${dir} ${shown}${pts}` };
}

/** One line from a FRED or Pink Sheet record (data/stats/us.json, benchmarks.json). */
export function lineFromStat(r) {
  if (!r || !Number.isFinite(r.value)) return null;
  if (r.showYoy) {
    if (!Number.isFinite(r.yoy)) return null;
    return {
      id: r.id, desk: r.desk, label: r.label || r.title, value: r.yoy, display: fmtNumber(r.yoy, 1), unit: '% y/y',
      change: changeOf(r.yoy, r.yoyPrior, { unit: '%', decimals: 1 }),
      asOf: r.asOf, asOfText: asOfLabel(r.asOf, r.frequency), frequency: r.frequency,
      prior: Number.isFinite(r.yoyPrior) && r.prior ? { display: `${fmtNumber(r.yoyPrior, 1)}% y/y`, asOfText: asOfLabel(r.prior.asOf, r.frequency) } : null,
      detail: `Index level ${fmtNumber(r.value, r.decimals ?? 1)} (${r.unit}), change from the same month a year earlier.`,
      source: { name: r.sourceName, url: r.sourceUrl }, caveat: r.caveat || null,
      stale: isStaleStat(r), spark: r.spark || null,
    };
  }
  const dollar = r.unit === '$';
  return {
    id: r.id, desk: r.desk, label: r.label || r.title, value: r.value, display: `${dollar ? '$' : ''}${fmtNumber(r.value, r.decimals ?? 2)}`, unit: dollar ? 'US dollars' : r.unit,
    change: r.prior ? changeOf(r.value, r.prior.value, { unit: r.unit, decimals: r.decimals ?? 2 }) : null,
    asOf: r.asOf, asOfText: asOfLabel(r.asOf, r.frequency), frequency: r.frequency,
    prior: r.prior ? { display: dollar ? `$${fmtNumber(r.prior.value, r.decimals ?? 2)}` : `${fmtNumber(r.prior.value, r.decimals ?? 2)} ${r.unit}`, asOfText: asOfLabel(r.prior.asOf, r.frequency) } : null,
    detail: r.title && r.title !== r.label ? r.title : null,
    source: { name: r.sourceName, url: r.sourceUrl }, caveat: r.caveat || null,
    stale: isStaleStat(r), spark: r.spark || null,
  };
}

export function isStaleStat(r, now = new Date()) {
  const t = Date.parse(`${r?.asOf}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return (now.getTime() - t) / 86400000 > (r.staleAfterDays || 60);
}

/** One line from a World Bank value; null + note when older than WB_MAX_AGE_YEARS. */
export function lineFromWorldBank(ind, v, now = new Date()) {
  if (!v || !Number.isFinite(v.value)) return { line: null, hidden: null };
  const year = Number(v.year);
  const nowYear = now.getUTCFullYear();
  if (!(year >= nowYear - WB_MAX_AGE_YEARS)) {
    return { line: null, hidden: `Latest World Bank figure for ${ind.label || ind.title} is from ${v.year}, not shown.` };
  }
  const money = ind.kind === 'money';
  const display = money ? fmtMoneyShort(v.value) : fmtNumber(v.value, 1);
  const unit = money ? 'current US$' : ind.unit;
  const prior = v.prior && Number.isFinite(v.prior.value) ? v.prior : null;
  return {
    hidden: null,
    line: {
      id: `wb-${ind.id}`, desk: ind.desk, label: ind.label || ind.title, value: v.value, display, unit: money ? '' : unit,
      change: prior ? changeOf(v.value, prior.value, { unit, decimals: 1, money }) : null,
      asOf: v.year, asOfText: v.year, frequency: 'annual',
      prior: prior ? { display: money ? fmtMoneyShort(prior.value) : `${fmtNumber(prior.value, 1)} ${unit}`, asOfText: prior.year } : null,
      detail: `${ind.title} (${ind.unit}), World Bank World Development Indicators ${ind.code}.`,
      source: { name: 'World Bank', url: v.sourceUrl }, caveat: year <= nowYear - 6 ? `Older figure: latest published year is ${v.year}.` : null,
      older: year <= nowYear - 6, stale: false, spark: null,
    },
  };
}

/** Planned source text for a place with nothing wired yet. */
export function plannedSource(place) {
  if (!place || place.level === 'world') return 'World Bank and FRED public series';
  if (place.level === 'country') {
    return place.country === 'tw'
      ? 'Taiwan national statistics office (DGBAS); World Bank does not publish Taiwan'
      : 'World Bank World Development Indicators, or the national statistics office';
  }
  if (place.country === 'us') {
    return place.level === 'city'
      ? 'BLS metro unemployment and payrolls (via FRED)'
      : 'BLS state unemployment and payrolls, FRED state series';
  }
  if (place.level === 'city') return 'National statistics office city data';
  return 'Eurostat, OECD regional statistics or the national statistics office';
}

/**
 * Lines for a place. data = { us, benchmarks, world } (the three stats files).
 * Returns { groups: [{ id, title, lines }], hidden: [notes], empty: bool, planned }.
 */
export function placeIndicators(place, data = {}, now = new Date()) {
  const p = place || { level: 'world' };
  const lines = [];
  const hidden = [];
  const fromStats = [...(data.benchmarks?.series || []), ...(data.us?.series || [])];
  const key = p.level === 'world' ? 'world' : (p.level === 'country' ? p.country : null);
  if (key) {
    for (const r of fromStats) {
      if ((r.places || ['us']).includes(key)) { const l = lineFromStat(r); if (l) lines.push(l); }
    }
    const wb = key === 'world' ? data.world?.world : data.world?.countries?.[key];
    if (wb) {
      for (const ind of WB_INDICATORS) {
        // The US already has monthly CPI; skip the annual World Bank inflation line there.
        if (key === 'us' && ind.id === 'inflation') continue;
        const { line, hidden: note } = lineFromWorldBank(ind, wb[ind.id], now);
        // At World, say so on the price line so it is not read as a US figure.
        if (line && key === 'world' && ind.desk === 'prices') line.label = `${line.label}, world`;
        if (line) lines.push(line);
        if (note) hidden.push(note);
      }
    }
  }
  const order = (l) => {
    const i = PRICES_ORDER.indexOf(l.id);
    return i >= 0 ? i : 100 + (l.id.startsWith('wb-') ? 50 : 0);
  };
  const groups = GROUPS.map((g) => ({
    ...g,
    lines: lines.filter((l) => l.desk === g.id).sort((a, b) => order(a) - order(b)),
  })).filter((g) => g.lines.length);
  return { groups, hidden, empty: groups.length === 0, planned: plannedSource(p) };
}

/** Count of lines per group for a place (for tabs and the header). */
export function groupCounts(model) {
  const out = { activity: 0, prices: 0, capital: 0 };
  for (const g of model.groups) out[g.id] = g.lines.length;
  return out;
}

/** One line, as a disclosure: the summary is the at-a-glance number, the source opens on tap. */
export function lineHtml(l, { open = false, spark = '' } = {}) {
  const ch = l.change;
  const chHtml = ch
    ? `<span class="wc-delta is-${ch.dir}" aria-label="${esc(ch.label)}"><span aria-hidden="true">${ch.arrow} ${esc(ch.text)}</span></span>`
    : '<span class="wc-delta is-none">no prior reading</span>';
  const flags = `${l.stale ? '<span class="stale-flag" title="Older than this series\' normal cadence">stale</span>' : ''}${l.older ? '<span class="stale-flag" title="Latest published year is old">older figure</span>' : ''}`;
  return `<details class="wc-line" data-line="${esc(l.id)}"${open ? ' open' : ''}>
    <summary class="wc-sum">
      <span class="wc-label">${esc(l.label)}</span>
      <span class="wc-val"><span class="wc-num">${esc(l.display)}</span>${l.unit ? ` <span class="wc-unit">${esc(l.unit)}</span>` : ''}</span>
      ${chHtml}
      <span class="wc-asof">as of ${esc(l.asOfText)}${flags ? ` ${flags}` : ''}</span>
    </summary>
    <div class="wc-more">
      <p><span class="k">Source</span> <a href="${esc(l.source.url)}" target="_blank" rel="noopener noreferrer">${esc(l.source.name)}</a></p>
      ${l.prior ? `<p><span class="k">Prior</span> ${esc(l.prior.display)} as of ${esc(l.prior.asOfText)}</p>` : ''}
      ${l.detail ? `<p class="wc-detail">${esc(l.detail)}</p>` : ''}
      ${l.caveat ? `<p class="wc-detail">${esc(l.caveat)}</p>` : ''}
      ${spark}
    </div>
  </details>`;
}

/** Quiet empty line: "Not yet covered" with the planned source and the date it was checked. */
export function notCoveredHtml({ field = '', planned = '', checked = '', parentLabel = '', parentAttr = '' } = {}) {
  return `<p class="not-covered" data-not-covered>${field ? `<span class="nc-field">${esc(field)}</span> ` : ''}<span class="nc-text">${NOT_COVERED}.</span>${planned ? ` <span class="nc-plan">Planned source: ${esc(planned)}.</span>` : ''}${checked ? ` <span class="nc-checked">Checked ${esc(checked)}.</span>` : ''}${parentLabel ? ` <button type="button" class="nc-parent" ${parentAttr}>See ${esc(parentLabel)}</button>` : ''}</p>`;
}

/** Lines shown before "N more" in each group of the strip. */
export const STRIP_MAX = 5;

/** The strip for the place panels. */
export function whatChangedHtml(model, { placeLabel = 'World', checked = '', parentLabel = '', parentAttr = '' } = {}) {
  const head = `<div class="home-head wc-head"><h2 id="wc-title">What changed</h2><span class="home-sub">${esc(placeLabel)} · latest reading vs the one before · tap a line for its source</span></div>`;
  if (model.empty) {
    return `<section class="what-changed" aria-labelledby="wc-title" data-wc-empty>${head}${notCoveredHtml({ planned: model.planned, checked, parentLabel, parentAttr })}</section>`;
  }
  const groups = model.groups.map((g) => `
    <div class="wc-group" data-group="${g.id}">
      <h3 class="wc-group-h"><button type="button" class="wc-open" data-open-desk="${g.id}" aria-label="${esc(g.title)}: open all ${g.lines.length} lines">${esc(g.title)} <span class="wc-n">${g.lines.length}</span></button></h3>
      <div class="wc-lines">${g.lines.slice(0, STRIP_MAX).map((l) => lineHtml(l)).join('')}</div>
      ${g.lines.length > STRIP_MAX ? `<details class="wc-morelines"><summary>${g.lines.length - STRIP_MAX} more ${esc(g.title.toLowerCase())} lines</summary><div class="wc-lines">${g.lines.slice(STRIP_MAX).map((l) => lineHtml(l)).join('')}</div></details>` : ''}
    </div>`).join('');
  const hidden = model.hidden.length ? `<p class="wc-hidden">${model.hidden.map(esc).join(' ')}</p>` : '';
  return `<section class="what-changed" aria-labelledby="wc-title">${head}<div class="wc-groups">${groups}</div>${hidden}</section>`;
}

/** Method page: one line of build-time coverage counts (data/coverage.json). */
export function coverageLine(c) {
  if (!c) return '';
  return `Coverage today: leaders for ${c.leaders.countries} of ${c.countries} countries, ${c.leaders.stateEquivalents} of ${c.stateEquivalents.toLocaleString('en-US')} state equivalents and ${c.leaders.cities} of ${c.cities.toLocaleString('en-US')} cities; What changed lines for ${c.indicators.countries} of ${c.countries} countries${c.indicators.world ? ' and the World' : ''}; key seats for ${c.seats.places} ${c.seats.places === 1 ? 'country' : 'places'} (${c.seats.seats} seats); own news stories for ${c.news.countriesWithStories} of ${c.countries} countries; ${c.briefs.energySlots} Energy brief slots and ${c.briefs.sectorSlots} sector brief slots written.`;
}

export const ALL_SERIES = [...FRED_SERIES, ...PINK_SERIES];
export { fredPage };
