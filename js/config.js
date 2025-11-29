/**
 * Configuration file - Product & UI Constants
 */

// Array of product definitions
const PRODUCTS = [
  { name: 'Xăng RON 95-III',      code: 'ron95', color: '#EF4444', icon: '⛽' },
  { name: 'Xăng E5 RON 92-II',    code: 'e5',   color: '#3B82F6', icon: '⛽' },
  { name: 'Dầu DO 0,05S-II',      code: 'do',   color: '#10B981', icon: '🛢️' },
  { name: 'Dầu KO',               code: 'ko',   color: '#F59E0B', icon: '🛢️' }
];

const CSV_FILE = 'pvoil_gasoline_prices_full.csv';

const DATE_RANGES = { 
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
  '3Y': 36,
  'ALL': null 
};

const UI = { 
  CHART_HEIGHT: 400, 
  TABLE_HEIGHT: 600 
};

export default { PRODUCTS, CSV_FILE, DATE_RANGES, UI };
export { CSV_FILE, PRODUCTS, DATE_RANGES, UI };
