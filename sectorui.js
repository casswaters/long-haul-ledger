/**
 * Long Haul Ledger: sector tab UI (Energy is the first instance).
 * Renders the overlay for any sector definition from sectors.js: the slot
 * list, per-source story column with labeled backfill, lifecycle stage chips
 * with their official references, and the precomputed "Top 4 this week" brief.
 * app.js supplies place names, the story card renderer and navigation.
 */
import {
  ECONOMIC_TYPES, OFFICIAL_SOURCES, naicsUrl, sectorColumn, sectorCounts, topChildren,
  briefFor, nearestParentBrief, briefHeading, briefAsOf, sectorTagsOf, inSentence,
} from './sectors.js';
import { placeLabel, parentPlace, LEVEL_NAMES } from './newsrank.js';

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
const esc = escapeHtml;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function dayLabel(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : 'n/a';
}

/** Plain stage label + official reference (economic type, NAICS codes, links). */
export function stageReference(stage) {
  const type = ECONOMIC_TYPES[stage.economicType];
  return {
    label: stage.label,
    typeLabel: `${type.label} sector`,
    typePlain: type.plain,
    codes: stage.naics.map((n) => ({ code: n.code, title: n.title, url: naicsUrl(n.code) })),
    summary: `${stage.label}: ${type.label} sector (${type.plain.toLowerCase()}). NAICS ${stage.naics.map((n) => n.code).join(', ')}.`,
  };
}

function stagePopHtml(stage, idx) {
  const ref = stageReference(stage);
  const codes = ref.codes.map((c) => `<li><a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">NAICS ${esc(c.code)}</a> ${esc(c.title)}</li>`).join('');
  return `<span class="stage-pop" role="tooltip" id="stage-pop-${idx}">
      <span class="stage-pop-h">${esc(ref.label)} = ${esc(ref.typeLabel)}</span>
      <span class="stage-pop-plain">${esc(ref.typePlain)}</span>
      <ul>${codes}</ul>
      <span class="stage-pop-src">Codes: <a href="${esc(OFFICIAL_SOURCES.naics.url)}" target="_blank" rel="noopener noreferrer">NAICS 2022, U.S. Census Bureau</a> · taxonomy: <a href="${esc(OFFICIAL_SOURCES.blsIndustries.url)}" target="_blank" rel="noopener noreferrer">BLS industries</a></span>
    </span>`;
}

/** Official reference for a tab or segment: economic type plus NAICS codes (or the Quinary convention). */
export function segmentReference(sector, sub = null) {
  const type = ECONOMIC_TYPES[sector.economicType];
  const naics = (sub ? sub.naics : sector.naics) || [];
  const label = sub ? sub.name : sector.label;
  return {
    label,
    typeLabel: type ? `${type.label} sector` : '',
    typePlain: type ? type.plain : '',
    codes: naics.map((n) => ({ code: n.code, title: n.title, url: naicsUrl(n.code) })),
    convention: sector.convention || null,
    summary: `${label}: ${type ? `${type.label} sector (${type.plain.toLowerCase()})` : ''}${naics.length ? `. NAICS ${naics.map((n) => n.code).join(', ')}` : ''}.`,
  };
}

function infoPopHtml(ref, id) {
  const codes = ref.codes.map((c) => `<li><a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">NAICS ${esc(c.code)}</a> ${esc(c.title)}</li>`).join('');
  const conv = ref.convention
    ? `<span class="stage-pop-conv">${esc(ref.convention.text)} <a href="${esc(ref.convention.source.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.convention.source.title)}</a></span>` : '';
  return `<span class="stage-pop" role="tooltip" id="${esc(id)}">
      <span class="stage-pop-h">${esc(ref.label)} = ${esc(ref.typeLabel)}</span>
      <span class="stage-pop-plain">${esc(ref.typePlain)}</span>
      ${codes ? `<ul>${codes}</ul>` : ''}
      ${conv}
      <span class="stage-pop-src">Codes: <a href="${esc(OFFICIAL_SOURCES.naics.url)}" target="_blank" rel="noopener noreferrer">NAICS 2022, U.S. Census Bureau</a> · taxonomy: <a href="${esc(OFFICIAL_SOURCES.blsIndustries.url)}" target="_blank" rel="noopener noreferrer">BLS industries</a></span>
    </span>`;
}

