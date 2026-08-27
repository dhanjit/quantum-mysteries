/* ============================================================
   QUANTUM MYSTERIES — atlas data, spectrum, router
   ============================================================ */
(function () {
  'use strict';

  const MYSTERIES = [
    {
      slug: 'measurement',
      name: 'Why Looking Changes Reality',
      term: 'The Measurement Problem',
      teaser: 'The wave goes everywhere — until you check.',
      nm: 589, // sodium D — the golden line
      starred: true,
      viz: 'measurement',
      riddle: 'The Schrödinger equation moves every quantum system forward smoothly, predictably, deterministically — until a measurement happens. Then, abruptly, a single outcome is somehow selected and the rest of the wave is gone. Nothing in the mathematics says what counts as a “measurement”, when the collapse occurs, or whether it really occurs at all.',
      stakes: 'Every interpretation of quantum mechanics — Copenhagen, many-worlds, pilot waves, spontaneous collapse — is an attempt to answer this one question. A century after the theory was written down, there is still no agreed answer.',
      caption: 'A particle spread out as a fog of probability. Point your detector anywhere and click to look: the whole fog snaps to one spot, drawn at random from |ψ|². Where did the rest of the wave go? Nobody knows.',
    },
    {
      slug: 'entanglement',
      name: 'Two Coins That Always Land Opposite',
      term: 'Entanglement & Nonlocality',
      teaser: 'Two particles, one fate, any distance.',
      nm: 656, // H-alpha
      viz: 'entanglement',
      riddle: 'Measure one particle of an entangled pair and the other’s state is fixed at once — even if it is on the other side of the galaxy. Einstein dismissed this as “spooky action at a distance”. Bell’s theorem proves the particles cannot merely be carrying a secret agreement made in advance, and half a century of experiments (Nobel Prize, 2022) confirms it.',
      stakes: 'Either something links distant events faster than light (yet uselessly — no message can ride on it), or there are no pre-existing facts for measurements to reveal, or measurements don’t have single outcomes. Each escape route breaks something we thought was bedrock.',
      caption: 'A pair in superposition drifts apart. Measure either one: both decide together, instantly, and always oppositely. No signal passes between them.',
    },
    {
      slug: 'duality',
      name: 'The Particle That Takes Both Doors',
      term: 'Wave–Particle Duality',
      teaser: 'It travels as a wave and arrives as a dot.',
      nm: 486, // H-beta
      viz: 'duality',
      riddle: 'Send electrons at two slits one at a time: each lands as a single dot, yet the dots slowly build an interference pattern — as if each electron had gone through both slits and interfered with itself. Install a detector to see which slit it used, and the pattern quietly vanishes.',
      stakes: 'Feynman called this the theory’s “only mystery” — a phenomenon that is, in his words, “impossible, absolutely impossible, to explain in any classical way”. Everything else in quantum mechanics is this, wearing different clothes.',
      caption: 'Particles fired one at a time. Unwatched, they build wave fringes; watched, the same apparatus writes two plain bands — the ghost of the other pattern stays on screen so both facts face each other. The only difference: could the path be known?',
    },
    {
      slug: 'boundary',
      name: 'Why Your Cat Is Never in Two Places',
      term: 'The Quantum–Classical Boundary',
      teaser: 'Where does the weirdness stop?',
      nm: 434, // H-gamma
      viz: 'boundary',
      riddle: 'Electrons superpose; tables and cats apparently don’t. Decoherence explains why big superpositions become impossible to see — the environment “measures” everything, constantly — but not why one definite outcome becomes real. Meanwhile experiments keep putting ever larger objects, now molecules beyond 25,000 atomic mass units, into superposition. No edge has ever been found.',
      stakes: 'If there is no boundary, then the universe as a whole — including you — has a wavefunction. If there is one, something unknown to physics draws the line.',
      caption: 'The same trick at four sizes: an electron holds its two places as long as the world is kept out; a molecule loses them in moments; a dust grain instantly; a cat never begins. The laws are identical at every size — no edge has ever been found.',
    },
    {
      slug: 'psi',
      name: 'The Ghost in the Equations',
      term: 'Is the Wavefunction Real?',
      teaser: 'A thing in the world, or a note in our ledger?',
      nm: 518, // Mg triplet, green
      viz: 'psi',
      riddle: 'Is ψ a physical object, like a field — or a summary of what we know, like a probability in a betting book? The PBR theorem (2012) showed that if a system has any objective state at all, ψ must be part of it. Yet the wavefunction of two particles doesn’t live in ordinary space — it lives in an abstract space of six dimensions, and it grows with every particle you add.',
      stakes: 'This decides what quantum theory is even about: whether physics describes the world itself, or only our information about it.',
      caption: 'The same ψ drawn twice. At each measurement the left story needs a field to snap everywhere at once; the right needs only a change of mind. Same event, two stories — the mathematics cannot say which one happened.',
    },
    {
      slug: 'information',
      name: 'Do Black Holes Destroy the Past?',
      term: 'The Information Paradox',
      teaser: 'The universe may be deleting its own memory.',
      nm: 397, // H-epsilon, deep violet
      viz: 'information',
      riddle: 'Quantum mechanics forbids information from being destroyed — ever. Yet apply quantum field theory to the curved spacetime of general relativity and Hawking’s calculation says black holes evaporate into featureless thermal radiation, carrying no memory of what fell in. When the black hole is gone, where did everything go?',
      stakes: 'One of our two best theories must give ground. Recent “island” calculations hint that the information does escape in the radiation — but no one can yet say how it gets out.',
      caption: 'Structure falls in; featureless heat leaks out; the hole shrinks and finally vanishes. Watch to the end: every bit that fell in is missing from the books — QM forbids that, so either the bits sneak out in the static (nobody can show how) or physics loses its memory.',
    },
    {
      slug: 'gravity',
      name: 'The Missing Theory of Everything',
      term: 'Quantum Gravity',
      teaser: 'Spacetime itself refuses to be quantized.',
      nm: 740, // far red edge
      viz: 'gravity',
      riddle: 'Every force in nature has a quantum description — except gravity. Treat Einstein’s spacetime like the other fields and the calculation drowns in infinities. Strings, loops and holography all compete to fix it, and no experiment can referee: quantum gravity lives near the Planck scale, roughly 10¹⁵ times beyond the reach of our best collider.',
      stakes: 'Whatever resolves it will say what spacetime actually is — possibly not fundamental at all, but woven out of something else, perhaps entanglement itself.',
      caption: 'One particle, two rulebooks. Outside the lens it rides one smooth spacetime; inside, the spacetime beneath it refuses to be one shape, and its path frays with it. The rulebooks clash exactly here — and no experiment can yet see which gives.',
    },
    {
      slug: 'vacuum',
      name: 'The Worst Prediction in Physics',
      term: 'The Vacuum Catastrophe',
      teaser: 'Empty space, off by a factor of 10¹²⁰.',
      nm: 410, // H-delta
      viz: 'vacuum',
      riddle: 'Empty space is not empty: quantum fields can never quite rest, so the vacuum seethes with zero-point energy. Add up the theory’s naïve estimate of that energy and it exceeds the value cosmologists actually measure by up to 120 orders of magnitude. Not off by a factor — off by a number with 120 zeros.',
      stakes: 'The tiny measured leftover is the dark energy accelerating the universe’s expansion. Explaining why the vacuum gravitates almost — but not exactly — zero may take physics beyond both quantum theory and relativity.',
      caption: 'A box of perfect nothing, seething with virtual pairs. Sum the energy of all that seething and watch the ratio spell itself out: prediction over measurement, a one with up to 120 zeros — built from steps that work everywhere else in physics.',
    },
    {
      slug: 'time',
      name: 'Why You Can’t Unbreak an Egg',
      term: 'The Arrow of Time',
      teaser: 'The laws don’t know past from future. We do.',
      nm: 615, // orange
      viz: 'time',
      riddle: 'The fundamental laws run backwards almost as happily as forwards — the one tiny known exception, in the weak force, cannot explain eggs. Reverse every velocity and physics raises no objection; yet eggs break and never unbreak. Entropy explains the one-way street only by assuming the early universe began in an extraordinarily ordered state, and nobody knows why it did.',
      stakes: 'Memory, causation and ageing all hang on an unexplained initial condition. Worse, in quantum gravity the equations suggest time may not be fundamental at all.',
      caption: 'A gas spreads and its entropy climbs — then time reverses and every particle retraces its path, order returning. The laws permit it perfectly. So why does it never happen to you?',
    },
    {
      slug: 'randomness',
      name: 'Does God Play Dice?',
      term: 'True Randomness',
      teaser: 'Einstein hoped not. It’s still not settled.',
      nm: 546, // mercury green
      viz: 'randomness',
      riddle: 'Quantum outcomes look irreducibly random, and Bell-test experiments rule out any local, pre-written script for them. But loopholes of principle remain: superdeterminism, many-worlds and pilot-wave theory each restore determinism — at the price of abandoning free experimental choice, single outcomes, or locality.',
      stakes: 'Whether the universe is deterministic — whether anything, anywhere, ever truly happens by chance — remains open after a century of quantum mechanics.',
      caption: 'A Bell test, live. Any local pre-written script is walled in at S = 2 — watch the needle break that wall and settle at 2√2 ≈ 2.83. The bits below have no pattern, and nothing we know of decides them.',
    },
  ];

  const $ = (sel) => document.querySelector(sel);
  const atlasEl = $('#view-atlas');
  const plateEl = $('#view-plate');
  const rgb = (nm) => 'rgb(' + window.wavelengthToRGB(nm).join(',') + ')';
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------- spectrum ---------------- */

  function buildSpectrum() {
    const VW = 1000, VH = 260;
    const x = (nm) => ((nm - 370) / (760 - 370)) * VW;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // faint continuum band
    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = `
      <linearGradient id="continuum" x1="0" y1="0" x2="1" y2="0">
        ${[380, 420, 460, 500, 540, 580, 620, 660, 700, 740]
          .map((nm) => `<stop offset="${((nm - 370) / 390) * 100}%" stop-color="${rgb(nm)}" stop-opacity="0.06"/>`)
          .join('')}
      </linearGradient>
      <filter id="lineGlow" x="-300%" y="-30%" width="700%" height="160%">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>`;
    svg.appendChild(defs);

    const band = document.createElementNS(svgNS, 'rect');
    band.setAttribute('x', 0); band.setAttribute('y', 30);
    band.setAttribute('width', VW); band.setAttribute('height', 170);
    band.setAttribute('fill', 'url(#continuum)');
    svg.appendChild(band);

    // wavelength scale
    const scale = document.createElementNS(svgNS, 'g');
    for (let nm = 400; nm <= 750; nm += 50) {
      const t = document.createElementNS(svgNS, 'line');
      t.setAttribute('x1', x(nm)); t.setAttribute('x2', x(nm));
      t.setAttribute('y1', 208); t.setAttribute('y2', 216);
      t.setAttribute('class', 'scale-tick');
      scale.appendChild(t);
      const n = document.createElementNS(svgNS, 'text');
      n.setAttribute('x', x(nm)); n.setAttribute('y', 232);
      n.setAttribute('text-anchor', 'middle');
      n.setAttribute('class', 'scale-num');
      n.textContent = nm;
      scale.appendChild(n);
    }
    const unit = document.createElementNS(svgNS, 'text');
    unit.setAttribute('x', VW - 8); unit.setAttribute('y', 252);
    unit.setAttribute('text-anchor', 'end');
    unit.setAttribute('class', 'scale-num');
    unit.textContent = 'WAVELENGTH, nm';
    scale.appendChild(unit);
    svg.appendChild(scale);

    // baseline
    const base = document.createElementNS(svgNS, 'line');
    base.setAttribute('x1', 0); base.setAttribute('x2', VW);
    base.setAttribute('y1', 208); base.setAttribute('y2', 208);
    base.setAttribute('class', 'scale-tick');
    svg.appendChild(base);

    // the ten lines
    MYSTERIES.forEach((m, i) => {
      const g = document.createElementNS(svgNS, 'a');
      g.setAttribute('href', '#/' + m.slug);
      g.setAttribute('class', 'sline');
      g.setAttribute('aria-label', `${m.name} (${m.term}) — λ ${m.nm} nm`);
      const lx = x(m.nm);
      const color = m.starred ? '#ffd97a' : rgb(m.nm);
      const w = m.starred ? 5 : 2.5;

      const halo = document.createElementNS(svgNS, 'rect');
      halo.setAttribute('x', lx - w * 2.4); halo.setAttribute('y', 30);
      halo.setAttribute('width', w * 4.8); halo.setAttribute('height', 170);
      halo.setAttribute('fill', color);
      halo.setAttribute('class', 'halo');
      halo.setAttribute('filter', 'url(#lineGlow)');
      halo.setAttribute('opacity', 0);

      const core = document.createElementNS(svgNS, 'rect');
      core.setAttribute('x', lx - w / 2); core.setAttribute('y', 30);
      core.setAttribute('width', w); core.setAttribute('height', 170);
      core.setAttribute('fill', color);
      core.setAttribute('class', 'core');
      core.setAttribute('filter', 'url(#lineGlow)');

      // generous invisible hit area
      const hit = document.createElementNS(svgNS, 'rect');
      hit.setAttribute('x', lx - 17); hit.setAttribute('y', 20);
      hit.setAttribute('width', 34); hit.setAttribute('height', 190);
      hit.setAttribute('fill', 'transparent');
      hit.setAttribute('class', 'hit');

      const label = document.createElementNS(svgNS, 'text');
      const flip = lx > VW * 0.72;
      label.setAttribute('x', flip ? lx - 14 : lx + 14);
      label.setAttribute('y', 52 + (i % 4) * 18);
      label.setAttribute('text-anchor', flip ? 'end' : 'start');
      label.setAttribute('class', 'sline-label');
      label.textContent = `${pad(i + 1)} · ${m.name.toUpperCase()}`;

      g.appendChild(halo); g.appendChild(core); g.appendChild(hit); g.appendChild(label);

      if (m.starred) {
        const star = document.createElementNS(svgNS, 'text');
        star.setAttribute('x', lx); star.setAttribute('y', 20);
        star.setAttribute('text-anchor', 'middle');
        star.setAttribute('class', 'star-mark');
        star.setAttribute('font-size', 14);
        star.textContent = '★';
        g.appendChild(star);
      }
      svg.appendChild(g);
    });

    $('#spectrum').appendChild(svg);

    // idle shimmer: lines take turns glowing softly
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let idx = 0;
      setInterval(() => {
        if (document.hidden || atlasEl.hidden) return;
        const lines = svg.querySelectorAll('.sline');
        lines.forEach((l) => l.classList.remove('lit'));
        if (Math.random() < 0.6) {
          lines[idx % lines.length].classList.add('lit');
          idx += 1 + Math.floor(Math.random() * 3);
        }
      }, 2600);
    }
  }

  /* ---------------- index ---------------- */

  function buildIndex() {
    const ol = $('#index');
    MYSTERIES.forEach((m, i) => {
      const li = document.createElement('li');
      if (m.starred) li.className = 'starred';
      const a = document.createElement('a');
      a.href = '#/' + m.slug;

      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = pad(i + 1);

      const nameWrap = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'entry-name';
      name.textContent = m.name;
      if (m.starred) {
        const s = document.createElement('span');
        s.className = 'star';
        s.textContent = '★';
        s.setAttribute('title', 'The central mystery');
        name.appendChild(s);
      }
      const teaser = document.createElement('span');
      teaser.className = 'entry-teaser';
      teaser.textContent = m.teaser;
      nameWrap.appendChild(name);
      nameWrap.appendChild(teaser);

      const lambda = document.createElement('span');
      lambda.className = 'entry-lambda';
      lambda.innerHTML = `<span class="entry-term">${m.term}</span>λ ${m.nm} nm<span class="swatch" style="background:${m.starred ? '#ffd97a' : rgb(m.nm)}"></span>`;

      a.appendChild(rank);
      a.appendChild(nameWrap);
      a.appendChild(lambda);
      li.appendChild(a);
      ol.appendChild(li);
    });
  }

  /* ---------------- plate ---------------- */

  let cleanupViz = null;

  function showPlate(m, i) {
    if (cleanupViz) { cleanupViz(); cleanupViz = null; }
    atlasEl.hidden = true;
    plateEl.hidden = false;
    document.body.classList.add('on-plate');

    $('#plate-number').innerHTML =
      `PLATE Nº ${pad(i + 1)} — ${m.term.toUpperCase()}${m.starred ? ' <span class="star">★ THE CENTRAL MYSTERY</span>' : ''}`;
    $('#plate-title').textContent = m.name;
    $('#plate-teaser').textContent = m.teaser;
    $('#plate-riddle').textContent = m.riddle;
    $('#plate-stakes').textContent = m.stakes;
    $('#plate-caption').textContent = 'FIG. — ' + m.caption;
    $('#plate-lambda').textContent = `λ ${m.nm} nm`;
    $('#plate-lambda').style.color = m.starred ? '#ffd97a' : rgb(m.nm);

    const prev = MYSTERIES[(i + MYSTERIES.length - 1) % MYSTERIES.length];
    const next = MYSTERIES[(i + 1) % MYSTERIES.length];
    $('#pager-prev').href = '#/' + prev.slug;
    $('#pager-prev-name').textContent = prev.name;
    $('#pager-next').href = '#/' + next.slug;
    $('#pager-next-name').textContent = next.name;

    const controls = $('#plate-controls');
    controls.innerHTML = '';
    const canvas = $('#plate-canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', m.caption);
    const mount = window.VIZ[m.viz];
    if (mount) cleanupViz = mount(canvas, controls);

    document.title = `${m.term} — Quantum Mysteries`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#plate-title').focus({ preventScroll: true });
  }

  function showAtlas() {
    if (cleanupViz) { cleanupViz(); cleanupViz = null; }
    const wasOnPlate = document.body.classList.contains('on-plate');
    plateEl.hidden = true;
    atlasEl.hidden = false;
    document.body.classList.remove('on-plate');
    document.title = 'Quantum Mysteries — an atlas of the unsolved';
    if (wasOnPlate) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      $('.brand a').focus({ preventScroll: true });
    }
  }

  function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const i = MYSTERIES.findIndex((m) => m.slug === hash);
    if (i >= 0) showPlate(MYSTERIES[i], i);
    else showAtlas();
  }

  document.addEventListener('keydown', (e) => {
    if (plateEl.hidden) return;
    if (e.key === 'Escape') location.hash = '#/';
    if (e.key === 'ArrowLeft') location.hash = $('#pager-prev').getAttribute('href');
    if (e.key === 'ArrowRight') location.hash = $('#pager-next').getAttribute('href');
  });

  buildSpectrum();
  buildIndex();
  window.addEventListener('hashchange', route);
  route();
})();
