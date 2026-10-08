/**
 * Long Haul Ledger: the five economic-type sector tabs (Primary to Quinary).
 * Each tab is a definition for the sector-tab engine (sectors.js) and UI
 * (sectorui.js), exactly like Energy (energy.js).
 *
 * Plain labels everywhere; each tab and segment points back to its official
 * category: the economic type plus NAICS 2022 codes (every code and title
 * checked on census.gov), with the BLS industries index as the taxonomy
 * reference. Quinary has no NAICS sector, so Policy maps by convention to
 * Public Administration (92) plus top corporate (55), university (611310)
 * and nonprofit (813) leadership; the Method page says so and cites a source.
 *
 * Cross-listing: energy stories also file into one segment here by their
 * lifecycle stage (Extraction, Generation and refining, Grid and distribution,
 * Innovation), using the stage mapping in energy.js.
 */
import { ENERGY } from './energy.js';

const W = (s, f = 'i') => new RegExp(`\\b(?:${s})\\b`, f);

/** Energy cross-listing helpers: energy tags -> segment ids in a tab. */
const has = (t, stage) => (t.stages || []).includes(stage);
const anySub = (t, ids) => (t.subs || []).some((s) => ids.includes(s));

export const RAW_MATERIALS = {
  id: 'materials',
  emoji: '\u26CF\uFE0F',
  label: 'Raw materials',
  short: 'Raw materials',
  economicType: 'primary',
  officialName: 'Primary sector',
  naics: [
    { code: '11', title: 'Agriculture, Forestry, Fishing and Hunting' },
    { code: '21', title: 'Mining, Quarrying, and Oil and Gas Extraction' },
  ],
  subsNoun: 'segments',
  subNoun: 'segment',
  headline: (place) => `Everything ${place} grows, catches, cuts or digs out of the ground, each in its own slot.`,
  subs: [
    {
      id: 'crops', name: 'Crops', noun: 'crops',
      copy: 'Grains, fruit, vegetables and other plants grown on farms.',
      naics: [{ code: '111', title: 'Crop Production' }, { code: '115', title: 'Support Activities for Agriculture and Forestry' }],
      rules: [W('crops?|harvests?|wheat|corn|soybeans?|soy|maize|barley|rice|cocoa|sugar ?cane|cotton crop|grains?|farmland|farmers?|farming|farms?|agricultur\\w*|agri\\w*|fertili[sz]ers?|orchards?|growers?|coffee (?:crop|harvest|beans|growers|prices)|crop insurance|farm bill'), W('USDA', '')],
      neg: [W('farm-down|farm-in|farm-out|farmouts?|farmed (?:down|out|in)|wind farms?|solar farms?|server farms?|fish farms?|salmon farms?|troll farms?|content farms?|bot farms?')],
      keep: [W('crops?|harvests?|wheat|corn|soybeans?|grains?|farmers?')],
    },
    {
      id: 'livestock', name: 'Livestock', noun: 'livestock',
      copy: 'Cattle, pigs, poultry, dairy and eggs raised on farms and ranches.',
      naics: [{ code: '112', title: 'Animal Production and Aquaculture' }],
      rules: [W('livestock|cattle|beef|pork|hogs?|pigs?|poultry|chickens?|dairy|milk prices|egg prices|eggs|ranch\\w*|bird flu|avian (?:influenza|flu)|swine|sheep|herds?|feedlots?|screwworm|foot-and-mouth')],
    },
    {
      id: 'forestry', name: 'Forestry and logging', noun: 'forestry',
      copy: 'Growing, cutting and hauling timber from forests.',
      naics: [{ code: '113', title: 'Forestry and Logging' }],
      rules: [W('forestry|logging|loggers|timber|timberlands?|pulpwood|sawlogs?|deforestation|forest products|tree plantations?|forest industry|harvested wood')],
      neg: [W('logging (?:software|tools?|data|platform)|data logging|event logging|audit logging')],
    },
    {
      id: 'fishing', name: 'Fishing and fish farming', noun: 'fishing',
      copy: 'Wild catch from rivers and seas, plus fish and shellfish farms.',
      naics: [{ code: '114', title: 'Fishing, Hunting and Trapping' }, { code: '1125', title: 'Aquaculture' }],
      rules: [W('fishing|fisher(?:y|ies|men|man|s)|fish stocks?|seafood|salmon|tuna|shrimp|prawns?|aquaculture|fish farm\\w*|salmon farm\\w*|trawlers?|catch quotas?|krill|mackerel|cod|squid|shellfish|oysters?')],
      neg: [W('fishing expedition')],
    },
    {
      id: 'oilgas', name: 'Oil and gas', noun: 'oil and gas extraction',
      copy: 'Drilling for crude oil and natural gas, on land and offshore.',
      naics: [{ code: '211', title: 'Oil and Gas Extraction' }, { code: '213111', title: 'Drilling Oil and Gas Wells' }, { code: '213112', title: 'Support Activities for Oil and Gas Operations' }],
      rules: [W('oilfields?|oil fields?|gas fields?|drilling|drillers?|rig counts?|shale|upstream|crude (?:output|production)|oil (?:output|production)|gas (?:output|production)|barrels (?:per|a) day|bpd|offshore blocks?|exploration wells?|fracking|oil and gas (?:producers?|companies|exploration)'), /\bOPEC\b/],
      neg: [W('drilling (?:down|into the data)|geothermal|lithium brine|directional drill\\w*|water pipeline|underwater pipeline|tunnel')],
      keep: [W('oil|natural gas|crude|OPEC|shale|LNG')],
    },
    {
      id: 'mining', name: 'Mining and quarrying', noun: 'mining',
      copy: 'Digging out coal, metals, minerals, sand and stone.',
      naics: [{ code: '212', title: 'Mining (except Oil and Gas)' }, { code: '213114', title: 'Support Activities for Metal Mining' }, { code: '213115', title: 'Support Activities for Nonmetallic Minerals (except Fuels) Mining' }],
      rules: [W('mines?|mining|miners?|copper|lithium|nickel|cobalt|iron ore|gold mines?|gold miners?|gold output|rare earths?|bauxite|quarr(?:y|ies|ying)|critical minerals|ores?|uranium mines?|potash|graphite|zinc|manganese|coal mines?|mineral (?:deposits?|exploration|rights)')],
      neg: [W('bitcoin|crypto\\w*|data mining|land ?mines?|mine(?:d|s)? (?:the|their|our) data')],
      keep: [W('copper|lithium|nickel|cobalt|iron ore|gold mines?|rare earths?|coal mines?|mining (?:company|companies|firm|giant|project|licen[cs]es?)')],
    },
  ],
  stages: [],
  /** Energy stories with the Extraction stage file here: oil and gas to Oil and gas, the rest (coal, uranium, lithium) to Mining. */
  cross: [{
    from: ENERGY,
    label: 'Energy',
    map: (t) => {
      if (!has(t, 'extraction')) return [];
      if (anySub(t, ['oil', 'gas'])) return [{ sub: 'oilgas', stage: 'extraction' }];
      if (anySub(t, ['coal', 'nuclear', 'emerging'])) return [{ sub: 'mining', stage: 'extraction' }];
      return [];
    },
  }],
};

