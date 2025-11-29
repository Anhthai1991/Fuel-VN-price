// Charts Module - Chart.js integration and wrapper
// Responsibilities: Initialize, configure, and manage all dashboard charts

import config from './config.js';

let priceChart = null;

// Initialize price chart
export function initChart(canvasElement, data, filteredData) {
  if (!canvasElement) return;
  
  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (priceChart) {
    priceChart.destroy();
  }
  
  // Prepare datasets for each product
  const datasets = config.PRODUCTS.map(product => ({
    label: product.name,
    data: filteredData.map(d => d[product.name]),
    borderColor: product.color,
    backgroundColor: product.color + '20',
    tension: 0.1,
    fill: false,
    pointRadius: 3,
    pointBackgroundColor: product.color,
    pointBorderColor: '#fff',
    pointBorderWidth: 1,
    pointHoverRadius: 5
  }));
  
  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredData.map(d => d.date),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#333',
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        title: {
          display: true,
          text: 'PVOIL Fuel Price Trends',
          color: '#333',
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Price (VND/lít)'
          },
          ticks: {
            color: '#666'
          },
          grid: {
            color: '#f0f0f0'
          }
        },
        x: {
          ticks: {
            color: '#666',
            maxTicksLimit: 15
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
  
  return priceChart;
}

// Update chart data
export function updateChart(filteredData) {
  if (!priceChart) return;
  
  priceChart.data.labels = filteredData.map(d => d.date);
  priceChart.data.datasets.forEach((dataset, index) => {
    const product = config.PRODUCTS[index];
    dataset.data = filteredData.map(d => d[product.name]);
  });
  
  priceChart.update();
}

// Get current chart instance
export function getChart() {
  return priceChart;
}

// Destroy chart
export function destroyChart() {
  if (priceChart) {
    priceChart.destroy();
    priceChart = null;
  }
}

// Export for external access
export default {
  initChart,
  updateChart,
  getChart,
  destroyChart
};
