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
    const modes = [
      { w: 0.5, c0: 0.34, amp: 0.16, sp: 0.21, ph: rand(0, TAU), sig: 0.085 },
      { w: 0.34, c0: 0.62, amp: 0.2, sp: 0.16, ph: rand(0, TAU), sig: 0.11 },
      { w: 0.26, c0: 0.5, amp: 0.24, sp: 0.11, ph: rand(0, TAU), sig: 0.065 },
    ];
    const motes = [];
    for (let i = 0; i < 90; i++) {
      motes.push({ u: Math.random(), v: Math.random(), tw: rand(0, TAU) });
    }
    let collapse = null; // {x0, t0}
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
      const d = density(t);

      // looks happen on their own if nobody intervenes
      if (!collapse && t > 5 && t - lastAction > 7) look();

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

      // labels
      ctx.fillStyle = DIM;
      ctx.font = MONO(10);
      ctx.fillText('PROBABILITY FOG · |ψ(x)|²', 12, Math.max(top - 4, 12));
      if (!collapse) {
        ctx.textAlign = 'center';
        ctx.fillText(touchOnly ? 'TAP THE FOG TO LOOK' : 'POINT ANYWHERE — CLICK TO LOOK', W / 2, H * 0.955);
        ctx.textAlign = 'left';
      }
    }

    const st = stage(canvas, draw, 16 / 9);

    function look() {
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
     A pair flies apart in superposition; measuring either one
     fixes both, instantly, every time.
     ============================================================ */
  function vizEntanglement(canvas, controls) {
    let pair = null, pairs = 0, correlated = 0;
    let posA = null, posB = null, lastUser = -99;
    const touchOnly = window.matchMedia('(hover: none)').matches;
    const ro = readout(controls);
    let bA, bB;

    function newPair(t) {
      pair = { born: t, measured: false, mT: 0, sA: 0, sB: 0 };
      if (bA) { bA.disabled = false; bB.disabled = false; }
    }

    function measure(which, t) {
      if (!pair || pair.measured) return;
      pair.measured = true;
      pair.mT = t;
      pair.sA = Math.random() < 0.5 ? 1 : -1;
      pair.sB = -pair.sA;
      pair.by = which;
      pairs++; correlated++;
      ro.textContent = `PAIRS: ${pairs} · ANTI-CORRELATED: ${correlated}/${pairs} · EVERY TIME`;
      bA.disabled = true; bB.disabled = true;
    }

    function drawParticle(ctx, x, y, spin, measured, t, isTrigger) {
      ctx.save();
      ctx.translate(x, y);
      const R = 16;
      if (!measured) {
        // superposed: both arrows, flickering
        for (const s of [1, -1]) {
          const a = 0.28 + 0.18 * Math.sin(t * 7 + s * 2);
          ctx.globalAlpha = a;
          arrow(ctx, s, R, PAPER);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = DIM;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.arc(0, 0, R + 7, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.globalAlpha = 1;
        arrow(ctx, spin, R, isTrigger ? GOLD : PH);
        ctx.strokeStyle = isTrigger ? GOLD : PH;
        ctx.beginPath(); ctx.arc(0, 0, R + 7, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }

    function arrow(ctx, dir, R, color) {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, dir * R); ctx.lineTo(0, -dir * R); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -dir * (R + 2));
      ctx.lineTo(-5, -dir * (R - 7));
      ctx.lineTo(5, -dir * (R - 7));
      ctx.closePath(); ctx.fill();
    }

    function draw(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      if (!pair) newPair(t);
      const age = t - pair.born;
      const cy = H * 0.44;
      const sep = Math.min(easeOut(Math.min(age / 6, 1)) * (W * 0.42), W * 0.42);
      const xA = W / 2 - 30 - sep, xB = W / 2 + 30 + sep;
      posA = { x: xA, y: cy }; posB = { x: xB, y: cy };

      // the experiment demonstrates itself when nobody intervenes
      if (!pair.measured && age > 4 && t - lastUser > 8) {
        measure(Math.random() < 0.5 ? 'A' : 'B', t);
      }

      // channel
      ctx.strokeStyle = FAINT;
      ctx.setLineDash([1, 5]);
      ctx.beginPath(); ctx.moveTo(xA, cy); ctx.lineTo(xB, cy); ctx.stroke();
      ctx.setLineDash([]);

      const m = pair.measured;
      if (m) {
        const dt = t - pair.mT;
        // simultaneous flash at both ends
        if (dt < 0.8) {
          const r = easeOut(dt / 0.8) * 46;
          ctx.globalAlpha = 1 - dt / 0.8;
          for (const x of [xA, xB]) {
            ctx.strokeStyle = GOLD;
            ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        if (dt > 2.2) newPair(t);
      }

      drawParticle(ctx, xA, cy, pair.sA, m, t, pair.by === 'A');
      drawParticle(ctx, xB, cy, pair.sB, m, t, pair.by === 'B');

      // distance readout — pretend each pixel is a light-year
      const ly = (sep * 2 + 60) / 10;
      ctx.fillStyle = DIM; ctx.font = MONO(10); ctx.textAlign = 'center';
      ctx.fillText(`SEPARATION: ${ly.toFixed(1)} LIGHT-YEARS (PRETEND)`, W / 2, H * 0.82);
      ctx.fillText('A', xA, cy + 44);
      ctx.fillText('B', xB, cy + 44);
      if (m && t - pair.mT < 2.2) {
        ctx.fillStyle = GOLD;
        ctx.fillText('BOTH DECIDED. NO SIGNAL TRAVELLED.', W / 2, H * 0.14);
      } else if (!m) {
        ctx.fillStyle = DIM;
        ctx.fillText(touchOnly ? 'TAP A PARTICLE — OR JUST WATCH' : 'CLICK A PARTICLE — OR JUST WATCH', W / 2, H * 0.14);
      }
      ctx.textAlign = 'left';
    }

    const st = stage(canvas, draw, 16 / 9);

    const near = (p, x, y) => p && (x - p.x) ** 2 + (y - p.y) ** 2 < 34 * 34;
    const canvasXY = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onClick = (e) => {
      if (!pair || pair.measured) return;
      const [x, y] = canvasXY(e);
      if (near(posA, x, y)) { lastUser = st.now(); measure('A', st.now()); st.pulse(2.5); }
      else if (near(posB, x, y)) { lastUser = st.now(); measure('B', st.now()); st.pulse(2.5); }
    };
    const onMove = (e) => {
      const [x, y] = canvasXY(e);
      const hot = pair && !pair.measured && (near(posA, x, y) || near(posB, x, y));
      canvas.style.cursor = hot ? 'pointer' : '';
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('pointermove', onMove);

    bA = btn(controls, 'Measure A', () => { lastUser = st.now(); measure('A', st.now()); st.pulse(2.5); });
    bB = btn(controls, 'Measure B', () => { lastUser = st.now(); measure('B', st.now()); st.pulse(2.5); });
    ro.textContent = 'IT RUNS ITSELF — OR MEASURE A PARTICLE YOURSELF';
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

      // emit
      if (Math.random() < dt * 14 && flying.length < 26) {
        flying.push({ p: 0, slit: Math.random() < 0.5 ? 0 : 1, yT: targetY(H), speed: rand(0.55, 0.8) });
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
     The same ψ, drawn twice: as a thing, and as knowledge.
     ============================================================ */
  function vizPsi(canvas, controls) {
    let collapse = null;
    let lastMeasure = 0;
    const dots = [];
    for (let i = 0; i < 260; i++) dots.push({ u: Math.random(), v: Math.random(), tw: rand(0, TAU) });
    const ro = readout(controls);
    ro.textContent = 'SAME MATHEMATICS. TWO READINGS.';

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

    function draw(ctx, W, H, t) {
      ctx.clearRect(0, 0, W, H);
      const mid = W / 2;
      const base = H * 0.82, top = H * 0.3;

      // measures itself if nobody presses anything
      if (!collapse && t > 4 && t - lastMeasure > 8) {
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
      ctx.fillStyle = PH; ctx.fillText('ψ AS A THING', mid / 2, H * 0.12);
      ctx.fillStyle = GOLD; ctx.fillText('ψ AS KNOWLEDGE', mid + mid / 2, H * 0.12);
      ctx.fillStyle = DIM;
      ctx.fillText('a field that must physically jump', mid / 2, H * 0.95);
      ctx.fillText('a guess that simply updates', mid + mid / 2, H * 0.95);
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
        ctx.fillText('THE FIELD SNAPPED — EVERYWHERE AT ONCE', mid / 2, H * 0.2);
        ctx.fillStyle = GOLD;
        ctx.fillText('NOTHING MOVED — A MIND UPDATED', mid + mid / 2, H * 0.2);
        ctx.font = MONO(11);
        ctx.fillStyle = PAPER;
        ctx.fillText('SAME EVENT — WHICH STORY IS TRUE?', mid, H * 0.24);
        ctx.textAlign = 'left';
      }
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Measure both', () => {
      lastMeasure = st.now();
      collapse = { x0: sampleX(st.now()), t0: st.now() };
      ro.textContent = 'LEFT: SOMETHING HAPPENED. RIGHT: YOU JUST LEARNED. WHICH IS TRUE?';
      st.pulse(3.5);
    });
    return () => st.destroy();
  }

  /* ============================================================
     06 — BLACK HOLE INFORMATION PARADOX
     Structured bits fall in; featureless static leaks out.
     ============================================================ */
  function vizInformation(canvas, controls) {
    let inbits = [], outbits = [], swallowed = 0;
    let lastDiary = 0, cycleStart = 0, curR = 44;
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

        ctx.fillStyle = DIM; ctx.font = MONO(10);
        ctx.fillText('IN: STRUCTURE', 14, H * 0.12);
        ctx.fillText('OUT: HEAT WITH NO PATTERN WE CAN READ', 14, H * 0.12 + 16);
        ctx.fillStyle = GOLD;
        ctx.fillText(`HOLE REMAINING: ${(100 * (1 - evapK)).toFixed(0)}%`, 14, H * 0.12 + 32);
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

      // the two bars
      const bx = W * 0.72, bw = (W - bx - 20) / 2 - 8;
      const base = H * 0.9;
      if (barPlay) barK = clamp(barK + dt * 0.5, 0, 1);
      // once the bar tops out, spell the ratio out digit by digit, then replay
      if (barK >= 1) {
        zeros = clamp(zeros + dt * 16, 0, 120);
        if (barDoneAt === null) barDoneAt = t;
        else if (t - barDoneAt > 12) { barK = 0; barDoneAt = null; zeros = 0; }
      }

      // observed: a sliver
      ctx.fillStyle = PAPER;
      ctx.fillRect(bx, base - 3, bw, 3);
      ctx.font = MONO(9); ctx.fillStyle = DIM; ctx.textAlign = 'center';
      ctx.fillText('OBSERVED', bx + bw / 2, base + 14);
      ctx.fillText('Λ (dark energy)', bx + bw / 2, base + 26);

      // predicted: leaves the chart
      const px = bx + bw + 16;
      const ph = easeOut(barK) * (base - H * 0.04);
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(px, base - ph, bw, ph);
      ctx.globalAlpha = 1;
      if (barK > 0.97) {
        // break marks: it keeps going
        ctx.strokeStyle = '#05070c'; ctx.lineWidth = 3;
        for (const yy of [H * 0.12, H * 0.2]) {
          ctx.beginPath();
          ctx.moveTo(px - 4, yy + 4); ctx.lineTo(px + bw + 4, yy - 4);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
        ctx.fillStyle = GOLD;
        ctx.fillText('↑ ×10¹²⁰', px + bw / 2, H * 0.08);
      }
      ctx.fillStyle = DIM;
      ctx.fillText('PREDICTED', px + bw / 2, base + 14);
      ctx.fillText('(QFT naïve sum)', px + bw / 2, base + 26);
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
    btn(controls, 'Recount the modes', () => { barK = 0; barDoneAt = null; zeros = 0; st.pulse(3); });
    return () => st.destroy();
  }

  /* ============================================================
     09 — THE ARROW OF TIME
     Reversible laws, irreversible world. Try running it backwards.
     ============================================================ */
  function vizTime(canvas, controls) {
    let parts = null, reversals = 0, dir = 1, lastReverse = 0, lastSample = 0;
    const N = 110;
    const ro = readout(controls);
    const hist = [];

    function doReverse() {
      if (!parts) return;
      for (const p of parts) { p.vx = -p.vx; p.vy = -p.vy; }
      dir = -dir; reversals++;
    }

    function reset(W, H) {
      parts = [];
      for (let i = 0; i < N; i++) {
        parts.push({
          x: rand(W * 0.05, W * 0.22),
          y: rand(H * 0.68, H * 0.92),
          vx: rand(-70, 70),
          vy: rand(-70, 70),
        });
      }
      hist.length = 0;
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

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      if (!parts) reset(W, H);

      // time reverses itself, again and again
      if (t - lastReverse > 11 && t > 2) { lastReverse = t; doReverse(); }

      for (const p of parts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 4) { p.x = 8 - p.x; p.vx = -p.vx; }
        if (p.x > W - 4) { p.x = 2 * (W - 4) - p.x; p.vx = -p.vx; }
        if (p.y < 4) { p.y = 8 - p.y; p.vy = -p.vy; }
        if (p.y > H - 4) { p.y = 2 * (H - 4) - p.y; p.vy = -p.vy; }
        ctx.fillStyle = dir > 0 ? PH : GOLD;
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // entropy sparkline — sampled slowly so a whole rise-then-fall fits
      const S = entropy(W, H);
      if (t - lastSample > 0.1) {
        lastSample = t;
        hist.push({ s: S, rev: dir < 0 });
        if (hist.length > 260) hist.shift();
      }
      const Smax = Math.log(60);
      const gy0 = H * 0.06, gh = H * 0.16, gx0 = W * 0.62, gw = W * 0.34;
      const sy = (s) => gy0 + gh - (s / Smax) * gh * 0.92;
      ctx.strokeStyle = FAINT;
      ctx.strokeRect(gx0, gy0, gw, gh);
      ctx.beginPath();
      hist.forEach((h2, i) => {
        const x = gx0 + (i / 259) * gw;
        i ? ctx.lineTo(x, sy(h2.s)) : ctx.moveTo(x, sy(h2.s));
      });
      ctx.strokeStyle = PAPER; ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6;
      for (let i = 1; i < hist.length; i++) {
        if (!hist[i].rev) continue;
        ctx.beginPath();
        ctx.moveTo(gx0 + ((i - 1) / 259) * gw, sy(hist[i - 1].s));
        ctx.lineTo(gx0 + (i / 259) * gw, sy(hist[i].s));
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.fillText('ENTROPY', gx0 + 6, gy0 + 12);

      ctx.fillStyle = dir > 0 ? DIM : GOLD;
      ctx.font = MONO(10);
      ctx.fillText(dir > 0 ? 'TIME →' : '← TIME (SAME LAWS)', 14, H * 0.1);

      // say the impossible part while it is on screen
      ctx.textAlign = 'center';
      if (reversals > 0 && t - lastReverse < 3.2) {
        ctx.fillStyle = GOLD;
        ctx.fillText(dir < 0 ? 'EVERY VELOCITY FLIPPED — THE LAWS DO NOT OBJECT' : 'FORWARD AGAIN — NO RULE WAS EVER BROKEN', W / 2, H * 0.95);
      } else if (dir < 0) {
        ctx.fillStyle = GOLD;
        ctx.fillText('ENTROPY FALLING — PERFECTLY LEGAL. AT EGG SIZE, YOU WILL NEVER SEE IT.', W / 2, H * 0.95);
      }
      ctx.textAlign = 'left';

      ro.textContent = `S = ${S.toFixed(2)} · REVERSALS: ${reversals} · THE LAWS DON'T MIND`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Reverse every velocity', () => {
      lastReverse = st.now();
      doReverse();
      st.pulse(8);
    });
    btn(controls, 'Fresh start', () => { parts = null; dir = 1; lastReverse = st.now(); st.pulse(6); });
    return () => st.destroy();
  }

  /* ============================================================
     10 — IS ANYTHING TRULY RANDOM?
     A Bell-test meter: the needle passes the classical limit.
     ============================================================ */
  function vizRandomness(canvas, controls) {
    const ro = readout(controls);
    const DUR = [13, 11, 15];
    let act = 0, actStart = 0;
    // act 1 — the coin nobody can call
    let bits = [], guesses = 0, correct = 0, nextEvent = 0;
    // act 2 — the wall
    let crossT = null;
    // act 3 — the ways out
    const HATCHES = [
      { name: 'MANY-WORLDS',      how: ['EVERY OUTCOME', 'ACTUALLY HAPPENS'],        price: ['PRICE: ALL VERSIONS', 'OF YOU HAPPEN TOO'] },
      { name: 'PILOT WAVE',       how: ['A HIDDEN LAYER', 'DECIDES EACH BIT'],       price: ['PRICE: INFLUENCE', 'FASTER THAN LIGHT'] },
      { name: 'SUPERDETERMINISM', how: ['THE UNIVERSE SCRIPTED', 'YOUR QUESTIONS TOO'], price: ['PRICE: NO EXPERIMENT', 'CAN BE TRUSTED'] },
    ];

    function setAct(i, t) {
      act = ((i % 3) + 3) % 3;
      actStart = t;
      if (act === 0) { bits = []; guesses = 0; correct = 0; nextEvent = 0; }
      if (act === 1) crossT = null;
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
        ctx.fillText(b.ok ? '\u2713' : '\u2717', x, cy - 8);
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
      const cy = H * 0.52;
      const x0 = W * 0.12, x1 = W * 0.88;
      const xOf = (s) => lerp(x0, x1, s / 3);
      const S_TRUE = 2 * Math.SQRT2;

      // question first
      ctx.textAlign = 'center'; ctx.font = MONO(10); ctx.fillStyle = PAPER;
      ctx.fillText('MAYBE THE BITS ONLY LOOK RANDOM — A SECRET SCRIPT, WRITTEN AT BIRTH?', W / 2, H * 0.2);
      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.fillText('BELL TEST: ANY SUCH LOCAL SCRIPT SCORES AT MOST 2 ON THIS DIAL', W / 2, H * 0.2 + 15);

      // the track
      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
      ctx.font = MONO(9); ctx.fillStyle = DIM;
      for (const s of [0, 1, 2, 3]) {
        ctx.beginPath(); ctx.moveTo(xOf(s), cy - 4); ctx.lineTo(xOf(s), cy + 4);
        ctx.strokeStyle = FAINT; ctx.stroke();
        ctx.fillText(String(s), xOf(s), cy + 20);
      }

      // the wall at 2
      ctx.strokeStyle = PAPER; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(xOf(2), cy - 26); ctx.lineTo(xOf(2), cy + 26); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = PAPER;
      ctx.fillText('EVERY LOCAL SCRIPT', xOf(2), cy - 44);
      ctx.fillText('STOPS HERE', xOf(2), cy - 33);

      // the quantum mark
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.moveTo(xOf(S_TRUE), cy - 12); ctx.lineTo(xOf(S_TRUE) - 4, cy - 20); ctx.lineTo(xOf(S_TRUE) + 4, cy - 20); ctx.closePath(); ctx.fill();
      ctx.fillText('2\u221a2 \u2014 WHAT THE LAB MEASURES', xOf(S_TRUE), cy + 38);

      // the measured value slides in and smashes through
      const S = Math.min(S_TRUE, easeOut(Math.min(age / 6.5, 1)) * S_TRUE);
      if (crossT === null && S >= 2) crossT = t;
      ctx.fillStyle = S >= 2 ? GOLD : PH;
      ctx.shadowColor = S >= 2 ? GOLD : PH; ctx.shadowBlur = 12;
      ctx.fillRect(x0, cy - 2, xOf(S) - x0, 4);
      ctx.beginPath(); ctx.arc(xOf(S), cy, 6, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;

      if (crossT !== null && t - crossT < 2.5) {
        const k = (t - crossT) / 2.5;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = GOLD;
        ctx.beginPath(); ctx.arc(xOf(2), cy, 6 + easeOut(k) * 40, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (crossT !== null) {
        ctx.fillStyle = GOLD; ctx.font = MONO(10);
        ctx.fillText('THE WALL BREAKS \u2014 NO LOCAL SCRIPT CAN BE BEHIND THESE BITS', W / 2, H * 0.82);
        ctx.fillStyle = DIM; ctx.font = MONO(9);
        ctx.fillText('SO: TRULY RANDOM? OR SOMETHING STRANGER \u2192', W / 2, H * 0.82 + 15);
      }
    }

    function drawAct3(ctx, W, H, t, age) {
      ctx.textAlign = 'center'; ctx.font = MONO(10); ctx.fillStyle = PAPER;
      ctx.fillText('THREE WAYS TO SAVE DETERMINISM \u2014 EACH WITH A PRICE', W / 2, H * 0.13);

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
      ctx.fillText('NOBODY WANTS TO PAY. AFTER A CENTURY \u2014 STILL OPEN.', W / 2, H * 0.95);
    }

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      const age = t - actStart;
      if (age > DUR[act]) setAct(act + 1, t);

      ctx.textAlign = 'center'; ctx.font = MONO(9); ctx.fillStyle = FAINT;
      const titles = ['ACT 1 OF 3 \u2014 THE COIN NOBODY CAN CALL',
                      'ACT 2 OF 3 \u2014 COULD IT BE A SECRET SCRIPT?',
                      'ACT 3 OF 3 \u2014 THE WAYS OUT'];
      ctx.fillStyle = DIM;
      ctx.fillText(titles[act], W / 2, H * 0.055);

      if (act === 0) drawAct1(ctx, W, H, t);
      else if (act === 1) drawAct2(ctx, W, H, t, age);
      else drawAct3(ctx, W, H, t, age);
      ctx.textAlign = 'left';

      ro.textContent = act === 0
        ? `BITS: ${guesses} \u00b7 PREDICTOR: ${(guesses ? 100 * correct / guesses : 50).toFixed(1)}% \u00b7 COIN FLIP: 50%`
        : act === 1
        ? 'ANY LOCAL SCRIPT \u2264 2 \u00b7 THE LAB MEASURES 2\u221a2 \u2248 2.83'
        : 'THREE LOOPHOLES, THREE PRICE TAGS \u00b7 STILL OPEN';
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Next act', () => { setAct(act + 1, st.now()); st.pulse(DUR[act] + 2); });
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
