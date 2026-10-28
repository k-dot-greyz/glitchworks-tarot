# R1 · Product position: glitchworks-tarot as the review queue

Inputs: REVIEW-QUEUE-SPEC.md (still the v0.2 text; no v0.3 file yet), GAP-MATRIX.md (written against v0.1), IMPL-PLAN rev 2, all at `dc85159`. *Inferred* means it comes from greyZ's v0.3 brief, not from a file.

## Verdict
It fits as a **read-only PR decision UI**, as long as a server-side service holds all authority. As an approval engine it doesn't fit: it has good card UI and none of the safety core (3/14/55).

## IMPL-PLAN vs spec
- **Old shape.** The plan's own banner says it's pending v0.3. PR-2 builds posting adapters, and there's no GitHub read or merge-request output (*inferred* core).
- **Hold.** Spec §7 and plan `holdMs` set `pr_push` to **0 s**. v0.3 wants 60 s with undo (*inferred*).
- **`PR_PROTECTED_BRANCH`.** Spec §4.3/T13 and plan PR-1b block every PR into `main`, which in this queue means almost every card. It should become "bypasses or changes protection" (*inferred*).
- **Forge edit and Arena diff** (§3.1, PR-8/9) assume we own the draft. We don't own PRs.
- **Spread, sidecars, portals and the references index** appear in neither file.
- **K1–K13 and the `duplicateDeck` guard (K3)** are in the plan only. They should go into the spec and the matrix.
- **12 PRs**, and the first phone UI lands at PR-5.

## Phone UX risks → mitigation
- **Swipe-right seals by accident** (§3.3, PR-7) → in MVP, swipes only navigate. Seal is a button, behind the sources gate and the 300 ms lockout.
- **Glitch effects hurt legibility.** The `glitched` band pulses pink (K5) and the CRT overlays stay on → use a static red/amber strip and force overlays off in review sheets.
- **Spread too dense at 375 px** → below 768 px show the central card plus a vertical sidecar list with flag dots. The full spread is iPad only.
- **Portal modals bury flags** → pin the flags in the central-card header and the confirm sheet. Sidecar modals get no Seal button.
- **Hold/undo lost after backgrounding** → keep the hold server-side (§4.4), re-fetch it on resume, and show a sticky "holding" pill. The bot still needs greyZ's yes.
- **The PR changes mid-review** → bind the seal hash to the head SHA, so a moved head means the seal is refused.

## MVP cut (ordered)
1. **Rules + PR card.** PR flags, gates and a state machine ending at `requested`, with derived stats. *Proves:* the rules are pure and tested.
2. **Local service.** Read-only GitHub access with the token kept server-side, a hash over the PR and head SHA, a single-use seal, a 60 s hold and undo, append-only audit, and a mock merge-request sink. *Proves:* AC2–AC8 and that the app never merges.
3. **Adapter + queue list**, flag off by default. *Proves:* no token in the browser and T16.
4. **PR sheet.** Summary first, pinned flags, sidecar list, URL index, confirm/press-hold, hold/undo. *Proves:* G1–G4 on a phone.
5. **E2E at 375 px and on iPad**, with a no-write network check. *Proves:* AC10.

**Deferred:** full spread, swipes and keys, Forge/Arena, batch, the outbox tab, stacked PRs and repo sidecar files, the alert/outreach kinds, the real bot hookup, the CI fix, Android.

## D1–D3
- **D1:** stand-ins stay binding (default). Re-check if the real v2.1 file appears.
- **D2:** no 5th tab for MVP. Use in-sheet hold plus a global pill (plan §7 fallback).
- **D3:** yes, server-side, as its own private repo (option B), local-only until greyZ picks hosting.
