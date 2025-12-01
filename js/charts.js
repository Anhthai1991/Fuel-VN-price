// js/charts.js
import config from './config.js';

let priceChart = null;

function normalize(s) {
  if (!s) return '';
  return String(s).trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g,' ').trim();
}

function parseDateStr(s) {
  if (!s) return new Date(NaN);
  const str = String(s).trim();
  if (str.includes('/')) {
    const parts = str.split('/').map(p => p.trim());
    if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date(str);
}

function hexToRgba(hex, a=0.12) {
  if (!hex) return `rgba(0,0,0,${a})`;
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function buildSeries(rows) {
  // unique sorted timestamps
  const tsMap = new Map();
  for (const r of rows) {
    const dt = parseDateStr(r.date);
    if (isNaN(dt)) continue;
    const ts = dt.getTime();
    if (!tsMap.has(ts)) tsMap.set(ts, dt);
  }
  const timestamps = Array.from(tsMap.keys()).sort((a,b)=>a-b);
  const labels = timestamps.map(ts => {
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  });

  const mapping = (config.PRODUCTS || []).map(p => {
    const norm = normalize(p.name);
    // find best CSV labels if rows contain alternate product strings
    const csvLabels = Array.from(new Set(rows.map(r => (r.product||'').trim()))).filter(Boolean);
    let matchLabel = p.name;
    for (const lbl of csvLabels) {
      if (normalize(lbl) === norm) { matchLabel = lbl; break; }
      if (normalize(lbl).includes(norm) || norm.includes(normalize(lbl))) { matchLabel = lbl; break; }
    }
    return { product: p, csvLabel: matchLabel };
  });

  const datasetsData = mapping.map(m => {
    const map = new Map();
    for (const r of rows) {
      if ((r.product||'').trim() === m.csvLabel) {
        const ts = parseDateStr(r.date).getTime();
        map.set(ts, Number.isFinite(Number(r.price)) ? Number(r.price) : null);
      }
    }
    return timestamps.map(ts => map.has(ts) ? map.get(ts) : null);
  });

  const products = mapping.map(m => m.product);
  return { labels, datasetsData, products };
}

export function initChart(canvas, rows=[]) {
  if (!canvas || typeof Chart === 'undefined') return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (priceChart) try { priceChart.destroy(); } catch(e){}
  const { labels, datasetsData, products } = buildSeries(rows);

  const datasets = products.map((p, idx) => ({
    label: p.name,
    data: datasetsData[idx] || [],
    borderColor: p.color || '#333',
    backgroundColor: hexToRgba(p.color, 0.06),
    pointRadius: 3,
    tension: 0.12,
    fill: false
  }));

  priceChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true } },
        title: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: v => new Intl.NumberFormat('vi-VN', {maximumFractionDigits:0}).format(v)
          },
          grid: { color: 'rgba(0,0,0,0.04)' }
        },
        x: {
          ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 20 },
          grid: { display: false }
        }
      },
      interaction: { mode: 'nearest', intersect: false }
    }
  });

  return priceChart;
}

export function updateChart(rows) {
  if (!priceChart) return;
  const { labels, datasetsData, products } = buildSeries(rows);
  priceChart.data.labels = labels;
  if (!priceChart.data.datasets || priceChart.data.datasets.length !== products.length) {
    priceChart.data.datasets = products.map((p, idx) => ({
      label: p.name,
      data: datasetsData[idx] || [],
      borderColor: p.color || '#333',
      backgroundColor: hexToRgba(p.color,0.06),
      pointRadius: 3,
      tension: 0.12,
      fill: false
    }));
  } else {
    priceChart.data.datasets.forEach((ds, i) => ds.data = datasetsData[i] || []);
  }
  try { priceChart.update(); } catch(e) { console.warn(e); }
}

export function getChart() { return priceChart; }
export function destroyChart() { if (priceChart) { try { priceChart.destroy(); } catch(e){} priceChart = null; } }

export default { initChart, updateChart, getChart, destroyChart };
