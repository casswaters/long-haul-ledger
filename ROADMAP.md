# Long Haul Ledger — Roadmap

Repo-only planning file. It is excluded from GitHub Pages (like BUILD-PLAN.md and RESEARCH-RUNS.md) and never ships to the live site.

**Last updated:** 2026-10-08, 13:31 MT

## House rules
- Everything is free. No paid tier, pricing or paywall copy until Cassidy says go.
- Real sources only: every story and number links to a real public source. No invented metrics; example data is labeled PROTOTYPE.
- No flag styling.
- Never show "admin-1" in the UI. Say "state equivalent".
- One neutral tagline: "Economic activity at every scale, from the world to your city."

## Now
- **Energy briefs, World and United States first (underway in the 6 AM / noon / 6 PM research runs).** As of Oct 8, 6:11 AM MT: World has 6 of 9 (Nuclear, Oil, Natural gas, Coal, Wind, Solar); United States has 5 of 9 (Nuclear, Oil, Natural gas, Solar, Wind). Still to write: World Hydro, Geothermal, Emerging; US Coal, Hydro, Geothermal, Emerging. Then China, India, Japan, Germany, the United Kingdom, France, Canada, Brazil, Saudi Arabia, Australia and South Korea. Candidates come from `node scripts/build-energy-brief.mjs --place <id> --source <source>`; run `--validate` before committing. Briefs older than 7 days show a stale flag.
- **Content gaps (Oct 8, mostly done in SW v27):** thin segments filled (no segment under 4 worldwide stories, was 3), misfile rules tightened, World nuclear brief rewritten from non-US stories, US wind feeds added. Still open: the sector-tab briefs (none written yet; research runs) and metals, universities, livestock and food, which are still below 10 stories worldwide.
- **First Monday Haul issue (Mon Oct 12).** The Monday research run (7:46 AM MT) drafts it into `hauls/YYYY-MM-DD.md` and `.html` (off Pages) using the approved free format; Cassidy reviews and sends from Buttondown. After issue 1 is sent: turn on the archive (`archive: true` in signup.js, link it, drop archive.html and data/monday-haul from the Pages exclude list).
- Spot-check the news column per place for wrong location tags and odd rankings; fix rules as found.

## Next
- **Coverage fill plan (audit Oct 8, 11:15 AM MT; full write-up off repo at /workspace/qa/lhl/coverage-audit-2026-10-08.md).** Today: leaders for 15 of 187 countries, 69 of 4,315 state equivalents, 6 of 1,122 cities (0 city rows sourced); World Bank macro for 180 of 187 countries (29 cells older than 2020); own news for 97 of 187 countries; Energy briefs 11 slots (World 6 of 9, US 5 of 9); sector briefs 0 of 36 segments anywhere; indicators US only.
  - Phase 0 (1 session): one "Not yet covered" state with planned source and checked date on every empty panel; hide World Bank values older than 10 years; remove "unknown" ESTIMATE response times; replace "(see ...)" names and the CL, NG, AE sample rows; build-time coverage line on the Method page.
  - Phase 1 (3 sessions): all 187 countries get head of state, head of government, start date and official website (Wikidata candidates, confirmed on official sites), World Bank sector shares for the six tabs, OWID energy mix; retire the 6 example profiles (Cassidy approved Oct 8, 11:24 AM MT).
  - Phase 2 (2 to 3 sessions): 51 US state equivalents (BLS, FRED, BEA, Census, EIA; the last three need free keys from Cassidy) and the 35 US map cities (mayors, metro data); clear 31 source-pending legislature seats.
  - Phase 3 (3 to 4 sessions): state equivalents for major economies (Eurostat, OECD regional, Global Data Lab, national offices; Wikidata leader candidates exist for 1,136 of 4,220).
  - Phase 4 (2 to 3 sessions): all 1,122 cities get dated population; mayors (481 candidates) and websites (837) after confirmation.
  - Ongoing: weekly Action re-pulls and diffs; changed leaders go to a verify list for the research runs; never publish a leader change from Wikidata alone.
  - Not promised at 100%: briefs, per-city news, response times. Those show the labeled parent-level fallback.
