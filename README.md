# Quantum Mysteries

**An atlas of the unsolved** — [quantummysteries.dhanjit.me](https://quantummysteries.dhanjit.me)

The deepest open problems of quantum physics, presented as an emission spectrum
of an unknown element. Each spectral line is a mystery; each mystery opens a
*plate* with a short, honest explanation and a live canvas experiment you can
poke at — collapse a wavefunction, switch on a which-path detector, reverse
time, run a Bell test.

The ★ marks the central mystery: the measurement problem.

## Stack

Zero dependencies. Hand-written HTML/CSS/JS in [`public/`](public/), rendered
with 2D canvas. Deployed as a Cloudflare Workers static-assets site.

```bash
# local preview
npx wrangler dev

# deploy
npx wrangler deploy
```

## Design

- The landing page is a spectrum: ten lines at (mostly real) wavelengths —
  the measurement problem sits at 589 nm, the sodium D line, in gold.
- Unobserved catalogue entries render in superposition (doubled); observing
  them (hover/focus) collapses them.
- Typography: [Spectral](https://fonts.google.com/specimen/Spectral) +
  IBM Plex Mono. `prefers-reduced-motion` is respected throughout.

Nothing here is settled.
