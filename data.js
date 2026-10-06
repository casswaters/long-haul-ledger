/**
 * Long Haul Ledger — PROTOTYPE seed data (example data for UX testing).
 * Not live news, not sourced. Invented country desks, metrics, signals and
 * constraints. Never read by any desk builder or paid output.
 */
export const prototype = true;
export const META = {
  name: 'Long Haul Ledger',
  tagline: 'A sourced record of what moved in US industry, with a world index.',
  version: '0.4-drill',
  domainIntent: 'longhaulledger.com',
  sample: true,
  prototype: true,
  softLaunch: true,
  sketchNote:
    'What is sourced: the US Progress rail (outbound links to public RSS, with verification tiers) and the US desks, where every line carries a source link, an as-of date and a revision note. What is PROTOTYPE: country metrics, signals, constraints, mind maps, value chains and company desks are example data for UX testing. Leadership lists public channels only; SAMPLE / ESTIMATE marks unverified fields.',
};

/** @typedef {{ id: string, title: string, blurb: string, weight: number, sector?: string, region?: string, date: string }} Signal */
/** @typedef {{ id: string, name: string, note: string }} Industry */
/** @typedef {{ id: string, name: string, note: string }} Region */
/** @typedef {{ id: string, title: string, gap: string, horizon: string, sectors: string[] }} Opening */

