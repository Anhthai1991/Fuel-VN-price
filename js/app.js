// js/app.js
import config from './config.js';
import * as utils from './utils.js';
import * as dataLoader from './dataLoader.js';
import * as ui from './ui.js';
import * as charts from './charts.js';

let allData = [];
let filteredData = [];
let currentRange = 'ALL';
let selectedProduct = (Array.isArray(config.PRODUCTS) && config.PRODUCTS[0]) ? config.PRODUCTS[0].name : 'Xăng RON 95-III';
let chartInstance = null;

export async function initApp() {
  try {
    console.log('app: initApp starting');
    ui.showLoading(true);

    // Load data
    allData = await dataLoader.loadData();
    filteredData = allData || [];

    console.log(`app: loaded ${filteredData.length} rows`);

    // UI containers
    if (typeof ui.ensureProductContainers === 'function') ui.ensureProductContainers();

    // Populate product selector if present
    const productSelector = document.getElementById('productSelector');
    if (productSelector) {
      productSelector.innerHTML = '';
      (Array.isArray(config.PRODUCTS) ? config.PRODUCTS : []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        if (p.name === selectedProduct) opt.selected = true;
        productSelector.appendChild(opt);
      });
    }

    // Init chart
    const chartCanvas = document.getElementById('priceChart');
    if (chartCanvas && typeof charts.initChart === 'function') {
      chartInstance = charts.initChart(chartCanvas, allData, filteredData);
    }

    // Setup listeners
    setupEventListeners();

    // Render initial dashboard
    updateDashboard();

    ui.hideError();
    ui.showLoading(false);

    // Show dashboard content now that initial render is done
    const dash = document.getElementById('dashboardContent');
    if (dash) dash.style.display = 'block';

    console.log('app: initApp finished');

  } catch (error) {
    console.error('Error initializing app:', error);
    ui.showError('Failed to load data. Please refresh the page.');
    ui.showLoading(false);
  }
}

function setupEventListeners() {
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', e => {
      const range = e.currentTarget.getAttribute('data-range');
      selectRange(range);
    });
  });

  const ps = document.getElementById('productSelector');
  if (ps) {
    ps.addEventListener('change', e => {
      selectedProduct = e.target.value;
      updateStatistics();
      if (typeof charts.highlightProduct === 'function') charts.highlightProduct(selectedProduct);
    });
  }

  window.addEventListener('resize', () => {
    if (typeof charts.onResize === 'function') charts.onResize();
  });
}

export function selectRange(range) {
  if (!range) return;
  currentRange = range;
  try {
    filteredData = dataLoader.filterDataByRange(allData, range) || [];
  } catch (err) {
    console.error('app.selectRange: error filtering data', err);
    filteredData = allData || [];
  }
  updateDashboard();
}

export function updateDashboard() {
  try {
    ui.updateRangeButtons(currentRange);
    ui.updatePriceCards(allData, filteredData);

    const lastRecord = filteredData[filteredData.length - 1];
    const lastDate = lastRecord ? utils.parseDate(lastRecord.date) : null;
    ui.updateLastUpdate(lastDate);

    updateStatistics();

    if (typeof charts.updateChart === 'function') {
      charts.updateChart(filteredData, chartInstance);
    }
  } catch (err) {
    console.error('app.updateDashboard error:', err);
  }
}

export function updateStatistics() {
  try {
    ui.updateStatistics(filteredData, selectedProduct);
  } catch (err) {
    console.error('app.updateStatistics error:', err);
  }
}

export default {
  initApp,
  selectRange,
  updateDashboard,
  updateStatistics
};

initApp();
