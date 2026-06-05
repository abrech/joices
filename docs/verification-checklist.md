# Per-PR verification checklist

Run before merging any refactor PR:

```bash
npm run build
npm test
npm run autoplay -- --runs 100 --policy greedy --seed 42 --no-replay-verify
```

## Reference KPI (baseline)

- Batch: `logs/autoplay/2026-06-05T08-46-33-184Z/summary.json`
- Win rate: **10–25%** (baseline 25%)
- Stuck runs: **0**

## PR-type extras

| PR type | Extra |
|---------|-------|
| Structural | `npm run autoplay -- --runs 20 --policy greedy --seed 42` with replay verify (default) |
| Behavior-changing | Bump `RUN_LOG_VERSION`; re-check KPI band |
| Display-only | Build + smoke floor choice / glossary |
