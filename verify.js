/**
 * Verification tiers for ledger news items (pure; shared by the RSS fetcher
 * and the browser fallback; tested by ledger.test.js).
 *
 *  confirmed   — the subject (agency / company / official) confirmed it: the
 *                item comes from a primary/official source for its own
 *                announcement, or its story cluster contains such an item.
 *  multiple    — 2+ independent outlets in the feed carry the same story
 *                (clustered within ~48h), but the subject hasn't confirmed.
 *  unconfirmed — a single outlet reports it; subject hasn't confirmed.
 *  analysis    — opinion / essay / think-tank / long-form: no tier.
 *  sample      — SAMPLE fiction (country desks) — never tiered.
 */

export const VERIFY_WINDOW_HOURS = 48;

export const STATUS_META = {
  confirmed: { label: 'Confirmed', hint: 'The subject (agency, company or official) confirmed it — primary source.' },
  multiple: { label: 'Multiple sources', hint: 'Two or more independent outlets carry it; the subject has not confirmed yet.' },
  unconfirmed: { label: 'Unconfirmed', hint: 'One outlet is reporting it; the subject has not confirmed.' },
  analysis: { label: 'Analysis', hint: 'Opinion, essay or analysis — not a factual claim to verify.' },
  sample: { label: 'SAMPLE', hint: 'SAMPLE fiction for UX prototyping — not a real report.' },
};

export const STATUS_ORDER = ['confirmed', 'multiple', 'unconfirmed', 'analysis'];

/** Feeds that are the subject's own channel (agency / company press / IR). */
export const DEFAULT_PRIMARY_SOURCE_IDS = new Set([
  'eia-today', 'doe-press', 'nist-news', 'nasa-news', 'fed-press', 'defense-news',
]);

const STOP = new Set(('a an the and or but of to in on at for from by with as is are was were be been being ' +
  'it its this that these those into over under after before about than then new says said say ' +
  'how why what when where who will would can could may might should has have had not no yes ' +
  'up out more most less least first last just now also amid via per us u.s our your their his her ' +
  'year years week weeks day days time report reports reported here there').split(/\s+/));

const ENTITY_STOP = new Set(['the', 'a', 'an', 'how', 'why', 'what', 'when', 'where', 'who', 'new', 'us', 'u.s', 'u.s.',
  'this', 'that', 'these', 'it', 'its', 'in', 'on', 'for', 'as', 'at', 'is', 'are', 'and', 'but', 'with', 'from',
  'america', 'american', 'united states', 'opinion', 'analysis', 'podcast', 'video', 'live', 'update', 'breaking']);

