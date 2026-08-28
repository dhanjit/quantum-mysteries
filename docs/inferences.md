# Review of the survey → what the plates actually need

A finding-by-finding audit of [visual-references.md](visual-references.md)
against the code as it stands (`viz.js` @ 396f6fe), with a verdict each.
Quantitative claims are pinned in
[research/verified-numbers.md](research/verified-numbers.md).

Legend: **FIX** = required, applied in this pass · **OK** = already handled by
the existing code (survey corrected) · **DEFER** = real idea, needs a product
call — listed at the bottom.

| # | Plate | Survey finding | Verdict |
|---|---|---|---|
| 1 | 02 entanglement | "Always opposite" is classically reproducible; the mystery needs mismatched detector angles | **FIX** — the biggest one. See below. |
| 2 | 06 information | The Page curve *is* the visual and the plate doesn't have it | **FIX** — live two-curve inset. |
| 3 | 09 time | Perfect reversal is true but misses the point: the return is infinitely fragile | **FIX** — nudged-reversal act (Molecular Workbench's move). |
| 4 | 01 measurement | Born rule asserted in caption, not visible; single shot proves nothing | **FIX** — "look ×1000" histogram vs the |ψ|² envelope. |
| 5 | 04 boundary | "Says 'moments/instantly/never' — needs Zurek's numbers" | **OK, survey was wrong** — the readout already carries 10⁻³¹ s (air) and ms (vacuum); both now verified against Schlosshauer Table 1. Caption enriched with the numbers as a minor copy fix. |
| 6 | 03 duality | Needs Tonomura's dot counter | **OK** — `DETECTED: n` readout already exists; fast-forward covers the N≈100 → N≈1000 arc. |
| 7 | 07 gravity | 10¹⁵-beyond-collider gap named in riddle, never shown | **FIX (small)** — the idle bottom line now states the collider-vs-Planck gap; a full drawn ruler would be a second idea on a one-idea canvas (DESIGN.md bar). |
| 8 | 08 vacuum | Log-ruler with cosmic rungs | **OK** — the counting-to-10¹²⁰ display already lands the magnitude honestly; rung labels kept as an option in verified-numbers.md. |
| 9 | 10 randomness | Let the viewer *write* a losing local strategy (Bell-Tester style) | **DEFER** — plate 02's new tally act now shows a local script losing empirically; a strategy-builder is a bigger interactive. |
| 10 | 01 measurement | Superposition vs mere mixture is the actual problem | **DEFER** — needs its own design pass; overlaps plate 05's two-stories framing. |
| 11 | 05 psi | The unmade visual: configuration space outgrowing real space (line → square → cube) | **DEFER** — flagged as the atlas's possible original contribution; replacing or extending the two-stories viz is a product call. |

## The three structural fixes, as designed

**Plate 02 — from parlor trick to Bell.** Two acts. Act 1 keeps the coins at
matched detectors ("always opposite") but now *says the honest part*: a pair
of gloves does this too — each pair could carry an answer sheet written at
birth. That inference (EPR's) is exactly what act 1 licenses. Act 2 tilts the
detectors between three settings 0°/60°/120° and tallies "landed same" rates
into three bars: 25%, 25%, and 75%. If answer sheets existed, the third could
never exceed the first two combined (Wigner–d'Espagnat, triangle inequality
on a pre-written sheet — premise supplied by act 1). It does, live, on
screen. The plate's name stays: act 1 shows it, act 2 subverts it.

**Plate 06 — the ledger, drawn.** An inset graph runs with the evaporation:
what the radiation remembers (entanglement entropy) against time.
Hawking's calculation climbs to the end — the record dies with the hole.
QM's bound (the Page curve) must turn over just past half-way (u ≈ 0.54) and
return to zero — the record somehow rides out. The curves agree until the
Page time, then diverge on screen while the hole still shrinks: two
irreconcilable books, visible at the moment they split.

**Plate 09 — reversibility is not the mystery; fragility is.** The gas now
collides (hard disks), and the cycle runs a controlled experiment: spread —
perfect rewind (exact replay of the recorded trajectory: legal, entropy
falls) — the *same* spread replayed — rewind again, but with one particle's
velocity nudged by ~2°. Collisions amplify the hair's-breadth error and the
return shatters; entropy refuses to come back down. Same footage, one changed
variable. That is Loschmidt's answer to "why does it never happen to you."

## Fixes to the survey doc itself

- Plate 04 row corrected (numbers were already present; now verified).
- Plate 03 row marked done (counter exists).

## Deferred — needs your call (shout-outs)

1. **Plate 05 configuration-space act** (survey §05): 1 particle → a line,
   2 → a square, 3 → a cube; ψ visibly outrunning the room it's supposed to
   live in. Nobody online draws this well. Replace the two-stories viz,
   append as a second act, or leave? It's the one place the atlas could show
   something that exists nowhere else.
2. **Plate 10 strategy-builder**: let the viewer assemble a local
   hidden-variable strategy and watch it cap at 75% (Bell-Tester's framing).
   Meaningful build; act 2's wall currently asserts what this would prove.
3. **Plate 01 superposition-vs-mixture panel**: the coin-under-a-cup
   contrast. Worth doing only with a design that doesn't crowd the fog.
