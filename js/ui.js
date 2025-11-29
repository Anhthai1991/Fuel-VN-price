// UI Module - DOM manipulation and rendering
// Responsibilities: Update dashboard UI elements, display data, manage visual states

import { formatVND, formatDate } from './utils.js';
import config from './config.js';

// Update current prices display
export function updatePriceCards(data, filteredData) {
  const lastData = filteredData[filteredData.length - 1];
  if (!lastData) return;
  
  config.PRODUCTS.forEach(product => {
    const container = document.getElementById(`price-${product.code}`);
    if (!container) return;
    
    const currentPrice = lastData[product.name];
    const previousPrice = filteredData.length > 1 ? filteredData[filteredData.length - 2][product.name] : currentPrice;
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);
    
    const changeClass = priceChange > 0 ? 'price-up' : priceChange < 0 ? 'price-down' : 'price-stable';
    const changeIcon = priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '→';
    
    container.innerHTML = `
      <div class="price-card" style="border-left: 4px solid ${product.color}">
        <h3>${product.name}</h3>
        <p class="price">${formatVND(currentPrice)}</p>
        <p class="change ${changeClass}">${changeIcon} ${priceChange > 0 ? '+' : ''}${priceChangePercent}%</p>
        <p class="date">Last update: ${formatDate(lastData.date)}</p>
      </div>
    `;
  });
}

// Update last update display
export function updateLastUpdate(lastDate) {
  const element = document.getElementById('last-update');
  if (element) {
    element.textContent = `Last updated: ${formatDate(lastDate)}`;
  }
}

// Update statistics panel
export function updateStatistics(filteredData, productName) {
  if (filteredData.length === 0) return;
  
  const prices = filteredData.map(d => d[productName]);
  const highest = Math.max(...prices);
  const lowest = Math.min(...prices);
  const average = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(0);
  
  const statsContainer = document.getElementById('statistics');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-item"><span>Highest:</span><strong>${formatVND(highest)}</strong></div>
      <div class="stat-item"><span>Lowest:</span><strong>${formatVND(lowest)}</strong></div>
      <div class="stat-item"><span>Average:</span><strong>${formatVND(average)}</strong></div>
    `;
  }
}

// Show/hide loading state
export function showLoading(show = true) {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = show ? 'block' : 'none';
  }
}

// Display error message
export function showError(message) {
  const errorContainer = document.getElementById('error-message');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}

// Hide error message
export function hideError() {
  const errorContainer = document.getElementById('error-message');
  if (errorContainer) {
    errorContainer.style.display = 'none';
  }
}

// Update range buttons active state
export function updateRangeButtons(activeRange) {
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-range') === activeRange) {
      btn.classList.add('active');
    }
  });
}

// Export for external access
export default {
  updatePriceCards,
  updateLastUpdate,
  updateStatistics,
  showLoading,
  showError,
  hideError,
  updateRangeButtons
};
