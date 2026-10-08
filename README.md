# Long Haul Ledger

**Economic activity at every scale, from the world to your city.**

Zoom from the whole world down to a country, a state equivalent or a city, as general or as specific as you want at any moment; the panels and the news column follow your selection. Units, as-of dates and sources stay visible. Not investment advice. No real-time coverage.

Live: https://casswaters.github.io/long-haul-ledger/

| Surface | Status |
| --- | --- |
| **World map**: zoom, drill World → Country → State equivalent → City (Natural Earth state equivalents worldwide; cities after state), double-click / long-press mind map, leadership dropdowns | Map paths real; country profiles are **PROTOTYPE** example data |
| **News column**: follows the selected place; 4–5 top stories balanced across energy, infrastructure, industry and geopolitics, with clearly labeled stories from the parent level when a place has fewer; verification tiers (Confirmed / Multiple sources / Unconfirmed) + Analysis | Real links from public RSS/Atom feeds and the GDELT DOC 2.0 API, location-tagged at build time, refreshed about every 6 h by GitHub Actions |
| **Indicators, "What changed"**: Activity, Prices, Capital (`#d=activity`, `#d=prices`, `#d=capital`); follows the selected place | Prices: gold, silver, copper (World Bank Pink Sheet), bitcoin, WTI, Brent, Henry Hub, US CPI (FRED CSV, no key), and a dollar index rebuilt daily from the DXY formula with Federal Reserve H.10 rates (not the official ICE DXY). US activity and capital lines via FRED; countries get annual World Bank lines (values older than 10 years hidden). Places with nothing sourced say Not yet covered with the planned source |
| **Who's in the seat** (`#seats`; old `#d=people` links redirect here) | Key seats (central bank, agency heads, regulators), each confirmed on an official page with its checked date (`data/seats.json`, US first); seat-change stories tagged in the news column |
| **X links** | "See what people are saying on X" on each story and each Energy source or segment panel: a plain X live search in a new tab. No posts, embeds or X API on the site |
| **Heads of state and government** (Leadership on each country) | Wikidata candidates, each confirmed on the country's official government page with a checked date; start dates only when the official page states them; unconfirmed seats say Not yet covered (`scripts/merge-heads.py`, `scripts/leadership-sources/heads-*.json`) |
| **Sector share strips and electricity mix** | Sectors of the Economy tabs: World Bank shares (`data/stats/sectors.json`); Energy tab: electricity generation mix from Our World in Data (`data/stats/energy-mix.json`) |
| Monday Haul | Free email sign-up (Buttondown, double opt-in) |

Record rules: every line has a source URL and an as-of date, and shows its change from the prior reading. Diesel (US retail) lives on the Energy tab.

News locations: `locate.js` files each story to the places its headline and summary name (country names, demonyms, major cities, state equivalents, with rules for ambiguous names such as Georgia, Jordan, Chad, Niger and Turkey), or to a national outlet's home country when it names none. Tags can be wrong; every story links to its source.

**PROTOTYPE** marks example data for UX testing: the scores on 20 country stubs, the industry mind maps and their value chains. The six full example profiles (US, IN, AE, JP, NG, CL) were retired on Oct 8, 2026. It is fiction, not sourced. Leadership lists public channels only; seats not yet confirmed say source pending or Not yet covered. No response-time estimates.

> **URL rename:** formerly `longview-ledger`. Old Pages URL redirects via stub repo `casswaters/longview-ledger`; use the live URL above.

```bash
npm test               # data, nav, zoom, geo, labels, verification tiers, location tags, news ranking, indicators
npm run fetch          # refresh data/signals-live.json (public feeds + GDELT top-up, location-tagged)
npm run fetch:prices   # refresh data/desks/prices.json (FRED CSV: GASDESW diesel for the Energy tab, DHHNGSP)
node scripts/fetch-stats.mjs fred|worldbank|pinksheet|sectors|energymix   # data/stats/us.json, world.json, benchmarks.json, sectors.json, energy-mix.json
python3 scripts/merge-heads.py   # heads of state and government into data/leadership.json
npm run coverage       # data/coverage.json (the Method page coverage line)
```

Hosting: GitHub Pages (`gh-pages`). The `soft-launch.yml` Action refreshes the news column and the Prices series and redeploys.

Map paths: Natural Earth via VectorAtlas (CC BY 4.0). Indicators: World Bank (WDI and the Pink Sheet) and public series via FRED (Federal Reserve Bank of St. Louis): EIA, BLS, Federal Reserve, Coinbase. News: the outlets named on each story and the GDELT Project.
