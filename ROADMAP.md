# Long Haul Ledger — Roadmap

Repo-only planning file. It is excluded from GitHub Pages (like BUILD-PLAN.md and RESEARCH-RUNS.md) and never ships to the live site.

**Last updated:** 2026-10-08, 6:20 AM MT

## House rules
- No paid tier, pricing or paywall copy until Cassidy says go.
- Real sources only: every story and number links to a real public source. No invented metrics; example data is labeled PROTOTYPE.
- No flag styling.
- Never show "admin-1" in the UI. Say "state equivalent".
- One neutral tagline: "Economic activity at every scale, from the world to your city."

## Now
- **Energy briefs, World and United States first (underway in the 6 AM / noon / 6 PM research runs).** As of Oct 8, 6:11 AM MT: World has 6 of 9 (Nuclear, Oil, Natural gas, Coal, Wind, Solar); United States has 5 of 9 (Nuclear, Oil, Natural gas, Solar, Wind). Still to write: World Hydro, Geothermal, Emerging; US Coal, Hydro, Geothermal, Emerging. Then China, India, Japan, Germany, the United Kingdom, France, Canada, Brazil, Saudi Arabia, Australia and South Korea. Candidates come from `node scripts/build-energy-brief.mjs --place <id> --source <source>`; run `--validate` before committing. Briefs older than 7 days show a stale flag.
- **Content gaps before any sign-up (Oct 8 proposal, step 1):** thin segments, misfiled stories, the World nuclear brief repeating the US one, few US wind stories, and the unwritten sector-tab briefs.
- Spot-check the news column per place for wrong location tags and odd rankings; fix rules as found.

## Next
- **Path to a subscription (proposed Oct 8, waiting on Cassidy's OK).** 1) Fill the content gaps (in Now). 2) A free weekly sample email built from the Monday Haul as the lead magnet. 3) Free Buttondown email sign-up plus an issue archive, no paywall. 4) Paid only when Cassidy says go.
- **On-demand briefs (option, not built).** A "write this brief now" path for places without a precomputed brief would need: a small server-side function (the site is static on GitHub Pages, so it cannot hold an AI key), a model API key kept server-side, a cache per place, source and week so each brief is written once, the same validation as the precomputed file (sources required, no item without a link), and a visible "written automatically, not reviewed" label. Today only reviewed, precomputed briefs ship.
- **Sector briefs for the five tabs.** Research runs write "Top 4 this week" briefs for Raw materials, Manufacturing, Services, Technology and Policy into data/{tab}-briefs.json after the Energy briefs: World and the United States first, then major countries. Same schema, rules and validator as Energy (see RESEARCH-RUNS.md). Nothing is seeded; empty slots say not ready yet.
- **Thin sector feeds.** Free RSS that works from the runner is scarce for fishing, forestry, chemicals and pharma, textiles and paper, and property. Failed on Oct 7: agriculture.com, AgWeb, USDA, Fierce Pharma, Forestry.com, Consultancy.uk, Telecoms.com, Devex, OECD (403); FAO, Farmers Weekly, Mining Weekly, SeafoodSource, National Fisherman, The Fish Site, IndustryWeek, C&EN, Chronicle of Philanthropy (404); IMF, Wood Business (429); Chemical Week, Mining Journal, World Bank (no items). Find replacements.
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
- Indicators beyond the United States (currently US-only); needs free official series per country.
- Better city-level news (few stories are tagged to cities today).
- Monday Haul weekly summary (no sign-up yet).
- Paid tier: deferred until Cassidy says go.

## Ideas
- Story counts on the map so you can see where news is thin.
- A per-place feed link (RSS) for the news column.

## Known limits
- Automatic location tags can be wrong; the site says so.
- Energy source and stage tags, and the sector tab segment tags, are keyword rules on the headline and summary; they can misfile a story (the tabs say so).
- Policy (Quinary) has no NAICS sector; its mapping (92 plus top company, university and nonprofit leadership) is our convention, stated on the Method page.
- Indicators are United States only.
- Many small countries show labeled parent-level stories ("More worldwide") because they have few tagged stories.

## Open decisions (waiting on Cassidy)
- Subscription path (Oct 8 proposal: fill gaps, free Monday Haul sample email, free Buttondown sign-up and archive, paid only on your go): OK to start?
- "Simplify this data": on demand is decided; which free tool writes the plain-language text, given the site is static and can't hold a key?
- Paid tier: stays deferred until you say go.
- Which countries get indicators after the United States?
- Wire-heavy outlets (BNN Bloomberg, CNA, Straits Times, The National, Anadolu, Bangkok Post): stories with no named place are now filed as worldwide rather than the outlet's home country. Keep that?
- BRIEF.md (internal product notes, off Pages): keep as is or rewrite to match the new positioning?

## Shipped (newest first, times MT)
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
