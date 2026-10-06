/**
 * Long Haul Ledger Playwright screenshots → /workspace/qa/long-haul-ledger/
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = '/workspace/qa/long-haul-ledger';
mkdirSync(outDir, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
};

const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  if (path === '/') path = '/index.html';
  const file = join(__dir, path);
  if (!file.startsWith(__dir) || !existsSync(file)) {
    res.writeHead(404); res.end('missing'); return;
  }
  res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
console.log('serving on', base);

const browser = await chromium.launch();
try {
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#world-map-host svg path', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, '01-desktop-hub.png'), fullPage: true });
    await page.close();
    console.log('01 ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=in&t=industries&s=energy', { waitUntil: 'networkidle' });
    await page.waitForSelector('.country-head h2', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, '02-desktop-country-drill.png'), fullPage: true });
    await page.close();
    console.log('02 ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page.goto(base + '/#c=us&t=openings', { waitUntil: 'networkidle' });
    await page.waitForSelector('.opening-card', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, '03-mobile-panel.png'), fullPage: true });
    await page.close();
    console.log('03 ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#zoom-in', { timeout: 15000 });
    await page.click('#zoom-in');
    await page.click('#zoom-in');
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(outDir, '04-zoom.png'), fullPage: false });
    await page.close();
    console.log('04 zoom ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#world-map-host svg path', { timeout: 15000 });
    // Max zoom via controls, then nudge toward Europe/ME for coastline detail
    for (let i = 0; i < 10; i++) await page.click('#zoom-in');
    await page.waitForTimeout(200);
    const level = await page.textContent('#zoom-level');
    console.log('08 zoom level', level);
    await page.screenshot({ path: join(outDir, '08-zoom-sharp.png'), fullPage: false });
    await page.close();
    console.log('08 zoom-sharp ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=us&v=mindmap', { waitUntil: 'networkidle' });
    await page.waitForSelector('.mindmap-svg', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, '05-mindmap.png'), fullPage: false });
    await page.close();
    console.log('05 mindmap ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=us&v=chain&s=energy', { waitUntil: 'networkidle' });
    await page.waitForSelector('.chain-grid', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, '06-chain.png'), fullPage: false });
    await page.close();
    console.log('06 chain ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=us&v=company&s=energy&co=us-gridforge', { waitUntil: 'networkidle' });
    await page.waitForSelector('.company-panel', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, '07-company.png'), fullPage: false });
    await page.close();
    console.log('07 company ok');
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.feed-item.is-live, .feed-item', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, 'us-progress-desktop.png'), fullPage: true });
    // Crop-ish: rail focus by clipping via element
    const rail = await page.$('.rail');
    if (rail) await rail.screenshot({ path: join(outDir, 'us-progress-rail.png') });
    const zoom = await page.$('.zoom-controls');
    if (zoom) await zoom.screenshot({ path: join(outDir, 'us-progress-zoom-vertical.png') });
    const legend = await page.$('.map-label');
    if (legend) await legend.screenshot({ path: join(outDir, 'us-progress-legend-vertical.png') });
    await page.close();
    console.log('us-progress desktop ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=us', { waitUntil: 'networkidle' });
    await page.waitForSelector('.country-head h2', { timeout: 15000 });
    await page.waitForSelector('.feed-item', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, 'us-progress-us-desk.png'), fullPage: true });
    await page.close();
    console.log('us-progress us-desk ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.feed-item', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, 'us-progress-mobile.png'), fullPage: true });
    await page.close();
    console.log('us-progress mobile ok');
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=us', { waitUntil: 'networkidle' });
    await page.waitForSelector('.leadership-acc', { timeout: 15000 });
    await page.click('.leadership-acc > summary');
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(outDir, 'leadership-accordion.png'), fullPage: false });
    const panel = await page.$('#country-panel');
    if (panel) await panel.screenshot({ path: join(outDir, 'leadership-accordion-panel.png') });
    await page.close();
    console.log('leadership accordion ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=us', { waitUntil: 'networkidle' });
    await page.waitForSelector('#drill-layer .admin1-path', { timeout: 20000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, 'drill-us-states.png'), fullPage: false });
    await page.close();
    console.log('drill us states ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=us&a=us-ca', { waitUntil: 'networkidle' });
    await page.waitForSelector('#drill-layer .city-marker', { timeout: 20000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, 'drill-state-cities.png'), fullPage: false });
    await page.close();
    console.log('drill state→city ok');
  }

  console.log('shots written to', outDir);
} finally {
  await browser.close();
  server.close();
}
