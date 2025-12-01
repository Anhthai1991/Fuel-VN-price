// js/ui.js
import config from './config.js';
import { formatVND, parseDate } from './utils.js';

function fmtDate(dstr) {
  if (!dstr) return '';
  const d = parseDate(dstr);
  if (isNaN(d)) return String(dstr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

export function ensureProductContainers() {
  const wrap = document.getElementById('price-cards');
  if (!wrap) return;
  wrap.innerHTML = '';
  (config.PRODUCTS || []).forEach(p => {
    const el = document.createElement('div'); el.id = `price-${p.code}`; el.className='price-card';
    wrap.appendChild(el);
  });
}

export function renderEventsList() {
  const wrap = document.getElementById('eventsList');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!Array.isArray(config.EVENTS)) return;
  config.EVENTS.forEach(e => {
    const card = document.createElement('div'); card.className='event-card';
    const header = document.createElement('div'); header.className='event-header';
    const dateEl = document.createElement('span'); dateEl.className='event-date'; dateEl.textContent=e.date||'';
    const titleEl = document.createElement('span'); titleEl.className='event-title'; titleEl.textContent=' '+(e.title||'');
    header.appendChild(dateEl); header.appendChild(titleEl);
    const summary = document.createElement('div'); summary.className='event-summary'; summary.textContent = e.summary || '';
    card.appendChild(header); card.appendChild(summary); wrap.appendChild(card);
  });
}

export function updatePriceCards(allData=[], filteredData=[]) {
  (config.PRODUCTS || []).forEach(p => {
    const el = document.getElementById(`price-${p.code}`);
    if (!el) return;
    const rows = filteredData.filter(r => r.product === p.name);
    if (!rows.length) {
      el.innerHTML = `<div class="price-card" style="border-left:10px solid ${p.color}"><h3>${p.name}</h3><div class="price-value">No data</div></div>`;
      return;
    }
    const last = rows[rows.length-1];
    const prev = rows.length>1?rows[rows.length-2]:last;
    const cur = Number(last.price)||0;
    const prevP = Number(prev.price)||cur;
    const delta = cur - prevP;
    const pct = prevP?((delta/prevP)*100):0;

    // period change (first -> last in filtered)
    const series = rows.map(r=>Number(r.price));
    const firstVal = series[0]||cur;
    const periodAbs = (series.length?series[series.length-1]:cur) - firstVal;
    const periodPct = firstVal?((periodAbs/firstVal)*100):0;

    el.innerHTML = `
      <div style="border-left:10px solid ${p.color}; padding:14px; border-radius:14px; background:#fff;">
        <h3 style="font-size:14px; color:var(--muted); display:flex; align-items:center; gap:8px;">
          <span>${p.icon||''}</span> ${p.name}
        </h3>
        <div class="price-value">${formatVND(cur)} VND/lít</div>
        <div class="price-sub">${fmtDate(last.date)}</div>
        <div style="margin-top:10px; display:flex; gap:12px; align-items:center;">
          <div class="pill" style="background:${delta<0?'#e6fbf1':'#fff0f0'}; color:${delta<0?'#036643':'#c43030'};">
            ${delta<0?'↓':'↑'} ${formatVND(Math.abs(delta))}
          </div>
          <div style="color:${pct<0?'#059669':'#ef4444'}; font-weight:700;">
            ${pct<0? '↓':'↑'} ${Math.abs(pct).toFixed(2)}%
          </div>
        </div>
      </div>
    `;
  });
}

export function updateSummary(filteredData=[]) {
  const wrap = document.querySelector('.statistics');
  if (!wrap) return;
  const prices = filteredData.map(r=>Number(r.price)).filter(n=>Number.isFinite(n));
  const highest = prices.length?Math.max(...prices):0;
  const lowest = prices.length?Math.min(...prices):0;
  const avg = prices.length?Math.round(prices.reduce((a,b)=>a+b,0)/prices.length):0;
  wrap.innerHTML = `
    <div class="stat-summary"><div class="label">Highest</div><div class="value">${formatVND(highest)} VND</div></div>
    <div class="stat-summary"><div class="label">Lowest</div><div class="value">${formatVND(lowest)} VND</div></div>
    <div class="stat-summary"><div class="label">Average</div><div class="value">${formatVND(avg)} VND</div></div>
  `;
}

export function updateStatistics(filteredData=[]) {
  const wrap = document.getElementById('statistics');
  if (!wrap) return;
  const products = config.PRODUCTS || [];
  const html = products.map(p => {
    const rows = filteredData.filter(r=>r.product===p.name);
    if (!rows.length) return `<div class="stat-card"><h4>${p.name}</h4><div>No data</div></div>`;
    const prices = rows.map(r=>Number(r.price));
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    const avg = Math.round(prices.reduce((a,b)=>a+b,0)/prices.length);
    const highDate = rows.find(r=>Number(r.price)===highest)?.date||'';
    const lowDate = rows.find(r=>Number(r.price)===lowest)?.date||'';
    const periodAbs = prices[prices.length-1] - prices[0];
    const periodPct = prices[0] ? (periodAbs/prices[0])*100 : 0;
    return `
      <div class="stat-card">
        <h4>${p.name}</h4>
        <div class="stat-row"><div>Highest Price</div><div style="color:#ef4444">${formatVND(highest)} VND</div></div>
        <div class="stat-row"><div>Date</div><div>${fmtDate(highDate)}</div></div>
        <div class="stat-row"><div>Lowest Price</div><div style="color:#059669">${formatVND(lowest)} VND</div></div>
        <div class="stat-row"><div>Date</div><div>${fmtDate(lowDate)}</div></div>
        <div class="stat-row"><div>Average Price</div><div>${formatVND(avg)} VND</div></div>
        <div class="stat-row"><div>Period Change</div><div style="color:${periodAbs<0?'#059669':'#ef4444'}">${periodAbs<0?'-':'+'}${formatVND(Math.abs(periodAbs))} (${Math.abs(periodPct).toFixed(2)}%)</div></div>
      </div>
    `;
  }).join('');
  wrap.innerHTML = `<div class="stats-grid">${html}</div>`;
}

export function updateLastUpdate(dateStr) {
  const el = document.getElementById('last-update');
  if (!el) return;
  el.textContent = dateStr ? `Last updated: ${fmtDate(dateStr)}` : '';
}

export function showLoading(show=true) {
  document.getElementById('loadingMessage').style.display = show ? 'block' : 'none';
}

export function showError(msg) { const e=document.getElementById('error-message'); if(e){ e.textContent=msg; e.style.display='block'; } }
export function hideError() { const e=document.getElementById('error-message'); if(e) e.style.display='none'; }

export function updateRangeButtons(active) {
  document.querySelectorAll('[data-range]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-range')===active));
}

export default {
  ensureProductContainers, renderEventsList, updatePriceCards, updateSummary,
  updateStatistics, updateLastUpdate, showLoading, showError, hideError, updateRangeButtons
};
