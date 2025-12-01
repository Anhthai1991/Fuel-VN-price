// js/charts.js
// Chart integration module (Chart.js UMD assumed loaded globally)
// Responsibilities:
//  - Build datasets from rows {date, product, price}
//  - Match product names robustly
//  - Render line chart with event vertical annotations
//  - Provide updateChart, getChart, destroyChart, highlightProduct

import config from './config.js';

let priceChart = null;

/* ---------------------------
   Helpers
   --------------------------- */

function normalizeStr(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[.,/\\'"\-():\[\]]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDateStr(s) {
  if (!s && s !== 0) return new Date(NaN);
  const str = String(s).trim();
  if (str.includes('/')) {
    const parts = str.split('/').map(p => p.trim());
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return new Date(`${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
    }
  }
  const dt = new Date(str);
  return dt;
}

function formatDateStr(s) {
  const d = s instanceof Date ? s : parseDateStr(s);
  if (!d || Number.isNaN(d.getTime())) return String(s);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth() + 1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace('#','');
  if (h.length === 3) {
    const r = parseInt(h[0]+h[0],16);
    const g = parseInt(h[1]+h[1],16);
    const b = parseInt(h[2]+h[2],16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return `rgba(0,0,0,${alpha})`;
}

/* ---------------------------
   Annotation plugin
   --------------------------- */

// Plugin draws vertical dashed lines at label index matching annotation.label
const VerticalAnnotationPlugin = {
  id: 'verticalAnnotationPlugin',
  beforeDraw(chart, args, options) {
    const annOpts = (chart && chart.options && chart.options.plugins && chart.options.plugins.verticalAnnotationPlugin && chart.options.plugins.verticalAnnotationPlugin.annotations) || [];
    if (!Array.isArray(annOpts) || annOpts.length === 0) return;

    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    const chartArea = chart.chartArea;

    annOpts.forEach(ann => {
      // ann.label expected to match a string in chart.data.labels (e.g., "DD/MM/YYYY")
      const idx = chart.data.labels.findIndex(l => l === ann.label || l === ann.date || String(l) === String(ann.label));
      if (idx < 0) return;
      const x = xScale.getPixelForTick(idx);

      ctx.save();
      ctx.strokeStyle = ann.color || 'rgba(200,50,50,0.9)';
      ctx.lineWidth = ann.lineWidth || 1;
      ctx.setLineDash(ann.dash || [4,4]);
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // draw a small label box
      const text = ann.title || ann.label || ann.date || '';
      if (text) {
        ctx.fillStyle = ann.color || '#c83232';
        ctx.font = '12px sans-serif';
        // keep label inside chart area
        const tx = Math.min(x + 6, chartArea.right - 60);
        const ty = chartArea.top + 14;
        ctx.fillText(text, tx, ty);
      }
      ctx.restore();
    });
  }
};

// Register plugin, but guard if Chart global not present
if (typeof Chart !== 'undefined' && Chart && typeof Chart.register === 'function') {
  try { Chart.register(VerticalAnnotationPlugin); } catch (e) { /* ignore if already registered */ }
}

/* ---------------------------
   Series builder
   --------------------------- */

function buildProductMap(filteredData) {
  const uniqueCsvLabels = Array.from(new Set((filteredData || []).map(r => String(r.product || '').trim()).filter(Boolean)));
  const normalizedCsv = uniqueCsvLabels.map(lbl => ({ raw: lbl, norm: normalizeStr(lbl) }));

  const products = Array.isArray(config.PRODUCTS) ? config.PRODUCTS : [];

  return products.map(p => {
    const target = normalizeStr(p.name);
    const exact = normalizedCsv.find(x => x.norm === target);
    if (exact) return { config: p, csvLabel: exact.raw };

    const starts = normalizedCsv.find(x => x.norm.startsWith(target) || target.startsWith(x.norm));
    if (starts) return { config: p, csvLabel: starts.raw };

    const includes = normalizedCsv.find(x => x.norm.includes(target) || target.includes(x.norm));
    if (includes) return { config: p, csvLabel: includes.raw };

    return { config: p, csvLabel: p.name };
  });
}

function buildSeries(filteredData = []) {
  // map timestamps to formatted labels
  const tsToLabel = new Map();
  for (const row of filteredData || []) {
    const dt = parseDateStr(row.date);
    if (Number.isNaN(dt.getTime())) continue;
    const ts = dt.getTime();
    if (!tsToLabel.has(ts)) tsToLabel.set(ts, formatDateStr(dt));
  }
  const timestamps = Array.from(tsToLabel.keys()).sort((a,b) => a - b);
  const labels = timestamps.map(ts => tsToLabel.get(ts));

  // map products
  const mapping = buildProductMap(filteredData);
  const products = mapping.map(m => m.config);

  // build time-aligned data arrays
  const datasetsData = mapping.map(mapEntry => {
    const m = new Map();
    for (const row of filteredData || []) {
      if (String(row.product || '').trim() === mapEntry.csvLabel) {
        const ts = parseDateStr(row.date).getTime();
        if (!Number.isNaN(ts)) m.set(ts, Number.isFinite(Number(row.price)) ? Number(row.price) : null);
      }
    }
    return timestamps.map(ts => m.has(ts) ? m.get(ts) : null);
  });

  return { labels, datasetsData, products };
}

/* ---------------------------
   Chart API
   --------------------------- */

export function initChart(canvasElement, data = [], filteredData = []) {
  if (!canvasElement || typeof Chart === 'undefined') return null;
  const ctx = canvasElement.getContext('2d');
  if (!ctx) return null;

  // destroy old
  if (priceChart) {
    try { priceChart.destroy(); } catch (e) {}
    priceChart = null;
  }

  const { labels, datasetsData, products } = buildSeries(filteredData);

  const datasets = products.map((product, idx) => ({
    label: product.name,
    borderColor: product.color || '#333',
    backgroundColor: hexToRgba(product.color || '#333', 0.12),
    data: datasetsData[idx] || [],
    tension: 0.12,
    fill: true,
    spanGaps: true,
    pointRadius: 2,
    pointBackgroundColor: product.color || '#333',
    yAxisID: 'y'
  }));

  // create chart
  priceChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { usePointStyle: true } },
        title: { display: true, text: 'PVOIL Fuel Price Trends' },
        verticalAnnotationPlugin: {
          annotations: [] // app can fill this and call update()
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const v = context.raw;
              return context.dataset.label + ': ' + (v === null ? 'No data' : new Intl.NumberFormat('vi-VN').format(v) + ' VND');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Price (VND)' },
          ticks: { callback: v => Intl.NumberFormat('vi-VN').format(v) },
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

export function updateChart(filteredData = [], externalChart = null) {
  const chart = externalChart || priceChart;
  if (!chart) return;

  const { labels, datasetsData, products } = buildSeries(filteredData);

  chart.data.labels = labels;

  const productsCount = products.length;
  if (!chart.data.datasets || chart.data.datasets.length !== productsCount) {
    chart.data.datasets = products.map((p, idx) => ({
      label: p.name,
      borderColor: p.color || '#333',
      backgroundColor: hexToRgba(p.color || '#333', 0.12),
      data: datasetsData[idx] || [],
      tension: 0.12,
      fill: true,
      spanGaps: true,
      pointRadius: 2,
      pointBackgroundColor: p.color || '#333'
    }));
  } else {
    chart.data.datasets.forEach((ds, idx) => {
      ds.data = datasetsData[idx] || [];
    });
  }

  try {
    chart.update();
  } catch (err) {
    console.warn('charts.updateChart update failed', err);
  }
}

export function highlightProduct(productName) {
  const chart = priceChart;
  if (!chart || !productName) return;
  const norm = normalizeStr(productName);
  chart.data.datasets.forEach(ds => {
    const normLabel = normalizeStr(ds.label);
    if (normLabel === norm) {
      ds.borderWidth = 3;
      ds.pointRadius = 3;
      ds.hidden = false;
      ds.borderColor = ds.borderColor;
    } else {
      ds.borderWidth = 1;
      ds.pointRadius = 1;
      // dim others
      ds.borderColor = (ds.borderColor && typeof ds.borderColor === 'string') ? hexToRgba(ds.borderColor, 0.22) : 'rgba(0,0,0,0.15)';
      ds.backgroundColor = 'rgba(200,200,200,0.03)';
    }
  });
  try { chart.update(); } catch (e) {}
}

export function getChart() { return priceChart; }
export function destroyChart() { if (priceChart) { try { priceChart.destroy(); } catch (e) {} priceChart = null; } }

export default { initChart, updateChart, getChart, destroyChart, highlightProduct };
