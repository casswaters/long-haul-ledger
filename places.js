/**
 * Long Haul Ledger: place names for every country on the map (ISO 3166-1
 * alpha-2, lowercase, matching world.svg path ids) plus the deterministic
 * gazetteer used to tag news items with a location.
 * Pure data + helpers; shared by the browser, scripts/fetch-signals.mjs and tests.
 */

/** Display names (plain English) for all 185 map countries. */
export const COUNTRY_NAMES = {
  af: 'Afghanistan', al: 'Albania', dz: 'Algeria', ao: 'Angola', ar: 'Argentina', am: 'Armenia', au: 'Australia',
  at: 'Austria', az: 'Azerbaijan', bs: 'Bahamas', bd: 'Bangladesh', by: 'Belarus', be: 'Belgium', bz: 'Belize',
  bj: 'Benin', bt: 'Bhutan', bo: 'Bolivia', ba: 'Bosnia and Herzegovina', bw: 'Botswana', br: 'Brazil', bn: 'Brunei',
  bg: 'Bulgaria', bf: 'Burkina Faso', bi: 'Burundi', kh: 'Cambodia', cm: 'Cameroon', ca: 'Canada', cv: 'Cape Verde',
  cf: 'Central African Republic', td: 'Chad', cl: 'Chile', cn: 'China', co: 'Colombia', km: 'Comoros',
  cd: 'Democratic Republic of the Congo', cg: 'Republic of the Congo', cr: 'Costa Rica', ci: "Côte d'Ivoire",
  hr: 'Croatia', cu: 'Cuba', cy: 'Cyprus', cz: 'Czechia', dk: 'Denmark', dj: 'Djibouti', dm: 'Dominica',
  do: 'Dominican Republic', ec: 'Ecuador', eg: 'Egypt', sv: 'El Salvador', gq: 'Equatorial Guinea', er: 'Eritrea',
  ee: 'Estonia', sz: 'Eswatini', et: 'Ethiopia', fk: 'Falkland Islands', fj: 'Fiji', fi: 'Finland', fr: 'France',
  tf: 'French Southern Territories', ga: 'Gabon', gm: 'Gambia', ge: 'Georgia', de: 'Germany', gh: 'Ghana',
  gr: 'Greece', gl: 'Greenland', gt: 'Guatemala', gn: 'Guinea', gw: 'Guinea-Bissau', gy: 'Guyana', ht: 'Haiti',
  hn: 'Honduras', hu: 'Hungary', is: 'Iceland', in: 'India', id: 'Indonesia', ir: 'Iran', iq: 'Iraq', ie: 'Ireland',
  il: 'Israel', it: 'Italy', jm: 'Jamaica', jp: 'Japan', jo: 'Jordan', kz: 'Kazakhstan', ke: 'Kenya', xk: 'Kosovo',
  kw: 'Kuwait', kg: 'Kyrgyzstan', la: 'Laos', lv: 'Latvia', lb: 'Lebanon', ls: 'Lesotho', lr: 'Liberia', ly: 'Libya',
  lt: 'Lithuania', lu: 'Luxembourg', mg: 'Madagascar', mw: 'Malawi', my: 'Malaysia', mv: 'Maldives', ml: 'Mali',
  mt: 'Malta', mr: 'Mauritania', mu: 'Mauritius', mx: 'Mexico', md: 'Moldova', mn: 'Mongolia', me: 'Montenegro',
  ma: 'Morocco', mz: 'Mozambique', mm: 'Myanmar', na: 'Namibia', np: 'Nepal', nl: 'Netherlands', nc: 'New Caledonia',
  nz: 'New Zealand', ni: 'Nicaragua', ne: 'Niger', ng: 'Nigeria', kp: 'North Korea', mk: 'North Macedonia',
  no: 'Norway', om: 'Oman', pk: 'Pakistan', ps: 'Palestinian Territories', pa: 'Panama', pg: 'Papua New Guinea',
  py: 'Paraguay', pe: 'Peru', ph: 'Philippines', pl: 'Poland', pt: 'Portugal', pr: 'Puerto Rico', qa: 'Qatar',
  ro: 'Romania', ru: 'Russia', rw: 'Rwanda', lc: 'Saint Lucia', vc: 'Saint Vincent and the Grenadines',
  st: 'São Tomé and Príncipe', sa: 'Saudi Arabia', sn: 'Senegal', rs: 'Serbia', sc: 'Seychelles', sl: 'Sierra Leone',
  sg: 'Singapore', sk: 'Slovakia', si: 'Slovenia', sb: 'Solomon Islands', so: 'Somalia', za: 'South Africa',
  kr: 'South Korea', ss: 'South Sudan', es: 'Spain', lk: 'Sri Lanka', sd: 'Sudan', sr: 'Suriname', se: 'Sweden',
  ch: 'Switzerland', sy: 'Syria', tw: 'Taiwan', tj: 'Tajikistan', tz: 'Tanzania', th: 'Thailand', tl: 'Timor-Leste',
  tg: 'Togo', tt: 'Trinidad and Tobago', tn: 'Tunisia', tr: 'Türkiye', tm: 'Turkmenistan', ug: 'Uganda',
  ua: 'Ukraine', ae: 'United Arab Emirates', gb: 'United Kingdom', us: 'United States', uy: 'Uruguay',
  uz: 'Uzbekistan', vu: 'Vanuatu', ve: 'Venezuela', vn: 'Vietnam', eh: 'Western Sahara', ye: 'Yemen',
  zm: 'Zambia', zw: 'Zimbabwe',
};

