/**
 * Long Haul Ledger: the five sector tabs (Raw materials, Manufacturing,
 * Services, Technology, Policy) on the sector-tab engine. Segments and NAICS
 * codes, tagging, cross-listing from Energy, location backfill, empty briefs,
 * hash tokens, header + Method wiring, voice.
 */
import { readFileSync } from 'fs';
import { ECONOMY_TABS, RAW_MATERIALS, MANUFACTURING, SERVICES, TECHNOLOGY, POLICY } from './economy.js';
import { SECTOR_TABS, SECTOR_IDS, sectorById } from './tabs.js';
import { tagSector, sectorColumn, validateBriefs, briefFor, naicsUrl, parseSectorToken, sectorToken, ECONOMIC_TYPES } from './sectors.js';
import { parseHash, buildHash } from './nav.js';
import { segmentReference, renderSectorOverlay } from './sectorui.js';

let pass = 0, fail = 0;
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const BAD = /[\u2014~]/;
const subs = (tab, title, summary = '') => tagSector(tab, { title, summary }).subs;
const via = (tab, title) => tagSector(tab, { title }).via || {};

/**
 * NAICS 2022 titles, checked one by one against census.gov on Oct 7, 2026
 * (https://www.census.gov/naics/resources/model/dataHandler.php?chart=2022&input=CODE).
 */
const NAICS_2022 = {
  '11': 'Agriculture, Forestry, Fishing and Hunting', '21': 'Mining, Quarrying, and Oil and Gas Extraction', '22': 'Utilities', '23': 'Construction',
  '31-33': 'Manufacturing', '42': 'Wholesale Trade', '44-45': 'Retail Trade', '48-49': 'Transportation and Warehousing', '51': 'Information',
  '52': 'Finance and Insurance', '53': 'Real Estate and Rental and Leasing', '54': 'Professional, Scientific, and Technical Services',
  '55': 'Management of Companies and Enterprises', '61': 'Educational Services', '62': 'Health Care and Social Assistance',
  '71': 'Arts, Entertainment, and Recreation', '72': 'Accommodation and Food Services', '92': 'Public Administration',
  '111': 'Crop Production', '112': 'Animal Production and Aquaculture', '113': 'Forestry and Logging', '114': 'Fishing, Hunting and Trapping',
  '115': 'Support Activities for Agriculture and Forestry', '211': 'Oil and Gas Extraction', '212': 'Mining (except Oil and Gas)',
  '236': 'Construction of Buildings', '237': 'Heavy and Civil Engineering Construction', '238': 'Specialty Trade Contractors',
  '311': 'Food Manufacturing', '312': 'Beverage and Tobacco Product Manufacturing', '313': 'Textile Mills', '315': 'Apparel Manufacturing',
  '321': 'Wood Product Manufacturing', '322': 'Paper Manufacturing', '324': 'Petroleum and Coal Products Manufacturing', '325': 'Chemical Manufacturing',
  '326': 'Plastics and Rubber Products Manufacturing', '327': 'Nonmetallic Mineral Product Manufacturing', '331': 'Primary Metal Manufacturing',
  '332': 'Fabricated Metal Product Manufacturing', '333': 'Machinery Manufacturing', '334': 'Computer and Electronic Product Manufacturing',
  '335': 'Electrical Equipment, Appliance, and Component Manufacturing', '336': 'Transportation Equipment Manufacturing',
  '481': 'Air Transportation', '482': 'Rail Transportation', '483': 'Water Transportation', '484': 'Truck Transportation', '486': 'Pipeline Transportation',
  '493': 'Warehousing and Storage', '512': 'Motion Picture and Sound Recording Industries', '513': 'Publishing Industries', '516': 'Broadcasting and Content Providers',
  '517': 'Telecommunications', '518': 'Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services',
  '519': 'Web Search Portals, Libraries, Archives, and Other Information Services', '522': 'Credit Intermediation and Related Activities',
  '523': 'Securities, Commodity Contracts, and Other Financial Investments and Related Activities', '524': 'Insurance Carriers and Related Activities',
  '531': 'Real Estate', '621': 'Ambulatory Health Care Services', '622': 'Hospitals', '623': 'Nursing and Residential Care Facilities', '624': 'Social Assistance',
  '721': 'Accommodation', '722': 'Food Services and Drinking Places', '813': 'Religious, Grantmaking, Civic, Professional, and Similar Organizations',
  '926': 'Administration of Economic Programs', '928': 'National Security and International Affairs', '1125': 'Aquaculture', '2212': 'Natural Gas Distribution',
  '2213': 'Water, Sewage and Other Systems', '3254': 'Pharmaceutical and Medicine Manufacturing', '3344': 'Semiconductor and Other Electronic Component Manufacturing',
  '3361': 'Motor Vehicle Manufacturing', '3364': 'Aerospace Product and Parts Manufacturing', '5411': 'Legal Services',
  '5412': 'Accounting, Tax Preparation, Bookkeeping, and Payroll Services', '5413': 'Architectural, Engineering, and Related Services',
  '5415': 'Computer Systems Design and Related Services', '5416': 'Management, Scientific, and Technical Consulting Services',
  '5417': 'Scientific Research and Development Services', '8132': 'Grantmaking and Giving Services', '8133': 'Social Advocacy Organizations',
  '8139': 'Business, Professional, Labor, Political, and Similar Organizations', '22111': 'Electric Power Generation',
  '22112': 'Electric Power Transmission, Control, and Distribution', '213111': 'Drilling Oil and Gas Wells', '213112': 'Support Activities for Oil and Gas Operations',
  '213114': 'Support Activities for Metal Mining', '213115': 'Support Activities for Nonmetallic Minerals (except Fuels) Mining', '513210': 'Software Publishers',
  '521110': 'Monetary Authorities-Central Bank', '541714': 'Research and Development in Biotechnology (except Nanobiotechnology)',
  '541715': 'Research and Development in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology)',
  '551114': 'Corporate, Subsidiary, and Regional Managing Offices', '611110': 'Elementary and Secondary Schools', '611310': 'Colleges, Universities, and Professional Schools',
  '921110': 'Executive Offices', '921120': 'Legislative Bodies', '921130': 'Public Finance Activities', '922110': 'Courts',
  '926150': 'Regulation, Licensing, and Inspection of Miscellaneous Commercial Sectors', '928120': 'International Affairs',
};

