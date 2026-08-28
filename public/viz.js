/* ============================================================
   QUANTUM MYSTERIES — live experiments
   Ten small canvas instruments, one per mystery.
   Each VIZ[key] = (canvas, controls) => cleanupFn
   ============================================================ */
(function () {
  'use strict';

  const PH = '#6ef3c1';           // phosphor
  const GOLD = '#e8b84b';
  const PAPER = '#e9e4d6';
  const DIM = 'rgba(233,228,214,0.55)';
  const FAINT = 'rgba(233,228,214,0.14)';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);

  const MONO = (s) => `${s}px "IBM Plex Mono", monospace`;

  /* ---------- stage: DPR-aware sizing + animation loop ---------- */
  function stage(canvas, draw, aspect) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, raf = 0, alive = true, vt = 0, last = 0, pulseUntil = 0;

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const cssW = parent.clientWidth || 600;
      const cssH = Math.round(cssW / aspect);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = cssW; H = cssH;
      if (RM) frameOnce();
    }

    function frameOnce() {
      if (W > 0) draw(ctx, W, H, vt, 1 / 60);
    }

    function loop(now) {
      if (!alive) return;
      if (!last) last = now;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      if (!RM || now < pulseUntil) {
        vt += dt;
        if (W > 0) draw(ctx, W, H, vt, dt);
      }
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();
    raf = requestAnimationFrame(loop);

    return {
      ctx,
      get W() { return W; },
      get H() { return H; },
      // in reduced-motion mode, animate briefly after an interaction
      pulse(sec) { pulseUntil = performance.now() + (sec || 1.2) * 1000; },
      redraw: frameOnce,
      destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); },
    };
  }

  function btn(controls, label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    controls.appendChild(b);
    return b;
  }

  function readout(controls) {
    const r = document.createElement('span');
    r.className = 'readout';
    r.setAttribute('aria-live', 'polite');
    controls.appendChild(r);
    return r;
  }

  /* wavelength (nm) → rgb, for the spectrum (shared with app.js) */
  function wavelengthToRGB(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    let f = 1;
    if (nm >= 380 && nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700 && nm <= 780) f = 0.3 + 0.7 * (780 - nm) / 80;
    const q = (v) => Math.round(255 * Math.pow(clamp(v * f, 0, 1), 0.8));
    return [q(r), q(g), q(b)];
  }
  window.wavelengthToRGB = wavelengthToRGB;

  /* ============================================================
     01 — THE MEASUREMENT PROBLEM
     A drifting wavefunction; MEASURE collapses it to a spike
     drawn at random from |ψ|², then it slowly re-spreads.
     ============================================================ */
  function vizMeasurement(canvas, controls) {
    // slow drift: the glow should breathe, not read as an object travelling
    const modes = [
      { w: 0.5, c0: 0.34, amp: 0.11, sp: 0.08, ph: rand(0, TAU), sig: 0.085 },
      { w: 0.34, c0: 0.62, amp: 0.13, sp: 0.06, ph: rand(0, TAU), sig: 0.11 },
      { w: 0.26, c0: 0.5, amp: 0.16, sp: 0.045, ph: rand(0, TAU), sig: 0.065 },
    ];
    const motes = [];
    for (let i = 0; i < 90; i++) {
      motes.push({ u: Math.random(), v: Math.random(), tw: rand(0, TAU) });
    }
    let collapse = null; // {x0, t0}
    let burst = null, lastBurst = -30; // {t0, d, bins, fed}
    let compare = null, lastCompare = -25; // {t0, xTrue, revealed, xL}
    let pointer = null;
    let nMeas = 0;
    let lastAction = 0;
    const touchOnly = window.matchMedia('(hover: none)').matches;
    const ro = readout(controls);
    ro.textContent = 'THE PARTICLE IS SOMEWHERE IN THE FOG';

    const N = 240;
    function density(t) {
      const d = new Array(N);
      let max = 0;
      for (let i = 0; i < N; i++) {
        const x = i / (N - 1);
        let v = 0;
        for (const m of modes) {
          const c = m.c0 + m.amp * Math.sin(t * m.sp * TAU + m.ph);
          v += m.w * Math.exp(-((x - c) ** 2) / (2 * m.sig * m.sig));
        }
        d[i] = v;
        if (v > max) max = v;
      }
      for (let i = 0; i < N; i++) d[i] /= max;
      return d;
    }

    function draw(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const base = H * 0.84, top = H * 0.14;
      const d = burst ? burst.d : density(t);

      // looks happen on their own if nobody intervenes; every so often
      // the instrument looks a thousand times in a row, and every so often
      // it plays the fog against a merely hidden coin
      if (!compare && !burst && !collapse && t > 26 && t - lastCompare > 50) startCompare();
      if (compare) { drawCompare(ctx, W, H, t); return; }
      if (!burst && !collapse && t > 16 && t - lastBurst > 45) burstLook();
      if (!burst && !collapse && t > 5 && t - lastAction > 7) look();

      let k = 0, x0 = 0.5;
      if (collapse) {
        const dt = t - collapse.t0;
        x0 = collapse.x0;
        if (dt < 0.35) k = easeOut(dt / 0.35);
        else if (dt < 1.15) k = 1;
        else if (dt < 2.9) k = 1 - easeOut((dt - 1.15) / 1.75);
        else { collapse = null; k = 0; }
      }
      const spikeSig = 0.007;
      const blended = d.map((v, i) => {
        const x = i / (N - 1);
        const spike = Math.exp(-((x - x0) ** 2) / (2 * spikeSig * spikeSig));
        return lerp(v, spike, k);
      });

      // axis
      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();

      // probability fog — soft, no graph line
      const col = collapse && k > 0.5 ? GOLD : PH;
      const grad = ctx.createLinearGradient(0, top, 0, base);
      grad.addColorStop(0, col + '30');
      grad.addColorStop(1, col + '05');
      ctx.beginPath();
      ctx.moveTo(0, base);
      for (let i = 0; i < N; i++) {
        ctx.lineTo((i / (N - 1)) * W, base - blended[i] * (base - top));
      }
      ctx.lineTo(W, base);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.shadowColor = col; ctx.shadowBlur = 26;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      // a thousand looks at once: each one pure chance, the pile-up
      // exactly the fog — the Born rule, made visible
      if (burst) {
        const bt = t - burst.t0;
        const target = Math.min(1000, Math.floor(easeOut(clamp(bt / 2.2, 0, 1)) * 1000));
        let tot = 0;
        for (const v of d) tot += v;
        while (burst.fed < target) {
          let r = Math.random() * tot, xi = N - 1;
          for (let i = 0; i < N; i++) { r -= d[i]; if (r <= 0) { xi = i; break; } }
          burst.bins[clamp(Math.floor((xi / (N - 1)) * 48), 0, 47)]++;
          burst.fed++;
        }
        let bmax = 1;
        for (const v of burst.bins) if (v > bmax) bmax = v;
        ctx.fillStyle = GOLD;
        ctx.globalAlpha = 0.75;
        const bw = W / 48;
        for (let i = 0; i < 48; i++) {
          const bh = (burst.bins[i] / bmax) * (base - top);
          ctx.fillRect(i * bw + 0.5, base - bh, bw - 1, bh);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = PAPER;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          ctx.lineTo((i / (N - 1)) * W, base - d[i] * (base - top));
        }
        ctx.stroke();
        ctx.font = MONO(10); ctx.textAlign = 'center';
        ctx.fillStyle = GOLD;
        ctx.fillText(`${burst.fed} LOOKS — EACH PURE CHANCE. TOGETHER: THE FOG'S EXACT SHAPE.`, W / 2, H * 0.07);
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('THE HISTOGRAM IS |ψ|² — THE BORN RULE, SEEN', W / 2, H * 0.955);
        ctx.textAlign = 'left';
        if (bt > 7.5) burst = null;
      }

      // fireflies in the fog — any of them might be the one
      for (const mo of motes) {
        const xi = clamp(Math.round(mo.u * (N - 1)), 0, N - 1);
        const env = blended[xi];
        const xDraw = lerp(mo.u, x0, k) * W;
        const yEnv = base - mo.v * env * (base - top) - 2;
        const yDraw = k > 0 ? lerp(yEnv, base - 6, k) : yEnv;
        const a = env * (0.25 + 0.55 * Math.abs(Math.sin(t * 2.2 + mo.tw)));
        if (a < 0.03) continue;
        ctx.globalAlpha = Math.min(a, 0.85);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(xDraw, yDraw, 1.4, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // the found particle
      if (collapse && k > 0.7) {
        const px = x0 * W;
        ctx.fillStyle = GOLD;
        ctx.shadowColor = GOLD; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(px, base - 6, 4, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = GOLD;
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px, H * 0.08); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = MONO(10);
        ctx.textAlign = px > W - 120 ? 'right' : 'left';
        ctx.fillText('FOUND IT.  x = ' + x0.toFixed(3), px + (px > W - 120 ? -8 : 8), H * 0.11);
        ctx.textAlign = 'left';
      }

      // your detector follows the mouse
      if (pointer && !touchOnly) {
        ctx.strokeStyle = PAPER;
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(pointer.x, H * 0.05); ctx.lineTo(pointer.x, base); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 9, 0, TAU); ctx.stroke();
        ctx.fillStyle = PAPER;
        ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 1.5, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // labels + a rotating plain-words explainer
      ctx.fillStyle = DIM;
      ctx.font = MONO(9);
      ctx.fillText('PROBABILITY FOG · |ψ(x)|²', 12, H * 0.97);
      if (!collapse && !burst) {
        const LINES = [
          'THIS GLOW IS ONE PARTICLE — NOT MOVING, JUST SPREAD OUT',
          'CLICKING = LOOKING. LOOKING FORCES ONE DEFINITE ANSWER',
          'WHERE YOU FIND IT: PURE CHANCE, WEIGHTED BY THE GLOW',
        ];
        ctx.textAlign = 'center';
        ctx.font = MONO(10);
        ctx.fillStyle = PAPER;
        ctx.fillText(LINES[Math.floor(t / 4.5) % 3], W / 2, H * 0.07);
        ctx.fillStyle = DIM;
        ctx.font = MONO(9);
        ctx.fillText(touchOnly ? 'TAP THE FOG TO LOOK' : 'POINT ANYWHERE — CLICK TO LOOK', W / 2, H * 0.955);
        ctx.textAlign = 'left';
      }
    }

    const st = stage(canvas, draw, 16 / 9);

    function look() {
      if (compare) { revealCompare(); return; }
      if (burst) burst = null;
      const t = st.now();
      const d = density(t);
      let total = 0;
      for (const v of d) total += v;
      let r = Math.random() * total, x0 = 0.5;
      for (let i = 0; i < d.length; i++) {
        r -= d[i];
        if (r <= 0) { x0 = i / (d.length - 1); break; }
      }
      nMeas++;
      lastAction = t;
      collapse = { x0, t0: t };
      ro.textContent = `LOOKS: ${nMeas} · FOUND AT x = ${x0.toFixed(3)} · THE FOG CHOSE, NOT YOU`;
      st.pulse(3.2);
    }

    function burstLook() {
      const t = st.now();
      compare = null;
      collapse = null;
      burst = { t0: t, d: density(t), bins: new Float32Array(48), fed: 0 };
      lastBurst = t;
      lastAction = t;
      nMeas += 1000;
      ro.textContent = `LOOKS: ${nMeas} · A THOUSAND AT ONCE — WATCH THE PILE-UP BECOME |ψ|²`;
      st.pulse(9);
    }

    /* the fog against a merely hidden coin: a superposition and a
       mixture wear the same envelope — one look cannot separate them */
    function sampleFrom(d) {
      let total = 0;
      for (const v of d) total += v;
      let r = Math.random() * total;
      for (let i = 0; i < d.length; i++) {
        r -= d[i];
        if (r <= 0) return i / (d.length - 1);
      }
      return 0.5;
    }

    function startCompare() {
      const t = st.now();
      burst = null;
      collapse = null;
      lastCompare = t;
      lastAction = t;
      compare = { t0: t, xTrue: sampleFrom(density(t)), revealed: null, xL: 0.5 };
      ro.textContent = 'TWO SEALED BOXES, SAME ODDS — IS THE FOG JUST A HIDDEN DOT?';
      st.pulse(13);
    }

    function revealCompare() {
      if (!compare || compare.revealed !== null) return;
      const t = st.now();
      compare.revealed = t;
      compare.xL = sampleFrom(density(t));
      ro.textContent = 'BOTH GAVE ONE SPOT — ONE LOOK CANNOT TELL THEM APART. INTERFERENCE CAN.';
      st.pulse(6);
    }

    function drawCompare(ctx, W, H, t) {
      const ct = t - compare.t0;
      if (compare.revealed === null && ct > 5.5) revealCompare();
      if (ct > 13) { compare = null; return; }

      const mid = W / 2;
      const base = H * 0.8, top = H * 0.26;
      const d = density(compare.t0);
      const rv = compare.revealed !== null;
      const k = rv ? easeOut(clamp((t - compare.revealed) / 0.4, 0, 1)) : 0;

      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(mid, H * 0.1); ctx.lineTo(mid, H * 0.92); ctx.stroke();

      ctx.textAlign = 'center'; ctx.font = MONO(10);
      ctx.fillStyle = PH;
      ctx.fillText('A — SPREAD OUT: A WAVE', mid / 2, H * 0.12);
      ctx.fillStyle = PAPER;
      ctx.fillText('B — MERELY HIDDEN: A DOT, SOMEWHERE', mid + mid / 2, H * 0.12);
      ctx.font = MONO(9); ctx.fillStyle = DIM;
      ctx.fillText('nothing has a position yet', mid / 2, H * 0.12 + 14);
      ctx.fillText('it has one — you just can’t see it', mid + mid / 2, H * 0.12 + 14);

      const LW = mid - 40;
      const spike = (x, x0) => Math.exp(-((x - x0) ** 2) / 0.0003);

      // LEFT: the fog itself (collapses on the look)
      ctx.beginPath();
      for (let i = 0; i <= 110; i++) {
        const x = i / 110;
        const v = lerp(clamp(d[Math.round(x * (N - 1))], 0, 1), spike(x, compare.xL), k);
        const px = 20 + x * LW, py = base - v * (base - top);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = PH; ctx.lineWidth = 2.5;
      ctx.shadowColor = PH; ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 1;
      if (rv) {
        ctx.fillStyle = GOLD;
        ctx.beginPath(); ctx.arc(20 + compare.xL * LW, base - 5, 4, 0, TAU); ctx.fill();
      }

      // RIGHT: the same envelope, but as ignorance about a real dot
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 110; i++) {
        const x = i / 110;
        const v = clamp(d[Math.round(x * (N - 1))], 0, 1) * (rv ? 1 - k : 1);
        const px = mid + 20 + x * LW, py = base - v * (base - top);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = PAPER;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      if (rv) {
        const px = mid + 20 + compare.xTrue * LW;
        ctx.fillStyle = PAPER;
        ctx.beginPath(); ctx.arc(px, base - 5, 4, 0, TAU); ctx.fill();
        ctx.strokeStyle = PAPER;
        ctx.globalAlpha = clamp(1.4 - (t - compare.revealed) * 0.5, 0, 1);
        ctx.beginPath(); ctx.arc(px, base - 5, 4 + (t - compare.revealed) * 26, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('THE DOT IS ALREADY SOMEWHERE UNDER THIS CURVE', mid + mid / 2, base + 18);
      }

      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();

      // the point, said while both spots are on screen
      if (!rv) {
        ctx.fillStyle = PAPER; ctx.font = MONO(10);
        ctx.fillText('SAME ODDS, SAME CURVE — NOW LOOK AT BOTH', W / 2, H * 0.93);
      } else {
        ctx.fillStyle = PAPER; ctx.font = MONO(10);
        ctx.fillText('ONE SPOT EACH. A SINGLE LOOK CANNOT TELL A WAVE FROM A HIDDEN DOT.', W / 2, H * 0.9);
        if (t - compare.revealed > 1.6) {
          ctx.fillStyle = GOLD;
          ctx.fillText('INTERFERENCE CAN — PLATE 03 — AND IT ANSWERS: WAVE. THE FOG IS NOT MERE HIDING.', W / 2, H * 0.96);
        }
      }
      ctx.textAlign = 'left';
    }

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      st.pulse(1.5);
    };
    const onLeave = () => { pointer = null; };
    const onClick = () => look();
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click', onClick);
    if (!touchOnly) canvas.style.cursor = 'none';

    btn(controls, 'Look', look);
    btn(controls, 'Look \u00d71000', burstLook);
    btn(controls, 'Fog vs merely hidden', startCompare);

    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      canvas.style.cursor = '';
      st.destroy();
    };
  }

  /* ============================================================
     02 — ENTANGLEMENT
     Act 1: ask both coins the same question — always opposite.
     Honest beat: separated gloves do that too, so maybe each
     pair carries an answer sheet written at birth (EPR).
     Act 2: tilt the questions between 0°/60°/120° and tally the
     SAME rates — if sheets existed, bar 3 could never pass
     bar 1 + bar 2 (Wigner–d'Espagnat form of Bell; the numbers
     live in docs/research/verified-numbers.md). It does.
     ============================================================ */
  function vizEntanglement(canvas, controls) {
    const touchOnly = window.matchMedia('(hover: none)').matches;
    const ro = readout(controls);
    let bA, bB, bTilt;

    const ANGLES = [0, 60, 120];
    const COMBOS = [[0, 1], [1, 2], [0, 2]];
    const pSame = (dDeg) => Math.sin(((dDeg * Math.PI) / 180) / 2) ** 2;
    const ACT_DUR = [14, 22];

    let act = 0, actStart = 0;
    // act 1 — matched detectors
    let pair = null, pairs = 0, opposite = 0;
    let posA = null, posB = null, lastUser = -99;
    // act 2 — tilted detectors
    let tally = null, nextShot = 0, shot = null, brokenAt = null;

    function syncRo() {
      if (act === 0) {
        ro.textContent = pairs
          ? `PAIRS: ${pairs} · LANDED OPPOSITE: ${opposite}/${pairs} — EVERY TIME`
          : 'IT RUNS ITSELF — OR LOOK AT A COIN YOURSELF';
      } else {
        const pct = (i) => (tally[i].n ? Math.round((100 * tally[i].same) / tally[i].n) : 0);
        const total = tally[0].n + tally[1].n + tally[2].n;
        ro.textContent = `${total} PAIRS · SAME AT 60° APART: ${pct(0)}% & ${pct(1)}% · AT 120°: ${pct(2)}% · ANY LOCAL SHEET: ≤ ${Math.min(100, pct(0) + pct(1))}%`;
      }
    }

    function setAct(i, t) {
      act = ((i % 2) + 2) % 2;
      actStart = t;
      if (act === 0) { pair = null; pairs = 0; opposite = 0; }
      else { tally = COMBOS.map(() => ({ n: 0, same: 0 })); nextShot = t + 0.7; shot = null; brokenAt = null; }
      if (bTilt) bTilt.textContent = act === 0 ? 'Tilt the detectors' : 'Matched detectors again';
      if (bA) { bA.disabled = act === 1; bB.disabled = act === 1; }
      syncRo();
    }

    function newPair(t) {
      pair = { born: t, measured: false, mT: 0, fA: '', fB: '', ph: rand(0, TAU) };
      if (bA && act === 0) { bA.disabled = false; bB.disabled = false; }
    }

    function look(which, t) {
      if (act !== 0 || !pair || pair.measured) return;
      pair.measured = true;
      pair.mT = t;
      pair.fA = Math.random() < 0.5 ? 'H' : 'T';
      pair.fB = pair.fA === 'H' ? 'T' : 'H';
      pair.by = which;
      pairs++; opposite++;
      syncRo();
      bA.disabled = true; bB.disabled = true;
    }

    function drawCoin(ctx, x, y, face, measured, t, isTrigger) {
      ctx.save();
      ctx.translate(x, y);
      const R = 17;
      if (!measured) {
        // still spinning: no face exists yet
        const sx = Math.max(Math.abs(Math.cos(t * 4 + pair.ph)), 0.08);
        ctx.save();
        ctx.scale(sx, 1);
        ctx.strokeStyle = PAPER;
        ctx.lineWidth = 2 / sx;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
        ctx.restore();
        const f = Math.cos(t * 4 + pair.ph) > 0 ? 'H' : 'T';
        ctx.globalAlpha = 0.35 * sx;
        ctx.fillStyle = PAPER;
        ctx.font = MONO(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(f, 0, 1);
        ctx.globalAlpha = 1;
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = DIM; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, R + 8, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const col = isTrigger ? GOLD : PH;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
        ctx.fillStyle = col;
        ctx.font = MONO(16); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(face, 0, 1);
        ctx.font = MONO(8);
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(face === 'H' ? 'HEADS' : 'TAILS', 0, R + 18);
      }
      ctx.restore();
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 1;
    }

    /* act-2 widgets: a coin that has already landed, and the dial
       showing which of the three questions is being asked */
    function miniCoin(ctx, x, y, face, same) {
      const col = same ? GOLD : PH;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = col; ctx.font = MONO(12); ctx.textBaseline = 'middle';
      ctx.fillText(face, x, y + 1);
      ctx.textBaseline = 'alphabetic';
    }

    function dial(ctx, x, y, deg) {
      for (const a of ANGLES) {
        const th = ((a - 90) * Math.PI) / 180;
        ctx.strokeStyle = FAINT;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(th) * 19, y + Math.sin(th) * 19);
        ctx.lineTo(x + Math.cos(th) * 26, y + Math.sin(th) * 26);
        ctx.stroke();
      }
      const th = ((deg - 90) * Math.PI) / 180;
      ctx.strokeStyle = PAPER; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(th) * 16, y + Math.sin(th) * 16);
      ctx.lineTo(x + Math.cos(th) * 27, y + Math.sin(th) * 27);
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    function drawAct1(ctx, W, H, t) {
      if (!pair) newPair(t);
      const age = t - pair.born;
      const cy = H * 0.44;
      const sep = Math.min(easeOut(Math.min(age / 4.5, 1)) * (W * 0.42), W * 0.42);
      const xA = W / 2 - 30 - sep, xB = W / 2 + 30 + sep;
      posA = { x: xA, y: cy }; posB = { x: xB, y: cy };

      // the experiment demonstrates itself when nobody intervenes
      if (!pair.measured && age > 3.5 && t - lastUser > 6) {
        look(Math.random() < 0.5 ? 'A' : 'B', t);
      }

      // channel
      ctx.strokeStyle = FAINT;
      ctx.setLineDash([1, 5]);
      ctx.beginPath(); ctx.moveTo(xA, cy); ctx.lineTo(xB, cy); ctx.stroke();
      ctx.setLineDash([]);

      const m = pair.measured;
      if (m) {
        const dt = t - pair.mT;
        if (dt < 0.8) {
          const r = easeOut(dt / 0.8) * 46;
          ctx.globalAlpha = 1 - dt / 0.8;
          for (const x of [xA, xB]) {
            ctx.strokeStyle = GOLD;
            ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        if (dt > 2.4) newPair(t);
      }

      drawCoin(ctx, xA, cy, pair.fA, m, t, pair.by === 'A');
      drawCoin(ctx, xB, cy, pair.fB, m, t, pair.by === 'B');

      const ly = (sep * 2 + 60) / 10;
      ctx.fillStyle = DIM; ctx.font = MONO(10); ctx.textAlign = 'center';
      ctx.fillText('TWO COINS FROM THE SAME QUANTUM MINT — STILL SPINNING', W / 2, H * 0.72);
      ctx.fillText(`SEPARATION: ${ly.toFixed(1)} LIGHT-YEARS (PRETEND)`, W / 2, H * 0.82);
      ctx.fillText('A', xA, cy - 34);
      ctx.fillText('B', xB, cy - 34);
      if (m && t - pair.mT < 2.4) {
        ctx.fillStyle = GOLD;
        ctx.fillText('BOTH LANDED. OPPOSITE. NO SIGNAL TRAVELLED.', W / 2, H * 0.14);
      } else if (!m) {
        ctx.fillStyle = DIM;
        ctx.fillText(touchOnly ? 'TAP A COIN — OR JUST WATCH' : 'CLICK A COIN — OR JUST WATCH', W / 2, H * 0.14);
      }
      if (pairs >= 2) {
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('NO MYSTERY YET — SEPARATED GLOVES DO THIS. MAYBE EACH PAIR CARRIES AN ANSWER SHEET.', W / 2, H * 0.93);
      }
    }

    function drawAct2(ctx, W, H, t, age) {
      const cy = H * 0.3;
      const xA = W * 0.14, xB = W * 0.86;

      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.fillText('THREE QUESTIONS PER COIN — 0°, 60°, 120°. AN ANSWER SHEET CAPS BAR 3 AT BAR 1 + BAR 2.', W / 2, H * 0.115);

      // a tick of fresh pairs, asked two tilted questions — the mint
      // streams 8 pairs per tick (the dials show the last of them)
      if (t > nextShot) {
        nextShot = t + 0.3;
        const ci = (tally[0].n + tally[1].n + tally[2].n) / 8 % 3 | 0;
        const [i0, i1] = COMBOS[ci];
        const p = pSame(Math.abs(ANGLES[i0] - ANGLES[i1]));
        let same = false;
        for (let k = 0; k < 8; k++) {
          same = Math.random() < p;
          tally[ci].n++; if (same) tally[ci].same++;
        }
        const flip = Math.random() < 0.5;
        const fA = Math.random() < 0.5 ? 'H' : 'T';
        shot = {
          ci, aIdx: flip ? i1 : i0, bIdx: flip ? i0 : i1,
          fA, fB: same ? fA : (fA === 'H' ? 'T' : 'H'), same,
        };
        syncRo();
      }

      // channel
      ctx.strokeStyle = FAINT; ctx.setLineDash([1, 5]);
      ctx.beginPath(); ctx.moveTo(xA + 34, cy); ctx.lineTo(xB - 34, cy); ctx.stroke();
      ctx.setLineDash([]);

      dial(ctx, xA, cy, shot ? ANGLES[shot.aIdx] : 0);
      dial(ctx, xB, cy, shot ? ANGLES[shot.bIdx] : 0);
      if (shot) {
        miniCoin(ctx, xA, cy, shot.fA, shot.same);
        miniCoin(ctx, xB, cy, shot.fB, shot.same);
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText(`ASKED AT ${ANGLES[shot.aIdx]}°`, xA, cy + 46);
        ctx.fillText(`ASKED AT ${ANGLES[shot.bIdx]}°`, xB, cy + 46);
        ctx.fillStyle = shot.same ? GOLD : PH; ctx.font = MONO(10);
        ctx.fillText(shot.same ? 'SAME' : 'OPPOSITE', W / 2, cy - 12);
      }

      // the tally — three bars and the sheet limit
      const baseY = H * 0.84, maxH = H * 0.36, bw = W * 0.11;
      const cxs = [W * 0.33, W * 0.5, W * 0.67];
      const pcts = tally.map((c) => (c.n ? c.same / c.n : 0));
      const ceil = Math.min(1, pcts[0] + pcts[1]);
      const minN = Math.min(tally[0].n, tally[1].n, tally[2].n);
      const over = minN >= 24 && pcts[2] > ceil;
      for (let i = 0; i < 3; i++) {
        const hgt = pcts[i] * maxH;
        ctx.fillStyle = i === 2 && over ? GOLD : PH;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(cxs[i] - bw / 2, baseY - hgt, bw, hgt);
        ctx.globalAlpha = 1;
        ctx.fillStyle = DIM; ctx.font = MONO(8);
        ctx.fillText(['0° vs 60°', '60° vs 120°', '0° vs 120°'][i], cxs[i], baseY + 13);
        if (tally[i].n) {
          ctx.fillStyle = i === 2 && over ? GOLD : PAPER; ctx.font = MONO(9);
          ctx.fillText(`SAME ${Math.round(pcts[i] * 100)}%`, cxs[i], baseY - hgt - 6);
        }
      }
      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(W * 0.24, baseY); ctx.lineTo(W * 0.76, baseY); ctx.stroke();

      if (minN >= 24) {
        const y = baseY - ceil * maxH;
        ctx.strokeStyle = PAPER;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(cxs[2] - bw * 0.9, y); ctx.lineTo(cxs[2] + bw * 0.9, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = PAPER; ctx.font = MONO(8); ctx.textAlign = 'left';
        ctx.fillText('ANY SHEET: ≤ THIS', cxs[2] + bw * 0.9 + 6, y + 3);
        ctx.textAlign = 'center';
      }

      // say the impossible part while the bar is over the line
      if (brokenAt === null && (over && pcts[2] > ceil + 0.03 || (age > 16 && over))) brokenAt = t;
      if (brokenAt !== null && over) {
        ctx.fillStyle = GOLD; ctx.font = MONO(10);
        ctx.fillText('BAR 3 PASSES THE SHEET LIMIT — NO LOCAL, PRE-WRITTEN ANSWERS SURVIVE (BELL, 1964)', W / 2, H * 0.95);
      }
    }

    function draw(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const age = t - actStart;
      if (act === 0 && ((age > ACT_DUR[0] && pairs >= 2 && pair && pair.measured && t - pair.mT > 2) || age > ACT_DUR[0] + 8)) {
        setAct(1, t);
      } else if (act === 1 && age > ACT_DUR[1]) {
        setAct(0, t);
      }

      ctx.textAlign = 'center'; ctx.font = MONO(9); ctx.fillStyle = DIM;
      ctx.fillText(act === 0
        ? 'ACT 1 OF 2 — ASK BOTH COINS THE SAME QUESTION'
        : 'ACT 2 OF 2 — TILT THE QUESTIONS', W / 2, H * 0.055);

      if (act === 0) drawAct1(ctx, W, H, t);
      else drawAct2(ctx, W, H, t, t - actStart);
      ctx.textAlign = 'left';
    }

    const st = stage(canvas, draw, 16 / 9);

    const near = (p, x, y) => p && (x - p.x) ** 2 + (y - p.y) ** 2 < 34 * 34;
    const canvasXY = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onClick = (e) => {
      if (act !== 0 || !pair || pair.measured) return;
      const [x, y] = canvasXY(e);
      if (near(posA, x, y)) { lastUser = st.now(); look('A', st.now()); st.pulse(3); }
      else if (near(posB, x, y)) { lastUser = st.now(); look('B', st.now()); st.pulse(3); }
    };
    const onMove = (e) => {
      const [x, y] = canvasXY(e);
      const hot = act === 0 && pair && !pair.measured && (near(posA, x, y) || near(posB, x, y));
      canvas.style.cursor = hot ? 'pointer' : '';
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('pointermove', onMove);

    bA = btn(controls, 'Look at coin A', () => { lastUser = st.now(); look('A', st.now()); st.pulse(3); });
    bB = btn(controls, 'Look at coin B', () => { lastUser = st.now(); look('B', st.now()); st.pulse(3); });
    bTilt = btn(controls, 'Tilt the detectors', () => { setAct(act + 1, st.now()); st.pulse(10); });
    ro.textContent = 'IT RUNS ITSELF — OR LOOK AT A COIN YOURSELF';
    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('pointermove', onMove);
      canvas.style.cursor = '';
      st.destroy();
    };
  }

  /* ============================================================
     03 — WAVE–PARTICLE DUALITY
     Single particles through two slits build an interference
     pattern — until you watch which slit they take.
     ============================================================ */
  function vizDuality(canvas, controls) {
    let watching = false;
    let flying = [];   // {p: 0..1, slit, yT, speed}
    let hits = [];     // {y, age}
    let bins = null, nHits = 0;
    let prevBins = null, prevWatching = null;  // ghost of the other regime
    let lastToggle = 0, toggleFlash = -99, contrastAt = null, tb = null;
    let fast = false;
    const NB = 64;
    const ro = readout(controls);

    function setWatching(w, t) {
      if (bins && nHits > 40) { prevBins = bins; prevWatching = watching; }
      watching = w;
      // a ghost that matches the live regime is no contrast at all
      if (prevBins && prevWatching === watching) prevBins = null;
      if (tb) {
        tb.textContent = 'Which-path detector: ' + (watching ? 'on' : 'off');
        tb.setAttribute('aria-pressed', watching);
      }
      bins = null; hits = []; nHits = 0; flying = [];
      toggleFlash = t; contrastAt = null;
    }

    function targetY(H) {
      const cy = H / 2, envA = H * 0.30;
      for (let i = 0; i < 60; i++) {
        const y = rand(H * 0.08, H * 0.92);
        const u = (y - cy) / envA;
        let p;
        if (watching) {
          const s = H * 0.11;
          p = Math.exp(-((y - (cy - H * 0.13)) ** 2) / (2 * s * s)) +
              Math.exp(-((y - (cy + H * 0.13)) ** 2) / (2 * s * s));
          p /= 1.2;
        } else {
          p = Math.cos(u * 9) ** 2 * Math.exp(-u * u);
        }
        if (Math.random() < p) return y;
      }
      return cy;
    }

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);

      // the detector switches itself so the lesson plays out unattended
      if (t - lastToggle > 16 && t > 1) { lastToggle = t; setWatching(!watching, t); }

      if (!bins) bins = new Float32Array(NB);
      const srcX = W * 0.06, barX = W * 0.4, scrX = W * 0.8;
      const cy = H / 2, slitGap = H * 0.13;
      const slitY = [cy - slitGap, cy + slitGap];

      // emitter
      ctx.fillStyle = PAPER;
      ctx.beginPath(); ctx.arc(srcX, cy, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.textAlign = 'center';
      ctx.fillText('SOURCE', srcX, cy + 22);
      ctx.fillText('ONE AT A TIME', srcX + 26, cy + 34);
      ctx.fillText('SCREEN', scrX, H * 0.055);
      ctx.textAlign = 'left';

      // barrier with two slits
      ctx.strokeStyle = PAPER; ctx.lineWidth = 3;
      const g = 9;
      const segs = [[H * 0.06, slitY[0] - g], [slitY[0] + g, slitY[1] - g], [slitY[1] + g, H * 0.94]];
      for (const [a, b] of segs) {
        ctx.beginPath(); ctx.moveTo(barX, a); ctx.lineTo(barX, b); ctx.stroke();
      }
      ctx.lineWidth = 1;

      // which-path detectors
      if (watching) {
        for (const sy of slitY) {
          ctx.strokeStyle = GOLD;
          ctx.beginPath(); ctx.arc(barX + 12, sy, 6, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(barX + 12, sy, 2, 0, TAU);
          ctx.fillStyle = GOLD; ctx.fill();
        }
        ctx.fillStyle = GOLD; ctx.font = MONO(9);
        ctx.fillText('DETECTORS ON — THE PATH CAN BE KNOWN', barX + 24, H * 0.09);
      } else {
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('NOBODY WATCHING — THE PATH CANNOT BE KNOWN', barX + 24, H * 0.09);
      }

      // screen
      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(scrX, H * 0.06); ctx.lineTo(scrX, H * 0.94); ctx.stroke();

      // emit — briskly; the pattern is the point, not the wait
      const rate = fast ? 110 : 30;
      if (Math.random() < dt * rate && flying.length < (fast ? 60 : 40)) {
        flying.push({ p: 0, slit: Math.random() < 0.5 ? 0 : 1, yT: targetY(H), speed: fast ? rand(1.7, 2.3) : rand(0.9, 1.3) });
      }

      // fly
      for (const f of flying) {
        f.p += dt * f.speed;
        let x, y;
        if (f.p < 0.5) {
          const k = f.p / 0.5;
          x = lerp(srcX, barX, k);
          y = lerp(cy, slitY[f.slit], easeOut(k));
        } else {
          const k = (f.p - 0.5) / 0.5;
          x = lerp(barX, scrX, k);
          y = lerp(slitY[f.slit], f.yT, easeOut(k));
        }
        if (f.p >= 1) {
          hits.push({ y: f.yT + rand(-1.5, 1.5), age: 0 });
          const bi = clamp(Math.floor((f.yT / H) * NB), 0, NB - 1);
          bins[bi]++; nHits++;
          if (hits.length > 900) hits.shift();
          continue;
        }
        ctx.fillStyle = watching && f.p > 0.45 ? GOLD : PH;
        ctx.shadowColor = PH; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
      flying = flying.filter((f) => f.p < 1);

      // accumulated hits on screen
      for (const h of hits) {
        h.age += dt;
        ctx.fillStyle = PH;
        ctx.globalAlpha = clamp(0.85 - h.age * 0.02, 0.25, 0.85);
        ctx.fillRect(scrX + 2, h.y, 2, 2);
      }
      ctx.globalAlpha = 1;

      // current histogram, solid
      let bmax = 1;
      for (const v of bins) if (v > bmax) bmax = v;
      const hw = W - scrX - 14;
      ctx.fillStyle = PH;
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < NB; i++) {
        const bh = (bins[i] / bmax) * hw;
        ctx.fillRect(scrX + 6, (i / NB) * H, bh, H / NB - 1);
      }
      ctx.globalAlpha = 1;

      // ghost of the OTHER regime — both facts on screen at once
      if (prevBins) {
        let pmax = 1;
        for (const v of prevBins) if (v > pmax) pmax = v;
        ctx.strokeStyle = prevWatching ? GOLD : PAPER;
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let i = 0; i < NB; i++) {
          const x = scrX + 6 + (prevBins[i] / pmax) * hw;
          const y = ((i + 0.5) / NB) * H;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.font = MONO(8); ctx.textAlign = 'right';
        ctx.fillStyle = PH;
        ctx.fillText(watching ? 'NOW: TWO BANDS' : 'NOW: FRINGES', W - 8, H * 0.045);
        ctx.fillStyle = prevWatching ? GOLD : PAPER;
        ctx.fillText(prevWatching ? 'BEFORE: WATCHED' : 'BEFORE: UNWATCHED', W - 8, H * 0.045 + 12);
        ctx.textAlign = 'left';
      }

      // brief cue at the switch itself
      if (t - toggleFlash < 2.2) {
        ctx.fillStyle = DIM; ctx.font = MONO(10); ctx.textAlign = 'center';
        ctx.fillText(watching ? 'DETECTOR ON — STARTING OVER' : 'DETECTOR OFF — STARTING OVER', W / 2, H * 0.965);
        ctx.textAlign = 'left';
      }

      // the paradox line waits until the contrast is actually on screen
      if (prevBins && contrastAt === null && nHits > 120) contrastAt = t;
      if (contrastAt !== null && t - contrastAt < 7) {
        ctx.fillStyle = GOLD; ctx.font = MONO(10); ctx.textAlign = 'center';
        ctx.fillText('SAME SLITS. SAME PARTICLES. ONLY DIFFERENCE: COULD THE PATH BE KNOWN?', W / 2, H * 0.965);
        ctx.textAlign = 'left';
      }

      ro.textContent = `DETECTED: ${nHits} · EACH ARRIVED ALONE — YET THEY CONSPIRE`;
    }

    const st = stage(canvas, draw, 16 / 9);
    tb = btn(controls, 'Which-path detector: off', () => {
      lastToggle = st.now();
      setWatching(!watching, st.now());
      st.pulse(6);
    });
    tb.setAttribute('aria-pressed', 'false');
    const fb = btn(controls, 'Fast-forward: off', () => {
      fast = !fast;
      fb.textContent = 'Fast-forward: ' + (fast ? 'on' : 'off');
      fb.setAttribute('aria-pressed', fast);
      st.pulse(8);
    });
    fb.setAttribute('aria-pressed', 'false');
    btn(controls, 'Clear screen', () => { bins = null; hits = []; nHits = 0; flying = []; prevBins = null; contrastAt = null; st.pulse(6); });
    return () => st.destroy();
  }

  /* ============================================================
     04 — QUANTUM–CLASSICAL BOUNDARY
     One object in two places. The environment keeps looking.
     ============================================================ */
  function vizBoundary(canvas, controls) {
    // same rules at every size — only the bookkeeping changes
    const STAGES = [
      { name: 'AN ELECTRON',    R: 10, rate: 5,  hitCost: 0,     dur: 7,  life: 'AS LONG AS YOU KEEP THE WORLD OUT' },
      { name: 'A C\u2086\u2080 MOLECULE', R: 16, rate: 18, hitCost: 0.012, dur: 10, life: 'MILLISECONDS, IN HIGH VACUUM (SLOWED)' },
      { name: 'A DUST GRAIN',   R: 24, rate: 36, hitCost: 0.05,  dur: 8,  life: '10\u207b\u00b3\u00b9 s IN AIR (SLOWED)' },
      { name: 'A CAT',          R: 34, rate: 80, hitCost: 0.22,  dur: 6,  life: 'IT NEVER EVEN BEGINS' },
    ];
    let si = 0, coherence = 1, chosen = Math.random() < 0.5 ? 0 : 1, collisions = 0;
    let env = [], stageStart = 0, deadSince = null;
    const ro = readout(controls);

    function startStage(i, t) {
      si = ((i % STAGES.length) + STAGES.length) % STAGES.length;
      coherence = 1; collisions = 0; env = [];
      chosen = Math.random() < 0.5 ? 0 : 1;
      stageStart = t; deadSince = null;
    }

    function objIcon(ctx, x, y, R, kind, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = PAPER; ctx.fillStyle = PAPER; ctx.lineWidth = 1.2;
      if (kind === 0) {
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
      } else if (kind === 1) {
        for (let k = 0; k < 6; k++) {
          const a2 = (k / 6) * TAU;
          ctx.beginPath(); ctx.arc(x + Math.cos(a2) * R * 0.45, y + Math.sin(a2) * R * 0.45, 1.8, 0, TAU); ctx.fill();
        }
      } else if (kind === 2) {
        const pts = [[-0.3, -0.2], [0.25, -0.35], [0.4, 0.15], [-0.1, 0.35], [-0.45, 0.1]];
        for (const [px2, py2] of pts) {
          ctx.beginPath(); ctx.arc(x + px2 * R, y + py2 * R, 1.6, 0, TAU); ctx.fill();
        }
      } else {
        // the cat, at last: ears, eyes, whiskers, nose
        ctx.beginPath();
        ctx.moveTo(x - R * 0.62, y - R * 0.55);
        ctx.lineTo(x - R * 0.48, y - R * 1.02);
        ctx.lineTo(x - R * 0.18, y - R * 0.72);
        ctx.moveTo(x + R * 0.62, y - R * 0.55);
        ctx.lineTo(x + R * 0.48, y - R * 1.02);
        ctx.lineTo(x + R * 0.18, y - R * 0.72);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(x - R * 0.28, y - R * 0.12, 1.8, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(x + R * 0.28, y - R * 0.12, 1.8, 0, TAU); ctx.fill();
        ctx.beginPath();
        for (const s of [-1, 1]) {
          for (const wy of [0.12, 0.24]) {
            ctx.moveTo(x + s * R * 0.18, y + R * wy);
            ctx.lineTo(x + s * R * 0.85, y + R * (wy - 0.05));
          }
        }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y + R * 0.12, 1.5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      const S = STAGES[si];
      const cy = H * 0.52, R = Math.min(H * 0.16, S.R);
      const xs = [W * 0.36, W * 0.64];
      const age = t - stageStart;

      // the ladder climbs itself — and never stalls
      if (S.hitCost === 0 && age > S.dur) startStage(si + 1, t);
      if (S.hitCost > 0 && age > S.dur && coherence > 0.02) {
        coherence = Math.max(0, coherence - dt * 0.5);
      }
      if (coherence <= 0.02) {
        if (deadSince === null) deadSince = t;
        else if (t - deadSince > 3.2) startStage(si + 1, t);
      }

      // interference fringes between the two positions, \u221d coherence
      if (coherence > 0.02) {
        ctx.save();
        for (let x = xs[0] - R; x <= xs[1] + R; x += 7) {
          const v = Math.cos((x - xs[0]) * 0.24 + t * 1.4) ** 2;
          ctx.fillStyle = PH;
          ctx.globalAlpha = coherence * 0.28 * v;
          ctx.fillRect(x, cy - R * 1.5, 2.4, R * 3);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // the object, in superposition
      for (let i = 0; i < 2; i++) {
        const a = i === chosen ? 0.5 + (1 - coherence) * 0.45 : 0.5 * coherence + 0.03;
        ctx.globalAlpha = a;
        const grad = ctx.createRadialGradient(xs[i], cy, 2, xs[i], cy, R);
        grad.addColorStop(0, PAPER);
        grad.addColorStop(1, 'rgba(233,228,214,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(xs[i], cy, R, 0, TAU); ctx.fill();
        ctx.globalAlpha = Math.min(1, a + 0.15);
        ctx.strokeStyle = PAPER;
        ctx.beginPath(); ctx.arc(xs[i], cy, R, 0, TAU); ctx.stroke();
        objIcon(ctx, xs[i], cy, R, si, Math.min(1, a + 0.15));
      }
      ctx.globalAlpha = 1;

      // environment particles — the constant, unavoidable audience
      if (Math.random() < dt * S.rate && env.length < 110) {
        const side = Math.floor(rand(0, 4));
        let x, y, vx, vy;
        const s = rand(40, 95);
        if (side === 0) { x = -5; y = rand(0, H); vx = s; vy = rand(-20, 20); }
        else if (side === 1) { x = W + 5; y = rand(0, H); vx = -s; vy = rand(-20, 20); }
        else if (side === 2) { x = rand(0, W); y = -5; vx = rand(-20, 20); vy = s; }
        else { x = rand(0, W); y = H + 5; vx = rand(-20, 20); vy = -s; }
        env.push({ x, y, vx, vy, hit: false });
      }
      for (const p of env) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (!p.hit && S.hitCost > 0) {
          for (let i = 0; i < 2; i++) {
            const dx = p.x - xs[i], dy = p.y - cy;
            if (dx * dx + dy * dy < R * R) {
              p.hit = true;
              const ang = Math.atan2(dy, dx) + rand(-0.6, 0.6);
              const sp = Math.hypot(p.vx, p.vy);
              p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp;
              if (coherence > 0) { coherence = Math.max(0, coherence - S.hitCost); collisions++; }
            }
          }
        }
        ctx.fillStyle = p.hit ? GOLD : DIM;
        ctx.globalAlpha = p.hit ? 0.9 : 0.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      env = env.filter((p) => p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20);

      // story labels
      ctx.font = MONO(10); ctx.textAlign = 'center';
      ctx.fillStyle = PAPER;
      ctx.fillText(S.name + ' \u2014 IN TWO PLACES AT ONCE', W / 2, H * 0.08);
      ctx.fillStyle = DIM;
      const line = S.hitCost === 0
        ? 'ALMOST NOTHING TOUCHES IT \u2014 AND WHAT DOES, LEARNS ALMOST NOTHING'
        : coherence > 0.65 ? 'EVERY STRAY PARTICLE THAT TOUCHES IT CARRIES THE SECRET AWAY\u2026'
        : coherence > 0.05 ? 'THE WORLD IS FINDING OUT WHERE IT IS'
        : 'GONE CLASSICAL. NOTHING CHOSE THIS SIDE \u2014 SO WHY THIS ONE?';
      ctx.fillText(line, W / 2, H * 0.08 + 16);
      ctx.fillStyle = GOLD;
      ctx.fillText('SAME LAWS AT EVERY SIZE \u2014 NO EDGE HAS EVER BEEN FOUND', W / 2, H * 0.96);
      ctx.textAlign = 'left';

      ro.textContent = `OBJECT: ${S.name} \u00b7 COHERENCE ${(coherence * 100).toFixed(0)}% \u00b7 SURVIVES: ${S.life}`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Bigger object', () => { startStage(si + 1, st.now()); st.pulse(7); });
    btn(controls, 'Fresh superposition', () => { startStage(si, st.now()); st.pulse(7); });
    return () => st.destroy();
  }

  /* ============================================================
     05 — IS THE WAVEFUNCTION REAL?
     Act 1: the same ψ drawn twice — a thing, and knowledge.
     Act 2: where does ψ even live? One particle's wave fits on a
     line, two need a square, three a cube — configuration space
     outgrows ordinary space at N = 2. (The atlas's own visual;
     see docs/inferences.md.)
     ============================================================ */
  function vizPsi(canvas, controls) {
    const ro = readout(controls);
    const ACT_DUR = [18, 17];
    let act = 0, actStart = 0;
    let bMeasure, bWhere;
    let collapse = null;
    let lastMeasure = 0;
    const dots = [];
    for (let i = 0; i < 260; i++) dots.push({ u: Math.random(), v: Math.random(), tw: rand(0, TAU) });

    function setAct(i, t) {
      act = ((i % 2) + 2) % 2;
      actStart = t;
      collapse = null;
      if (act === 0) lastMeasure = t - 4;
      if (bWhere) bWhere.textContent = act === 0 ? 'Where does ψ live?' : 'Back to the two stories';
      if (bMeasure) bMeasure.disabled = act === 1;
      ro.textContent = act === 0
        ? 'SAME MATHEMATICS. TWO READINGS.'
        : 'ONE WAVE FOR ALL PARTICLES — IN A SPACE THAT GROWS WITH EVERY ONE';
    }

    function p(x, t) {
      const c1 = 0.35 + 0.1 * Math.sin(t * 0.5), c2 = 0.68 + 0.08 * Math.sin(t * 0.36 + 2);
      return 0.85 * Math.exp(-((x - c1) ** 2) / 0.012) + 0.7 * Math.exp(-((x - c2) ** 2) / 0.02);
    }

    // inverse-CDF sample (rough)
    function sampleX(t) {
      for (let i = 0; i < 40; i++) {
        const x = Math.random();
        if (Math.random() < p(x, t)) return x;
      }
      return 0.5;
    }

    function drawAct1(ctx, W, H, t) {
      const mid = W / 2;
      const base = H * 0.82, top = H * 0.3;

      // measures itself if nobody presses anything
      if (!collapse && t - actStart > 3 && t - lastMeasure > 8) {
        lastMeasure = t;
        collapse = { x0: sampleX(t), t0: t };
      }

      // k drives the left (ontic) story: an eased, physical snap.
      // kR drives the right (epistemic) story: no process at all — one frame
      // you believed the spread, the next frame you know the point.
      let k = 0, kR = 0, x0 = 0.5;
      if (collapse) {
        const dt = t - collapse.t0;
        x0 = collapse.x0;
        if (dt < 0.5) k = easeOut(dt / 0.5);
        else if (dt < 1.4) k = 1;
        else if (dt < 3) k = 1 - easeOut((dt - 1.4) / 1.6);
        else collapse = null;
        if (collapse) kR = dt < 1.4 ? (dt > 0.15 ? 1 : 0) : k;
      }

      function blended(x) {
        const spike = Math.exp(-((x - x0) ** 2) / (2 * 0.004 ** 2 + 0.0002));
        return lerp(clamp(p(x, t), 0, 1), spike, k);
      }

      // divider
      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(mid, H * 0.08); ctx.lineTo(mid, H * 0.92); ctx.stroke();

      ctx.font = MONO(10); ctx.textAlign = 'center';
      ctx.fillStyle = PAPER;
      ctx.fillText('ONE WAVE, TWO STORIES — NOBODY KNOWS WHICH IS TRUE', mid, H * 0.1);
      ctx.fillStyle = PH; ctx.fillText('STORY 1 — ψ IS A REAL THING', mid / 2, H * 0.16);
      ctx.fillStyle = GOLD; ctx.fillText('STORY 2 — ψ IS ONLY WHAT WE KNOW', mid + mid / 2, H * 0.16);
      ctx.font = MONO(9);
      ctx.fillStyle = DIM;
      ctx.fillText('a ghostly field, really out there', mid / 2, H * 0.16 + 14);
      ctx.fillText('a ledger of our ignorance', mid + mid / 2, H * 0.16 + 14);
      ctx.fillText('to change, it must physically jump', mid / 2, H * 0.95);
      ctx.fillText('to change, you only need to learn', mid + mid / 2, H * 0.95);
      ctx.textAlign = 'left';

      // LEFT: ontic ribbon
      const LW = mid - 30;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const x = i / 120;
        const px = 15 + x * LW, py = base - blended(x) * (base - top);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = PH; ctx.lineWidth = 3;
      ctx.shadowColor = PH; ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 1;

      // RIGHT: epistemic cloud — density of belief
      for (const d of dots) {
        const x = d.u;
        const ph = kR > 0 ?
          lerp(clamp(p(x, t), 0, 1), Math.abs(x - x0) < 0.03 ? 1 : 0, kR) :
          clamp(p(x, t), 0, 1);
        const px = mid + 15 + x * LW;
        // vertical scatter within the envelope
        const py = base - d.v * ph * (base - top);
        const a = ph < 0.03 ? 0 : 0.25 + 0.45 * Math.abs(Math.sin(t * 2 + d.tw));
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = GOLD;
        ctx.fillRect(px, py, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;

      // the same event, told two ways — said out loud while it happens
      if (k > 0.25 && collapse) {
        const cdt = t - collapse.t0;
        if (cdt < 0.9) {
          const leftX = 15 + x0 * LW, ringY = base - (base - top) * 0.6;
          ctx.strokeStyle = PH;
          ctx.globalAlpha = (1 - cdt / 0.9) * 0.8;
          ctx.beginPath(); ctx.arc(leftX, ringY, 6 + easeOut(cdt / 0.9) * 40, 0, TAU); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.textAlign = 'center'; ctx.font = MONO(9);
        ctx.fillStyle = PH;
        ctx.fillText('THE FIELD SNAPPED — EVERYWHERE AT ONCE', mid / 2, H * 0.24);
        ctx.fillStyle = GOLD;
        ctx.fillText('NOTHING MOVED — A MIND UPDATED', mid + mid / 2, H * 0.24);
        ctx.font = MONO(11);
        ctx.fillStyle = PAPER;
        ctx.fillText('SAME EVENT — WHICH STORY IS TRUE?', mid, H * 0.28);
        ctx.textAlign = 'left';
      }
    }

    /* act 2 — the wave that outgrew space */
    function wanderBlob(ctx, cx, cy, rx, ry, t, ph) {
      const r = Math.min(rx, ry) * 0.55;
      if (r < 2) return; // panel still growing in
      const bx = cx + Math.sin(t * 0.7 + ph) * rx * 0.45;
      const by = cy + Math.cos(t * 0.53 + ph * 2) * ry * 0.45;
      const g = ctx.createRadialGradient(bx, by, 1, bx, by, r);
      g.addColorStop(0, 'rgba(110,243,193,0.7)');
      g.addColorStop(1, 'rgba(110,243,193,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fill();
    }

    function drawAct2(ctx, W, H, t, age) {
      ctx.textAlign = 'center';
      ctx.font = MONO(10); ctx.fillStyle = PAPER;
      ctx.fillText('PUT EACH PARTICLE ON A WIRE. WHERE DOES THEIR ONE WAVE LIVE?', W / 2, H * 0.12);
      ctx.font = MONO(9); ctx.fillStyle = DIM;
      ctx.fillText('NOT ONE WAVE PER PARTICLE, IN OUR SPACE — ONE WAVE FOR ALL OF THEM, IN A SPACE THAT GROWS', W / 2, H * 0.12 + 14);

      const cy = H * 0.5;
      const s = Math.min(W * 0.2, H * 0.42);
      const xs = [W * 0.18, W * 0.5, W * 0.82];
      const on = [age > 0.4, age > 4, age > 7.6];
      const labels = [
        ['1 PARTICLE', 'ψ LIVES ON A LINE'],
        ['2 PARTICLES', 'ONE WAVE ON A SQUARE'],
        ['3 PARTICLES', 'ONE WAVE IN A CUBE'],
      ];

      for (let i = 0; i < 3; i++) {
        if (!on[i]) continue;
        const cx = xs[i];
        const grow = easeOut(clamp((age - [0.4, 4, 7.6][i]) / 0.9, 0, 1));
        ctx.save();
        ctx.globalAlpha = grow;
        ctx.strokeStyle = PAPER;
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(cx - (s / 2) * grow, cy); ctx.lineTo(cx + (s / 2) * grow, cy);
          ctx.stroke();
          // the wave on it
          ctx.strokeStyle = PH; ctx.lineWidth = 2;
          ctx.beginPath();
          for (let k2 = 0; k2 <= 40; k2++) {
            const u = k2 / 40;
            const px = cx - s / 2 + u * s;
            const env = Math.exp(-((u - (0.5 + 0.25 * Math.sin(t * 0.7))) ** 2) / 0.02);
            const py = cy - env * s * 0.22;
            k2 ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.stroke(); ctx.lineWidth = 1;
        } else if (i === 1) {
          const half = (s / 2) * grow;
          ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
          wanderBlob(ctx, cx, cy, s / 2 - 6, s / 2 - 6, t, 1.1);
          ctx.font = MONO(8); ctx.fillStyle = DIM;
          ctx.fillText('particle 1 →', cx, cy + half + 12);
          ctx.save();
          ctx.translate(cx - half - 8, cy);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText('particle 2 →', 0, 0);
          ctx.restore();
        } else {
          const half = (s / 2) * grow;
          const off = half * 0.42;
          ctx.strokeRect(cx - half, cy - half + off * 0.5, half * 2, half * 2);
          ctx.globalAlpha = grow * 0.55;
          ctx.strokeRect(cx - half + off, cy - half - off * 0.5, half * 2, half * 2);
          ctx.beginPath();
          for (const [ex, ey] of [[-half, -half + off * 0.5], [half, -half + off * 0.5], [-half, half + off * 0.5], [half, half + off * 0.5]]) {
            ctx.moveTo(cx + ex, cy + ey);
            ctx.lineTo(cx + ex + off, cy + ey - off);
          }
          ctx.stroke();
          ctx.globalAlpha = grow;
          wanderBlob(ctx, cx + off * 0.4, cy, half - 8, half - 8, t, 2.6);
        }
        ctx.restore();
        ctx.font = MONO(9);
        ctx.fillStyle = PAPER;
        ctx.fillText(labels[i][0], cx, H * 0.82);
        ctx.fillStyle = DIM;
        ctx.fillText(labels[i][1], cx, H * 0.82 + 13);
      }

      if (age > 11.5) {
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('REAL PARTICLES NEED 3 NUMBERS EACH — TWO OF THEM ALREADY NEED SIX DIMENSIONS', W / 2, H * 0.93);
      }
      if (age > 13) {
        ctx.fillStyle = GOLD; ctx.font = MONO(10);
        ctx.fillText('A DUST GRAIN NEEDS ~10¹⁸ — WHATEVER ψ IS, IT STOPPED FITTING IN SPACE AT TWO PARTICLES', W / 2, H * 0.975);
      }
      ctx.textAlign = 'left';
    }

    function draw(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const age = t - actStart;
      if (age > ACT_DUR[act] && !(act === 0 && collapse)) setAct(act + 1, t);

      ctx.textAlign = 'center'; ctx.font = MONO(9); ctx.fillStyle = DIM;
      ctx.fillText(act === 0
        ? 'ACT 1 OF 2 — WHAT KIND OF THING IS ψ?'
        : 'ACT 2 OF 2 — WHERE DOES ψ LIVE?', W / 2, H * 0.055);
      ctx.textAlign = 'left';

      if (act === 0) drawAct1(ctx, W, H, t);
      else drawAct2(ctx, W, H, t, t - actStart);
    }

    const st = stage(canvas, draw, 16 / 9);
    bMeasure = btn(controls, 'Measure both', () => {
      if (act !== 0) return;
      lastMeasure = st.now();
      collapse = { x0: sampleX(st.now()), t0: st.now() };
      ro.textContent = 'LEFT: SOMETHING HAPPENED. RIGHT: YOU JUST LEARNED. WHICH IS TRUE?';
      st.pulse(3.5);
    });
    bWhere = btn(controls, 'Where does ψ live?', () => { setAct(act + 1, st.now()); st.pulse(15); });
    ro.textContent = 'SAME MATHEMATICS. TWO READINGS.';
    return () => st.destroy();
  }

  /* ============================================================
     06 — BLACK HOLE INFORMATION PARADOX
     Structured bits fall in; featureless static leaks out.
     ============================================================ */
  function vizInformation(canvas, controls) {
    let inbits = [], outbits = [], swallowed = 0;
    let lastDiary = 0, diaryAt = -99, cycleStart = 0, curR = 44;
    const CYCLE = 30, AFTER = 5;
    const DIARY = 'DEAR UNIVERSE, REMEMBER ME';
    const ro = readout(controls);

    function spawnBit(W, H, ch) {
      const bx = W * 0.62, by = H * 0.5;
      const ang = rand(0, TAU);
      const r = Math.hypot(W, H) * rand(0.42, 0.55);
      inbits.push({
        ang, r, sp: rand(0.5, 0.9),
        ch: ch || (Math.random() < 0.5 ? '0' : '1'),
        bx, by, isDiary: !!ch,
      });
    }

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      const bx = W * 0.62, by = H * 0.5;
      const age = t - cycleStart;
      const Rmax = Math.min(H * 0.2, 44);
      const evapK = clamp(age / CYCLE, 0, 1);
      const R = Math.max(Rmax * Math.sqrt(1 - evapK), 0);
      curR = R;
      const terminal = age >= CYCLE;

      if (age > CYCLE + AFTER) { cycleStart = t; swallowed = 0; inbits = []; outbits = []; return; }

      if (!terminal) {
        // accretion glow, hotter as it shrinks
        const glow = ctx.createRadialGradient(bx, by, R, bx, by, R * 2.6 + 8);
        glow.addColorStop(0, `rgba(232,184,75,${0.22 + 0.3 * evapK})`);
        glow.addColorStop(1, 'rgba(232,184,75,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(bx, by, R * 2.6 + 8, 0, TAU); ctx.fill();

        // horizon
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.fill();
        ctx.strokeStyle = GOLD;
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(bx, by, R + 1.5, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;

        // infalling structured bits
        if (Math.random() < dt * 9 && inbits.length < 70) spawnBit(W, H);
        ctx.font = MONO(11);
        for (const b of inbits) {
          b.r -= b.sp * dt * (28 + 3200 / (b.r + 24));
          b.ang += dt * (0.35 + 120 / (b.r + 30));
          const x = b.bx + Math.cos(b.ang) * b.r;
          const y = b.by + Math.sin(b.ang) * b.r * 0.72;
          if (b.r <= R * 0.9 + 2) { swallowed++; continue; }
          ctx.fillStyle = b.isDiary ? GOLD : PH;
          ctx.globalAlpha = clamp(0.9 - (b.r / (W * 0.5)) * 0.3, 0.35, 0.95);
          ctx.fillText(b.ch, x, y);
        }
        inbits = inbits.filter((b) => b.r > R * 0.9 + 2);
        ctx.globalAlpha = 1;

        // a diary falls in on its own every so often
        if (t > 5 && t - lastDiary > 14 && age < CYCLE - 9) { lastDiary = t; dropDiary(); }
        if (t - diaryAt < 4.5) {
          ctx.fillStyle = GOLD; ctx.font = MONO(10); ctx.textAlign = 'center';
          ctx.fillText('A DIARY FALLS IN — EVERY LETTER IS MEMORY THE UNIVERSE MUST KEEP', W / 2, H * 0.9);
          ctx.textAlign = 'left';
        }

        // name the flows where they flow
        const ax = bx - R - 36, ay = by - R - 26;
        ctx.strokeStyle = PH; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(ax - 52, ay - 34); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 9, ay - 2); ctx.moveTo(ax, ay); ctx.lineTo(ax - 2, ay - 9); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = PH; ctx.font = MONO(8); ctx.textAlign = 'right';
        ctx.fillText('MEMORY, FALLING IN', ax - 56, ay - 38);
        ctx.textAlign = 'left';
        const ox = bx + R + 26, oy = by + R + 18;
        ctx.strokeStyle = 'rgba(160,160,160,0.7)';
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 46, oy + 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox + 46, oy + 30); ctx.lineTo(ox + 37, oy + 28); ctx.moveTo(ox + 46, oy + 30); ctx.lineTo(ox + 44, oy + 21); ctx.stroke();
        ctx.fillStyle = 'rgba(160,160,160,0.8)'; ctx.font = MONO(8);
        ctx.fillText('FEATURELESS HEAT, LEAKING OUT', ox + 8, oy + 46);

        ctx.fillStyle = DIM; ctx.font = MONO(10);
        ctx.fillText('IN: STRUCTURE', 14, H * 0.12);
        ctx.fillText('OUT: HEAT WITH NO PATTERN WE CAN READ', 14, H * 0.12 + 16);
        ctx.fillStyle = GOLD;
        ctx.fillText(`HOLE REMAINING: ${(100 * (1 - evapK)).toFixed(0)}%`, 14, H * 0.12 + 32);

        // one story line, keyed to where the cycle is
        ctx.textAlign = 'center'; ctx.font = MONO(10); ctx.fillStyle = PAPER;
        ctx.fillText(
          evapK < 0.3 ? 'EVERYTHING FALLING IN CARRIES A RECORD — QM SAYS RECORDS CAN NEVER BE DESTROYED'
          : evapK < 0.56 ? 'THE HOLE PAYS FOR ITS HEAT WITH ITS OWN MASS — AND THE HEAT CARRIES NO RECORD'
          : evapK < 0.85 ? 'PAST HALFWAY: IF QM IS RIGHT, THE STATIC MUST START WHISPERING THE RECORDS BACK'
          : 'ALMOST GONE — AND STILL NOT ONE READABLE BIT HAS COME OUT', W / 2, H * 0.055);
        ctx.textAlign = 'left';
        ro.textContent = `THIS CYCLE \u2014 SWALLOWED: ${swallowed} BITS \u00b7 EMITTED: 0 BITS, ONLY HEAT`;
      } else {
        // gone — the moment the calculation breaks
        if (inbits.length) { swallowed += inbits.length; inbits = []; }
        ctx.textAlign = 'center';
        ctx.fillStyle = GOLD; ctx.font = MONO(14);
        ctx.fillText('EVAPORATED.', bx, by - 14);
        ctx.fillStyle = PAPER; ctx.font = MONO(10);
        ctx.fillText(`HAWKING’S ARITHMETIC: ALL ${swallowed} BITS, UNACCOUNTED FOR.`, bx, by + 8);
        ctx.fillStyle = DIM;
        ctx.fillText('QM SAYS THAT IS IMPOSSIBLE — SO ONE OF OUR TWO BEST CALCULATIONS IS WRONG.', bx, by + 26);
        ctx.textAlign = 'left';
        ro.textContent = 'LEDGER REFUSES TO BALANCE · BEST BET: THE BITS RIDE OUT IN THE STATIC — NOBODY CAN SHOW HOW';
      }


      // the two ledgers: what the radiation remembers, against time.
      // Hole entropy ∝ M² with M = M₀(1−u)^⅓; thermal radiation carries
      // ≈1.5× the entropy the hole spends (Zurek 1982); unitarity caps the
      // radiation's entanglement entropy at the hole's — the Page curve,
      // turning over at u ≈ 0.54 (derivation in docs/research/verified-numbers.md).
      {
        const gx = 14, gy = H * 0.4, gw = W * 0.3, gh = H * 0.3;
        const u = evapK;
        const sBH = (v) => Math.pow(1 - v, 2 / 3);
        const sHawk = (v) => 1.5 * (1 - sBH(v));
        const sPage = (v) => Math.min(sHawk(v), sBH(v));
        const X = (v) => gx + v * gw;
        const Y = (s) => gy + gh - (s / 1.5) * gh * 0.94;
        const curve = (f, upto, dashed) => {
          ctx.setLineDash(dashed ? [3, 3] : []);
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const v = (i / 60) * upto;
            i ? ctx.lineTo(X(v), Y(f(v))) : ctx.moveTo(X(v), Y(f(v)));
          }
          ctx.stroke();
          ctx.setLineDash([]);
        };
        ctx.strokeStyle = FAINT;
        ctx.strokeRect(gx, gy, gw, gh);
        // both books, full prediction, faint
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = PAPER; curve(sHawk, 1, true);
        ctx.strokeStyle = PH; curve(sPage, 1, true);
        ctx.globalAlpha = 1;
        // written so far, solid
        ctx.strokeStyle = PAPER; curve(sHawk, u, false);
        ctx.strokeStyle = PH; ctx.lineWidth = 1.6; curve(sPage, u, false);
        ctx.lineWidth = 1;
        ctx.fillStyle = GOLD;
        ctx.beginPath(); ctx.arc(X(u), Y(sHawk(u)), 2.2, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(X(u), Y(sPage(u)), 2.2, 0, TAU); ctx.fill();
        ctx.font = MONO(8);
        ctx.fillStyle = DIM;
        ctx.fillText('WHAT THE RADIATION REMEMBERS', gx, gy - 6);
        ctx.fillStyle = PAPER;
        ctx.fillText('HAWKING’S MATH: THE HEAT NEVER TELLS', gx + 5, gy + 11);
        ctx.fillStyle = PH;
        ctx.fillText('QM’S RULE: THE STORY COMES BACK OUT (PAGE)', gx + 5, gy + 21);
        ctx.fillStyle = DIM;
        ctx.textAlign = 'right';
        ctx.fillText('TIME →', gx + gw - 5, gy + gh - 5);
        ctx.textAlign = 'left';
        // the halfway turnover, marked
        ctx.strokeStyle = FAINT;
        ctx.beginPath(); ctx.moveTo(X(0.535), gy + gh); ctx.lineTo(X(0.535), gy + gh - 7); ctx.stroke();
        if (terminal) {
          ctx.fillStyle = GOLD;
          ctx.fillText('ONE BOOK ENDS FULL, ONE EMPTY — ONE IS WRONG', gx, gy + gh + 12);
        } else if (u > 0.56) {
          ctx.fillStyle = GOLD;
          ctx.fillText('PAST HALFWAY — THE TWO BOOKS SPLIT, LIVE', gx, gy + gh + 12);
        }
      }

      // outgoing thermal radiation — identical, featureless
      const rate = terminal ? 2 : 6 + 26 * evapK;
      if (Math.random() < dt * rate && outbits.length < 70 && !terminal) {
        const a = rand(0, TAU);
        outbits.push({ x: bx + Math.cos(a) * (R + 4), y: by + Math.sin(a) * (R + 4), vx: Math.cos(a) * (30 + 30 * evapK), vy: Math.sin(a) * (30 + 30 * evapK), life: 0 });
      }
      for (const o of outbits) {
        o.x += o.vx * dt; o.y += o.vy * dt; o.life += dt;
        ctx.fillStyle = 'rgba(160,160,160,0.8)';
        ctx.globalAlpha = clamp(1 - o.life / 4, 0, 0.7);
        ctx.beginPath(); ctx.arc(o.x, o.y, 1.3, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      outbits = outbits.filter((o) => o.life < 4 && o.x > -10 && o.x < W + 10 && o.y > -10 && o.y < H + 10);
    }

    const st = stage(canvas, draw, 16 / 9);
    const timers = [];
    function dropDiary() {
      diaryAt = st.now();
      const chars = DIARY.replace(/ /g, '');
      for (let i = 0; i < chars.length; i++) {
        timers.push(setTimeout(() => spawnBit(st.W, st.H, chars[i]), i * 90));
      }
      st.pulse(6);
    }
    btn(controls, 'Drop in a diary', () => {
      const t = st.now();
      // leave enough cycle for the diary to actually fall in
      if (t - cycleStart >= CYCLE - 9) { cycleStart = t; swallowed = 0; inbits = []; outbits = []; }
      lastDiary = t;
      dropDiary();
    });
    return () => { timers.forEach(clearTimeout); st.destroy(); };
  }

  /* ============================================================
     07 — QUANTUM GRAVITY
     Smooth spacetime, until you look closely enough.
     ============================================================ */
  function vizGravity(canvas, controls) {
    let mouse = null, orbA = rand(0, TAU);
    const trail = [];
    const ro = readout(controls);
    ro.textContent = 'NO EXPERIMENT HAS EVER REACHED THIS SCALE \u2014 THE FOAM IS A GUESS';

    function gridPoint(x, y, W, H, jitter, t) {
      const mx = W / 2, my = H / 2;
      const dx = x - mx, dy = y - my;
      const d = Math.hypot(dx, dy) + 26;
      const pull = 2600 / d;
      let px = x - (dx / d) * pull * 0.35;
      let py = y - (dy / d) * pull * 0.35;
      if (jitter > 0) {
        px += Math.sin(x * 0.9 + t * 21 + y) * jitter;
        py += Math.cos(y * 1.1 + t * 17 + x) * jitter;
      }
      return [px, py];
    }

    function drawGrid(ctx, W, H, t, jitter) {
      ctx.beginPath();
      const step = 26;
      for (let gy = -step; gy <= H + step; gy += step) {
        for (let gx = -step; gx <= W + step; gx += step / 3) {
          const [px, py] = gridPoint(gx, gy, W, H, jitter, t);
          gx <= -step + 0.01 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
      }
      for (let gx = -step; gx <= W + step; gx += step) {
        for (let gy = -step; gy <= H + step; gy += step / 3) {
          const [px, py] = gridPoint(gx, gy, W, H, jitter, t);
          gy <= -step + 0.01 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);

      // smooth relativistic spacetime
      ctx.strokeStyle = 'rgba(233,228,214,0.16)';
      drawGrid(ctx, W, H, t, 0);

      // the mass
      ctx.fillStyle = PAPER;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 5, 0, TAU); ctx.fill();

      // the lens: inside it, the Planck scale
      const LR = Math.min(W, H) * 0.21;
      const lx = mouse ? mouse.x : W / 2 + Math.cos(t * 0.4) * W * 0.24;
      const ly = mouse ? mouse.y : H / 2 + Math.sin(t * 0.27) * H * 0.24;

      ctx.save();
      ctx.beginPath(); ctx.arc(lx, ly, LR, 0, TAU); ctx.clip();
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(110,243,193,0.5)';
      drawGrid(ctx, W, H, t, 4.5);
      for (let i = 0; i < 26; i++) {
        const a = t * 3 + i * 2.4;
        const fx = lx + Math.sin(a * 1.7 + i) * LR * 0.8;
        const fy = ly + Math.cos(a * 1.3 + i * 3) * LR * 0.8;
        const fr = 2 + 2 * Math.abs(Math.sin(a + i));
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(a * 2);
        ctx.strokeStyle = PH;
        ctx.beginPath(); ctx.arc(fx, fy, fr, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // one particle, two rulebooks
      orbA += dt * 0.55;
      const px = W / 2 + Math.cos(orbA) * W * 0.33;
      const py = H / 2 + Math.sin(orbA) * H * 0.3;
      const inLens = (px - lx) ** 2 + (py - ly) ** 2 < LR * LR;
      trail.push({ x: px, y: py, in: inLens });
      if (trail.length > 110) trail.shift();

      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        const alpha = (i / trail.length) * 0.8;
        // classify against where the lens is NOW, not where it was
        const bIn = (b.x - lx) ** 2 + (b.y - ly) ** 2 < LR * LR;
        if (!bIn) {
          ctx.strokeStyle = PAPER;
          ctx.globalAlpha = alpha * 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        } else {
          // inside the lens the single path frays into many
          for (const k of [-1, 0, 1]) {
            const off = k * (4 + 3 * Math.sin(i * 0.7 + t * 5));
            ctx.strokeStyle = PH;
            ctx.globalAlpha = alpha * 0.45;
            ctx.beginPath();
            ctx.moveTo(a.x + off, a.y + off * 0.6);
            ctx.lineTo(b.x + off, b.y + off * 0.6);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = GOLD;
      ctx.shadowColor = GOLD; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(px, py, 3.4, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;

      // lens ring + labels
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(lx, ly, LR, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.font = MONO(10); ctx.textAlign = 'center';
      ctx.fillStyle = GOLD;
      const labelY = ly + LR + 26 > H * 0.9 ? ly - LR - 10 : ly + LR + 16;
      ctx.fillText('\u00d710\u00b3\u2074 \u2014 PLANCK SCALE, 10\u207b\u00b3\u2075 m', clamp(lx, 130, W - 130), labelY);
      ctx.fillStyle = DIM;
      ctx.fillText('OUT HERE: ONE SMOOTH SPACETIME (EINSTEIN)', W / 2, H * 0.07);
      if (inLens) {
        ctx.fillStyle = GOLD;
        ctx.fillText('INSIDE: THE GEOMETRY BENEATH IT IS MANY GEOMETRIES AT ONCE \u2014 NOBODY HAS THE RULEBOOK', W / 2, H * 0.955);
      } else if (mouse) {
        ctx.fillStyle = DIM;
        ctx.fillText('MOVE THE LENS ONTO THE PARTICLE', W / 2, H * 0.955);
      } else {
        ctx.fillStyle = DIM;
        ctx.fillText('COLLIDERS REACH 10\u2074 GeV \u00b7 THE PLANCK SCALE SITS AT 10\u00b9\u2079 \u2014 10\u00b9\u2075 BEYOND ANY REFEREE', W / 2, H * 0.955);
      }
      ctx.textAlign = 'left';
    }

    const st = stage(canvas, draw, 16 / 9);
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      st.pulse(2);
    };
    const onLeave = () => { mouse = null; };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      st.destroy();
    };
  }

  /* ============================================================
     08 — THE VACUUM CATASTROPHE
     Empty space seethes; the prediction misses by 10^120.
     ============================================================ */
  function vizVacuum(canvas, controls) {
    let pairs = [], born = 0, barK = 0, barPlay = true, barDoneAt = null, zeros = 0;
    const ro = readout(controls);

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      const fieldW = W * 0.66;

      // "a box of nothing"
      ctx.strokeStyle = FAINT;
      ctx.strokeRect(14, H * 0.1, fieldW - 28, H * 0.8);
      ctx.fillStyle = DIM; ctx.font = MONO(10);
      ctx.fillText('A BOX OF PERFECT NOTHING', 22, H * 0.1 - 6 < 10 ? 12 : H * 0.1 - 6);

      // virtual pairs
      if (Math.random() < dt * 10 && pairs.length < 18) {
        pairs.push({ x: rand(30, fieldW - 40), y: rand(H * 0.16, H * 0.84), t: 0, life: rand(0.9, 1.6), ang: rand(0, TAU) });
        born++;
      }
      for (const p of pairs) {
        p.t += dt;
        const k = p.t / p.life;
        const sep = Math.sin(k * Math.PI) * 13;
        const dx = Math.cos(p.ang) * sep, dy = Math.sin(p.ang) * sep;
        const a = Math.sin(k * Math.PI);
        ctx.globalAlpha = a;
        ctx.fillStyle = PH;
        ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, 2, 0, TAU); ctx.fill();
        ctx.fillStyle = PAPER;
        ctx.beginPath(); ctx.arc(p.x - dx, p.y - dy, 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = FAINT;
        ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + dy); ctx.lineTo(p.x - dx, p.y - dy); ctx.stroke();
        // annihilation flash
        if (k > 0.9) {
          ctx.strokeStyle = GOLD;
          ctx.globalAlpha = (k - 0.9) * 8 * (1 - k) * 10;
          ctx.beginPath(); ctx.arc(p.x, p.y, (k - 0.9) * 90, 0, TAU); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      pairs = pairs.filter((p) => p.t < p.life);

      // the scales: a thimble of predicted nothing outweighs everything we see
      if (barPlay) barK = clamp(barK + dt * 0.35, 0, 1);
      if (barK >= 1) {
        zeros = clamp(zeros + dt * 16, 0, 120);
        if (barDoneAt === null) barDoneAt = t;
        else if (t - barDoneAt > 12) { barK = 0; barDoneAt = null; zeros = 0; }
      }
      const fx = W * 0.83, fy = H * 0.62;
      const tilt = easeOut(barK) * 0.34;
      const beamL = W * 0.125;

      // fulcrum
      ctx.strokeStyle = PAPER;
      ctx.beginPath();
      ctx.moveTo(fx, fy); ctx.lineTo(fx - 9, fy + 16); ctx.lineTo(fx + 9, fy + 16);
      ctx.closePath(); ctx.stroke();

      // beam — predicted side (left) sinks
      const lx2 = fx - Math.cos(tilt) * beamL, ly2 = fy + Math.sin(tilt) * beamL;
      const rx2 = fx + Math.cos(tilt) * beamL, ry2 = fy - Math.sin(tilt) * beamL;
      ctx.beginPath(); ctx.moveTo(lx2, ly2); ctx.lineTo(rx2, ry2); ctx.stroke();

      // left pan: the thimble of nothing
      ctx.beginPath(); ctx.moveTo(lx2, ly2); ctx.lineTo(lx2, ly2 + 14); ctx.stroke();
      ctx.strokeRect(lx2 - 7, ly2 + 14, 14, 11);
      ctx.font = MONO(8); ctx.textAlign = 'center'; ctx.fillStyle = GOLD;
      ctx.fillText('A THIMBLE OF NOTHING', lx2, ly2 + 40);
      ctx.fillStyle = DIM;
      ctx.fillText('(ITS PREDICTED ENERGY)', lx2, ly2 + 51);

      // right pan: everything we can see
      ctx.strokeStyle = PAPER;
      ctx.beginPath(); ctx.moveTo(rx2, ry2); ctx.lineTo(rx2, ry2 + 14); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const sxx = rx2 - 10 + i * 10, syy = ry2 + 20 + (i % 2) * 5;
        ctx.beginPath(); ctx.moveTo(sxx - 3, syy); ctx.lineTo(sxx + 3, syy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sxx, syy - 3); ctx.lineTo(sxx, syy + 3); ctx.stroke();
      }
      ctx.fillStyle = DIM;
      ctx.fillText('EVERY STAR', rx2, ry2 + 40);
      ctx.fillText('WE CAN SEE', rx2, ry2 + 51);
      ctx.textAlign = 'left';

      // the ratio, spelling itself out
      if (zeros > 0) {
        const n = Math.floor(zeros);
        ctx.fillStyle = GOLD; ctx.font = MONO(12);
        ctx.fillText('NAÏVE PREDICTION ÷ MEASUREMENT ≈ 10^' + n, 20, H * 0.965);
        if (n >= 120) {
          ctx.fillStyle = PAPER; ctx.font = MONO(10); ctx.textAlign = 'center';
          ctx.fillText('A ONE WITH 120 ZEROS — AND NOBODY CAN FIND THE WRONG STEP', fieldW / 2, H * 0.86);
          ctx.textAlign = 'left';
        }
      }

      ro.textContent = zeros > 0
        ? `PAIRS FLICKERED: ${born} · OFF BY 10^${Math.floor(zeros)}${zeros >= 120 ? '' : ' AND COUNTING'}`
        : `PAIRS FLICKERED: ${born} · NOW COUNT THE ENERGY THIS NOTHING HOLDS`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Weigh it again', () => { barK = 0; barDoneAt = null; zeros = 0; st.pulse(5); });
    return () => st.destroy();
  }

  /* ============================================================
     09 — THE ARROW OF TIME
     Reversible laws, irreversible world — and Loschmidt's answer.
     The gas collides (hard disks). Beat 1: flip every velocity and
     the recorded history replays backwards exactly — entropy falls,
     legally. Beat 2: the same history, flipped again with ONE
     particle nudged a few degrees — collisions amplify the hair
     and the return crumbles. Reversal is legal; it is fragile.
     ============================================================ */
  function vizTime(canvas, controls) {
    const N = 110, RAD = 4, SUB = 1 / 120, SPREAD = 8;
    const NUDGE_DEG = 5;
    const ro = readout(controls);
    const hist = [];
    let parts = null, phase = 'spread', phaseStart = 0, lastSample = 0, acc = 0;
    let rec = null, nudgeIdx = -1;
    let bRev, bNudge;

    const snap = () => {
      const a = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) { a[i * 2] = parts[i].x; a[i * 2 + 1] = parts[i].y; }
      return a;
    };
    const applyFrame = (f) => {
      for (let i = 0; i < N; i++) { parts[i].x = f[i * 2]; parts[i].y = f[i * 2 + 1]; }
    };
    const playDur = () => (rec && rec.length > 1 ? (rec.length - 1) * SUB : SPREAD);

    function setPhase(name, t) {
      phase = name;
      phaseStart = t;
      if (bRev) {
        // reversing is only honest where the velocities are known
        bRev.disabled = !(phase === 'spread' || phase === 'replay');
        bNudge.disabled = phase !== 'spread';
      }
    }

    function reset(W, H, t) {
      parts = [];
      for (let i = 0; i < N; i++) {
        parts.push({
          x: rand(W * 0.05, W * 0.28),
          y: rand(H * 0.62, H * 0.92),
          vx: rand(-70, 70),
          vy: rand(-70, 70),
        });
      }
      rec = [snap()]; nudgeIdx = -1; acc = 0;
      hist.length = 0;
      setPhase('spread', t);
    }

    // one fixed sub-step of real physics: free flight, walls, disk collisions
    function step(W, H) {
      for (const p of parts) {
        p.x += p.vx * SUB; p.y += p.vy * SUB;
        if (p.x < RAD) { p.x = 2 * RAD - p.x; p.vx = -p.vx; }
        if (p.x > W - RAD) { p.x = 2 * (W - RAD) - p.x; p.vx = -p.vx; }
        if (p.y < RAD) { p.y = 2 * RAD - p.y; p.vy = -p.vy; }
        if (p.y > H - RAD) { p.y = 2 * (H - RAD) - p.y; p.vy = -p.vy; }
      }
      const D = RAD * 2;
      for (let i = 0; i < N; i++) {
        const a = parts[i];
        for (let j = i + 1; j < N; j++) {
          const b = parts[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= D * D || d2 < 1e-9) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
          const va = a.vx * nx + a.vy * ny, vb = b.vx * nx + b.vy * ny;
          if (va - vb <= 0) continue;
          const push = (D - d) / 2 + 0.01;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
          const dv = va - vb;
          a.vx -= dv * nx; a.vy -= dv * ny;
          b.vx += dv * nx; b.vy += dv * ny;
        }
      }
    }

    function entropy(W, H) {
      const GX = 10, GY = 6;
      const cells = new Float32Array(GX * GY);
      for (const p of parts) {
        const cx = clamp(Math.floor((p.x / W) * GX), 0, GX - 1);
        const cy = clamp(Math.floor((p.y / H) * GY), 0, GY - 1);
        cells[cx + cy * GX]++;
      }
      let S = 0;
      for (const c of cells) {
        if (c > 0) { const q = c / N; S -= q * Math.log(q); }
      }
      return S;
    }

    function reverseClean(t) {
      // replay the recorded trajectory backwards — what a perfect
      // velocity flip would do, rendered exactly
      if (!rec || rec.length < 40) return;
      if (phase === 'replay') {
        const k = clamp((t - phaseStart) / playDur(), 0, 1);
        setPhase('rewind', t);
        phaseStart = t - (1 - k) * playDur();
      } else if (phase === 'spread') {
        setPhase('rewind', t);
      }
    }

    function reverseNudged(t) {
      // real physics from here on: flip every velocity, then rotate
      // ONE particle's by a few degrees
      if (phase !== 'spread' && phase !== 'replay') return;
      for (const p of parts) { p.vx = -p.vx; p.vy = -p.vy; }
      nudgeIdx = Math.floor(rand(0, N));
      const p = parts[nudgeIdx];
      const a = (NUDGE_DEG * Math.PI) / 180;
      const vx = p.vx * Math.cos(a) - p.vy * Math.sin(a);
      const vy = p.vx * Math.sin(a) + p.vy * Math.cos(a);
      p.vx = vx; p.vy = vy;
      acc = 0;
      setPhase('rewindN', t);
    }

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      if (!parts) reset(W, H, t);
      let age = t - phaseStart;

      // the two-beat cycle runs itself: spread → perfect rewind →
      // the same spread replayed → rewind with one nudge → shatter
      if (phase === 'spread') {
        acc += dt;
        while (acc >= SUB) { acc -= SUB; step(W, H); rec.push(snap()); }
        if (age > SPREAD) reverseClean(t);
      } else if (phase === 'rewind' || phase === 'replay') {
        const k = clamp(age / playDur(), 0, 1);
        const idx = Math.round((phase === 'rewind' ? 1 - k : k) * (rec.length - 1));
        applyFrame(rec[idx]);
        if (k >= 1) {
          if (phase === 'rewind') setPhase('hold', t);
          else reverseNudged(t);
        }
      } else if (phase === 'hold') {
        applyFrame(rec[0]);
        if (age > 2.2) setPhase('replay', t);
      } else if (phase === 'rewindN') {
        acc += dt;
        while (acc >= SUB) { acc -= SUB; step(W, H); }
        if (age > playDur()) setPhase('shatter', t);
      } else if (phase === 'shatter') {
        acc += dt;
        while (acc >= SUB) { acc -= SUB; step(W, H); }
        if (age > 3.4) reset(W, H, t);
      }
      age = t - phaseStart;

      const backward = phase === 'rewind' || phase === 'rewindN';
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = backward ? GOLD : PH;
      for (const p of parts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.4, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (nudgeIdx >= 0 && (phase === 'rewindN' || phase === 'shatter')) {
        const p = parts[nudgeIdx];
        ctx.strokeStyle = PAPER;
        ctx.beginPath(); ctx.arc(p.x, p.y, 6.5, 0, TAU); ctx.stroke();
      }

      // entropy sparkline — long enough for a whole two-beat cycle
      const S = entropy(W, H);
      if (t - lastSample > 0.1) {
        lastSample = t;
        hist.push({ s: S, rev: backward });
        if (hist.length > 420) hist.shift();
      }
      const Smax = Math.log(60);
      const gy0 = H * 0.06, gh = H * 0.16, gx0 = W * 0.62, gw = W * 0.34;
      const sy = (s) => gy0 + gh - (s / Smax) * gh * 0.92;
      ctx.strokeStyle = FAINT;
      ctx.strokeRect(gx0, gy0, gw, gh);
      ctx.beginPath();
      hist.forEach((h2, i) => {
        const x = gx0 + (i / 419) * gw;
        i ? ctx.lineTo(x, sy(h2.s)) : ctx.moveTo(x, sy(h2.s));
      });
      ctx.strokeStyle = PAPER; ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6;
      for (let i = 1; i < hist.length; i++) {
        if (!hist[i].rev) continue;
        ctx.beginPath();
        ctx.moveTo(gx0 + ((i - 1) / 419) * gw, sy(hist[i - 1].s));
        ctx.lineTo(gx0 + (i / 419) * gw, sy(hist[i].s));
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.fillText('ENTROPY', gx0 + 6, gy0 + 12);

      ctx.fillStyle = backward ? GOLD : DIM;
      ctx.font = MONO(10);
      ctx.fillText(
        phase === 'rewind' ? '← TIME (SAME LAWS)'
          : phase === 'rewindN' ? `← TIME (ONE PARTICLE NUDGED ${NUDGE_DEG}°)`
          : 'TIME →', 14, H * 0.1);

      // say each beat while it is on screen
      ctx.textAlign = 'center'; ctx.font = MONO(10);
      if (phase === 'rewind') {
        ctx.fillStyle = GOLD;
        ctx.fillText('EVERY VELOCITY FLIPPED — EVERY COLLISION UNDONE. THE LAWS DO NOT OBJECT.', W / 2, H * 0.95);
      } else if (phase === 'hold') {
        ctx.fillStyle = GOLD;
        ctx.fillText('PERFECT RETURN — ENTROPY FELL. PERFECTLY LEGAL. SO WHY NEVER AN EGG?', W / 2, H * 0.95);
      } else if (phase === 'replay') {
        ctx.fillStyle = DIM;
        ctx.fillText('THE SAME SPREADING, REPLAYED EXACTLY — NOW FLIP AGAIN, ONE HAIR OUT OF PLACE', W / 2, H * 0.95);
      } else if (phase === 'rewindN') {
        ctx.fillStyle = GOLD;
        ctx.fillText(age < playDur() * 0.45
          ? `FLIPPED AGAIN — BUT ONE PARTICLE (RINGED) IS OFF BY ${NUDGE_DEG}°`
          : 'EACH COLLISION SPREADS THE ERROR — THE RETURN IS CRUMBLING', W / 2, H * 0.95);
      } else if (phase === 'shatter') {
        ctx.fillStyle = GOLD;
        ctx.fillText('NO RETURN. UNBREAKING AN EGG NEEDS EVERY ATOM EXACT — ONE HAIR RUINS IT.', W / 2, H * 0.95);
      }
      ctx.textAlign = 'left';

      ro.textContent = `S = ${S.toFixed(2)} · ` + (
        phase === 'spread' ? 'SPREADING — ENTROPY CLIMBS'
        : phase === 'rewind' ? 'REVERSED — RETRACING PERFECTLY'
        : phase === 'hold' ? 'RETURNED — THE LAWS PERMIT IT'
        : phase === 'replay' ? 'SAME HISTORY, SECOND RUN'
        : phase === 'rewindN' ? 'REVERSED WITH ONE NUDGE — WATCH THE RETURN FAIL'
        : 'THE RETURN SHATTERED — THIS IS WHY EGGS STAY BROKEN');
    }

    const st = stage(canvas, draw, 16 / 9);
    bRev = btn(controls, 'Reverse every velocity', () => { reverseClean(st.now()); st.pulse(10); });
    bNudge = btn(controls, 'Reverse, nudging one particle', () => { reverseNudged(st.now()); st.pulse(12); });
    btn(controls, 'Fresh start', () => { parts = null; st.pulse(6); });
    return () => st.destroy();
  }

  /* ============================================================
     10 — IS ANYTHING TRULY RANDOM?
     Act 1: the coin nobody can call. Act 2: play the guessing
     game with local plans — every one caps at 75%; entangled
     coins score ~85% (CHSH). Act 3: the ways out.
     ============================================================ */
  function vizRandomness(canvas, controls) {
    const ro = readout(controls);
    const DUR = [10, 18, 13];
    let act = 0, actStart = 0;
    let bPlan;
    // act 1 — the coin nobody can call
    let bits = [], guesses = 0, correct = 0, nextEvent = 0;
    // act 2 — the guessing game
    const QWIN = Math.cos(Math.PI / 8) ** 2; // ≈ 0.8536
    const PLANS = [
      { name: 'PLAN 1 — BOTH ALWAYS ANSWER 0', desc: 'agree no matter what', local: true,
        play: () => [0, 0] },
      { name: 'PLAN 2 — ANSWER YOUR OWN QUESTION', desc: 'echo what you were asked', local: true,
        play: (x, y) => [x, y] },
      { name: 'PLAN 3 — FLIP COINS', desc: 'no plan at all', local: true,
        play: () => [Math.random() < 0.5 ? 1 : 0, Math.random() < 0.5 ? 1 : 0] },
      { name: 'SHARE ENTANGLED COINS', desc: 'measure them at clever angles', local: false,
        play: null },
    ];
    const PLAN_END = [4.4, 8.8, 13, 99];
    let plan = 0, tallyN = 0, tallyW = 0, nextRound = 0, lastRound = null, broke = null;
    // act 3 — the ways out
    const HATCHES = [
      { name: 'MANY-WORLDS',      how: ['EVERY OUTCOME', 'ACTUALLY HAPPENS'],        price: ['PRICE: ALL VERSIONS', 'OF YOU HAPPEN TOO'] },
      { name: 'PILOT WAVE',       how: ['A HIDDEN LAYER', 'DECIDES EACH BIT'],       price: ['PRICE: INFLUENCE', 'FASTER THAN LIGHT'] },
      { name: 'SUPERDETERMINISM', how: ['THE UNIVERSE SCRIPTED', 'YOUR QUESTIONS TOO'], price: ['PRICE: NO EXPERIMENT', 'CAN BE TRUSTED'] },
    ];

    function setPlan(i, t) {
      plan = clamp(i, 0, 3);
      tallyN = 0; tallyW = 0; nextRound = t + 0.4; lastRound = null;
      if (plan < 3) broke = null;
    }

    function setAct(i, t) {
      act = ((i % 3) + 3) % 3;
      actStart = t;
      if (act === 0) { bits = []; guesses = 0; correct = 0; nextEvent = 0; }
      if (act === 1) { broke = null; setPlan(0, t); }
      if (bPlan) bPlan.disabled = act !== 1;
    }

    function drawAct1(ctx, W, H, t) {
      const cy = H * 0.5;

      // the quantum coin: an atom that decides only when asked
      const ex = W * 0.11;
      ctx.strokeStyle = PH;
      ctx.beginPath(); ctx.arc(ex, cy, 12, 0, TAU); ctx.stroke();
      const oa = t * 5;
      ctx.fillStyle = PH;
      ctx.beginPath(); ctx.arc(ex + Math.cos(oa) * 12, cy + Math.sin(oa) * 12, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = DIM; ctx.font = MONO(9); ctx.textAlign = 'center';
      ctx.fillText('A QUANTUM COIN', ex, cy + 32);

      // predict, then reveal
      if (t > nextEvent) {
        nextEvent = t + 0.38;
        const g = Math.random() < 0.5 ? '0' : '1';
        const a = Math.random() < 0.5 ? '0' : '1';
        bits.push({ g, a, ok: g === a });
        guesses++; if (g === a) correct++;
        if (bits.length > 34) bits.shift();
      }

      // the stream: guess above, outcome below, verdict between
      ctx.font = MONO(11);
      const x0 = W * 0.2, dx = (W * 0.72) / 34;
      for (let i = 0; i < bits.length; i++) {
        const b = bits[i];
        const x = x0 + i * dx;
        ctx.globalAlpha = 0.35 + 0.6 * (i / bits.length);
        ctx.fillStyle = DIM;
        ctx.fillText(b.g, x, cy - 26);
        ctx.fillStyle = b.ok ? PH : GOLD;
        ctx.font = MONO(8);
        ctx.fillText(b.ok ? '✓' : '✗', x, cy - 8);
        ctx.font = MONO(11);
        ctx.fillStyle = PH;
        ctx.fillText(b.a, x, cy + 12);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left'; ctx.font = MONO(9); ctx.fillStyle = DIM;
      ctx.fillText('GUESS', W * 0.13, cy - 26);
      ctx.fillText('BIT', W * 0.13, cy + 12);
      ctx.textAlign = 'center';

      const pct = guesses ? (100 * correct / guesses) : 50;
      ctx.fillStyle = PAPER; ctx.font = MONO(13);
      ctx.fillText(`PREDICTOR SCORE: ${pct.toFixed(1)}%`, W / 2, H * 0.78);
      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.fillText('A BLIND COIN FLIP SCORES 50%. USE ANY FORMULA YOU LIKE.', W / 2, H * 0.78 + 15);
      ctx.fillStyle = GOLD; ctx.font = MONO(10);
      ctx.fillText('NOTHING HAS EVER DONE BETTER. NOTHING.', W / 2, H * 0.93);
    }

    function drawAct2(ctx, W, H, t, age) {
      // rules first — exact, in plain words
      ctx.font = MONO(9); ctx.fillStyle = PAPER;
      ctx.fillText('TWO PLAYERS, SEPARATED. EACH IS ASKED 0 OR 1, AT RANDOM. NO TALKING.', W / 2, H * 0.115);
      ctx.fillStyle = DIM;
      ctx.fillText('WIN RULE: BOTH ASKED 1 → ANSWERS MUST DIFFER. ANY OTHER QUESTIONS → ANSWERS MUST MATCH.', W / 2, H * 0.115 + 13);

      if (age > PLAN_END[plan]) setPlan(plan + 1, t);

      // rounds tick in batches; the stations show the last one
      if (t > nextRound) {
        nextRound = t + 0.24;
        const P = PLANS[plan];
        let x = 0, y = 0, a = 0, b = 0, win = false;
        for (let k = 0; k < 5; k++) {
          x = Math.random() < 0.5 ? 1 : 0;
          y = Math.random() < 0.5 ? 1 : 0;
          if (P.local) { [a, b] = P.play(x, y); win = ((a ^ b) === (x & y)); }
          else {
            win = Math.random() < QWIN;
            a = Math.random() < 0.5 ? 1 : 0;
            b = (x & y) ? a ^ (win ? 1 : 0) : a ^ (win ? 0 : 1);
          }
          tallyN++; if (win) tallyW++;
        }
        lastRound = { x, y, a, b, win };
      }

      // the current plan card
      const P = PLANS[plan];
      ctx.font = MONO(10);
      ctx.fillStyle = P.local ? PAPER : GOLD;
      ctx.fillText(P.name, W / 2, H * 0.26);
      ctx.font = MONO(9); ctx.fillStyle = DIM;
      ctx.fillText(P.desc, W / 2, H * 0.26 + 13);

      // stations
      const sy = H * 0.42;
      for (const [sx, who, q, ans] of [
        [W * 0.24, 'PLAYER A', lastRound ? lastRound.x : '–', lastRound ? lastRound.a : '–'],
        [W * 0.76, 'PLAYER B', lastRound ? lastRound.y : '–', lastRound ? lastRound.b : '–'],
      ]) {
        ctx.strokeStyle = FAINT;
        ctx.strokeRect(sx - 52, sy - 24, 104, 48);
        ctx.fillStyle = DIM; ctx.font = MONO(8);
        ctx.fillText(who, sx, sy - 30);
        ctx.font = MONO(11);
        ctx.fillStyle = PAPER;
        ctx.fillText(`ASKED ${q}`, sx - 24, sy + 4);
        ctx.fillStyle = lastRound && !PLANS[plan].local ? GOLD : PH;
        ctx.fillText(`SAYS ${ans}`, sx + 26, sy + 4);
      }
      if (lastRound) {
        ctx.font = MONO(10);
        ctx.fillStyle = lastRound.win ? PH : GOLD;
        ctx.fillText(lastRound.win ? 'WIN' : 'LOSE', W / 2, sy + 4);
      }

      // the score track and the wall at 75%
      const ty = H * 0.68;
      const x0 = W * 0.12, x1 = W * 0.88;
      const xOf = (pc) => lerp(x0, x1, pc / 100);
      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(x1, ty); ctx.stroke();
      ctx.font = MONO(8); ctx.fillStyle = DIM;
      for (const pc of [0, 25, 50, 75, 100]) {
        ctx.strokeStyle = FAINT;
        ctx.beginPath(); ctx.moveTo(xOf(pc), ty - 4); ctx.lineTo(xOf(pc), ty + 4); ctx.stroke();
        ctx.fillText(`${pc}%`, xOf(pc), ty + 16);
      }
      // the wall
      ctx.strokeStyle = PAPER; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(xOf(75), ty - 22); ctx.lineTo(xOf(75), ty + 22); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = PAPER; ctx.font = MONO(8);
      ctx.fillText('EVERY LOCAL PLAN', xOf(75), ty - 38);
      ctx.fillText('STOPS HERE — PROVEN', xOf(75), ty - 29);
      // where entangled coins land
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(xOf(QWIN * 100), ty - 10);
      ctx.lineTo(xOf(QWIN * 100) - 4, ty - 17);
      ctx.lineTo(xOf(QWIN * 100) + 4, ty - 17);
      ctx.closePath(); ctx.fill();
      ctx.font = MONO(8);
      ctx.fillText('≈85% — ENTANGLED COINS', xOf(QWIN * 100), ty + 28);

      // the live score
      const pc = tallyN ? (100 * tallyW) / tallyN : 0;
      ctx.fillStyle = P.local ? PH : GOLD;
      ctx.shadowColor = P.local ? PH : GOLD; ctx.shadowBlur = 10;
      ctx.fillRect(x0, ty - 2, Math.max(0, xOf(pc) - x0), 4);
      ctx.beginPath(); ctx.arc(xOf(pc), ty, 5, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = MONO(10);
      ctx.fillStyle = P.local ? PAPER : GOLD;
      ctx.fillText(`WON ${tallyW}/${tallyN} — ${pc.toFixed(0)}%`, W / 2, H * 0.585);

      if (plan === 3 && broke === null && tallyN >= 40 && pc > 75) broke = t;
      if (broke !== null && t - broke < 2.2) {
        const k = (t - broke) / 2.2;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = GOLD;
        ctx.beginPath(); ctx.arc(xOf(75), ty, 6 + easeOut(k) * 44, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (broke !== null) {
        ctx.fillStyle = GOLD; ctx.font = MONO(10);
        ctx.fillText('THROUGH THE WALL — NO LOCAL PLAN, NONE OF THE 16 POSSIBLE, CAN DO THIS', W / 2, H * 0.88);
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('SO: TRULY RANDOM? OR SOMETHING STRANGER →', W / 2, H * 0.88 + 15);
      } else if (plan < 3 && age > 3.6) {
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('TRY ANY PLAN — ALL 16 POSSIBLE LOCAL PLANS CAP AT 75%. PROVEN, NOT SEARCHED.', W / 2, H * 0.88);
      }
    }

    function drawAct3(ctx, W, H, t, age) {
      ctx.textAlign = 'center'; ctx.font = MONO(10); ctx.fillStyle = PAPER;
      ctx.fillText('THREE WAYS TO SAVE DETERMINISM — EACH WITH A PRICE', W / 2, H * 0.13);

      const hot = clamp(Math.floor(age / (DUR[2] / 3)), 0, 2);
      const dw = W * 0.24, dh = H * 0.42, dy = H * 0.24;
      for (let i = 0; i < 3; i++) {
        const cx = W * (0.19 + 0.31 * i);
        const on = i === hot;
        ctx.globalAlpha = on ? 1 : 0.35;
        // the door
        ctx.strokeStyle = on ? GOLD : PAPER;
        ctx.lineWidth = on ? 2 : 1;
        if (on) { ctx.shadowColor = GOLD; ctx.shadowBlur = 14; }
        ctx.strokeRect(cx - dw / 2, dy, dw, dh);
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        // handle
        ctx.fillStyle = on ? GOLD : DIM;
        ctx.beginPath(); ctx.arc(cx + dw / 2 - 9, dy + dh / 2, 2.5, 0, TAU); ctx.fill();
        // name + story
        ctx.font = MONO(10);
        ctx.fillStyle = on ? GOLD : DIM;
        ctx.fillText(HATCHES[i].name, cx, dy - 10);
        ctx.font = MONO(9);
        ctx.fillStyle = on ? PAPER : DIM;
        HATCHES[i].how.forEach((ln, li) => ctx.fillText(ln, cx, dy + dh * 0.42 + li * 13));
        if (on) {
          ctx.fillStyle = GOLD;
          HATCHES[i].price.forEach((ln, li) => ctx.fillText(ln, cx, dy + dh + 18 + li * 13));
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = GOLD; ctx.font = MONO(10);
      ctx.fillText('NOBODY WANTS TO PAY. AFTER A CENTURY — STILL OPEN.', W / 2, H * 0.95);
    }

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      let age = t - actStart;
      if (age > DUR[act]) { setAct(act + 1, t); age = t - actStart; }

      ctx.textAlign = 'center'; ctx.font = MONO(9); ctx.fillStyle = FAINT;
      const titles = ['ACT 1 OF 3 — THE COIN NOBODY CAN CALL',
                      'ACT 2 OF 3 — BEAT THE GAME WITH A SECRET PLAN',
                      'ACT 3 OF 3 — THE WAYS OUT'];
      ctx.fillStyle = DIM;
      ctx.fillText(titles[act], W / 2, H * 0.055);

      if (act === 0) drawAct1(ctx, W, H, t);
      else if (act === 1) drawAct2(ctx, W, H, t, age);
      else drawAct3(ctx, W, H, t, age);
      ctx.textAlign = 'left';

      ro.textContent = act === 0
        ? `BITS: ${guesses} · PREDICTOR: ${(guesses ? 100 * correct / guesses : 50).toFixed(1)}% · COIN FLIP: 50%`
        : act === 1
        ? `${PLANS[plan].name} · WON ${tallyW}/${tallyN} · LOCAL PLANS ≤ 75% · ENTANGLED ≈ 85%`
        : 'THREE LOOPHOLES, THREE PRICE TAGS · STILL OPEN';
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Next act', () => { setAct(act + 1, st.now()); st.pulse(DUR[act] + 2); });
    bPlan = btn(controls, 'Try the next plan', () => {
      if (act !== 1) return;
      const t = st.now();
      // jump straight to the next plan; realign the act clock so the
      // schedule doesn't immediately re-advance it
      const next = clamp(plan + 1, 0, 3);
      actStart = t - (next > 0 ? PLAN_END[next - 1] : 0) - 0.01;
      setPlan(next, t);
      st.pulse(8);
    });
    bPlan.disabled = true;
    return () => st.destroy();
  }

  /* ---------- patch: stage.now() + lastT tracking ---------- */
  // wrap each viz's stage with a time tracker
  const _stage = stage;
  function stageTracked(canvas, draw, aspect) {
    let lastT = 0;
    const wrapped = (ctx, W, H, t, dt) => {
      lastT = t;
      draw(ctx, W, H, t, dt);
    };
    const s = _stage(canvas, wrapped, aspect);
    s.now = () => lastT;
    return s;
  }
  // eslint-disable-next-line no-func-assign
  stage = stageTracked;

  window.VIZ = {
    measurement: vizMeasurement,
    entanglement: vizEntanglement,
    duality: vizDuality,
    boundary: vizBoundary,
    psi: vizPsi,
    information: vizInformation,
    gravity: vizGravity,
    vacuum: vizVacuum,
    time: vizTime,
    randomness: vizRandomness,
  };
})();
