# Scope | Arcade Balance Lab

**status: draft / owner product approval not yet recorded**  
**source:** X's October 23, 2026 execution handoff #12 and technical implementations in this ChatGPT sandbox.  
**skill generated:** NO. Written manually from the handoff as a candidate; the official `2-scope` skill has not been executed.

## Target user and problem

A small game designer prototyping a card-matching game wants to know whether chosen pair/hint settings produce a coherent playable board. Pure visual inspection cannot confirm whether a layout is reproducible or measure any play assumptions. The first loop must make a seed repeatable, explain deterministic model estimates, and produce a portable real game.

## Core useful kernel

Given valid board dimensions, active pair count, hint budget and seed, generate a deterministic matching layout, verify all active values occur in pairs, run a documented memory-bot simulation, and export the same playable puzzle as independent HTML or a JSON layout/report.

## In scope (candidate decisions from handoff)

- Local browser UI, no backend, no cookies or accounts.
- 12/16-tile game lineage retained as a **new implementation**, with bounded 20/30-tile variants.
- Config validation; replay fingerprint; explicit solvability rule.
- 32 repeatable trial orders under a perfect-recall bot; baseline and assisted metrics; challenge bands labeled as model estimates.
- Interactive pair matching, miss tracking, hint-assisted pair completion, restart, and two export formats.
- Node tests, browser interaction evidence, acceptance report, and reproducible package.

## Hard stops

No gambling, ads, payments, public leaderboard, child profiles, live user tracking, cloud AI calls, old Arcade source, protected character assets, external dependencies, or remote machine access. No public publishing without explicit authorization.

## Definition of DONE (implementation gate)

A newly extracted directory exposes a browser-playable 12/16-tile example, produces two identical layouts for identical inputs, rejects invalid pair counts safely, runs valid deterministic metrics and produces a playable single-file HTML export and JSON report. Tests must actually execute, and limitations must be logged.

## Explicit open decisions / questions for owner review

- Approve memory matching as the contest kernel and the defined one-click hint auto-match rule?
- Approve the 32-trial perfect-memory benchmark, challenge-band labels and visual presentation?
- Approve an open-source license for a public repo and proceed through the official skill flow?

These questions do not block authorized sandbox coding, but no `approved` status is asserted here.
