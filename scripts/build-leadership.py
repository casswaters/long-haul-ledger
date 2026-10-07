"""Merge verified leadership rosters into data/leadership.json (2026-10-07 pass).
Every verified role carries source{url,name} + asOf; unverifiable seats are sourcePending."""
import json, csv
P='data/leadership.json'; D='2026-10-07'
NGA={'url':'https://www.nga.org/governors/','name':'National Governors Association roster'}
NLGA={'url':'https://nlga.us/our-members/','name':'NLGA member roster (updated 2026-09-30)'}
SKL={'url':'https://www.legassembly.sk.ca/library/research-help/premiers-of-canada-and-leaders-of-opposition/','name':'Saskatchewan Legislative Library, Premiers of Canada (updated 2026-09-28)'}
d=json.load(open(P)); A=d['areas']
def role(title,name,site,src,term=None,form=None):
    r={'title':title,'name':name,'contact':{'site':site},'source':src,'asOf':D,'verified':True}
    if form: r['contact']['form']=form
    if term: r['term']={'text':term,'badge':None}
    return r
def pending(title,note):
    return {'title':title,'name':'','sourcePending':True,'pendingNote':note,'contact':{},'asOf':D}
STATES={}
for line in open('scripts/leadership-sources/gov.tsv'):
    k,n,_,u=line.rstrip('\n').split('\t'); STATES[k]=(n,u)
lg=json.load(open('scripts/leadership-sources/lg.json'))
NAMES={x['properties']['id']:x['properties']['name'] for x in json.load(open('data/geo/admin1.geojson'))['features'] if x['properties']['country']=='us'}
cnt={'filled':0,'pending':0}
for k,label in NAMES.items():
    blk=A.setdefault(k,{'level':'admin1','label':label,'roles':[]})
    old=[r for r in blk['roles'] if r.get('title') not in ('Governor','Mayor','Lieutenant Governor','Acting Lieutenant Governor') and not r.get('sourcePending') and 'succession' not in r.get('title','')]
    old_gov=next((r for r in blk['roles'] if r.get('title') in('Governor','Mayor')),{})
    n,u=STATES[k]
    gov=role('Mayor' if k=='us-dc' else 'Governor',n,u,NGA,form=old_gov.get('contact',{}).get('form'))
    if k=='us-dc': gov['source']={'url':'https://mayor.dc.gov/','name':'Office of the Mayor, DC (official)'}
    new=[gov]; cnt['filled']+=1
    if k!='us-dc':
        e=lg.get(label)
        if e and not e['line'].startswith('Vacant'):
            nm,ttl=e['line'].split(', ',1); nm=nm.rsplit(' (',1)[0]
            t='Lieutenant Governor' if ttl in('Lieutenant Governor','Lt. Governor') else ('Acting Lieutenant Governor' if 'Acting' in ttl else f'{ttl} (first in line of succession)')
            new.append(role(t,nm,e.get('site'),NLGA)); cnt['filled']+=1
        else:
            why='Seat listed as vacant on NLGA roster (2026-09-30).' if e and e['line'].startswith('Vacant') else 'No official page found for this seat yet.'
            new.append(pending('Lieutenant Governor',why)); cnt['pending']+=1
    for r in old:
        if r.get('badge')=='SAMPLE' or (r.get('term') or {}).get('badge')=='SAMPLE': pass
        if r.get('responseTime',{}).get('badge')=='ESTIMATE': r.pop('responseTime')
    blk['roles']=new+old