export const MANUFACTURING = {
  id: 'manufacturing',
  emoji: '\u{1F3ED}',
  label: 'Manufacturing',
  short: 'Manufacturing',
  economicType: 'secondary',
  officialName: 'Secondary sector',
  naics: [
    { code: '31-33', title: 'Manufacturing' },
    { code: '23', title: 'Construction' },
    { code: '22111', title: 'Electric Power Generation' },
  ],
  subsNoun: 'segments',
  subNoun: 'segment',
  headline: (place) => `How ${place} turns raw materials into products, buildings and power, each in its own slot.`,
  subs: [
    {
      id: 'food', name: 'Food and drink', noun: 'food and drink manufacturing',
      copy: 'Turning crops and livestock into packaged food, drinks and tobacco.',
      naics: [{ code: '311', title: 'Food Manufacturing' }, { code: '312', title: 'Beverage and Tobacco Product Manufacturing' }],
      rules: [W('food (?:processing|processors?|makers?|manufactur\\w*|companies|company|giants?|plants?|industry|maker)|meatpack\\w*|meat processors?|brewer(?:y|ies|s)?|distiller(?:y|ies|s)?|beverages?|bottlers?|snacks?|packaged foods?|soft drinks?|tobacco|cigarettes?|Nestl[eé]|PepsiCo|Coca-Cola|Kraft Heinz|Tyson|JBS|Mondelez|Danone|General Mills|bakery|bakeries|sugar refiner\\w*|flour mills?')],
    },
    {
      id: 'chemicals', name: 'Chemicals and medicines', noun: 'chemicals and medicines',
      copy: 'Chemicals, plastics, fertilizer and the factories that make medicines.',
      naics: [{ code: '325', title: 'Chemical Manufacturing' }, { code: '3254', title: 'Pharmaceutical and Medicine Manufacturing' }, { code: '326', title: 'Plastics and Rubber Products Manufacturing' }],
      rules: [W('chemicals?|petrochemicals?|plastics?|fertili[sz]er (?:plants?|makers?|producers?|production)|pharmaceuticals?|pharma|drugmakers?|drug makers?|vaccine (?:plants?|makers?|production|manufactur\\w*)|BASF|Dow Chemical|Dow Inc|polymers?|resins?|rubber (?:makers?|plants?|industry|prices)|(?:tyre|tire) (?:makers?|plants?|factory|factories|manufactur\\w*)|generic drugs?|drug (?:prices|manufactur\\w*|shortages?)|Pfizer|Novo Nordisk|Eli Lilly|AstraZeneca|Merck|Roche|Sanofi', 'i')],
      neg: [W('chemical (?:weapons?|attacks?)|chemistry between')],
    },
    {
      id: 'metals', name: 'Metals, cement and glass', noun: 'metals, cement and glass',
      copy: 'Steel, aluminum and other metals, plus cement, glass and building materials.',
      naics: [{ code: '327', title: 'Nonmetallic Mineral Product Manufacturing' }, { code: '331', title: 'Primary Metal Manufacturing' }, { code: '332', title: 'Fabricated Metal Product Manufacturing' }],
      rules: [W('steel(?:makers?|maker|mills?|works|plants?|industry|output|production)?|alumin(?:i)?um|smelters?|smelting|foundr(?:y|ies)|cement|glass(?:makers?|works)?|metalworking|metal (?:prices|fabricat\\w*|industry)|ArcelorMittal|Nippon Steel|US Steel|U\\.S\\. Steel|Tata Steel|Nucor|Alcoa|Rio Tinto aluminium')],
      neg: [W('nerves of steel|glass ceiling|stainless steel (?:watch|knife)')],
    },
    {
      id: 'machinery', name: 'Machines and electronics', noun: 'machines and electronics',
      copy: 'Industrial machinery, electrical equipment, computers and chips.',
      naics: [{ code: '333', title: 'Machinery Manufacturing' }, { code: '334', title: 'Computer and Electronic Product Manufacturing' }, { code: '3344', title: 'Semiconductor and Other Electronic Component Manufacturing' }, { code: '335', title: 'Electrical Equipment, Appliance, and Component Manufacturing' }],
      rules: [W('semiconductors?|chipmakers?|chip ?makers?|chip (?:plants?|factory|factories|exports?|industry|production|manufactur\\w*|supply|shortage|sales)|chips|TSMC|Samsung Electronics|SK Hynix|Micron|Nvidia|ASML|wafers?|fabs?|machinery|machine tools?|robots?|robotics|industrial equipment|electrical equipment|transformers?|turbine (?:makers?|factory|factories|manufactur\\w*|orders|blades? factory)|appliances?|consumer electronics|electronics (?:makers?|manufactur\\w*|exports?|industry)|Foxconn|Siemens|Caterpillar|Deere|batter(?:y|ies) (?:plants?|factory|factories|makers?|cells?)|gigafactor(?:y|ies)', 'i'), W('Intel', '')],
      neg: [W('blue[- ]chips?|bargaining chips?|chip in|potato chips|poker chips?|fish and chips')],
      keep: [W('semiconductors?|chipmakers?|TSMC|wafers?')],
    },
    {
      id: 'vehicles', name: 'Vehicles, planes and ships', noun: 'vehicle, aircraft and ship manufacturing',
      copy: 'Cars, trucks, aircraft, ships and the parts that go into them.',
      naics: [{ code: '336', title: 'Transportation Equipment Manufacturing' }, { code: '3361', title: 'Motor Vehicle Manufacturing' }, { code: '3364', title: 'Aerospace Product and Parts Manufacturing' }],
      rules: [W('automakers?|carmakers?|car ?makers?|auto (?:industry|plants?|parts|makers?|sector|sales|workers|tariffs?)|autos|electric vehicles?|EVs?|car (?:plants?|factory|factories|production|sales|exports?)|vehicle (?:production|sales|makers?)|Tesla|Toyota|Volkswagen|BYD|General Motors|Stellantis|Hyundai|Kia|Honda|Nissan|Renault|BMW|Mercedes-Benz|Rivian|Boeing|Airbus|Embraer|aircraft (?:makers?|orders?|production|deliveries)|planemakers?|jets? (?:orders?|deliveries)|shipbuild\\w*|shipyards?|aerospace|trucks? makers?|truck production|locomotives?|rolling stock', 'i'), W('VW|GM', '')],
    },
    {
      id: 'goods', name: 'Clothing, wood and paper', noun: 'clothing, wood and paper goods',
      copy: 'Textiles, clothing, lumber, paper and packaging.',
      naics: [{ code: '313', title: 'Textile Mills' }, { code: '315', title: 'Apparel Manufacturing' }, { code: '321', title: 'Wood Product Manufacturing' }, { code: '322', title: 'Paper Manufacturing' }],
      rules: [W('textiles?|garments?|garment (?:factory|factories|workers|exports?)|apparel (?:makers?|factory|factories|exports?|industry)|clothing (?:factory|factories|makers?|exports?|industry)|lumber|sawmills?|plywood|wood products|pulp (?:mills?|prices)|paper (?:mills?|makers?|industry)|packaging (?:makers?|plants?|industry)|cardboard|footwear (?:makers?|factory|factories|exports?)')],
    },
    {
      id: 'construction', name: 'Construction', noun: 'construction',
      copy: 'Building homes, offices, factories, roads, bridges and other infrastructure.',
      naics: [{ code: '23', title: 'Construction' }, { code: '236', title: 'Construction of Buildings' }, { code: '237', title: 'Heavy and Civil Engineering Construction' }, { code: '238', title: 'Specialty Trade Contractors' }],
      rules: [W('construction (?:industry|firms?|compan(?:y|ies)|workers|jobs|spending|output|starts|costs?|materials|sector|contracts?|boom|slump|crews?|sites?|loans?|activity|projects?)|(?:begins?|began|starts?|started|completes?|completed|halts?|halted|resumes?|resumed) construction|construction (?:begins|began|starts|started|resumes)|homebuild\\w*|housebuild\\w*|housing starts|building permits|infrastructure (?:projects?|spending|plans?|bill|deals?|investment)|megaprojects?|groundbreaking|broke ground|breaks ground|contractors?|skyscrapers?|highway (?:projects?|expansion)|bridge (?:projects?|construction|collapse)|tunnels?|construction (?:costs?|workers|firms?|industry|sector|output)')],
      neg: [W('social construction|under construction(?: site)? for (?:the )?website')],
    },
    {
      id: 'power', name: 'Power plants and refineries', noun: 'power generation and refining',
      copy: 'Generating electricity and refining crude oil into fuels.',
      naics: [{ code: '22111', title: 'Electric Power Generation' }, { code: '324', title: 'Petroleum and Coal Products Manufacturing' }],
      rules: [W('power plants?|power stations?|refiner(?:y|ies|s)|refining|generating capacity|gigawatts?|megawatts?|reactors?|coal-fired|gas-fired|power generation|electricity generation')],
    },
  ],
  stages: [],
  /** Energy stories with Generation and refining file under Power plants and refineries. */
  cross: [{ from: ENERGY, label: 'Energy', map: (t) => (has(t, 'generation') ? [{ sub: 'power', stage: 'generation' }] : []) }],
};

