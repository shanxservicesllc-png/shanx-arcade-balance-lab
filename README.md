# Arcade Balance Lab

**An original, zero-dependency, offline-first memory-puzzle design and balance lab.**

Designed for small game designers who want a reproducible layout, a conservative simulated difficulty signal, and an immediately playable export. Built from scratch for the ShanX / Build With AI: Basics proof-of-concept workstream, October 2026. This does **not** incorporate existing ShanX Arcade game code, character artwork, private data, or paid APIs.

## Play in 15 seconds

1. Unzip this project. Open `index.html` in any modern desktop browser; internet is unnecessary.
2. Choose **12, 16, 20, or 30 tiles**, adjust **Pairs** and **Hints**, and type a seed.
3. Click **Generate & analyze**. Play the live matching board and read the 32-trial balance report.
4. Click **Verify same-seed replay** to rebuild and reanalyze the current recipe independently.
5. Choose **Export playable .html** or **Export JSON + report**. Open the downloaded HTML offline and play it. The HTML is a single self-contained file.

### No install is required to run the app

Everything needed for the main UI is included locally. The standalone exported puzzle embeds its own CSS, JavaScript, configuration, and report. Nothing phones home. No login or account creation. No tracking or advertising.

## Sample reference

* 4 × 4 grid, 8 pairs, 2 hints, seed `SXS-0426`
* Layout fingerprint: `A717EAEF`
* Baseline estimate: 12.28 moves and 4.28 misses averaged across 32 seeded bot trials
* Assisted estimate: 11.16 moves across the same 32 deterministic search orders

These metrics are **estimates for the specified perfect-recall simulator only**, not measured difficulty for children, people, or any other audience. The challenge label is based only on baseline misses per pair, with threshold `<0.35` Gentle, `<0.85` Balanced, otherwise Tricky. It is not a certification of fairness.

### Rules

* Every included symbol occurs exactly twice; unused grid cells are disabled.
* Flip two cards. A match stays visible. A miss closes after 850 ms.
* Each two-card attempt costs one move. Each mismatch adds one miss.
* Hint completes one unmatched pair immediately, at a cost of one move and one hint. Hint can also reset a partially selected single card.
* All pairs matched means a win. **Restart** resets the play session without changing the layout.
* Input is bounded to 2–5 rows, 2–6 columns, at most 30 total cells, 2–15 pairs, 0–pairs hints, and a 1–64 character nonblank seed. The UI offers common board presets. Invalid input leaves the last good board intact.

## Determinism and simulator assumptions

`src/engine.js` uses a fixed 32-bit FNV-style seed hash and Mulberry32 pseudorandom generator to shuffle the selected pairs and unused cells. The same exact configuration always yields the same layout and fingerprint on compatible JavaScript engines. This is **not a cryptographic RNG**.

To estimate difficulty the simulated player uses a seeded order of exploration. It has perfect recall of all seen cards, completes known matches first, and otherwise opens unseen cards. In an assisted run, the player first spends the configured hint budget to auto-complete pairs. A fixed set of 32 seeded search orders is used for both baseline and assisted runs. The number of moves saved is an average comparison, not a guarantee that every person will be helped.

Each report contains the original configuration, actual indexed card layout (`null` marks inactive cells), deterministic fingerprint, solvability reason, simulation assumptions and mean/min/max metrics. `examples/` holds an exact sample report and independently playable sample HTML.

## Test and inspect

Requires **Node.js 18+** only for the automated engine tests (not for playing):

```sh
node --test tests/engine.test.cjs
```

Optional browser E2E tests, for an environment already equipped with Python Playwright and Chromium at `/usr/bin/chromium`:

```sh
python tests/browser_e2e.py
```

In this build environment, Chromium policy blocks `file://` navigation and OS-level download events. The browser test therefore inlines the local source into a page, intercepts the export click **after the real Blob is created**, and independently renders the exported HTML Blob while offline. That approach tested user interactions and exported artifact behavior, but **a double-click test of the extracted ZIP's physical HTML file remains unverified** and is listed as a manual acceptance step.

Actual results are in `evidence/node_test_output.txt` and `evidence/browser_results.json`, with desktop/mobile browser screenshots and exact exported content. Read `ACCEPTANCE_REPORT.md` for detailed qualifications.

## Project structure

```
index.html                  Full local lab interface
src/style.css              Responsive visuals
src/engine.js              Deterministic generator, simulator and report
src/export.js              Generates a self-contained playable export
src/app.js                 Live UI, game interactions and downloads
tests/engine.test.cjs       Automated engine tests (Node built-in test runner)
tests/browser_e2e.py       Browser interactions and export verification
examples/                  Canonical generated playable HTML and JSON report
evidence/                  Actual test output, screenshots and tested export blobs
devpost/                   Clearly labeled DRAFT product-planning documents
docs/                      Demo plan, constraints, eligibility notes and QA matrix
SHA256SUMS.txt             SHA256 digests for all other included files
```

## Hackathon and ownership status

**Development authorized. Owner approval of scope, PRD, spec, public release, license and submission not recorded.** The required official Devpost Learn `1-start` through `6-ship` agent skill pack was **not executed** by this worker, and eligibility must not be claimed from this ZIP alone. See `docs/SKILL_PACK_STATUS.md`. This project is a demonstration draft for the contest coordinator, not evidence of public submission or acceptance. The owner must write the actual Devpost submission wording and exit survey responses personally, as the official curriculum requires.

**License:** `LICENSE_DRAFT.txt` is a proposal only. No public open-source license has been approved; `package.json` intentionally says `UNLICENSED`. Nothing was published.