# Countries
C={
 'ca':('Canada · federal',[role('Prime Minister','Mark Carney','https://www.pm.gc.ca/en',{'url':'https://www.pm.gc.ca/en/cabinet','name':'Prime Minister of Canada, Cabinet'}),
   role('Minister of International Trade','Maninder Sidhu','https://www.pm.gc.ca/en/cabinet',{'url':'https://www.pm.gc.ca/en/cabinet','name':'Prime Minister of Canada, Cabinet'}),
   role('Minister responsible for Canada-U.S. Trade, Intergovernmental Affairs and Internal Trade','Dominic LeBlanc','https://www.pm.gc.ca/en/cabinet',{'url':'https://www.pm.gc.ca/en/cabinet','name':'Prime Minister of Canada, Cabinet'})]),
 'mx':('Mexico · federal',[role('President','Claudia Sheinbaum Pardo','https://www.gob.mx/presidencia',{'url':'https://www.gob.mx/presidencia','name':'Presidencia de la República'}),
   role('Secretary of Economy','Marcelo Ebrard Casaubón','https://www.gob.mx/se',{'url':'https://www.gob.mx/se/estructuras/marcelo-ebrard-casaubon','name':'Secretaría de Economía, structure page'})]),
 'cn':('China · national',[role('President','Xi Jinping','https://english.www.gov.cn/',{'url':'https://english.www.gov.cn/','name':'The State Council, PRC'}),
   role('Premier of the State Council','Li Qiang','https://english.www.gov.cn/',{'url':'https://english.www.gov.cn/','name':'The State Council, PRC'}),
   role('Minister of Commerce','Wang Wentao','http://english.mofcom.gov.cn/',{'url':'https://wangwentao2.mofcom.gov.cn/','name':'Ministry of Commerce, PRC, minister page'})]),
 'jp':('Japan · national',[role('Emperor','Naruhito','https://www.kunaicho.go.jp/eindex.html',{'url':'https://www.kunaicho.go.jp/eindex.html','name':'Imperial Household Agency'}),
   role('Prime Minister','Sanae Takaichi','https://japan.kantei.go.jp/',{'url':'https://japan.kantei.go.jp/105/speech/202609/0917kaiken.html','name':'Prime Minister\'s Office, reshuffle press conference (2026-09-18)'}),
   role('Minister of Economy, Trade and Industry','Ryosei Akazawa','https://www.meti.go.jp/english/',{'url':'https://www.meti.go.jp/english/aboutmeti/profiles/individual/aMinister.html','name':'METI minister profile'})]),
 'de':('Germany · federal',[role('Federal President','Frank-Walter Steinmeier','https://www.bundespraesident.de/EN/',{'url':'https://www.bundespraesident.de/EN/','name':'Federal President of Germany'}),
   role('Federal Chancellor','Friedrich Merz','https://www.bundeskanzler.de/bk-en',{'url':'https://www.bundeskanzler.de/bk-en','name':'Federal Chancellor'}),
   role('Federal Minister for Economic Affairs and Energy','Katherina Reiche','https://www.bundeswirtschaftsministerium.de/Navigation/EN/Home/home.html',{'url':'https://www.bundeswirtschaftsministerium.de/Navigation/EN/Ministry/Minister/minister.html','name':'BMWE, minister page'})]),
 'kr':('South Korea · national',[role('President','Lee Jae Myung','https://eng.president.go.kr/',{'url':'https://eng.president.go.kr/','name':'Office of the President'}),
   role('Minister for Trade (Ministry of Trade, Industry and Resources)','Park Jung-sung','https://english.motie.go.kr/',{'url':'https://en.yna.co.kr/view/AEN20260821007951315','name':'Yonhap, appointment announced by presidential spokesperson (2026-08-21)'})]),
 'gb':('United Kingdom · national',[role('Prime Minister','Andy Burnham','https://www.gov.uk/government/organisations/prime-ministers-office-10-downing-street',{'url':'https://www.gov.uk/government/ministers','name':'GOV.UK, Ministers'}),
   role('Secretary of State for Business, Innovation, Science and Trade','Jonathan Reynolds','https://www.gov.uk/government/organisations/department-for-business-and-trade',{'url':'https://www.gov.uk/government/ministers','name':'GOV.UK, Ministers'})]),
 'in':('India · Union',[role('President of India','Droupadi Murmu','https://presidentofindia.gov.in/',{'url':'https://presidentofindia.gov.in/','name':'President of India'}),
   role('Prime Minister','Narendra Modi','https://www.pmindia.gov.in/',{'url':'https://www.pmindia.gov.in/','name':'PM India'}),
   role('Minister of Commerce and Industry','Piyush Goyal','https://commerce.gov.in/',{'url':'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2316127','name':'Press Information Bureau release'})]),
 'tw':('Taiwan · national',[role('President','Lai Ching-te','https://english.president.gov.tw/',{'url':'https://english.president.gov.tw/','name':'Office of the President'}),
   role('Premier','Cho Jung-tai','https://english.ey.gov.tw/',{'url':'https://english.ey.gov.tw/','name':'Executive Yuan'}),
   role('Minister of Economic Affairs','Kung Ming-hsin','https://www.moea.gov.tw/MNS/english/home/English.aspx',{'url':'https://www.moea.gov.tw/mns/english/content/Content.aspx?menu_id=45042','name':'MOEA, minister press conference (2026-05-06)'})]),
 'vn':('Vietnam · national',[role('General Secretary and President','To Lam','https://en.baochinhphu.vn/',{'url':'https://www.vietnam.vn/en/tong-bi-thu-chu-tich-nuoc-to-lam-trao-quyet-dinh-bo-nhiem-cac-thanh-vien-chinh-phu','name':'Vietnam.vn (government appointments, 2026-04-08)'}),
   role('Prime Minister','Le Minh Hung','https://primeminister.chinhphu.vn/',{'url':'https://primeminister.chinhphu.vn/le-minh-hung-unanimously-elected-as-new-prime-minister-of-viet-nam-134260407152422211.htm','name':'Government portal (2026-04-07)'}),
   role('Minister of Industry and Trade','Le Manh Hung','https://moit.gov.vn/en',{'url':'https://moit.gov.vn/en/news/vietnam-s-national-assembly-approves-le-manh-hung-as-minister-of-industry-and-trade.html','name':'MOIT portal (2026-04-08)'})]),
 'pr':('Puerto Rico · U.S. territory',[role('Governor','Jenniffer González-Colón','https://www.fortaleza.pr.gov/',NGA),
   role('Secretary of State (first in line of succession)','Rosachely Rivera Santana','https://www.statedepartment.pr.gov/secretary-of-state',NLGA)]),
}
for k,(label,roles) in C.items():
    keep=[r for r in A.get(k,{}).get('roles',[]) if False]
    A[k]={'level':'country','label':label.split(' · ')[0],'roles':roles}; cnt['filled']+=len(roles)
