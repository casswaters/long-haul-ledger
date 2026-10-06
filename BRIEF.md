# Long Haul Ledger — Product Brief (v0 sketch)

**Creed / tagline:** 10,000 Year Empire  
**Display name:** Long Haul Ledger (repo / Pages path still `longview-ledger` for now)  
**Domain intent:** longhaulledger.com (preferred); longviewledger.com also noted historically — neither purchased; availability check not required for this sketch  
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
| SVG atlas + zoom/pan (vertical zoom + legend) | Richer cartography, time layers, comparison |
| Free feeds only — no paid APIs, no always-on server ($0) | Optional paid data / custom domain (longhaulledger.com) |

**Honesty rule:** rail items that open outbound URLs are **REAL**. Desks/chains/companies stay **SAMPLE**-labeled until sourced.

### Soft-launch pipeline ($0)

1. `data/sources.json` — 20 free RSS/Atom feeds (hard-news + analysis), US/progress-biased.  
2. `scripts/fetch-signals.mjs` — normalize + light keyword score → `data/signals-live.json` (~80–120 items).  
3. `.github/workflows/soft-launch.yml` — schedule + `workflow_dispatch`; commit if changed; deploy `gh-pages`.  
4. SPA loads `signals-live.json` into the ledger rail with REAL badges.

Some feeds may **403 intermittently** (bot filters / WAF); the fetcher records failures and continues.

## Naming & vibe

Display name: **Long Haul Ledger**. Vibe words: **long haul + skilltree + civilization + world atlas + ledger** (repo folder remains `longview-ledger`).  
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
- Vertical atlas legend + zoom controls. SW cache `long-haul-ledger-v1`.  
- Seed desks: United States, India, UAE, Japan, Nigeria, Chile (full chains for ≥2–3 industries each).  
- Fetcher + Action stay within free GitHub Actions; no paid APIs or domains purchased.
