# Long Haul Ledger

**A sourced record of what moved in US industry, with a world index.**

An operator-grade dashboard for an American industrialist checking in on global economic activity: a quick world scan (the free atlas is the index), then the four US desks where the sourced depth lives. Units, as-of dates and sources stay visible. Not investment advice. No real-time coverage.

Live: https://casswaters.github.io/long-haul-ledger/

| Surface | Status |
| --- | --- |
| **World index atlas**: zoom, drill World → Country → State equivalent → City, double-click / long-press mind map, leadership dropdowns | Free. Map paths real; country desks are **PROTOTYPE** example data |
| **US Progress rail**: public RSS, outbound links, verification tiers (Confirmed / Multiple sources / Unconfirmed) + Analysis | Free, real links, refreshed about every 6 h by GitHub Actions |
| **US desks**: Activity, People, Prices, Capital (`#d=prices`) | Prices sample wired to public series (EIA diesel and Henry Hub via FRED CSV, no key). Activity, People and Capital show an honest empty state until a sourced record lands |
| Monday Haul | Coming soon. No sign-up, pricing or login yet |

Desk record rules: every line has a source URL, an as-of date and a revision note; history is append-only and superseded lines stay visible. See the build plan (§3, `BUILD-PLAN.md` on the repo's main branch, not published to Pages) and [BRIEF.md](./BRIEF.md).

**PROTOTYPE** marks example data for UX testing: country metrics, signals, constraints, mind maps, value chains and company desks (including the India, UAE, Japan, Nigeria and Chile desks). It is fiction, not sourced, and never part of any desk or subscription. Leadership lists public channels only; SAMPLE / ESTIMATE marks unverified fields.

> **URL rename:** formerly `longview-ledger`. Old Pages URL redirects via stub repo `casswaters/longview-ledger`; use the live URL above.

```bash
npm test               # data, nav, zoom, geo, labels, verification tiers, desks
npm run fetch          # refresh data/signals-live.json from public RSS
npm run fetch:prices   # refresh data/desks/prices.json (FRED CSV: GASDESW, DHHNGSP)
```

Hosting: GitHub Pages only (`gh-pages`), $0. The `soft-launch.yml` Action refreshes the rail and the Prices desk and redeploys.

Map paths: Natural Earth via VectorAtlas (CC BY 4.0). Price series: U.S. EIA, retrieved via FRED (Federal Reserve Bank of St. Louis).