/** Small "i" button + popover (tap or hover) for an official reference. */
function infoChip(ref, id, extraClass = '') {
  return `<span class="stage-chip info-chip ${extraClass}"><button type="button" class="stage-info" aria-label="${esc(ref.label)}: official category" aria-expanded="false" aria-describedby="${esc(id)}" data-stage-info>i</button>${infoPopHtml(ref, id)}</span>`;
}

/** Brief text: @handles set as plain text in a subtle style (not links). */
function briefText(text) {
  return esc(text).replace(/(^|\s)@([A-Za-z0-9_]{1,15})\b/g, '$1<span class="handle">@$2</span>');
}

function placePath(place, names) {
  const bits = [];
  let p = parentPlace(place);
  while (p) { bits.unshift(p); p = parentPlace(p); }
  return bits.map((p) => `<button type="button" class="sector-crumb" data-splace="${esc(JSON.stringify(p))}">${esc(placeLabel(p, names))}</button><span class="bc-sep" aria-hidden="true">›</span>`).join('');
}

function cardsHtml(list, ctx) {
  const sub = ctx.state?.ssub || null;
  return list.map((it) => {
    const t = sectorTagsOf(ctx.sector, it);
    const stages = (t.stages || []).map((id) => ctx.sector.stages.find((s) => s.id === id)).filter(Boolean)
      .map((s) => `<span class="stage-tag" title="${esc(stageReference(s).summary)}">${esc(s.label)}</span>`).join('');
    // Cross-listed (e.g. an energy story filed here by its lifecycle stage): say where it came from.
    const viaKey = t.via ? (sub && t.via[sub] ? sub : (!sub ? Object.keys(t.via)[0] : null)) : null;
    let cross = '';
    if (viaKey) {
      const v = t.via[viaKey];
      const from = (ctx.sector.cross || []).find((c) => c.from.id === v.from)?.from;
      const st = from?.stages?.find((x) => x.id === v.stage);
      if (from && st) cross = `<span class="stage-tag cross-tag" data-cross="${esc(from.id)}" title="Cross-listed from the ${esc(from.label)} tab by its lifecycle stage">From ${esc(from.label)}: ${esc(st.label)}</span>`;
    }
    return ctx.card(it, stages + cross);
  }).join('');
}

function columnHtml(col, ctx) {
  let h = '';
  if (col.emptyText) h += `<p class="feed-note sector-empty" data-sector-empty>${esc(col.emptyText)}</p>`;
  h += cardsHtml(col.primary, ctx);
  if (col.fewText) h += `<p class="feed-note">${esc(col.fewText)}</p>`;
  for (const g of col.more) h += `<h4 class="feed-more-h" data-more-level="${esc(g.level)}">${esc(g.label)}</h4>${cardsHtml(g.items, ctx)}`;
  return h;
}

