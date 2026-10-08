/**
 * Map zoom / pan helpers (pure) — tested by ledger.test.js
 */

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 6;
export const ZOOM_STEP = 1.25;

export function clampZoom(z, min = ZOOM_MIN, max = ZOOM_MAX) {
  const n = Number(z);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function resetTransform() {
  return { scale: 1, tx: 0, ty: 0 };
}

/** Build CSS transform string for the map viewport. */
export function transformCss({ scale = 1, tx = 0, ty = 0 } = {}) {
  const s = clampZoom(scale);
  return `translate(${tx}px, ${ty}px) scale(${s})`;
}

/**
 * Zoom toward a point in the viewport (client coords relative to host).
 * Keeps the focal point under the cursor/pinch center.
 */
export function zoomAt(transform, nextScale, focalX, focalY, min = ZOOM_MIN, max = ZOOM_MAX) {
  const prev = clampZoom(transform.scale, min, max);
  const scale = clampZoom(nextScale, min, max);
  if (scale === prev) return { ...transform, scale };
  const ratio = scale / prev;
  const tx = focalX - (focalX - transform.tx) * ratio;
  const ty = focalY - (focalY - transform.ty) * ratio;
  return { scale, tx, ty };
}

export function panBy(transform, dx, dy, min = ZOOM_MIN, max = ZOOM_MAX) {
  return {
    scale: clampZoom(transform.scale, min, max),
    tx: transform.tx + dx,
    ty: transform.ty + dy,
  };
}

/** Wheel deltaY → multiplicative zoom factor (positive delta = zoom out). */
export function wheelToScale(currentScale, deltaY, sensitivity = 0.0015, min = ZOOM_MIN, max = ZOOM_MAX) {
  const factor = Math.exp(-deltaY * sensitivity);
  return clampZoom(currentScale * factor, min, max);
}

export function stepZoom(currentScale, direction, min = ZOOM_MIN, max = ZOOM_MAX) {
  const dir = direction >= 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
  return clampZoom(currentScale * dir, min, max);
}

/**
 * An SVG-space box (x, y, width, height) as a host-pixel rect at scale 1, under
 * preserveAspectRatio="xMidYMid meet" for the viewBox `vb` in a W x H host.
 */
export function svgBoxToHostRect(box, vb, W, H) {
  if (!box || !vb || !vb.width || !vb.height || !W || !H) return null;
  const k = Math.min(W / vb.width, H / vb.height);
  const ox = (W - vb.width * k) / 2;
  const oy = (H - vb.height * k) / 2;
  const x0 = ox + (box.x - vb.x) * k;
  const y0 = oy + (box.y - vb.y) * k;
  return { x0, y0, x1: x0 + box.width * k, y1: y0 + box.height * k };
}

/** Scale at which `rect` (host px at scale 1) fits the W x H host, leaving `padFrac` of room. */
export function fitScale(rect, W, H, padFrac = 0.06) {
  if (!rect) return 1;
  const w = Math.max(1e-6, rect.x1 - rect.x0), h = Math.max(1e-6, rect.y1 - rect.y0);
  return Math.min((W * (1 - 2 * padFrac)) / w, (H * (1 - 2 * padFrac)) / h);
}

/**
 * Keep a bounding rect (host px at scale 1; e.g. the selected country) in view.
 * When the scaled rect is larger than the host, its edges may not come further in
 * than `pad` px; when smaller, it may not leave the host by more than `pad` px.
 * Returns the clamped transform plus hitX / hitY (-1, 0, 1) when a bound stopped it.
 */
export function clampPan(transform, rect, W, H, pad = 0) {
  if (!rect) return { ...transform, hitX: 0, hitY: 0 };
  const s = transform.scale;
  const axis = (t, a0, a1, size) => {
    const p = -a0 * s, q = size - a1 * s;
    const lo = Math.min(p, q) - pad, hi = Math.max(p, q) + pad;
    if (t < lo) return [lo, -1];
    if (t > hi) return [hi, 1];
    return [t, 0];
  };
  const [tx, hitX] = axis(transform.tx, rect.x0, rect.x1, W);
  const [ty, hitY] = axis(transform.ty, rect.y0, rect.y1, H);
  return { scale: s, tx, ty, hitX, hitY };
}

/**
 * Edge-bump counter: `bump(now)` returns true when `count` bumps land within
 * `windowMs` (then resets, so the next signal needs a fresh set of bumps).
 */
export function edgeBumpCounter({ count = 3, windowMs = 6000 } = {}) {
  let hits = [];
  return {
    bump(now = Date.now()) {
      hits = hits.filter((t) => now - t <= windowMs);
      hits.push(now);
      if (hits.length >= count) { hits = []; return true; }
      return false;
    },
    reset() { hits = []; },
    get size() { return hits.length; },
  };
}

/** True when pointer travel exceeds click threshold (px). */
export function exceededDragThreshold(dx, dy, threshold = 6) {
  return Math.hypot(dx, dy) > threshold;
}

/** Pinch distance between two touch points. */
export function pinchDistance(t0, t1) {
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
}

export function pinchCenter(t0, t1, hostRect) {
  return {
    x: (t0.clientX + t1.clientX) / 2 - hostRect.left,
    y: (t0.clientY + t1.clientY) / 2 - hostRect.top,
  };
}
