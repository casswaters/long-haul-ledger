# Long Haul Ledger: Build Plan v1

Owner: Cassidy Waters. Written Oct 6, 2026. Status: plan only, nothing built or committed.
Governing brief: the Long Haul Ledger subscription brief. Where this plan and the brief differ, the brief wins.

**What we're building:** a free public atlas, plus a paid Monday Haul and four US desks (Activity, People, Prices, Capital). The desks update only when something with a source changes. The weekly diff is the product. Hosting stays on GitHub Pages at $0. No API on day one. No real-time claims. Not investment advice.

**US anchor, not a design theme:** the United States is the editorial anchor. It sets coverage priority, the four desks, and where paid drill-down starts. It is not a visual feature: no flag styling, no patriotic palette, and no "America first" branding in copy, logo, or UI. The atlas stays a neutral world map with the same treatment for every country, and the US earns attention through the depth of its sourced desks, not through decoration.

**Who the UI is for:** an American industrialist checking in on global economic activity. He opens it the way he would open a plant or ops dashboard: a quick scan of what moved worldwide (the free atlas is the index), then straight into the US desks where the sourced depth lives. Design for that reader: sober and operator-grade, dense but fast to scan, with units, as-of dates and sources always visible, and nothing decorative, promotional, or mythic. Global coverage answers "what changed out there that touches my inputs, freight, or capital?", and the US desks answer "what does it mean here?"

---

## 1. Free vs paid boundary

| Surface | Free | Paid | Never in paid |
|---|---|---|---|
| Atlas: World → Country → State equivalent → City, zoom, mind map | Yes, always | | |
| US Progress rail (public RSS, verification tiers) | Yes, always | | |
| Sample desk: Prices desk, current lines only (series, unit, as-of, source, industrial use) | Yes | | |
| Methodology page: source list, record rules, correction policy, disclaimer | Yes, always | | |
| One past Monday Haul issue as a format sample | Yes | | |
| Monday Haul, every week | | Yes | |
| Activity, People, Capital desks (full) | | Yes | |
| Prices desk history, range-break diffs, "why it matters" notes | | Yes | |
| Change-log alerts (same-day notes on material moves) | | Yes | |
| Full archive of hauls and desk history | | Yes | |
| Quarterly bound ledger (annual subscribers) | | Later | |
| Sector drill-downs (fuels and midstream, power and grid, nuclear and fuel cycle, heavy manufacturing) | | Later, as add-ons | |
| SAMPLE or ESTIMATE lines, prototype country metrics, value chains, company desks, Openings | Free, labeled PROTOTYPE | | Never |

Rules:
- Do not gate the map at any level. Do not gate the rail.
- A record reaches paid only if it has a source URL, an as-of date and a revision note, and its status is `verified`.
- Global stays a free index. Paid drill-down starts at the United States. A state or company opens in paid only when it has a sourced note.
- Why the Prices desk is the free sample: the raw series are public anyway, so locking them would be selling a free number. The paid value is the history, the range breaks and the connective notes.

---

## 2. The Monday Haul template

### 2.1 Inclusion test (apply to every item before it goes in)

An item belongs only if all three are true:
1. **Sourced:** it has a primary or official source link and an as-of date. No source means it is out.
2. **Connected:** it changes something in another block or in a tracked project. Examples from the brief: a diesel move belongs only if it changes freight, refining or a tracked project. A nomination belongs only if the seat touches permits, loans or rates.
3. **Material:** it changed since the last haul, or the previous value was revised.

If an item passes 1 and 3 but not 2, it goes to the desk record without a haul line. Range of 5 to 8 items total across the four blocks. The Prices strip counts as one item.

### 2.2 Literal template (copy this into `hauls/YYYY-MM-DD.md`)

