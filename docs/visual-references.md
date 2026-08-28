# Visual explanations of the ten mysteries — a survey

What the best explainers online actually do, mystery by mystery, and what each
plate in this atlas could take from them.

Every link was fetched and status-checked (2026-08-28). Video titles, channels
and upload dates were resolved from the pages themselves, not from memory.
Dead links are listed at the bottom rather than silently dropped.

---

## The short version

Four resources are genuinely best-in-class and worth reading before touching any
plate:

| Resource | Why it's the benchmark |
|---|---|
| [MinutePhysics + 3Blue1Brown, *Bell's Theorem: The Quantum Venn Diagram Paradox*](https://www.youtube.com/watch?v=zcqZHYo7ONs) (2017) | Builds the classical explanation first, lets you believe it, then breaks it with three polarizer angles. The gold standard for staging a paradox. |
| [Quantum Flytrap Virtual Lab](https://lab.quantumflytrap.com/lab) | Drag-and-drop optical table, up to 4 entangled photons, live state vector. The only tool where you *set the parameter that creates the paradox* yourself. [Paper](https://arxiv.org/abs/2203.13300). |
| [QuVis, University of St Andrews](https://www.st-andrews.ac.uk/physics/quvis/) | ~90 simulations, iteratively refined against recorded student sessions. Design principle throughout: **show two situations side by side that differ in exactly one respect.** |
| [Quanta, *The Unraveling of Space-Time*](https://www.quantamagazine.org/the-unraveling-of-space-time-20240925/) (2024) | Nine pieces, 30 original visuals, five artists, 60+ hours of researcher interviews. The most serious money ever spent on visualising quantum gravity. |

And the design benchmark outside physics: [ciechanow.ski](https://ciechanow.ski/) —
every quantity named in the prose is a live control in the figure beside it.
[explorabl.es](https://explorabl.es/) collects the wider genre.

---

## 01 · Measurement — *Why Looking Changes Reality* (589 nm)

**Current plate:** fog of probability, click to collapse to a point drawn from |ψ|².

| | |
|---|---|
| Best video | [Sabine Hossenfelder, *The Problem with Quantum Measurement*](https://www.youtube.com/watch?v=Be3HlA_9968) — unusually sharp on why decoherence does *not* close the problem |
| Best framing | [Sean Carroll at Science & Cocktails](https://www.youtube.com/watch?v=-kxmR82QMN8) |
| Best animation | [Veritasium, *Why Parallel Universes Are Probably Real*](https://www.youtube.com/watch?v=kTXTPe3wahc) (2020) — what collapse costs you if you refuse it |
| Best interactive | [PhET *Quantum Measurement*](https://phet.colorado.edu/en/simulations/quantum-measurement) — opens on a biased classical coin vs a quantum coin; you can only learn either one by repeating |
| Sharpest interactive | [QuVis *Superposition States and Mixed States*](https://www.st-andrews.ac.uk/physics/quvis/) |

**What to steal.** The plate collapses a fog but never shows the difference
between a **superposition** and a **mere mixture** — and that difference *is* the
problem. A coin already hidden under a cup also "collapses" when you look; nobody
writes papers about that. QuVis's whole design is the side-by-side: identical in
one basis, different in another.

Second: PhET's single-shot-tells-you-nothing framing. Add a *run 1000 times*
control that accumulates a histogram back into the |ψ|² envelope. Right now the
Born rule is asserted in the caption; it should be visible on the canvas.

## 02 · Entanglement — *Two Coins That Always Land Opposite* (656 nm)

**Current plate:** two coins drift apart, look at either, both land opposite.

| | |
|---|---|
| Best video | [MinutePhysics + 3Blue1Brown, *Bell's Theorem*](https://www.youtube.com/watch?v=zcqZHYo7ONs) — watch the prerequisite first: [3B1B, *Some light quantum mechanics*](https://www.3blue1brown.com/lessons/light-quantum-mechanics) |
| Best interactive | [Quantum Flytrap — CHSH Bell inequality](https://lab.quantumflytrap.com/lab/bell-inequality), live S value as you rotate analyzers |
| Also | [QuVis *Hidden Variables I & II*](https://www.st-andrews.ac.uk/physics/quvis/simulations_html5/sims/quantum-versus-hv1/quantum-versus-hv1.html), [QuVis *Entanglement*](https://www.st-andrews.ac.uk/physics/quvis/simulations_html5/sims/entanglement/entanglement.html) |
| Best figures | [Nobel Prize 2022, popular science background](https://www.nobelprize.org/prizes/physics/2022/popular-information/) — clean, free, citable |

**What to steal — the biggest content fix in the atlas.** "Always opposite" is
*exactly* what a pair of classically correlated coins does. Bell's entire point is
that perfect anti-correlation at matched settings is unsurprising; the mystery
only appears when the two detectors are set to **different angles**. As drawn, the
plate demonstrates the thing Bell says is *not* mysterious.

MinutePhysics's fix is the three-angle Venn diagram: A vs B disagree ≤ x, B vs C
disagree ≤ y, so A vs C must disagree ≤ x+y — and reality says no. Give the plate
two rotatable dials and a running tally against the 75% classical ceiling and the
~85% quantum one.

## 03 · Duality — *The Particle That Takes Both Doors* (486 nm)

**Current plate:** unwatched → fringes, watched → bands, ghost of the other on screen.

| | |
|---|---|
| Real footage | [Hitachi / Tonomura single-electron buildup](https://www.hitachi.com/rd/research/materials/quantum/doubleslit/index.html) — the canonical 1989 movie, one electron in the apparatus at a time |
| Real footage | [Aspden, Padgett & Spalding, *Video recording true single-photon double-slit interference*](https://ar5iv.labs.arxiv.org/html/1602.05987) (AJP 2016), heralded ICCD |
| Context | [Physics World, *The double-slit experiment*](https://physicsworld.com/a/the-double-slit-experiment/) |
| Best interactive | [QuVis *Photons, Particles & Waves*](https://www.st-andrews.ac.uk/physics/quvis/); [Quantum Flytrap](https://lab.quantumflytrap.com/lab); [Falstad QM applets](https://www.falstad.com/qm1d/) |
| Best animation | [toutestquantique.fr — *duality*](https://toutestquantique.fr/en/duality/) (Bobroff / La Physique Autrement, CC, reusable) |

**What to steal.** Tonomura's persuasive element is the **dot counter**. The
pattern is invisible at N≈100 and undeniable at N≈1000, and watching the number
climb while your eye insists there's nothing there is what does the work. Put N
on the canvas.

**Avoid:** the *Dr Quantum* double-slit clip from *What the Bleep Do We Know!?* —
still the most-shared double-slit visual online and wrong in the way that matters:
it presents detection as passive "looking" and nudges toward
consciousness-causes-collapse. Widely criticised by physics educators.

## 04 · Boundary — *Why Your Cat Is Never in Two Places* (434 nm)

**Current plate:** the same trick at four sizes — electron, molecule, dust, cat.

| | |
|---|---|
| Source figure | [Zurek, *Decoherence and the Transition from Quantum to Classical*, Physics Today 1991 (PDF)](https://www2.unicamp.br/~chibeni/textosdidaticos/zurek-1991.pdf) — **the** decoherence-timescale table this plate is a picture of |
| Deeper | [Zurek 2003, *…Revisited*](https://arxiv.org/abs/quant-ph/0306072); [SEP, *The Role of Decoherence in QM*](https://plato.stanford.edu/entries/qm-decoherence/) |
| Experiment | [*Quantum superposition of molecules beyond 25 kDa*, Nature Physics 2019](https://www.nature.com/articles/s41567-019-0663-9) |
| Footage | [Vienna quantum nanophysics animations](https://www.quantumnano.at/science-for-all/videos-animations-podcasts/quantum-animations/) — single-molecule interference filmed in real time |
| Best animation | [toutestquantique.fr — *superposition*](https://toutestquantique.fr/en/superposition/) covers decoherence directly |

**What to steal.** Numbers. The plate currently says "moments", "instantly",
"never" — Zurek's table says a 10 µm dust grain decoheres in ~10⁻³¹ s. Label the
four rungs with real decoherence times and real masses and the ladder stops being
an adjective and becomes an argument.

## 05 · Psi — *The Ghost in the Equations* (518 nm)

**Current plate:** the same ψ drawn twice, two stories for one event.

The thinnest topic online — there is no good popular visual treatment of PBR.

| | |
|---|---|
| Context | [Quanta, *How Our Reality May Be a Sum of All Possible Realities*](https://www.quantamagazine.org/how-our-reality-may-be-a-sum-of-all-possible-realities-20230206/) |
| Standard diagram | ψ-ontic vs ψ-epistemic drawn as probability distributions over a hidden state λ — overlapping (epistemic) vs disjoint (ontic). PBR rules out the overlap. |

**What to steal — the unmade visual.** The strongest argument in the riddle text
is already there and undrawn: **the wavefunction doesn't live in space.** One
particle → a line. Two particles → a square. Three → a cube. For real 3D
particles that's 3N dimensions, and it grows with every particle you add. Show
1 → 2 → 3 particles and let the configuration space visibly outrun the room it's
supposed to live in. Nobody online has drawn this well, it's directly buildable
on canvas, and it would be the atlas's one original contribution.

## 06 · Information — *Do Black Holes Destroy the Past?* (397 nm)

**Current plate:** structure in, featureless heat out, hole vanishes.

| | |
|---|---|
| Best article | [Quanta, *The Black Hole Information Paradox Comes to an End*](https://www.quantamagazine.org/the-most-famous-paradox-in-physics-nears-its-end-20201029/) (2020) — carries the Page curve as its central graphic |
| Best video | [PBS Space Time, *The Black Hole Information Paradox*](https://www.youtube.com/watch?v=9XkHBmE-N34) |
| Follow-up | [PBS Space Time, *Have We SOLVED The Black Hole Information Paradox with Wormholes?*](https://www.youtube.com/watch?v=epSev7ovVew) |

**What to steal.** **The Page curve is the visual, and the plate doesn't have it.**
Everyone who explains this well draws one graph: entanglement entropy of the
radiation against time. Hawking's calculation gives a line that rises forever;
unitarity demands it turn over at the Page time and come back to zero. Two curves
on one axis, diverging — that's the whole paradox in one picture. Run it live in
a corner of the existing animation as the hole evaporates.

## 07 · Gravity — *The Missing Theory of Everything* (740 nm)

**Current plate:** a lens where one particle's path frays between two rulebooks.

| | |
|---|---|
| Best overall | [Quanta, *The Unraveling of Space-Time*](https://www.quantamagazine.org/the-unraveling-of-space-time-20240925/) (2024) |
| Best video | [Quanta, *When Physics Fails: The Problem of Space-Time*](https://www.youtube.com/watch?v=RIqVnFtOSr4) |
| Best explainer | [PBS Space Time, *Quantum Gravity and the Hardest Problem in Physics*](https://www.youtube.com/watch?v=YNEBhwimJWs); [*Loop Quantum Gravity Explained*](https://www.youtube.com/watch?v=L2suMPiuog4) |
| Why it resists | [NOVA, *Why Quantize Gravity?*](https://www.pbs.org/wgbh/nova/article/why-quantize-gravity/) |

**What to steal.** The scale bar. The riddle's most concrete claim — 10¹⁵ times
beyond our best collider — is the one thing that can be drawn honestly and isn't.
A log ruler from LHC energy to the Planck scale, with the reachable sliver marked,
says "no experiment can referee" better than any amount of fraying.

## 08 · Vacuum — *The Worst Prediction in Physics* (410 nm)

**Current plate:** a box of nothing, seething, weighed on a scale.

| | |
|---|---|
| Best video | [PBS Space Time, *The Vacuum Catastrophe*](https://www.youtube.com/watch?v=n6jAOV7bZ3Y) (2017) |
| Derivation | [Physics Explained, *The Worst Prediction in Physics History?*](https://www.youtube.com/watch?v=8loIYt4QKqQ) (2021) — shows where 10¹²⁰ comes from, chalkboard-style |
| Live data | [ANU Quantum Random Numbers Server](https://qrng.anu.edu.au/) — public API streaming bits generated by **measuring vacuum fluctuations** |

**What to steal.** Two things.

1. 120 orders of magnitude cannot be drawn linearly and shouldn't be faked. The
   honest visual is a log ruler with familiar rungs: an atom, the Earth, the
   observable universe (~10²⁶ m, so ~10⁷⁹ in volume). Show that even
   *the whole universe* is nowhere near 10¹²⁰ — that's the punch.
2. The ANU server hands you real bits sourced from the quantum vacuum. A plate
   about vacuum energy fed by actual vacuum-derived entropy is a genuinely good
   move, and it doubles for plate 10.

## 09 · Time — *Why You Can't Unbreak an Egg* (615 nm)

**Current plate:** gas spreads, entropy climbs, time reverses, order returns.

This is Loschmidt's paradox, and the plate is already the canonical demo.

| | |
|---|---|
| The canonical demo | [Molecular Workbench, *Loschmidt's Paradox*](http://mw.concord.org/modeler/showcase/thermodynamics/loschmidt.html) (Concord Consortium) — [HTML5 collection](https://mw.concord.org/nextgen/interactives/) |
| Best video | [Veritasium, *The Most Misunderstood Concept in Physics*](https://www.veritasium.com/videos/2023/7/18/the-most-misunderstood-concept-in-physics) (2023) — best-animated entropy explainer going |
| Background | [Loschmidt's paradox](https://en.wikipedia.org/wiki/Loschmidt's_paradox) |

**What to steal — the missing beat.** Molecular Workbench's move is to perturb
*one atom by a hair* before reversing, and show the reversal fail. The current
plate shows perfect reversal, which is true and slightly misleading: the point
isn't that reversal is *possible*, it's that it's **infinitely fragile**. A
"nudge one particle" button that ruins the return trip turns a curiosity into the
actual argument.

## 10 · Randomness — *Does God Play Dice?* (546 nm)

**Current plate:** three acts — out-guess the coin, hit the Bell wall, three ways out.

| | |
|---|---|
| Act one | [PhET *Quantum Coin Toss*](https://phet.colorado.edu/en/simulations/quantum-coin-toss) and [*Quantum Measurement*](https://phet.colorado.edu/en/simulations/quantum-measurement) — biased classical coin vs quantum coin is exactly act one |
| Act two | [Quantum Flytrap CHSH](https://lab.quantumflytrap.com/lab/bell-inequality); [Bell-Tester by Craig Gidney](https://github.com/Strilanc/Bell-Tester) — lets you *write* a classical strategy and watch it cap at 75% |
| Act three | [Veritasium, *Is This What Quantum Mechanics Looks Like?*](https://www.youtube.com/watch?v=WIyTZDHuarQ) (2016) — bouncing silicone droplets as a pilot-wave analogue |
| Live randomness | [ANU QRNG](https://qrng.anu.edu.au/), [NIST Randomness Beacon](https://www.nist.gov/programs-projects/nist-randomness-beacon) |

**What to steal.** Bell-Tester's framing beats a wall: instead of *telling* the
viewer a local script can't work, let them **build one and watch it lose**. Act
two currently asserts the ceiling; it could let you try to beat it.

**Caveat on the droplets:** the walking-droplet analogue is beautiful but was
shown in 2018 to fail at reproducing double-slit interference —
[Quanta, *Famous Experiment Dooms Alternative to Quantum Weirdness*](https://www.quantamagazine.org/famous-experiment-dooms-pilot-wave-alternative-to-quantum-weirdness-20181011/).
Cite it as intuition for pilot waves, not as evidence for them.

---

## What the good ones have in common

1. **Contrast pairs, never a single state.** QuVis's entire design language.
   Superposition vs mixture; watched vs unwatched; classical coin vs quantum coin.
   One variable different, everything else held.
2. **Show the statistics, not the single shot.** Tonomura's counter, PhET's
   histograms. One event proves nothing and viewers know it.
3. **Let the viewer set the knob that creates the paradox.** Flytrap's analyzer
   angles. Watching a paradox is weaker than causing one.
4. **Number the axes.** Zurek's 10⁻³¹ s, the 10¹⁵ gap to Planck, 25 kDa. Named
   magnitudes beat adjectives every time.
5. **Show the classical attempt failing first.** MinutePhysics builds the hidden-
   variable story and lets you believe it; Bell-Tester lets you code one. The
   refutation only lands if the thing refuted was standing.
6. **Real footage wins.** Hitachi's electrons beat any animation of electrons.

## Traps

- *Dr Quantum* / *What the Bleep* double-slit — detection as passive "looking",
  consciousness-causes-collapse. The most-shared and least accurate.
- Retrocausal framings of the delayed-choice quantum eraser — see
  [Hossenfelder's debunking](https://backreaction.blogspot.com/2021/10/the-delayed-choice-quantum-eraser.html);
  [QuVis has an honest simulation](https://www.st-andrews.ac.uk/physics/quvis/simulations_html5/sims/DelayedChoice/DelayedChoice.html).
- "Always opposite" as a demonstration of entanglement — classically reproducible.
- Walking droplets presented as literal quantum mechanics (see plate 10).

## Dead or unreachable (checked 2026-08-28)

- `interactive.quantumnano.at` — Vienna's virtual quantum lab, cited widely in
  2015–2022 outreach papers. DNS no longer resolves. Their
  [animations page](https://www.quantumnano.at/science-for-all/videos-animations-podcasts/quantum-animations/) is still up.
- Bell-Tester's hosted demo (404). [Source repo](https://github.com/Strilanc/Bell-Tester) is fine; runs locally.
- `thebigbelltest.org` returns 406.
