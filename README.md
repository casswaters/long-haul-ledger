# Long Haul Ledger

**Economic activity at every scale, from the world to your city.**

Zoom from the whole world down to a country, a state equivalent or a city, as general or as specific as you want at any moment; the panels and the news column follow your selection. Units, as-of dates and sources stay visible. Not investment advice. No real-time coverage.

Live: https://casswaters.github.io/long-haul-ledger/

| Surface | Status |
| --- | --- |
| **World map**: zoom, drill World → Country → State equivalent → City (Natural Earth state equivalents worldwide; cities after state), double-click / long-press mind map, leadership dropdowns | Map paths real; country profiles are **PROTOTYPE** example data |
| **News column**: follows the selected place; 4–5 top stories balanced across energy, infrastructure, industry and geopolitics, with clearly labeled stories from the parent level when a place has fewer; verification tiers (Confirmed / Multiple sources / Unconfirmed) + Analysis | Real links from public RSS/Atom feeds and the GDELT DOC 2.0 API, location-tagged at build time, refreshed about every 6 h by GitHub Actions |
| **Indicators**: Activity, People, Prices, Capital (`#d=prices`) | United States series for now (EIA, Federal Reserve, BLS and others via FRED CSV, no key); empty sections say so until a sourced record lands |
| Monday Haul | Coming soon. No sign-up yet |

Record rules: every line has a source URL, an as-of date and a revision note; history is append-only and superseded lines stay visible.

News locations: `locate.js` files each story to the places its headline and summary name (country names, demonyms, major cities, state equivalents, with rules for ambiguous names such as Georgia, Jordan, Chad, Niger and Turkey), or to a national outlet's home country when it names none. Tags can be wrong; every story links to its source.

**PROTOTYPE** marks example data for UX testing: country metrics, signals, constraints, mind maps, value chains and company profiles. It is fiction, not sourced. Leadership lists public channels only; SAMPLE / ESTIMATE marks unverified fields.

> **URL rename:** formerly `longview-ledger`. Old Pages URL redirects via stub repo `casswaters/longview-ledger`; use the live URL above.

```bash
npm test               # data, nav, zoom, geo, labels, verification tiers, location tags, news ranking, indicators
npm run fetch          # refresh data/signals-live.json (public feeds + GDELT top-up, location-tagged)
npm run fetch:prices   # refresh data/desks/prices.json (FRED CSV: GASDESW, DHHNGSP)
```

Hosting: GitHub Pages (`gh-pages`). The `soft-launch.yml` Action refreshes the news column and the Prices series and redeploys.

Map paths: Natural Earth via VectorAtlas (CC BY 4.0). Price series: U.S. EIA, retrieved via FRED (Federal Reserve Bank of St. Louis). News: the outlets named on each story and the GDELT Project.