```markdown
# The Monday Haul · [YYYY-MM-DD]
Long Haul Ledger · US industrial record · Issue [N]
Not investment advice. Not real-time. Every line below has a source and an as-of date.

## Read of the week
[ONE OR TWO SENTENCES: did the physical economy speed up, slow, or hold? Cite the items below by number.]

## Activity
1. **[HEADLINE]**: [WHAT CHANGED, OLD → NEW, UNIT]
   Source: [SOURCE NAME](SOURCE_URL) · As of: [YYYY-MM-DD]
   Why it belongs: [ONE SENTENCE NAMING THE LINK TO PEOPLE, PRICES, CAPITAL OR A TRACKED PROJECT]

## People
2. **[SEAT] · [PERSON]**: [ACTION: nominated / confirmed / resigned / hearing set / board change]
   Source: [SOURCE NAME](SOURCE_URL) · As of: [YYYY-MM-DD]
   Why it belongs: [ONE SENTENCE: WHICH PERMIT, LOAN OR RATE THIS SEAT TOUCHES]

## Prices (strip, counts as one item)
| Series | Value | Unit | Prior | As of | Source | Note |
|---|---|---|---|---|---|---|
| Diesel, US retail | [VALUE] | $/gal | [PRIOR] | [DATE] | [SOURCE] | [IN RANGE / BROKE RANGE] |
| Henry Hub spot | [VALUE] | $/MMBtu | [PRIOR] | [DATE] | [SOURCE] | [ ] |
| Uranium | [VALUE] | $/lb | [PRIOR] | [DATE] | [SOURCE] | [PROXY CAVEAT] |
| Copper | [VALUE] | $/metric ton | [PRIOR] | [DATE] | [SOURCE] | [MONTHLY, LAGGED] |
| HRC steel (PPI proxy) | [VALUE] | index | [PRIOR] | [DATE] | [SOURCE] | [PROXY, NOT A PRICE] |
| Power, [HUB] | [VALUE] | $/MWh | [PRIOR] | [DATE] | [SOURCE] | [ ] |
3. Why it belongs: [ONE SENTENCE ON THE ONE PRICE THAT MATTERED THIS WEEK AND WHAT IT TOUCHES. IF NONE BROKE RANGE, SAY SO.]

## Capital
4. **[PROJECT] · [SPONSOR]**: [STAGE OLD → STAGE NEW, e.g. announced → FID]
   Amount: [VALUE AS STATED IN SOURCE, OR "not disclosed"]
   Source: [SOURCE NAME](SOURCE_URL) · As of: [YYYY-MM-DD]
   Why it belongs: [ONE SENTENCE]

## Open questions carried forward
- [QUESTION] · opened [YYYY-MM-DD] · desk: [DESK] · record: [RECORD_ID]

## Corrections and revisions
- [YYYY-MM-DD] · [RECORD_ID] · Was: [OLD LINE] · Now: [NEW LINE] · Why: [AGENCY REVISION / MY ERROR / SOURCE UPDATED] · Source: [URL]
- If none: "No corrections this week."

---
Sources are public. Values are as published by the source on the as-of date and may be revised. Lines marked PROXY are not the named price.
```

### 2.3 Blank worked example (placeholders only; fill from real sources)

```markdown
# The Monday Haul · [2026-MM-DD]
Issue [N]

## Read of the week
[Rail carloads and refinery utilization moved in the same direction this week (items 1, 3); see Prices for whether diesel followed.]

## Activity
1. **Weekly rail carloads**: [OLD VALUE] → [VALUE] carloads, [+/-][VALUE]% vs prior week
   Source: [AAR Weekly Railroad Traffic](https://www.aar.org/data-center/rail-traffic-data/) · As of: [WEEK ENDING DATE]
   Why it belongs: [Carload moves set the demand for diesel and the case for the rail project in Capital item 4.]

## People
2. **[Commissioner, FERC] · [NAME]**: [hearing set / confirmed]
   Source: [Senate ENR hearing page](https://www.energy.senate.gov/hearings) · As of: [DATE]
   Why it belongs: [This seat votes on interstate pipeline certificates, including [TRACKED PROJECT].]

## Prices
| Series | Value | Unit | Prior | As of | Source | Note |
|---|---|---|---|---|---|---|
| Diesel, US retail | [VALUE] | $/gal | [PRIOR] | [DATE] | EIA EMD_EPD2D_PTE_NUS_DPG | [ ] |
| Henry Hub spot | [VALUE] | $/MMBtu | [PRIOR] | [DATE] | EIA RNGWHHD | [ ] |
| Uranium | [VALUE] | $/lb | [PRIOR] | [MONTH] | IMF via FRED PURANUSDM | Monthly, lagged |
| Copper | [VALUE] | $/metric ton | [PRIOR] | [MONTH] | IMF via FRED PCOPPUSDM | Monthly, lagged |
| HRC steel (PPI proxy) | [VALUE] | index 1982=100 | [PRIOR] | [MONTH] | BLS via FRED WPU1017 | Proxy, not HRC price |
| Power, PJM West | [VALUE] | $/MWh | [PRIOR] | [TRADE DATE] | EIA/ICE wholesale file | Biweekly update |
3. Why it belongs: [Henry Hub [broke / stayed inside] the [LOW]-[HIGH] range set on [DATE]; that feeds the power price for [TRACKED PROJECT].]

## Capital
4. **[PROJECT] · [SPONSOR]**: announced → [conditional commitment / loan closed]
   Amount: [AS STATED IN SOURCE]
   Source: [DOE LPO](https://www.energy.gov/lpo/portfolio-projects) · As of: [DATE]
   Why it belongs: [Moves the project from announced to financed, the change the Capital desk tracks.]

## Corrections and revisions
- [DATE] · activity/[RECORD_ID] · Was: [OLD] · Now: [REVISED] · Why: Fed G.17 revision · Source: [URL]
```

