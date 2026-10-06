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
export function zoomAt(transform, nextScale, focalX, focalY) {
  const prev = clampZoom(transform.scale);
  const scale = clampZoom(nextScale);
  if (scale === prev) return { ...transform, scale };
  const ratio = scale / prev;
  const tx = focalX - (focalX - transform.tx) * ratio;
  const ty = focalY - (focalY - transform.ty) * ratio;
  return { scale, tx, ty };
}

export function panBy(transform, dx, dy) {
  return {
    scale: clampZoom(transform.scale),
    tx: transform.tx + dx,
    ty: transform.ty + dy,
  };
}

/** Wheel deltaY → multiplicative zoom factor (positive delta = zoom out). */
export function wheelToScale(currentScale, deltaY, sensitivity = 0.0015) {
  const factor = Math.exp(-deltaY * sensitivity);
  return clampZoom(currentScale * factor);
}

export function stepZoom(currentScale, direction) {
  const dir = direction >= 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
  return clampZoom(currentScale * dir);
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
