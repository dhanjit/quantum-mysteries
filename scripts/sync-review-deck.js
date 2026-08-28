/* Sync the review deck from the site source: copy from app.js, viz engine from viz.js. */
'use strict';
const fs = require('fs');

const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const DECK = process.argv[2];
if (!DECK) {
  console.error('usage: node scripts/sync-review-deck.js <path-to-deck.html>');
  console.error('Rewrites the deck\'s copy blocks from app.js and re-inlines viz.js.');
  process.exit(1);
}

const app = fs.readFileSync(ROOT + '/app.js', 'utf8');
const arrStart = app.indexOf('const MYSTERIES = [');
const arrSrc = app.slice(arrStart + 'const MYSTERIES ='.length, app.indexOf('  ];', arrStart) + 3);
const MYSTERIES = new Function('return ' + arrSrc)();
if (MYSTERIES.length !== 10) throw new Error('expected 10 mysteries, got ' + MYSTERIES.length);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let deck = fs.readFileSync(DECK, 'utf8');

MYSTERIES.forEach((m, i) => {
  const id = 'p' + String(i + 1).padStart(2, '0');
  const start = deck.indexOf(`id="${id}"`);
  if (start < 0) throw new Error('missing section ' + id);
  const end = deck.indexOf('</section>', start);
  let sec = deck.slice(start, end);
  sec = sec.replace(/<h2 class="headline">[\s\S]*?<\/h2>/, `<h2 class="headline">${esc(m.name)}</h2>`);
  sec = sec.replace(/<p class="teaser">[\s\S]*?<\/p>/, `<p class="teaser">${esc(m.teaser)}</p>`);
  const fields = [m.riddle, m.stakes, m.caption];
  let fi = 0;
  sec = sec.replace(/(<h3 class="mono">[\s\S]*?<\/h3>\s*<p>)[\s\S]*?(<\/p>)/g,
    (match, a, b) => a + esc(fields[fi++]) + b);
  if (fi !== 3) throw new Error(`section ${id}: replaced ${fi} fields, expected 3`);
  deck = deck.slice(0, start) + sec + deck.slice(end);
});

// swap the inlined viz engine (first <script> block)
const viz = fs.readFileSync(ROOT + '/viz.js', 'utf8');
if (viz.includes('</script')) throw new Error('viz.js contains </script');
const a = deck.indexOf('<script>');
const b = deck.indexOf('</script>', a);
deck = deck.slice(0, a) + '<script>\n' + viz + '\n' + deck.slice(b);

fs.writeFileSync(DECK, deck);
console.log('deck synced:', deck.length, 'bytes');
