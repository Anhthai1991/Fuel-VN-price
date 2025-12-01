// js/config.js
export const PRODUCTS = [
  { name: 'Xăng RON 95-III', code: 'ron95',  color: '#ef4444', icon: '⛽' },
  { name: 'Xăng E5 RON 92-II', code: 'e5',  color: '#0ea5e9', icon: '⛽' },
  { name: 'Dầu DO 0,05S-II',   code: 'do',  color: '#059669', icon: '🛢️' },
  { name: 'Dầu KO',            code: 'ko',  color: '#f59e0b', icon: '🛢️' }
];

export const CSV_FILE = './pvoil_gasoline_prices_full.csv';

export const DATE_RANGES = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, '3Y': 36, 'ALL': null };
export const UI = { CHART_HEIGHT: 420 };

export const EVENTS = [
  { date: '20/04/2020', title: 'COVID-19 Impact', summary: 'Oil prices crashed during pandemic lockdowns. Global demand dropped significantly affecting all fuel products.' },
  { date: '30/06/2022', title: 'Energy Crisis', summary: 'Prices peaked during global energy crisis. Supply chain disruptions and geopolitical tensions drove prices to historic highs.' },
  { date: '03/11/2025', title: 'Current Market', summary: 'Market shows moderate stability with controlled volatility. Prices remain relatively stable compared to previous years.' }
];

export default { PRODUCTS, CSV_FILE, DATE_RANGES, UI, EVENTS };
