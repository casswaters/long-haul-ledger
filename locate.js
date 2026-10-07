/**
 * Long Haul Ledger: deterministic location tagging + topic category for feed items.
 * Gazetteer match on title/summary (country names, demonyms, capitals/major cities,
 * state equivalents) with explicit disambiguation rules for names that are also
 * people, food or other places (Georgia, Jordan, Chad, Niger, Turkey, Washington…).
 * Pure functions; used by scripts/fetch-signals.mjs (pipeline) and tests.
 */
import { COUNTRY_NAMES, COUNTRY_ALIASES, DEMONYMS, ADMIN1_NAMES, CITY_STOP } from './places.js';

export const CATEGORIES = ['energy', 'infrastructure', 'industry', 'geopolitics'];
export const CATEGORY_LABELS = { energy: 'Energy', infrastructure: 'Infrastructure', industry: 'Industry', geopolitics: 'Geopolitics', general: 'General' };

const WORD = '\\p{L}\\p{N}';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- context helpers ---------- */
function prevWord(text, start) {
  const m = text.slice(Math.max(0, start - 40), start).match(/([\p{L}][\p{L}.'’-]*)[\s,]*$/u);
  return m ? m[1] : '';
}
function nextWord(text, end) {
  const m = text.slice(end, end + 40).match(/^(?:['’]s)?[\s,]+([\p{L}][\p{L}.'’-]*)/u);
  return m ? m[1] : '';
}
const isCap = (w) => /^\p{Lu}/u.test(w || '');
const atSentenceStart = (text, start) => start === 0 || /[.!?:\n]\s*$/.test(text.slice(Math.max(0, start - 4), start));
const PREPS = new Set(['in', 'to', 'from', 'with', 'and', 'of', 'for', 'neighbouring', 'neighboring', 'via', 'across', 'into', 'near', 'by', 'between', 'on', 'at', 'against']);

/** Country-or-person names (Jordan, Chad, Niger): need a place cue, a preposition, or regional context. */
function placeOrPerson(id, cues, region, { rejectAfter = null } = {}) {
  return (ctx) => {
    const { text, start, end, full } = ctx;
    const after = text.slice(end, end + 20);
    if (rejectAfter && rejectAfter.test(after)) return null;
    const prev = prevWord(text, start);
    const next = nextWord(text, end);
    const possessive = /^['’]s\b/.test(after);
    if (!possessive && isCap(next) && !/^(?:and|or)$/i.test(next)) return null; // "Jordan Peterson", "Chad Smith"
    if (isCap(prev) && !atSentenceStart(text, start) && !PREPS.has(prev.toLowerCase())) return null; // "Michael Jordan"
    if (cues.test(full) || region.test(full) || PREPS.has(prev.toLowerCase())) return [{ type: 'country', id }];
    return null;
  };
}

const GE_CUES = /Tbilisi|Georgian Dream|Caucasus|Abkhaz|Ossetia|Batumi|Kobakhidze|Kavelashvili|Republic of Georgia|Black Sea|Armenia|Azerbaijan/;
const US_GA_CUES = /Atlanta|Savannah|\bKemp\b|Georgia Power|Vogtle|Augusta|Macon|Peach State|Fulton County|Raffensperger|Georgia,\s*U\.?S|Hyundai|Qcells|Rivian|U\.S\. state/;
const TURKEY_FOOD = /thanksgiving|roast|poultry|bird flu|avian|gobble|cold turkey|turkeys|turkey (?:sandwich|dinner|farm|breast|hunt|vulture)/i;

/** Rules for names that need context. Each returns targets or null (= no tag). */
const RULES = {
  Georgia: (ctx) => {
    if (GE_CUES.test(ctx.full)) return [{ type: 'country', id: 'ge' }];
    if (US_GA_CUES.test(ctx.full) || ctx.home === 'us') return [{ type: 'admin1', id: 'us-ga' }];
    return null;
  },
  Georgian: (ctx) => (GE_CUES.test(ctx.full) ? [{ type: 'country', id: 'ge' }] : null),
  Jordan: placeOrPerson('jo', /Amman|Jordanian|Hashemite|King Abdullah|Aqaba/, /Israel|Syria|Iraq|Saudi|Egypt|Lebanon|Gaza|West Bank|Middle East/),
  Chad: placeOrPerson('td', /N['’]?Djamena|Chadian|Lake Chad|Déby|Deby/, /Sudan|Libya|Cameroon|Sahel|Darfur|Nigeria\b|Niger\b/),
  Niger: placeOrPerson('ne', /Niamey|Nigerien|Tiani|Agadez|Orano|Arlit/, /Sahel|Mali|Burkina|ECOWAS|junta|Chad\b/, { rejectAfter: /^\s+(?:Delta|River|State)\b/ }),
  Turkey: (ctx) => (TURKEY_FOOD.test(ctx.full) ? null : [{ type: 'country', id: 'tr' }]),
  Washington: (ctx) => {
    const next = nextWord(ctx.text, ctx.end);
    const prev = prevWord(ctx.text, ctx.start);
    if (/^(?:Post|Commanders|Nationals|Capitals|Wizards|Mystics|Huskies)$/.test(next) || prev === 'George' || prev === 'Denzel') return null;
    return [{ type: 'country', id: 'us' }];
  },
  'New York': (ctx) => {
    const next = nextWord(ctx.text, ctx.end);
    if (/^(?:Times|Post|Yankees|Mets|Knicks|Giants|Jets|Rangers|Islanders|Liberty|Fed|Stock)$/.test(next)) return [{ type: 'country', id: 'us' }];
    return [{ type: 'city', id: 'us-city-new-york', country: 'us', admin1: 'us-ny' }, { type: 'admin1', id: 'us-ny' }];
  },
  'New York City': () => [{ type: 'city', id: 'us-city-new-york', country: 'us', admin1: 'us-ny' }, { type: 'admin1', id: 'us-ny' }],
  NYC: () => [{ type: 'city', id: 'us-city-new-york', country: 'us', admin1: 'us-ny' }, { type: 'admin1', id: 'us-ny' }],
  US: (ctx) => (/^\s?\$/.test(ctx.text.slice(ctx.end, ctx.end + 2)) ? null : [{ type: 'country', id: 'us' }]),
  America: (ctx) => (/^(?:Latin|South|Central|North|Corporate)$/.test(prevWord(ctx.text, ctx.start)) ? null : [{ type: 'country', id: 'us' }]),
  American: (ctx) => (/^(?:Latin|South|Central|North|Native|African|Asian|Mexican|Pan|Hispanic)$/.test(prevWord(ctx.text, ctx.start).replace(/-$/, '')) ? null : [{ type: 'country', id: 'us' }]),
  Americans: (ctx) => (/^(?:Latin|South|Central|North|Native|African|Asian|Mexican)$/.test(prevWord(ctx.text, ctx.start)) ? null : [{ type: 'country', id: 'us' }]),
  Indian: (ctx) => (/^\s+Ocean/.test(ctx.text.slice(ctx.end, ctx.end + 8)) || /^(?:American|Native)$/.test(prevWord(ctx.text, ctx.start)) ? null : [{ type: 'country', id: 'in' }]),
  Mexico: (ctx) => (/Gulf of\s*$/.test(ctx.text.slice(Math.max(0, ctx.start - 10), ctx.start)) ? null : [{ type: 'country', id: 'mx' }]),
  Guinea: (ctx) => (/Gulf of\s*$/.test(ctx.text.slice(Math.max(0, ctx.start - 10), ctx.start)) ? null : [{ type: 'country', id: 'gn' }]),
  Congo: (ctx) => (/^\s+(?:River|Basin)\b/.test(ctx.text.slice(ctx.end, ctx.end + 8)) ? null : [{ type: 'country', id: 'cd' }]),
  Korea: () => [{ type: 'country', id: 'kr' }],
  Korean: () => [{ type: 'country', id: 'kr' }],
  'Niger Delta': () => [{ type: 'country', id: 'ng' }],
  'Lake Chad': () => [{ type: 'country', id: 'td' }],
  'South Georgia': () => null,
  'Gulf of Mexico': () => null,
  'Gulf of Guinea': () => null,
  'New Guinea': () => null,
};

/** Countries whose bare name needs a rule (never matched from COUNTRY_NAMES directly). */
const RULE_COUNTRIES = new Set(['ge', 'jo', 'td', 'ne', 'mx', 'gn']);

/**
 * Build the phrase index. `cities` = features (or property objects) from data/geo/cities.geojson.
 * Returns { phrases } sorted longest-first so "New Mexico" wins over "Mexico".
 */
export function buildGazetteer({ cities = [] } = {}) {
  const map = new Map(); // text → { text, targets[], rule? }
  const add = (text, target) => {
    if (!text) return;
    const e = map.get(text) || { text, targets: [] };
    if (target && !e.targets.some((t) => t.type === target.type && t.id === target.id)) e.targets.push(target);
    map.set(text, e);
  };
  for (const [id, name] of Object.entries(COUNTRY_NAMES)) if (!RULE_COUNTRIES.has(id)) add(name, { type: 'country', id });
  for (const [id, names] of Object.entries(COUNTRY_ALIASES)) for (const n of names) add(n, { type: 'country', id });
  for (const [id, names] of Object.entries(DEMONYMS)) for (const n of names) add(n, { type: 'country', id });
  for (const [id, names] of Object.entries(ADMIN1_NAMES)) for (const n of names) add(n, { type: 'admin1', id });
  const props = cities.map((c) => c.properties || c);
  const counts = new Map();
  for (const p of props) counts.set(p.name, (counts.get(p.name) || 0) + 1);
  const countryNameSet = new Set(Object.values(COUNTRY_NAMES));
  for (const p of props) {
    const name = String(p.name || '').replace(/\s+/g, ' ').trim();
    if (!name || name.length < 4 || CITY_STOP.has(name) || CITY_STOP.has(p.name) || counts.get(p.name) > 1 || countryNameSet.has(name)) continue;
    const major = (p.pop || 0) >= 500000 || p.capital || ['us', 'ca', 'de', 'au', 'gb'].includes(p.country);
    if (!major) continue;
    add(name, { type: 'city', id: p.id, country: p.country, admin1: p.admin1 });
  }
  for (const k of Object.keys(RULES)) { const e = map.get(k) || { text: k, targets: [] }; e.rule = RULES[k]; map.set(k, e); }
  const phrases = [...map.values()].sort((a, b) => b.text.length - a.text.length);
  for (const p of phrases) p.re = new RegExp(`(?<![${WORD}])${esc(p.text)}(?![${WORD}])`, 'gu');
  return { phrases };
}

let defaultGaz = null;
export function defaultGazetteer() { return defaultGaz || (defaultGaz = buildGazetteer()); }

const countryOf = (t) => t.country || (t.type === 'country' ? t.id : String(t.id).split('-')[0]);

/**
 * Tag one item. Returns { countries[], admin1[], cities[], titleCountries[], basis }.
 * basis: 'text' (gazetteer hit), 'source' (no hit; outlet's home country assumed), or 'none' (world-level only).
 * alwaysHome: official sources (primary=true, assumeHome) always include their home country first.
 */
export function tagLocation({ title = '', summary = '', home = null, assumeHome = false, alwaysHome = false } = {}, gaz = defaultGazetteer()) {
  const t = String(title || ''), s = String(summary || '');
  const text = `${t}\n${s}`;
  const titleEnd = t.length;
  const taken = new Uint8Array(text.length);
  const hits = [];
  const homeId = home ? String(home).toLowerCase() : null;
  for (const p of gaz.phrases) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(text))) {
      const start = m.index, end = start + m[0].length;
      let free = true;
      for (let i = start; i < end; i++) if (taken[i]) { free = false; break; }
      if (!free) continue;
      const targets = p.rule ? p.rule({ text, start, end, full: text, home: homeId }) : p.targets;
      for (let i = start; i < end; i++) taken[i] = 1; // a ruled-out name still masks its span ("Gulf of Mexico")
      if (!targets || !targets.length) continue;
      hits.push({ start, inTitle: start < titleEnd, targets });
    }
  }
  hits.sort((a, b) => a.start - b.start);
  const countries = [], admin1 = [], cities = [], titleCountries = [];
  const push = (arr, v) => { if (v && !arr.includes(v)) arr.push(v); };
  for (const h of hits) {
    for (const tg of h.targets) {
      const c = countryOf(tg);
      push(countries, c);
      if (h.inTitle) push(titleCountries, c);
      if (tg.type === 'admin1') push(admin1, tg.id);
      if (tg.type === 'city') { push(cities, tg.id); if (tg.admin1) push(admin1, tg.admin1); }
    }
  }
  // Title mentions lead; cap at 4 countries (beyond that it is a world roundup).
  let ordered = [...titleCountries, ...countries.filter((c) => !titleCountries.includes(c))].filter((c) => COUNTRY_NAMES[c]);
  // An official source (agency / government press office) always speaks for its own country.
  if (alwaysHome && homeId && COUNTRY_NAMES[homeId]) ordered = [homeId, ...ordered.filter((c) => c !== homeId)];
  ordered = ordered.slice(0, 4);
  if (ordered.length) return { countries: ordered, admin1, cities, titleCountries, basis: 'text' };
  if (assumeHome && homeId && COUNTRY_NAMES[homeId]) return { countries: [homeId], admin1: [], cities: [], titleCountries: [], basis: 'source' };
  return { countries: [], admin1: [], cities: [], titleCountries: [], basis: 'none' };
}

/* ---------- topic category ---------- */
const CAT_RES = {
  energy: [/\b(?:oil|crude|natural gas|gas (?:field|prices?|supply|exports?)|LNG|power (?:plant|station|grid|prices?|demand|cuts?)|electricity|grid|solar|wind (?:farm|power|turbines?)|offshore wind|nuclear|uranium|reactors?|coal|batter(?:y|ies)|hydrogen|renewables?|refiner(?:y|ies)|OPEC\+?|petrol|diesel|fuel|energy|utilit(?:y|ies)|hydropower|hydroelectric|geothermal|pipelines?|barrels?|blackouts?)\b/gi],
  infrastructure: [/\b(?:rail(?:way|road)?s?|high-speed|ports?|harbou?rs?|shipping|canal|highways?|motorways?|roads?|bridges?|airports?|transit|metro|subway|water (?:supply|system|utility)|dams?|broadband|telecoms?|5G|data cent(?:er|re)s?|construction|housing|infrastructure|tunnels?|logistics|transmission lines?|terminals?|aviation|freight|container)\b/gi],
  industry: [/\b(?:manufactur\w*|factor(?:y|ies)|steel|alumini?um|chips?|chipmakers?|semiconductor\w*|automakers?|carmakers?|vehicles?|EVs?|mining|mines?|miners?|copper|lithium|nickel|cobalt|rare earths?|chemicals?|industr\w*|output|production|supply chains?|shipbuild\w*|shipyards?|aerospace|pharma\w*|exports?|imports?|plants?|layoffs|workers|jobs|capex|investment)\b/gi],
  geopolitics: [/\b(?:sanctions?|tariffs?|trade (?:war|deal|talks|pact|deficit)|elections?|wars?|military|defen[cs]e|summit|ministers?|president|prime minister|government|treaty|conflict|ceasefire|troops|embassy|diplomat\w*|export controls?|borders?|coup|parliament|missiles?|drones?|attacks?|national security|security forces|geopolitic\w*|invasion|junta|talks)\b/gi, /\b(?:NATO|EU|G7|G20|BRICS|UN|ASEAN|ECOWAS)\b/g],
};

/** Topic category for an item: energy | infrastructure | industry | geopolitics | general. Title hits count double; a lone summary hit stays 'general'. */
export function categorize({ title = '', summary = '' } = {}) {
  let best = 'general', bestScore = 0;
  for (const cat of CATEGORIES) {
    let score = 0;
    for (const re of CAT_RES[cat]) {
      score += 2 * (String(title).match(re) || []).length;
      score += (String(summary).match(re) || []).length;
    }
    if (score > bestScore) { best = cat; bestScore = score; }
  }
  // A single passing word in the summary is not enough to call it topical.
  return bestScore >= 2 ? best : 'general';
}
