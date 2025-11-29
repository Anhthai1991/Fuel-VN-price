// js/dataLoader.js
import { CSV_FILE } from './config.js';

let _cachedData = null;

export function loadData() {
  if (_cachedData) return Promise.resolve(_cachedData);

  return new Promise((resolve, reject) => {
    if (typeof Papa === 'undefined' || !Papa.parse) {
      reject(new Error('PapaParse not available. Include papaparse before module scripts.'));
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
              const date = row['Ngày'] || row['Date'] || row['date'];
              const product = row['Mặt hàng'] || row['Product'] || row['product'];
              const priceRaw = row['Giá (VND)'] || row['Price'] || row['price'];

              const priceNum = typeof priceRaw === 'string'
                ? parseFloat(priceRaw.replace(/[, ]+/g, ''))
                : parseFloat(priceRaw);

              return {
                date: date,
                product: product,
                price: Number.isFinite(priceNum) ? priceNum : NaN,
                _raw: row
              };
            })
            .filter(r => r.date && r.product && !Number.isNaN(r.price));

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

export function parseDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const s = String(dateStr).trim();
  if (s.includes('/')) {
    const parts = s.split('/').map(p => p.trim());
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const iso = `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const dt = new Date(iso);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }
  const dt = new Date(s);
  return dt;
}

export function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d || Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getLastDate(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  let latest = null;
  for (const r of data) {
    const d = parseDate(r.date);
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

export function filterDataByRange(data, range) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const sorted = [...data].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  if (!range || range === 'ALL') return sorted;

  const last = parseDate(sorted[sorted.length - 1].date);
  if (!last || Number.isNaN(last.getTime())) return sorted;

  const start = new Date(last.getTime());

  switch (range) {
    case '1M': start.setMonth(start.getMonth() - 1); break;
    case '3M': start.setMonth(start.getMonth() - 3); break;
    case '6M': start.setMonth(start.getMonth() - 6); break;
    case '1Y': start.setFullYear(start.getFullYear() - 1); break;
    case '3Y': start.setFullYear(start.getFullYear() - 3); break;
    default: return sorted;
  }

  return sorted.filter(r => {
    const d = parseDate(r.date);
    return d && !Number.isNaN(d.getTime()) && d >= start;
  });
}

export default { loadData };
