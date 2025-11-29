/** Utility functions for formatting & calculations */

function formatVND(number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(number));
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

function formatDate(dateStr) {
  const date = parseDate(dateStr);
  if (!date || isNaN(date)) return dateStr;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function calcRelativeChange(currentPrice, absChange) {
  const prevPrice = currentPrice - absChange;
  if (!prevPrice || prevPrice === 0) return 0;
  return (absChange / prevPrice) * 100;
}

function sortData(data, column, direction) {
  return [...data].sort((a, b) => {
    let valA, valB;
    if (column === 0) { valA = parseDate(a.date); valB = parseDate(b.date); }
    else if (column === 1) { valA = a.product; valB = b.product; }
    else { valA = a.price; valB = b.price; }
    return direction === 'asc' ? valA - valB : valB - valA;
  });
}


export { formatVND, parseDate, formatDate, calcRelativeChange, sortData };
