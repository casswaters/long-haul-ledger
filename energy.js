/**
 * Long Haul Ledger: the Energy sector tab (first instance of sectors.js).
 * Source copy (names and descriptions) is Cassidy's, in his order.
 * Rules are deterministic keyword patterns, like locate.js; tags can be wrong
 * and the site says so. Stage labels are plain and each maps to an official
 * category: economic type + NAICS 2022 codes verified on census.gov.
 */
import { naicsUrl } from './sectors.js';

export const ENERGY = {
  id: 'energy',
  emoji: '\u26A1',
  label: 'Energy',
  short: 'Energy',
  subsNoun: 'sources',
  subNoun: 'source',
  headline: (place) => `Every major way ${place} makes power or fuel, each in its own slot.`,
  subs: [
    {
      id: 'nuclear', name: 'Nuclear', noun: 'nuclear',
      copy: 'Heat from splitting atoms. That heat is turned into electricity, and it can also supply heat for industry. Firm power. A fuel load lasts a long time.',
      rules: [/\b(?:nuclear|reactors?|uranium|SMRs?|small modular|microreactors?|fission|fusion|HALEU|enrichment|AP1000|APR1400|CANDU|Rosatom|Westinghouse|Holtec|NuScale|Kairos|TerraPower|X-energy|Oklo|uprates?|spent fuel|fuel loading|criticality|IAEA|Nuclear Regulatory Commission)\b/i, /\bNRC\b/],
      neg: [/\b(?:nuclear (?:weapons?|warheads?|talks|deal|arsenal|tests?|submarines?|programme|program|threat|strike|deterrent|launch|missiles?|bombs?|war|doctrine|forces|sites?)|test nuclear|nuclear-(?:armed|capable|powered submarines?)|denucleari\w+|atomic bomb|ballistic)\b/i],
      keep: [/\b(?:power|plant|electricity|energy|reactor|uprate|grid|megawatts?|MW|GW)\b/i],
    },
    {
      id: 'oil', name: 'Oil', noun: 'oil',
      copy: 'A liquid pulled out of the ground and run through a refinery. Fuel, chemical feedstock, asphalt, lubricants, and a long list of products that start in the same barrel.',
      rules: [/\b(?:oil|crude|Brent|WTI|OPEC\+?|refiner(?:y|ies)|refining|petroleum|gasoline|petrol|diesel|jet fuel|barrels?|bpd|oilfields?|oil fields?|petrochemicals?|asphalt|lubricants?|upstream|downstream|offshore drilling|drilling rigs?|rig count)\b/i],
      neg: [/\b(?:palm oil|olive oil|cooking oil|vegetable oil|edible oil|essential oils?|oil paint\w*|fish oil|coconut oil|sunflower oil)\b/i],
      keep: [/\b(?:crude|barrels?|OPEC|refiner\w*|petroleum|Brent|WTI)\b/i],
    },
    {
      id: 'gas', name: 'Natural gas', noun: 'natural gas',
      copy: 'Methane from underground, moved in pipes. Electricity, heat, industry, fertilizer, and chemical production.',
      rules: [/\b(?:natural gas|LNG|liquefied natural gas|gas pipelines?|Henry Hub|TTF|gas fields?|gas-fired|gas power|gas plants?|gas turbines?|shale gas|regasification|FLNG|gas exports?|gas imports?|gas supply|gas prices|gas storage|methane)\b/i],
    },
    {
      id: 'coal', name: 'Coal', noun: 'coal',
      copy: 'A solid fuel dug out of the ground. Electricity, steel, cement, chemicals, and heat for industry.',
      rules: [/\b(?:coal|lignite|coking coal|thermal coal|coal-fired|collier(?:y|ies)|met coal|metallurgical coal)\b/i],
      neg: [/\bcharcoal\b/i],
      keep: [/\bcoal(?:-fired| mine| plant| power)\b/i],
    },
    {
      id: 'wind', name: 'Wind', noun: 'wind',
      copy: 'Moving air turns a blade. The blade turns a generator.',
      rules: [/\b(?:wind (?:farms?|power|energy|turbines?|projects?|parks?|developers?|capacity|auction|lease)|offshore wind|onshore wind|floating wind|windfarms?|turbine blades?|Vestas|Orsted|\u00D8rsted|Siemens Gamesa|Nordex|Goldwind|Mingyang)\b/i],
    },
    {
      id: 'solar', name: 'Solar', noun: 'solar',
      copy: 'Light hits a panel and pushes electrons, or it heats a fluid that can spin a turbine or serve a process.',
      rules: [/\b(?:solar|photovoltaics?|perovskites?|PV modules?|PV plants?|PV projects?|solar farms?|concentrated solar|agrivoltaic\w*|polysilicon|wafers?|solar panels?)\b/i, /\bPV\b/],
      neg: [/\bsolar (?:system|eclipse|storms?|flares?|wind|orbiter|probe|cycle|maximum)\b/i],
      keep: [/\b(?:panels?|megawatts?|MW|GW|PV|photovoltaic|power|farm|energy)\b/i],
    },
    {
      id: 'hydro', name: 'Hydro', noun: 'hydro',
      copy: 'Moving water spins a turbine. Dams can hold water and release it when it is needed. Rivers can be used as they run.',
      rules: [/\b(?:hydro|hydropower|hydroelectric\w*|hydro plants?|dams?|pumped storage|pumped hydro|run-of-river|tidal (?:power|energy|stream)|wave energy|marine energy)\b/i],
      neg: [/\b(?:dam(?:s)? (?:burst|collapse)|beaver dam)\b/i],
      keep: [/\b(?:power|electricity|hydropower|megawatts?|MW|GW|turbines?)\b/i],
    },
    {
      id: 'geothermal', name: 'Geothermal', noun: 'geothermal',
      copy: 'Heat from underground. Electricity, direct heat, and industrial use where the resource is there.',
      rules: [/\b(?:geothermal|enhanced geothermal|EGS|ground-source heat|Fervo|Quaise|Eavor|hot dry rock|geothermal wells?|heat mining)\b/i],
    },
    {
      id: 'emerging', name: 'Emerging', noun: 'emerging energy',
      copy: 'Hydrogen, biofuel, batteries, synthetic fuels, and the next lines still being built. Hydrogen is made with other energy and used later. Biofuel is a liquid from plants or waste.',
      rules: [/\b(?:hydrogen|electroly[sz]ers?|fuel cells?|green ammonia|ammonia fuel|biofuels?|biodiesel|renewable diesel|sustainable aviation fuel|ethanol|biogas|biomethane|renewable natural gas|RNG|batter(?:y|ies)|energy storage|BESS|grid-scale storage|long-duration storage|synthetic fuels?|e-fuels?|efuels?|sodium-ion|lithium-ion|solid-state batter\w*|thermal storage)\b/i, /\bSAF\b/],
    },
  ],
  /**
   * Lifecycle stages. Plain label + official reference: economic type and
   * NAICS 2022 codes (titles copied from census.gov; each links to its page).
   */
  stages: [
    {
      id: 'extraction', label: 'Extraction', economicType: 'primary',
      naics: [
        { code: '211', title: 'Oil and Gas Extraction' },
        { code: '2121', title: 'Coal Mining' },
        { code: '212290', title: 'Other Metal Ore Mining (includes uranium-radium-vanadium ores)' },
        { code: '213111', title: 'Drilling Oil and Gas Wells' },
      ],
      rules: [/\b(?:drill\w*|wells?|upstream|rigs?|rig count|shale|fracking|frack\w*|oilfields?|oil fields?|gas fields?|discover(?:y|ies|ed)|exploration|lease sales?|offshore leases?|mines?|mining|miners?|ore|ores|(?:oil|gas|coal|proven|uranium) reserves|uranium (?:mines?|mining|recovery|production)|in-situ recovery|crude (?:output|production)|oil (?:output|production)|gas (?:output|production)|OPEC\+?|barrels? (?:per|a) day|bpd|extraction|extract\w*|quarr\w*|offshore blocks?|deposits?)\b/i],
    },
    {
      id: 'generation', label: 'Generation and refining', economicType: 'secondary',
      naics: [
        { code: '22111', title: 'Electric Power Generation' },
        { code: '324110', title: 'Petroleum Refineries' },
        { code: '325193', title: 'Ethyl Alcohol Manufacturing' },
      ],
      rules: [/\b(?:reactors?|power (?:plants?|stations?)|plants?|generation|generating|generators?|uprates?|restart\w*|refiner(?:y|ies)|refining|turbines?|wind farms?|solar farms?|commission\w*|fuel loading|criticality|capacity|megawatts?|gigawatts?|MW|GW|liquefaction|LNG (?:plant|terminal|project|train)s?|enrichment|fuel fabrication|electroly[sz]ers?|construction|build\w*|units?|online|biorefiner\w*|gigafactor\w*|manufactur\w*|factor(?:y|ies))\b/i],
    },
    {
      id: 'grid', label: 'Grid and distribution', economicType: 'tertiary',
      naics: [
        { code: '22112', title: 'Electric Power Transmission, Control, and Distribution' },
        { code: '2212', title: 'Natural Gas Distribution' },
        { code: '486', title: 'Pipeline Transportation' },
      ],
      rules: [/\b(?:grid|grids|transmission|interconnect\w*|utilit(?:y|ies)(?!-scale)|distribution|pipelines?|PJM|ERCOT|MISO|CAISO|SPP|NYISO|ISO-NE|power purchase agreements?|PPAs?|offtake|supply (?:agreement|deal|contract)s?|electricity (?:prices?|bills?|rates?|market|demand)|power (?:prices?|bills?|demand|market)|rate cases?|tariffs?|substations?|blackouts?|outages?|cargoes|shipments?|tankers?|imports?|exports?|retail|customers|ratepayers?|capacity auction|wholesale|storage)\b/i],
    },
    {
      id: 'innovation', label: 'Innovation', economicType: 'quaternary',
      naics: [
        { code: '541715', title: 'Research and Development in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology)' },
      ],
      rules: [/\b(?:research\w*|R&D|prototypes?|pilot\w*|demonstrat\w*|startups?|start-ups?|laborator(?:y|ies)|labs?|designs?|patents?|breakthrough\w*|test\w*|milestones?|innovat\w*|novel|next-generation|advanced|software|AI|artificial intelligence|digital|university|scientists?|funding (?:award|round)|vouchers?|fusion|microreactors?|SMRs?|perovskites?|solid-state|first-of-a-kind|FOAK)\b/i],
    },
  ],
  /** Official reference for each stage's economic type label. */
  officialUrl: naicsUrl,
};

export const ENERGY_SUB_IDS = ENERGY.subs.map((s) => s.id);
export const ENERGY_STAGE_IDS = ENERGY.stages.map((s) => s.id);
export function energySub(id) { return ENERGY.subs.find((s) => s.id === id) || null; }
export function energyStage(id) { return ENERGY.stages.find((s) => s.id === id) || null; }

/** Every sector tab registered on the site (future: the five economic types). */
/* The full tab list (Energy plus the five economic types) lives in tabs.js. */
