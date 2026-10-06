/**
 * Map drill-down helpers — equirectangular projection matching world.svg
 * viewBox 0 0 2000 1001 (Natural Earth / VectorAtlas atlas).
 */

export const SVG_W = 2000;
export const SVG_H = 1001;

/** Lon/lat → SVG coords used by world.svg */
export function project(lon, lat) {
  const x = ((Number(lon) + 180) / 360) * SVG_W;
  const y = ((90 - Number(lat)) / 180) * SVG_H;
  return [x, y];
}

export function ringToPath(ring) {
  if (!ring || !ring.length) return '';
  let d = '';
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i][0], ring[i][1]);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
  }
  return d + 'Z';
}

export function geometryToPath(geometry) {
  if (!geometry) return '';
  const polys =
    geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates
    : [];
  return polys.map((poly) => ringToPath(poly[0])).filter(Boolean).join('');
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
  const bits = [{ level: 'world', id: null, label: 'World' }];
  if (country) bits.push({ level: 'country', id: country, label: countryName || country.toUpperCase() });
  if (admin1) bits.push({ level: 'admin1', id: admin1, label: admin1Name || admin1 });
  if (city) bits.push({ level: 'city', id: city, label: cityName || city });
  return bits;
}

/** Mind map is country-level only. */
export function mindMapAllowed(admin1, city) {
  return !admin1 && !city;
}