console.log('\n--- Tabs: names, order, official references ---');
assert('six tabs, Energy first', SECTOR_IDS.join(',') === 'energy,materials,manufacturing,services,technology,policy' && SECTOR_TABS[0].id === 'energy');
assert('plain names (Cassidy\'s rename)', ECONOMY_TABS.map((t) => t.label).join('|') === 'Raw materials|Manufacturing|Services|Technology|Policy');
assert('economic types map Primary to Quinary', ECONOMY_TABS.map((t) => t.economicType).join(',') === 'primary,secondary,tertiary,quaternary,quinary');
assert('official names', ECONOMY_TABS.map((t) => t.officialName).join('|') === 'Primary sector|Secondary sector|Tertiary sector|Quaternary sector|Quinary sector');
assert('no old names left', !/Making things|Knowledge and tech|Leadership and policy/.test(read('./economy.js') + read('./index.html') + read('./app.js') + read('./sectorui.js')));
assert('sectorById', sectorById('services') === SERVICES && sectorById('nope') === null || sectorById('nope') === undefined);
assert('tabs share the engine shape', ECONOMY_TABS.every((t) => typeof t.headline === 'function' && Array.isArray(t.subs) && Array.isArray(t.stages) && t.subsNoun === 'segments' && t.subNoun === 'segment'));
assert('headlines name the place', ECONOMY_TABS.every((t) => t.headline('Ohio').includes('Ohio') && !BAD.test(t.headline('the world'))));

console.log('\n--- Segments: 5 to 9 per tab, plain names, one-line copy ---');
for (const t of ECONOMY_TABS) {
  const ids = t.subs.map((s) => s.id);
  assert(`${t.label}: ${t.subs.length} segments (5 to 9), unique ids`, t.subs.length >= 5 && t.subs.length <= 9 && new Set(ids).size === ids.length && ids.every((i) => /^[a-z]+$/.test(i)));
  assert(`${t.label}: plain names and one-line descriptions`, t.subs.every((s) => s.name.length <= 40 && !/NAICS|\d/.test(s.name) && s.copy.length <= 120 && !/\n/.test(s.copy) && /\.$/.test(s.copy)));
  assert(`${t.label}: every segment has official codes`, t.subs.every((s) => s.naics.length >= 1));
}
assert('segment ids', [
  RAW_MATERIALS.subs.map((s) => s.id).join(',') === 'crops,livestock,forestry,fishing,oilgas,mining',
  MANUFACTURING.subs.map((s) => s.id).join(',') === 'food,chemicals,metals,machinery,vehicles,goods,construction,power',
  SERVICES.subs.map((s) => s.id).join(',') === 'retail,finance,property,health,education,hospitality,transport,utilities',
  TECHNOLOGY.subs.map((s) => s.id).join(',') === 'software,cloud,telecom,research,consulting,media,cyber',
  POLICY.subs.map((s) => s.id).join(',') === 'government,econpolicy,regulation,international,corporate,universities,nonprofits',
].every(Boolean));

