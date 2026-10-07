# Ledger research runs — adding curated feed entries

Hand-verified items and verification-tier corrections live in `data/signals-curated.json`.
`scripts/fetch-signals.mjs` merges that file into `data/signals-live.json` on every 6-hour rebuild,
and any push to `main` that changes it triggers an immediate rebuild + deploy.
This file stays on `main` only (excluded from the Pages site).

1. Only edit `data/signals-curated.json`. Never edit `data/signals-live.json` directly.
2. Never invent anything. Every URL must be a real https page you opened and that returned HTTP 200,
   and it must actually state the claim. Use the publish date shown on the page.
3. To add a story the feed is missing, append an entry to `add[]` with:
   - `id` as `cur-<short-kebab-slug>` (unique; pattern `^cur-[a-z0-9-]{3,60}$`);
   - `title` (≤240 chars), a canonical `url` (prefer the primary source) and `source`;
   - `published` (when the story was published) and `addedAt` (now), both ISO-8601 UTC;
   - `country` and a 1–2 sentence factual `blurb`;
   - `status`, `sources[]` (each `{ "name", "url", "primary", "published" }`), and a `note` saying why;
   - in `aliases[]`, the URL of any feed copy of the same story, so it is replaced rather than duplicated.
4. To correct the tier of a story already in the feed, append an entry to `overrides[]`.
   Match by the item's exact `url` (`"match": { "url": "…" }`), or by its `id` from
   `data/signals-live.json` (`"match": { "id": "live-…" }`). Include `status`, `sources[]`
   (required for confirmed or multiple), `note` and `addedAt`.
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
   `curated: override <id> → confirmed`, and push to `main`. The push starts a rebuild. About 5–6 minutes
   after the run, confirm the item shows the right `verification.status` in the live `data/signals-live.json`.

## Example entry

See the seed entry `cur-anduril-arsenal-2` in `data/signals-curated.json`.
