// js/utils.js
export function formatVND(num) {
  if (!Number.isFinite(Number(num))) return '';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(num));
}

export function parseDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const s = String(dateStr).trim();
  if (s.includes('/')) {
    const parts = s.split('/').map(p => p.trim());
    if (parts.length === 3) {
      const [d,m,y] = parts;
      return new Date(`${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
    }
  }
  return new Date(s);
}
