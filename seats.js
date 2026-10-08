/**
 * Long Haul Ledger: "Who's in the seat" (key seats for the selected place).
 * Agency heads, regulators, the central bank and key boards, each listed only
 * after it is confirmed on an official page, with the source link and the date
 * it was checked. Recent seat changes come from the same file and from the news
 * column (stories whose headline reports a confirmation, appointment or resignation).
 * Later: each seat links to its "Most reliable voices" profile (ROADMAP Phase 5).
 */
import { notCoveredHtml } from './whatchanged.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dayText = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : '';
};

/** Problems with a seats file (empty = OK). Every seat needs a name, an official https source and a checked date. */
export function validateSeats(data) {
  const p = [];
  if (!data || typeof data !== 'object' || !data.places) return ['missing places'];
  for (const [key, blk] of Object.entries(data.places)) {
    for (const s of blk.seats || []) {
      if (!s.seat || !s.name) p.push(`${key}: seat without a name`);
      if (/\(see |SAMPLE|ESTIMATE|unknown/i.test(`${s.name} ${s.seat}`)) p.push(`${key}: placeholder in ${s.seat}`);
      if (!/^https:\/\//.test(s.sourceUrl || '')) p.push(`${key}: ${s.seat} has no https source`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.checked || '')) p.push(`${key}: ${s.seat} has no checked date`);
      if (s.since != null && !/^\d{4}-\d{2}-\d{2}$/.test(s.since)) p.push(`${key}: ${s.seat} since must be YYYY-MM-DD`);
    }
    for (const c of blk.changes || []) {
      if (!/^https:\/\//.test(c.sourceUrl || '') || !/^\d{4}-\d{2}-\d{2}$/.test(c.date || '')) p.push(`${key}: change without source/date`);
    }
  }
  return p;
}

/** Seat-change headlines: a confirmation, appointment, nomination, resignation or ouster in a named seat. */
const SEAT_WORDS = '(?:chair(?:man|woman|person)?|vice chair|secretary|commissioner|administrator|governor|central bank (?:chief|head|governor)|Fed (?:chair|governor)|regulator(?:\'s)? (?:chief|head)|minister|board member|president of the (?:Fed|Federal Reserve|central bank|World Bank)|director general)';
const ACTION_WORDS = '(?:confirm(?:s|ed)?|sworn in|swears in|appoint(?:s|ed)?|nominat(?:es|ed)|names|named|taps|tapped|picks|picked|resign(?:s|ed)?|steps? down|stepped down|ousted|fired|removed|replac(?:es|ed)|to (?:lead|head|chair|succeed))';
const SEAT_RE = new RegExp(`\\b${ACTION_WORDS}\\b[^.]{0,80}\\b${SEAT_WORDS}\\b|\\b${SEAT_WORDS}\\b[^.]{0,80}\\b${ACTION_WORDS}\\b`, 'i');
const NOT_SEAT = /\b(?:confirmed (?:cases|deaths|reserves|orders)|stock|shares rise|game|coach|season|player)\b/i;

export function isSeatChange(item) {
  const t = String(item?.title || '');
  return SEAT_RE.test(t) && !NOT_SEAT.test(t);
}

/** Model for a place: { seats, changes, planned, checked }. */
export function seatsFor(place, data) {
  const p = place || { level: 'world' };
  const key = p.level === 'country' ? p.country : (p.level === 'world' ? 'world' : (p.level === 'admin1' ? p.admin1 : p.city));
  const blk = data?.places?.[key] || null;
  return {
    key,
    seats: blk?.seats || [],
    changes: (blk?.changes || []).slice().sort((a, b) => b.date.localeCompare(a.date)),
    planned: data?.planned?.[p.level] || data?.planned?.country || '',
    checked: data?.checked || '',
  };
}

/** The accordion. `news` = seat-change stories already filtered to this place. */
export function seatsHtml(model, { placeLabel = '', news = [], open = false, parentLabel = '', parentAttr = '' } = {}) {
  const rows = model.seats.map((s) => `
    <li class="seat">
      <div class="seat-top"><span class="seat-name">${esc(s.seat)}</span><span class="seat-holder">${esc(s.name)}</span></div>
      <div class="seat-meta">${s.since ? `<span>Since ${esc(dayText(s.since))}${s.sinceNote ? ` (${esc(s.sinceNote)})` : ''}</span> · ` : ''}<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(s.sourceName || 'Official page')}</a> · <span>checked ${esc(dayText(s.checked))}</span></div>
    </li>`).join('');
  const changes = model.changes.slice(0, 4).map((c) => `
    <li class="seat-change"><span class="seat-date">${esc(dayText(c.date))}</span> ${esc(c.text)} <a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(c.sourceName || 'Source')}</a></li>`).join('');
  const inNews = news.slice(0, 4).map((i) => `
    <li class="seat-change"><span class="seat-date">${esc(dayText(i.published))}</span> <a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)}</a> <span class="ink-mute">${esc(i.source || '')}</span></li>`).join('');
  const body = model.seats.length
    ? `<ul class="seat-list">${rows}</ul>`
    : notCoveredHtml({ field: 'Key seats', planned: model.planned, checked: dayText(model.checked), parentLabel, parentAttr });
  return `
    <details class="leadership-acc seats-acc" id="seats-panel"${open ? ' open' : ''}>
      <summary>Who's in the seat <span class="tier-tag">official pages only</span></summary>
      <div class="leadership-body">
        <p class="section-note">Agency heads, regulators, the central bank and key boards${placeLabel ? ` for ${esc(placeLabel)}` : ''}. A seat is listed only after the holder is confirmed on an official page; each shows its source and the date we checked.</p>
        ${body}
        ${changes ? `<h4 class="seat-h">Recent seat changes</h4><ul class="seat-changes">${changes}</ul>` : ''}
        ${inNews ? `<h4 class="seat-h">Seat changes in the news</h4><ul class="seat-changes">${inNews}</ul>` : ''}
      </div>
    </details>`;
}
