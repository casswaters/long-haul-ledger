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
export const VALUE_CHAINS = {
  us: {
    energy: {
      label: 'Energy & Grid',
      upstream: [
        { id: 'us-basinpeak', name: 'BasinPeak Resources', role: 'Gas / feedstock producer' },
        { id: 'us-silvertide', name: 'SilverTide Wind', role: 'Utility-scale renewables OEM' },
        { id: 'us-aquifercoil', name: 'AquiferCoil Storage', role: 'Long-duration battery chem' },
      ],
      midstream: [
        { id: 'us-gridforge', name: 'GridForge Transmission', role: 'HVDC corridor developer' },
        { id: 'us-queueclear', name: 'QueueClear Interconnect', role: 'Interconnection studies & build' },
        { id: 'us-loadbank', name: 'LoadBank Utilities Group', role: 'Regional ISO-facing utility' },
      ],
      downstream: [
        { id: 'us-firmwatt', name: 'FirmWatt Industrial Power', role: '24×7 industrial offtaker' },
        { id: 'us-campusamp', name: 'CampusAmp Hyperscale', role: 'Data-center power buyer' },
        { id: 'us-municipile', name: 'Municipile Energy Co-op', role: 'Municipal load aggregator' },
      ],
    },
    compute: {
      label: 'Compute & AI Infra',
      upstream: [
        { id: 'us-lithoforge', name: 'LithoForge Equipment', role: 'Fab tools & metrology' },
        { id: 'us-waferstrand', name: 'WaferStrand Materials', role: 'Substrates & process gases' },
        { id: 'us-coolriver', name: 'CoolRiver Thermal', role: 'Liquid cooling systems' },
      ],
      midstream: [
        { id: 'us-nodeyard', name: 'NodeYard Foundry Partners', role: 'Advanced-node capacity' },
        { id: 'us-rackline', name: 'Rackline Systems', role: 'Server / GPU cluster OEM' },
        { id: 'us-fiberarch', name: 'FiberArch Networks', role: 'Metro dark-fiber spine' },
      ],
      downstream: [
        { id: 'us-orbitmodel', name: 'OrbitModel Labs', role: 'Frontier model trainer' },
        { id: 'us-civicinfer', name: 'CivicInfer Cloud', role: 'Enterprise inference cloud' },
        { id: 'us-edgehall', name: 'EdgeHall Regional', role: 'Edge inference pods' },
      ],
    },
    manufacturing: {
      label: 'Advanced Manufacturing',
      upstream: [
        { id: 'us-toolright', name: 'ToolRight Precision', role: 'Machine tools & fixtures' },
        { id: 'us-alloybank', name: 'AlloyBank Specialty', role: 'Specialty metals & powders' },
        { id: 'us-chemspan', name: 'ChemSpan Process', role: 'Process chemicals' },
      ],
      midstream: [
        { id: 'us-fabcorridor', name: 'FabCorridor Consortium', role: 'Semiconductor fabs' },
        { id: 'us-cellstack', name: 'CellStack Batteries', role: 'Battery cell plants' },
        { id: 'us-aerosmith', name: 'AeroSmith Structures', role: 'Aerospace structures' },
      ],
      downstream: [
        { id: 'us-fleetvolt', name: 'FleetVolt Mobility', role: 'EV / fleet OEM buyer' },
        { id: 'us-defensespan', name: 'DefenseSpan Systems', role: 'Defense prime integrator' },
        { id: 'us-gridstore', name: 'GridStore Deploy', role: 'Grid storage integrator' },
      ],
    },
  },
  in: {
    manufacturing: {
      label: 'Manufacturing & Electronics',
      upstream: [
        { id: 'in-silicabay', name: 'SilicaBay Substrates', role: 'PCB / substrate supply' },
        { id: 'in-rarelink', name: 'RareLink Components', role: 'Passive & connector supply' },
        { id: 'in-polymold', name: 'PolyMold Tooling', role: 'Precision molds & dies' },
      ],
      midstream: [
        { id: 'in-atmpcrest', name: 'ATMP Crest Electronics', role: 'Assembly–test–packaging' },
        { id: 'in-phoneforge', name: 'PhoneForge India', role: 'Handset / device OEM' },
        { id: 'in-serverbay', name: 'ServerBay Assembly', role: 'Server board assembly' },
      ],
      downstream: [
        { id: 'in-exportgate', name: 'ExportGate Distributors', role: 'Export channel partners' },
        { id: 'in-retailvolt', name: 'RetailVolt Networks', role: 'Domestic retail / carriers' },
        { id: 'in-gccloud', name: 'GC Cloud Buyers', role: 'GCC / cloud hardware demand' },
      ],
    },
    energy: {
      label: 'Energy & Renewables',
      upstream: [
        { id: 'in-sunplate', name: 'SunPlate Modules', role: 'Solar module manufacturing' },
        { id: 'in-windridge', name: 'WindRidge Turbines', role: 'Onshore turbine OEM' },
        { id: 'in-saltcell', name: 'SaltCell Storage', role: 'Battery / storage packs' },
      ],
      midstream: [
        { id: 'in-stategrid', name: 'StateGrid Balancers', role: 'State transmission utilities' },
        { id: 'in-rtcrenew', name: 'RTC Renew PPAs', role: 'Round-the-clock PPA aggregator' },
        { id: 'in-parkpower', name: 'ParkPower Estates', role: 'Industrial park power SPVs' },
      ],
      downstream: [
        { id: 'in-steelwatt', name: 'SteelWatt Mills', role: 'Energy-intensive industry' },
        { id: 'in-datacore', name: 'DataCore Campuses', role: 'Cloud / data-center loads' },
        { id: 'in-agripump', name: 'AgriPump Co-ops', role: 'Agri / irrigation offtake' },
      ],
    },
    logistics: {
      label: 'Logistics & Corridors',
      upstream: [
        { id: 'in-railsteel', name: 'RailSteel Corridors', role: 'Freight rail infrastructure' },
        { id: 'in-dockcrane', name: 'DockCrane Terminals', role: 'Port terminal operators' },
        { id: 'in-coldvault', name: 'ColdVault Systems', role: 'Cold-chain equipment' },
      ],
      midstream: [
        { id: 'in-dfcops', name: 'DFC Ops Freight', role: 'Dedicated freight corridor ops' },
        { id: 'in-inlandhub', name: 'InlandHub ICD', role: 'Inland container depots' },
        { id: 'in-lastmile', name: 'LastMile Bharat', role: 'Regional trucking networks' },
      ],
      downstream: [
        { id: 'in-exporters', name: 'Coastal Exporters Guild', role: 'Export manufacturers' },
        { id: 'in-retailchain', name: 'RetailChain Fresh', role: 'Perishables retail' },
        { id: 'in-ecomspan', name: 'EcomSpan Fulfillment', role: 'E-commerce fulfillment' },
      ],
    },
  },
  ae: {
    logistics: {
      label: 'Trade & Logistics',
      upstream: [
        { id: 'ae-jetfuel', name: 'JetFuel Gulf Supply', role: 'Aviation fuel & bunkering' },
        { id: 'ae-craneport', name: 'CranePort Equipment', role: 'Terminal automation gear' },
        { id: 'ae-freightrail', name: 'FreightRail Etihad Link', role: 'Port–airport rail links' },
      ],
      midstream: [
        { id: 'ae-jebelops', name: 'Jebel Ops Terminals', role: 'Port / free-zone operator' },
        { id: 'ae-skyhub', name: 'SkyHub Cargo', role: 'Air cargo integrator' },
        { id: 'ae-reexport', name: 'ReExport Gateways', role: 'Re-export trading houses' },
      ],
      downstream: [
        { id: 'ae-africatrade', name: 'AfricaTrade Bridges', role: 'Africa–Asia trade desks' },
        { id: 'ae-retailfree', name: 'FreeZone Retail Spines', role: 'Regional retail distribution' },
        { id: 'ae-projectcargo', name: 'ProjectCargo Gulf', role: 'Heavy / project cargo' },
      ],
    },
    compute: {
      label: 'Compute & Sovereign AI',
      upstream: [
        { id: 'ae-powerfirm', name: 'PowerFirm Nuclear/Solar', role: 'Firm clean power supply' },
        { id: 'ae-coolcoast', name: 'CoolCoast Thermal', role: 'Seawater / district cooling' },
        { id: 'ae-fiberred', name: 'FiberRed Sea Cables', role: 'Subsea connectivity' },
      ],
      midstream: [
        { id: 'ae-sovereignai', name: 'Sovereign AI Campus', role: 'National AI compute campus' },
        { id: 'ae-rackgulf', name: 'RackGulf Data Centers', role: 'Hyperscale / colo operator' },
        { id: 'ae-securecloud', name: 'SecureCloud Emirates', role: 'Sovereign cloud stack' },
      ],
      downstream: [
        { id: 'ae-govai', name: 'GovAI Services', role: 'Public-sector AI offtake' },
        { id: 'ae-fininfer', name: 'FinInfer Gulf', role: 'Finance / trading inference' },
        { id: 'ae-healthmodel', name: 'HealthModel Clinics', role: 'Health AI deployments' },
      ],
    },
    energy: {
      label: 'Energy & Transition',
      upstream: [
        { id: 'ae-fieldops', name: 'FieldOps Hydrocarbons', role: 'Upstream oil & gas' },
        { id: 'ae-solardune', name: 'SolarDune Arrays', role: 'Utility solar developer' },
        { id: 'ae-atomplant', name: 'AtomPlant Ops', role: 'Nuclear plant operator' },
      ],
      midstream: [
        { id: 'ae-gulfwire', name: 'GulfWire Interconnect', role: 'Cross-border power trade' },
        { id: 'ae-lnggate', name: 'LNG Gate Terminals', role: 'LNG / gas midstream' },
        { id: 'ae-gridabu', name: 'GridAbu Transmission', role: 'Domestic transmission' },
      ],
      downstream: [
        { id: 'ae-industryload', name: 'IndustryLoad Freezones', role: 'Industrial offtakers' },
        { id: 'ae-desalt', name: 'Desalt Utilities', role: 'Desalination power buyers' },
        { id: 'ae-exportpower', name: 'ExportPower Desk', role: 'Regional power exporters' },
      ],
    },
  },
  jp: {
    compute: {
      label: 'Semiconductors & Compute',
      upstream: [
        { id: 'jp-chemwafer', name: 'ChemWafer Materials', role: 'Photoresists & wafers' },
        { id: 'jp-equiprec', name: 'EquipRec Precision', role: 'Fab equipment makers' },
        { id: 'jp-gaspure', name: 'GasPure Specialty', role: 'Ultra-pure process gases' },
      ],
      midstream: [
        { id: 'jp-allyfoundry', name: 'AllyFoundry Kyūshū', role: 'Advanced foundry capacity' },
        { id: 'jp-memoryspan', name: 'MemorySpan Devices', role: 'Memory / discrete devices' },
        { id: 'jp-packnippon', name: 'PackNippon ATMP', role: 'Advanced packaging' },
      ],
      downstream: [
        { id: 'jp-autochip', name: 'AutoChip Mobility', role: 'Auto semiconductor buyers' },
        { id: 'jp-robotbrain', name: 'RobotBrain Systems', role: 'Industrial robotics OEMs' },
        { id: 'jp-exportsemi', name: 'ExportSemi Trading', role: 'Allied export channels' },
      ],
    },
    manufacturing: {
      label: 'Precision Manufacturing',
      upstream: [
        { id: 'jp-steelmicro', name: 'SteelMicro Alloys', role: 'Specialty steel / alloys' },
        { id: 'jp-bearright', name: 'BearRight Components', role: 'Bearings & motion parts' },
        { id: 'jp-sensorfine', name: 'SensorFine Devices', role: 'Industrial sensors' },
      ],
      midstream: [
        { id: 'jp-toolnippon', name: 'ToolNippon Machines', role: 'Machine-tool builders' },
        { id: 'jp-robotline', name: 'RobotLine Factories', role: 'Industrial robot OEMs' },
        { id: 'jp-autoworks', name: 'AutoWorks Assembly', role: 'Auto / mobility plants' },
      ],
      downstream: [
        { id: 'jp-globaloem', name: 'GlobalOEM Buyers', role: 'Export OEM customers' },
        { id: 'jp-carebot', name: 'CareBot Municipal', role: 'Care-robot deployers' },
        { id: 'jp-defenseprec', name: 'DefensePrec Systems', role: 'Defense precision buyers' },
      ],
    },
    energy: {
      label: 'Energy Security',
      upstream: [
        { id: 'jp-lngfleet', name: 'LNG Fleet Traders', role: 'LNG procurement' },
        { id: 'jp-nukeops', name: 'NukeOps Restart', role: 'Nuclear plant operators' },
        { id: 'jp-effkit', name: 'EffKit Industrial', role: 'Efficiency / heat-pump tech' },
      ],
      midstream: [
        { id: 'jp-gridkansai', name: 'GridKansai Power', role: 'Regional utilities' },
        { id: 'jp-storageisle', name: 'StorageIsle Batteries', role: 'Grid storage operators' },
        { id: 'jp-resilience', name: 'Resilience Microgrids', role: 'Disaster-resilient microgrids' },
      ],
      downstream: [
        { id: 'jp-fabpower', name: 'FabPower Kyūshū', role: 'Semiconductor power buyers' },
        { id: 'jp-steelheat', name: 'SteelHeat Mills', role: 'Heavy industry offtake' },
        { id: 'jp-cityload', name: 'CityLoad Metro', role: 'Urban / rail electrification' },
      ],
    },
  },
  ng: {
    energy: {
      label: 'Power & Energy',
      upstream: [
        { id: 'ng-gasflare', name: 'GasCapture Midstream', role: 'Associated gas capture' },
        { id: 'ng-solarroof', name: 'SolarRoof Modules', role: 'Distributed solar supply' },
        { id: 'ng-batterypack', name: 'BatteryPack West Africa', role: 'Commercial storage packs' },
      ],
      midstream: [
        { id: 'ng-g2p', name: 'GasToPower Estates', role: 'Gas-to-power SPVs' },
        { id: 'ng-discosolar', name: 'DiscoSolar Hybrid', role: 'Disco + distributed hybrids' },
        { id: 'ng-minigrid', name: 'MiniGrid Commons', role: 'Community mini-grids' },
      ],
      downstream: [
        { id: 'ng-smewatt', name: 'SME Watt Estates', role: 'Industrial SME offtakers' },
        { id: 'ng-telcotowers', name: 'TelcoTower Power', role: 'Tower / telecom loads' },
        { id: 'ng-coldchain', name: 'ColdChain Power', role: 'Cold-storage offtake' },
      ],
    },
    logistics: {
      label: 'Logistics & Ports',
      upstream: [
        { id: 'ng-berthcrane', name: 'BerthCrane Gear', role: 'Port equipment suppliers' },
        { id: 'ng-roadbase', name: 'RoadBase Contractors', role: 'Highway / access roads' },
        { id: 'ng-warehouse', name: 'Warehouse Span', role: 'Warehouse developers' },
      ],
      midstream: [
        { id: 'ng-portdwell', name: 'PortDwell Authority', role: 'Digitized port clearance' },
        { id: 'ng-railwest', name: 'RailWest Freight', role: 'Port–inland rail' },
        { id: 'ng-trucknet', name: 'TruckNet Lagos', role: 'Regional trucking' },
      ],
      downstream: [
        { id: 'ng-importer', name: 'Importer Manufacturers', role: 'Import-dependent factories' },
        { id: 'ng-retailfresh', name: 'RetailFresh Chains', role: 'Urban retail distribution' },
        { id: 'ng-agroexport', name: 'AgroExport Desks', role: 'Export crop shippers' },
      ],
    },
    compute: {
      label: 'Digital Services',
      upstream: [
        { id: 'ng-fiberring', name: 'FiberRing Metro', role: 'Metro fiber builders' },
        { id: 'ng-towerco', name: 'TowerCo West Africa', role: 'Tower infrastructure' },
        { id: 'ng-payrails', name: 'PayRails Core', role: 'Payments switch / rails' },
      ],
      midstream: [
        { id: 'ng-fintech', name: 'Fintech Ledger Cos', role: 'Payments / fintech platforms' },
        { id: 'ng-localcloud', name: 'LocalCloud Lagos', role: 'Local cloud / colo' },
        { id: 'ng-agentnet', name: 'AgentNet Merchants', role: 'Agent / merchant networks' },
      ],
      downstream: [
        { id: 'ng-smetrade', name: 'SME Trade Formalizers', role: 'Formalizing micro-merchants' },
        { id: 'ng-creditdesk', name: 'CreditDesk Lenders', role: 'Working-capital lenders' },
        { id: 'ng-govpay', name: 'GovPay Digitization', role: 'Public digital payments' },
      ],
    },
  },
  cl: {
    resources: {
      label: 'Mining & Critical Minerals',
      upstream: [
        { id: 'cl-copperpit', name: 'CopperPit Norte', role: 'Copper mining operator' },
        { id: 'cl-lithbrine', name: 'LithBrine Atacama', role: 'Lithium brine producer' },
        { id: 'cl-desaltpipe', name: 'DesaltPipe Coastal', role: 'Mining water / desal' },
      ],
      midstream: [
        { id: 'cl-cathode', name: 'Cathode Process Chile', role: 'Copper / Li processing' },
        { id: 'cl-chemplant', name: 'ChemPlant Midstream', role: 'Chemical conversion plants' },
        { id: 'cl-railore', name: 'RailOre Norte', role: 'Mine-to-port rail' },
      ],
      downstream: [
        { id: 'cl-batterybuy', name: 'BatteryBuy Global', role: 'Battery OEM buyers' },
        { id: 'cl-wireexport', name: 'WireExport Traders', role: 'Refined metal exporters' },
        { id: 'cl-greenh2', name: 'GreenH2 Pilots', role: 'Green hydrogen adjacency' },
      ],
    },
    energy: {
      label: 'Renewables & Transmission',
      upstream: [
        { id: 'cl-solarnorte', name: 'SolarNorte Arrays', role: 'Desert solar developers' },
        { id: 'cl-windpat', name: 'WindPatagonia', role: 'Southern wind farms' },
        { id: 'cl-hydrobal', name: 'HydroBalancers Sur', role: 'Hydro balancing assets' },
      ],
      midstream: [
        { id: 'cl-spinesouth', name: 'SpineSouth Transmission', role: 'North–south HV spines' },
        { id: 'cl-storagedesert', name: 'StorageDesert BESS', role: 'Grid storage operators' },
        { id: 'cl-isoops', name: 'ISO Ops Chile', role: 'System operator / market' },
      ],
      downstream: [
        { id: 'cl-minepower', name: 'MinePower Offtakers', role: 'Mining power buyers' },
        { id: 'cl-citycentral', name: 'CityCentral Utilities', role: 'Central valley loads' },
        { id: 'cl-exportmol', name: 'ExportMolecules Desk', role: 'Green molecule exporters' },
      ],
    },
    manufacturing: {
      label: 'Processing & Industry',
      upstream: [
        { id: 'cl-reagent', name: 'Reagent Supply Andes', role: 'Process reagents' },
        { id: 'cl-engtalent', name: 'EngTalent Norte', role: 'Engineering services' },
        { id: 'cl-equipimp', name: 'EquipImport Heavy', role: 'Heavy process equipment' },
      ],
      midstream: [
        { id: 'cl-processpark', name: 'ProcessPark Norte', role: 'Mineral processing parks' },
        { id: 'cl-h2works', name: 'H2Works Pilots', role: 'Green H2 / derivatives' },
        { id: 'cl-foodpack', name: 'FoodPack Central', role: 'Food processing plants' },
      ],
      downstream: [
        { id: 'cl-cathodeship', name: 'CathodeShip Export', role: 'Processed mineral export' },
        { id: 'cl-domesticind', name: 'DomesticInd Buyers', role: 'Local industrial buyers' },
        { id: 'cl-allyoem', name: 'AllyOEM Contracts', role: 'Allied OEM offtake' },
      ],
    },
  },
};

