// js/ui.js — Full File (Events fixed + MVP UI)

import config from './config.js';
import { formatVND } from './utils.js';

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/* -------------------------------------------------------------
   Create Price Card Containers
-------------------------------------------------------------- */
export function ensureProductContainers() {
  const wrap = document.getElementById('price-cards');
  if (!wrap) return;

  wrap.innerHTML = '';

  (config.PRODUCTS || []).forEach(p => {
    const div = document.createElement('div');
    div.id = `price-${p.code}`;
    wrap.appendChild(div);
  });
}

/* -------------------------------------------------------------
   Render Key Events  (One-line header + one-line summary)
-------------------------------------------------------------- */
export function renderEventsList() {
  const wrap = document.getElementById('eventsList');
  if (!wrap) return;

  wrap.innerHTML = '';

  if (!Array.isArray(config.EVENTS) || config.EVENTS.length === 0) {
    wrap.innerHTML = '<div style="color:#6b7280">No events available</div>';
    return;
  }

  config.EVENTS.forEach(e => {
    const card = document.createElement('div');
    card.className = 'event-card';

    const header = document.createElement('div');
    header.className = 'event-header';

    const dateEl = document.createElement('span');
    dateEl.className = 'event-date';
    dateEl.textContent = e.date || '';

    const titleEl = document.createElement('span');
    titleEl.className = 'event-title';
    titleEl.textContent = ' ' + (e.title || '');

    header.appendChild(dateEl);
    header.appendChild(titleEl);

    const summary = document.createElement('div');
    summary.className = 'event-summary';
    summary.textContent = e.summary || '';

    card.appendChild(header);
    card.appendChild(summary);
    wrap.appendChild(card);
  });
}

/* -------------------------------------------------------------
   Update Price Cards (MVP Style)
-------------------------------------------------------------- */
export function updatePriceCards(allData = [], filteredData = []) {
  (config.PRODUCTS || []).forEach(product => {
    const container = document.getElementById(`price-${product.code}`);
    if (!container) return;

    const rows = filteredData.filter(r => r.product === product.name);
    if (rows.length === 0) {
      container.innerHTML = `<div class="price-card" style="border-left:6px solid ${product.color}"><h3>${product.name}</h3><div>No data</div></div>`;
      return;
    }

    const last = rows[rows.length - 1];
    const prev = rows.length > 1 ? rows[rows.length - 2] : last;

    const currentPrice = Number(last.price) || 0;
    const prevPrice = Number(prev.price) || currentPrice;

    const delta = currentPrice - prevPrice;
    const deltaPct = prevPrice !== 0 ? (delta / prevPrice * 100) : 0;

    const allPrices = rows.map(r => Number(r.price));
    const firstVal = allPrices[0];
    const lastVal = allPrices[allPrices.length - 1];

    const periodAbs = lastVal - firstVal;
    const periodPct = firstVal ? (periodAbs / firstVal * 100) : 0;

    container.innerHTML = `
      <div class="price-card" style="border-left:6px solid ${product.color}">
        <h3>${product.name}</h3>
        <div class="price">${formatVND(currentPrice)}</div>
        <div class="meta">Last update: ${fmtDate(last.date)}</div>

        <div class="change-line">
          <span class="${delta > 0 ? 'change-neg' : 'change-pos'}">
            ${delta > 0 ? '↑' : '↓'} ${Math.abs(deltaPct).toFixed(2)}%
          </span>
          <span class="${periodAbs > 0 ? 'change-neg' : 'change-pos'}">
            ${periodAbs > 0 ? '↑' : '↓'} ${formatVND(Math.abs(periodAbs))}
            (${Math.abs(periodPct).toFixed(2)}%)
          </span>
        </div>
      </div>
    `;
  });
}

/* -------------------------------------------------------------
   Update Top Summary (Highest / Lowest / Average)
-------------------------------------------------------------- */
export function updateSummary(filteredData = []) {
  const statWrap = document.querySelector('.statistics');
  if (!statWrap) return;

  const prices = filteredData.map(r => Number(r.price)).filter(x => !isNaN(x));

  const highest = prices.length ? Math.max(...prices) : 0;
  const lowest  = prices.length ? Math.min(...prices) : 0;
  const avg     = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;

  statWrap.innerHTML = `
    <div class="stat-summary"><div class="label">Highest:</div><div class="value">${formatVND(highest)}</div></div>
    <div class="stat-summary"><div class="label">Lowest:</div><div class="value">${formatVND(lowest)}</div></div>
    <div class="stat-summary"><div class="label">Average:</div><div class="value">${formatVND(Math.round(avg))}</div></div>
  `;
}

/* -------------------------------------------------------------
   Detailed Range Statistics (MVP-style cards)
-------------------------------------------------------------- */
export function updateStatistics(filteredData = []) {
  const wrap = document.querySelector('#statistics');
  if (!wrap) return;

  const products = config.PRODUCTS || [];

  const html = products.map(p => {
    const rows = filteredData.filter(r => r.product === p.name);
    if (rows.length === 0) {
      return `<div class="stat-card"><h4>${p.name}</h4>No data</div>`;
    }

    const prices = rows.map(r => Number(r.price));
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    const avg = Math.round(prices.reduce((a,b)=>a+b,0)/prices.length);

    const highDate = rows.find(r => Number(r.price) === highest)?.date;
    const lowDate  = rows.find(r => Number(r.price) === lowest)?.date;

    const periodAbs = prices[prices.length-1] - prices[0];
    const periodPct = prices[0] ? (periodAbs / prices[0] * 100) : 0;

    return `
      <div class="stat-card">
        <h4>${p.name}</h4>
        <div class="stat-row"><div>Highest Price</div><div style="color:#ef4444">${formatVND(highest)}</div></div>
        <div class="stat-row"><div>Date</div><div>${fmtDate(highDate)}</div></div>
        <div class="stat-row"><div>Lowest Price</div><div style="color:#059669">${formatVND(lowest)}</div></div>
        <div class="stat-row"><div>Date</div><div>${fmtDate(lowDate)}</div></div>
        <div class="stat-row"><div>Average Price</div><div>${formatVND(avg)}</div></div>
        <div class="stat-row"><div>Period Change</div>
          <div style="color:${periodAbs > 0 ? '#ef4444' : '#059669'}">
            ${periodAbs > 0 ? '↑' : '↓'} ${formatVND(Math.abs(periodAbs))}
            (${Math.abs(periodPct).toFixed(2)}%)
          </div>
        </div>
      </div>
    `;
  }).join('');

  wrap.innerHTML = `<div class="stats-grid">${html}</div>`;
}

/* -------------------------------------------------------------
   Last update
-------------------------------------------------------------- */
export function updateLastUpdate(date) {
  const el = document.getElementById('last-update');
  if (el) el.textContent = date ? `Last updated: ${fmtDate(date)}` : '';
}

/* -------------------------------------------------------------
   Error / Loading
-------------------------------------------------------------- */
export function showLoading(s=true){document.getElementById('loadingMessage').style.display=s?'block':'none';}
export function showError(m){const el=document.getElementById('error-message'); if(el){el.textContent=m; el.style.display='block';}}
export function hideError(){const el=document.getElementById('error-message'); if(el) el.style.display='none';}

/* -------------------------------------------------------------
   Range Buttons
-------------------------------------------------------------- */
export function updateRangeButtons(activeRange) {
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-range') === activeRange);
  });
}

export default {
  ensureProductContainers,
  renderEventsList,
  updatePriceCards,
  updateSummary,
  updateStatistics,
  updateLastUpdate,
  showError,
  hideError,
  showLoading,
  updateRangeButtons
};
