/**
 * City label collision avoidance (pure; tested by ledger.test.js).
 *
 * Greedy priority placement in screen pixels:
 *  1. sort by priority (selected city first, then population, capitals boosted)
 *  2. try 8 compass slots hugging the dot, then 8 slots further out with a
 *     leader line back to the dot
 *  3. a label is placed only if its box clears every placed label and every
 *     city dot (dots are never hidden — only labels hide or shift)
 * Zooming in spreads dots apart in pixels, so lower-priority labels reveal
 * themselves naturally; zoomed out, only the biggest cities keep labels.
 */

/** Font size (px) for city labels at a given zoom — smaller when zoomed out. */
export function labelFontPx(zoom = 1) {
  const z = Math.max(1, Number(zoom) || 1);
  return Math.round(Math.min(12.5, 9.5 + (z - 1) * 0.9) * 10) / 10;
}

/** Dot radius (px) — near-constant on screen, slight growth when zoomed. */
export function dotRadiusPx(zoom = 1, capital = false) {
  const z = Math.max(1, Number(zoom) || 1);
  const base = capital ? 4.2 : 3.2;
  return Math.round(base * (1 + Math.min(0.5, (z - 1) * 0.1)) * 100) / 100;
}

/** Rough text width when canvas measurement is unavailable (IBM Plex Sans-ish). */
export function estimateTextWidth(text, fontPx) {
  return String(text || '').length * fontPx * 0.56;
}

export function labelPriority(props = {}, selectedId = null) {
  if (selectedId && props.id === selectedId) return Number.MAX_SAFE_INTEGER;
  const pop = Number(props.pop) || 0;
  return pop * (props.capital ? 1.6 : 1);
}

export function boxesOverlap(a, b, pad = 0) {
  return !(a.x1 + pad <= b.x0 || b.x1 + pad <= a.x0 || a.y1 + pad <= b.y0 || b.y1 + pad <= a.y0);
}

/** Slot directions (unit-ish vectors); order = preference. */
const DIRS = [
  ['E', 1, 0], ['W', -1, 0], ['NE', 0.75, -0.75], ['SE', 0.75, 0.75],
  ['NW', -0.75, -0.75], ['SW', -0.75, 0.75], ['N', 0, -1], ['S', 0, 1],
];

/** Label box for a slot. gap = distance from dot centre to nearest box edge. */
function slotBox(item, dir, gap, w, h) {
  const [, dx, dy] = dir;
  const ax = item.x + dx * gap;
  const ay = item.y + dy * gap;
  let x0;
  let anchor;
  if (dx > 0.01) { x0 = ax; anchor = 'start'; }
  else if (dx < -0.01) { x0 = ax - w; anchor = 'end'; }
  else { x0 = ax - w / 2; anchor = 'middle'; }
  let y0;
  if (dy > 0.01) y0 = ay;
  else if (dy < -0.01) y0 = ay - h;
  else y0 = ay - h / 2;
  return { x0, y0, x1: x0 + w, y1: y0 + h, anchor };
}

/**
 * items: [{ id, x, y, text, priority, r?, w? }] in screen px.
 * opts: { fontPx, pad, leaderGap, bounds:{x0,y0,x1,y1}?, measure?(text,fontPx) }
 * returns Map id → { visible, x, y, anchor, box, leader, slot }
 *   x/y = text anchor point (baseline-ish), relative to the same px space.
 */
export function layoutLabels(items, opts = {}) {
  const fontPx = opts.fontPx || 10;
  const pad = opts.pad ?? 2;
  const leaderGap = opts.leaderGap ?? Math.round(fontPx * 1.6);
  const measure = opts.measure || estimateTextWidth;
  const bounds = opts.bounds || null;
  const h = Math.ceil(fontPx * 1.15);

  const dots = items.map((it) => {
    const r = (it.r || 3) + 1;
    return { id: it.id, x0: it.x - r, y0: it.y - r, x1: it.x + r, y1: it.y + r };
  });
  const placed = [];
  const out = new Map();
  const order = [...items].sort((a, b) => (b.priority || 0) - (a.priority || 0) || String(a.id).localeCompare(String(b.id)));

  for (const it of order) {
    const w = it.w ?? measure(it.text, fontPx);
    const r = it.r || 3;
    const near = r + 2.5;
    const far = r + leaderGap;
    let chosen = null;
    for (const [gap, leader] of [[near, false], [far, true]]) {
      for (const dir of DIRS) {
        const b = slotBox(it, dir, gap, w, h);
        if (bounds && (b.x0 < bounds.x0 || b.y0 < bounds.y0 || b.x1 > bounds.x1 || b.y1 > bounds.y1)) continue;
        if (placed.some((p) => boxesOverlap(b, p, pad))) continue;
        if (dots.some((d) => d.id !== it.id && boxesOverlap(b, d, 0.5))) continue;
        chosen = { box: b, leader, slot: dir[0] };
        break;
      }
      if (chosen) break;
    }
    if (!chosen) {
      out.set(it.id, { visible: false });
      continue;
    }
    placed.push(chosen.box);
    const b = chosen.box;
    const tx = chosen.box.anchor === 'start' ? b.x0 : chosen.box.anchor === 'end' ? b.x1 : (b.x0 + b.x1) / 2;
    const ty = b.y0 + h * 0.78; // baseline
    out.set(it.id, {
      visible: true,
      x: tx,
      y: ty,
      anchor: chosen.box.anchor,
      box: b,
      leader: chosen.leader,
      slot: chosen.slot,
    });
  }
  return out;
}

/** Count of label overlaps in a layout (0 = no stacking). For tests / QA. */
export function countOverlaps(layout) {
  const boxes = [...layout.values()].filter((l) => l.visible).map((l) => l.box);
  let n = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) if (boxesOverlap(boxes[i], boxes[j])) n++;
  }
  return n;
}