- **Phase 5: Most reliable voices in the space (after coverage fill).** One list per field (Energy + the five sector tabs), 10 people max, alphabetical, no numeric score. Inclusion needs 3 of 5 linked evidence criteria: primary-source role, checkable track record, citations by primary institutions or peer review, corrections history, disclosed affiliations. Each profile: role, dated accomplishments, a current-affairs bio with every sentence sourced; weekly refresh in the research runs; stale after 14 days. About 8 to 10 sessions. Lists stay in a draft file off Pages until Cassidy approves them.
  - Phase 0 status: shipped in SW v29 (see Shipped).
  - Phase 1 status: batch 1 shipped in SW v31 (automated official-page pass, sector strips, electricity mix, example profiles retired); batch 2 in SW v32 (example stubs retired with real figures, US state figures, first hand pass on heads). Next: more hand passes for seats whose official sites block automated reads or do not name the holder, then official start dates.
- **Who's in the seat (SW v29, US first).** Key seats per place, each confirmed on an official page with its checked date; recent seat changes also tagged in the news column. Next: more countries (central bank, energy and finance ministries, regulators). Later each seat links to its Most reliable voices profile (Phase 5).
- **Project mind map (Cassidy, Oct 8, 11:55 AM MT; roadmap only, not built).** A 'Mind map' button appears whenever you select a project, a development, or a place plus a sector (for example, Energy in Utah). Tapping it opens one clear map of what's going on, built only from sourced, dated facts:
  1. Players: the companies, agencies, utilities, investors, landowners and officials involved, and each one's role.
  2. **Investors and firms:** who is investing in the project, sector or place (funds, corporates, banks, public agencies), the firms involved and their role (developer, EPC/builder, lender, adviser, offtaker), and a dated history of investments (each round or commitment with amount, date, investors and source). (Added by Cassidy, Oct 8, 11:58 AM MT.)
  3. Proposed projects: what's planned, where, how big (megawatts, dollars, acres or jobs), and its current status.
  4. Blockers: hard stops, like a denied permit, a lawsuit, missing financing, or no grid connection.
  5. Obstacles: slower headwinds, like local opposition, supply chain delays, labor, costs or policy uncertainty.
  6. Milestones reached: what's already done, each with a date and source.
  7. Next steps: the specific things that have to happen next and who has to do them, like a hearing, a permit decision or a financing close.
  8. End goal: what success realistically looks like, kept within reason and backed by what the project has actually stated.
  - Guardrails: one level deep (tapping a player or project shows its details in place instead of spawning a new map, so there's no endless loop); a clear Close returns to the map; every item links to its source and shows an as-of date; empty items say 'Not yet covered'; the daily research runs flag a mind map as stale when a milestone, blocker or next step changes.
  - Replaces the current industry mind map (double-click/long-press).
- **Growth path (decided by Cassidy, Oct 8): keep everything free and build a user base with email-only Buttondown sign-ups (no passwords, double opt-in). Paid stays off.** Done: content gaps pass, sign-up box (SW v27). Next: the weekly Monday Haul email and its archive.
- **On-demand briefs (option, not built).** A "write this brief now" path for places without a precomputed brief would need: a small server-side function (the site is static on GitHub Pages, so it cannot hold an AI key), a model API key kept server-side, a cache per place, source and week so each brief is written once, the same validation as the precomputed file (sources required, no item without a link), and a visible "written automatically, not reviewed" label. Today only reviewed, precomputed briefs ship.
- **Sector briefs for the five tabs.** Research runs write "Top 4 this week" briefs for Raw materials, Manufacturing, Services, Technology and Policy into data/{tab}-briefs.json after the Energy briefs: World and the United States first, then major countries. Same schema, rules and validator as Energy (see RESEARCH-RUNS.md). Nothing is seeded; empty slots say not ready yet.
- **Thin sector feeds.** Oct 8: 25 replacements added (forestry, textiles, packaging, plastics, pharma, property, telecom, accounting, legal, philanthropy, higher education, US wind). Still thin: fishing, metals, universities. Free RSS that works from the runner is scarce for these. Failed on Oct 7: agriculture.com, AgWeb, USDA, Fierce Pharma, Forestry.com, Consultancy.uk, Telecoms.com, Devex, OECD (403); FAO, Farmers Weekly, Mining Weekly, SeafoodSource, National Fisherman, The Fish Site, IndustryWeek, C&EN, Chronicle of Philanthropy (404); IMF, Wood Business (429); Chemical Week, Mining Journal, World Bank (no items). Find replacements.
- **Sector tagging precision.** Segment tags are keyword rules; spot-check each tab's segments per place and tighten rules as misfiles show up (as done for farm-down, LNG trains, car carriers, turbine foundations).
- **"Simplify this data" button.** On any data panel, indicator or story, a button labeled "Simplify this data" rewrites the explanation in plain language at about an 8th-grade reading level.
  - Every number, unit, as-of date and source stays visible and unchanged.
  - Never call it ELI5 or anything condescending.
  - One tap back to the original text.
  - Design questions:
    - Decided (Cassidy, Oct 7): on demand, written when tapped, not pre-written at build time.
    - How to keep it free: no paid API keys, nothing secret in the browser.
    - How to keep it factual: numbers, units, dates and sources are rendered from the data, not from rewritten text, plus an automatic check that the rewrite changes no figure.
- **Replace GDELT.** It refuses every request from GitHub runners and the box (HTTP 429). Find another free, no-key source for per-country news.
- **Fix or replace failing feeds:** NASA (intermittent), Utility Dive (timeouts), Railway Gazette (403), SemiAnalysis (403).
- **More national feeds** for the countries with fewer than 4 stories (42 of 77 tagged countries after the last run).

## Later
- Monthly or quarterly indicators beyond the United States (countries show annual World Bank lines today); state-equivalent and city indicators (Phase 2 to 4).
- Better city-level news (few stories are tagged to cities today).
- Monday Haul archive page (scaffolded, off Pages and unlinked until the first issue).
- Paid tier: deferred until Cassidy says go.

## Ideas
- Story counts on the map so you can see where news is thin.
- A per-place feed link (RSS) for the news column.

## Known limits
- Automatic location tags can be wrong; the site says so.
- Energy source and stage tags, and the sector tab segment tags, are keyword rules on the headline and summary; they can misfile a story (the tabs say so).
- Policy (Quinary) has no NAICS sector; its mapping (92 plus top company, university and nonprofit leadership) is our convention, stated on the Method page.
- Indicators: monthly and daily lines are US and global benchmarks; other countries show annual World Bank lines; state equivalents and cities say Not yet covered.
- Many small countries show labeled parent-level stories ("More worldwide") because they have few tagged stories.

## Open decisions (waiting on Cassidy)
- "Simplify this data": on demand is decided; which free tool writes the plain-language text, given the site is static and can't hold a key?
- Paid tier: stays deferred until you say go.
- Wire-heavy outlets (BNN Bloomberg, CNA, Straits Times, The National, Anadolu, Bangkok Post): stories with no named place are now filed as worldwide rather than the outlet's home country. Keep that?
- BRIEF.md (internal product notes, off Pages): keep as is or rewrite to match the new positioning?

## Decided
- 2026-10-08 (Cassidy): X is used only for Most reliable voices profiles (recent posts), NOT in the news column, which stays direct-to-source. The "See what people are saying on X" link is a plain X live search in a new tab; no posts, embeds or X API on the site.
- 2026-10-08 (Cassidy): Indicators are Activity, Prices and Capital only (at-a-glance numbers that follow the selected place). People moved to its own "Who's in the seat" view. Prices are globally watched benchmarks (gold, silver, bitcoin, WTI, Brent, then copper, natural gas, the dollar index, US CPI); diesel moved to the Energy tab.
- 2026-10-08 (Cassidy): retire the 6 "Example data" profiles (US, IN, AE, JP, NG, CL) once real blocks replace them (Phase 1).
- 2026-10-08 (Cassidy): the five sector tabs are "Sectors of the Economy"; Energy is separate (its own featured tab with its 9 sources), no Primary to Quinary label.
- 2026-10-08 (Cassidy): Monday Haul sample format and the weekly draft step approved. The Monday run drafts; it never sends.
- 2026-10-08 (Cassidy): keep everything free; build a user base through email-only Buttondown sign-ups (`longhaulledger`, double opt-in); paid tier stays off.

## Shipped (newest first, times MT)
- 2026-10-08 14:16: SW v37: round 6 retry on open leader seats. 16 seats in 11 countries filled. Where the country's own sites did not load (Bangladesh, Afghanistan, Burundi, Madagascar, Sao Tome and Principe, Eswatini, Guinea-Bissau), the CIA World Leaders directory (US government) is the source and each card says so with its update date. Equatorial Guinea comes from the government press office, and Nicaragua's Co-Presidents from the CIA directory plus the presidency's El 19 Digital. Governors-General are named in the notes for Solomon Islands and Saint Lucia. Heads of state now cover 185 of 187 countries, and heads of government 185. Still open: Haiti head of state (no president since the transition council ended; the CIA lists only the Prime Minister), the Sao Tome head of government (in flux after the legislative elections) and Western Sahara. New since-*.json dates file adds 8 official start dates (Netherlands, Denmark, Spain, Trinidad and Tobago, Czechia, Brazil, France, Honduras). merge-heads takes a sourceName override.
- 2026-10-08 14:10: SW v36: sector share strips for Taiwan and the Falkland Islands from official national statistics, where the World Bank publishes nothing. Taiwan: DGBAS national accounts (table 5-3 shares by activity for 2025 vs 2024, table 3-3 government consumption), DGBAS Manpower Survey (jobs in services), NSTC (R&D 4.08% of GDP, 2024) and the Ministry of Finance (tax revenue 13.2% of GDP, 2025). Falklands: FIG National Accounts 2014-2024, table 4 (2024 vs 2023; agriculture includes fishing, 58.3% of GDP, and the strip says so). Each line links its own source and the strip header names the agencies. The national rows live in data/stats/sectors-national.json and are carried through every weekly World Bank run. Sector strips: 183 of 187 countries.
- 2026-10-08 14:02: SW v35: round 5 hand pass on leaders, 118 seats confirmed on official pages (government and presidency sites, state news agencies such as KPL, SUNA, LANA, ENA, MONTSAME, Kabar, NAMPA, Ukrinform, KCNA and TATOLI, parliaments, and the African Union for Guinea-Bissau's transitional Prime Minister). Territories now show their head of state (France for New Caledonia and the French Southern Lands, Denmark for Greenland, the United States for Puerto Rico, the United Kingdom for the Falklands) with a short note; Northern Cyprus and Somaliland are filled from their own presidency sites. Seat notes (for example why a President fills both seats) now show on the card, and month-only start dates read as Jul 2025 rather than 2025-07. Heads: 175 of state, 179 of government (both for 174).
- 2026-10-08 13:31: SW v34: electricity mix for Cambodia and Kosovo (OWID rows with unused sources left blank, and Kosovo's missing ISO code, were being skipped), 183 countries now; presidential systems with no prime minister (Ghana, Malawi, Sierra Leone, Benin, Gabon, Venezuela, Botswana) show the confirmed President in both seats; leftover Not yet covered rows for seats a confirmed role fills are dropped. Heads: 120 of state, 116 of government (both for 95 countries).
- 2026-10-08 13:29: SW v33 (Phase 1, batch 3): Taiwan gets What changed lines (GDP, real growth, inflation) from the IMF World Economic Outlook DataMapper, since the World Bank does not publish Taiwan (latest completed year only, never projections). Third hand pass on heads via official portals, ministries and state news agencies: 14 more seats, now 120 heads of state and 109 heads of government (both for 88 countries).
- 2026-10-08 13:25: SW v32 (Phase 1, batch 2): the 20 example country stubs and their invented stability, frontier pressure and opportunity scores are retired; every country panel now shows only sourced lines, including a new World Bank Worldwide Governance Indicators political stability score (0 to 100) in Capital for 207 economies. US states (all 50 plus DC) get What changed lines (BEA GDP and real growth, Census ACS population, BLS unemployment via FRED) and an EIA electricity mix on the Energy tab, built box-side from the agency APIs (keys never committed; optional repository secrets would let the weekly stats run refresh them). First hand pass on heads: 64 more seats read on official pages, now 113 heads of state and 102 heads of government (both for 79 countries). Pushes are safer for the research runs: scripts/push-main.sh (fetch, rebase, retry) and union merges for ROADMAP.md and RESEARCH-RUNS.md.
- 2026-10-08 12:54: SW v31 (Phase 1, batch 1): heads of state and government for all 187 countries now show either a confirmed name (Wikidata candidate, name found on the country's official government page on Oct 8, no later holder recorded) or Not yet covered with the planned official source; 81 heads of state and 70 heads of government confirmed (both seats for 51 countries); start dates only where the official page states them. The six example profiles (US, IN, AE, JP, NG, CL) and their invented value chains are retired; the mind map on a profile-less country says Not yet covered. Sector share strips (World Bank, 11 indicators) on the five Sectors of the Economy tabs for 181 countries, and the electricity mix (Our World in Data, Ember and Energy Institute) on the Energy tab for 181. Method page coverage line counts all three.
- 2026-10-08 12:02: SW v30: the Fed broad dollar index in Prices is replaced by "Dollar index (DXY formula)", rebuilt daily from Federal Reserve H.10 rates via FRED (DEXUSEU, DEXJPUS, DEXUSUK, DEXCAUS, DEXSDUS, DEXSZUS) with the published DXY weights; not the official ICE DXY. Check: 101.91 for Oct 2 vs the reported ICE close of 101.93 (WSJ), 0.02% apart. (Approved by Cassidy, 11:59 AM MT.)
- 2026-10-08 11:51: SW v29 (Phase 0): (1) World intro is one line; the PROTOTYPE notice and the six example country chips are gone. (2) Indicators are now a "What changed" strip that follows the selected place: Activity, Prices, Capital only, each line with value, unit, arrow and change vs the prior reading, as-of date and the source on tap; empty groups hidden; places with nothing sourced say Not yet covered with the planned source. (3) Prices rebuilt around global benchmarks: gold, silver, copper (World Bank Pink Sheet, monthly), bitcoin (Coinbase via FRED), WTI, Brent, Henry Hub, the Fed broad dollar index and US CPI inflation (FRED); diesel moved to the Energy tab; steel PPI dropped. Countries get annual World Bank lines with prior-year change; values older than 10 years hidden with a note. (4) People left Indicators: new "Who's in the seat" view (9 US seats, each confirmed on an official .gov page, with checked dates and recent seat changes); seat-change stories tagged in the news column; old #d=people links redirect. (5) Not yet covered with planned source and checked date on empty leadership, seats, indicators and brief panels; 23 guessed response times, 13 SAMPLE terms and 10 "(see ...)" / SAMPLE names removed. (6) Method page coverage line built from the data files. (7) "See what people are saying on X" link on every story and each Energy source and segment panel (X live search, new tab). (8) stats.yml now keeps tests, hauls/ and archive.html off Pages too.
- 2026-10-08 11:25: SW v28: (1) Reorient: a compact Top button appears in the pinned header once the map scrolls away (keyboard and screen-reader labeled, honors reduced motion, returns focus to the map); the footer Top no longer slides under the header. (2) Whole-country panning: below World the map pans and zooms anywhere across the selected country (zoom out until the whole country fits), never beyond it; dragging or zooming against the country edge 3 times within 6 s makes the World button pulse 3 times (static highlight with reduced motion). (3) Emojis on all tabs: Energy, Raw materials, Manufacturing, Services, Technology, Policy. (4) Sectors of the Economy: the five sector panels carry that window title, an emoji switcher to change sector without closing, and the type next to the name (Raw materials · Primary through Policy · Quinary); wide screens show the group label and types in the tab row. Energy stays its own featured tab, outside the group.
- 2026-10-08 06:43: Monday Haul routine: RESEARCH-RUNS.md gains a "Monday Haul" section (free format, 6 to 8 items, about 5 Energy and 3 sector, World then US, dated real sources only, `npm run haul:check -- <file> --links --html` validator with HTTP 200 link check, footer exception to rule 5 for the email only, never send email). New `hauls/` folder (off Pages) with TEMPLATE.md and the approved example; BUILD-PLAN section 2 marked paid, deferred / superseded for the free Haul. Archive still off. No SW bump.
- 2026-10-08 06:33: SW v27: free "Get the Monday Haul, free" email sign-up (Buttondown longhaulledger, email only, double opt-in) under the news column and in the footer, with a thanks state; archive page scaffolded but off Pages and unlinked. Content gaps: 25 new free feeds (forestry, textiles, packaging, plastics, pharma, property, telecom, accounting, legal, philanthropy, higher education, US wind); no segment now has fewer than 4 worldwide stories (was 3: Forestry 2 to 12, Consumer goods 1 to 7, Metals 3 to 4); US wind stories 0 to 1 plus wind trade feeds; misfile rules tightened for DOE loans, robot flight paths, people named Ericsson, the EU's auditor, assets that breach a figure, tyre inflation, bare EU, CEO quotes, construction votes, water-pipeline drilling and nickel refineries. World nuclear brief rewritten from non-US stories (China Tianwan 7, Swiss reactor vote, Dutch AP1000 design work, Canada's BANR).
- 2026-10-08 06:11: Research run: Energy briefs for World Coal, Wind and Solar and US Solar and Wind (week of Oct 5); curated: US wind Sparrows Point added; Baltic Power, Yangjiang Fanshi and Clearway Swan marked confirmed (Clearway Swan located to Missouri). Data only, no SW bump.
- 2026-10-07 18:40: SW v26: slimmer phone header. The six tabs (Energy, Raw materials, Manufacturing, Services, Technology, Policy) sit in one sideways-swiping row with momentum, scroll snap, no scrollbar, 44px tap targets and an edge fade on the side with more tabs; the open tab scrolls into view, including from deep links. Desktop unchanged.
- 2026-10-07 18:28: SW v25: five sector tabs beside ⚡ Energy: Raw materials (Primary), Manufacturing (Secondary), Services (Tertiary), Technology (Quaternary), Policy (Quinary). 6 to 8 segments each with plain names and one-line descriptions; the "i" popup shows the official sector and NAICS 2022 codes (104 checked on census.gov). News per segment follows the selected place with labeled backfill; "Top 4 this week" slot says not ready yet until a sourced brief exists. Energy stories cross-list by stage (Extraction to Raw materials, Generation and refining to Manufacturing, Grid and distribution to Services, Innovation to Technology). 44 new free sector feeds. Method page section; deep links like #services/health/brief.
- 2026-10-07 18:17: Research run: Energy briefs for World and US Oil and Natural gas (week of Oct 5); curated: Isaias Gulf shut-ins and EIA October STEO added; IEA, Chevron/Hess Midstream, BLM California and Equinor Snohvit marked confirmed. Data only.
- 2026-10-07 17:25: Palisades nuclear brief item re-sourced to NRC's own pages (plus NEI and ANS); claims only weak links supported were cut. RESEARCH-RUNS.md gains the Energy briefs routine.
- 2026-10-07 17:18: SW v24: ⚡ Energy tab. Nine sources in Cassidy's order and copy (Nuclear, Oil, Natural gas, Coal, Wind, Solar, Hydro, Geothermal, Emerging), news per source that follows the selected place with labeled backfill, lifecycle stage chips with official NAICS references, "Top 4 this week" briefs (sourced nuclear brief for World and the United States; other sources say not ready yet), deep links like #energy/nuclear, 20 new free energy feeds, reusable sector-tab engine.
- 2026-10-07 16:47: SW v23: voice cleanup, no em dashes or tildes in site copy; header badge renamed "Example data" and shown only with example scores; copy test.
- 2026-10-07 15:40: ROADMAP.md added (repo-only, off Pages).
- 2026-10-07 14:42 — CI: overlapping data runs can no longer fail; feed and GDELT failures are non-fatal (no site change).
- 2026-10-07 13:41 — SW v22: news column follows the selected place (world, country, state equivalent, city) with labeled fallback; 67 free sources; neutral site wording.
- 2026-10-07 13:05 — SW v21: emerald $ carousel 12% faster.
- 2026-10-07 12:53 — SW v20: emerald $ spins on a vertical axis like a carousel.
- 2026-10-07 12:27 — RESEARCH-RUNS.md added (repo-only, off Pages).
- 2026-10-07 12:23 — SW v19: curated feed overrides merged on every rebuild; midday research pass.
- 2026-10-07 10:47 — SW v18: HTML entities decoded in headlines.
- 2026-10-07 10:40 — SW v17: emerald $ moves to the empty left column on desktop.
- 2026-10-07 08:37 — SW v16: example-data tags only on unsourced blocks.
- 2026-10-07 08:29 — SW v15: official stats pipeline (FRED series + World Bank macro) with sparklines.
- 2026-10-07 07:14 — SW v14: state legislatures, US senators and House delegations, congressional leadership.
- 2026-10-07 06:57 — SW v13: sourced governors, Canadian premiers, top-10 trade partners.
- 2026-10-06 19:06 — SW v12: worldwide state-equivalent drill and the emerald $ mark.
- 2026-10-06 19:01 — SW v11: state leadership on drill.
- 2026-10-06 18:50 — SW v10: cities show only after a state equivalent is chosen.
- 2026-10-06 18:48 — SW v9: Method ↑ Top control.
- 2026-10-06 17:49 — SW v8: BUILD-PLAN.md kept off Pages.
- 2026-10-06 17:43 — SW v7: sober retone, PROTOTYPE labels, indicators scaffold with a real Prices sample.
- 2026-10-06 16:33 — SW v6: opinion and explainers routed to Analysis.
- 2026-10-06 16:16 — SW v5: mobile map legend collapses to a tip button.
- 2026-10-06 15:27 — SW v4: drill offset and label fixes, verification tiers, "State equivalent" wording.
- 2026-10-06 14:03 — Leadership accordion and worldwide state-equivalent drill-down.
- 2026-10-06 13:47 — Renamed to Long Haul Ledger (repo and Pages path).
- 2026-10-06 13:35 — Soft launch: live news rail and vertical map controls.
- 2026-10-06 13:15 — Longview Ledger v0.2: map zoom, industry mind map, value chains, company profiles.
- 2026-10-06 12:11 — Longview Ledger v0: first interactive map sketch.
