# Design QA — R1 (glitchworks-tarot as review queue)

No screenshots (`screenshots/` empty). I reviewed the spec and `Card.jsx` @ dc85159.

**1. 375px glance: fails**
- An md card is 256×448px, about 1 per screen. Risk shows only as an 8px indigo rarity label and a border glow. Add a full-width text band at the top (≥16px bold): `⛔ BLOCKED · PII` / `▲ 2 RED` / `◆ 1 AMBER` / `✓ CLEAN`.
- Stats are 10px numbers with 12px icons. Use ≥14px on review cards.

**2. Colour / a11y**
- Contrast is fine on slate-950: pink-500 5.7:1, yellow-500 10.5:1, red-500 5.4:1, amber 11.3:1. The problem is meaning.
- Pink "glitched" reads as playful or rare, not failure. Under protan/deutan CVD, pink and red are indistinguishable anyway (1.07:1 luminance). So shape and text must carry the risk. Recommend O4 = yes: red + ▲ + label, amber `#ffb400` + ◆ + label.
- Collisions: `electric` (pr_push) uses the yellow-500 border, the same as ultra-rare. `fire` (security_alert) uses the red-500 border, the same as the red band. `neonGlow`/`goldFoil` frames repaint borders. On review cards, force `frame: standard` and neutral type borders. Risk owns the border.
- Drop `animate-pulse-glow` on risk and honour `prefers-reduced-motion`.

**3. Metaphor**
- It helps memorability (you triage a deck) and hurts on stats. ATK = risk (high is bad) and DEF = verified % (high is good), so the polarity is mixed. Relabel as text: `RISK 55 · VERIFIED 50% · DUE 5h`.
- Never show the words "glitched" or "ultra-rare" in review UI. Use severity words.

**4. Density**
- The art centre is about 60% of the card with zero decision signal. On review cards, replace it with the flags list.
- Make the default for `review-queue` the Dex list mode (rows with a text flag count), not the grid. Cards belong in the sheet and triage only.
- Risk is shown 3 times (band, ATK, count). Keep the band and the count, and drop ATK.
