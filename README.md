# Long Haul Ledger

**10,000 Year Empire** — civilization news + map + opportunity desk.

Soft launch: **US Progress** rail from free public RSS (GitHub Actions). Country desks SAMPLE. Leadership accordion + map drill-down (US states, India states, UAE emirates, Japan regions).

Live: https://casswaters.github.io/long-haul-ledger/

> **URL rename:** formerly `longview-ledger`. Old Pages URL redirects via stub repo `casswaters/longview-ledger` → use the live URL above.

See [BRIEF.md](./BRIEF.md) for product context.

```bash
npx serve .          # static server
npm test             # data + normalize/score + nav helpers
npm run fetch        # refresh data/signals-live.json from public RSS
```

Map paths: Natural Earth via VectorAtlas (CC BY 4.0). No paid APIs.
