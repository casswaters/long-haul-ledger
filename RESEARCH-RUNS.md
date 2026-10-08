# Ledger research runs — adding curated feed entries

Hand-verified items and verification-tier corrections live in `data/signals-curated.json`.
`scripts/fetch-signals.mjs` merges that file into `data/signals-live.json` on every 6-hour rebuild,
and any push to `main` that changes it triggers an immediate rebuild + deploy.
This file stays on `main` only (excluded from the Pages site).

**Pushing safely (read first).** Several things push to `main` during the day: the feed and stats bots
every few hours, and build sessions that ship releases (they also edit `ROADMAP.md`). Always push with
`scripts/push-main.sh` instead of a bare `git push`: it fetches, rebases your commits onto the newest
`origin/main`, pushes, and retries up to 5 times if someone pushed first. `ROADMAP.md` and this file use
git's union merge (`.gitattributes`), so two runs editing the same lines (the Last updated line, the
Shipped log) keep both versions instead of stopping the rebase; tidy any duplicate line in your next edit.
If the script still exits with a conflict it lists the files; fix them by hand and rerun it.
Work in your own clone, never in another session's working copy.

1. Only edit `data/signals-curated.json`. Never edit `data/signals-live.json` directly.
2. Never invent anything. Every URL must be a real https page you opened and that returned HTTP 200,
   and it must actually state the claim. Use the publish date shown on the page.
3. To add a story the feed is missing, append an entry to `add[]` with:
   - `id` as `cur-<short-kebab-slug>` (unique; pattern `^cur-[a-z0-9-]{3,60}$`);
   - `title` (≤240 chars), a canonical `url` (prefer the primary source) and `source`;
   - `published` (when the story was published) and `addedAt` (now), both ISO-8601 UTC;
   - `country` and a 1–2 sentence factual `blurb`;
   - optionally `location` (see step 4a) so the story shows at the right map level;
   - `status`, `sources[]` (each `{ "name", "url", "primary", "published" }`), and a `note` saying why;
   - in `aliases[]`, the URL of any feed copy of the same story, so it is replaced rather than duplicated.
4. To correct the tier of a story already in the feed, append an entry to `overrides[]`.
   Match by the item's exact `url` (`"match": { "url": "…" }`), or by its `id` from
   `data/signals-live.json` (`"match": { "id": "live-…" }`). Include `status`, `sources[]`
   (required for confirmed or multiple), `note` and `addedAt`.
4a. Location (optional, on `add[]` or `overrides[]`): the news column follows the selected map place
   (World › Country › State equivalent › City). The pipeline tags stories automatically (`locate.js`);
   set `location` only to add a place the tagger missed or to correct a wrong tag:
   `"location": { "countries": ["us"], "admin1": ["us-md"], "cities": ["us-city-baltimore"] }`.
   - Ids are lowercase map ids: countries are ISO alpha-2 (`world.svg` path ids); state equivalents and
     cities are the `id` values in `data/geo/admin1.geojson` and `data/geo/cities.geojson`.
   - Every state-equivalent or city id needs its country in `countries`. Use `"countries": []` for a
     world-level story (shows only in the World view and as "More worldwide").
   - A location-only override may omit `status`; the story keeps its current tier.
   Example override: `{ "match": { "url": "…" }, "location": { "countries": ["ca"], "admin1": ["ca-ab"] }, "note": "Alberta, not Australia", "addedAt": "…" }`.
5. Choosing the tier:
   - **confirmed:** the subject itself (company, agency, government office) published it. Mark that source `"primary": true`.
   - **multiple:** 2 or more independent outlets report it, and none of them is the subject.
   - **unconfirmed:** a single non-primary report.
   - **analysis:** opinion, commentary or an explainer.
   - For wire stories carried by another outlet, name both, e.g. "Reuters (via Military Times)".
6. Expiry: entries drop automatically after 30 days (`maxAgeDays`, from `published`, or `addedAt` for overrides).
   Set `expires` (ISO-8601) only for something shorter-lived. Don't delete entries by hand unless they are wrong.
7. Run `npm run curated:check` and `npm test`. Both must pass.
8. Commit only `data/signals-curated.json`, with a message like `curated: add <slug>` or
   `curated: override <id> → confirmed` (or `curated: location <id> → ca-ab`), and push to `main`. The push starts a rebuild. About 5–6 minutes
   after the run, confirm the item shows the right `verification.status` in the live `data/signals-live.json`.

## Example entry

See the seed entry `cur-anduril-arsenal-2` in `data/signals-curated.json`.

## Energy briefs ("Top 4 this week")

The Energy tab shows one brief per place and energy source. Briefs live in `data/energy-briefs.json`
(served to the site; this file and the candidates cache stay off Pages). Any push that changes
`data/energy-briefs.json` triggers a rebuild and deploy within minutes.

1. Pick the place and source. Place ids: `world`, a country (`us`), a state equivalent (`us-oh`) or a city
   (`us-city-houston`), the same ids as the map. Sources, in this order: `nuclear`, `oil`, `gas`, `coal`,
   `wind`, `solar`, `hydro`, `geothermal`, `emerging`.
