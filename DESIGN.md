# Design language — an atlas of the unsolved

The site is an **emission spectrum of an unknown element**. Ten spectral lines,
one per mystery; each opens a numbered *plate* with concise prose and a live
canvas experiment. The register is a 1920s physics monograph crossed with a lab
instrument: editorial serif, mono annotations, phosphor and gold on a dark
plate. Nothing here is settled — the copy and the visuals both say so.

## Tokens

| Token | Value | Meaning |
|---|---|---|
| `--bg` / `--bg-deep` | `#0b0e14` / `#06080d` | the photographic plate |
| `--paper` | `#e9e4d6` | ink; the **classical** world (definite, settled) |
| `--phosphor` | `#6ef3c1` | **quantum** activity (superposed, undecided) |
| `--gold` | `#e8b84b` | the ★ central mystery, and every **paradox moment** |
| `--dim` / `--faint` | muted paper | annotations (keep ≥ AA contrast: dim ~0.55 alpha) |

Typography: **Spectral** (serif, headlines and prose — the name is the point)
+ **IBM Plex Mono** (annotations, ALL-CAPS letter-spaced instrument labels).
Color is semantic, not decorative: paper = classical fact, phosphor = quantum
state, gold = the clash between them. Hold that grammar in every new visual.

## The bar: stage the paradox

Set by plates 01 (probability fog) and 02 (coins). Every experiment must meet
it — an illustration of a concept fails; a staged *confrontation* passes.

1. **Two irreconcilable facts share the screen at the moment they clash** —
   fringes beside two-bands, a climb beside its forbidden descent, one smooth
   path beside its many-path fray. Never show one fact and caption the other.
2. **Say the impossible part while it is visible.** Gold mono line, timed to
   the moment (`contrastAt`-style triggers), not to the button press that will
   eventually cause it. If the clash isn't on screen yet, the label waits.
3. **Hands-free first.** An idle autopilot plays the full story in ≤ ~40s of
   watching. Failsafes so the story never stalls (timers back up
   probabilistic triggers). Buttons are overrides and keyboard access.
4. **Direct manipulation over controls.** Click the fog, click a coin, move
   the lens. Cursor changes signal what's touchable.
5. **The metaphor must be literal.** If the headline says coins, draw coins;
   if the plate is about a cat, a cat appears (ears, whiskers). No headline
   promise the canvas doesn't keep.
6. **Chance is never steered.** Looking chooses *when*, never *what*: outcomes
   sample the distribution, explicitly not the pointer position — and a label
   says so ("the fog chose, not you").
7. **Plain words on the canvas.** A first-time viewer gets a rotating one-line
   explainer or story labels ("Story 1 — ψ is a real thing"); jargon lives in
   the prose, not the picture.

## Copy voice

- **Headlines are curiosity hooks** ("Why You Can't Unbreak an Egg"); the
  technical term rides as a mono annotation (index right column, plate
  eyebrow). Never swap that hierarchy back.
- **Honest physics, kept honest under punch.** Open questions stay open
  ("nobody can show how", "still open"); lifetimes are environment-qualified;
  Bell claims always say **local**; blame calculations, not the universe
  ("one of our two best calculations is wrong"). A physicist should never
  wince; a lay reader should never yawn.
- Annotation grammar: `PLATE Nº 07 — QUANTUM GRAVITY`, `λ 589 nm`, `FIG. —`.
  Sentence-case captions; ALL-CAPS only for mono instrument labels.

## The spectrum

Wavelengths are real lines; the central mystery sits on the sodium D line in
gold. 01 ★ measurement 589 (Na D) · 02 entanglement 656 (H-α) · 03 duality 486
(H-β) · 04 boundary 434 (H-γ) · 05 psi 518 (Mg) · 06 information 397 (H-ε) ·
07 gravity 740 (red edge) · 08 vacuum 410 (H-δ) · 09 time 615 · 10 randomness
546 (Hg). Unobserved index entries render doubled (superposition) and collapse
to sharp on hover — disabled where hover doesn't exist.

## Motion & access

- `prefers-reduced-motion`: no ambient loops — static first frame plus a
  time-boxed `pulse()` after each interaction.
- Contrast floor AA; branded phosphor `:focus-visible` everywhere; spectrum
  hit-targets ≥ ~24px (the SVG scrolls on phones instead of shrinking).
- Everything reviewable is real DOM text, never pixels-only.