function briefHtml(ctx, subDef, brief) {
  const { sector, place, names } = ctx;
  const label = placeLabel(place, names);
  if (!brief) {
    const col = sectorColumn(ctx.items, place, sector, { sub: subDef.id, names, limit: 4 });
    const parent = nearestParentBrief(ctx.briefs, place, subDef.id);
    const parentBtn = parent
      ? `<button type="button" class="btn-ghost" data-splace="${esc(JSON.stringify(parent.place))}" data-sopen-brief>Read the brief for ${esc(inSentence(placeLabel(parent.place, names)))}</button>` : '';
    return `
      <div class="brief brief-missing" data-brief-missing>
        <p class="brief-wait"><strong>The ${esc(subDef.noun || subDef.name.toLowerCase())} brief for ${esc(inSentence(label))} isn't ready yet.</strong> Briefs are written from sourced stories by our research runs and published here once every fact is checked. Here are the top stories for now.</p>
        ${parentBtn ? `<div class="brief-actions">${parentBtn}</div>` : ''}
        <div class="sector-feed">${columnHtml(col, ctx)}</div>
      </div>`;
  }
  const items = brief.items.map((it) => {
    const src = it.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a> <span class="brief-date">${esc(dayLabel(s.date))}</span>`).join('<span class="brief-sep"> · </span>');
    return `<li class="brief-item"><p>${briefText(it.text)}</p><p class="brief-src"><span class="k">Sources</span> ${src}</p></li>`;
  }).join('');
  const asOf = briefAsOf(brief);
  return `
    <article class="brief" data-brief>
      <h3 class="brief-h">${esc(briefHeading(sector, subDef.id, brief.items.length))}${place.level === 'world' ? '' : ` <span class="brief-place">in ${esc(inSentence(label))}</span>`}</h3>
      <p class="brief-meta">Written ${esc(dayLabel(brief.generated_at))} · latest source ${esc(dayLabel(asOf))}${brief.stale ? ' · <span class="stale-flag" data-brief-stale>older than 7 days</span>' : ''}</p>
      <ol class="brief-list">${items}</ol>
      ${brief.checked ? `<p class="brief-foot">${esc(brief.checked)}</p>` : ''}
    </article>`;
}

function detailHtml(ctx, counts) {
  const { sector, place, names, state } = ctx;
  const label = placeLabel(place, names);
  const subDef = sector.subs.find((s) => s.id === state.ssub);
  if (!subDef) {
    const col = sectorColumn(ctx.items, place, sector, { names, limit: 6 });
    return `
      <div class="sector-overview">
        <h3 class="sector-detail-h">Top ${esc(sector.label.toLowerCase())} stories, ${esc(label)}</h3>
        <p class="section-note">Pick a ${esc(sector.subNoun || 'source')} for its own stories and the Top 4 brief.</p>
        <div class="sector-feed">${columnHtml(col, ctx)}</div>
      </div>`;
  }
  const n = sector.subs.indexOf(subDef) + 1;
  const back = `<button type="button" class="sector-back" data-sback>‹ All ${esc(sector.subsNoun || 'sources')}</button>`;
  const brief = briefFor(ctx.briefs, place, subDef.id);
  if (state.sbrief) {
    return `
      <div class="sector-sub" data-sub="${esc(subDef.id)}">
        <div class="sector-sub-nav">${back}<button type="button" class="sector-back" data-sbrief-close>‹ ${esc(subDef.name)} stories</button></div>
        ${briefHtml(ctx, subDef, brief)}
      </div>`;
  }
  const stage = ctx.stage && sector.stages.some((s) => s.id === ctx.stage) ? ctx.stage : null;
  const col = sectorColumn(ctx.items, place, sector, { sub: subDef.id, stage, names });
  const sc = counts.stages[subDef.id] || {};
  const chips = !sector.stages.length ? '' : [`<button type="button" class="ncat${stage ? '' : ' active'}" data-sstage="" aria-pressed="${!stage}">All <span class="vf-n">${counts.subs[subDef.id] || 0}</span></button>`]
    .concat(sector.stages.map((s, i) => `
      <span class="stage-chip">
        <button type="button" class="ncat${stage === s.id ? ' active' : ''}" data-sstage="${esc(s.id)}" aria-pressed="${stage === s.id}" title="${esc(stageReference(s).summary)}">${esc(s.label)} <span class="vf-n">${sc[s.id] || 0}</span></button><button type="button" class="stage-info" aria-label="${esc(s.label)}: official category" aria-expanded="false" aria-describedby="stage-pop-${i}" data-stage-info>i</button>${stagePopHtml(s, i)}
      </span>`)).join('');
  const kids = topChildren(ctx.items, place, sector, { sub: subDef.id });
  const kidsHtml = kids.length ? `
    <div class="sector-kids"><span class="k">Most ${esc(subDef.noun || subDef.name.toLowerCase())} stories</span>
      ${kids.map((k) => `<button type="button" class="chip" data-splace="${esc(JSON.stringify({ level: k.level, country: k.country, admin1: k.level === 'admin1' ? k.id : null, city: null }))}">${esc(k.level === 'country' ? names.country(k.id) : names.admin1(k.id))} <span class="vf-n">${k.count}</span></button>`).join('')}
    </div>` : '';
  const showAll = ctx.expanded ? col.ranked.slice(0, 30) : null;
  return `
    <div class="sector-sub" data-sub="${esc(subDef.id)}">
      <div class="sector-sub-nav">${back}</div>
      <div class="sector-sub-head">
        <div class="sector-sub-title"><h3 class="sector-detail-h"><span class="slot-n">${n}</span> ${esc(subDef.name)}</h3>${subDef.naics ? infoChip(segmentReference(sector, subDef), `seg-pop-${subDef.id}`, 'seg-info') : ''}</div>
        <p class="slot-copy-lg">${esc(subDef.copy)}</p>
      </div>
      <div class="brief-cta">
        <button type="button" class="btn-primary brief-btn" data-sbrief-open aria-controls="sector-detail">Top 4 this week</button>
        <span class="brief-status ${brief ? 'is-ready' : 'is-wait'}">${brief ? `Brief ready · ${esc(label)} · written ${esc(dayLabel(brief.generated_at))}${brief.stale ? ' · older than 7 days' : ''}` : `Brief not ready yet for ${esc(label)}`}</span>
      </div>
      ${chips ? `<div class="ncats stage-chips" role="group" aria-label="Filter by lifecycle stage">${chips}</div>` : ''}
      <div class="sector-feed" aria-live="polite">${showAll ? cardsHtml(showAll, ctx) : columnHtml(col, ctx)}</div>
      ${!showAll && col.total > col.primary.length ? `<button type="button" class="feed-more-btn" data-sexpand>Show all ${Math.min(col.total, 30)} ${esc(subDef.noun || subDef.name.toLowerCase())} stories for ${esc(label)}</button>` : ''}
      ${showAll ? `<button type="button" class="feed-more-btn" data-scollapse>Show top stories only</button>` : ''}
      ${kidsHtml}
      <p class="sector-foot">${sector.stages.length
        ? 'Stories are filed to a source and a stage by keyword rules on the headline and summary; tags can be wrong.'
        : `Stories are filed to a segment by keyword rules on the headline and summary${(sector.cross || []).length ? ', and energy stories also by their lifecycle stage' : ''}; tags can be wrong.`} Every story links to its outlet. <a href="#about" data-smethod>How this works</a></p>
    </div>`;
}

/** Full overlay HTML for the sector tab at the current place. */
export function renderSectorOverlay(ctx) {
  const { sector, place, names, state } = ctx;
  const label = placeLabel(place, names);
  const counts = sectorCounts(ctx.items, place, sector);
  const headPlace = inSentence(label);
  const slots = sector.subs.map((s, i) => {
    const active = state.ssub === s.id;
    const hasBrief = !!briefFor(ctx.briefs, place, s.id);
    const n = counts.subs[s.id] || 0;
    return `<li><button type="button" class="sector-slot${active ? ' active' : ''}" data-ssub="${esc(s.id)}" ${active ? 'aria-current="true"' : ''}>
        <span class="slot-top"><span class="slot-n">${i + 1}</span><span class="slot-name">${esc(s.name)}</span>${hasBrief ? '<span class="slot-brief" title="Top 4 brief ready">Brief</span>' : ''}<span class="slot-count${n ? '' : ' is-zero'}" title="${n} recent ${esc(s.noun || s.name.toLowerCase())} stories tagged to ${esc(label)}">${n}</span></span>
        <span class="slot-copy">${esc(s.copy)}</span>
      </button></li>`;
  }).join('');
  // Sectors of the Economy = the five tabs with an economic type (Primary to Quinary).
  // Energy is separate: its own featured tab, no window title, no switcher, no type label.
  const econ = !!sector.economicType;
  const group = econ ? (ctx.tabs || []).filter((t) => t.economicType) : [];
  const typeLabel = (t) => ECONOMIC_TYPES[t.economicType]?.label || '';
  const windowBar = econ ? `
      <div class="sector-window-bar">
        <h2 class="sector-window-title" id="sector-window-title">Sectors of the Economy</h2>
        ${group.length > 1 ? `<div class="sector-switch" role="group" aria-label="Switch sector">${group.map((t) => {
          const cur = t.id === sector.id;
          return `<button type="button" class="sswitch${cur ? ' is-current' : ''}" data-sswitch="${esc(t.id)}" aria-label="${esc(t.label)}, ${esc(typeLabel(t))} sector" title="${esc(t.label)} · ${esc(typeLabel(t))}"${cur ? ' aria-current="true"' : ''}><span aria-hidden="true">${t.emoji || esc(t.label.slice(0, 1))}</span></button>`;
        }).join('')}</div>` : ''}
      </div>` : '';
  return `
    <div class="overlay-panel sector-panel${econ ? ' is-economy' : ''}" role="dialog" aria-modal="true" aria-labelledby="${econ ? 'sector-window-title ' : ''}sector-title" data-sector-tab="${esc(sector.id)}">${windowBar}
      <div class="overlay-head sector-head">
        <div class="sector-head-main">
          <div class="overlay-kicker">${sector.emoji ? `<span aria-hidden="true">${sector.emoji}</span> ` : ''}<span class="kicker-name">${esc(sector.label)}</span>${econ ? ` · <span class="kicker-official" title="${esc(sector.officialName)}">${esc(typeLabel(sector))}</span>${infoChip(segmentReference(sector), `tab-pop-${sector.id}`, 'tab-info')}` : ''} · ${esc(LEVEL_NAMES[place.level])}</div>
          <nav class="sector-path" aria-label="Place">${placePath(place, names)}</nav>
          <h2 id="sector-title" tabindex="-1">${esc(label)}</h2>
          <p class="overlay-hint">${esc(sector.headline(headPlace))}</p>
        </div>
        <div class="overlay-actions">
          <button type="button" class="btn-ghost" data-sclose title="Close and pick a place on the map">Change place</button>
          <button type="button" class="btn-primary" data-sclose aria-label="Close ${esc(sector.label)}">Close</button>
        </div>
      </div>
      <div class="sector-body${state.ssub ? ' has-sub' : ''}">
        <ol class="sector-list" aria-label="${esc(sector.label)} ${esc(sector.subsNoun || 'sources')}">${slots}</ol>
        <section class="sector-detail" id="sector-detail" aria-label="Details">${detailHtml(ctx, counts)}</section>
      </div>
    </div>`;
}

/** Wire clicks/keys. `act` = { selectSub, openBrief, closeBrief, setStage, goPlace, close, expand, method }. */
export function wireSectorOverlay(root, act) {
  root.querySelectorAll('[data-ssub]').forEach((b) => b.addEventListener('click', () => act.selectSub(b.dataset.ssub)));
  root.querySelectorAll('[data-sswitch]').forEach((b) => b.addEventListener('click', () => { if (!b.classList.contains('is-current')) act.switchTab?.(b.dataset.sswitch); }));
  // Left/Right moves between sectors in the switcher.
  const sw = root.querySelector('.sector-switch');
  sw?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const btns = [...sw.querySelectorAll('.sswitch')];
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length].focus();
  });
  root.querySelectorAll('[data-sclose]').forEach((b) => b.addEventListener('click', () => act.close()));
  root.querySelectorAll('[data-sback]').forEach((b) => b.addEventListener('click', () => act.selectSub(null)));
  root.querySelectorAll('[data-sbrief-open]').forEach((b) => b.addEventListener('click', () => act.openBrief()));
  root.querySelectorAll('[data-sbrief-close]').forEach((b) => b.addEventListener('click', () => act.closeBrief()));
  root.querySelectorAll('[data-sstage]').forEach((b) => b.addEventListener('click', () => act.setStage(b.dataset.sstage || null)));
  root.querySelectorAll('[data-sexpand]').forEach((b) => b.addEventListener('click', () => act.expand(true)));
  root.querySelectorAll('[data-scollapse]').forEach((b) => b.addEventListener('click', () => act.expand(false)));
  root.querySelectorAll('[data-smethod]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); act.method(); }));
  root.querySelectorAll('[data-splace]').forEach((b) => b.addEventListener('click', () => {
    let p = null;
    try { p = JSON.parse(b.dataset.splace); } catch { p = null; }
    if (p) act.goPlace(p, { brief: b.hasAttribute('data-sopen-brief') });
  }));
  root.querySelectorAll('[data-stage-info]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const wrap = b.closest('.stage-chip');
    const open = !wrap.classList.contains('open');
    root.querySelectorAll('.stage-chip.open').forEach((w) => { w.classList.remove('open'); w.querySelector('[data-stage-info]')?.setAttribute('aria-expanded', 'false'); });
    wrap.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
  }));
  // Up/Down moves between source slots.
  const list = root.querySelector('.sector-list');
  list?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const btns = [...list.querySelectorAll('.sector-slot')];
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    btns[(i + (e.key === 'ArrowDown' ? 1 : btns.length - 1)) % btns.length].focus();
  });
  root.onclick = (e) => {
    if (e.target === root) act.close();
    if (!e.target.closest?.('.stage-chip')) root.querySelectorAll('.stage-chip.open').forEach((w) => { w.classList.remove('open'); w.querySelector('[data-stage-info]')?.setAttribute('aria-expanded', 'false'); });
  };
}