# Canadian premiers
PREM={'ca-bc':('David Eby','https://www2.gov.bc.ca/gov/content/governments/organizational-structure/office-of-the-premier','Election called for Oct 24, 2026'),
 'ca-ab':('Danielle Smith','https://www.alberta.ca/premier',None),'ca-sk':('Scott Moe','https://www.saskatchewan.ca/',None),
 'ca-mb':('Wab Kinew','https://www.gov.mb.ca/minister/premier/index.html',None),'ca-on':('Doug Ford','https://www.ontario.ca/page/premier',None),
 'ca-qc':('Christine Fréchette','https://www.quebec.ca/en','Provincial election held Oct 5, 2026; recheck after swearing-in'),
 'ca-nb':('Susan Holt','https://www2.gnb.ca/content/gnb/en/departments/premier.html',None),'ca-ns':('Tim Houston','https://novascotia.ca/premier/',None),
 'ca-pe':('Rob Lantz','https://www.princeedwardisland.ca/en/topic/office-of-the-premier',None),'ca-nl':('Tony Wakeham','https://www.gov.nl.ca/premier/',None),
 'ca-yt':('Currie Dixon','https://yukon.ca/',None),'ca-nt':('R.J. Simpson','https://www.gov.nt.ca/en/premier',None),'ca-nu':('John Main','https://www.gov.nu.ca/en/premier',None)}
CAN={x['properties']['id']:x['properties']['name'] for x in json.load(open('data/geo/admin1.geojson'))['features'] if x['properties']['country']=='ca'}
for k,(n,u,note) in PREM.items():
    A[k]={'level':'admin1','label':CAN[k],'roles':[role('Premier',n,u,SKL,term=note)]}; cnt['filled']+=1
d['meta']={'note':'Public channels only. Verified roles list an official source and as-of date; seats we could not verify are marked source pending. Response times are left empty unless a published source exists.','asOf':D}
json.dump(d,open(P,'w'),indent=2,ensure_ascii=False)
print(cnt)

# ---------------------------------------------------------------------------
# Stage 2 (2026-10-07): legislatures + Congress. Snapshots in scripts/leadership-sources/.
#   state-legislatures.json  Ballotpedia chamber infoboxes (primary for state leaders)
#   senators.json            senate.gov senators XML
#   house-members.json       clerk.house.gov MemberData XML (publish date inside)
#   congress-leadership.json senate.gov/senators/leadership.htm + house.gov/leadership
import re
SRC='scripts/leadership-sources/'
d=json.load(open(P)); A=d['areas']
leg=json.load(open(SRC+'state-legislatures.json'))['chambers']
LEAD=json.load(open(SRC+'state-legislature-leaders.json'))
sen=json.load(open(SRC+'senators.json'))
hou=json.load(open(SRC+'house-members.json'))
cl=json.load(open(SRC+'congress-leadership.json'))
PN={'R':'Republican','D':'Democratic','I':'Independent','ID':'Independent'}
POST={x['properties']['id']:x['properties']['postal'] for x in json.load(open('data/geo/admin1.geojson'))['features'] if x['properties']['country']=='us'}
c2={'filled':0,'vacant':0,'pending':0}
def clean(n): return re.sub(r'\s*\([^)]*\)$','',n).strip()
def lrole(title,name,party,src,site=None):
    if not name or name.lower().startswith('vacant'):
        c2['vacant']+=1
        return {'title':title,'name':'Vacant','vacant':True,'contact':{},'source':src,'asOf':D,'verified':True}
    c2['filled']+=1
    r={'title':title,'name':clean(name),'contact':{'site':site or src['url']},'source':src,'asOf':D,'verified':True}
    if party: r['party']=PN.get(party,party)
    return r
def lpend(title,note):
    c2['pending']+=1
    return {'title':title,'name':'','sourcePending':True,'pendingNote':note,'contact':{},'asOf':D}
