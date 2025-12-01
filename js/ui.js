// js/ui.js
import config from './config.js';
import { formatVND } from './utils.js'; // assume utils.formatVND exists

// safe date formatter (DD/MM/YYYY)
function fmtDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return String(d);
}

/* ---------------------------
   Ensure container placeholders
   --------------------------- */
export function ensureProductContainers() {
  const wrap = document.getElementById('price-cards');
  if (!wrap) return;
  wrap.innerHTML = '';
  (Array.isArray(config.PRODUCTS) ? config.PRODUCTS : []).forEach(p => {
    const div = document.createElement('div');
    div.id = `price-${p.code}`;
    div.className = 'price-card-wrapper';
    wrap.appendChild(div);
  });
}

/* ---------------------------
   Render events list
   --------------------------- */
export function renderEventsList() {
  const wrap = document.getElementById('eventsList');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!Array.isArray(config.EVENTS)) return;
  config.EVENTS.forEach(e => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `<h3>${e.title}</h3><small>${e.date}</small><p>${e.summary}</p>`;
    wrap.appendChild(card);
  });
}

/* ---------------------------
   Update current price cards
   data shape: rows { date, product, price }
   filteredData: subset used for current range
   allData: total dataset
   --------------------------- */
export function updatePriceCards(allData = [], filteredData = []) {
  const products = Array.isArray(config.PRODUCTS) ? config.PRODUCTS : [];
  products.forEach(product => {
    const container = document.getElementById(`price-${product.code}`);
    if (!container) return;

    // find latest entry for this product in filteredData
    let latestIndex = -1;
    for (let i = filteredData.length - 1; i >= 0; i--) {
      if (String(filteredData[i].product).trim() === product.name) { latestIndex = i; break; }
    }
    if (latestIndex === -1) {
      container.innerHTML = `<div class="price-card" style="border-left:6px solid ${product.color}">
        <h3>${product.name}</h3>
        <div class="price">No data</div>
      </div>`;
      return;
    }

    const latest = filteredData[latestIndex];
    // find previous entry for same product
    let prev = latest.price;
    for (let j = latestIndex - 1; j >= 0; j--) {
      if (String(filteredData[j].product).trim() === product.name) { prev = filteredData[j].price; break; }
    }

    const currentPrice = Number.isFinite(Number(latest.price)) ? Number(latest.price) : NaN;
    const prevPrice = Number.isFinite(Number(prev)) ? Number(prev) : currentPrice;
    const delta = Number.isFinite(currentPrice) && Number.isFinite(prevPrice) ? currentPrice - prevPrice : 0;
    const deltaPct = prevPrice !== 0 ? (delta / prevPrice) * 100 : 0;

    const changeClass = delta > 0 ? 'price-up' : delta < 0 ? 'price-down' : 'price-stable';
    const changeIcon = delta > 0 ? '▲' : delta < 0 ? '▼' : '→';

    // compute period change (first->last in filteredData for product)
    const series = (filteredData || []).filter(r => r.product === product.name && Number.isFinite(Number(r.price))).map(r => Number(r.price));
    const firstVal = series.length ? series[0] : currentPrice;
    const lastVal = series.length ? series[series.length-1] : currentPrice;
    const periodAbs = Number.isFinite(firstVal) && Number.isFinite(lastVal) ? lastVal - firstVal : 0;
    const periodPct = firstVal ? (periodAbs / firstVal) * 100 : 0;

    container.innerHTML = `
      <div class="price-card" style="border-left: 6px solid ${product.color}">
        <h3>${product.name}</h3>
        <div class="price">${Number.isFinite(currentPrice) ? formatVND(currentPrice) : 'No data'}</div>
        <div class="meta">Last update: ${fmtDate(latest.date)}</div>
        <div class="trend" style="margin-top:12px;">
          <div style="color:${delta < 0 ? '#059669' : (delta > 0 ? '#ef4444' : '#6b7280')}; font-weight:700;">
            ${delta < 0 ? '↓' : (delta > 0 ? '↑' : '')} ${Math.abs(deltaPct).toFixed(2)}%
          </div>
          <div style="margin-left:10px; color:#6b7280; font-weight:600;">
            ${periodAbs >= 0 ? '↑' : '↓'} ${formatVND(Math.abs(periodAbs))} (${periodPct >= 0 ? '+' : ''}${periodPct.toFixed(2)}%)
          </div>
        </div>
      </div>
    `;
  });
}