export function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[’']s\b/g, '')
    .replace(/[^a-z0-9$%.\s-]/g, ' ')
    .replace(/(\D)\.(\D|$)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function stem(t) {
  if (t.length > 4 && t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

export function titleTokens(title) {
  const out = new Set();
  for (const raw of normalizeTitle(title).split(/[\s-]+/)) {
    const t = raw.replace(/^\.+|\.+$/g, '');
    if (!t || STOP.has(t)) continue;
    if (t.length < 3 && !/\d/.test(t)) continue;
    out.add(stem(t));
  }
  return out;
}

/** Key entities: capitalized runs, acronyms, numbers with units / $ amounts. */
export function keyEntities(text) {
  const s = String(text || '').replace(/[–—]/g, '-');
  const out = new Set();
  const runs = s.match(/\b(?:[A-Z][A-Za-z0-9&'’.-]*|[A-Z]{2,}[a-z]?)(?:\s+(?:of\s+|de\s+)?(?:[A-Z][A-Za-z0-9&'’.-]*))*/g) || [];
  for (const r of runs) {
    const norm = r.toLowerCase().replace(/[’']s$/, '').replace(/[.,:;]+$/, '').trim();
    if (!norm || ENTITY_STOP.has(norm) || norm.length < 2) continue;
    out.add(norm);
    // individual words of multi-word names ("Nobel Physics Prize" ~ "Nobel Prize")
    const words = norm.split(/\s+/);
    if (words.length > 1) {
      for (const w of words) {
        const ww = w.replace(/[’'.]+$/g, '');
        if (ww.length >= 3 && !STOP.has(ww) && !ENTITY_STOP.has(ww)) out.add(stem(ww));
      }
    }
  }
  const nums = s.match(/\$\s?\d[\d,.]*\s?(?:billion|million|trillion|bn|m|b)?|\b\d[\d,.]*\s?(?:gw|mw|gigawatts?|megawatts?|%|percent)\b/gi) || [];
  for (const n of nums) out.add(n.toLowerCase().replace(/\s+/g, ''));
  return out;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

function sharedCount(a, b) {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

export function withinWindow(aIso, bIso, hours = VERIFY_WINDOW_HOURS) {
  if (!aIso || !bIso) return true; // undated items can still match on content
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return true;
  return Math.abs(a - b) <= hours * 3600000;
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

/** Independent-outlet key (two NYT feeds = one outlet). */
export function outletKey(item) {
  if (item.outlet) return String(item.outlet).toLowerCase();
  const host = hostOf(item.url);
  if (host) {
    const parts = host.split('.');
    const tail2 = parts.slice(-2).join('.');
    // keep 3 labels for *.gov.uk-style suffixes
    return /^(co|com|gov|ac|org)\.[a-z]{2}$/.test(tail2) ? parts.slice(-3).join('.') : tail2;
  }
  return String(item.sourceId || item.source || 'unknown').toLowerCase();
}

/** Primary / official channel for its own announcements. */
export function isPrimary(item) {
  if (item.primary === true) return true;
  if (item.primary === false) return false;
  if (DEFAULT_PRIMARY_SOURCE_IDS.has(item.sourceId)) return true;
  const host = hostOf(item.url);
  if (/\.(gov|mil)$/.test(host)) return true;
  if (/^(newsroom|investors?|ir|press)\./.test(host)) return true; // company press / IR subdomains
  try {
    const path = new URL(item.url).pathname.toLowerCase();
    if (/\/(newsroom|press-releases?|news-releases?|investor-relations)\//.test(path) && !/nytimes|reuters|bloomberg|apnews/.test(host)) return true;
  } catch { /* ignore */ }
  return false;
}

export function isAnalysis(item) {
  if (item.kind === 'analysis') return true;
  const tags = (item.tags || []).map((t) => String(t).toLowerCase());
  if (tags.includes('opinion') || tags.includes('analysis')) return true;
  if (/^(opinion|analysis|commentary|essay|op-ed|perspective)\s*[:|–—-]/i.test(String(item.title || ''))) return true;
  try {
    const path = new URL(item.url).pathname.toLowerCase();
    if (/\/(opinion|op-ed|opinions|commentary)\//.test(path)) return true;
  } catch { /* ignore */ }
  return false;
}

function storyTerms(it) {
  const set = new Set(it._tok || titleTokens(it.title));
  for (const e of (it._ent || keyEntities(it.title))) set.add(e);
  return set;
}

function entityTerms(it) {
  return it._entAll || keyEntities(`${it.title || ''}. ${it.blurb || ''}`);
}

/**
 * Corpus stats so common words ("energy", "power", "prize") count for little
 * and rare shared names ("Halzen", "IceCube") count for a lot.
 */
export function corpusStats(items) {
  const df = new Map();
  const edf = new Map();
  for (const it of items) {
    for (const t of storyTerms(it)) df.set(t, (df.get(t) || 0) + 1);
    for (const t of entityTerms(it)) edf.set(t, (edf.get(t) || 0) + 1);
  }
  return { df, edf, n: items.length };
}

function idf(term, stats) {
  if (!stats) return 1;
  const d = stats.df.get(term) || 1;
  return Math.log(1 + stats.n / d);
}

function isDistinctiveEntity(term, stats) {
  if (!stats) return true;
  return (stats.edf.get(term) || 1) <= Math.max(2, Math.ceil(stats.n * 0.015));
}

/** IDF-weighted Jaccard over title tokens + title key entities. */
export function weightedSimilarity(a, b, stats = null) {
  const ta = storyTerms(a);
  const tb = storyTerms(b);
  let inter = 0, uni = 0;
  for (const t of new Set([...ta, ...tb])) {
    const w = idf(t, stats);
    uni += w;
    if (ta.has(t) && tb.has(t)) inter += w;
  }
  return uni ? inter / uni : 0;
}

/** Shared key entities (names, places, orgs, amounts) across title + blurb. */
export function sharedEntities(a, b, stats = null) {
  const ea = entityTerms(a);
  const eb = entityTerms(b);
  const out = [];
  for (const t of ea) if (eb.has(t) && isDistinctiveEntity(t, stats)) out.push(t);
  return out;
}

/**
 * Same-story test for two items, published within ~48h of each other:
 *  - near-duplicate normalized titles, or
 *  - similar titles (IDF-weighted) that also share 2+ distinctive key
 *    entities (names / places / orgs / amounts) in title + blurb.
 */
export function sameStory(a, b, { hours = VERIFY_WINDOW_HOURS, stats = null } = {}) {
  if (!withinWindow(a.published, b.published, hours)) return false;
  const jt = jaccard(a._tok || titleTokens(a.title), b._tok || titleTokens(b.title));
  if (jt >= 0.6) return true;
  const ws = weightedSimilarity(a, b, stats);
  if (ws >= 0.5) return true;
  if (ws < 0.15) return false;
  return sharedEntities(a, b, stats).length >= 2;
}

/** Union-find clustering (cross-outlet edges only) → array of index arrays. */
export function clusterItems(items, hours = VERIFY_WINDOW_HOURS) {
  const prepared = items.map((it) => ({
    ...it,
    _tok: titleTokens(it.title),
    _ent: keyEntities(it.title),
    _entAll: keyEntities(`${it.title || ''}. ${it.blurb || ''}`),
  }));
  const stats = corpusStats(prepared);
  const parent = prepared.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      if (find(i) === find(j)) continue;
      // one outlet doesn't corroborate itself: only cross-outlet edges
      if (outletKey(prepared[i]) === outletKey(prepared[j])) continue;
      if (sameStory(prepared[i], prepared[j], { hours, stats })) parent[find(j)] = find(i);
    }
  }
  const groups = new Map();
  prepared.forEach((_, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  });
  return [...groups.values()];
}

/** Tier for one cluster of items. */
export function tierForCluster(members) {
  const primaries = members.filter(isPrimary);
  if (primaries.length) return 'confirmed';
  const outlets = new Set(members.map(outletKey));
  return outlets.size >= 2 ? 'multiple' : 'unconfirmed';
}

function sourceEntry(it) {
  return {
    name: it.source || it.sourceId || outletKey(it),
    outlet: outletKey(it),
    url: it.url,
    primary: isPrimary(it),
    published: it.published || null,
  };
}

/**
 * Attach `verification` to every item. Returns new item objects.
 * verification = { status, label, clusterId, clusterSize, outlets, sources[], confirmedBy[] }
 */
export function classifyItems(items, { hours = VERIFY_WINDOW_HOURS } = {}) {
  const list = Array.isArray(items) ? items : [];
  const out = list.map((it) => ({ ...it }));
  const newsIdx = [];
  out.forEach((it, i) => {
    if (it.real === false || it.sample) {
      it.verification = { status: 'sample', label: STATUS_META.sample.label, sources: [], outlets: 0 };
    } else if (isAnalysis(it)) {
      it.verification = { status: 'analysis', label: STATUS_META.analysis.label, sources: [sourceEntry(it)], outlets: 1 };
    } else {
      newsIdx.push(i);
    }
  });
  const news = newsIdx.map((i) => out[i]);
  const clusters = clusterItems(news, hours);
  for (const group of clusters) {
    const members = group.map((g) => news[g]);
    const status = tierForCluster(members);
    const byOutlet = new Map();
    // primary first so a confirming source is listed first
    for (const m of [...members].sort((a, b) => Number(isPrimary(b)) - Number(isPrimary(a)))) {
      const k = outletKey(m);
      if (!byOutlet.has(k)) byOutlet.set(k, sourceEntry(m));
    }
    const sources = [...byOutlet.values()];
    const confirmedBy = sources.filter((s) => s.primary).map((s) => s.name);
    const clusterId = `vc-${(members.map((m) => m.id || m.url).sort()[0] || '').replace(/^live-/, '')}`;
    for (const m of members) {
      m.verification = {
        status,
        label: STATUS_META[status].label,
        clusterId,
        clusterSize: members.length,
        outlets: sources.length,
        sources,
        confirmedBy,
      };
    }
  }
  return out;
}

/** Client fallback: classify only when the feed lacks statuses. */
export function ensureVerification(items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length && list.every((i) => i.verification?.status)) return list;
  return classifyItems(list);
}

export function tierCounts(items) {
  const c = { confirmed: 0, multiple: 0, unconfirmed: 0, analysis: 0, sample: 0 };
  for (const it of items || []) {
    const s = it.verification?.status;
    if (s && s in c) c[s]++;
  }
  return c;
}

export function filterByStatus(items, status) {
  if (!status || status === 'all') return items;
  return (items || []).filter((i) => i.verification?.status === status);
}
