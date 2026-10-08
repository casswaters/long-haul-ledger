/**
 * Long Haul Ledger: share strips for the Sectors of the Economy tabs (World Bank, annual)
 * and the electricity generation mix on the Energy tab (Our World in Data). Real, dated
 * sources only; values older than 10 years are hidden, places without data say Not yet covered.
 */
import { changeOf, fmtNumber, notCoveredHtml } from './whatchanged.js';

export const MAX_AGE_YEARS = 10;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WB_PAGE = (code, id) => `https://data.worldbank.org/indicator/${code}?locations=${id === 'world' ? '1W' : String(id).toUpperCase()}`;

/** Which economy feeds the strip for a place: the World, or the country (also for its state equivalents and cities). */
export function stripScope(place) {
  if (!place || place.level === 'world' || !place.country) return { id: 'world', national: false };
  return { id: place.country, national: place.level !== 'country' };
}

/** Lines for one tab: [{id,label,unit,value,year,change,url,old}] or hidden notes. */
export function sectorLines(tabId, scopeId, data, nowYear = new Date().getUTCFullYear()) {
  const defs = Object.values(data?.indicators || {}).filter((d) => d.tab === tabId);
  const rec = scopeId === 'world' ? data?.world : data?.countries?.[scopeId];
  const lines = []; const hidden = [];
  for (const d of defs) {
    const r = rec?.[d.id];
    if (!Array.isArray(r) || !Number.isFinite(r[0])) continue;
    const [v, y, pv, py] = r;
    if (nowYear - y > MAX_AGE_YEARS) { hidden.push(`${d.label}: latest World Bank figure is from ${y}, not shown.`); continue; }
    lines.push({ id: d.id, label: d.label, unit: d.unit, value: v, year: y, prior: Number.isFinite(pv) ? { value: pv, year: py } : null,
      change: Number.isFinite(pv) ? changeOf(v, pv, { unit: d.unit, decimals: 1 }) : null, url: WB_PAGE(d.code, scopeId), code: d.code, old: nowYear - y >= 6 });
  }
  return { lines, hidden };
}

export function sectorStripHtml(tabId, place, data, { placeLabel = 'World', countryLabel = '', checked = '' } = {}) {
  const scope = stripScope(place);
  const { lines, hidden } = sectorLines(tabId, scope.id, data);
  const where = scope.id === 'world' ? 'World' : (scope.national ? `${countryLabel}, national figures` : (scope.state ? (rec?.country || placeLabel) : placeLabel));
  const head = `<div class="ss-head"><h3 class="ss-title">Share of the economy</h3><span class="ss-sub">${esc(where)} · World Bank, annual · latest vs prior year</span></div>`;
  if (!lines.length) {
    return `<section class="sector-strip" data-sector-strip="${esc(tabId)}" data-empty>${head}${notCoveredHtml({ planned: 'World Bank World Development Indicators', checked })}${hidden.length ? `<p class="ss-hidden">${esc(hidden.join(' '))}</p>` : ''}</section>`;
  }
  const items = lines.map((l) => `
      <li class="ss-line">
        <span class="ss-label">${esc(l.label)}</span>
        <span class="ss-val"><strong>${esc(fmtNumber(l.value, 1))}</strong> <span class="ss-unit">${esc(l.unit)}</span></span>
        ${l.change ? `<span class="ss-delta is-${l.change.dir}" title="${esc(`${l.change.label} vs ${l.prior.year}`)}">${l.change.arrow} ${esc(l.change.text)}</span>` : '<span class="ss-delta ink-mute">no prior year</span>'}
        <a class="ss-asof" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" title="World Bank ${esc(l.code)}">${l.year}${l.old ? ' · older figure' : ''}</a>
      </li>`).join('');
  return `<section class="sector-strip" data-sector-strip="${esc(tabId)}">${head}<ul class="ss-lines">${items}</ul>${hidden.length ? `<p class="ss-hidden">${esc(hidden.join(' '))}</p>` : ''}</section>`;
}

/** Electricity mix for a place's country (or the World), sorted by share. */
export function mixFor(place, mix, nowYear = new Date().getUTCFullYear()) {
  let scope = stripScope(place);
  // US states carry their own EIA mix (mix.states, merged in from us-states.json).
  const own = place?.level !== 'world' && place?.admin1 ? mix?.states?.[place.admin1] : null;
  if (own) scope = { id: place.admin1, national: false, state: true };
  const rec = own || (scope.id === 'world' ? mix?.world : mix?.countries?.[scope.id]);
  if (!rec || nowYear - rec.year > MAX_AGE_YEARS) return { scope, rec: null };
  const labels = Object.fromEntries((mix.sources || []).map((s) => [s.id, s.label]));
  const parts = Object.entries(rec.shares || {}).filter(([, v]) => Number.isFinite(v) && v > 0).map(([id, v]) => ({ id, label: labels[id] || id, share: v })).sort((a, b) => b.share - a.share);
  return { scope, rec, parts };
}

export function energyMixHtml(place, mix, { placeLabel = 'World', countryLabel = '', checked = '' } = {}) {
  const { scope, rec, parts } = mixFor(place, mix);
  const where = scope.id === 'world' ? 'World' : (scope.national ? `${countryLabel}, national figures` : (scope.state ? (rec?.country || placeLabel) : placeLabel));
  const head = `<div class="ss-head"><h3 class="ss-title">Electricity mix</h3><span class="ss-sub">${esc(where)} · share of generation${rec ? ` · ${rec.year}` : ''}</span></div>`;
  if (!rec) return `<section class="energy-mix" data-empty>${head}${notCoveredHtml({ planned: 'Our World in Data energy dataset (Ember, Energy Institute)', checked })}</section>`;
  const bar = parts.map((p) => `<span class="mix-seg mix-${esc(p.id)}" style="width:${Math.max(0.5, p.share)}%" title="${esc(p.label)} ${esc(fmtNumber(p.share, 1))}%"></span>`).join('');
  const legend = parts.map((p) => `<li><span class="mix-dot mix-${esc(p.id)}" aria-hidden="true"></span>${esc(p.label)} <strong>${esc(fmtNumber(p.share, p.share < 1 ? 1 : 0))}%</strong></li>`).join('');
  return `<section class="energy-mix" data-energy-mix>${head}
      <div class="mix-bar" role="img" aria-label="${esc(parts.map((p) => `${p.label} ${fmtNumber(p.share, 1)}%`).join(', '))}">${bar}</div>
      <ul class="mix-legend">${legend}</ul>
      <p class="ss-src">${rec.generationTWh ? `${esc(fmtNumber(rec.generationTWh, rec.generationTWh < 10 ? 1 : 0))} TWh generated in ${rec.year}. ` : ''}${rec.sourceUrl
        ? `Source: <a href="${esc(rec.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(rec.sourceName)}</a>, ${esc(rec.sourceText)}.`
        : `Source: <a href="${esc(mix.source)}" target="_blank" rel="noopener noreferrer">Our World in Data</a>, based on Ember and the Energy Institute Statistical Review (CC BY 4.0).`}</p>
    </section>`;
}
