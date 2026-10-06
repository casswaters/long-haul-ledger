/**
 * Leadership desk helpers — public-channel roles for area desks.
 */

/** Resolve leadership key cascade: city → admin1 → country. */
export function leadershipKeys({ country, admin1, city } = {}) {
  const keys = [];
  if (city) keys.push(city);
  if (admin1) keys.push(admin1);
  if (country) keys.push(country);
  return keys;
}

/**
 * Pick the best matching leadership block for the current focus.
 * Prefer exact city, then admin1, then country.
 */
export function resolveLeadership(catalog, { country, admin1, city } = {}) {
  if (!catalog?.areas) return null;
  for (const key of leadershipKeys({ country, admin1, city })) {
    if (catalog.areas[key]) {
      return { key, ...catalog.areas[key] };
    }
  }
  return null;
}

/** Ancestors for nested “more levels” stack (country under state, etc.). */
export function leadershipStack(catalog, { country, admin1, city } = {}) {
  if (!catalog?.areas) return [];
  const stack = [];
  // Broad → narrow for display nesting
  if (country && catalog.areas[country]) {
    stack.push({ key: country, ...catalog.areas[country] });
  }
  if (admin1 && catalog.areas[admin1]) {
    stack.push({ key: admin1, ...catalog.areas[admin1] });
  }
  if (city && catalog.areas[city]) {
    stack.push({ key: city, ...catalog.areas[city] });
  }
  return stack;
}

export function roleBadge(role) {
  const badges = [];
  if (role?.responseTime?.badge) badges.push(role.responseTime.badge);
  if (role?.term?.badge) badges.push(role.term.badge);
  if (role?.badge) badges.push(role.badge);
  return [...new Set(badges)];
}

export function hasPublicContact(role) {
  const c = role?.contact || {};
  return !!(c.site || c.form || c.switchboard || c.email);
}
