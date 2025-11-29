// js/ui.js
import { formatVND, formatDate as utilsFormatDate } from './utils.js';
import config from './config.js';

function formatDateSafe(dateOrStr) {
  if (!dateOrStr) return '';
  if (dateOrStr instanceof Date) {
    const d = dateOrStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  try {
    return utilsFormatDate(dateOrStr) || String(dateOrStr);
  } catch (e) {
    return String(dateOrStr);
  }
}

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

export function updatePriceCards(allData = [], filteredData = []) {
  if (!Array.isArray(config.PRODUCTS)) {
    console.error('updatePriceCards: config.PRODUCTS is not an array', config.PRODUCTS);
    return;
  }

  config.PRODUCTS.forEach(product => {
    const container = document.getElementById(`price-${product.code}`);
    if (!container) return;

    let latestIndex = -1;
    for (let i = filteredData.length - 1; i >= 0; i--) {
      if (filteredData[i].product === product.name) {
        latestIndex = i;
        break;
      }
    }

    if (latestIndex === -1) {
      container.innerHTML = `
        <div class="price-card" style="border-left: 4px solid ${product.color}">
          <h3>${product.name}</h3>
          <p class="price">No data</p>
          <p class="date">Last update: -</p>
        </div>
      `;
      return;
    }

    const latest = filteredData[latestIndex];
    let prevPrice = latest.price;
    for (let j = latestIndex - 1; j >= 0; j--) {
      if (filteredData[j].product === product.name) {
        prevPrice = filteredData[j].price;
        break;
      }
    }

    const currentPrice = Number.isFinite(latest.price) ? latest.price : NaN;
    const previousPrice = Number.isFinite(prevPrice) ? prevPrice : currentPrice;

    const priceChange = (Number.isFinite(currentPrice) && Number.isFinite(previousPrice)) ? currentPrice - previousPrice : 0;
    const priceChangePercent = (previousPrice && previousPrice !== 0) ? ((priceChange / previousPrice) * 100).toFixed(2) : '0.00';
    const changeClass = priceChange > 0 ? 'price-up' : priceChange < 0 ? 'price-down' : 'price-stable';
    const changeIcon = priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '→';

    container.innerHTML = `
      <div class="price-card" style="border-left: 4px solid ${product.color}">
        <h3>${product.name}</h3>
        <p class="price">${Number.isFinite(currentPrice) ? formatVND(currentPrice) : 'No data'}</p>
        <p class="change ${changeClass}">${changeIcon} ${priceChange > 0 ? '+' : ''}${priceChangePercent}%</p>
        <p class="date">Last update: ${formatDateSafe(latest.date)}</p>
      </div>
    `;
  });
}

export function updateLastUpdate(lastDate) {
  const element = document.getElementById('last-update');
  if (!element) return;
  if (!lastDate) { element.textContent = ''; return; }
  element.textContent = `Last updated: ${formatDateSafe(lastDate)}`;
}

export function updateStatistics(filteredData = [], productName) {
  if (!productName) return;
  const prices = (filteredData || []).filter(d => d.product === productName).map(d => d.price).filter(p => Number.isFinite(p));
  const statsContainer = document.getElementById('statistics');
  if (!statsContainer) return;

  if (prices.length === 0) {
    statsContainer.innerHTML = `<div>No data for ${productName}</div>`;
    return;
  }

  const highest = Math.max(...prices);
  const lowest = Math.min(...prices);
  const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  statsContainer.innerHTML = `
    <div class="stat-item"><span>Highest:</span><strong>${formatVND(highest)}</strong></div>
    <div class="stat-item"><span>Lowest:</span><strong>${formatVND(lowest)}</strong></div>
    <div class="stat-item"><span>Average:</span><strong>${formatVND(average)}</strong></div>
  `;
}

export function showLoading(show = true) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
}

export function showError(message) {
  const errorContainer = document.getElementById('error-message');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}

export function hideError() {
  const errorContainer = document.getElementById('error-message');
  if (errorContainer) errorContainer.style.display = 'none';
}

export function updateRangeButtons(activeRange) {
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-range') === activeRange) btn.classList.add('active');
  });
}

export default {
  ensureProductContainers,
  updatePriceCards,
  updateLastUpdate,
  updateStatistics,
  showLoading,
  showError,
  hideError,
  updateRangeButtons
};
