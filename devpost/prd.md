# Product Requirements | Arcade Balance Lab

**status: draft / awaiting owner review**  
**skill generated:** NO. This PRD is manually derived from X's handoff and implemented interface, not a fabricated record of official skill interviews.

## Promise

"Make it fun. Make it fair." A tiny designer's lab that turns game balance from a vibe into an inspectable, repeatable test and a playable offline artifact.

## Personas and jobs

**Solo game designer:** wants to compare two memory layouts or hint counts without an engineering environment. **Reviewer:** wants to see a real exported game and understand what the score does and does not mean. Neither needs an account, server, or AI API subscription.

## Screen design

One self-contained responsive desktop page with three main panels: **Puzzle DNA**, **Live board**, and **Balance report**. The interface uses dark ink/navy surfaces with warm mint accents, readable metric tiles, clear inline errors, a large playable board, and persistent export options. On narrow screens the same panels stack vertically and the board scales to device width. All clickable game cards are native buttons with accessible labels.

### Required inputs

- Board size: 3x4, 4x4, 4x5, or 5x6 visible presets. Engine has stricter general grid bounds and can handle valid dimensions within them.
- Pair count: integer 2 through the grid's half-card count; unused slots show non-interactive blanks.
- Hint count: integer 0 through pairs.
- Seed: 1–64 visible characters, nonblank, no control characters.
- Generate & analyze action. A new-seed control may generate a one-time label.

### Output and interactions

- On valid submit: immediately update board, 8-character layout fingerprint, solvability display and metrics; reset current play state.
- On invalid submit: show an actionable error; keep the previous valid puzzle intact.
- Tile flip: reveal symbols. Matching pair remains exposed and counts a move. Missed pair counts a move and a miss and closes after 850 ms. Ignore extra taps during a miss animation.
- Hint: solves one unmatched pair, charges one move and one hint. A one-card partial flip is reset before using hint.
- Restart: preserves layout/seed; resets moves, misses, matched count and available hints.
- Verify replay: independently rebuild/analyze the current configuration and show a PASS/FAIL note comparing layout, fingerprint and results.
- Export: a single offline playable `.html` plus optional `.json` capturing exact layout, assumptions and scores.

## Success tests

- Same recipe yields byte-identical layout and hash on re-run.
- Illegal pairs such as 9 pairs in a 4x4 grid reject with a safe error, and never replace the valid puzzle.
- A complete playable HTML export contains no network resources and supports matching, hint and restart offline.
- Mobile UI does not overflow a 390 px viewport.
- The summary clearly says the difficulty score is a **simulation**, not a measured human result.

## Accessibility and privacy expectations

Semantic headings, labeled buttons/inputs, native keyboard interaction, screen-reader accessible live status and error regions, visible focus, high-contrast status text, and reduced-motion support. No analytics, ads, auth, payment, identifiers, or storage.

## Now / Later boundary

**Now:** one matching-game kernel, deterministic seeded simulation, exports, UI and tests. **Later:** accessibility field studies, timed memory experiments, adjustable strategies, difficulty learning from playtest volunteers, printable challenges, teacher dashboards, user profiles, leaderboards, monetization. Not part of this proof of concept.

## Owner review open

Product name, exact hints behavior, grade of challenge labels, and choice of public license are candidates from the authorized work, not recorded signed-off decisions.