---

## 3. The four US desks

### 3.1 Shared record schema (all four desks)

```json
{
  "id": "prices.henry-hub",
  "desk": "activity | people | prices | capital",
  "status": "verified | estimate | sample",
  "title": "Henry Hub natural gas spot",
  "current": {
    "value": null,
    "unit": "$/MMBtu",
    "asOf": "YYYY-MM-DD",
    "sourceUrl": "https://...",
    "sourceName": "EIA",
    "retrievedAt": "YYYY-MM-DDTHH:MM:SSZ",
    "revisionNote": "First entry | Agency revised prior week | Corrected my transcription error"
  },
  "history": [
    { "value": null, "asOf": "YYYY-MM-DD", "sourceUrl": "https://...", "recordedAt": "YYYY-MM-DD",
      "supersededAt": "YYYY-MM-DD", "revisionNote": "..." }
  ],
  "connects": ["freight", "refining", "power", "permits", "loans", "rates", "project:capital.<id>"],
  "why": "One sentence on why this record is on the desk.",
  "openQuestion": "Optional. What is still unresolved."
}
```

Rules that apply to every desk:
- `history` is append-only. When `current` changes, the old `current` moves into `history` with `supersededAt`. The renderer shows the prior line struck through next to the new one. Nothing is deleted.
- `revisionNote` is required on every `current`, including the first entry ("First entry").
- `status` other than `verified` means the record is excluded from any paid output. The validator fails the build if a paid file contains one.
- `value` stays `null` until it is copied from the source. Never type a value from memory.

### 3.2 Desk-specific fields, triggers and change-log entries

| Desk | Extra fields | Update trigger | Change-log entries emitted |
|---|---|---|---|
| **Activity** | `seriesId`, `frequency`, `release` (name and URL), `nextRelease`, `direction` (up / down / flat vs prior), `seasonal` (SA / NSA) | A tracked release publishes (AAR Wednesdays, EIA weekly petroleum, Fed G.17 monthly, EIA Electric Power Monthly), or a prior value is revised | `series-release` (old → new); `revision` (prior period restated) |
| **People** | `seat`, `body` (agency, committee or board), `person`, `publicChannel` (official URL only), `action` (nominated / hearing-set / hearing-held / confirmed / resigned / appointed / board-change), `touches` (permits / loans / rates), `moved` (list of sourced actions this person took in the seat) | A nomination, hearing, vote, resignation or board change appears on an official channel (Senate or House committee page, Federal Register, agency release, SEC 8-K Item 5.02) | `seat-taken`, `seat-vacated`, `hearing-set`, `docket-opened`, `docket-closed` |
| **Prices** | `seriesId`, `frequency`, `industrialUse`, `range` (`low`, `high`, `setOn`, `reason`), `proxy` (true / false), `caveat` | A new observation from the source. The value always updates; an alert fires only when the value leaves the set range or the range is reset | `price-update` (silent, desk only); `range-break` (alert); `range-reset` |
| **Capital** | `project`, `sponsor`, `location` (state equivalent, city), `stage` (announced / permitted / FID / financed / under-construction / operating / paused / cancelled), `amount` (as stated, with quote), `financing` (LPO / grant / tax credit / private / undisclosed), `dockets`, `filings` (SEC accession numbers) | A stage change, a federal financing step (LPO conditional commitment or close), a material SEC filing (8-K Items 1.01, 7.01, 8.01), or a cancellation | `project-stage` (announced → financed, etc.); `financing-step`; `project-cancelled` |

Change-log entry shape (`changelog.json`, append-only):

