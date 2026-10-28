# Roundtable R1: Legal (approval / audit / outbound)

Legal, 2026-10-28 (UTC+2). Not a licensed lawyer; not legal advice. Read SPEC v0.3 + IMPL-PLAN + Compliance R1. Cite = fetched this session; else **UNVERIFIED**.

**Verdict: GO-WITH-CHANGES.** WebAuthn seal by the owner, `content_hash`, single-use token, atomic consume+audit before send, kill switch, no bot seal route, and edit-after-seal burn already give a defensible human-sign-off record. Fix the gaps below before live alert/outreach posting.

**Trail check.** Who (authenticated principal + credential id), when (`sealed_at` / `send_attempt`), exact final text (`content_hash` — keep a recoverable sealed copy), sources at approval (`sources[]` + `source_viewed`), post-approval edits invalidate (`seal_invalidated`), no auto-send (re-verify + kill switch + 60 s undo). That covers defamation evidence (LV Civil Law Art 2352.1, VERIFIED), naming-company attribution, and GDPR Art 5(2) accountability for outreach.

**Must-fix**
1. On seal, store an immutable copy of the approved draft (or the exact bytes hashed) for the audit period — hash alone is weak if the body is purged.
2. Outreach seal extras: `lawful_basis`, `address_source`, `suppression_checked_at`, Art 21 opt-out present in the approved text (GDPR Arts 14, 21 VERIFIED). Refuse seal if suppressed.
3. Alert seal extras: every company-naming sentence must point at a primary source id in `sources[]` at seal time.
4. Rejected drafts (PROPOSAL): keep `{item_id, rejected_at, reason_code, approver_principal, content_hash}` only; **purge body after 14 days**; no spare personal data (Art 5(1)(c)/(e)).
5. Bind §2.6 placeholders (PROPOSAL): sealed/posted bodies + audit **1 y**; snapshots 30 d; rejected bodies 14 d. **[ADVOCATE]** if a longer LV reputation limitation applies (UNVERIFIED).
6. AI Act Art 50(4): EUR-Lex primary **UNVERIFIED** (unreachable). Commission Service Desk text (secondary): AI text published to inform the public on matters of public interest must be disclosed as AI-generated; exception if human review/editorial control **and** a person holds editorial responsibility. Art 50 applies from **2 Aug 2026** (Commission FAQ, secondary). House rule: owner seal = that review; record editorial responsibility on the seal; disclose on AI-assisted public alerts from that date (or earlier).

**Compliance:** agree RQ-1/2/4/5; extend RQ-4 with sealed-body retention. No conflict. UNVERIFIED here: EUR-Lex Art 50/113; LV limitation period. WRONG: none.
