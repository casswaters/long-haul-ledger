/**
 * Map drill-down helpers — projection calibrated to world.svg
 * (viewBox 0 0 2000 1001, Natural Earth / VectorAtlas atlas).
 *
 * world.svg is plate carrée in x (lon −180..180 → 0..2000) and linear in y at
 * the same 1001/180 px/deg, BUT its equator sits at y≈578.5, not 500.5: the
 * atlas was cropped (Antarctica trimmed) without re-centering, so every
 * parallel is pushed down by ~78 units (~14°). The admin-1 / city layers used
 * to assume a centred equirectangular (y = (90−lat)/180·1001), which drew the
 * states ~78 units *north* of the world country fill — the "gold US offset"
 * bug. Calibrated by least-squares fit of US/IN admin-1 rings against
 * world.svg country paths (mean residual ≈0.2 units for the US).
 */

export const SVG_W = 2000;
export const SVG_H = 1001;
/** Units per degree latitude in world.svg. */
export const SVG_Y_SCALE = SVG_H / 180;
/** world.svg y of the equator (lat 0). */
export const SVG_EQUATOR_Y = 578.5;

/** Lon/lat → SVG coords used by world.svg */
export function project(lon, lat) {
  const x = ((Number(lon) + 180) / 360) * SVG_W;
  const y = SVG_EQUATOR_Y - Number(lat) * SVG_Y_SCALE;
  return [x, y];
}

/** Inverse of project (SVG → lon/lat). */
export function unproject(x, y) {
  return [(Number(x) / SVG_W) * 360 - 180, (SVG_EQUATOR_Y - Number(y)) / SVG_Y_SCALE];
}

/**
 * Inset layouts for drill views: non-contiguous admin-1 areas drawn into a
 * framed box (like a printed atlas) instead of at their true, far-off position.
 * frame = SVG-unit box (in world.svg space) the inset is fitted into.
 */
export const DRILL_INSETS = {
  us: [
    { admin1: 'us-ak', label: 'Alaska', geoBbox: [-171.9, 51.2, -129.9, 71.5], frame: { x: 309, y: 448, w: 96, h: 44 } },
    { admin1: 'us-hi', label: 'Hawaii', geoBbox: [-160.4, 18.8, -154.7, 22.4], frame: { x: 410, y: 456, w: 34, h: 24 } },
  ],
};

/**
 * Countries whose state-equivalent layer is a coarse open approximation
 * (boxy emirate / region polygons). Their drill layer is clipped to the
 * world.svg coastline so the approximation never spills into the sea.
 */
export const APPROX_ADMIN1 = new Set([]); // real NE admin-1 now; was ae/jp boxy approximations

export function clipAdminToWorld(countryId) {
  return APPROX_ADMIN1.has(String(countryId || '').toLowerCase());
}

export function insetsForCountry(countryId) {
  return DRILL_INSETS[String(countryId || '').toLowerCase()] || [];
}

/**
 * Build a point transform (projected SVG → inset SVG) that fits geoBbox into
 * frame (uniform scale, centred, 3-unit margin).
 */
export function insetTransform(inset) {
  const [x0, y0] = project(inset.geoBbox[0], inset.geoBbox[3]);
  const [x1, y1] = project(inset.geoBbox[2], inset.geoBbox[1]);
  const margin = 3;
  const fw = inset.frame.w - margin * 2;
  const fh = inset.frame.h - margin * 2;
  const s = Math.min(fw / (x1 - x0), fh / (y1 - y0));
  const ox = inset.frame.x + margin + (fw - (x1 - x0) * s) / 2;
  const oy = inset.frame.y + margin + (fh - (y1 - y0) * s) / 2;
  const fn = (x, y) => [ox + (x - x0) * s, oy + (y - y0) * s];
  fn.scale = s;
  return fn;
}

/** Projection for one admin-1 area in a country drill (inset-aware). */
export function projectorFor(countryId, admin1Id) {
  const inset = insetsForCountry(countryId).find((i) => i.admin1 === admin1Id);
  if (!inset) return project;
  const xf = insetTransform(inset);
  return (lon, lat) => {
    const [x, y] = project(lon, lat);
    return xf(x, y);
  };
}

