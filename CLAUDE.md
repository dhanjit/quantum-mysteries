# quantum-mysteries — Claude Code notes

Zero-dependency static site: hand-written HTML/CSS/canvas-JS in `public/`,
deployed as Cloudflare Workers static assets at **quantum-mysteries.dhanjit.me**.
No build step, no node_modules. Design language lives in [DESIGN.md](DESIGN.md) —
read it before touching any visual.

## Source of truth

- **All copy** (headlines, terms, teasers, riddles, stakes, captions) lives in
  the `MYSTERIES` array in `public/app.js`. Edit copy there and only there —
  captions double as the canvas `aria-label`s.
- **All experiments** live in `public/viz.js` as `VIZ[key](canvas, controls) =>
  cleanupFn`. The shared `stage()` helper handles DPR sizing, the rAF loop, and
  reduced motion; per-viz conventions:
  - Every viz self-demonstrates on an idle **autopilot** (time-gated inside
    `draw`). Buttons are manual overrides only — never the sole path to the
    payoff.
  - Guard autopilot triggers with `t > N` so the reduced-motion synchronous
    first frame (t=0, before `st` exists) can't fire them.
  - Interactions call `st.pulse(sec)` so reduced-motion users still see the
    response. Cleanup must remove every listener/timer it added.

## Verify before pushing

```bash
node --check public/viz.js && node --check public/app.js && node tests/headless.js
```

`tests/headless.js` mounts all ten experiments with stubbed canvas/rAF and
drives ~93 simulated seconds — long enough to cross every autopilot cycle
(black-hole evaporation 30s+5s, boundary ladder, randomness acts). It catches
crashes and stalled state machines; it cannot see visual output, label
collisions, or anything requiring a compositing browser.

## Deploy

`git push` to `main` **is** the deploy — the repo is connected to Cloudflare
Workers Builds. Never run `wrangler deploy` manually. Custom domain + assets
config is `wrangler.jsonc`; the DNS record is managed by the deploy. Builds
usually land in under a minute but the queue has stalled for 30–80 minutes
before; verify with a cache-busted fetch of a string unique to the new commit,
and if stuck, the build log is in the Cloudflare dashboard (user-only).

## Review deck

Copy and experiments are reviewed via a select-and-comment Claude artifact
(the "review-deck" personal skill documents the workflow; the artifact URL is
in Claude's project memory, deliberately not in this public repo). The deck
inlines `viz.js` and mirrors the `MYSTERIES` copy — after changing either,
re-run the deck sync script and republish so deck and repo never drift.
Comment feedback gets applied here first, then synced outward.

## Misc

- `public/og.png` has the domain baked into the artwork — regenerate it
  (PIL script) if the domain or branding changes.
- Wavelengths in `MYSTERIES` are real spectral lines (see DESIGN.md); don't
  invent new ones casually — a spectroscopist will notice.
