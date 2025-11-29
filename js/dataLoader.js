/**
 * js/dataLoader.js
 * CSV data loading + processing module (pure, no UI side-effects)
 *
 * Exports:
 *  - loadData() => Promise<allDataArray>
 *  - filterDataByRange(data, range) => filtered array
 *  - parseDate(dateStr), formatDate(dateStr)
 *  - getLastDate(data) => ISO/JS Date or null
 *
 * Default export: { loadData }
 */

import { CSV_FILE } from './config.js';

let _cachedData = null;

/**
 * Load CSV (PapaParse) and return normalized array of rows:
 * { date: 'DD/MM/YYYY' or original, product: '...', price: Number }
 */
export function loadData() {
  // If already loaded, return cached copy
  if (_cachedData) return Promise.resolve(_cachedData);

  return new Promise((resolve, reject) => {
    if (typeof Papa === 'undefined' || !Papa.parse) {
      reject(new Error('PapaParse not available. Make sure Papaparse is included before module scripts.'));
      return;
    }

    console.log('dataLoader: loading CSV from', CSV_FILE);

    Papa.parse(CSV_FILE, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(results) {
        try {
          if (!results || !results.data) {
            reject(new Error('CSV parse returned no data'));
            return;
          }

          const mapped = results.data
            .map(row => {
              // Support Vietnamese and English headers if present
              const date = row['Ngày'] || row['Date'] || row['date'];
              const product = row['Mặt hàng'] || row['Product'] || row['product'];
              const priceRaw = row['Giá (VND)'] || row['Price'] || row['price'];

              // Normalize price: remove commas, whitespace
              const priceNum = typeof priceRaw === 'string'
                ? parseFloat(priceRaw.replace(/[, ]+/g, ''))
                : parseFloat(priceRaw);

              return {
                date: date,
                product: product,
                price: Number.isFinite(priceNum) ? priceNum : NaN,
                // keep raw row for debugging if needed
                _raw: row
              };
            })
            .filter(r => r.date && r.product && !Number.isNaN(r.price));

          // Sort by date ascending (oldest -> newest) using parseDate
          mapped.sort((a, b) => parseDate(a.date) - parseDate(b.date));

          _cachedData = mapped;
          console.log(`dataLoader: loaded ${mapped.length} valid rows`);
          resolve(mapped);
        } catch (err) {
          console.error('dataLoader: error processing CSV', err);
          reject(err);
        }
      },
      error(err) {
        console.error('dataLoader: Papa.parse error', err);
        reject(err);
      }
    });
  });
}

/**
 * Parse a date string expected in DD/MM/YYYY or similar.
 * Returns a Date object. If parsing fails returns Invalid Date.
 */
export function parseDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  // Trim and detect dd/mm/yyyy-like pattern
  const s = String(dateStr).trim();
  // If contains '/', try DD/MM/YYYY or D/M/YYYY
  if (s.includes('/')) {
    const parts = s.split('/').map(p => p.trim());
    if (parts.length === 3) {
      const [d, m, y] = parts;
      // Construct ISO string YYYY-MM-DD for reliable parsing
      const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const dt = new Date(iso);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }

  // Fallback: let Date try to parse
  const dt = new Date(s);
  return dt;
}

/**
 * Format date string (accepts the same formats parseDate accepts)
 * Returns 'DD/MM/YYYY' or empty string if invalid
 */
export function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d || Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get last (most recent) date from data array (expects sorted or unsorted).
 * Returns Date object or null.
 */
export function getLastDate(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  // Ensure we compare by parsed date
  let latest = null;
  for (const r of data) {
    const d = parseDate(r.date);
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

/**
 * Filter data by given range.
 * Signature matches app.js expectation: filterDataByRange(allData, range)
 * - data: array of rows
 * - range: one of '1M','3M','6M','1Y','3Y','ALL'
 */
export function filterDataByRange(data, range) {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Make a shallow copy and sort ascending
  const sorted = [...data].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  if (!range || range === 'ALL') return sorted;

  // Determine last date in data
  const last = parseDate(sorted[sorted.length - 1].date);
  if (!last || Number.isNaN(last.getTime())) return sorted;

  const start = new Date(last.getTime());

  switch (range) {
    case '1M':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3M':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6M':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case '3Y':
      start.setFullYear(start.getFullYear() - 3);
      break;
    default:
      // If unrecognized range, return full dataset
      return sorted;
  }

  return sorted.filter(r => {
    const d = parseDate(r.date);
    return d && !Number.isNaN(d.getTime()) && d >= start;
  });
}

// default export for convenience
export default { loadData };