2. Get the candidates: `node scripts/build-energy-brief.mjs --place <placeId> --source <source>`.
   It prints the tagged stories for that slot (newest and best verified first) plus the writing rules.
   The 6-hourly build also writes every slot to `data/news-cache/energy-candidates.json`.
   Candidates are leads, not sources: open each story and its primary source before using it.
3. Write the brief into `data/energy-briefs.json` under `briefs[placeId][source]`:
   ```json
   {
     "generated_at": "2026-10-07T23:10:00Z",
     "week_of": "2026-10-01",
     "checked": "Every number, date and @handle was checked against the linked sources on Oct 7, 2026.",
     "items": [
       { "text": "Plain-language paragraph…", "sources": [
         { "title": "Headline (Outlet)", "url": "https://…", "date": "2026-10-06", "primary": true }
       ] }
     ]
   }
   ```
   - 1 to 4 items, one item per numbered story. The site numbers them and writes the heading
     "The 4 most important things happening in {source} this week".
   - Plain language a non-specialist can follow: explain jargon in the sentence (for example
     "an uprate means squeezing more power out of a machine that already runs"). Units on every number.
   - No em dashes and no tildes anywhere in the text or titles (the validator rejects them).
   - Every item needs at least one source with `title`, an https `url` and a `date` as YYYY-MM-DD.
     An item without sources is rejected. Mark the subject's own page (company, agency, government
     office) `"primary": true`.
   - Only primary sources or reputable outlets count: the agency or company itself, official records
     (agency sites, the Federal Register, regulator dockets), and established newsrooms or trade
     press (for example World Nuclear News, ANS Nuclear Newswire, Utility Dive, Reuters). Not
     aggregators, press-release reposting sites, classifieds or public-notice pages, forums or
     social posts. Every URL must be a page you opened (HTTP 200) that states the claim.
4. Check every number, date and @handle against the linked sources. If a claim cannot be sourced,
   cut it or rewrite it to what the sources say. Check handles with the X connector
   (`get_users_by_usernames`) and write them as plain text (for example `@NRCgov`); only use a handle
   that is the organization's own account.
5. Never add a social sign-off or call to action ("share what you've heard", "tell me in the comments",
   etc.). No pricing, sign-up or promotional copy. (One exception: the footer of the Monday Haul email; see "Monday Haul" below.)
