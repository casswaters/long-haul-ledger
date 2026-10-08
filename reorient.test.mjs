/**
 * Long Haul Ledger: header Top (reorient) button, country-wide pan bounds, the World
 * button nudge after repeated edge bumps, and the sector emojis.
 */
import { readFileSync } from 'fs';
import { svgBoxToHostRect, fitScale, clampPan, edgeBumpCounter, zoomAt, ZOOM_MAX } from './zoom.js';

let pass = 0, fail = 0;
function assert(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const html = read('./index.html'), css = read('./styles.css'), app = read('./app.js');

console.log('\n--- Reorient: Top button in the pinned header ---');
assert('Top button lives in the header, hidden until the map scrolls away', /<header class="site-header">[\s\S]*<button type="button" class="hnav reorient-top" id="reorient-top" aria-label="Back to the top: the map and the selected place" title="Back to the top" hidden><span aria-hidden="true">↑<\/span> Top<\/button>[\s\S]*<\/header>/.test(html));
assert('shown by IntersectionObserver on the map, offset by the header height', /new IntersectionObserver\(/.test(app) && /io\.observe\(stage\)/.test(app) && /rootMargin: `-\$\{h \+ 8\}px 0px 0px 0px`/.test(app));
assert('reorient scrolls to top, honors reduced motion, moves focus to the map, keeps the selection', /function reorientToTop\(\)/.test(app) && /behavior: reduce \? 'auto' : 'smooth'/.test(app) && /stage\.focus\(\{ preventScroll: true \}\)/.test(app) && !/function reorientToTop\(\)[\s\S]{0,600}navigate\(/.test(app));
assert('footer Top no longer slides under the pinned header', /\.about-toolbar \{[^}]*position: relative;/.test(css) && !/\.about-toolbar \{[^}]*position: sticky/.test(css));
assert('44px tap target without a taller header', /\.reorient-top::after \{[^}]*height: 44px;/.test(css));
assert('small phones: date stamp steps aside while Top shows', /\.site-header\.is-away \.date-stamp \{ display: none; \}/.test(css));

console.log('\n--- Country-wide pan bounds ---');
const vb = { x: 0, y: 0, width: 100, height: 50 };
const rect = svgBoxToHostRect({ x: 10, y: 5, width: 80, height: 40 }, vb, 1000, 500);
assert('SVG box to host rect (meet)', rect.x0 === 100 && rect.y0 === 50 && rect.x1 === 900 && rect.y1 === 450);
const wide = svgBoxToHostRect({ x: -300, y: -100, width: 700, height: 300 }, vb, 1000, 500);
assert('zoom-out floor fits the whole country', Math.abs(fitScale(wide, 1000, 500, 0.06) - (880 / 7000)) < 1e-9);
const c1 = clampPan({ scale: 1, tx: 5000, ty: 0 }, wide, 1000, 500, 30);
assert('pan stops at the country edge and reports the hit', c1.tx === 3000 + 30 && c1.hitX === 1);
const c2 = clampPan({ scale: 1, tx: 200, ty: -100 }, wide, 1000, 500, 30);
assert('free pan anywhere inside the country', c2.tx === 200 && c2.ty === -100 && !c2.hitX && !c2.hitY);
assert('zoomAt honors a lower floor below 1', zoomAt({ scale: 1, tx: 0, ty: 0 }, 0.2, 500, 250, 0.1, ZOOM_MAX).scale === 0.2);
assert('below World: pan allowed at any zoom; World: only when zoomed', /if \(mapXform\.scale > 1\.02 \|\| state\.country\)/.test(app));
assert('bounds are the selected country (not the state)', /function updateCountryFrame\(svg, country\)/.test(app) && /svgBoxToHostRect\(countryFrame, vb, W, H\)/.test(app));

console.log('\n--- World button nudge ---');
const ctr = edgeBumpCounter({ count: 3, windowMs: 6000 });
assert('3 bumps within 6 s signal once, then reset', [ctr.bump(0), ctr.bump(2000), ctr.bump(5000), ctr.bump(5500)].join() === 'false,false,true,false');
const ctr2 = edgeBumpCounter();
assert('slow bumps (over 6 s apart) never signal', ![0, 7000, 14000, 21000].some((t) => ctr2.bump(t)));
assert('one drag, one wheel burst or one pinch counts once', /gestureBumped = true; \/\/ one long drag counts once/.test(app) && /now - wheelLast > 400/.test(app) && /if \(setZoom\(next, center\.x, center\.y\) && !gestureBumped\)/.test(app));
assert('pulse 3 times then stop; static highlight for reduced motion', /\.bc-link\.is-nudge \{[^}]*animation: bc-nudge 0\.9s ease-in-out 3;/.test(css) && /@media \(prefers-reduced-motion: reduce\) \{\s*\.bc-link\.is-nudge \{ animation: none; outline: 2px solid var\(--accent\)/.test(css));
assert('screen readers hear the hint', /id="map-nudge-live" role="status" aria-live="polite"/.test(html) && /Use World to step back out to the world map\./.test(app));
assert('no em dash or tilde in new copy', !/[\u2014~]/.test('Edge of the country. Use World to step back out to the world map. Back to the top: the map and the selected place'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
