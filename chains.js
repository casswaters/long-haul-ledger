/**
 * Long Haul Ledger — PROTOTYPE value chains + company desks (example data).
 * Invented names for UX testing; not live corporate data, not sourced.
 */
export const prototype = true;
import { COUNTRIES, STUBS, getCountry } from './data.js';

/** Default primary industries invented for stubs opened via mind map. */
const STUB_INDUSTRY_DEFAULTS = [
  { id: 'energy', name: 'Energy & Power', note: 'Generation, grids, and fuel transitions.' },
  { id: 'manufacturing', name: 'Industry & Manufacturing', note: 'Factories, materials, and tooling depth.' },
  { id: 'logistics', name: 'Logistics & Trade', note: 'Ports, corridors, and freight resilience.' },
  { id: 'institutions', name: 'Institutions & Capital', note: 'Rules, permitting, and financing capacity.' },
  { id: 'demographics', name: 'Talent & Demographics', note: 'Skills, labor markets, and retention.' },
];

const STUB_INDUSTRY_OVERRIDES = {
  cn: [
    { id: 'manufacturing', name: 'Manufacturing Scale', note: 'Electronics, machinery, and export platforms.' },
    { id: 'energy', name: 'Power & Transition', note: 'Coal–renewables mix, grids, storage.' },
    { id: 'compute', name: 'Compute & Chips', note: 'Foundries, design, and AI infra.' },
    { id: 'logistics', name: 'Logistics & Corridors', note: 'Ports, rail, and inland hubs.' },
    { id: 'institutions', name: 'Industrial Policy', note: 'Standards, state capital, and planning.' },
  ],
  br: [
    { id: 'resources', name: 'Agri & Minerals', note: 'Soy, iron ore, and resource commons.' },
    { id: 'energy', name: 'Energy Mix', note: 'Hydro, biofuels, and offshore.' },
    { id: 'logistics', name: 'Long-haul Logistics', note: 'Ports, rivers, and hinterland distance.' },
    { id: 'manufacturing', name: 'Processing Industry', note: 'Food, metals, and auto assembly.' },
    { id: 'institutions', name: 'Institutions', note: 'Fiscal rules and subnational capacity.' },
  ],
  de: [
    { id: 'manufacturing', name: 'Mittelstand Industry', note: 'Machine tools, autos, chemicals.' },
    { id: 'energy', name: 'Energy Transition', note: 'Grid, gas, and industrial power pricing.' },
    { id: 'logistics', name: 'European Logistics', note: 'Rail freight and Rhine corridors.' },
    { id: 'demographics', name: 'Talent Pipeline', note: 'Aging skilled workforce replacement.' },
    { id: 'institutions', name: 'Standards & Policy', note: 'Industrial standards and EU adjacency.' },
  ],
  au: [
    { id: 'resources', name: 'Critical Minerals', note: 'Iron, lithium, rare earths.' },
    { id: 'energy', name: 'Energy Export', note: 'LNG, renewables, and green molecules.' },
    { id: 'logistics', name: 'Bulk Logistics', note: 'Ports and long inland hauls.' },
    { id: 'manufacturing', name: 'Processing Ambition', note: 'Moving beyond raw ore export.' },
    { id: 'institutions', name: 'Investment Rules', note: 'Approvals and allied supply chains.' },
  ],
  kr: [
    { id: 'compute', name: 'Semiconductors', note: 'Memory, foundry, and equipment.' },
    { id: 'manufacturing', name: 'Shipbuilding & Industry', note: 'Ships, batteries, autos.' },
    { id: 'energy', name: 'Power Security', note: 'Nuclear, LNG, and industrial loads.' },
    { id: 'demographics', name: 'Demographics', note: 'Birth rates and skilled labor.' },
    { id: 'logistics', name: 'Maritime Trade', note: 'Ports and export logistics.' },
  ],
  mx: [
    { id: 'manufacturing', name: 'Nearshore Manufacturing', note: 'Auto, electronics, appliances.' },
    { id: 'energy', name: 'Energy Reliability', note: 'Power for industrial parks.' },
    { id: 'logistics', name: 'Northbound Corridors', note: 'Border crossings and rail.' },
    { id: 'institutions', name: 'Investment Climate', note: 'Permitting and contract certainty.' },
    { id: 'demographics', name: 'Labor Markets', note: 'Technician depth in industrial states.' },
  ],
  id: [
    { id: 'resources', name: 'Nickel–EV Chain', note: 'Ore to battery materials.' },
    { id: 'energy', name: 'Power Reliability', note: 'Coal, geothermal, and grids.' },
    { id: 'logistics', name: 'Archipelago Logistics', note: 'Inter-island freight and ports.' },
    { id: 'manufacturing', name: 'Downstream Industry', note: 'Smelting and EV adjacency.' },
    { id: 'institutions', name: 'Resource Policy', note: 'Export bans and local-content rules.' },
  ],
  sa: [
    { id: 'energy', name: 'Energy Surplus', note: 'Oil, gas, and renewables build-out.' },
    { id: 'manufacturing', name: 'Industrial Diversification', note: 'Metals, chemicals, and clusters.' },
    { id: 'compute', name: 'Compute Ambition', note: 'Data centers and AI campuses.' },
    { id: 'logistics', name: 'Red Sea Logistics', note: 'Ports and corridor bets.' },
    { id: 'demographics', name: 'Talent Localization', note: 'Saudization and specialist visas.' },
  ],
  vn: [
    { id: 'manufacturing', name: 'Electronics Assembly', note: 'Phones, components, and climb-up.' },
    { id: 'energy', name: 'Power Race', note: 'Keeping factories online.' },
    { id: 'logistics', name: 'Export Logistics', note: 'Ports and industrial park links.' },
    { id: 'demographics', name: 'Workforce Depth', note: 'Technician and engineer supply.' },
    { id: 'institutions', name: 'FDI Rules', note: 'Zones and investment facilitation.' },
  ],
  sg: [
    { id: 'logistics', name: 'Hub Logistics', note: 'Port, aviation, and re-export.' },
    { id: 'compute', name: 'Compute Density', note: 'Data centers and connectivity.' },
    { id: 'institutions', name: 'Capital & Rules', note: 'Finance, standards, sandboxes.' },
    { id: 'energy', name: 'Power Imports', note: 'Regional power and efficiency.' },
    { id: 'manufacturing', name: 'Precision Industry', note: 'Pharma, electronics, MRO.' },
  ],
};

