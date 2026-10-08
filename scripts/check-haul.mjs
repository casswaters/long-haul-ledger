#!/usr/bin/env node
/**
 * Monday Haul draft checker and HTML renderer (free format; see RESEARCH-RUNS.md "Monday Haul").
 *
 *   node scripts/check-haul.mjs hauls/2026-10-12.md            validate the draft
 *   node scripts/check-haul.mjs hauls/2026-10-12.md --links    also require HTTP 200 on every source link
 *   node scripts/check-haul.mjs hauls/2026-10-12.md --html     also write hauls/2026-10-12.html
 *
 * This script never sends email and never calls Buttondown.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const MONTHS = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const DATE_RE = new RegExp(`\\((?:${MONTHS}) \\d{1,2}(?:, \\d{4})?\\)`);
const LINK_RE = /\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;

/** Validate a Haul markdown draft. Returns { errors, warnings, items, links }. */
export function validateHaul(md) {
  const errors = [], warnings = [];
  const lines = md.replace(/\r/g, '').split('\n');
  if (!/^# The Monday Haul\s*$/.test(lines[0] || '')) errors.push('first line must be "# The Monday Haul"');
  if (!/week of (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/.test(md)) errors.push('missing "week of <Month D, YYYY>" line');
  if (/[\u2014~]/.test(md)) errors.push('em dash or tilde found');
  if (/\[(?:HEADLINE|SOURCE|VALUE|DATE|YYYY|TODO|TK)[^\]]*\]/i.test(md) || /\bTK\b/.test(md)) errors.push('unfilled placeholder found');
  const footerAt = lines.indexOf('---');
  if (footerAt < 0) errors.push('missing footer separator "---"');
  const bodyLines = footerAt < 0 ? lines : lines.slice(0, footerAt);
  const body = bodyLines.join('\n');
  // Rule 5 still applies above the footer: no promotional or pricing copy in the items.
  if (/sign ?up|subscribe|paywall|pricing|premium|\$\d+ ?\/ ?(?:mo|month|year)|share this|forward this/i.test(body)) errors.push('promotional, sign-up or pricing copy above the footer');
  let section = null;
  const items = [];
  for (let i = 0; i < bodyLines.length; i++) {
    const l = bodyLines[i];
    if (/^## Energy\s*$/.test(l)) { section = 'energy'; continue; }
    if (/^## Across the economy\s*$/.test(l)) { section = 'sector'; continue; }
    const m = l.match(/^\*\*(\d+)\. (.+)\*\*\s*$/);
    if (!m) continue;
    const it = { n: Number(m[1]), title: m[2], section, text: '', sources: null };
    for (let j = i + 1; j < bodyLines.length && !/^\*\*\d+\. /.test(bodyLines[j]) && !/^## /.test(bodyLines[j]); j++) {
      if (/^Sources?: /.test(bodyLines[j])) it.sources = bodyLines[j]; else if (bodyLines[j].trim()) it.text += bodyLines[j] + ' ';
    }
    items.push(it);
  }
  if (items.length < 6 || items.length > 8) errors.push(`need 6 to 8 items, found ${items.length}`);
  items.forEach((it, k) => { if (it.n !== k + 1) errors.push(`item ${it.n} is out of order (expected ${k + 1})`); });
  const energy = items.filter((i) => i.section === 'energy').length, sector = items.filter((i) => i.section === 'sector').length;
  if (!energy) errors.push('no items under "## Energy"');
  if (!sector) errors.push('no items under "## Across the economy"');
  if (items.some((i) => !i.section)) errors.push('item before any section heading');
  if (energy && sector && (energy < 4 || energy > 6 || sector < 2 || sector > 4)) warnings.push(`aim for about 5 energy and 3 sector items (found ${energy} and ${sector})`);
  const links = [];
  for (const it of items) {
    if (!it.text.trim()) errors.push(`item ${it.n} has no text`);
    if (it.text.length > 600) warnings.push(`item ${it.n} is long (${it.text.length} chars); keep it short`);
    if (!it.sources) { errors.push(`item ${it.n} has no "Source:" line`); continue; }
    const found = [...it.sources.matchAll(LINK_RE)];
    if (!found.length) errors.push(`item ${it.n}: source line has no https link`);
    // Every link must be followed by its date, e.g. "[EIA](https://...) (Oct 6)".
    for (const f of found) {
      const after = it.sources.slice(f.index + f[0].length, f.index + f[0].length + 16).trimStart();
      if (!DATE_RE.test(after.slice(0, 14)) || after[0] !== '(') errors.push(`item ${it.n}: "${f[1]}" needs a date like (Oct 6) right after the link`);
      links.push(f[2]);
    }
  }
  return { errors, warnings, items, links: [...new Set(links)] };
}

/** Plain, inline-styled HTML for pasting into Buttondown (or importing). */
export function haulHtml(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#9a5b13;">$1</a>');
  const out = [];
  for (const line of md.replace(/\r/g, '').trim().split('\n')) {
    if (!line.trim()) continue;
    if (line.startsWith('# ')) out.push(`<h1 style="font-size:24px;margin:0 0 4px;">${inline(line.slice(2))}</h1>`);
    else if (line.startsWith('## ')) out.push(`<h2 style="font-size:17px;margin:28px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;">${inline(line.slice(3))}</h2>`);
    else if (line === '---') out.push('<hr style="border:0;border-top:1px solid #ddd;margin:28px 0 12px;">');
    else if (/^Sources?: /.test(line)) out.push(`<p style="margin:0 0 18px;font-size:13px;color:#666;">${inline(line)}</p>`);
    else if (/^\*\*\d+\. /.test(line)) out.push(`<p style="margin:16px 0 4px;font-size:16px;">${inline(line)}</p>`);
    else out.push(`<p style="margin:0 0 6px;">${inline(line)}</p>`);
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The Monday Haul</title></head>
<body style="margin:0;background:#f6f5f2;">
<div style="max-width:600px;margin:0 auto;padding:24px 20px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1d1d1d;">
${out.join('\n')}
</div>
</body></html>
`;
}

async function checkLinks(urls) {
  const bad = [];
  for (const u of urls) {
    let status = 0;
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' }, signal: AbortSignal.timeout(25000) });
      status = r.status;
    } catch { status = 0; }
    console.log(`  ${status || 'ERR'}  ${u}`);
    if (status !== 200) bad.push(`${status || 'no response'}: ${u}`);
  }
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!file) { console.error('usage: node scripts/check-haul.mjs hauls/YYYY-MM-DD.md [--links] [--html]'); process.exit(2); }
  const md = readFileSync(file, 'utf8');
  const v = validateHaul(md);
  v.warnings.forEach((w) => console.log(`warning: ${w}`));
  if (process.argv.includes('--links')) {
    console.log(`checking ${v.links.length} source links:`);
    (await checkLinks(v.links)).forEach((b) => v.errors.push(`link not HTTP 200 (${b}); open it by hand, and if it really fails, replace or cut the item`));
  }
  v.errors.forEach((e) => console.error(`error: ${e}`));
  console.log(`${file}: ${v.items.length} item(s), ${v.links.length} link(s), ${v.errors.length} error(s), ${v.warnings.length} warning(s)`);
  if (!v.errors.length && process.argv.includes('--html')) {
    const out = file.replace(/\.md$/, '.html');
    writeFileSync(out, haulHtml(md));
    console.log(`wrote ${out}`);
  }
  process.exit(v.errors.length ? 1 : 0);
}
