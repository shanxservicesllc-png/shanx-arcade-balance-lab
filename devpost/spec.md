# Technical Specification | Arcade Balance Lab

**status: draft / owner sign-off not recorded**  
**skill generated:** NO. Manual implementation spec; official `4-spec` skill execution unverified.

## Architecture and runtime

- Target: desktop and mobile modern browsers, no server and no browser extension.
- Dependencies: no runtime packages, no external scripts or fonts; `index.html` loads local JS/CSS. Node.js built-in test runner covers core logic.
- Main layout: `index.html` + `src/style.css`; board/UI logic: `src/app.js`.
- Core pure APIs: `src/engine.js` provides `validate`, `build`, `analyze`, `simulateOne`, `report`. UMD-style exports work in browser and Node.
- Portable export: `src/export.js` constructs a fully standalone HTML string that embeds the exact report and a small self-contained game runtime. The runtime implements the same two-card matching and assisted-pair rule.

## Data contract

```js
config = { rows: 4, cols: 4, pairs: 8, hints: 2, seed: 'SXS-0426' }
puzzle = { version: '1.0', config, layout: [/* int ids or null */], fingerprint: 'A717EAEF' }
report = { schema: 'arcade-balance-lab/report-v1', generatedBy: 'Arcade Balance Lab 1.0', puzzle, analysis }
```

Each symbol ID from `0..pairs-1` must occur exactly twice. `null` entries designate unused disabled cells. A seed alone does not fully describe the layout: rows, columns and pairs are also required. Hints affect fingerprint and analysis but not physical layout for a fixed seed/dimensions/pairs.

## Seed and metrics

- Seed hash: 32-bit FNV-inspired multiplication applied to Unicode code-point fragments, deterministic across JS runtimes.
- Shuffle: Mulberry32 seeded Fisher–Yates on the symbol-id pairs plus nulls.
- Fingerprint: 8 hex chars of the full validated config and layout, meant for easy human comparison, not a cryptographic content hash.
- Solvability is structural: every active value has exactly two slots, so full completion is guaranteed under rules.
- 32 bot trials (configurable via API within 1–200): seeded per-trial random search-order permutation with perfect recall. Knows only observed cards, selects available known pairs first, else explores unseen cards.
- Assisted model uses the same seed-derived order and consumes configured hints at the start; each hint auto-matches one full pair in one move. Baseline runs use zero hints.
- Metrics: mean misses and moves, minimum/maximum moves, mean moves saved, misses-per-pair ratio, and descriptive challenge band. Negative/fractional scores do not arise from this model, but 'moves saved' may be zero and does not imply improvement for all humans.
- Limits: max 30 cells / 15 distinct face symbols; grid rows 2–5; cols 2–6; min 2 pairs; hints 0..pairs; seed len 1–64 and no control characters. Integer validation is strict.

## Error cases

Errors throw from pure engine. UI catches them, displays inline actionable error, and retains last good state. Simulation checks consistency by rebuilding the layout from the config and comparing arrays; corrupted layouts are rejected. Simulation bounds protect against loops. Export rejects absent report objects.

## XSS and network isolation

The UI puts seed text into `textContent`, never `innerHTML`. JSON in the HTML export script data is escaped for angle brackets, ampersands and JS separator characters. The only export action is a user-triggered Blob download. Generated HTML contains no external URLs or asset requests. No user secrets or person-level data are collected.

## Verification plan

Node tests: exact replay, different seed, pairing invariant, invalid bounds, corrupt layout, seeded estimate stability, zero/all-hints behavior, 90 stress variants, HTML self-containment and script injection escaping. Chromium browser tests: UI, reset/match/hints, invalid pair handling, 12-tile blanks, deterministic verify action, exported HTML play and JSON structure, no network requests/JS errors, mobile overflow. Observed sandbox Chromium blocks direct navigation and downloads, so see `ACCEPTANCE_REPORT.md` for proxying tests without overclaiming.

## Technical trade-offs

- No dynamic external library = easier inspection, no build step, and proper offline export.
- Duplicated small standalone gameplay loop is kept independent from the lab bundle so exported HTML needs no external asset. Exact behavior is checked by browser tests.
- Simulated averages depend on the bot and rule choices, not proof of age fairness. No observed human metrics are claimed.
- 32-bit deterministic RNG is for games and reproducibility only; not secure randomization.

## Open owner decisions

Approve concept and metrics; approve the public license and demo/repository details; execute official Devpost Learn skills through a compatible coding agent if eligibility is required.