export function countryName(id) {
  if (!id) return '';
  const k = String(id).toLowerCase();
  return COUNTRY_NAMES[k] || k.toUpperCase();
}

/**
 * Extra names per country (matched case-sensitively, whole words). Names that
 * need context (Georgia, Jordan, Chad, Niger, Turkey, Washington…) are handled
 * by rules in locate.js, not listed here.
 */
export const COUNTRY_ALIASES = {
  us: ['United States of America', 'United States', 'U.S.A.', 'U.S.', 'USA', 'US', 'America', 'White House', 'Pentagon', 'Wall Street', 'Capitol Hill', 'Silicon Valley'],
  gb: ['United Kingdom', 'Great Britain', 'Britain', 'U.K.', 'UK', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Downing Street', 'Westminster', 'Whitehall'],
  ae: ['United Arab Emirates', 'UAE', 'U.A.E.', 'Emirates', 'Abu Dhabi', 'Dubai'],
  cd: ['Democratic Republic of the Congo', 'Democratic Republic of Congo', 'DR Congo', 'DRC', 'Congo-Kinshasa', 'Kinshasa'],
  cg: ['Republic of the Congo', 'Republic of Congo', 'Congo-Brazzaville', 'Brazzaville'],
  ci: ["Côte d'Ivoire", 'Côte d’Ivoire', "Cote d'Ivoire", 'Ivory Coast'],
  cz: ['Czech Republic', 'Czechia'],
  kr: ['South Korea', 'Republic of Korea', 'Seoul'],
  kp: ['North Korea', 'Pyongyang', 'DPRK'],
  ru: ['Russian Federation', 'Kremlin'],
  cn: ['People’s Republic of China', "People's Republic of China", 'PRC', 'Hong Kong', 'Macau', 'Zhongnanhai'],
  tw: ['Taiwan', 'Taipei'],
  nl: ['Netherlands', 'Holland', 'The Hague'],
  mm: ['Myanmar', 'Burma'],
  sz: ['Eswatini', 'Swaziland'],
  mk: ['North Macedonia'],
  tr: ['Türkiye', 'Turkiye', 'Ankara'],
  ps: ['Palestinian Territories', 'Palestine', 'Gaza Strip', 'Gaza', 'West Bank'],
  ba: ['Bosnia and Herzegovina', 'Bosnia-Herzegovina', 'Bosnia'],
  tt: ['Trinidad and Tobago', 'Trinidad'],
  st: ['São Tomé and Príncipe', 'Sao Tome and Principe'],
  vc: ['Saint Vincent and the Grenadines', 'St Vincent and the Grenadines'],
  lc: ['Saint Lucia', 'St Lucia', 'St. Lucia'],
  tl: ['Timor-Leste', 'East Timor'],
  cv: ['Cape Verde', 'Cabo Verde'],
  sa: ['Saudi Arabia', 'Riyadh', 'Saudi'],
  ir: ['Tehran'],
  il: ['Knesset', 'Tel Aviv', 'Jerusalem'],
  de: ['Bundestag', 'Berlin'],
  fr: ['Élysée', 'Elysee'],
  in: ['New Delhi'],
  ua: ['Kyiv', 'Kiev'],
  eh: ['Western Sahara'],
  fk: ['Falkland Islands', 'Falklands'],
  gl: ['Greenland'],
  pr: ['Puerto Rico'],
  nc: ['New Caledonia'],
  bs: ['Bahamas'],
  gm: ['Gambia'],
};

/** Demonyms / adjectives (case-sensitive, whole words). */
export const DEMONYMS = {
  us: ['American', 'Americans'], ca: ['Canadian', 'Canadians'], mx: ['Mexican', 'Mexicans'], br: ['Brazilian', 'Brazilians'],
  ar: ['Argentine', 'Argentinian', 'Argentinians'], cl: ['Chilean', 'Chileans'], co: ['Colombian', 'Colombians'], pe: ['Peruvian'],
  ve: ['Venezuelan', 'Venezuelans'], ec: ['Ecuadorian'], bo: ['Bolivian'], uy: ['Uruguayan'], py: ['Paraguayan'], cu: ['Cuban', 'Cubans'],
  ht: ['Haitian', 'Haitians'], jm: ['Jamaican'], gt: ['Guatemalan'], hn: ['Honduran'], pa: ['Panamanian'], cr: ['Costa Rican'],
  sv: ['Salvadoran'], ni: ['Nicaraguan'], do: ['Dominican'], gy: ['Guyanese'], sr: ['Surinamese'],
  gb: ['British', 'Briton', 'Britons', 'Scottish', 'Welsh'], ie: ['Irish'], fr: ['French'], de: ['German', 'Germans'], it: ['Italian', 'Italians'],
  es: ['Spanish', 'Spaniards'], pt: ['Portuguese'], nl: ['Dutch'], be: ['Belgian'], lu: ['Luxembourgish'], ch: ['Swiss'], at: ['Austrian'],
  dk: ['Danish'], se: ['Swedish'], no: ['Norwegian'], fi: ['Finnish'], is: ['Icelandic'], pl: ['Polish', 'Poles'], cz: ['Czech'],
  sk: ['Slovak'], hu: ['Hungarian'], ro: ['Romanian'], bg: ['Bulgarian'], gr: ['Greek'], cy: ['Cypriot'], mt: ['Maltese'],
  si: ['Slovenian'], hr: ['Croatian'], rs: ['Serbian'], ba: ['Bosnian'], me: ['Montenegrin'], al: ['Albanian'], xk: ['Kosovar'],
  mk: ['Macedonian'], md: ['Moldovan'], ua: ['Ukrainian', 'Ukrainians'], by: ['Belarusian'], ru: ['Russian', 'Russians'],
  lt: ['Lithuanian'], lv: ['Latvian'], ee: ['Estonian'], am: ['Armenian'], az: ['Azerbaijani'],
  tr: ['Turkish'], il: ['Israeli', 'Israelis'], ps: ['Palestinian', 'Palestinians'], lb: ['Lebanese'], sy: ['Syrian', 'Syrians'],
  iq: ['Iraqi', 'Iraqis'], ir: ['Iranian', 'Iranians'], sa: ['Saudis'], ae: ['Emirati'], qa: ['Qatari'], kw: ['Kuwaiti'],
  om: ['Omani'], ye: ['Yemeni'], eg: ['Egyptian', 'Egyptians'], ly: ['Libyan'], tn: ['Tunisian'], dz: ['Algerian'],
  ma: ['Moroccan'], sd: ['Sudanese'], ss: ['South Sudanese'], et: ['Ethiopian'], er: ['Eritrean'], so: ['Somali'], ke: ['Kenyan', 'Kenyans'],
  ug: ['Ugandan'], tz: ['Tanzanian'], rw: ['Rwandan'], bi: ['Burundian'], cd: ['Congolese'], ao: ['Angolan'], zm: ['Zambian'],
  zw: ['Zimbabwean'], mw: ['Malawian'], mz: ['Mozambican'], za: ['South African', 'South Africans'], na: ['Namibian'],
  bw: ['Botswanan'], mg: ['Malagasy'], ng: ['Nigerian', 'Nigerians'], gh: ['Ghanaian'], ci: ['Ivorian'], sn: ['Senegalese'],
  ml: ['Malian'], bf: ['Burkinabe'], cm: ['Cameroonian'], ga: ['Gabonese'], mr: ['Mauritanian'], lr: ['Liberian'], sl: ['Sierra Leonean'],
  gn: ['Guinean'], bj: ['Beninese'], tg: ['Togolese'], cf: ['Central African'],
  cn: ['Chinese'], jp: ['Japanese'], kr: ['South Korean', 'South Koreans'], kp: ['North Korean', 'North Koreans'], tw: ['Taiwanese'],
  mn: ['Mongolian'], in: ['Indian', 'Indians'], pk: ['Pakistani', 'Pakistanis'], bd: ['Bangladeshi'], lk: ['Sri Lankan'],
  np: ['Nepali', 'Nepalese'], bt: ['Bhutanese'], af: ['Afghan', 'Afghans'], kz: ['Kazakh', 'Kazakhstani'], uz: ['Uzbek'], kg: ['Kyrgyz'],
  tj: ['Tajik'], tm: ['Turkmen'], id: ['Indonesian', 'Indonesians'], my: ['Malaysian', 'Malaysians'], sg: ['Singaporean'],
  th: ['Thai'], vn: ['Vietnamese'], ph: ['Filipino', 'Filipinos', 'Philippine'], kh: ['Cambodian'], la: ['Laotian'], mm: ['Burmese'],
  bn: ['Bruneian'], au: ['Australian', 'Australians'], nz: ['Kiwi'], pg: ['Papua New Guinean'], fj: ['Fijian'],
};

/**
 * State equivalents matched by name (ISO 3166-2 style ids from data/geo/admin1.geojson).
 * Only countries where state names are distinctive in English news are listed;
 * ambiguous names (Georgia, Washington, New York, Victoria, Punjab, Hidalgo…) are rules, not entries.
 */
export const ADMIN1_NAMES = {
  'us-al': ['Alabama'], 'us-ak': ['Alaska'], 'us-az': ['Arizona'], 'us-ar': ['Arkansas'], 'us-ca': ['California', 'Silicon Valley'],
  'us-co': ['Colorado'], 'us-ct': ['Connecticut'], 'us-de': ['Delaware'], 'us-fl': ['Florida'], 'us-hi': ['Hawaii'], 'us-id': ['Idaho'],
  'us-il': ['Illinois'], 'us-in': ['Indiana'], 'us-ia': ['Iowa'], 'us-ks': ['Kansas'], 'us-ky': ['Kentucky'], 'us-la': ['Louisiana'],
  'us-me': ['Maine'], 'us-md': ['Maryland'], 'us-ma': ['Massachusetts'], 'us-mi': ['Michigan'], 'us-mn': ['Minnesota'],
  'us-ms': ['Mississippi'], 'us-mo': ['Missouri'], 'us-mt': ['Montana'], 'us-ne': ['Nebraska'], 'us-nv': ['Nevada'],
  'us-nh': ['New Hampshire'], 'us-nj': ['New Jersey'], 'us-nm': ['New Mexico'], 'us-nc': ['North Carolina'], 'us-nd': ['North Dakota'],
  'us-oh': ['Ohio'], 'us-ok': ['Oklahoma'], 'us-or': ['Oregon'], 'us-pa': ['Pennsylvania'], 'us-ri': ['Rhode Island'],
  'us-sc': ['South Carolina'], 'us-sd': ['South Dakota'], 'us-tn': ['Tennessee'], 'us-tx': ['Texas'], 'us-ut': ['Utah'],
  'us-vt': ['Vermont'], 'us-va': ['Virginia'], 'us-wa': ['Washington state', 'Washington State'], 'us-wv': ['West Virginia'],
  'us-wi': ['Wisconsin'], 'us-wy': ['Wyoming'], 'us-dc': ['Washington, D.C.', 'Washington DC', 'Washington D.C.', 'District of Columbia'],
  'us-ny': ['New York state', 'New York State'],
  'ca-on': ['Ontario'], 'ca-qc': ['Quebec', 'Québec'], 'ca-bc': ['British Columbia'], 'ca-ab': ['Alberta'], 'ca-sk': ['Saskatchewan'],
  'ca-mb': ['Manitoba'], 'ca-nb': ['New Brunswick'], 'ca-ns': ['Nova Scotia'], 'ca-nl': ['Newfoundland and Labrador', 'Newfoundland'],
  'ca-pe': ['Prince Edward Island'], 'ca-yt': ['Yukon'], 'ca-nu': ['Nunavut'], 'ca-nt': ['Northwest Territories'],
  'au-ns': ['New South Wales'], 'au-ql': ['Queensland'], 'au-wa': ['Western Australia'], 'au-sa': ['South Australia'],
  'au-ts': ['Tasmania'], 'au-nt': ['Northern Territory'], 'au-ct': ['Australian Capital Territory', 'Canberra'],
  'de-by': ['Bavaria', 'Bayern'], 'de-sn': ['Saxony', 'Sachsen'], 'de-bw': ['Baden-Württemberg', 'Baden-Wurttemberg'],
  'de-nw': ['North Rhine-Westphalia', 'Nordrhein-Westfalen'], 'de-ni': ['Lower Saxony', 'Niedersachsen'], 'de-he': ['Hesse', 'Hessen'],
  'de-be': ['Brandenburg'], 'de-th': ['Thuringia', 'Thüringen'], 'de-st': ['Saxony-Anhalt', 'Sachsen-Anhalt'],
  'de-sh': ['Schleswig-Holstein'], 'de-mv': ['Mecklenburg-Vorpommern', 'Mecklenburg-Western Pomerania'],
  'de-rp': ['Rhineland-Palatinate', 'Rheinland-Pfalz'], 'de-sl': ['Saarland'], 'de-hh': ['Hamburg'], 'de-hb': ['Bremen'], 'de-be-2': ['Berlin'],
  'in-mh': ['Maharashtra'], 'in-gj': ['Gujarat'], 'in-tn': ['Tamil Nadu'], 'in-ka': ['Karnataka'], 'in-kl': ['Kerala'],
  'in-up': ['Uttar Pradesh'], 'in-rj': ['Rajasthan'], 'in-ap': ['Andhra Pradesh'], 'in-tg': ['Telangana'], 'in-or': ['Odisha'],
  'in-wb': ['West Bengal'], 'in-br': ['Bihar'], 'in-as': ['Assam'], 'in-hr': ['Haryana'], 'in-mp': ['Madhya Pradesh'],
  'in-jh': ['Jharkhand'], 'in-ct': ['Chhattisgarh'], 'in-ut': ['Uttarakhand'], 'in-hp': ['Himachal Pradesh'], 'in-ga': ['Goa'],
  'in-dl': ['Delhi', 'New Delhi'], 'in-jk': ['Jammu and Kashmir'], 'in-la': ['Ladakh'],
  'cn-gd': ['Guangdong'], 'cn-js': ['Jiangsu'], 'cn-zj': ['Zhejiang'], 'cn-sd': ['Shandong'], 'cn-sc': ['Sichuan'], 'cn-hu': ['Hubei'],
  'cn-he': ['Henan'], 'cn-fj': ['Fujian'], 'cn-hb': ['Hebei'], 'cn-hn': ['Hunan'], 'cn-ah': ['Anhui'], 'cn-ln': ['Liaoning'],
  'cn-sa': ['Shaanxi'], 'cn-sx': ['Shanxi'], 'cn-yn': ['Yunnan'], 'cn-gx': ['Guangxi'], 'cn-nm': ['Inner Mongolia'],
  'cn-xj': ['Xinjiang'], 'cn-xz': ['Tibet', 'Xizang'], 'cn-hl': ['Heilongjiang'], 'cn-jl': ['Jilin'], 'cn-jx': ['Jiangxi'],
  'cn-gs': ['Gansu'], 'cn-gz': ['Guizhou'], 'cn-ha': ['Hainan'], 'cn-qh': ['Qinghai'], 'cn-nx': ['Ningxia'],
  'cn-sh': ['Shanghai'], 'cn-bj': ['Beijing'], 'cn-tj': ['Tianjin'], 'cn-cq': ['Chongqing'],
  'br-sp': ['São Paulo', 'Sao Paulo'], 'br-rj': ['Rio de Janeiro'], 'br-mg': ['Minas Gerais'], 'br-ba': ['Bahia'],
  'br-rs': ['Rio Grande do Sul'], 'br-pr': ['Paraná'], 'br-pa': ['Pará'], 'br-am': ['Amazonas'], 'br-pe': ['Pernambuco'],
  'br-ce': ['Ceará'], 'br-go': ['Goiás'], 'br-sc': ['Santa Catarina'], 'br-mt': ['Mato Grosso'], 'br-ms': ['Mato Grosso do Sul'],
  'br-es': ['Espírito Santo'],
  'mx-nl': ['Nuevo León', 'Nuevo Leon'], 'mx-ja': ['Jalisco'], 'mx-bc': ['Baja California'], 'mx-so': ['Sonora'],
  'mx-ch': ['Chihuahua'], 'mx-co': ['Coahuila'], 'mx-tm': ['Tamaulipas'], 'mx-gj': ['Guanajuato'], 'mx-qt': ['Querétaro', 'Queretaro'],
  'mx-pu': ['Puebla'], 'mx-ve': ['Veracruz'], 'mx-yu': ['Yucatán', 'Yucatan'], 'mx-oa': ['Oaxaca'], 'mx-cs': ['Chiapas'],
  'mx-tb': ['Tabasco'], 'mx-qr': ['Quintana Roo'], 'mx-si': ['Sinaloa'], 'mx-mi': ['Michoacán', 'Michoacan'],
  'mx-df': ['Mexico City', 'Ciudad de México'], 'mx-ag': ['Aguascalientes'], 'mx-sl': ['San Luis Potosí', 'San Luis Potosi'],
};

/** City names never used as location cues (ambiguous, common words, or metonyms for another body). */
export const CITY_STOP = new Set([
  'Washington', 'Washington,  D.C.', 'Portland', 'Columbus', 'Aurora', 'Victoria', 'Hamilton', 'Kingston', 'Georgetown',
  'Birmingham', 'Santiago', 'León', 'Valencia', 'Cartagena', 'Santa Ana', 'San Cristóbal', 'San Luis', 'Mérida', 'Tripoli',
  'Alexandria', 'Medina', 'Cambridge', 'Brussels', 'Nice', 'Mobile', 'Reading', 'Bath', 'Split', 'Cork', 'Male', 'Sale',
  'Chester', 'Florence', 'Richmond', 'Springfield', 'Irvine', 'Phoenix', 'Independence', 'Concepción', 'Córdoba', 'Trujillo',
  'Barcelona', 'Bandar Lampung', 'Niamey', 'Hyderabad', 'New York',
]);