```json
{ "id": "2026-10-12-prices.henry-hub", "date": "YYYY-MM-DD", "desk": "prices",
  "recordId": "prices.henry-hub", "type": "range-break",
  "before": "[OLD LINE]", "after": "[NEW LINE]", "sourceUrl": "https://...",
  "note": "One sentence.", "alert": true }
```

Entries with `alert: true` go out as the same-day note. Every entry since the last issue goes into the Monday Haul compilation.

### 3.3 Keeping SAMPLE and ESTIMATE out of paid

1. Status lives on the record, not in display text. Only `status: "verified"` passes.
2. `scripts/validate-desks.mjs` fails (exit 1) if any paid-bound record has a non-verified status, a missing `sourceUrl`, `asOf` or `revisionNote`, a non-https source, or a value with no source.
3. `scripts/build-haul.mjs` reads only validated records. It refuses to read `data.js`, `chains.js` or `data/leadership.json` (those hold prototype and ESTIMATE content).
4. Tests in `ledger.test.js`: a fixture with one `estimate` record must make the validator fail; the paid build output must contain no `SAMPLE`, `ESTIMATE` or `PROTOTYPE` strings.
5. The People desk starts empty. It does not import `data/leadership.json`. A person enters People only after you check the seat on an official page.

### 3.4 Where it lives

A static site cannot hide a file. Anything deployed to Pages can be fetched, for example `https://casswaters.github.io/long-haul-ledger/data/sources.json`. So paid data must never be in the public repo.

| Path | Repo | Contents |
|---|---|---|
| `data/desks/schema.json` | public `casswaters/long-haul-ledger` | Record schema above (JSON Schema) |
| `data/desks/prices.json` | public | Free sample: Prices desk current lines only, no history or notes |
| `data/desks/sources-v1.json` | public | Section 4 source list in machine form |
| `scripts/fetch-prices.mjs` | public | Pulls the public price series into `prices.json` |
| `data/desks/{activity,people,prices,capital}.json` | private repo, e.g. `casswaters/lhl-desks` | Full desks with history |
| `changelog.json`, `hauls/YYYY-MM-DD.md`, `corrections.md` | private | Change log, issues, corrections |
| `scripts/validate-desks.mjs`, `scripts/build-haul.mjs` | both (the private repo vendors a copy) | Validator and haul builder |

Paid readers get the hauls and desk snapshots by email, plus the newsletter tool's archive (see 5.3).

---

## 4. v1 source list

All URLs below were checked on Oct 6, 2026 (status 200 from the box unless noted). "FRED CSV" means `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<ID>`, which needs no key. The FRED API itself does need a free key, and v1 does not use it.

### 4.1 Prices strip

| Series | Primary source and ID | Units · cadence | Pull method | Status |
|---|---|---|---|---|
| Diesel, US retail on-highway | EIA "Weekly U.S. No 2 Diesel Retail Prices", `EMD_EPD2D_PTE_NUS_DPG`. Page: https://www.eia.gov/petroleum/gasdiesel/ · history: https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_NUS_DPG&f=W | $/gal · weekly, normally Monday (holiday weeks shift; the page shows the next release date) | FRED CSV mirror `GASDESW`, or the EIA XLS https://www.eia.gov/dnav/pet/hist_xls/EMD_EPD2D_PTE_NUS_DPGw.xls | Clean |
| Henry Hub spot | EIA `RNGWHHD`. https://www.eia.gov/dnav/ng/hist/rngwhhdD.htm | $/MMBtu · daily values, posted with a lag | FRED CSV mirror `DHHNGSP`, or the XLS https://www.eia.gov/dnav/ng/hist_xls/RNGWHHDd.xls | Clean. Note: the EIA Natural Gas Weekly Update page (https://www.eia.gov/naturalgas/weekly/) showed a last release date of Jan 22, 2026 when checked, so do not depend on it |
| Copper | IMF "Global price of Copper", FRED `PCOPPUSDM` | USD/metric ton · monthly average, published with about a month's lag | FRED CSV | **Partial gap.** Global monthly average, not a US exchange price. COMEX data is not a free feed |
| Uranium | IMF "Global price of Uranium", FRED `PURANUSDM`. Cross-check: Cameco month-end spot https://www.cameco.com/invest/markets/uranium-price (Cameco says it averages UxC and TradeTech). Annual context: EIA Uranium Marketing Annual Report https://www.eia.gov/uranium/marketing/ | USD/lb · monthly | FRED CSV; Cameco manual | **Gap.** No free weekly spot feed. The uranium market trades in private contracts. Check Cameco's terms before you republish its figures in paid copy; link to them instead |
| HRC steel | No free HRC price. BLS PPI hot-rolled sheet and strip (`WPU101703`, `PCU3311103311105`) has a last observation of Feb 2022 on FRED (discontinued). Proxy: PPI Steel Mill Products `WPU1017`. Secondary: `WPU101704` (hot-rolled bars, plates and structural shapes, not sheet) | Index 1982=100 · monthly | FRED CSV | **Gap.** Label the line "PPI proxy, not HRC price". The real benchmark is CME Midwest HRC futures, which have no free feed |
| Regional power | EIA Wholesale Electricity and Natural Gas Market Data (ICE), https://www.eia.gov/electricity/wholesale/ · file https://www.eia.gov/electricity/wholesale/xls/ice_electric-2026.xlsx · hub "PJM WH Real Time Peak" (PJM West). Other hubs in the 2026 file: Indiana Hub RT Peak, Mid C Peak, Nepool MH DA LMP Peak, Palo Verde Peak, SP15, NP15 | $/MWh weighted average · daily trades; EIA says the file updates biweekly. The latest trade date was Sep 29, 2026 when checked | Manual in v1 (copy one number), or parse the xlsx in a later phase | **Partial gap.** Lagged, and EIA republishes the data under an agreement with ICE: cite and link, don't redistribute the file. ERCOT North was not in the 2026 file as checked. ISO portals (PJM Data Miner, ERCOT) need registration or keys; not v1 |

