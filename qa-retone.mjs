/**
 * Retone QA: screenshots → /workspace/qa/long-haul-ledger/retone-*.png
 * BASE=<url> node qa-retone.mjs   (defaults to a throwaway in-process static server)
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = '/workspace/qa/long-haul-ledger';
mkdirSync(outDir, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.geojson': 'application/json', '.webmanifest': 'application/manifest+json' };
let server = null;
let base = process.env.BASE;
if (!base) {
  server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(__dir, p);
    if (!f.startsWith(__dir) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
}
const tag = process.env.TAG || 'retone';
const browser = await chromium.launch();
const errors = [];
const watch = (page) => { page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); };
const ready = async (page) => {
  await page.waitForSelector('#world-map-host svg path', { timeout: 20000 });
  await page.waitForSelector('.desk-tile, .country-head', { timeout: 20000 });
  await page.waitForTimeout(900);
};
try {
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    watch(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    await ready(page);
    await page.screenshot({ path: join(outDir, `${tag}-desktop.png`) });
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    watch(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    await ready(page);
    await page.screenshot({ path: join(outDir, `${tag}-mobile.png`) });
    await page.screenshot({ path: join(outDir, `${tag}-mobile-full.png`), fullPage: true });
    await page.goto(base + '#d=prices', { waitUntil: 'networkidle' });
    await page.waitForSelector('.desks-panel', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, `${tag}-us-desks-mobile.png`) });
    await page.goto(base + '#c=in&t=openings', { waitUntil: 'networkidle' });
    await page.waitForSelector('.country-head', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, `${tag}-mobile-country.png`), fullPage: true });
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    watch(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    await ready(page);
    await page.click('#nav-desks');
    await page.waitForSelector('.desks-panel .ledger-table', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, `${tag}-us-desks.png`) });
    await page.click('[data-desk-tab="people"]');
    await page.waitForSelector('[data-desk-empty="people"]');
    await page.screenshot({ path: join(outDir, `${tag}-us-desks-empty.png`) });
    // country desk + overlays still work
    await page.keyboard.press('Escape');
    await page.goto(base + '#c=us', { waitUntil: 'networkidle' });
    await page.waitForSelector('.country-head .proto-badge');
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(outDir, `${tag}-country-us.png`) });
    await page.goto(base + '#c=us&v=company&s=energy&co=us-gridforge', { waitUntil: 'networkidle' });
    await page.waitForSelector('.company-panel .proto-badge');
    await page.screenshot({ path: join(outDir, `${tag}-company.png`) });
    // double-click on a country opens the mind map
    await page.goto(base + '#', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const box = await page.locator('#world-map-host svg path#br').boundingBox();
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 3);
    await page.waitForSelector('.mindmap-panel .proto-badge', { timeout: 5000 });
    await page.screenshot({ path: join(outDir, `${tag}-mindmap.png`) });
    console.log('dblclick → mind map OK', await page.evaluate(() => location.hash));
    await page.close();
  }
} finally {
  await browser.close();
  server?.close();
}
console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors');
