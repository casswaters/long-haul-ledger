/**
 * Leadership desk helpers — public-channel roles for area desks.
 *
 * Country-level rosters stay on the country key. When the user drills to a
 * state equivalent or city, the accordion shows that level (and city if any);
 * federal / national leadership is not repeated under state focus.
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

/**
 * Stack for the leadership accordion.
 * - Country focus: country block only.
 * - State focus: that state's block (real roles or honest empty scaffold).
 * - City focus: city block (or empty) then parent state if present.
 * Country-level US / national leadership stays at country — not stacked under state.
 */
export function leadershipStack(catalog, { country, admin1, city, admin1Name, cityName } = {}) {
  if (!catalog?.areas) return [];
  const stack = [];

  const pushArea = (key, level, fallbackLabel) => {
    if (!key) return;
    const block = catalog.areas[key];
    if (block) {
      stack.push({ key, ...block });
      return;
    }
    // Honest empty when focus is set but no roster seeded yet
    stack.push({
      key,
      level,
      label: fallbackLabel || key,
      roles: [],
      emptyNote: level === 'city'
        ? 'No sourced city leadership yet. Public municipal directories welcome in a later pass.'
        : 'No sourced statewide roster yet. Public official directories welcome in a later pass.',
    });
  };

  if (city || admin1) {
    if (city) pushArea(city, 'city', cityName);
    if (admin1) pushArea(admin1, 'admin1', admin1Name);
    return stack;
  }

  if (country) pushArea(country, 'country', country);
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

/** True when a stack block has no roles to show. */
export function isEmptyLeadership(block) {
  return !block?.roles?.length;
}