6. World briefs should prefer genuinely global or non-US stories when the feed has them (for example
   Poland's nuclear timeline, the Swiss reactor vote, Russia's BREST-OD-300, China's Hualong One), so
   World is not a copy of the United States brief. A big US story can still make World if it matters globally.
7. Run `node scripts/build-energy-brief.mjs --validate` and `npm test` before committing. Both must pass.
8. Commit only `data/energy-briefs.json`, with a message like `briefs: us nuclear week of 2026-10-05`,
   and push with `scripts/push-main.sh` (it rebases onto the newest `main`; the feed bot commits often). About 5 minutes after
   the run, confirm the brief shows on the live site (for example `#c=us&energy/nuclear/brief`).
9. Refresh each brief within 7 days. Briefs older than 7 days show a stale flag on the site.
10. Work order: World and the United States for all 9 sources first, then major countries (China, India,
    Japan, Germany, the United Kingdom, France, Canada, Brazil, Saudi Arabia, Australia, South Korea).
    Where no brief exists the site says "not ready yet" and shows the top stories; never fill a slot with
    an unsourced brief.

## Sector briefs (Raw materials, Manufacturing, Services, Technology, Policy)

The five sector tabs use the same "Top 4 this week" schema, rules and validator as the Energy briefs above.
Write them after the Energy briefs in each run. Nothing is seeded: until a brief exists, a slot says
"not ready yet" and shows the top stories.

| Tab | Official reference | File | Segment ids, in order |
| --- | --- | --- | --- |
| Raw materials | Primary sector | `data/materials-briefs.json` | `crops`, `livestock`, `forestry`, `fishing`, `oilgas`, `mining` |
| Manufacturing | Secondary sector | `data/manufacturing-briefs.json` | `food`, `chemicals`, `metals`, `machinery`, `vehicles`, `goods`, `construction`, `power` |
| Services | Tertiary sector | `data/services-briefs.json` | `retail`, `finance`, `property`, `health`, `education`, `hospitality`, `transport`, `utilities` |
| Technology | Quaternary sector | `data/technology-briefs.json` | `software`, `cloud`, `telecom`, `research`, `consulting`, `media`, `cyber` |
| Policy | Quinary sector | `data/policy-briefs.json` | `government`, `econpolicy`, `regulation`, `international`, `corporate`, `universities`, `nonprofits` |

1. Get candidates: `node scripts/build-energy-brief.mjs --sector <tab> --place <placeId> --source <segment>`
   (for example `--sector services --place us --source health`). The 6-hourly build writes every slot to
   `data/news-cache/<tab>-candidates.json`. Candidates are leads, not sources.
2. Write the brief into `data/<tab>-briefs.json` under `briefs[placeId][segment]`, same shape as the Energy
   example: `generated_at`, `week_of`, `checked`, and 1 to 4 `items`, each with sources (`title`, https `url`,
   `date` as YYYY-MM-DD). The site writes the heading "The 4 most important things happening in {segment} this week".
3. Same rules as Energy: plain language, units on every number, no em dashes or tildes, primary sources or
   reputable outlets only, every URL opened and stating the claim, handles checked and written as text,
   no social sign-off, no pricing or promotional copy.
4. Cross-listed Energy stories (marked "From Energy" on the site, for example a refinery story under
   Manufacturing, Power plants and refineries) can be used, but do not copy the Energy brief: write for the segment.
5. Work order: World and the United States first, for every segment of all five tabs, then the major
   countries listed above. World briefs should prefer global or non-US stories when the feed has them.
6. Run `node scripts/build-energy-brief.mjs --validate` (checks all six tabs) and `npm test`. Both must pass.
7. Commit only the briefs files you changed, with a message like `briefs: us health (services) week of 2026-10-05`,
   push with `scripts/push-main.sh`. A push that changes any briefs file deploys within minutes; confirm it
   live (for example `#c=us&services/health/brief`). Refresh within 7 days; older briefs show a stale flag.

## Monday Haul (weekly free email draft)

The Monday Haul is the free weekly email (Buttondown `longhaulledger`, email-only sign-up, double opt-in).
The research run on Mondays at 7:46 AM MT drafts it. **The run drafts only: never send email, never call the
Buttondown API, never post the issue anywhere.** Cassidy sends it from Buttondown. Format approved by Cassidy on
Oct 8, 2026: `hauls/TEMPLATE.md`, with the approved sample in `hauls/EXAMPLE-2026-10-05.md`. BUILD-PLAN.md
section 2 (the desk template) is the paid edition, deferred, and does not apply here.

1. `git pull --rebase`. Copy `hauls/TEMPLATE.md` to `hauls/YYYY-MM-DD.md`, named for that Monday. Set the
   "Week of" line to the Monday of the week just covered (the past 7 days).
2. Pick 6 to 8 items from the past 7 days: about 5 under `## Energy` and about 3 under `## Across the economy`.
   - Energy: from the briefs in `data/energy-briefs.json` (refresh any that are stale first). World stories
     first, then the United States. Spread across sources (oil, gas, nuclear, wind, solar, ...); one item per story.
   - Across the economy: from the sector briefs (`data/{tab}-briefs.json`) and confirmed entries in
     `data/signals-curated.json`. While a tab has no brief, an item may come from the news column only if you
     open the story and its primary source and check every claim, the same as for a brief. Start each headline
     with the tab name ("Manufacturing: ...").
   - Prefer what a non-specialist would most want to know: big money, big output changes, prices people pay,
     jobs, and decisions with a date.
3. Write each item as in the template: a bold numbered headline (one plain sentence), then two or three short
   sentences, then a `Source:` or `Sources:` line. Explain jargon in the sentence. Units on every number. Copy
   numbers from the source, never from memory.
4. Sources: only real, dated, primary or reputable sources (the same list as the briefs: the company or agency
   itself, official records, established newsrooms and trade press; no aggregators, reposting sites, classifieds,
   forums or social posts). Every link is followed by its publish date, e.g. `[EIA](https://...) (Oct 6)`. If an
   item has no real source, cut it. Never pad to reach 6 items with weak ones; if the week has fewer than 6 good
   items, write what you have and say so in the run report.
5. No em dashes and no tildes. No calls to action, sign-offs or promotion in the items.
6. Footer exception to rule 5 (email only): below the `---` line, keep the template footer as is: the link back
   to the site, the "values may be revised" line, and the unsubscribe line with Buttondown's
   `{{ unsubscribe_url }}`. Nothing else promotional, and none of this goes on the site or into briefs.
7. Check it: `npm run haul:check -- hauls/YYYY-MM-DD.md --links --html`. It must report 0 errors. It checks the
   structure (6 to 8 items, both sections, a source line with dated https links on every item, no placeholders,
   no em dashes or tildes, no promotional copy above the footer) and that every source link returns HTTP 200,
   then writes `hauls/YYYY-MM-DD.html` (simple inline-styled HTML for Buttondown). If a link fails, open it by
   hand; if it really fails, replace the source or cut the item.
8. Commit only `hauls/YYYY-MM-DD.md` and `.html` with a message like `haul: draft for 2026-10-12`, and push to
   `main`. The `hauls/` folder is excluded from Pages, so nothing goes live. In the run report, give the file path
   and the item headlines so Cassidy can review and send.
9. Do not touch `data/monday-haul/issues.json`, `archive.html` or the `archive` flag in `signup.js`. The archive
   stays off until Cassidy turns it on after the first issue is sent.