export const SERVICES = {
  id: 'services',
  emoji: '\u{1F91D}',
  label: 'Services',
  short: 'Services',
  economicType: 'tertiary',
  officialName: 'Tertiary sector',
  naics: [
    { code: '42', title: 'Wholesale Trade' },
    { code: '44-45', title: 'Retail Trade' },
    { code: '48-49', title: 'Transportation and Warehousing' },
    { code: '52', title: 'Finance and Insurance' },
    { code: '53', title: 'Real Estate and Rental and Leasing' },
    { code: '61', title: 'Educational Services' },
    { code: '62', title: 'Health Care and Social Assistance' },
    { code: '71', title: 'Arts, Entertainment, and Recreation' },
    { code: '72', title: 'Accommodation and Food Services' },
    { code: '22', title: 'Utilities' },
  ],
  subsNoun: 'segments',
  subNoun: 'segment',
  headline: (place) => `The services ${place} runs on, from shops to hospitals, each in its own slot.`,
  subs: [
    {
      id: 'retail', name: 'Shops and trade', noun: 'retail and trade',
      copy: 'Stores, online shopping and the wholesalers that supply them.',
      naics: [{ code: '44-45', title: 'Retail Trade' }, { code: '42', title: 'Wholesale Trade' }],
      rules: [W('retail(?:ers?|ing)?|shoppers?|stores?|supermarkets?|grocer(?:s|y|ies)|e-commerce|ecommerce|online shopping|Walmart|Costco|Target Corp|Tesco|Carrefour|Alibaba|Shein|Temu|consumer spending|retail sales|wholesal(?:e|ers?)|shopping (?:malls?|centres?|centers?|season)|Black Friday|Prime Day')],
      neg: [W('app stores?|data stores?|energy storage|stores of value')],
      keep: [W('retail(?:ers?)?|shoppers?|supermarkets?')],
    },
    {
      id: 'finance', name: 'Banking and insurance', noun: 'banking and insurance',
      copy: 'Banks, lenders, insurers, payments and the markets that move money.',
      naics: [{ code: '52', title: 'Finance and Insurance' }, { code: '522', title: 'Credit Intermediation and Related Activities' }, { code: '523', title: 'Securities, Commodity Contracts, and Other Financial Investments and Related Activities' }, { code: '524', title: 'Insurance Carriers and Related Activities' }],
      rules: [W('banks?|banking|bankers?|lenders?|lending|loans?|mortgages?|insurers?|insurance|reinsur\\w*|payments?|fintech|credit cards?|stock markets?|stocks? (?:fell|rose|rallied|slid|tumbled|surged|plunged)|stock prices|equities|shares (?:fell|rose|jumped|slumped|plunged|surged|rallied)|Wall Street|IPOs?|bonds?|asset managers?|hedge funds?|private equity|brokerages?|JPMorgan|Goldman Sachs|Morgan Stanley|HSBC|Citi(?:group)?|Barclays|UBS|BlackRock|Visa|Mastercard|PayPal|stablecoins?')],
      neg: [W('West Bank|central banks?|World Bank|food banks?|blood banks?|river ?banks?|Bank of (?:England|Japan|Canada|Korea|Israel|Russia|Thailand|Ghana)|Reserve Bank|People.s Bank|European Central|development bank|power banks?|DOE loans?|Loan Programs Office|loan guarantees?|conditional (?:loan|commitment)|(?:DOE|Energy Department|Department of Energy)[^.]{0,40}loan')],
      keep: [W('lenders?|bank loans?|consumer loans?|mortgages?|insurers?|insurance|fintech|credit cards?|bank stocks?|banking (?:sector|system|group|giant)|commercial banks?|Wall Street|IPOs?')],
    },
    {
      id: 'property', name: 'Housing and real estate', noun: 'housing and real estate',
      copy: 'Buying, selling and renting homes, offices and land.',
      naics: [{ code: '53', title: 'Real Estate and Rental and Leasing' }, { code: '531', title: 'Real Estate' }],
      rules: [W('real estate|property (?:markets?|prices|developers?|sector|market|crisis|giant|investors?)|home prices|house prices|housing (?:market|crisis|affordability|prices|shortage|supply)|homebuyers?|home sales|rents?|renters|tenants?|landlords?|mortgage rates|commercial property|office (?:vacanc(?:y|ies)|space|market|towers?|buildings?)|REITs?|Evergrande|Country Garden')],
      neg: [W('intellectual property|rent-seeking')],
    },
    {
      id: 'health', name: 'Health care', noun: 'health care',
      copy: 'Hospitals, clinics, doctors, nursing homes and social care.',
      naics: [{ code: '62', title: 'Health Care and Social Assistance' }, { code: '621', title: 'Ambulatory Health Care Services' }, { code: '622', title: 'Hospitals' }, { code: '623', title: 'Nursing and Residential Care Facilities' }, { code: '624', title: 'Social Assistance' }],
      rules: [W('hospitals?|health ?care|clinics?|doctors?|nurses?|nursing homes?|patients?|Medicare|Medicaid|health insurers?|health systems?|care homes?|physicians?|social care|child ?care|hospice|telehealth|Obamacare|health (?:workers|services|spending|coverage)'), W('NHS|ACA', '')],
    },
    {
      id: 'education', name: 'Schools and colleges', noun: 'education',
      copy: 'Schools, colleges, universities and training, taught and run day to day.',
      naics: [{ code: '61', title: 'Educational Services' }, { code: '611110', title: 'Elementary and Secondary Schools' }, { code: '611310', title: 'Colleges, Universities, and Professional Schools' }],
      rules: [W('schools?|students?|teachers?|universit(?:y|ies)|colleges?|tuition|education|classrooms?|K-12|enrollment|enrolment|(?:school|college|university) campus(?:es)?|student loans?|pupils?|school districts?')],
      neg: [W('Electoral College|College of Cardinals|school of thought|old school|tramway|data cent(?:er|re) campus')],
    },
    {
      id: 'hospitality', name: 'Travel, hotels and restaurants', noun: 'travel, hotels and restaurants',
      copy: 'Hotels, restaurants, tourism, sport and leisure.',
      naics: [{ code: '72', title: 'Accommodation and Food Services' }, { code: '721', title: 'Accommodation' }, { code: '722', title: 'Food Services and Drinking Places' }, { code: '71', title: 'Arts, Entertainment, and Recreation' }],
      rules: [W('hotels?|hoteliers?|tourism|tourists?|travel(?:lers|ers)?|restaurants?|caf[eé]s?|fast food|fast-food|cruises?|cruise lines?|casinos?|theme parks?|resorts?|Marriott|Hilton|Hyatt|Airbnb|Booking Holdings|Expedia|McDonald.s|Starbucks|Chipotle|Yum Brands|hospitality|vacation|holidaymakers|visitors? numbers|gyms?|stadiums?|sports? (?:leagues?|teams?|betting)')],
      neg: [W('travel bans?')],
    },
    {
      id: 'transport', name: 'Transport and logistics', noun: 'transport and logistics',
      copy: 'Moving people and goods by air, rail, road, sea and pipeline, plus warehouses.',
      naics: [{ code: '48-49', title: 'Transportation and Warehousing' }, { code: '481', title: 'Air Transportation' }, { code: '482', title: 'Rail Transportation' }, { code: '483', title: 'Water Transportation' }, { code: '484', title: 'Truck Transportation' }, { code: '486', title: 'Pipeline Transportation' }, { code: '493', title: 'Warehousing and Storage' }],
      rules: [W('airlines?|airports?|flights? (?:cancell\\w*|delays?|delayed|disrupt\\w*|routes?|bookings?|attendants?)|passenger flights?|direct flights?|airfares?|railways?|railroads?|rail (?:freight|lines?|network|operators?)|trains?|freight|shipping|container ships?|containers?|ports?|trucking|truckers?|logistics|warehouses?|warehousing|couriers?|parcel|FedEx|UPS|DHL|Maersk|MSC|Suez Canal|Panama Canal|Red Sea shipping|supply chains?|tankers?|pipelines?|transit|buses|ride-hailing|Uber|Lyft|Delta Air|United Airlines|Ryanair|Lufthansa|Emirates')],
      neg: [W('free shipping|LNG trains?|liquefaction trains?|pipeline of (?:talent|deals|projects)|deal pipeline|Port Arthur LNG|underwater pipeline|water pipeline')],
      keep: [W('airlines?|airports?|freight|shipping|railways?|trucking|logistics|seaports?|ports|port (?:authority|congestion|strikes?|operators?|calls?)|pipelines? (?:operator|company|project|route)')],
    },
    {
      id: 'utilities', name: 'Utilities', noun: 'utilities',
      copy: 'Delivering electricity, gas and water to homes and businesses.',
      naics: [{ code: '22112', title: 'Electric Power Transmission, Control, and Distribution' }, { code: '2212', title: 'Natural Gas Distribution' }, { code: '2213', title: 'Water, Sewage and Other Systems' }],
      rules: [W('utilit(?:y|ies)(?!-scale)|power grids?|the grid|grid operators?|electricity (?:bills?|prices|rates|tariffs?|supply|customers)|power bills?|energy bills?|blackouts?|power outages?|outages|water (?:utilit(?:y|ies)|supply|bills?|shortages?|rates|companies|restrictions)|sewage|wastewater|gas distribution|transmission lines?|ratepayers?|rate cases?|PG&E|Duke Energy|National Grid|Thames Water')],
      neg: [W('utility (?:tokens?|players?|vehicles?|knife)|sport utility')],
    },
  ],
  stages: [],
  /** Energy stories with Grid and distribution file under Utilities (pipelines also match Transport by keyword). */
  cross: [{ from: ENERGY, label: 'Energy', map: (t) => (has(t, 'grid') ? [{ sub: 'utilities', stage: 'grid' }] : []) }],
};

