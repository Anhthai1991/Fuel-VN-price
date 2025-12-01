// js/dataLoader.js
import { CSV_FILE } from './config.js';

let cache = null;

export function loadData() {
  if (cache) return Promise.resolve(cache);

  return new Promise((resolve, reject) => {
    if (typeof Papa === 'undefined') {
      reject(new Error('PapaParse not loaded'));
      return;
    }

    Papa.parse(CSV_FILE, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete(results) {
        try {
          const rows = (results && results.data) ? results.data : [];
          const mapped = rows.map(r => {
            const date = r['Ngày'] || r['Date'] || r.date || r['Ngày/Tháng/Năm'];
            const product = (r['Mặt hàng'] || r['Product'] || r.product || '').toString().trim();
            const priceRaw = r['Giá (VND)'] || r['Price'] || r.price || '';
            const price = typeof priceRaw === 'string' ? parseFloat(priceRaw.replace(/[^\d.-]/g, '')) : Number(priceRaw);
            return { date, product, price, _raw: r };
          }).filter(r => r.date && r.product && Number.isFinite(r.price));

          // sort by date ascending
          mapped.sort((a,b) => {
            const da = new Date(a.date.includes('/') ? a.date.split('/').reverse().join('-') : a.date);
            const db = new Date(b.date.includes('/') ? b.date.split('/').reverse().join('-') : b.date);
            return da - db;
          });

          cache = mapped;
          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      },
      error(err) { reject(err); }
    });
  });
}

export function filterDataByRange(data, range) {
  if (!Array.isArray(data)) return [];
  if (!range || range === 'ALL') return data;
  const months = { '1M':1, '3M':3, '6M':6, '1Y':12, '3Y':36 }[range] || null;
  if (!months) return data;
  const last = new Date(data[data.length-1].date.includes('/') ? data[data.length-1].date.split('/').reverse().join('-') : data[data.length-1].date);
  const start = new Date(last);
  start.setMonth(start.getMonth() - months);
  return data.filter(r => {
    const d = new Date(r.date.includes('/') ? r.date.split('/').reverse().join('-') : r.date);
    return d >= start && d <= last;
  });
}

export default { loadData, filterDataByRange };