/**
 * Full SAMPLE value chains for seed countries (2–3+ industries each).
 * Each player: { id, name, role }
 */
/** Seeded example value chains for the six retired profiles: removed Oct 8, 2026 (Phase 1). */
export const VALUE_CHAINS = {};

/** Company desks keyed by player id (SAMPLE). */
export const COMPANIES = {};

function seedCompany(c) {
  COMPANIES[c.id] = c;
}

function makeAnnouncements(countryName, sectorLabel, name, role) {
  return [
    { date: '2026-09-28', title: `${name} locks multi-year offtake framework`, blurb: `${role} signs a framework with counterparties in ${countryName}'s ${sectorLabel} stack.` },
    { date: '2026-09-12', title: `Capex phase advances at ${name}`, blurb: `Board clears next tranche for capacity / corridor build tied to ${sectorLabel}.` },
    { date: '2026-08-30', title: `${name} posts hiring surge for technicians`, blurb: `Mid-skill hiring outruns local supply. Apprenticeships and visa pathways in focus.` },
    { date: '2026-08-15', title: `Regulatory milestone clears for ${name}`, blurb: `Permitting / interconnect / local-content step completes for a priority project.` },
    { date: '2026-07-22', title: `${name} partners on standards pilot`, blurb: `Joint pilot on measurement, safety, or export standards within ${sectorLabel}.` },
  ].slice(0, 3 + (name.length % 3));
}

function makePipeline(name, stage) {
  const bases = [
    { title: `${name} · next capacity tranche`, status: 'FEED / early EPC' },
    { title: `Talent pipeline with regional colleges`, status: 'hiring · 12–24 months' },
    { title: `Digital twin / ops upgrade`, status: 'pilot → scale' },
    { title: `Export / offtake renegotiation window`, status: 'commercial desk' },
  ];
  if (stage === 'upstream') bases[0].title = `${name} · resource / feedstock expansion`;
  if (stage === 'downstream') bases[0].title = `${name} · demand-side capacity / contracts`;
  return bases.slice(0, 2 + (name.length % 3));
}

