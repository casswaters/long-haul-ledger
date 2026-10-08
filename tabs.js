/**
 * Long Haul Ledger: every sector tab, in header order.
 * Energy is the featured tab; the five economic types follow, Primary to Quinary.
 */
import { ENERGY } from './energy.js';
import { ECONOMY_TABS } from './economy.js';

export const SECTOR_TABS = [ENERGY, ...ECONOMY_TABS];
export const SECTOR_IDS = SECTOR_TABS.map((s) => s.id);
export function sectorById(id) { return SECTOR_TABS.find((s) => s.id === id) || null; }
