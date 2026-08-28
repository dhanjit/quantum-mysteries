/* Headless smoke test: mount each viz, simulate 35s of frames, cleanup. */
'use strict';

const ctxStub = () => new Proxy({}, {
  get(t, prop) {
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
      return () => ({ addColorStop() {} });
    }
    if (prop === 'measureText') return () => ({ width: 0 });
    if (typeof prop === 'string') return t[prop] !== undefined ? t[prop] : () => {};
    return () => {};
  },
  set(t, prop, v) { t[prop] = v; return true; },
});

function el() {
  return {
    children: [],
    style: {},
    textContent: '',
    disabled: false,
    className: '',
    innerHTML: '',
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { this.children.push(c); return c; },
  };
}

const rafQueue = [];
global.requestAnimationFrame = (cb) => { rafQueue.push(cb); return rafQueue.length; };
global.cancelAnimationFrame = () => {};
global.performance = { now: () => simNow };
global.ResizeObserver = class { observe() {} disconnect() {} };
global.document = { createElement: () => el(), hidden: false };
global.window = {
  matchMedia: () => ({ matches: false }),
  devicePixelRatio: 1,
};
let simNow = 0;
const timeouts = [];
global.setTimeout = (fn, ms) => { timeouts.push({ fn, at: simNow + ms }); return timeouts.length; };
global.clearTimeout = () => {};

require(require('path').join(__dirname, '..', 'public', 'viz.js'));
const VIZ = global.window.VIZ;

let failures = 0;
for (const key of Object.keys(VIZ)) {
  simNow = 0;
  rafQueue.length = 0;
  timeouts.length = 0;
  const canvas = {
    ...el(),
    width: 0, height: 0,
    parentElement: { ...el(), clientWidth: 800 },
    getContext: () => ctxStub(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 450 }),
  };
  const controls = el();
  try {
    const cleanup = VIZ[key](canvas, controls);
    // simulate ~93s at ~30fps
    for (let f = 0; f < 2800; f++) {
      simNow += 33.3;
      for (const t of timeouts.splice(0)) if (t.at <= simNow) t.fn();
      const cbs = rafQueue.splice(0);
      for (const cb of cbs) cb(simNow);
      if (!rafQueue.length) break;
    }
    cleanup();
    console.log(`ok   ${key}`);
  } catch (err) {
    failures++;
    console.log(`FAIL ${key}: ${err.message}\n${err.stack.split('\n')[1]}`);
  }
}
process.exit(failures ? 1 : 0);
