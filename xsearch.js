/**
 * Long Haul Ledger: "See what people are saying on X" links.
 * A plain link to X's public live search for a story or a panel topic. No X API,
 * no embeds and no posts on the site; the news column stays direct-to-source.
 */
export const X_LABEL = 'See what people are saying on X';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STOP = new Set(('a an the and or but nor of in on at to for from by with without into onto over under after before about as is are was were be been being '
  + 'its it this that these those their his her our your my we they he she you i not no new says said say will would could should may might can '
  + 'why how what when where who whom which while amid than then more most less least up down out off again just also still now here there '
  + 'report reports update updates news week weeks today year years day days first last next top big plan plans deal deals set sets gets get '
  + 'make makes made back like over near via per vs us uk eu').split(/\s+/));
const LEAD = new Set('why how what when where who the a an as after amid inside exclusive analysis opinion explainer breaking watch live update'.split(' '));
const MONTH = /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
const JOIN = new Set(['of', 'de', 'du', 'la', 'del', 'van', 'von']);

/** Headline verbs and filler that make poor search terms. */
const GENERIC = new Set(('raises raise nears near tries try squeeze find finds common leaders association doubles double tapping taps hidden device could '
  + 'begins begin starts start drops drop hands cheaper running problem boom form forms focused available publicly cooperate teams team dies '
  + 'creates create opportunities imbalance picks pick sectors powers power continuous scalable solution deployed commissioned citizens vote '
  + 'man woman people free ahead amid against across around global markets major record higher lower rise rises fall falls cuts cut seeks seek announces announced').split(/\s+/));

const clean = (w) => w.replace(/^[^\w$]+|[^\w%]+$/g, '').replace(/'s$/i, '');
const isCap = (w) => /^[A-Z]/.test(w);
const isAcronym = (w) => /^[A-Z][A-Z0-9&.-]{1,}$/.test(w) && w.replace(/[^A-Z]/g, '').length >= 2;

/** Key terms from a headline: named entities first (quoted when multi-word), then keywords. 2 to 5 terms. */
export function keyTerms(title) {
  const raw = String(title || '').replace(/[’‘]/g, "'").replace(/[“”"]/g, ' ').replace(/\s+[-–|]\s+.*$/, '').split(/\s+/).filter(Boolean);
  const words = [];
  const breaks = new Set();
  raw.forEach((r) => { const w = clean(r); if (!w) return; words.push(w); if (/[,:;?!]$/.test(r)) breaks.add(words.length - 1); });
  if (!words.length) return [];
  const caps = words.filter(isCap).length;
  const titleCase = caps / words.length > 0.6;
  const terms = [];
  const push = (t) => { const k = t.toLowerCase(); if (t && !terms.some((x) => x.toLowerCase() === k)) terms.push(t); };
  if (!titleCase) {
    // Runs of capitalized words (with short joiners inside) are names.
    let run = [];
    const flush = () => {
      while (run.length && JOIN.has(run[run.length - 1].toLowerCase())) run.pop();
      if (run.length) {
        const name = run.join(' ');
        const single = run.length === 1 ? run[0] : null;
        if (!(single && (STOP.has(single.toLowerCase()) || LEAD.has(single.toLowerCase()) || MONTH.test(single)))) push(name);
      }
      run = [];
    };
    words.forEach((w, i) => {
      if (isCap(w) && !(i === 0 && !isAcronym(w) && !isCap(words[1] || '') && (STOP.has(w.toLowerCase()) || LEAD.has(w.toLowerCase())))) run.push(w);
      else if (run.length && JOIN.has(w.toLowerCase()) && isCap(words[i + 1] || '')) run.push(w);
      else flush();
      if (breaks.has(i)) flush();
    });
    flush();
  } else {
    // Title Case headline: the opening name (usually the subject), then acronyms.
    const first = [];
    for (let i = 0; i < words.length && first.length < 3; i++) {
      const w = words[i];
      if (i === 0 && (LEAD.has(w.toLowerCase()) || STOP.has(w.toLowerCase()))) break;
      if (STOP.has(w.toLowerCase()) || GENERIC.has(w.toLowerCase())) break;
      first.push(w);
      if (breaks.has(i)) break;
      if (!isAcronym(w) && first.length >= 1 && !isCap(words[i + 1] || '')) break;
      if (first.length === 2) break;
    }
    if (first.length) push(first.join(' '));
    for (const w of words) if (isAcronym(w) && !STOP.has(w.toLowerCase())) push(w);
  }
  // Fill with content words (longest first) up to 4 terms, never past 5.
  const content = words.filter((w) => !STOP.has(w.toLowerCase()) && !LEAD.has(w.toLowerCase()) && !GENERIC.has(w.toLowerCase()) && !MONTH.test(w) && w.length >= 4 && /[a-z]/i.test(w) && !/^\$|^\d/.test(w));
  const byLen = [...content].sort((a, b) => b.length - a.length);
  for (const w of byLen) {
    if (terms.length >= 4) break;
    if (terms.some((t) => t.toLowerCase().split(' ').includes(w.toLowerCase()))) continue;
    push(w);
  }
  return terms.slice(0, 5);
}

const quote = (t) => (/\s/.test(t) ? `"${t}"` : t);

export function xQueryForStory(item) {
  const terms = keyTerms(item?.title);
  return terms.map(quote).join(' ');
}

/** Topic words for each Energy source (a lone "Emerging" or "Wind" searches poorly). */
export const X_TOPICS = {
  'energy/nuclear': '"nuclear power"', 'energy/oil': 'oil', 'energy/gas': '"natural gas"', 'energy/coal': 'coal',
  'energy/wind': '"wind power"', 'energy/solar': '"solar power"', 'energy/hydro': 'hydropower', 'energy/geothermal': 'geothermal',
  'energy/emerging': '(hydrogen OR biofuel OR "battery storage")', 'materials/oilgas': '"oil and gas"',
};

/** A segment name as search words: "Metals, cement and glass" becomes (metals OR cement OR glass). */
export function topicFromName(name) {
  const n = String(name || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const parts = n.split(/,\s*|\s+and\s+/i).map((x) => x.trim()).filter(Boolean)
    .map((x) => (/^[A-Z]{2,}$/.test(x) ? x : x.toLowerCase()));
  if (parts.length <= 1) return quote(parts[0] || n);
  return `(${parts.map(quote).join(' OR ')})`;
}

/** Panel query: the source or segment name, plus the place when it is not World. */
export function xQueryForPanel(name, placeLabel = '', { tab = '', sub = '' } = {}) {
  const bits = [X_TOPICS[`${tab}/${sub}`] || topicFromName(name)];
  if (placeLabel && placeLabel !== 'World') bits.push(quote(placeLabel));
  return bits.join(' ');
}

export function xSearchUrl(query) {
  return `https://x.com/search?q=${encodeURIComponent(query)}&f=live`;
}

/** The quiet secondary link. Opens X live search in a new tab. */
export function xLinkHtml(query, { cls = '' } = {}) {
  if (!query) return '';
  return `<a class="x-link${cls ? ` ${cls}` : ''}" href="${esc(xSearchUrl(query))}" target="_blank" rel="noopener noreferrer" title="Live search on X: ${esc(query)}">${X_LABEL}</a>`;
}