export const TECHNOLOGY = {
  id: 'technology',
  emoji: '\u{1F4BB}',
  label: 'Technology',
  short: 'Technology',
  economicType: 'quaternary',
  officialName: 'Quaternary sector',
  naics: [
    { code: '51', title: 'Information' },
    { code: '54', title: 'Professional, Scientific, and Technical Services' },
  ],
  subsNoun: 'segments',
  subNoun: 'segment',
  headline: (place) => `The technology and knowledge work in ${place}, from software to research, each in its own slot.`,
  subs: [
    {
      id: 'software', name: 'Software and AI', noun: 'software and AI',
      copy: 'Apps, software, artificial intelligence and the companies that build them.',
      naics: [{ code: '513210', title: 'Software Publishers' }, { code: '5415', title: 'Computer Systems Design and Related Services' }],
      rules: [W('software|AI|A\\.I\\.|artificial intelligence|chatbots?|OpenAI|ChatGPT|Anthropic|apps?|SaaS|large language models?|LLMs?|machine learning|generative AI|GenAI|Copilot|DeepSeek|Mistral|xAI|Salesforce|Oracle|SAP|algorithms?|AI models?|AI agents?', '')],
    },
    {
      id: 'cloud', name: 'Data centers and cloud', noun: 'data centers and cloud',
      copy: 'Data centers, cloud computing and the servers behind the internet.',
      naics: [{ code: '518', title: 'Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services' }],
      rules: [W('data cent(?:er|re)s?|datacent(?:er|re)s?|cloud (?:computing|providers?|services|contracts?|regions?|business|giant)|hyperscalers?|Azure|Google Cloud|servers?|colocation|compute capacity|AI infrastructure|supercomputers?|CoreWeave|Equinix', 'i'), W('AWS|GPUs?', '')],
      neg: [W('servers? at (?:the )?restaurant')],
    },
    {
      id: 'telecom', name: 'Telecom and internet', noun: 'telecom and internet',
      copy: 'Phone networks, broadband, satellites and undersea cables.',
      naics: [{ code: '517', title: 'Telecommunications' }, { code: '519', title: 'Web Search Portals, Libraries, Archives, and Other Information Services' }],
      rules: [W('telecoms?|telecommunications?|telcos?|broadband|5G|6G|mobile networks?|wireless carriers?|mobile carriers?|fib(?:er|re) (?:networks?|optic|broadband|rollout)|internet (?:service|access|outages?|providers?|shutdowns?)|satellite internet|Starlink|undersea cables?|subsea cables?|spectrum (?:auctions?|licen[cs]es?)|Verizon|AT&T|T-Mobile|Vodafone|Deutsche Telekom|Orange|BT Group|Jio|Airtel|Huawei|Ericsson|Nokia|search engines?')],
      neg: [W('aircraft carriers?|Magnus Ericsson')],
    },
    {
      id: 'research', name: 'Research and science', noun: 'research and science',
      copy: 'Labs, universities and companies doing research and development.',
      naics: [{ code: '5417', title: 'Scientific Research and Development Services' }, { code: '541714', title: 'Research and Development in Biotechnology (except Nanobiotechnology)' }, { code: '541715', title: 'Research and Development in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology)' }],
      rules: [W('research(?:ers)?|scientists?|laborator(?:y|ies)|labs?|study finds|breakthrough|clinical trials?|quantum|fusion|telescope|space missions?|biotech\\w*|genom\\w*|gene therapy|CRISPR|physicists?|prototype|patents?|innovation'), W('NSF|NIH|CERN|NASA', ''), /R&D/],
    },
    {
      id: 'consulting', name: 'Consulting and professional services', noun: 'consulting and professional services',
      copy: 'Consultants, lawyers, accountants, engineers and architects who sell expertise.',
      naics: [{ code: '5416', title: 'Management, Scientific, and Technical Consulting Services' }, { code: '5411', title: 'Legal Services' }, { code: '5412', title: 'Accounting, Tax Preparation, Bookkeeping, and Payroll Services' }, { code: '5413', title: 'Architectural, Engineering, and Related Services' }],
      rules: [W('consult(?:ing|ancy|ancies|ants?)|McKinsey|Deloitte|PwC|KPMG|Accenture|Boston Consulting|Bain|law firms?|accounting firms?|external auditors?|audit (?:firms?|failures?|fees)|engineering firms?|architects?|architecture firms?|advisory firms?|Big Four'), W('EY|BCG', '')],
    },
    {
      id: 'media', name: 'Media and entertainment', noun: 'media and entertainment',
      copy: 'News, film, music, streaming, games and publishing.',
      naics: [{ code: '512', title: 'Motion Picture and Sound Recording Industries' }, { code: '513', title: 'Publishing Industries' }, { code: '516', title: 'Broadcasting and Content Providers' }],
      rules: [W('media (?:companies|company|groups?|giants?|outlets?|industry|mergers?)|streaming|streamers?|Netflix|Disney|Warner Bros\\.?|Paramount|Comcast|Spotify|Hollywood|Bollywood|film studios?|film (?:industry|festivals?|production)|films|movies?|box office|music (?:industry|labels?|streaming)|record labels?|publishers?|publishing|newspapers?|broadcasters?|TV networks?|television|journalism|journalists?|video games?|gaming industry|social media|YouTube|TikTok')],
    },
    {
      id: 'cyber', name: 'Cybersecurity', noun: 'cybersecurity',
      copy: 'Protecting computers and networks from hacks, ransomware and outages.',
      naics: [{ code: '5415', title: 'Computer Systems Design and Related Services' }],
      rules: [W('cyber\\w*|hacks?|hackers?|hacked|hacking|ransomware|data breach(?:es)?|security breach(?:es)?|breach notification|breached (?:systems?|networks?|servers?|accounts?)|led to (?:a |the )?breach|security patch\\w*|malware|phishing|vulnerabilit(?:y|ies)|zero-days?|spyware'), W('DDoS|CISA', '')],
    },
  ],
  stages: [],
  /** Energy stories with the Innovation stage file under Research and science. */
  cross: [{ from: ENERGY, label: 'Energy', map: (t) => (has(t, 'innovation') ? [{ sub: 'research', stage: 'innovation' }] : []) }],
};