export const COUNTRIES = {
  us: {
    id: 'us',
    name: 'United States',
    iso: 'US',
    tier: 'full',
    snapshot:
      'Institutional depth and frontier compute lead; grid, permitting, and industrial base are the binding constraints on a multi-decade build-out.',
    metrics: { stability: 72, frontierPressure: 81, opportunity: 74 },
    industries: [
      { id: 'energy', name: 'Energy & Grid', note: 'Generation, transmission, storage, and interconnection queues.' },
      { id: 'compute', name: 'Compute & AI Infra', note: 'Data centers, chips, power co-location, cooling.' },
      { id: 'manufacturing', name: 'Advanced Manufacturing', note: 'Semiconductors, batteries, aerospace, tooling.' },
      { id: 'logistics', name: 'Logistics & Ports', note: 'Intermodal freight, ports, last-mile resilience.' },
      { id: 'demographics', name: 'Talent & Demographics', note: 'STEM pipeline, immigration, regional labor markets.' },
      { id: 'institutions', name: 'Institutions & Regulation', note: 'Permitting, standards, public R&D, capital markets.' },
    ],
    regions: [
      { id: 'sunbelt', name: 'Sun Belt corridor', note: 'Power demand, data centers, and industrial relocation.' },
      { id: 'midwest', name: 'Industrial Midwest', note: 'Reindustrialization, tooling, and logistics hubs.' },
      { id: 'west', name: 'Pacific West', note: 'Chip design, aerospace, and port-facing trade.' },
      { id: 'northeast', name: 'Northeast corridor', note: 'Finance, research universities, dense institutions.' },
    ],
    signals: [
      { id: 'us-1', title: 'Interconnection queue reform opens multi-GW pathway', blurb: 'Queue reform and cluster studies begin clearing stalled renewables and storage into high-demand load zones.', weight: 88, sector: 'energy', region: 'sunbelt', date: '2026-09-28' },
      { id: 'us-2', title: 'FAB corridor hiring outruns local STEM supply', blurb: 'New fabs create a multi-year technician gap; community colleges and visa pathways become rate-limiting.', weight: 84, sector: 'manufacturing', region: 'midwest', date: '2026-09-22' },
      { id: 'us-3', title: 'Hyperscale campuses bid for firm power + water rights', blurb: 'AI load growth forces vertical deals between compute operators, utilities, and municipal water boards.', weight: 91, sector: 'compute', region: 'sunbelt', date: '2026-10-01' },
      { id: 'us-4', title: 'Port automation pilots cut dwell time at two gateways', blurb: 'Terminal automation and rail dwell reforms improve throughput without new berth construction.', weight: 76, sector: 'logistics', region: 'west', date: '2026-09-14' },
      { id: 'us-5', title: 'Federal permitting clock starts for transmission spines', blurb: 'Statutory shot-clocks begin applying to priority transmission corridors linking generation to load.', weight: 82, sector: 'institutions', region: 'midwest', date: '2026-09-30' },
      { id: 'us-6', title: 'Regional university–fab apprenticeship pacts scale', blurb: 'Three-state consortia lock multi-year pipelines for process techs and maintenance engineers.', weight: 79, sector: 'demographics', region: 'midwest', date: '2026-09-18' },
    ],
    openings: [
      { id: 'us-o1', title: 'Transmission & interconnection as a binding constraint', gap: 'Generation and compute demand outrun wires and queue capacity.', horizon: '10–30 years', sectors: ['energy', 'compute'] },
      { id: 'us-o2', title: 'Industrial technician pipeline', gap: 'Fab and battery plants need mid-skill labor faster than training systems supply.', horizon: '5–15 years', sectors: ['manufacturing', 'demographics'] },
    ],
  },
  in: {
    id: 'in',
    name: 'India',
    iso: 'IN',
    tier: 'full',
    snapshot:
      'Demographic dividend + manufacturing ambition meet logistics, power reliability, and institutional execution as the frontier pressure points.',
    metrics: { stability: 68, frontierPressure: 86, opportunity: 83 },
    industries: [
      { id: 'manufacturing', name: 'Manufacturing & Electronics', note: 'Phones, electronics, auto, and emerging chip ATMP.' },
      { id: 'energy', name: 'Energy & Renewables', note: 'Solar, storage, coal transition, and grid balancing.' },
      { id: 'logistics', name: 'Logistics & Corridors', note: 'Ports, freight corridors, cold chain, inland hubs.' },
      { id: 'compute', name: 'Digital & Compute', note: 'GCCs, cloud regions, AI services, digital public infra.' },
      { id: 'demographics', name: 'Talent & Skilling', note: 'Youth bulge, vocational depth, urban absorption.' },
      { id: 'institutions', name: 'Institutions & States', note: 'State competition, land, labor, and ease-of-doing.' },
      { id: 'resources', name: 'Resource Commons', note: 'Water stress, critical minerals, agricultural commons.' },
    ],
    regions: [
      { id: 'west-coast', name: 'Western industrial belt', note: 'Gujarat–Maharashtra manufacturing and ports.' },
      { id: 'south', name: 'Southern tech & auto', note: 'Bengaluru–Chennai–Hyderabad services and assembly.' },
      { id: 'east', name: 'Eastern corridor', note: 'Ports, minerals, and emerging industrial parks.' },
      { id: 'north', name: 'Northern plains', note: 'Agri logistics, power demand, and urban mega-agglomerations.' },
    ],
    signals: [
      { id: 'in-1', title: 'Electronics ATMP cluster crosses export threshold', blurb: 'Assembly–test–packaging capacity turns from import substitute toward export volume in phones and servers.', weight: 85, sector: 'manufacturing', region: 'south', date: '2026-09-26' },
      { id: 'in-2', title: 'Dedicated freight corridor lifts inland container velocity', blurb: 'Double-stack corridors cut hinterland dwell; port SIC codes begin re-pricing inland logistics.', weight: 80, sector: 'logistics', region: 'west-coast', date: '2026-09-20' },
      { id: 'in-3', title: 'Round-the-clock renewable PPAs reshape industrial siting', blurb: 'Firms chase states offering firm renewable + storage packages for 24×7 industrial loads.', weight: 87, sector: 'energy', region: 'west-coast', date: '2026-10-02' },
      { id: 'in-4', title: 'Semiconductor design GCCs deepen fabless layer', blurb: 'Design talent density rises faster than domestic fab capacity — a complementary, not competing, frontier.', weight: 78, sector: 'compute', region: 'south', date: '2026-09-12' },
      { id: 'in-5', title: 'State land banks digitize industrial plot allotment', blurb: 'Transparent plot inventories shorten site-selection cycles for mid-size manufacturers.', weight: 74, sector: 'institutions', region: 'east', date: '2026-09-08' },
      { id: 'in-6', title: 'Cold-chain gaps still tax agri surplus regions', blurb: 'Harvest losses remain a logistics–energy–institutions compound problem in northern belts.', weight: 72, sector: 'logistics', region: 'north', date: '2026-09-25' },
    ],
    openings: [
      { id: 'in-o1', title: 'Firm power for industrial parks', gap: 'Manufacturing ambition hits reliability and storage before raw capacity.', horizon: '10–25 years', sectors: ['energy', 'manufacturing'] },
      { id: 'in-o2', title: 'Inland logistics & cold chain', gap: 'Corridor gains are uneven; perishables and mid-tier freight still leak value.', horizon: '5–20 years', sectors: ['logistics', 'resources'] },
    ],
  },
  ae: {
    id: 'ae',
    name: 'United Arab Emirates',
    iso: 'AE',
    tier: 'full',
    snapshot:
      'Hub-state strategy: logistics, capital, and compute co-located with energy surplus — demographic depth and industrial breadth remain imported.',
    metrics: { stability: 78, frontierPressure: 70, opportunity: 77 },
    industries: [
      { id: 'logistics', name: 'Trade & Logistics', note: 'Ports, aviation, re-exports, free zones.' },
      { id: 'energy', name: 'Energy & Transition', note: 'Hydrocarbons, nuclear, solar, and regional power trade.' },
      { id: 'compute', name: 'Compute & Sovereign AI', note: 'Data centers, AI campuses, connectivity.' },
      { id: 'institutions', name: 'Institutions & Capital', note: 'Free zones, regulatory sandboxes, sovereign capital.' },
      { id: 'demographics', name: 'Talent Magnetism', note: 'Expat talent, residency regimes, education hubs.' },
      { id: 'manufacturing', name: 'Light & Advanced Industry', note: 'Metals, chemicals, aerospace MRO, food processing.' },
    ],
    regions: [
      { id: 'dubai', name: 'Dubai–Jebel Ali axis', note: 'Trade, aviation, services, and free-zone density.' },
      { id: 'abu-dhabi', name: 'Abu Dhabi industrial & energy', note: 'Energy, capital, heavy industry, and compute bets.' },
      { id: 'northern', name: 'Northern emirates', note: 'Capacity overflow, industrial land, and logistics spillover.' },
    ],
    signals: [
      { id: 'ae-1', title: 'Sovereign AI campus locks long-term power offtake', blurb: 'Compute build-out is sequenced against nuclear and solar firm capacity rather than spot grids.', weight: 86, sector: 'compute', region: 'abu-dhabi', date: '2026-09-29' },
      { id: 'ae-2', title: 'Jebel Ali–Al Maktoum multimodal integration advances', blurb: 'Port–airport–rail integration aims to cut re-export cycle time across the Gulf–Africa–Asia triangle.', weight: 81, sector: 'logistics', region: 'dubai', date: '2026-09-21' },
      { id: 'ae-3', title: 'Regional power interconnect talks widen Gulf trade', blurb: 'Cross-border electrons become a second commodity layer beside hydrocarbons.', weight: 75, sector: 'energy', region: 'abu-dhabi', date: '2026-09-15' },
      { id: 'ae-4', title: 'Long-term residency regimes retain mid-career specialists', blurb: 'Visa product design becomes industrial policy for scarce technical talent.', weight: 77, sector: 'demographics', region: 'dubai', date: '2026-10-01' },
      { id: 'ae-5', title: 'Industrial free-zone land priced for light manufacturing', blurb: 'Beyond trading companies: incentives tilt toward actual plant utilization rates.', weight: 70, sector: 'manufacturing', region: 'northern', date: '2026-09-10' },
    ],
    openings: [
      { id: 'ae-o1', title: 'Compute–power co-location stack', gap: 'Capital and connectivity are ready; firm clean power and cooling depth are the bottleneck.', horizon: '5–20 years', sectors: ['compute', 'energy'] },
      { id: 'ae-o2', title: 'Deepen domestic industrial base', gap: 'Hub strength exceeds manufacturing breadth; selective industrial layers remain thin.', horizon: '10–30 years', sectors: ['manufacturing', 'demographics'] },
    ],
  },
  jp: {
    id: 'jp',
    name: 'Japan',
    iso: 'JP',
    tier: 'full',
    snapshot:
      'High institutional quality and precision industry face demographic contraction; robotics, energy security, and allied supply chains define the frontier.',
    metrics: { stability: 84, frontierPressure: 76, opportunity: 71 },
    industries: [
      { id: 'manufacturing', name: 'Precision Manufacturing', note: 'Robotics, machine tools, autos, materials.' },
      { id: 'energy', name: 'Energy Security', note: 'Nuclear restart, LNG, efficiency, grid resilience.' },
      { id: 'compute', name: 'Semiconductors & Compute', note: 'Foundry partnerships, materials, equipment.' },
      { id: 'demographics', name: 'Demographics & Care', note: 'Aging, automation substitution, immigration policy.' },
      { id: 'logistics', name: 'Logistics & Maritime', note: 'Ports, shipbuilding adjacency, disaster-resilient freight.' },
      { id: 'institutions', name: 'Institutions & Allycraft', note: 'Industrial policy, standards, allied supply chains.' },
    ],
    regions: [
      { id: 'kanto', name: 'Kantō', note: 'Capital agglomeration, finance, and HQ density.' },
      { id: 'kansai', name: 'Kansai', note: 'Manufacturing heritage and research clusters.' },
      { id: 'kyushu', name: 'Kyūshū', note: 'Semiconductors, autos, and energy experiments.' },
      { id: 'tohoku', name: 'Tōhoku', note: 'Rebuild logistics, renewables, and resilience industry.' },
    ],
    signals: [
      { id: 'jp-1', title: 'Allied foundry capacity comes online in Kyūshū', blurb: 'Advanced node capacity anchored by materials and equipment ecosystems already deep in-country.', weight: 89, sector: 'compute', region: 'kyushu', date: '2026-09-27' },
      { id: 'jp-2', title: 'Nuclear restart schedule firms industrial power planning', blurb: 'Predictable baseload timelines unlock energy-intensive manufacturing commitments.', weight: 83, sector: 'energy', region: 'kansai', date: '2026-09-19' },
      { id: 'jp-3', title: 'Care-robot deployments scale in municipal contracts', blurb: 'Automation substitutes for scarce care labor; standards and liability frameworks trail adoption.', weight: 80, sector: 'demographics', region: 'kanto', date: '2026-10-03' },
      { id: 'jp-4', title: 'Machine-tool backlog signals global reindustrialization', blurb: 'Export orders for precision tools track multi-year factory build programs abroad.', weight: 77, sector: 'manufacturing', region: 'kansai', date: '2026-09-11' },
      { id: 'jp-5', title: 'Disaster-resilient port upgrades prioritized', blurb: 'Seismic and climate resilience spending treated as logistics insurance, not discretionary capex.', weight: 73, sector: 'logistics', region: 'tohoku', date: '2026-09-16' },
    ],
    openings: [
      { id: 'jp-o1', title: 'Automation as demographic compensation', gap: 'Labor scarcity is structural; robotics + immigration policy must compound, not compete.', horizon: '10–40 years', sectors: ['demographics', 'manufacturing'] },
      { id: 'jp-o2', title: 'Allied semiconductor materials stack', gap: 'Equipment and materials leadership can anchor more of the chip value chain onshore/allyshore.', horizon: '5–20 years', sectors: ['compute', 'institutions'] },
    ],
  },
  ng: {
    id: 'ng',
    name: 'Nigeria',
    iso: 'NG',
    tier: 'full',
    snapshot:
      'Largest African population and restless markets collide with power reliability, logistics friction, and institutional predictability — high frontier pressure, high upside if constraints lift.',
    metrics: { stability: 52, frontierPressure: 88, opportunity: 79 },
    industries: [
      { id: 'energy', name: 'Power & Energy', note: 'Grid, gas-to-power, distributed solar, oil & gas reform.' },
      { id: 'logistics', name: 'Logistics & Ports', note: 'Ports, roads, last-mile, and regional trade corridors.' },
      { id: 'manufacturing', name: 'Light Manufacturing', note: 'Food processing, cement, textiles, assembly.' },
      { id: 'demographics', name: 'Youth & Urbanization', note: 'Urban jobs, skills, and informal-to-formal bridges.' },
      { id: 'institutions', name: 'Institutions & Finance', note: 'FX, credit, regulation, subnational capacity.' },
      { id: 'resources', name: 'Agriculture & Resources', note: 'Staples, export crops, mineral commons.' },
      { id: 'compute', name: 'Digital Services', note: 'Fintech, payments rails, connectivity, local cloud.' },
    ],
    regions: [
      { id: 'lagos', name: 'Lagos–Southwest', note: 'Commercial density, ports, and digital services.' },
      { id: 'abuja-middle', name: 'Abuja & Middle Belt', note: 'Administration, agri logistics, and corridor links.' },
      { id: 'south-south', name: 'South-South energy belt', note: 'Hydrocarbons, gas infra, and industrial adjacency.' },
      { id: 'north', name: 'Northern agro-belt', note: 'Staples production, security, and market access.' },
    ],
    signals: [
      { id: 'ng-1', title: 'Distributed solar + storage undercuts diesel for SMEs', blurb: 'Commercial rooftop + battery packages begin displacing generator economics in industrial estates.', weight: 86, sector: 'energy', region: 'lagos', date: '2026-09-24' },
      { id: 'ng-2', title: 'Port dwell reforms shave days off import cycles', blurb: 'Digitized clearance and berth management reduce logistics tax on manufacturers.', weight: 78, sector: 'logistics', region: 'lagos', date: '2026-09-17' },
      { id: 'ng-3', title: 'Gas-to-power projects unlock industrial estate loads', blurb: 'Where gas and offtake contracts clear, factories re-rate capacity utilization upward.', weight: 84, sector: 'energy', region: 'south-south', date: '2026-10-02' },
      { id: 'ng-4', title: 'Payments rails deepen merchant formalization', blurb: 'Digital settlement reaches smaller traders — a precursor to credit and tax-base expansion.', weight: 74, sector: 'compute', region: 'lagos', date: '2026-09-09' },
      { id: 'ng-5', title: 'Staple-crop storage gaps still amplify price swings', blurb: 'Post-harvest loss and thin warehouse finance leave northern belts exposed.', weight: 71, sector: 'resources', region: 'north', date: '2026-09-28' },
      { id: 'ng-6', title: 'Vocational hubs near industrial estates expand seats', blurb: 'Private–state partnerships target technicians for food processing and assembly lines.', weight: 69, sector: 'demographics', region: 'abuja-middle', date: '2026-09-13' },
    ],
    openings: [
      { id: 'ng-o1', title: 'Reliable power as the master key', gap: 'Almost every industrial and digital ambition is gated by electricity reliability and cost.', horizon: '10–30 years', sectors: ['energy', 'manufacturing'] },
      { id: 'ng-o2', title: 'Port-to-inland logistics chain', gap: 'Clearance gains evaporate without road, rail, and warehouse depth inland.', horizon: '5–25 years', sectors: ['logistics', 'resources'] },
    ],
  },
  cl: {
    id: 'cl',
    name: 'Chile',
    iso: 'CL',
    tier: 'full',
    snapshot:
      'Resource commons power (copper, lithium) meets renewable surplus and long thin geography — institutions and value-add depth decide whether minerals become a industrial ladder or a cycle.',
    metrics: { stability: 70, frontierPressure: 74, opportunity: 76 },
    industries: [
      { id: 'resources', name: 'Mining & Critical Minerals', note: 'Copper, lithium, processing, and water intensity.' },
      { id: 'energy', name: 'Renewables & Transmission', note: 'Solar/wind surplus, north–south spines, storage.' },
      { id: 'logistics', name: 'Ports & Corridors', note: 'Pacific ports, mining logistics, cross-Andean links.' },
      { id: 'manufacturing', name: 'Processing & Industry', note: 'Mineral processing, green hydrogen adjacency, food.' },
      { id: 'institutions', name: 'Institutions & Permitting', note: 'Mining codes, water rights, investment rules.' },
      { id: 'demographics', name: 'Talent & Regions', note: 'Engineering depth outside Santiago, regional retention.' },
    ],
    regions: [
      { id: 'norte', name: 'Norte Grande', note: 'Mining, solar, desalination, and lithium brine.' },
      { id: 'central', name: 'Central valley', note: 'Population, institutions, industry, and ports.' },
      { id: 'sur', name: 'Sur', note: 'Hydro, forestry, and energy diversity.' },
    ],
    signals: [
      { id: 'cl-1', title: 'North–south transmission spine bids advance', blurb: 'Moving surplus solar south and balancing hydro north becomes the national grid’s central puzzle.', weight: 85, sector: 'energy', region: 'norte', date: '2026-09-30' },
      { id: 'cl-2', title: 'Lithium processing local-content rules tighten', blurb: 'Policy pushes value-add beyond brine extraction — capital and know-how must follow.', weight: 82, sector: 'resources', region: 'norte', date: '2026-09-23' },
      { id: 'cl-3', title: 'Desalination capacity underwrites mining water budgets', blurb: 'Coastal desal + pipelines reduce aquifer conflict and unlock project timelines.', weight: 80, sector: 'resources', region: 'norte', date: '2026-09-18' },
      { id: 'cl-4', title: 'Pacific port upgrades prioritize mineral exporters', blurb: 'Berth and rail last-mile investments target copper and chemical exports.', weight: 74, sector: 'logistics', region: 'central', date: '2026-09-12' },
      { id: 'cl-5', title: 'Green hydrogen pilots cluster near renewable surplus', blurb: 'Early projects test whether electrons become molecules for export or domestic industry.', weight: 76, sector: 'manufacturing', region: 'norte', date: '2026-10-01' },
    ],
    openings: [
      { id: 'cl-o1', title: 'Minerals → processing ladder', gap: 'Extraction strength exceeds midstream processing depth; policy and capital must close the gap.', horizon: '10–30 years', sectors: ['resources', 'manufacturing'] },
      { id: 'cl-o2', title: 'Transmission as national commons', gap: 'Renewable surplus is stranded without north–south wires and storage.', horizon: '5–20 years', sectors: ['energy', 'institutions'] },
    ],
  },
};