console.log('\n--- NAICS 2022: every code and title matches census.gov ---');
const allCodes = ECONOMY_TABS.flatMap((t) => [...(t.naics || []), ...t.subs.flatMap((s) => s.naics)]);
const wrong = allCodes.filter((n) => NAICS_2022[n.code] !== n.title).map((n) => `${n.code}:${n.title}`);
assert(`${allCodes.length} code references, all verified`, wrong.length === 0, wrong.join(' | '));
assert('every verified code is used', Object.keys(NAICS_2022).every((c) => allCodes.some((n) => n.code === c)));
assert('codes are 2 to 6 digits or a ranged sector', allCodes.every((n) => /^\d{2,6}$/.test(n.code) || /^\d{2}-\d{2}$/.test(n.code)));
assert('ranged sector links use the first part', naicsUrl('31-33') === 'https://www.census.gov/naics/?input=31&year=2022&details=31');
assert('Primary covers 11 and 21', RAW_MATERIALS.naics.map((n) => n.code).join(',') === '11,21');
assert('Technology covers 51 and 54', TECHNOLOGY.naics.map((n) => n.code).join(',') === '51,54');
assert('Policy uses 92 plus leadership codes', POLICY.naics.map((n) => n.code).join(',') === '92,55,611310,813');

console.log('\n--- Policy (Quinary) is a convention, with a real source ---');
assert('convention text says so', /convention/i.test(POLICY.convention.text) && /NAICS has no quinary sector/i.test(POLICY.convention.text));
assert('convention source is a real https page with a date', /^https:\/\/en\.wikipedia\.org\/wiki\/Three-sector_model$/.test(POLICY.convention.source.url) && /^\d{4}-\d{2}-\d{2}$/.test(POLICY.convention.source.date));
assert('only Policy carries a convention', ECONOMY_TABS.filter((t) => t.convention).length === 1);
assert('economic types defined', ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'].every((k) => ECONOMIC_TYPES[k]?.label));

console.log('\n--- Official reference popups ---');
const tabRef = segmentReference(RAW_MATERIALS);
assert('tab reference: Primary sector with NAICS 11, 21', tabRef.typeLabel === 'Primary sector' && tabRef.codes.map((c) => c.code).join(',') === '11,21' && tabRef.codes[0].url.startsWith('https://www.census.gov/naics/'));
const segRef = segmentReference(SERVICES, SERVICES.subs.find((s) => s.id === 'health'));
assert('segment reference: Health care codes 62, 621 to 624', segRef.label === 'Health care' && segRef.codes.map((c) => c.code).join(',') === '62,621,622,623,624');
assert('policy reference carries the convention', segmentReference(POLICY).convention?.source?.url.includes('wikipedia'));

console.log('\n--- Tagging (keywords) ---');
assert('wheat harvest → crops', subs(RAW_MATERIALS, 'Wheat harvest falls as drought hits Kansas farmers').includes('crops'));
assert('copper mine → mining', subs(RAW_MATERIALS, 'Copper mine expansion approved in Arizona').includes('mining'));
assert('salmon farm → fishing', subs(RAW_MATERIALS, 'Salmon farming company expands in Norway').includes('fishing'));
assert('EV factory → vehicles', subs(MANUFACTURING, 'GM to build new EV factory in Tennessee').includes('vehicles'));
assert('steel plant → metals', subs(MANUFACTURING, 'Iowa governor signs incentives for steel plant').includes('metals'));
assert('pharma plant → chemicals', subs(MANUFACTURING, 'Bayer to invest $2.2B in Ohio pharmaceutical facility').includes('chemicals'));
assert('hospital staffing → health', subs(SERVICES, 'Hospitals face nurse shortage in Ohio').includes('health'));
assert('rent data → property', subs(SERVICES, 'Average asking rents fall 4.2% in September').includes('property'));
assert('AI model → software', subs(TECHNOLOGY, 'Startup releases new AI model for software developers').includes('software'));
assert('data center → cloud', subs(TECHNOLOGY, 'AirTrunk plans $1bn data center campus in Japan').includes('cloud'));
assert('breach → cyber', subs(TECHNOLOGY, 'Ransomware attack disrupts hospital systems').includes('cyber'));
assert('Fed (case-sensitive) → central banks', subs(POLICY, 'Fed holds interest rates steady').includes('econpolicy'));
assert('fed up is not the Fed', !subs(POLICY, 'Voters fed up with long lines').includes('econpolicy'));
assert('UN → international', subs(POLICY, 'UN General Assembly opens in New York').includes('international'));
assert('university president → universities', subs(POLICY, 'University president resigns after board of trustees vote').includes('universities'));
console.log('  regressions from the live feed:');
assert('farm-down is not crops', !subs(RAW_MATERIALS, 'Developer agrees farm-down of offshore wind stake').includes('crops'));
assert('geothermal drilling is not oil and gas', !subs(RAW_MATERIALS, 'Geothermal drilling starts in Nevada').includes('oilgas'));
assert('reserve oil stocks are not finance', !subs(SERVICES, 'Germany moves to release reserve oil stocks').includes('finance'));
assert('LNG trains are not transport', !subs(SERVICES, 'Port Arthur LNG trains begin commissioning').includes('transport'));
assert('car carriers are not telecom', !subs(TECHNOLOGY, 'Car Carriers face new port fees').includes('telecom'));
assert('turbine foundation is not a nonprofit', !subs(POLICY, 'Turbine Foundation design approved for wind farm').includes('nonprofits'));
assert('Gates Foundation is a nonprofit', subs(POLICY, 'Gates Foundation pledges $1B for vaccines').includes('nonprofits'));
assert('the Chancellor (finance minister) is not university leadership', !subs(POLICY, 'Exchange of letters between the Governor and the Chancellor regarding CPI').includes('universities'));
assert('electric bus tyres are not chemicals', !subs(MANUFACTURING, 'Charge electric buses using tyres').includes('chemicals'));
assert('award judges are not courts', !subs(POLICY, 'MidAtlantic Judges Select 35 Projects').includes('regulation'));
assert('podcast is not media by itself', !subs(TECHNOLOGY, 'Podcast: Could holographic 3D printing be real?').includes('media'));
assert('Hyatt Studios is not media', !subs(TECHNOLOGY, 'Hyatt updates Hyatt Place, Hyatt Studios prototypes').includes('media'));
console.log('  regressions from the Oct 8 content pass:');
assert('DOE loan to a utility is not banking', !subs(SERVICES, 'Vistra gets $4.2B DOE loan for planned uprates in Ohio, Pennsylvania').includes('finance'));
assert('bank loans still are', subs(SERVICES, 'Outstanding SME bank loans hit record as lenders ease terms').includes('finance'));
assert('a robot flight path is not air travel', !subs(SERVICES, 'Planning system ensures a robot\u2019s flight path will remain collision-free').includes('transport'));
assert('flight cancellations are', subs(SERVICES, 'Flight cancellations pile up at Heathrow').includes('transport'));
assert('a person named Ericsson is not telecom', !subs(TECHNOLOGY, 'Podcast: A brief history of rare earths, ft RMG\u2019s Magnus Ericsson').includes('telecom'));
assert('the EU\'s top auditor is not an audit firm', !subs(TECHNOLOGY, 'Increasing levels of debt carried by EU institutions a concern, says top auditor').includes('consulting'));
assert('assets that breach a figure are not a hack', !subs(TECHNOLOGY, 'BPI Wealth assets breach P2 trillion, eyes 18% growth').includes('cyber'));
assert('a data breach still is', subs(TECHNOLOGY, 'Data breach at hospital exposes patient records').includes('cyber'));
assert('tyre inflation systems are not economic policy', !subs(POLICY, 'Trelleborg out to optimise inflation systems for OTR tyres').includes('econpolicy'));
assert('bare EU is not international affairs', !subs(POLICY, 'OpenAI will watermark ChatGPT outputs by default, but only in the EU').includes('international'));
assert('EU trade measures are', subs(POLICY, 'Merz, Macron seek tougher EU measures against unfair trade').includes('international'));
assert('a CEO quoted on prices is not leadership news', !subs(POLICY, 'Vitol CEO says oil inventories in West have been exhausted').includes('corporate'));
assert('a CEO stepping down is', subs(POLICY, 'Nestle CEO steps down after board review').includes('corporate'));
assert('a vote on building reactors is not construction work', !subs(MANUFACTURING, 'Swiss citizens may get to vote on construction of new reactors').includes('construction'));
assert('starting construction is', subs(MANUFACTURING, 'Clearway starts construction of 650-MW solar facility in Missouri').includes('construction'));
assert('directional drilling for a water pipeline is not oil and gas', !subs(RAW_MATERIALS, 'James River Underwater Pipeline pushes limits of directional drilling').includes('oilgas'));
assert('a nickel refinery is not oil', !tagSector(sectorById('energy'), { title: 'Westwin to build $502M nickel refinery in Mississippi' }).subs.includes('oil'));
assert('an oil refinery still is', tagSector(sectorById('energy'), { title: 'Refinery restarts after crude unit fire' }).subs.includes('oil'));
assert('US Wind (the company) and named US offshore projects are wind', ['US Wind drops Sparrows Point turbine-parts plant', 'Revolution Wind resumes work after stop-work order'].every((t) => tagSector(sectorById('energy'), { title: t }).subs.includes('wind')));
assert('gas turbine makers are not wind', !tagSector(sectorById('energy'), { title: 'Gas turbine makers sold out through 2030' }).subs.includes('wind'));
assert('at most 3 subs per story without cross-listing', ECONOMY_TABS.every((t) => subs(t, 'Senate passes budget bill as Fed, SEC and UN meet over trade, tariffs and courts').length <= 3));

console.log('\n--- Cross-listing from Energy by stage ---');
const v1 = via(RAW_MATERIALS, 'Shale drillers add rigs in Texas oil fields');
assert('extraction (oil) → Raw materials: Oil and gas', v1.oilgas?.from === 'energy' && v1.oilgas.stage === 'extraction');
const v2 = via(RAW_MATERIALS, 'Coal miners open new mine in Wyoming');
assert('extraction (coal) → Raw materials: Mining', v2.mining?.stage === 'extraction');
const v3 = via(MANUFACTURING, 'Refinery restarts after crude unit fire');
assert('generation and refining → Manufacturing: Power plants and refineries', v3.power?.stage === 'generation');
const v4 = via(SERVICES, 'New transmission line will carry wind power to cities');
assert('grid and distribution → Services: Utilities', v4.utilities?.stage === 'grid');
const v5 = via(TECHNOLOGY, 'Startup tests microreactor prototype');
assert('innovation → Technology: Research and science', v5.research?.stage === 'innovation');
assert('no energy match, no cross-listing', Object.keys(via(SERVICES, 'Hospitals face nurse shortage in Ohio')).length === 0);
assert('Policy has no cross-listing', POLICY.cross.length === 0);
assert('cross labels use the new names', [RAW_MATERIALS, MANUFACTURING, SERVICES, TECHNOLOGY].every((t) => t.cross.length === 1 && t.cross[0].from.id === 'energy'));

console.log('\n--- Location following + labelled backfill ---');
const now = new Date('2026-10-07T20:00:00Z');
const mk = (id, title, loc, h = 10) => ({ id, url: `https://x.test/${id}`, title, blurb: '', published: new Date(now - h * 3.6e6).toISOString(), quality: 2, loc: { countries: [], admin1: [], cities: [], titleCountries: [], ...loc }, verification: { status: 'unconfirmed' } });
const items = [
  mk('a', 'Hospitals in Columbus face nurse shortage', { countries: ['us'], admin1: ['us-oh'] }, 5),
  mk('b', 'Medicaid cuts squeeze rural hospitals', { countries: ['us'] }, 6),
  mk('c', 'Hospital chain buys clinics in Texas', { countries: ['us'], admin1: ['us-tx'] }, 7),
  mk('d', 'NHS waiting lists grow', { countries: ['gb'] }, 8),
  mk('e', 'Copper mine expansion approved in Arizona', { countries: ['us'], admin1: ['us-az'] }, 4),
];
const names = { country: (id) => ({ us: 'United States', gb: 'United Kingdom' }[id] || id), admin1: (id) => ({ 'us-oh': 'Ohio', 'us-tx': 'Texas', 'us-az': 'Arizona' }[id] || id), city: (id) => id };
const world = { level: 'world', country: null, admin1: null, city: null };
const us = { level: 'country', country: 'us', admin1: null, city: null };
const ohio = { level: 'admin1', country: 'us', admin1: 'us-oh', city: null };
const colOH = sectorColumn(items, ohio, SERVICES, { sub: 'health', names, now });
assert('Ohio health: own story first, then labelled US backfill', colOH.primary.length === 1 && colOH.primary[0].id === 'a' && colOH.more[0]?.label === 'More from United States' && colOH.fewText.startsWith('Only 1 recent story'));
const colW = sectorColumn(items, world, SERVICES, { sub: 'health', names, now });
assert('World health: stories from several countries', colW.primary.length >= 3);
const colEmpty = sectorColumn(items, ohio, POLICY, { sub: 'nonprofits', names, now });
assert('empty segment: honest empty text, no invented stories', colEmpty.primary.length === 0 && /^No recent [a-z ]+ stories tagged to Ohio\./.test(colEmpty.emptyText));
assert('copper mine is not health', !colW.primary.some((i) => i.id === 'e'));

console.log('\n--- Briefs: Energy schema, none seeded ---');
for (const t of ECONOMY_TABS) {
  const doc = JSON.parse(read(`./data/${t.id}-briefs.json`));
  const r = validateBriefs(doc, t, { now });
  assert(`${t.id}-briefs.json: version 1, sector ${t.id}, empty, valid`, doc.version === 1 && doc.sector === t.id && Object.keys(doc.briefs).length === 0 && r.errors.length === 0);
}
const sample = { version: 1, sector: 'services', briefs: { us: { health: { generated_at: '2026-10-06T18:00:00Z', week_of: '2026-10-01', items: [{ text: 'Test fixture: one sourced item, long enough to pass the length check.', sources: [{ title: 'Agency release', url: 'https://www.cms.gov/newsroom', date: '2026-10-05' }] }] } } } };
const rs = validateBriefs(sample, SERVICES, { now });
assert('a sourced services brief validates', rs.errors.length === 0 && briefFor(rs.valid, us, 'health'));
const badDoc = { version: 1, sector: 'services', briefs: { us: { nope: { generated_at: '2026-10-06T18:00:00Z', week_of: '2026-10-01', items: [{ text: 'x', sources: [] }] } } } };
const rb = validateBriefs(badDoc, SERVICES, { now });
assert('unknown segment and missing sources are rejected', rb.errors.length >= 1 && rb.errors.some((e) => /segment/.test(e)));

console.log('\n--- Overlay: not ready yet + stories, info chips, cross tags ---');
const card = (it, extra = '') => `<article class="feed-item">${it.title}${extra}</article>`;
const empty = validateBriefs({ version: 1, sector: 'services', briefs: {} }, SERVICES, { now }).valid;
const html = renderSectorOverlay({ sector: SERVICES, state: { ssub: 'health', sbrief: true }, place: ohio, names, items, briefs: empty, stage: null, expanded: false, card });
assert('brief view: not ready yet, still shows top stories', /Not yet covered/.test(html) && /Hospitals in Columbus/.test(html));
const list = renderSectorOverlay({ sector: SERVICES, state: { ssub: 'health', sbrief: false }, place: ohio, names, items, briefs: empty, stage: null, expanded: false, card });
assert('eight segment slots', (list.match(/class="sector-slot/g) || []).length === 8);
assert('tab kicker: plain name, official name, info chip', /kicker-name">Services<\/span> ·/.test(list) && /kicker-official" title="Tertiary sector">Tertiary</.test(list) && /tab-info/.test(list));
const withTabs = renderSectorOverlay({ sector: SERVICES, state: { ssub: null, sbrief: false }, place: ohio, names, items, briefs: empty, stage: null, expanded: false, card, tabs: SECTOR_TABS });
assert('window heading: Sectors of the Economy', /<h2 class="sector-window-title" id="sector-window-title">Sectors of the Economy<\/h2>/.test(withTabs) && /aria-labelledby="sector-window-title sector-title"/.test(withTabs));
const swBtns = [...withTabs.matchAll(/<button type="button" class="sswitch[^"]*" data-sswitch="([a-z]+)" aria-label="([^"]+)"/g)];
assert('emoji switcher: the five sectors only, no Energy', swBtns.map((m) => m[1]).join(',') === 'materials,manufacturing,services,technology,policy');
assert('switcher aria-labels carry the full name and type', swBtns.map((m) => m[2]).join('|') === 'Raw materials, Primary sector|Manufacturing, Secondary sector|Services, Tertiary sector|Technology, Quaternary sector|Policy, Quinary sector');
assert('current sector highlighted in the switcher', /class="sswitch is-current" data-sswitch="services"[^>]*aria-current="true"/.test(withTabs) && (withTabs.match(/aria-current="true"><span aria-hidden="true">/g) || []).length === 1);
const energyPanel = renderSectorOverlay({ sector: sectorById('energy'), state: { ssub: null, sbrief: false }, place: ohio, names, items, briefs: { briefs: {} }, stage: null, expanded: false, card, tabs: SECTOR_TABS });
assert('Energy stays separate: no Sectors of the Economy title, no switcher, no Primary to Quinary label', !/Sectors of the Economy/.test(energyPanel) && !/sswitch/.test(energyPanel) && !/kicker-official/.test(energyPanel) && /aria-labelledby="sector-title"/.test(energyPanel));
assert('segment info chip links census.gov', /seg-info/.test(list) && /census\.gov\/naics\/\?input=621/.test(list));
assert('no stage chips on economic tabs', !/data-stage="/.test(list));
assert('labelled backfill in overlay', /More from United States/.test(list));
assert('close label names the tab', /aria-label="Close Services"/.test(list));
const crossItems = [mk('x', 'New transmission line will carry wind power to Columbus', { countries: ['us'], admin1: ['us-oh'] }, 3)];
const crossHtml = renderSectorOverlay({ sector: SERVICES, state: { ssub: 'utilities', sbrief: false }, place: ohio, names, items: crossItems, briefs: empty, stage: null, expanded: false, card });
assert('cross-listed story says where it came from', /data-cross="energy"[^>]*>From Energy: Grid and distribution</.test(crossHtml));
const polHtml = renderSectorOverlay({ sector: POLICY, state: { ssub: null, sbrief: false }, place: world, names, items, briefs: validateBriefs({ version: 1, sector: 'policy', briefs: {} }, POLICY, { now }).valid, stage: null, expanded: false, card });
assert('policy popup shows the convention source', /stage-pop-conv/.test(polHtml) && /wikipedia\.org\/wiki\/Three-sector_model/.test(polHtml));

console.log('\n--- Hash tokens (deep links) ---');
assert('#services/health/brief parses', JSON.stringify(parseSectorToken('services/health/brief', SECTOR_IDS)) === '{"tab":"services","sub":"health","brief":true}');
assert('token build', sectorToken({ tab: 'materials', sub: 'crops' }) === 'materials/crops');
const h = parseHash('#c=us&a=us-oh&technology/cyber');
assert('#c=us&a=us-oh&technology/cyber parses', h.stab === 'technology' && h.ssub === 'cyber' && h.admin1 === 'us-oh');
assert('round trips for every tab', ECONOMY_TABS.every((t) => buildHash(parseHash(`#c=us&${t.id}/${t.subs[0].id}/brief`)) === `c=us&${t.id}/${t.subs[0].id}/brief`));
assert('old links unaffected', buildHash(parseHash('#c=us&t=industries')) === 'c=us&t=industries');

console.log('\n--- Header, Method page, SW, Pages ---');
const index = read('./index.html');
const navBlock = (index.match(/<nav class="sector-nav"[\s\S]*?<\/nav>/) || [''])[0];
const navLabels = [...navBlock.matchAll(/<a class="snav[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
assert('header row: Energy featured, then the five names, each with its emoji', navLabels.join('|') === '\u26A1 Energy|\u26CF\uFE0F Raw materials \u00B7 Primary|\u{1F3ED} Manufacturing \u00B7 Secondary|\u{1F91D} Services \u00B7 Tertiary|\u{1F4BB} Technology \u00B7 Quaternary|\u{1F3DB}\uFE0F Policy \u00B7 Quinary', navLabels.join('|'));
const navEmoji = [...navBlock.matchAll(/<a class="snav[^"]*"[^>]*>\s*<span class="hnav-emoji" aria-hidden="true">([^<]+)<\/span>/g)].map((m) => m[1]);
assert('all six tabs carry an aria-hidden emoji in the same span as Energy', navEmoji.length === 6);
assert('home row: "Sectors of the Economy" label before the five, Energy outside it, types visible on wide screens only', /<span class="snav-sep" aria-hidden="true"><\/span>\s*<span class="snav-group-label" aria-hidden="true">Sectors of the Economy<\/span>\s*<a class="snav" href="#materials"/.test(navBlock) && !/id="nav-energy"[^>]*>[^<]*(?:<span class="hnav-emoji"[^>]*>[^<]*<\/span>)?[^<]*<span class="snav-type"/.test(navBlock) && /\.snav-group-label, \.snav-type \{ display: none; \}/.test(read('./styles.css')));
assert('tab definitions carry the same emojis (panel kicker)', ECONOMY_TABS.map((t) => t.emoji).join('') === navEmoji.slice(1).join(''));
assert('header links carry data-open-sector and official names in aria-labels', ECONOMY_TABS.every((t) => new RegExp(`id="nav-${t.id}"[^>]*data-open-sector="${t.id}"[^>]*aria-label="[^"]*${t.officialName}`).test(navBlock)));
assert('Method section names the tabs and the convention', /id="method-five"/.test(index) && /Raw materials, Manufacturing, Services, Technology, Policy/.test(index) && /Three-sector_model/.test(index) && /id="method-tab-map"/.test(index));
const sw = read('./sw.js');
assert('SW v29 caches economy.js, tabs.js and five briefs files', /long-haul-ledger-v29/.test(sw) && /'\.\/economy\.js'/.test(sw) && /'\.\/tabs\.js'/.test(sw) && ECONOMY_TABS.every((t) => sw.includes(`./data/${t.id}-briefs.json`)));
const wf = read('./.github/workflows/soft-launch.yml');
assert('Pages excludes economy.test.mjs and the four docs', /economy\.test\.mjs/.test(wf) && ['BUILD-PLAN.md', 'RESEARCH-RUNS.md', 'ROADMAP.md', 'BRIEF.md'].every((d) => wf.includes(d)));
assert('brief edits trigger a deploy', ECONOMY_TABS.every((t) => wf.includes(`data/${t.id}-briefs.json`)));
const sources = JSON.parse(read('./data/sources.json')).sources;
assert('sector feeds tagged with a valid tab', sources.filter((s) => s.sector).every((s) => SECTOR_IDS.includes(s.sector)) && ECONOMY_TABS.every((t) => sources.some((s) => s.sector === t.id)));
const rr = read('./RESEARCH-RUNS.md');
assert('RESEARCH-RUNS covers sector briefs after Energy, World and US first', /## Sector briefs/.test(rr) && /World and the United States first/.test(rr) && rr.indexOf('## Energy briefs') < rr.indexOf('## Sector briefs'));
const rm = read('./ROADMAP.md');
assert('ROADMAP has the v25 entry', /v25/.test(rm) && /Raw materials/.test(rm));

console.log('\n--- Phone header: one swipeable row ---');
const css = read('./styles.css');
const phone = (css.match(/@media \(max-width: 900px\) \{\s*\.sector-nav \{[\s\S]*?\n\}/) || [''])[0];
assert('phone row: one line, scrolls sideways, no grid', /flex-wrap: nowrap/.test(phone) && /overflow-x: auto/.test(phone) && !/grid-template-columns/.test(phone));
assert('phone row: scroll snap and momentum', /scroll-snap-type: x mandatory/.test(phone) && /scroll-snap-align: start/.test(phone) && /-webkit-overflow-scrolling: touch/.test(phone));
assert('phone row: no visible scrollbar', /scrollbar-width: none/.test(phone) && /\.sector-nav::-webkit-scrollbar \{ display: none; \}/.test(css));
assert('phone row: edge fade only where more tabs wait', /\.sector-nav\.fade-end/.test(phone) && /\.sector-nav\.fade-start/.test(phone) && /mask-image/.test(phone));
assert('phone row: tap targets at least 44px', /\.snav \{[^}]*min-height: 44px;[^}]*min-width: 44px;/.test(phone));
assert('phone row: full bleed without widening the page', /flex: 0 0 calc\(100% \+ 2 \* var\(--hpad\)\)/.test(phone) && /margin: 0 calc\(-1 \* var\(--hpad\)\)/.test(phone));
const appJs = read('./app.js');
assert('active tab scrolls into view in the row only (not the page)', /function scrollActiveSectorTab\(\)/.test(appJs) && /nav\.scrollTo\(\{ left:/.test(appJs) && !/active\.scrollIntoView/.test(appJs));
assert('fade updates on scroll and resize', /addEventListener\('scroll', updateSectorNavFade, \{ passive: true \}\)/.test(appJs));

console.log('\n--- Voice ---');
const copy = JSON.stringify(ECONOMY_TABS.map((t) => [t.label, t.short, t.officialName, t.headline('the world'), t.convention?.text, t.subs.map((s) => [s.name, s.noun, s.copy])]));
assert('no em dash or tilde in tab copy', !BAD.test(copy));
const methodHtml = (index.match(/id="method-five"[\s\S]*?id="method-tab-map"/) || [''])[0];
assert('no em dash or tilde in Method copy', methodHtml && !BAD.test(methodHtml));
assert('never "admin-1" in copy', !/admin-1/i.test(copy + navBlock + methodHtml));
assert('no paywall or pricing language', !/paywall|subscribe|pricing|premium|\$\d+\s*\/\s*mo/i.test(copy + navBlock + methodHtml));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
