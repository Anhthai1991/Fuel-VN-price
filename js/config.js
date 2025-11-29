/**
 * Configuration file - Product & UI Constants
 */

const PRODUCTS = {
  'Xăng RON 95-III': { code: 'ron95', color: '#EF4444', icon: '⛽' },
  'Xăng E5 RON 92-II': { code: 'e5', color: '#3B82F6', icon: '⛽' },
  'Dầu DO 0,05S-II': { code: 'do', color: '#10B981', icon: '🛢️' },
  'Dầu KO': { code: 'ko', color: '#F59E0B', icon: '🛢️' }
};

const CSV_FILE = 'pvgasoline_prices_full.csv';
const DATE_RANGES = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, '3Y': 36, 'ALL': null };
const UI = { CHART_HEIGHT: 400, TABLE_HEIGHT: 600 };

export default { PRODUCTS, CSV_FILE, DATE_RANGES, UI };
export { CSV_FILE };