/** Company desks keyed by player id (SAMPLE). */
export const COMPANIES = {};

function seedCompany(c) {
  COMPANIES[c.id] = c;
}

function makeAnnouncements(countryName, sectorLabel, name, role) {
  return [
    { date: '2026-09-28', title: `${name} locks multi-year offtake framework`, blurb: `${role} signs a framework with counterparties in ${countryName}'s ${sectorLabel} stack.` },
    { date: '2026-09-12', title: `Capex phase advances at ${name}`, blurb: `Board clears next tranche for capacity / corridor build tied to ${sectorLabel}.` },
    { date: '2026-08-30', title: `${name} posts hiring surge for technicians`, blurb: `Mid-skill hiring outruns local supply — apprenticeships and visa pathways in focus.` },
    { date: '2026-08-15', title: `Regulatory milestone clears for ${name}`, blurb: `Permitting / interconnect / local-content step completes for a priority project.` },
    { date: '2026-07-22', title: `${name} partners on standards pilot`, blurb: `Joint pilot on measurement, safety, or export standards within ${sectorLabel}.` },
  ].slice(0, 3 + (name.length % 3));
}

function makePipeline(name, stage) {
  const bases = [
    { title: `${name} — next capacity tranche`, status: 'FEED / early EPC' },
    { title: `Talent pipeline with regional colleges`, status: 'hiring · 12–24 months' },
    { title: `Digital twin / ops upgrade`, status: 'pilot → scale' },
    { title: `Export / offtake renegotiation window`, status: 'commercial desk' },
  ];
  if (stage === 'upstream') bases[0].title = `${name} — resource / feedstock expansion`;
  if (stage === 'downstream') bases[0].title = `${name} — demand-side capacity / contracts`;
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