### 4.2 Activity

| Source | URL · ID | Units · cadence | Pull |
|---|---|---|---|
| AAR Weekly Railroad Traffic | https://www.aar.org/data-center/rail-traffic-data/ · press posts: https://www.aar.org/aar_news/weekly-rail-traffic-data/ · site RSS: https://www.aar.org/feed/ | Carloads and intermodal units · weekly, Wednesdays at noon (ET, per AAR) | RSS to flag the release, then manual entry |
| Rail freight, monthly (BTS via FRED) | FRED `RAILFRTCARLOADSD11`, `RAILFRTINTERMODAL` | Carloads, intermodal units · monthly, lagged | FRED CSV (cross-check only) |
| EIA Weekly Petroleum Status Report | https://www.eia.gov/petroleum/supply/weekly/ · refinery utilization `WPULEUS3`: https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WPULEUS3&f=W · XLS: https://www.eia.gov/dnav/pet/hist_xls/WPULEUS3w.xls | Percent of operable capacity · weekly, normally Wednesday | Manual or XLS (no FRED mirror for this ID) |
| Fed G.17 Industrial Production and Capacity Utilization | https://www.federalreserve.gov/releases/g17/current/default.htm · RSS: https://www.federalreserve.gov/feeds/g17.xml · dates: https://www.federalreserve.gov/releases/g17/release_dates.htm · FRED `INDPRO`, `IPMAN`, `TCU`, `CUMFNS`, `IPUTIL` | Index 2017=100 (IP), percent (CU) · monthly, mid-month, with revisions | RSS trigger plus FRED CSV |
| EIA Electric Power Monthly | https://www.eia.gov/electricity/monthly/ | MWh generation by fuel · monthly, about two months' lag | Manual |
| EIA Hourly Electric Grid Monitor | https://www.eia.gov/electricity/gridmonitor/ | MWh demand · hourly data | Manual dashboard read. Bulk use is through the EIA API, which needs a free key (https://www.eia.gov/opendata/). Not v1 |
| EIA Today in Energy | https://www.eia.gov/rss/todayinenergy.xml | Articles | Already in `data/sources.json` |

### 4.3 People

