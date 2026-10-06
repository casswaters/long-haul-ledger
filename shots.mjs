/**
 * Playwright screenshots → /workspace/qa/longview-ledger/
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = '/workspace/qa/longview-ledger';
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
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, '01-desktop-hub.png'), fullPage: true });
    await page.close();
    console.log('01 ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/#c=in&t=industries&s=energy', { waitUntil: 'networkidle' });
    await page.waitForSelector('.country-head h2', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, '02-desktop-country-drill.png'), fullPage: true });
    await page.close();
    console.log('02 ok');
  }
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page.goto(base + '/#c=us&t=openings', { waitUntil: 'networkidle' });
    await page.waitForSelector('.opening-card', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, '03-mobile-panel.png'), fullPage: true });
    await page.close();
    console.log('03 ok');
  }
  console.log('shots written to', outDir);
} finally {
  await browser.close();
  server.close();
}
