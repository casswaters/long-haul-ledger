# Long Haul Ledger — Roadmap

Repo-only planning file. It is excluded from GitHub Pages (like BUILD-PLAN.md and RESEARCH-RUNS.md) and never ships to the live site.

**Last updated:** 2026-10-07, 5:18 PM MT

## House rules
- No paid tier, pricing or paywall copy until Cassidy says go.
- Real sources only: every story and number links to a real public source. No invented metrics; example data is labeled PROTOTYPE.
- No flag styling.
- Never show "admin-1" in the UI. Say "state equivalent".
- One neutral tagline: "Economic activity at every scale, from the world to your city."

## Now
- Watch the next scheduled data runs (every 6 h, next about 6:17 PM MT) after the CI fix; data commits should land cleanly.
- Spot-check the news column per place for wrong location tags and odd rankings; fix rules as found.

## Next
- **Energy briefs for all 9 sources and major countries.** Research runs write the "Top 4 this week" briefs into data/energy-briefs.json (keyed by place id and source) after checking every number, date and @handle against the linked sources. Start with World and the United States for all 9 sources, then China, India, Japan, Germany, the United Kingdom, France, Canada, Brazil, Saudi Arabia, Australia and South Korea. Candidates come from `node scripts/build-energy-brief.mjs --place <id> --source <source>`; run `--validate` before committing. Briefs older than 7 days show a stale flag.
- **On-demand briefs (option, not built).** A "write this brief now" path for places without a precomputed brief would need: a small server-side function (the site is static on GitHub Pages, so it cannot hold an AI key), a model API key kept server-side, a cache per place, source and week so each brief is written once, the same validation as the precomputed file (sources required, no item without a link), and a visible "written automatically, not reviewed" label. Today only reviewed, precomputed briefs ship.
- **Sector tabs for the five economic types (Primary to Quinary), after Energy is right.** Taxonomy follows the BLS industries index (https://www.bls.gov/iag/tgs/iag_index_alpha.htm) and NAICS 2022 (https://www.census.gov/naics/).
  - Primary: farming, mining, fishing, forestry.
  - Secondary: manufacturing, construction, food processing.
  - Tertiary: healthcare, education, retail, banking, hospitality.
  - Quaternary: IT, R&D, consulting.
  - Quinary: government leadership, higher-ed admin, top non-profit management.
  - Reuse the Energy engine: sectors.js (tagging, place filtering with labeled backfill, brief schema and validation, deep links), sectorui.js (the tab), and a definition file like energy.js. A new tab is a definition file plus a header button.
  - Keep the plain label plus official reference pattern: visible labels stay plain; on tap or hover each shows its economic type and the NAICS code(s) it maps to, linked to census.gov NAICS or the BLS industries pages. Only codes verified on the official sites.
  - Energy stories already carry lifecycle stage tags (Extraction = Primary, Generation and refining = Secondary, Grid and distribution = Tertiary, Innovation = Quaternary), so these tabs can pull energy stories by stage.
- **"Simplify this data" button.** On any data panel, indicator or story, a button labeled "Simplify this data" rewrites the explanation in plain language at about an 8th-grade reading level.
  - Every number, unit, as-of date and source stays visible and unchanged.
  - Never call it ELI5 or anything condescending.
  - One tap back to the original text.
  - Design questions:
    - Generate at build time (static, reviewable, cached) or on demand (per click)?
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
- Energy source and stage tags are keyword rules on the headline and summary; they can misfile a story (the tab says so).
- Indicators are United States only.
- Many small countries show labeled parent-level stories ("More worldwide") because they have few tagged stories.

## Open decisions (waiting on Cassidy)
- "Simplify this data": build-time or on-demand, and which free tool writes the plain-language text?
- Paid tier: stays deferred until you say go.
- Which countries get indicators after the United States?
- Wire-heavy outlets (BNN Bloomberg, CNA, Straits Times, The National, Anadolu, Bangkok Post): stories with no named place are now filed as worldwide rather than the outlet's home country. Keep that?
- BRIEF.md (internal product notes, off Pages): keep as is or rewrite to match the new positioning?

## Shipped (newest first, times MT)
- 2026-10-07 17:18: SW v24: ⚡ Energy tab. Nine sources in Cassidy's order and copy (Nuclear, Oil, Natural gas, Coal, Wind, Solar, Hydro, Geothermal, Emerging), news per source that follows the selected place with labeled backfill, lifecycle stage chips with official NAICS references, "Top 4 this week" briefs (sourced nuclear brief for World and the United States; other sources say not ready yet), deep links like #energy/nuclear, 20 new free energy feeds, reusable sector-tab engine.
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
