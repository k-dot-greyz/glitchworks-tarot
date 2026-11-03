# Approval Queue MVP — Portable Decision Core

Extracted pure logic from the merged PR decision surface prototype (glitchworks-tarot #44) so it can be tested independently of the full React spread, wired into a second-brain web shell, or later ported to Rust.

## What this is

A small, dependency-free module that turns a GitHub-style PR payload (+ checks, reviews, stack) into:

- flags (block / warn / info) with human reasons
- a verdict: `NO-MERGE` / `NOT YET` / `OK`
- a signal score for ordering and sidecar collapse

No network, no React, no side effects. Feed it data, get a decision surface model.

## Why

- Test the approval-queue UX and rules against real or synthetic PRs before locking project structure, SOW, or the Rust harness split.
- Reusable from the existing plain-JS web launcher (jakes-brain style) or any other shell.
- Clear contract for a future `brain-core` Rust crate.

## Files

- `decision.js` — the portable core (flags + verdict + score)
- `example.js` — tiny usage example with a synthetic PR
- This README

## Related sources (already in the fleet)

- Frontend prototype: merged into `feat/review-queue` via #44
- Delta uniqueness: dev-master #1458 (`generate-pr-delta-manifest.py`)
- Intake metadata: dev-master #1913 (warning-only `zenos.pr_intake/1`)

## Next (not in this PR)

- Point a tile in a personal app at this module with live or captured GitHub data.
- Add the delta-manifest and intake parsers as sibling pure functions.
- Decide whether the surface stays React in this repo or becomes a plain-JS / native tile.

Draft. Do not merge without greyZ review.