export const POLICY = {
  id: 'policy',
  emoji: '\u{1F3DB}\uFE0F',
  label: 'Policy',
  short: 'Policy',
  economicType: 'quinary',
  officialName: 'Quinary sector',
  naics: [
    { code: '92', title: 'Public Administration' },
    { code: '55', title: 'Management of Companies and Enterprises' },
    { code: '611310', title: 'Colleges, Universities, and Professional Schools' },
    { code: '813', title: 'Religious, Grantmaking, Civic, Professional, and Similar Organizations' },
  ],
  /** No NAICS sector is called quinary; this mapping is a convention (Method page). */
  convention: {
    text: 'NAICS has no quinary sector. Policy is our convention: Public Administration (92) plus the top leadership of companies (55), universities (611310) and nonprofits (813). Definitions of the quinary sector vary.',
    source: { title: 'Three-sector model: Quinary sector (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Three-sector_model', date: '2026-09-06' },
  },
  subsNoun: 'segments',
  subNoun: 'segment',
  headline: (place) => `Where the top decisions for ${place} get made, each in its own slot.`,
  subs: [
    {
      id: 'government', name: 'Heads of government and lawmakers', noun: 'government leadership',
      copy: 'Presidents, prime ministers, cabinets and parliaments making top decisions.',
      naics: [{ code: '921110', title: 'Executive Offices' }, { code: '921120', title: 'Legislative Bodies' }],
      rules: [W('presidents?|presidential|prime ministers?|premiers?|parliaments?|parliamentary|Congress|congressional|Senate|senators?|lawmakers?|legislat(?:ure|ures|ors?|ion|ive)|cabinet|government shutdown|White House|Kremlin|Downing Street|Elys[eé]e|elections?|ministers?|coalition|governors?|mayors?|state legislatures?|executive orders?')],
      neg: [W('vice president of|company president|president and CEO')],
      keep: [W('prime ministers?|parliaments?|Congress|lawmakers?|White House')],
    },
    {
      id: 'econpolicy', name: 'Central banks and economic policy', noun: 'economic policy',
      copy: 'Interest rates, budgets, taxes, tariffs and the officials who set them.',
      naics: [{ code: '921130', title: 'Public Finance Activities' }, { code: '926', title: 'Administration of Economic Programs' }, { code: '521110', title: 'Monetary Authorities-Central Bank' }],
      rules: [W('central banks?|Federal Reserve|Bank of England|Bank of Japan|Bank of Canada|Reserve Bank|People.s Bank|interest rates?|rate (?:cuts?|hikes?|decisions?)|inflation|budgets?|deficits?|tax(?:es)?|tax (?:cuts?|hikes?|bill|reform)|tariffs?|fiscal|monetary policy|finance ministers?|treasur(?:y|er)|Treasury|stimulus|debt ceiling|subsid(?:y|ies)|minimum wage|price controls?'), W('Fed|ECB|IMF', '')],
      neg: [W('inflation systems?|(?:tyre|tire) inflation|inflatable')],
    },
    {
      id: 'regulation', name: 'Regulators and courts', noun: 'regulation and the courts',
      copy: 'Courts, regulators and inspectors who set and enforce the rules.',
      naics: [{ code: '922110', title: 'Courts' }, { code: '926150', title: 'Regulation, Licensing, and Inspection of Miscellaneous Commercial Sectors' }],
      rules: [W('regulators?|regulatory|regulations?|courts?|judges?|Supreme Court|rulings?|ruled|lawsuits?|sued|sues|antitrust|competition (?:authority|watchdog|regulator|commission)|watchdogs?|Ofgem|Ofcom|fined|fines|probe|investigation|licen[cs]e (?:approval|revoked|applications?)|approves?|approval'), W('SEC|FTC|FCC|FERC|NRC|CMA', '')],
      neg: [W('food courts?|courtship|courting|award judges|judges (?:select|selected|picked|chose)')],
    },
    {
      id: 'international', name: 'Trade and international affairs', noun: 'trade and international affairs',
      copy: 'Trade deals, summits, diplomacy and the bodies that run them.',
      naics: [{ code: '928120', title: 'International Affairs' }, { code: '928', title: 'National Security and International Affairs' }],
      rules: [W('trade (?:deals?|talks|wars?|agreements?|pacts?|disputes?|negotiations?|tensions?|ministers?|representative)|summits?|diplomat\\w*|foreign ministers?|United Nations|sanctions|embass(?:y|ies)|bilateral|treat(?:y|ies)|free trade|European Union|export (?:controls?|curbs|bans?|restrictions)|unfair trade|ceasefire|peace talks'), W('G7|G20|WTO|UN|NATO|APEC|BRICS|ASEAN|EU (?:leaders?|summit|trade|tariffs?|sanctions|ministers?|foreign|membership|accession|talks|deal|pact|agreement|measures|suspends|bans|imposes|weighs (?:\\w+ )?quotas)|EU-(?:China|US|UK|India|Mercosur)|back to (?:the )?EU|rejoin\\w* the EU', '')],
    },
    {
      id: 'corporate', name: 'Corporate leadership', noun: 'corporate leadership',
      copy: 'Chief executives and boards making the biggest company decisions.',
      naics: [{ code: '55', title: 'Management of Companies and Enterprises' }, { code: '551114', title: 'Corporate, Subsidiary, and Regional Managing Offices' }],
      rules: [W('CEO (?:steps?|stepped|resigns?|resigned|ousted|fired|succession|search|pay|exits?|departure)|new (?:CEO|chief executive|chair\\w*)|(?:names|named|appoints?|appointed|hires?|hired|taps|tapped) (?:a )?(?:new |former )?(?:CEO|chief|chair\\w*|president)|chief executives? (?:resigns?|steps?|quits?|ousted)|boards? of directors|board (?:members?|seats?|shake-?up|vote)|executive (?:shake-?up|pay|compensation|departures?|hires?)|executives? (?:take|took|face) pay cuts|joins (?:\\w+ ){0,3}as (?:CEO|chief|president|chair\\w*)|shareholders?|activist investors?|mergers?|acquisitions?|takeovers?|buyouts?|steps? down|stepped down|succession|appoint(?:s|ed)? (?:a )?(?:new )?(?:CEO|chief)|spin-?offs?|restructuring|layoffs?|job cuts')],
    },
    {
      id: 'universities', name: 'University leadership', noun: 'university leadership',
      copy: 'Presidents, chancellors and boards that run universities and colleges.',
      naics: [{ code: '611310', title: 'Colleges, Universities, and Professional Schools' }],
      rules: [W('university presidents?|college presidents?|university chancellors?|college chancellors?|chancellor of (?:the )?University|vice-chancellors?|provosts?|boards? of trustees|boards? of regents|regents|higher education|higher ed|university (?:funding|budgets?|endowments?|leaders|leadership|cuts|governance)|endowments?|accreditation|accreditors?|research funding|federal grants? to universities')],
    },
    {
      id: 'nonprofits', name: 'Foundations and nonprofits', noun: 'nonprofit leadership',
      copy: 'Charities, foundations, think tanks, unions and their leaders.',
      naics: [{ code: '8132', title: 'Grantmaking and Giving Services' }, { code: '8133', title: 'Social Advocacy Organizations' }, { code: '8139', title: 'Business, Professional, Labor, Political, and Similar Organizations' }],
      rules: [/\b(?:[A-Z][a-z]+ ){1,3}Foundation\b(?! (?:[Dd]esign|[Ss]tandardi[sz]ation|[Ss]tone|[Ww]ork|[Pp]iles?|[Ii]nstallation))/, W('nonprofits?|non-profits?|not-for-profit|charit(?:y|ies|able)|philanthrop\\w*|NGOs?|think tanks?|donors?|grantmak\\w*|advocacy groups?|trade associations?|industry groups?|labou?r unions?|trade unions?|unions|unioni[sz]\\w*')],
      neg: [W('European Union|Soviet Union|union budget|Union Pacific|Union Bank|foundations? (?:of|for) (?:the|a)|campaign donors?|political donors?|crypto donors?|super PACs?|mid-?term')],
      keep: [W('nonprofits?|non-profits?|charit(?:y|ies)|philanthrop\\w*|NGOs?|think tanks?|labou?r unions?|trade unions?')],
    },
  ],
  stages: [],
  cross: [],
};

/** The five economic-type tabs, Primary to Quinary. */
export const ECONOMY_TABS = [RAW_MATERIALS, MANUFACTURING, SERVICES, TECHNOLOGY, POLICY];