| Source | URL | Cadence | Pull |
|---|---|---|---|
| Federal Register API (no key) | https://www.federalregister.gov/developers/documentation/api/v1 · e.g. FERC RSS: https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=federal-energy-regulatory-commission · NRC: same with `nuclear-regulatory-commission` | Daily, business days | RSS / JSON |
| Senate Energy and Natural Resources hearings | https://www.energy.senate.gov/hearings | As scheduled | Manual weekly check (no RSS found) |
| Senate Environment and Public Works hearings | https://www.epw.senate.gov/public/index.cfm/hearings | As scheduled | Manual (no RSS found) |
| House Energy and Commerce | RSS: https://energycommerce.house.gov/api/rss | As posted | RSS |
| Senate nominations in committee | https://www.senate.gov/legislative/nom_cmtec.htm · Executive Calendar PDF: https://www.senate.gov/legislative/LIS/executive_calendar/xcalv.pdf | Daily when in session | Manual |
| NRC | Events RSS: https://www.nrc.gov/public-involve/rss?feed=event (200). News RSS https://www.nrc.gov/public-involve/rss?feed=news returned 403 from the box (bot filter, same pattern as other feeds) | As posted | RSS with failure logging; Federal Register as fallback |
| FERC | News releases: https://www.ferc.gov/news-events/news/news-releases-headlines · events: https://www.ferc.gov/news-events/events · docket alerts: eSubscription https://ferconline.ferc.gov/eSubscription.aspx (free account, email) | As posted | Manual plus email alerts per tracked docket |
| DOE, Federal Reserve press | Already in `data/sources.json` | As posted | RSS |
| SEC 8-K Item 5.02 (officer and director changes) | Per-company Atom: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=<10-digit CIK>&type=8-K&dateb=&owner=include&count=40&output=atom` | As filed | Atom |
| Congress.gov API | https://api.congress.gov/ | n/a | **Needs a free api.data.gov key.** Optional, not v1 |

### 4.4 Capital

| Source | URL | Cadence | Pull |
|---|---|---|---|
| SEC EDGAR submissions JSON (no key) | `https://data.sec.gov/submissions/CIK##########.json` · docs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces | As filed | JSON. SEC requires a declared User-Agent and allows at most 10 requests/second |
| SEC per-company 8-K Atom | Same pattern as 4.3 | As filed | Atom |
| EDGAR full-text search | https://www.sec.gov/edgar/search/ (e.g. the phrase "final investment decision") | On demand | Manual |
| DOE Loan Programs Office | Portfolio: https://www.energy.gov/lpo/portfolio-projects · news: https://www.energy.gov/lpo/listings/lpo-news | As announced | Manual; DOE press RSS already flags many |
| USAspending API (no key) | https://api.usaspending.gov/docs/endpoints | Daily data loads | JSON, later phase; manual lookups in v1 |
| Census construction spending, manufacturing | https://www.census.gov/construction/c30/c30index.html · FRED `TLMFGCONS` | Millions of dollars, SAAR · monthly, revised | FRED CSV |
| Company IR pages | One URL per company on your watchlist, stored in `sources-v1.json` | As posted | Manual or the company's own RSS where one exists. Pick the watchlist yourself; this plan names no companies |

### 4.5 API keys

None are needed for v1. Optional later: EIA API v2 (free key), FRED API (free key), Congress.gov (free api.data.gov key), PJM Data Miner (registration). Store any key as a GitHub Actions secret, never in the repo.

---

## 5. First paid offer

### 5.1 The offer

**Name:** Long Haul Ledger: US Industrial Desk (founding edition)

**Included:**
- The Monday Haul every week: 5 to 8 sourced items across Activity, People, Prices and Capital.
- Same-day notes on material moves only: seat taken, range broken, project financed, docket opened or closed.
- The four US desks as weekly snapshots, with old values kept visible.
- The full archive from issue 1.
- Annual plan only: the quarterly bound ledger once the first quarter closes.

**Price:** **$49/month or $490/year.** Recommend leading with annual.

Why $49:
- It sits in the brief's range ($39 to $79/mo, $400 to $700/yr) and well below permit-database pricing.
- v1 has no archive depth and one editor. Pricing at the low-middle of the range is honest about that, and it leaves room to move toward $79 once the quarterly ledger and a sector book exist.
- $490/yr is ten months of the monthly price. That rewards the reader the brief targets: someone who keeps a ledger, not someone who samples a feed.
- Founding subscribers keep their price when it rises. Buttondown keeps existing subscribers on their current price by default when you change it.

No subscriber counts, revenue targets or testimonials appear on the offer page. Use the sample issue and the free Prices desk as proof of format.

### 5.2 Minimum checklist before charging