/** SVG-space bbox {x, y, width, height} of a geometry under a projector. */
export function geometrySvgBox(geometry, proj = project) {
  if (!geometry) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (coords) => {
    if (typeof coords[0] === 'number') {
      const [x, y] = proj(coords[0], coords[1]);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      return;
    }
    for (const c of coords) walk(c);
  };
  walk(geometry.coordinates);
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function unionSvgBoxes(boxes) {
  const list = (boxes || []).filter(Boolean);
  if (!list.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of list) {
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** Padded SVG box → viewBox string. */
export function svgBoxToViewBox(box, padRatio = 0.06) {
  if (!box) return `0 0 ${SVG_W} ${SVG_H}`;
  const w = Math.max(8, box.width);
  const h = Math.max(8, box.height);
  const px = w * padRatio;
  const py = h * padRatio;
  return `${(box.x - px).toFixed(2)} ${(box.y - py).toFixed(2)} ${(w + px * 2).toFixed(2)} ${(h + py * 2).toFixed(2)}`;
}

/**
 * SVG box for the whole-country drill fit: every admin-1 area as drawn
 * (insets in their frames) plus the inset frames themselves.
 */
export function countryDrillSvgBox(adminFc, countryId) {
  const boxes = adminFeaturesForCountry(adminFc, countryId)
    .map((f) => geometrySvgBox(f.geometry, projectorFor(countryId, f.properties?.id)));
  for (const inset of insetsForCountry(countryId)) {
    boxes.push({ x: inset.frame.x, y: inset.frame.y, width: inset.frame.w, height: inset.frame.h });
  }
  return unionSvgBoxes(boxes);
}

/** User-facing names for drill levels (internal ids stay admin1). */
export const LEVEL_LABELS = {
  world: 'World',
  country: 'Country',
  admin1: 'State equivalent',
  city: 'City',
};

export function levelLabel(level) {
  return LEVEL_LABELS[level] || String(level || '');
}

export function ringToPath(ring, proj = project) {
  if (!ring || !ring.length) return '';
  let d = '';
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = proj(ring[i][0], ring[i][1]);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
  }
  return d + 'Z';
}

export function geometryToPath(geometry, proj = project) {
  if (!geometry) return '';
  const polys =
    geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates
    : [];
  return polys.map((poly) => ringToPath(poly[0], proj)).filter(Boolean).join('');
}

/** Geographic bbox [minLon, minLat, maxLon, maxLat] */
export function featureBbox(feature) {
  const g = feature?.geometry;
  if (!g) return null;
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  const walk = (coords) => {
    if (typeof coords[0] === 'number') {
      const [lon, lat] = coords;
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
      return;
    }
    for (const c of coords) walk(c);
  };
  walk(g.coordinates);
  if (!Number.isFinite(minLon)) return null;
  return [minLon, minLat, maxLon, maxLat];
}

export function unionBboxes(bboxes) {
  const list = (bboxes || []).filter(Boolean);
  if (!list.length) return null;
  return list.reduce(
    (a, b) => [
      Math.min(a[0], b[0]),
      Math.min(a[1], b[1]),
      Math.max(a[2], b[2]),
      Math.max(a[3], b[3]),
    ],
    list[0]
  );
}

/** Expand geo bbox slightly (degrees). */
export function padBbox(b, pad = 0.5) {
  if (!b) return null;
  return [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad];
}

/**
 * Convert lon/lat bbox to SVG viewBox string, optionally padded in SVG units.
 */
export function bboxToViewBox(bbox, padRatio = 0.08) {
  if (!bbox) return `0 0 ${SVG_W} ${SVG_H}`;
  const [x0, y0] = project(bbox[0], bbox[3]); // NW
  const [x1, y1] = project(bbox[2], bbox[1]); // SE
  let minX = Math.min(x0, x1);
  let maxX = Math.max(x0, x1);
  let minY = Math.min(y0, y1);
  let maxY = Math.max(y0, y1);
  const w = Math.max(8, maxX - minX);
  const h = Math.max(8, maxY - minY);
  const padX = w * padRatio;
  const padY = h * padRatio;
  return `${(minX - padX).toFixed(2)} ${(minY - padY).toFixed(2)} ${(w + padX * 2).toFixed(2)} ${(h + padY * 2).toFixed(2)}`;
}

export function countriesWithAdmin1(adminFc) {
  const set = new Set();
  for (const f of adminFc?.features || []) {
    if (f.properties?.country) set.add(f.properties.country);
  }
  return set;
}

export function adminFeaturesForCountry(adminFc, countryId) {
  const id = String(countryId || '').toLowerCase();
  return (adminFc?.features || []).filter((f) => f.properties?.country === id);
}

export function findAdminFeature(adminFc, adminId) {
  if (!adminId) return null;
  return (adminFc?.features || []).find((f) => f.properties?.id === adminId) || null;
}

export function citiesForAdmin(citiesFc, { country, admin1 } = {}) {
  return (citiesFc?.features || []).filter((f) => {
    const p = f.properties || {};
    if (country && p.country !== country) return false;
    if (admin1 && p.admin1 !== admin1) return false;
    return true;
  });
}

export function findCityFeature(citiesFc, cityId) {
  if (!cityId) return null;
  return (citiesFc?.features || []).find((f) => f.properties?.id === cityId) || null;
}

export function countryBboxFromAdmin(adminFc, countryId) {
  const feats = adminFeaturesForCountry(adminFc, countryId);
  return unionBboxes(feats.map(featureBbox));
}

/** Breadcrumb segments for drill state. */
export function drillBreadcrumb({ country, countryName, admin1, admin1Name, city, cityName }) {
  const bits = [{ level: 'world', id: null, label: 'World', levelLabel: levelLabel('world') }];
  if (country) bits.push({ level: 'country', id: country, label: countryName || country.toUpperCase(), levelLabel: levelLabel('country') });
  if (admin1) bits.push({ level: 'admin1', id: admin1, label: admin1Name || admin1, levelLabel: levelLabel('admin1') });
  if (city) bits.push({ level: 'city', id: city, label: cityName || city, levelLabel: levelLabel('city') });
  return bits;
}

/** Mind map is country-level only. */
export function mindMapAllowed(admin1, city) {
  return !admin1 && !city;
}
