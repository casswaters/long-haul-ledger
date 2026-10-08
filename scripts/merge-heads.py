"""Phase 1: merge confirmed heads of state and government into data/leadership.json.
Input: scripts/leadership-sources/heads-<date>.json (built off-repo from Wikidata candidates,
each confirmed on an official government page on the checked date). Unconfirmed seats become
Not yet covered rows with the planned official source. Existing hand-verified roles win."""
import json, re, sys, unicodedata
from urllib.parse import urlparse
SRC = sys.argv[1] if len(sys.argv) > 1 else 'scripts/leadership-sources/heads-2026-10-08.json'
P = 'data/leadership.json'
src = json.load(open(SRC)); D = src['checked']
import os, glob
for mf in sorted(glob.glob('scripts/leadership-sources/heads-manual-*.json')):
    man = json.load(open(mf))
    for cid, e in man['countries'].items():
        base = src['countries'].setdefault(cid, {'label': cid, 'hs': None, 'hg': None, 'planned': None})
        for k in ('hs', 'hg'):
            if e.get(k): base[k] = e[k]
cat = json.load(open(P)); A = cat['areas']
TITLE_FIX = {'President of the Ivory Coast': 'President', 'Prime Minister of Ivory Coast': 'Prime Minister', 'Military leader': 'President'}
def norm(s):
    s = unicodedata.normalize('NFKD', s or ''); s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z ]', ' ', s.lower())
def toks(s): return {t for t in norm(s).split() if len(t) > 2 and t not in ('the', 'sheikh', 'bin', 'al', 'his', 'her', 'majesty', 'king', 'queen', 'president', 'prime', 'minister')}
def display_name(x):
    n = re.sub(r'\s+of\s+[A-Z][A-Za-z ]+$', '', x['name']).strip()
    return n
def title_of(x):
    t = TITLE_FIX.get(x['title'], x['title'])
    if t == 'Monarch': t = 'King' if x['name'].startswith(('Charles', 'Felipe', 'Haakon', 'Harald', 'Philippe', 'Willem', 'Frederik', 'Carl')) else 'Monarch'
    return t
def host(u): return re.sub(r'^www\.', '', urlparse(u).hostname or '')
def since(x):
    s = x.get('since')
    if not s: return None
    if s['precision'] == 'day':
        y, m, d = s['date'].split('-'); M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][int(m)-1]
        return {'text': f'{M} {int(d)}, {y}', 'date': s['date'], 'confirmedOn': x['source']}
    return {'text': s['date'], 'date': s['date'], 'confirmedOn': x['source']}
def role(x, kind):
    r = {'title': title_of(x), 'kind': kind, 'name': display_name(x), 'contact': {'site': x['site']},
         'source': {'url': x['source'], 'name': f"{host(x['source'])} (official site)"}, 'asOf': D, 'checked': D, 'verified': True}
    s = since(x)
    if s: r['since'] = s
    else: r['sinceNote'] = 'Not yet confirmed'
    return r
def nc(kind, planned):
    r = {'title': kind, 'kind': kind, 'name': '', 'notCovered': True, 'contact': {}, 'checked': D}
    if planned: r['plannedSource'] = planned
    return r
# Hand-verified roles (Oct 7 pass, each with its own official source): label which seat they are.
KIND_BY_TITLE = {
    ('us', 'President of the United States'): 'Head of state and government', ('in', 'President of India'): 'Head of state', ('in', 'Prime Minister'): 'Head of government',
    ('ae', 'President'): 'Head of state', ('ae', 'Prime Minister / Ruler of Dubai'): 'Head of government', ('jp', 'Emperor'): 'Head of state', ('jp', 'Prime Minister'): 'Head of government',
    ('ng', 'President'): 'Head of state and government', ('ca', 'Prime Minister'): 'Head of government', ('mx', 'President'): 'Head of state and government',
    ('cn', 'President'): 'Head of state', ('cn', 'Premier of the State Council'): 'Head of government', ('de', 'Federal President'): 'Head of state', ('de', 'Federal Chancellor'): 'Head of government',
    ('kr', 'President'): 'Head of state and government', ('gb', 'Prime Minister'): 'Head of government', ('tw', 'President'): 'Head of state', ('tw', 'Premier'): 'Head of government',
    ('vn', 'General Secretary and President'): 'Head of state', ('vn', 'Prime Minister'): 'Head of government', ('pr', 'Governor'): 'Head of government',
}
for (cid, title), kind in KIND_BY_TITLE.items():
    for r in A.get(cid, {}).get('roles', []):
        if r.get('title') == title and r.get('name') and not r.get('notCovered'): r['kind'] = kind
cnt = {'hsFilled': 0, 'hgFilled': 0, 'bothFilled': 0, 'anyFilled': 0, 'kept': 0}
for cid, e in src['countries'].items():
    hs, hg, planned = e['hs'], e['hg'], e['planned']
    same = hs and hg and hs['wikidata'] == hg['wikidata']
    blk = A.get(cid)
    existing = [r for r in (blk or {}).get('roles', []) if r.get('name') and not r.get('notCovered')]
    new = []
    def place(x, kind):
        # Existing hand-verified role for the same person: annotate it instead of duplicating.
        for r in existing:
            if x and toks(r['name']) & toks(x['name']):
                r.setdefault('kind', kind)
                if not (r.get('source') or {}).get('url'):
                    nr = role(x, kind); r['source'] = nr['source']; r['asOf'] = D; r['checked'] = D; r['verified'] = True
                s = since(x)
                if s and not r.get('since'): r['since'] = s
                cnt['kept'] += 1
                return True
        return False
    if same:
        if not place(hs, 'Head of state and government'): new.append(role(hs, 'Head of state and government'))
    else:
        for x, kind in ((hs, 'Head of state'), (hg, 'Head of government')):
            if x:
                if not place(x, kind): new.append(role(x, kind))
            elif not any(r.get('kind') in (kind, 'Head of state and government') for r in existing):
                new.append(nc(kind, planned))
    if blk:
        # Keep hand-verified rosters; drop old empty head rows replaced by confirmed ones.
        keep = [r for r in blk.get('roles', []) if not (r.get('notCovered') and r.get('title') in ('President', 'Head of state', 'Head of government') and new)]
        blk['roles'] = new + keep
    else:
        A[cid] = {'level': 'country', 'label': e['label'], 'roles': new}
    roles = A[cid]['roles']
    k = {r.get('kind') for r in roles if r.get('name') and not r.get('notCovered')}
    h1 = bool(k & {'Head of state', 'Head of state and government'}); h2 = bool(k & {'Head of government', 'Head of state and government'})
    cnt['hsFilled'] += h1; cnt['hgFilled'] += h2; cnt['bothFilled'] += h1 and h2; cnt['anyFilled'] += h1 or h2
cat['meta']['asOf'] = D
cat['meta']['heads'] = {'checked': D, 'method': src['method'], 'counts': cnt, 'countries': len(src['countries'])}
json.dump(cat, open(P, 'w'), indent=2, ensure_ascii=False); open(P, 'a').write('\n')
print(json.dumps(cnt))