- [ ] Eight consecutive Monday Hauls written in the private repo on schedule (personal tracking phase).
- [ ] Every record in all four desks passes `validate-desks.mjs`: source URL, as-of date, revision note, `status: verified`.
- [ ] Corrections log exists and the correction process has been run end to end at least once (an agency revision counts).
- [ ] Inclusion test applied to every haul item, with the "why it belongs" sentence present.
- [ ] Prices strip shows proxy and lag caveats for uranium, copper, HRC and power.
- [ ] No SAMPLE, ESTIMATE or PROTOTYPE string in any paid output (test passes).
- [ ] Public site relabeled (section 6, Phase 0) and fiction kept out of paid views.
- [ ] Methodology page live: sources, record rules, correction policy, "not investment advice", "not real-time".
- [ ] Terms, privacy note and refund policy written and linked from checkout.
- [ ] Sample issue and free Prices desk published.
- [ ] Test purchase made and refunded (Buttondown has no Stripe test mode).
- [ ] Sales tax: run Stripe's tax registration check and decide before the first live charge.

### 5.3 Taking payment and gating on a static site

The honest constraint: GitHub Pages serves every deployed file to anyone. JavaScript "locks" or unlisted URLs are not access control. GitHub's Pages limits also say Pages is not for a site "primarily directed at facilitating commercial transactions", and it should not handle card numbers. So the Pages site stays the free atlas plus an outbound "Subscribe" link. Payment, delivery and the paid archive live with the provider.

| Option | Fixed cost | Per-payment fees | Gating | Fit |
|---|---|---|---|---|
| **A. Buttondown + its Stripe integration** (recommended) | Free up to 100 subscribers; paid subscriptions add-on +$9/mo (buttondown.com/pricing) | Stripe 2.9% + 30¢ per domestic card charge, plus Stripe Billing 0.7% on recurring charges. Buttondown's pricing page lists no revenue share | Paid-only emails and a paywalled archive on Buttondown. Real gating, server-side | Best fit: email-first, markdown, low fixed cost, Stripe-native |
| B. Stripe Payment Links + a free email tool | $0 | Same Stripe fees | None automatic. You add buyers to the list by hand, and the free tiers lack segments (Buttondown tagging is itself a +$9/mo add-on) | Works for the first few readers; manual and error-prone |
| C. Substack | $0 | 10% to Substack, plus Stripe 2.9% + 30¢ and 0.7% Billing (Substack help center) | Real gating on Substack | Zero fixed cost, but the take is high at this price point, and the brand and archive live on Substack |
| D. Ghost(Pro) Publisher | $29/mo billed yearly; paid subscriptions are not on the $18 Starter plan (ghost.org/pricing) | 0% Ghost fee, plus Stripe fees | Real member-gated pages | Upgrade path if desks need to be reopenable web pages rather than emails |
| E. Memberful Standard | $49/mo | 4.9% transaction fee, plus Stripe fees | Real gating, integrates with newsletters | Too expensive for v1 |

Fee arithmetic at the recommended price (Stripe US card plus Billing, not a projection): about $2.06 per $49 monthly charge and about $17.94 per $490 annual charge. On Substack, add $4.90 or $49.00 per charge. Buttondown's $9/mo add-on costs less than Substack's 10% once there are two or more monthly subscribers at $49.

Recommendation: start with A. Move to D only if readers need logged-in desk pages, which is the brief's "reopen the same desk" ideal. Then the desks render on Ghost and the Pages site stays the free atlas.

---

## 6. Build sequence

### Phase 0: Relabel and fence the prototype (about 1 week, estimate)

Tasks:
- `index.html`: change the sub-line "Civilization atlas · opportunity desk" toward "US industrial ledger · free atlas". Change the `SAMPLE desks` badge to `PROTOTYPE desks`, with a title saying it is fiction and not part of any subscription. Keep "World → Country → State equivalent → City".
- `app.js`: on country metrics, mind map, value chain, company desk and Openings, show a visible `PROTOTYPE · fiction` tag next to the existing SAMPLE tag. Rename "Openings" to "Prototype openings", or hide it behind the prototype label.
- `data.js`, `chains.js`: add `prototype: true` at the top level. Keep them out of anything in `scripts/build-haul.mjs`.
- `BRIEF.md`: add a pointer to the subscription brief as the governing document, and mark the civilization framing as the prototype layer.
- `ledger.test.js`: add assertions that prototype views render the PROTOTYPE tag, and keep the existing State equivalent wording tests.
- `sw.js`: bump the cache to `long-haul-ledger-v7`.

Done when: every fictional number on the site sits next to a visible PROTOTYPE label, tests pass, and the atlas and rail behave as before.

### Phase 1: Personal tracking (weeks 1 to 8)