/** Populate COMPANIES from VALUE_CHAINS. */
for (const [cid, sectors] of Object.entries(VALUE_CHAINS)) {
  const country = COUNTRIES[cid];
  for (const [sid, chain] of Object.entries(sectors)) {
    for (const stage of ['upstream', 'midstream', 'downstream']) {
      for (const p of chain[stage]) {
        seedCompany({
          id: p.id,
          name: p.name,
          role: p.role,
          countryId: cid,
          countryName: country.name,
          sector: sid,
          sectorLabel: chain.label,
          stage,
          sample: true,
          announcements: makeAnnouncements(country.name, chain.label, p.name, p.role),
          pipeline: makePipeline(p.name, stage),
        });
      }
    }
  }
}

/** Stub / light chains when a stub industry is opened. */
export function stubChainFor(countryId, sectorId) {
  const c = getCountry(countryId);
  const name = c?.name || countryId.toUpperCase();
  const industries = industriesForMindMap(countryId);
  const ind = industries.find((i) => i.id === sectorId) || { id: sectorId, name: sectorId, note: '' };
  const label = ind.name;
  const slug = `${countryId}-${sectorId}`;
  return {
    label,
    stub: true,
    upstream: [
      { id: `${slug}-u1`, name: `${name} Upstream Collective`, role: 'Feedstock / resource layer' },
      { id: `${slug}-u2`, name: `${name} Inputs Co-op`, role: 'Critical inputs supply' },
    ],
    midstream: [
      { id: `${slug}-m1`, name: `${name} Midstream Operators`, role: 'Processing / transmission' },
      { id: `${slug}-m2`, name: `${name} Corridor Partners`, role: 'Logistics / interconnect' },
    ],
    downstream: [
      { id: `${slug}-d1`, name: `${name} Demand Consortium`, role: 'Industrial offtakers' },
      { id: `${slug}-d2`, name: `${name} Export Desk`, role: 'Export / end markets' },
    ],
  };
}

function ensureStubCompany(player, countryId, sectorId, stage, chain) {
  if (COMPANIES[player.id]) return COMPANIES[player.id];
  const c = getCountry(countryId);
  const company = {
    id: player.id,
    name: player.name,
    role: player.role,
    countryId,
    countryName: c?.name || countryId,
    sector: sectorId,
    sectorLabel: chain.label,
    stage,
    sample: true,
    stub: true,
    announcements: makeAnnouncements(c?.name || countryId, chain.label, player.name, player.role).slice(0, 3),
    pipeline: makePipeline(player.name, stage).slice(0, 2),
  };
  COMPANIES[player.id] = company;
  return company;
}

export function getValueChain(countryId, sectorId) {
  const full = VALUE_CHAINS[countryId]?.[sectorId];
  if (full) return { ...full, stub: false };
  if (!countryId || !sectorId) return null;
  const stub = stubChainFor(countryId, sectorId);
  for (const stage of ['upstream', 'midstream', 'downstream']) {
    for (const p of stub[stage]) ensureStubCompany(p, countryId, sectorId, stage, stub);
  }
  return stub;
}

export function getCompany(id) {
  if (!id) return null;
  return COMPANIES[id] || null;
}

export function industriesForMindMap(countryId) {
  const c = getCountry(countryId);
  if (!c) return STUB_INDUSTRY_DEFAULTS;
  if (c.tier === 'full' && c.industries?.length) return c.industries;
  return STUB_INDUSTRY_OVERRIDES[countryId] || STUB_INDUSTRY_DEFAULTS;
}

/** Layout positions for mind-map nodes (normalized 0–1 center-based). */
export function mindMapLayout(industries) {
  const n = industries.length;
  const nodes = [{ id: '__country__', kind: 'country', x: 0.5, y: 0.5 }];
  const r = 0.34;
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    nodes.push({
      id: industries[i].id,
      kind: 'industry',
      name: industries[i].name,
      note: industries[i].note,
      x: 0.5 + r * Math.cos(angle),
      y: 0.5 + r * Math.sin(angle),
    });
  }
  return nodes;
}

export function chainStages() {
  return ['upstream', 'midstream', 'downstream'];
}

export function seededChainCoverage() {
  const out = {};
  for (const [cid, sectors] of Object.entries(VALUE_CHAINS)) {
    out[cid] = Object.keys(sectors);
  }
  return out;
}