LBL={'President':'Senate President','Speaker':'Speaker','Maj. Leader':'Majority Leader','Min. Leader':'Minority Leader'}
for k,label in NAMES.items():
    if k=='us-dc': continue
    blk=A[k]; st=label.replace(' ','_')+'_'
    blk['roles']=[r for r in blk['roles'] if not re.search(r'congressional delegation|U\.S\. Senators|State Legislature$',r.get('title',''))]
    groups=[]
    chambers=sorted([c for c in leg if c.startswith(st)], key=lambda c: 0 if 'Senate' in c else 1)
    for c in chambers:
        src={'url':'https://ballotpedia.org/'+c,'name':'Ballotpedia, '+c.replace('_',' ')}
        ib={clean(n):p for _,n,p in leg[c]}
        info=[(l,n,p or ib.get(clean(n),'')) for l,n,p in LEAD.get(c) or leg[c]]
        def norm(l):
            l=l.lower()
            if 'pro tem' in l and 'speaker' not in l: return 'President Pro Tempore'
            if l in ('senate president','president'): return 'Senate President'
            if 'speaker' in l and 'pro tem' not in l: return 'Speaker'
            if l in ('majority leader','maj. leader','majority floor leader'): return 'Majority Leader'
            if l in ('minority leader','min. leader'): return 'Minority Leader'
            return l[:1].upper()+l[1:]
        upper='Senate' in c and 'Unicameral' not in c
        roles=[lrole(norm(l),'' if n.startswith('TBD') else n,p,src) for l,n,p in info]
        got={r['title'] for r in roles}
        want=(['Senate President','President Pro Tempore'] if upper else ['Speaker'])+(['Majority Leader','Minority Leader'] if 'Unicameral' not in c else [])
        if any('Floor leader' in g or 'floor leader' in g.lower() for g in got): want=[w for w in want if 'ority Leader' not in w]
        for w in want:
            if w not in got:
                roles.append(lpend(w,'Not listed on the Ballotpedia chamber page (2026-10-07); some chambers have no formal party floor leaders or pro tem.'))
        groups.append({'title':c.replace('_',' ').replace(' (Unicameral)',' (unicameral)'),'roles':roles,'collapsed':False})
    ss=[m for m in sen['members'] if m['state']==POST[k]]
    groups.append({'title':'U.S. Senate','collapsed':False,'roles':[lrole('U.S. Senator',f"{m['first_name']} {m['last_name']}",m['party'],{'url':'https://www.senate.gov/senators/','name':'U.S. Senate, senators list (senate.gov XML)'},m['website'] or None) for m in ss]})
    hm=sorted([m for m in hou['members'] if m['sd'][:2]==POST[k]],key=lambda m:m['sd'])
    rows=[]
    for m in hm:
        dist='At-large' if m['sd'].endswith('00') else str(int(m['sd'][2:]))
        if not m['name']:
            c2['vacant']+=1; rows.append({'district':dist,'name':'Vacant','vacant':True})
        else:
            c2['filled']+=1; rows.append({'district':dist,'name':m['name'],'party':m['party'],'url':f"https://clerk.house.gov/members/{m['bioguide']}"})
    groups.append({'title':f'U.S. House delegation ({len(rows)} seat{"s" if len(rows)!=1 else ""})','collapsed':True,'compact':True,'rows':rows,
        'source':{'url':'https://clerk.house.gov/members','name':f"Clerk of the House, member data (published {hou['publishDate']})"},'asOf':D})
    blk['groups']=groups
# DC + PR delegates
for key,sd in (('us-dc','DC00'),('pr','PR00')):
    m=next((x for x in hou['members'] if x['sd']==sd),None)
    if m and m['name']:
        c2['filled']+=1
        A[key]['groups']=[{'title':'U.S. House (non-voting delegate)','collapsed':False,'roles':[lrole('Delegate' if key=='us-dc' else 'Resident Commissioner',m['name'],m['party'],{'url':'https://clerk.house.gov/members','name':f"Clerk of the House, member data (published {hou['publishDate']})"},f"https://clerk.house.gov/members/{m['bioguide']}")]}]
        c2['filled']-=1
# National
us=A['us']; us['roles']=[r for r in us['roles'] if r['title'] not in ('Speaker of the House','Senate Majority Leader')]
gs=[]
for ch,ttl in (('house','U.S. House leadership'),('senate','U.S. Senate leadership')):
    src={'url':cl[ch]['source'],'name':'house.gov/leadership' if ch=='house' else 'senate.gov leadership'}
    gs.append({'title':ttl,'collapsed':False,'roles':[lrole(t,n,(p.split('-')[0]),src) for t,n,p in cl[ch]['roles']]})
us['groups']=gs
json.dump(d,open(P,'w'),indent=2,ensure_ascii=False)
print('stage2',c2)