/** Lighter stubs — clickable, minimal panel. */
export const STUBS = {
  cn: { id: 'cn', name: 'China', iso: 'CN', tier: 'stub', snapshot: 'Manufacturing scale and infrastructure depth; PROTOTYPE stub.', metrics: { stability: 70, frontierPressure: 78, opportunity: 72 } },
  br: { id: 'br', name: 'Brazil', iso: 'BR', tier: 'stub', snapshot: 'Agri–minerals–energy commons with logistics distance; PROTOTYPE stub.', metrics: { stability: 62, frontierPressure: 72, opportunity: 70 } },
  de: { id: 'de', name: 'Germany', iso: 'DE', tier: 'stub', snapshot: 'Industrial Mittelstand under energy and demography pressure; PROTOTYPE stub.', metrics: { stability: 76, frontierPressure: 68, opportunity: 66 } },
  gb: { id: 'gb', name: 'United Kingdom', iso: 'GB', tier: 'stub', snapshot: 'Services and science strength; energy and industrial depth thinner; PROTOTYPE stub.', metrics: { stability: 74, frontierPressure: 65, opportunity: 64 } },
  fr: { id: 'fr', name: 'France', iso: 'FR', tier: 'stub', snapshot: 'Nuclear baseload and industrial policy experiments; PROTOTYPE stub.', metrics: { stability: 73, frontierPressure: 66, opportunity: 65 } },
  ca: { id: 'ca', name: 'Canada', iso: 'CA', tier: 'stub', snapshot: 'Resources, immigration, and allied supply-chain adjacency; PROTOTYPE stub.', metrics: { stability: 80, frontierPressure: 62, opportunity: 68 } },
  au: { id: 'au', name: 'Australia', iso: 'AU', tier: 'stub', snapshot: 'Critical minerals and energy export geography; PROTOTYPE stub.', metrics: { stability: 82, frontierPressure: 64, opportunity: 69 } },
  za: { id: 'za', name: 'South Africa', iso: 'ZA', tier: 'stub', snapshot: 'Minerals and logistics hub potential gated by power and institutions; PROTOTYPE stub.', metrics: { stability: 55, frontierPressure: 75, opportunity: 68 } },
  ke: { id: 'ke', name: 'Kenya', iso: 'KE', tier: 'stub', snapshot: 'East African digital and logistics corridor node; PROTOTYPE stub.', metrics: { stability: 58, frontierPressure: 70, opportunity: 71 } },
  sa: { id: 'sa', name: 'Saudi Arabia', iso: 'SA', tier: 'stub', snapshot: 'Energy surplus pivoting toward industry and compute; PROTOTYPE stub.', metrics: { stability: 72, frontierPressure: 73, opportunity: 74 } },
  kr: { id: 'kr', name: 'South Korea', iso: 'KR', tier: 'stub', snapshot: 'Chip and shipbuilding depth under demographic squeeze; PROTOTYPE stub.', metrics: { stability: 78, frontierPressure: 74, opportunity: 70 } },
  mx: { id: 'mx', name: 'Mexico', iso: 'MX', tier: 'stub', snapshot: 'Nearshoring manufacturing and energy–logistics binding constraints; PROTOTYPE stub.', metrics: { stability: 60, frontierPressure: 77, opportunity: 75 } },
  id: { id: 'id', name: 'Indonesia', iso: 'ID', tier: 'stub', snapshot: 'Nickel–EV chain and archipelago logistics; PROTOTYPE stub.', metrics: { stability: 64, frontierPressure: 76, opportunity: 74 } },
  eg: { id: 'eg', name: 'Egypt', iso: 'EG', tier: 'stub', snapshot: 'Suez logistics and energy corridor geography; PROTOTYPE stub.', metrics: { stability: 56, frontierPressure: 71, opportunity: 67 } },
  pl: { id: 'pl', name: 'Poland', iso: 'PL', tier: 'stub', snapshot: 'Central European manufacturing and energy security rebuild; PROTOTYPE stub.', metrics: { stability: 71, frontierPressure: 67, opportunity: 68 } },
  se: { id: 'se', name: 'Sweden', iso: 'SE', tier: 'stub', snapshot: 'Green steel and nordic industrial transition; PROTOTYPE stub.', metrics: { stability: 86, frontierPressure: 60, opportunity: 66 } },
  tr: { id: 'tr', name: 'Türkiye', iso: 'TR', tier: 'stub', snapshot: 'Manufacturing bridge between Europe and Near East; PROTOTYPE stub.', metrics: { stability: 58, frontierPressure: 72, opportunity: 69 } },
  ar: { id: 'ar', name: 'Argentina', iso: 'AR', tier: 'stub', snapshot: 'Lithium–agri–energy potential under institutional volatility; PROTOTYPE stub.', metrics: { stability: 48, frontierPressure: 73, opportunity: 70 } },
  vn: { id: 'vn', name: 'Vietnam', iso: 'VN', tier: 'stub', snapshot: 'Electronics assembly climb and energy reliability race; PROTOTYPE stub.', metrics: { stability: 72, frontierPressure: 80, opportunity: 78 } },
  sg: { id: 'sg', name: 'Singapore', iso: 'SG', tier: 'stub', snapshot: 'Hub-state logistics, capital, and compute density; PROTOTYPE stub.', metrics: { stability: 90, frontierPressure: 58, opportunity: 65 } },
};

