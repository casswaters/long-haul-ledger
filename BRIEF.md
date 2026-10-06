# Long Haul Ledger — Product Brief (v0 sketch)

**Creed / tagline:** 10,000 Year Empire  
**Display name:** Long Haul Ledger  
**Repo / Pages:** `casswaters/long-haul-ledger` → https://casswaters.github.io/long-haul-ledger/  
**Domain intent:** longhaulledger.com (preferred; not purchased). Availability check not required for this sketch.  
**Owner:** Cassidy Waters  
**Status:** Soft launch — US Progress rail from public RSS (REAL); country desks SAMPLE

---

## Problem

Civilization is developing unevenly. Most “news” products optimize for velocity, outrage, or markets. Someone who wants to **study frontiers and openings** — where infrastructure, energy, compute, institutions, demographics, logistics, and resource commons are binding or breaking — has to assemble that picture by hand across atlases, journals, and sector reports.

## User

A long-horizon operator / student of development: founder, allocator, policy nerd, or builder who thinks in decades (and metaphorically in millennia). Not a day-trader. Not a fantasy RPG player (that’s Aretoria).

## Job

**Civilization news + map + opportunity desk.**

1. See the world as an atlas of development pressure (zoom/pan so small states are reachable).  
2. **Single-click** a country → country desk (signals / industries / regions / openings).  
3. **Double-click** (desktop) or **long-press** / **Mind map** button (mobile) → industry mind map (skilltree).  
4. Click an industry node → SAMPLE value chain (upstream / midstream / downstream).  
5. Click a company → SAMPLE announcements + “working on next” pipeline.  
6. Surface **openings**: weak spots framed as long-horizon skilltree gaps.

## Core loop

**Map (zoom) → country desk ↔ industry mind map → value chain → company desk → back.**

The global **Ledger** rail is a civilization-weighted feed; selecting a country filters it. Openings are deliberately *not* trade tips — they are multi-year / multi-decade gaps.

**Click distinction (documented in UI):** single-click opens the existing country desk; double-click / long-press / Mind map button opens the radiating industry mind map.

## Soft launch (current) vs later

| Soft launch (now) | Later |
| --- | --- |
| **US Progress** rail: REAL public RSS via GitHub Actions (every ~6h + manual) | Broader country rails + denser weighting |
| Country desks / chains / companies still SAMPLE | Attach real articles to desks; drop SAMPLE fiction where sourced |
| SVG atlas + zoom/pan + drill World → Country → State equivalent → City (US/IN/AE/JP) + Leadership accordion | Full-planet state equivalents, denser leadership, time layers |
| Free feeds only — no paid APIs, no always-on server ($0) | Optional paid data / custom domain (longhaulledger.com) |

**Honesty rule:** rail items that open outbound URLs are **REAL**. Desks/chains/companies stay **SAMPLE**-labeled until sourced.

### Soft-launch pipeline ($0)

1. `data/sources.json` — 20 free RSS/Atom feeds (hard-news + analysis), US/progress-biased.  
2. `scripts/fetch-signals.mjs` — normalize + light keyword score → `data/signals-live.json` (~80–120 items).  
3. `.github/workflows/soft-launch.yml` — schedule + `workflow_dispatch`; commit if changed; deploy `gh-pages`.  
4. SPA loads `signals-live.json` into the ledger rail with REAL badges + a verification tier per item.

### Verification tiers (rail)

Every live item carries `verification.status` + the outlets that carry it (`verify.js`, run in the fetcher; the browser re-classifies only if a feed predates statuses):

- **Unconfirmed** (amber) — one outlet reports it; the subject (company / agency / official) hasn't confirmed.
- **Multiple sources** (blue) — 2+ independent outlets in the feed carry the same story (clustered by normalized-title similarity + shared distinctive names / places / orgs within ~48h); subject hasn't confirmed.
- **Confirmed** (green) — subject confirmed: items from primary / official feeds (DOE, EIA, NIST, NASA, Fed, Defense.gov, company press / IR) for their own announcements; a cluster is promoted when a primary item matches it.
- **Analysis** (violet) — opinion / essay / think-tank pieces get an Analysis tag instead of a tier. SAMPLE desk items stay **SAMPLE**.

Tap / hover a badge to list outlets; rail chips filter by status.

Some feeds may **403 intermittently** (bot filters / WAF); the fetcher records failures and continues.

## Naming & vibe

Display name: **Long Haul Ledger**. Vibe words: **long haul + skilltree + civilization + world atlas + ledger**. Repo / folder / Pages path: `long-haul-ledger`.  
Aesthetic: sober intelligence desk — dark ink on slate/parchment, restrained brass. Distinct from Captain’s Log chrome and Aretoria’s sacred/fantasy portal.

## Board relation (do not rebuild)

| Project | Role |
| --- | --- |
| **Captain’s Log** | Main personal site (MEC + Aretoria features) — https://casswaters.github.io/modern-era-calendar/ |
| **Aretoria** | Standalone + feature inside CL — virtue realms / fantasy-adjacent sacred portal |
| **ForgeCraft** | Parked |
| **Long Haul Ledger** | This project — standalone GitHub Pages civilization desk |

## Success for soft launch

- Live at GitHub Pages with zoomable map → country panel + mind map → value chain → company desk.  
- **US Progress** rail shows REAL RSS items with outbound links; SAMPLE badges remain on desks.  
- Vertical atlas legend + zoom controls. SW cache `long-haul-ledger-v4`. Leadership accordion + drill World → Country → State equivalent → City (seeded US/IN/AE/JP).  
- Drill layers share one projection calibrated to `world.svg` (its equator sits at y≈578.5 of 1001, not mid-height); Alaska / Hawaii are framed insets; city labels use collision-aware, zoom-aware placement.  
- Rail items carry Unconfirmed / Multiple sources / Confirmed / Analysis badges.  
- Seed desks: United States, India, UAE, Japan, Nigeria, Chile (full chains for ≥2–3 industries each).  
- Fetcher + Action stay within free GitHub Actions; no paid APIs or domains purchased.
