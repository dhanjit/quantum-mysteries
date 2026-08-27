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
  const DIM = 'rgba(233,228,214,0.35)';
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
    let collapse = null; // {x0, t0}
    let nMeas = 0;
    const ro = readout(controls);
    ro.textContent = 'AWAITING OBSERVATION';

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
      const base = H * 0.82, top = H * 0.16;
      const d = density(t);

      // collapse blending
      let k = 0, x0 = 0.5;
      if (collapse) {
        const dt = t - collapse.t0;
        x0 = collapse.x0;
        if (dt < 0.35) k = easeOut(dt / 0.35);
        else if (dt < 1.15) k = 1;
        else if (dt < 2.9) k = 1 - easeOut((dt - 1.15) / 1.75);
        else { collapse = null; k = 0; }
      }
      const spikeSig = 0.006;
      const blended = d.map((v, i) => {
        const x = i / (N - 1);
        const spike = Math.exp(-((x - x0) ** 2) / (2 * spikeSig * spikeSig));
        return lerp(v, spike, k);
      });

      // axis
      ctx.strokeStyle = FAINT;
      ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();

      // filled |ψ|²
      const col = collapse && k > 0.5 ? GOLD : PH;
      const grad = ctx.createLinearGradient(0, top, 0, base);
      grad.addColorStop(0, col + 'cc');
      grad.addColorStop(1, col + '08');
      ctx.beginPath();
      ctx.moveTo(0, base);
      for (let i = 0; i < N; i++) {
        ctx.lineTo((i / (N - 1)) * W, base - blended[i] * (base - top));
      }
      ctx.lineTo(W, base);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const px = (i / (N - 1)) * W, py = base - blended[i] * (base - top);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // labels
      ctx.fillStyle = DIM;
      ctx.font = MONO(10);
      ctx.fillText('|ψ(x)|²', 12, top - 2 < 12 ? 12 : top - 2);
      if (collapse && k > 0.7) {
        const px = x0 * W;
        ctx.strokeStyle = GOLD;
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px, H * 0.08); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = GOLD;
        ctx.textAlign = px > W - 90 ? 'right' : 'left';
        ctx.fillText('OUTCOME  x = ' + x0.toFixed(3), px + (px > W - 90 ? -8 : 8), H * 0.11);
        ctx.textAlign = 'left';
      }
    }

    const st = stage(canvas, draw, 16 / 9);

    btn(controls, 'Measure', () => {
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
      collapse = { x0, t0: t };
      ro.textContent = `MEASUREMENTS: ${nMeas} · LAST OUTCOME x = ${x0.toFixed(3)}`;
      st.pulse(3.2);
    });

    return () => st.destroy();
  }

  /* ============================================================
     02 — ENTANGLEMENT
     A pair flies apart in superposition; measuring either one
     fixes both, instantly, every time.
     ============================================================ */
  function vizEntanglement(canvas, controls) {
    let pair = null, pairs = 0, correlated = 0;
    const ro = readout(controls);
    let bA, bB;

    function newPair(t) {
      pair = { born: t, measured: 0, sA: 0, sB: 0, ring: -1 };
      if (bA) { bA.disabled = false; bB.disabled = false; }
    }

    function measure(which, t) {
      if (!pair || pair.measured) return;
      pair.measured = t;
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

      // channel
      ctx.strokeStyle = FAINT;
      ctx.setLineDash([1, 5]);
      ctx.beginPath(); ctx.moveTo(xA, cy); ctx.lineTo(xB, cy); ctx.stroke();
      ctx.setLineDash([]);

      const m = pair.measured;
      if (m) {
        const dt = t - m;
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
      if (m && t - m < 2.2) {
        ctx.fillStyle = GOLD;
        ctx.fillText('BOTH DECIDED. NO SIGNAL TRAVELLED.', W / 2, H * 0.14);
      }
      ctx.textAlign = 'left';
    }

    const st = stage(canvas, draw, 16 / 9);
    bA = btn(controls, 'Measure A', () => { measure('A', st.now()); st.pulse(2.5); });
    bB = btn(controls, 'Measure B', () => { measure('B', st.now()); st.pulse(2.5); });
    ro.textContent = 'A PAIR IN SUPERPOSITION. MEASURE EITHER ONE.';
    return () => st.destroy();
  }

  /* ============================================================
     03 — WAVE–PARTICLE DUALITY
     Single particles through two slits build an interference
     pattern — until you watch which slit they take.
     ============================================================ */
  function vizDuality(canvas, controls) {
    let watching = false;
    let flying = [];   // {p: 0..1, slit, y0, yT, jx}
    let hits = [];     // {y, age}
    let bins = null, nHits = 0;
    const NB = 64;
    const ro = readout(controls);

    function targetY(H) {
      const cy = H / 2, envA = H * 0.30;
      // rejection-sample from the appropriate distribution
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
        ctx.fillText('DETECTORS ON', barX + 24, H * 0.09);
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
        ctx.fillRect(scrX + rand(0, 0) + 2, h.y, 2, 2);
      }
      ctx.globalAlpha = 1;

      // histogram right of screen
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

      ro.textContent = `PARTICLES DETECTED: ${nHits} · SENT ONE AT A TIME`;
    }

    const st = stage(canvas, draw, 16 / 9);
    const tb = btn(controls, 'Which-path detector: off', () => {
      watching = !watching;
      tb.textContent = 'Which-path detector: ' + (watching ? 'on' : 'off');
      tb.setAttribute('aria-pressed', watching);
      bins = null; hits = []; nHits = 0;
      st.pulse(6);
    });
    tb.setAttribute('aria-pressed', 'false');
    btn(controls, 'Clear screen', () => { bins = null; hits = []; nHits = 0; st.pulse(6); });
    return () => st.destroy();
  }

  /* ============================================================
     04 — QUANTUM–CLASSICAL BOUNDARY
     One object in two places. The environment keeps looking.
     ============================================================ */
  function vizBoundary(canvas, controls) {
    let coherence = 1, chosen = Math.random() < 0.5 ? 0 : 1, collisions = 0;
    let env = [], isolatedUntil = 0;
    const ro = readout(controls);

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      const cy = H * 0.5, R = Math.min(H * 0.16, 34);
      const xs = [W * 0.36, W * 0.64];

      // interference fringes between the two positions, ∝ coherence
      if (coherence > 0.02) {
        ctx.save();
        ctx.globalAlpha = coherence * 0.35;
        for (let x = xs[0] - R; x <= xs[1] + R; x += 7) {
          const v = Math.cos((x - xs[0]) * 0.24 + t * 1.4) ** 2;
          ctx.fillStyle = PH;
          ctx.globalAlpha = coherence * 0.28 * v;
          ctx.fillRect(x, cy - R * 1.5, 2.4, R * 3);
        }
        ctx.restore();
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

      // environment particles
      const isolated = t < isolatedUntil;
      if (!isolated && Math.random() < dt * 26 && env.length < 60) {
        const side = Math.floor(rand(0, 4));
        let x, y, vx, vy;
        const s = rand(40, 90);
        if (side === 0) { x = -5; y = rand(0, H); vx = s; vy = rand(-20, 20); }
        else if (side === 1) { x = W + 5; y = rand(0, H); vx = -s; vy = rand(-20, 20); }
        else if (side === 2) { x = rand(0, W); y = -5; vx = rand(-20, 20); vy = s; }
        else { x = rand(0, W); y = H + 5; vx = rand(-20, 20); vy = -s; }
        env.push({ x, y, vx, vy, hit: false });
      }
      for (const p of env) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (!p.hit) {
          for (let i = 0; i < 2; i++) {
            const dx = p.x - xs[i], dy = p.y - cy;
            if (dx * dx + dy * dy < R * R) {
              p.hit = true;
              // scatter
              const ang = Math.atan2(dy, dx) + rand(-0.6, 0.6);
              const sp = Math.hypot(p.vx, p.vy);
              p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp;
              if (coherence > 0) { coherence = Math.max(0, coherence - 0.012); collisions++; }
            }
          }
        }
        ctx.fillStyle = p.hit ? GOLD : DIM;
        ctx.globalAlpha = p.hit ? 0.9 : 0.55;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      env = env.filter((p) => p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20);

      ctx.fillStyle = DIM; ctx.font = MONO(10); ctx.textAlign = 'center';
      const label = coherence > 0.65 ? 'ONE OBJECT, TWO PLACES'
        : coherence > 0.15 ? 'THE ENVIRONMENT IS WATCHING…'
        : 'LOOKS CLASSICAL NOW. BUT WHY THIS ONE?';
      ctx.fillText(label, W / 2, H * 0.09);
      ctx.textAlign = 'left';

      ro.textContent = `COHERENCE: ${(coherence * 100).toFixed(0)}% · STRAY COLLISIONS: ${collisions}`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Re-isolate the system', () => {
      coherence = 1; collisions = 0; env = [];
      chosen = Math.random() < 0.5 ? 0 : 1;
      isolatedUntil = st.now() + 1.4;
      st.pulse(4);
    });
    return () => st.destroy();
  }

  /* ============================================================
     05 — IS THE WAVEFUNCTION REAL?
     The same ψ, drawn twice: as a thing, and as knowledge.
     ============================================================ */
  function vizPsi(canvas, controls) {
    let collapse = null;
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

      let k = 0, x0 = 0.5;
      if (collapse) {
        const dt = t - collapse.t0;
        x0 = collapse.x0;
        if (dt < 0.5) k = easeOut(dt / 0.5);
        else if (dt < 1.4) k = 1;
        else if (dt < 3) k = 1 - easeOut((dt - 1.4) / 1.6);
        else collapse = null;
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
        const ph = k > 0 ?
          lerp(clamp(p(x, t), 0, 1), Math.abs(x - x0) < 0.03 ? 1 : 0, k) :
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
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Measure both', () => {
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
    let inbits = [], outbits = [], swallowed = 0, diary = 0;
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
      const R = Math.min(H * 0.2, 44);

      // accretion glow
      const glow = ctx.createRadialGradient(bx, by, R, bx, by, R * 2.6);
      glow.addColorStop(0, 'rgba(232,184,75,0.28)');
      glow.addColorStop(1, 'rgba(232,184,75,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(bx, by, R * 2.6, 0, TAU); ctx.fill();

      // horizon
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(bx, by, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(bx, by, R + 1.5, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;

      // infalling structured bits — spiral in
      if (Math.random() < dt * 9 && inbits.length < 70) spawnBit(W, H);
      ctx.font = MONO(11);
      for (const b of inbits) {
        b.r -= b.sp * dt * (28 + 3200 / (b.r + 24));
        b.ang += dt * (0.35 + 120 / (b.r + 30));
        const x = b.bx + Math.cos(b.ang) * b.r;
        const y = b.by + Math.sin(b.ang) * b.r * 0.72;
        if (b.r <= R * 0.9) { swallowed++; continue; }
        ctx.fillStyle = b.isDiary ? GOLD : PH;
        ctx.globalAlpha = clamp(0.9 - (b.r / (W * 0.5)) * 0.3, 0.35, 0.95);
        ctx.fillText(b.ch, x, y);
      }
      inbits = inbits.filter((b) => b.r > R * 0.9);
      ctx.globalAlpha = 1;

      // outgoing thermal radiation — identical, featureless
      if (Math.random() < dt * 7 && outbits.length < 50) {
        const a = rand(0, TAU);
        outbits.push({ x: bx + Math.cos(a) * (R + 4), y: by + Math.sin(a) * (R + 4), vx: Math.cos(a) * 34, vy: Math.sin(a) * 34, life: 0 });
      }
      for (const o of outbits) {
        o.x += o.vx * dt; o.y += o.vy * dt; o.life += dt;
        ctx.fillStyle = 'rgba(160,160,160,0.8)';
        ctx.globalAlpha = clamp(1 - o.life / 4, 0, 0.7);
        ctx.beginPath(); ctx.arc(o.x, o.y, 1.3, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      outbits = outbits.filter((o) => o.life < 4 && o.x > -10 && o.x < W + 10 && o.y > -10 && o.y < H + 10);

      ctx.fillStyle = DIM; ctx.font = MONO(10);
      ctx.fillText('IN: STRUCTURE', 14, H * 0.12);
      ctx.fillText('OUT: STATIC', 14, H * 0.12 + 16);
      ro.textContent = `SWALLOWED: ${swallowed} BITS · EMITTED: THERMAL NOISE · LEDGER: DOES NOT BALANCE`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Drop in a diary', () => {
      const chars = DIARY.replace(/ /g, '');
      for (let i = 0; i < chars.length; i++) {
        setTimeout(() => spawnBit(st.W, st.H, chars[i]), i * 90);
      }
      diary++;
      st.pulse(6);
    });
    return () => st.destroy();
  }

  /* ============================================================
     07 — QUANTUM GRAVITY
     Smooth spacetime, until you look closely enough.
     ============================================================ */
  function vizGravity(canvas, controls) {
    let mouse = null;
    const ro = readout(controls);
    ro.textContent = 'MOVE THE LENS. THE GRID IS SMOOTH — THE FOAM IS A GUESS.';

    function gridPoint(x, y, W, H, jitter, t) {
      // curvature toward central mass
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

    function draw(ctx, W, H, t) {
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
      // foam bubbles
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

      // lens ring + label
      ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(lx, ly, LR, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = GOLD; ctx.font = MONO(10); ctx.textAlign = 'center';
      ctx.fillText('×10³⁴ — PLANCK SCALE, 10⁻³⁵ m', lx, ly + LR + 16);
      ctx.fillStyle = DIM;
      ctx.fillText('GENERAL RELATIVITY: SMOOTH', W / 2, H * 0.08);
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
    let pairs = [], born = 0, barK = 0, barPlay = true;
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

      ro.textContent = `PAIRS FLICKERED: ${born} · PREDICTION / OBSERVATION ≈ 10¹²⁰`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Recount the modes', () => { barK = 0; st.pulse(3); });
    return () => st.destroy();
  }

  /* ============================================================
     09 — THE ARROW OF TIME
     Reversible laws, irreversible world. Try running it backwards.
     ============================================================ */
  function vizTime(canvas, controls) {
    let parts = null, reversals = 0, dir = 1;
    const N = 110;
    const ro = readout(controls);
    const hist = [];

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

      // entropy sparkline
      const S = entropy(W, H);
      hist.push(S);
      if (hist.length > 260) hist.shift();
      const Smax = Math.log(60);
      const gy0 = H * 0.06, gh = H * 0.16, gx0 = W * 0.62, gw = W * 0.34;
      ctx.strokeStyle = FAINT;
      ctx.strokeRect(gx0, gy0, gw, gh);
      ctx.beginPath();
      hist.forEach((s, i) => {
        const x = gx0 + (i / 259) * gw;
        const y = gy0 + gh - (s / Smax) * gh * 0.92;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = PAPER; ctx.stroke();
      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.fillText('ENTROPY', gx0 + 6, gy0 + 12);

      ctx.fillStyle = dir > 0 ? DIM : GOLD;
      ctx.font = MONO(10);
      ctx.fillText(dir > 0 ? 'TIME →' : '← TIME (SAME LAWS)', 14, H * 0.1);

      ro.textContent = `S = ${S.toFixed(2)} · REVERSALS: ${reversals} · THE LAWS DON'T MIND`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Reverse every velocity', () => {
      if (!parts) return;
      for (const p of parts) { p.vx = -p.vx; p.vy = -p.vy; }
      dir = -dir; reversals++;
      st.pulse(8);
    });
    btn(controls, 'Fresh start', () => { parts = null; dir = 1; st.pulse(6); });
    return () => st.destroy();
  }

  /* ============================================================
     10 — IS ANYTHING TRULY RANDOM?
     A Bell-test meter: the needle passes the classical limit.
     ============================================================ */
  function vizRandomness(canvas, controls) {
    let trials = 0, running = true;
    const bits = [];
    const ro = readout(controls);
    const S_TRUE = 2 * Math.SQRT2;

    function draw(ctx, W, H, t, dt) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.72, R = Math.min(W * 0.34, H * 0.56);

      if (running) {
        trials += Math.max(1, Math.floor(dt * 640));
        if (Math.random() < dt * 22) {
          bits.push(Math.random() < 0.5 ? '0' : '1');
          if (bits.length > 60) bits.shift();
        }
      }
      const noise = 0.5 / Math.sqrt(Math.max(trials, 2));
      const S = clamp(S_TRUE + (Math.sin(t * 13.7) + Math.sin(t * 7.3)) * noise * 2, 0, 3.1);

      // gauge arc: S from 0 → 3.1 maps to angle 200° → -20°
      const a0 = Math.PI * 1.11, a1 = -Math.PI * 0.11;
      const angOf = (s) => lerp(a0, a1, s / 3.1);

      ctx.lineWidth = 2;
      // zones
      const zone = (s1, s2, color, alpha) => {
        ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, R, -angOf(s1), -angOf(s2), false);
        ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 2;
      };
      zone(0, 2, 'rgba(233,228,214,0.25)', 0.6);       // classical
      zone(2, S_TRUE, PH, 0.5);                        // quantum territory
      zone(S_TRUE, 3.1, 'rgba(232,184,75,0.35)', 0.5); // beyond even QM

      // ticks + labels
      ctx.font = MONO(9); ctx.fillStyle = DIM; ctx.textAlign = 'center';
      const tick = (s, label, color) => {
        const a = angOf(s);
        const x1 = cx + Math.cos(a) * (R - 10), y1 = cy - Math.sin(a) * (R - 10);
        const x2 = cx + Math.cos(a) * (R + 12), y2 = cy - Math.sin(a) * (R + 12);
        ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        const lx = cx + Math.cos(a) * (R + 30), lyy = cy - Math.sin(a) * (R + 26);
        ctx.fillStyle = color;
        ctx.fillText(label, lx, lyy);
      };
      tick(2, 'S = 2 · CLASSICAL LIMIT', PAPER);
      tick(S_TRUE, '2√2 · QUANTUM BOUND', GOLD);

      // needle
      const na = angOf(S);
      ctx.strokeStyle = PH; ctx.lineWidth = 2;
      ctx.shadowColor = PH; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(na) * (R - 22), cy - Math.sin(na) * (R - 22));
      ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 1;
      ctx.fillStyle = PAPER;
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill();

      ctx.fillStyle = PH; ctx.font = MONO(13);
      ctx.fillText('S = ' + S.toFixed(4), cx, cy - R * 0.36);
      ctx.fillStyle = DIM; ctx.font = MONO(9);
      ctx.fillText('CHSH CORRELATION', cx, cy - R * 0.36 + 14);

      // raw quantum bits, bottom strip
      ctx.font = MONO(10);
      ctx.textAlign = 'left';
      let bx = 14;
      for (let i = 0; i < bits.length; i++) {
        ctx.globalAlpha = 0.25 + 0.6 * (i / bits.length);
        ctx.fillStyle = PH;
        ctx.fillText(bits[i], bx, H * 0.94);
        bx += 9;
        if (bx > W - 14) break;
      }
      ctx.globalAlpha = 1;

      ro.textContent = `TRIALS: ${trials.toLocaleString()} · NO LOCAL SCRIPT CAN REACH PAST 2`;
    }

    const st = stage(canvas, draw, 16 / 9);
    btn(controls, 'Restart the trials', () => { trials = 0; bits.length = 0; st.pulse(5); });
    return () => st.destroy();
  }

  /* ---------- patch: stage.now() + lastT tracking ---------- */
  // wrap each viz's stage with a time tracker
  const _stage = stage;
  function stageTracked(canvas, draw, aspect) {
    let s;
    const wrapped = (ctx, W, H, t, dt) => {
      s.lastT = t;
      draw(ctx, W, H, t, dt);
    };
    s = _stage(canvas, wrapped, aspect);
    s.now = () => s.lastT || 0;
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