export function getCountry(id) {
  if (!id) return null;
  const key = String(id).toLowerCase();
  return COUNTRIES[key] || STUBS[key] || null;
}

export function allCountryIds() {
  return [...Object.keys(COUNTRIES), ...Object.keys(STUBS)];
}

export function fullCountryIds() {
  return Object.keys(COUNTRIES);
}

export function globalFeed(limit = 24) {
  const items = [];
  for (const c of Object.values(COUNTRIES)) {
    for (const s of c.signals) {
      items.push({ ...s, countryId: c.id, countryName: c.name });
    }
  }
  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.weight - a.weight));
  return items.slice(0, limit);
}

export function filterSignals(country, { sector, region } = {}) {
  if (!country || !country.signals) return [];
  return country.signals.filter((s) => {
    if (sector && s.sector !== sector) return false;
    if (region && s.region !== region) return false;
    return true;
  });
}

export function opportunityNote(country, sectorId) {
  if (!country || !country.openings) return null;
  const hit = country.openings.find((o) => o.sectors.includes(sectorId));
  if (hit) return hit;
  const ind = (country.industries || []).find((i) => i.id === sectorId);
  return ind
    ? { id: `${country.id}-${sectorId}-note`, title: `${ind.name} constraint`, gap: ind.note, horizon: 'multi-decade', sectors: [sectorId] }
    : null;
}

export function metricLabel(n) {
  if (n >= 80) return 'high';
  if (n >= 65) return 'elevated';
  if (n >= 50) return 'moderate';
  return 'strained';
}