Tasks:
- Create the private repo `casswaters/lhl-desks`. Add `data/desks/{activity,people,prices,capital}.json` (empty arrays), `changelog.json`, `hauls/`, `corrections.md`.
- Write `data/desks/schema.json` (public) and `scripts/validate-desks.mjs` (section 3.3).
- Write `data/desks/sources-v1.json` from section 4.
- Write `scripts/fetch-prices.mjs`: FRED CSV for `GASDESW`, `DHHNGSP`, `PCOPPUSDM`, `PURANUSDM`, `WPU1017`, `INDPRO`, `TCU`. It sets `retrievedAt`, never overwrites history, and appends a change-log entry when a value changes.
- Write `scripts/build-haul.mjs`: it builds the section 2.2 skeleton from change-log entries since the last issue, then you write the "why it belongs" lines.
- Set price ranges (`range.low/high/setOn/reason`) from your own judgment and record why. No range is invented without a written reason.
- Every Monday, write the haul in `hauls/`.

Done when: 8 consecutive hauls exist, the validator passes on every commit, at least one revision has gone through the correction path, and the People desk has only seats checked on official pages.

### Phase 2: Public sample desk (weeks 7 to 9, overlapping)

Tasks:
- Public repo: add `data/desks/prices.json` (current lines only). Add `.github/workflows/prices.yml` (daily cron, runs `fetch-prices.mjs --public`, commits if changed). Or add a step to `soft-launch.yml`, keeping its existing 6-hour RSS refresh.
- `app.js` and `styles.css`: add a "Prices desk (sample)" panel opened from the US desk. Each row shows series, value, unit, as-of, source link, industrial use and caveat. Below it, a short "In the paid desk" list of what is locked (history, range breaks, notes) with no counts.
- Add a methodology page (`methodology.html` or a section): sources, record rules, correction policy, disclaimers.
- Publish one past haul as `sample-haul.html`.
- `sw.js`: add the new files to `ASSETS` and bump the cache.
- Tests: the sample desk renders only `status: verified` rows, and every row has a source URL and an as-of date.

Done when: the sample desk is live with real as-of dates and source links, caveats are visible on proxy rows, and the atlas and rail are unchanged.

### Phase 3: Paid launch (weeks 9 to 10)

Tasks:
- Set up Buttondown: custom sender, paid subscriptions add-on, Stripe connected, $49/mo and $490/yr plans, premium welcome email.
- Site: add a "Subscribe" link in the header and on the sample desk, pointing to the Buttondown buy URL. No payment code on Pages.
- Publish terms, privacy and refund policy.
- Clear the section 5.2 checklist. Make a live test purchase and refund it.
- Send issue 1 to paid readers. Post the archive on Buttondown as paid-only.

Done when: every box in 5.2 is checked and dated, the first paid issue has gone out, and no paid content exists in the public repo or on Pages.

### Phase 4: After launch (not scheduled)

- Quarterly bound ledger: what was true, what was revised, what is unresolved. Delivered to annual subscribers as a PDF through the email tool.
- First sector book add-on: pick one of fuels and midstream, power and grid, nuclear and fuel cycle, heavy manufacturing.
- Optional: USAspending and EDGAR JSON automation, an xlsx parser for power, and a move to Ghost if desks need logged-in pages.

---

## 7. Weekly operating cadence (one person; all times are estimates)

| When | Task | Est. time |
|---|---|---|
| Daily, weekdays | Scan rail, Federal Register RSS, House E&C RSS, NRC, FERC, SEC Atom; log candidate records | 15 min x 5 = about 1.25 h |
| Monday morning (MT) | Run `fetch-prices.mjs`, confirm the week's desk entries, check ranges, write and send the Monday Haul | about 2 to 2.5 h |
| Wednesday afternoon | AAR weekly traffic and EIA weekly petroleum into the Activity desk | about 30 min |
| Thursday or Friday | Committee hearing pages, Senate nominations, DOE LPO, IR pages for the watchlist | about 1 h |
| Mid-month (G.17 day) | Industrial production and capacity utilization, plus revisions | about 30 min per month |
| As needed | Same-day note on a material move (`alert: true` only) | 0 to 1 h |
| Weekly | Validator run, corrections log, commit to the private repo | about 15 min |
| **Weekly total** | | **about 5.5 to 7 h (estimate)** |
| Quarterly | Bound ledger | about 6 to 8 h per quarter (estimate) |

Rule of thumb: if a week runs over budget, cut haul items toward 5. Never cut sources, as-of dates or the correction log.