/* ---------------------------
   Top summary (highest/lowest/avg across selection)
   Here we compute across selected product (or overall)
   --------------------------- */
export function updateSummary(filteredData = []) {
  // We'll compute overall highest/lowest/avg across all product prices in filteredData
  const prices = (filteredData || []).map(r => Number(r.price)).filter(p => Number.isFinite(p));
  const highest = prices.length ? Math.max(...prices) : 0;
  const lowest = prices.length ? Math.min(...prices) : 0;
  const average = prices.length ? (prices.reduce((a,b)=>a+b,0)/prices.length) : 0;

  // render into three stat-summary blocks (we assume .statistics contains them)
  const statWrap = document.querySelector('.statistics');
  if (!statWrap) return;
  statWrap.innerHTML = `
    <div class="stat-summary"><div class="label">Highest:</div><div class="value">${formatVND(highest)}</div></div>
    <div class="stat-summary"><div class="label">Lowest:</div><div class="value">${formatVND(lowest)}</div></div>
    <div class="stat-summary"><div class="label">Average:</div><div class="value">${formatVND(Math.round(average))}</div></div>
  `;
}

/* ---------------------------
   Detailed statistics cards for range (per product)
   --------------------------- */
export function updateStatistics(filteredData = [], selectedProductName = null) {
  // Build stat cards showing highest/lowest/avg/period change per product
  const wrap = document.querySelector('#statistics');
  if (!wrap) return;
  // We'll render the grid with stat-cards inside
  const products = Array.isArray(config.PRODUCTS) ? config.PRODUCTS : [];
  const statHtml = products.map(p => {
    const series = (filteredData || []).filter(r => r.product === p.name && Number.isFinite(Number(r.price))).map(r => ({ date: r.date, price: Number(r.price) }));
    if (!series.length) {
      return `<div class="stat-card"><h4>${p.name}</h4><div>No data for this range</div></div>`;
    }
    const prices = series.map(s => s.price);
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    const avg = Math.round(prices.reduce((a,b)=>a+b,0)/prices.length);
    // find date of highest/lowest
    const highestDate = series.find(s => s.price === highest)?.date || '';
    const lowestDate = series.find(s => s.price === lowest)?.date || '';
    const periodChange = prices[prices.length-1] - prices[0];
    const periodPct = prices[0] ? (periodChange / prices[0]) * 100 : 0;
    return `
      <div class="stat-card">
        <h4>${p.name}</h4>
        <div class="stat-row"><div>Highest Price</div><div style="color:#ef4444; font-weight:700;">${formatVND(highest)}</div></div>
        <div class="stat-row"><div>Date</div><div>${fmtDate(highestDate)}</div></div>
        <div class="stat-row"><div>Lowest Price</div><div style="color:#059669; font-weight:700;">${formatVND(lowest)}</div></div>
        <div class="stat-row"><div>Date</div><div>${fmtDate(lowestDate)}</div></div>
        <div class="stat-row"><div>Average Price</div><div style="font-weight:700;">${formatVND(avg)}</div></div>
        <div class="stat-row"><div>Period Change</div><div style="color:${periodChange < 0 ? '#059669' : '#ef4444'}; font-weight:700;">
          ${periodChange >= 0 ? '+' : '-'}${formatVND(Math.abs(periodChange))} (${periodPct >= 0 ? '+' : ''}${Math.abs(periodPct).toFixed(2)}%)
        </div></div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = `<div class="stats-grid">${statHtml}</div>`;
}

/* ---------------------------
   Last update & error UI
   --------------------------- */
export function updateLastUpdate(date) {
  const el = document.getElementById('last-update');
  if (!el) return;
  el.textContent = date ? `Last updated: ${fmtDate(date)}` : '';
}

export function showLoading(show = true) {
  const loader = document.getElementById('loadingMessage');
  if (loader) loader.style.display = show ? 'block' : 'none';
}

export function showError(msg) {
  const el = document.getElementById('error-message');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

export function hideError() {
  const el = document.getElementById('error-message');
  if (!el) return;
  el.style.display = 'none';
}

/* ---------------------------
   Range button aria update
   --------------------------- */
export function updateRangeButtons(activeRange) {
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-range') === activeRange) btn.classList.add('active');
  });
}

/* ---------------------------
   Exports
   --------------------------- */
export default {
  ensureProductContainers,
  renderEventsList,
  updatePriceCards,
  updateSummary,
  updateStatistics,
  updateLastUpdate,
  showLoading,
  showError,
  hideError,
  updateRangeButtons
};
