# Long Haul Ledger — Product Brief (v1, retoned Oct 6, 2026)

**Governing document:** the Long Haul Ledger subscription brief. Where this brief, the build plan (`BUILD-PLAN.md`, kept on main and not published to Pages) and the subscription brief differ, the subscription brief wins.

**Display name:** Long Haul Ledger
**Tagline:** A sourced record of what moved in US industry, with a world index.
**Repo / Pages:** `casswaters/long-haul-ledger` → https://casswaters.github.io/long-haul-ledger/
**Domain intent:** longhaulledger.com (not purchased).
**Owner:** Cassidy Waters
**Status:** Soft launch. Atlas and US Progress rail real; Prices desk sample wired to public series; Activity, People, Capital desks empty until sourced; country desks PROTOTYPE.

---

## Who it is for

An American industrialist checking in on global economic activity. He opens it the way he would open a plant or ops dashboard: a quick scan of what moved worldwide (the free atlas is the index), then straight into the US desks where the sourced depth lives. Global coverage answers "what changed out there that touches my inputs, freight or capital?"; the US desks answer "what does it mean here?"

Design for that reader: sober and operator-grade, dense but fast to scan, units, as-of dates and sources always visible. Nothing decorative, promotional or mythic.

## US anchor, not a design theme

The United States is the editorial anchor: it sets coverage priority, the four desks, and where paid drill-down will start. It is not a visual feature. No flag styling, no patriotic palette, no "America first" branding in copy, logo or UI. The atlas is a neutral world map with the same treatment for every country.

## Surfaces

| Surface | What it does | Status |
| --- | --- | --- |
| **World index atlas** | Zoom (size-based reflow, stays sharp). **Single-click** → country desk. **Double-click** (desktop) / **long-press** / **Mind map** button → industry mind map (country level only). Drill World → Country → State equivalent → City (US, IN, AE, JP seeded; Alaska / Hawaii insets). Country view shows outline + state-equivalent borders only; city markers appear after a state equivalent is chosen. Vertical legend collapses to an "i" on mobile. Leadership dropdowns (public channels only). | Free, always |
| **US Progress rail** | Public RSS via GitHub Actions (~6 h), outbound links, verification tiers: **Unconfirmed**, **Multiple sources** (reported by 2+ independent outlets), **Confirmed** (subject / official source), plus **Analysis** for opinion, trend and explainer pieces. | Free, always |
| **US desks** (`#d=activity\|people\|prices\|capital`) | Entry point in the header ("US desks"), on the home panel (four tiles) and on the US country desk. Each desk shows scope, update trigger, sources and a record table: source link, as-of date, revision note, visible history (superseded lines struck through). | Prices: live sample. Others: "No sourced entries yet. Updates when a sourced change lands." |
| **Monday Haul** | Weekly one-page summary of the four desks. | Coming soon. No email capture, pricing or login yet |

### Prices desk (free sample)

- Diesel, US retail on-highway: EIA `EMD_EPD2D_PTE_NUS_DPG`, pulled from FRED `GASDESW` ($/gal, weekly).
- Henry Hub natural gas spot: EIA `RNGWHHD`, pulled from FRED `DHHNGSP` ($/MMBtu, daily, lagged).
- `scripts/fetch-prices.mjs` runs in `soft-launch.yml`; writes `data/desks/prices.json` only when a value or as-of date changes; history is append-only; a failed fetch keeps the last good line with its as-of date. No API key, $0.
- Ranges are not set (the editor sets them later with a written reason). Uranium, copper, HRC (PPI proxy) and regional power are listed as planned, not wired.

## PROTOTYPE layer

The original civilization / opportunity framing is retired. What remains of it is the **prototype layer**, kept for UX testing and clearly labeled with one consistent **PROTOTYPE** badge and a one-line explainer:

- country metrics (Stability, Build pressure, Headroom scores), signals, regions;
- "Constraints" (formerly "Openings"; hash id `t=openings` kept for old links);
- industry mind maps, value chains, company desks;
- the full prototype country desks for the United States, India, UAE, Japan, Nigeria and Chile, and all lighter stubs.

Leadership response times stay **ESTIMATE**, unverified fields stay **SAMPLE**. `data.js` and `chains.js` export `prototype = true`; nothing in them may feed a desk or paid output.

## Rules

- Every desk line: source URL (https), as-of date, revision note, `status: verified`. Values are copied from the source, never typed from memory.
- Not investment advice. No real-time coverage.
- No paywall, pricing or login on Pages. Hosting is GitHub Pages only, $0.

## Board relation (do not rebuild)

| Project | Role |
| --- | --- |
| **Captain's Log** | Main personal site — https://casswaters.github.io/modern-era-calendar/ |
| **Aretoria** | Separate project; not touched by this one |
| **ForgeCraft** | Parked |
| **Long Haul Ledger** | This project — standalone GitHub Pages US industrial ledger |

## Success for this phase (BUILD-PLAN §6, Phase 0 relabel)

- Every fictional number sits next to a visible PROTOTYPE label; atlas and rail behave as before.
- US desks entry point live; Prices sample shows real values with as-of dates and source links.
- SW cache `long-haul-ledger-v10` (v10: cities only after state-equivalent drill; v9 Method ↑ Top; BUILD-PLAN.md off Pages); `npm test` passes.
