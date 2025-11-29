// js/app.js
// Main App Module - Orchestrator that coordinates all modules

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

/**
 * Initialize dashboard
 */
export async function initApp() {
  try {
    console.log('app: initApp starting');
    ui.showLoading(true);

    // Load data
    allData = await dataLoader.loadData();
    filteredData = allData || [];

    console.log(`app: loaded ${filteredData.length} rows`);

    // Ensure product card containers exist
    if (typeof ui.ensureProductContainers === 'function') {
      ui.ensureProductContainers();
    }

    // If there's a product selector in the DOM, populate it from config.PRODUCTS
    populateProductSelector();

    // Initialize chart (charts.initChart should create chartInstance)
    const chartCanvas = document.getElementById('priceChart');
    if (chartCanvas && typeof charts.initChart === 'function') {
      try {
        chartInstance = charts.initChart(chartCanvas, allData, filteredData);
      } catch (err) {
        console.warn('app: charts.initChart threw an error', err);
      }
    }

    // Setup event listeners (buttons, selectors)
    setupEventListeners();

    // Initial display (use currentRange and selectedProduct)
    updateDashboard();

    ui.hideError();
    ui.showLoading(false);

    console.log('app: initApp finished');
  } catch (error) {
    console.error('Error initializing app:', error);
    ui.showError('Failed to load data. Please refresh the page.');
    ui.showLoading(false);
  }
}

/**
 * Setup UI event listeners
 */
function setupEventListeners() {
  // Range buttons (any element with data-range attribute)
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const range = target.getAttribute('data-range');
      if (range) {
        selectRange(range);
      }
    });
  });

  // Product selector change
  const productSelector = document.getElementById('productSelector');
  if (productSelector) {
    productSelector.addEventListener('change', (e) => {
      selectedProduct = e.target.value;
      updateStatistics();
      // Optionally update chart to emphasize selected product (if charts supports it)
      if (typeof charts.highlightProduct === 'function') {
        charts.highlightProduct(selectedProduct);
      }
    });
  }

  // Make chart resize/update when window resizes if charts provides an API
  window.addEventListener('resize', () => {
    if (typeof charts.onResize === 'function') charts.onResize();
  });
}

/**
 * Populate a product selector dropdown if it exists
 */
function populateProductSelector() {
  const productSelector = document.getElementById('productSelector');
  if (!productSelector) return;
  // Clear existing options
  productSelector.innerHTML = '';

  if (!Array.isArray(config.PRODUCTS) || config.PRODUCTS.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No products';
    productSelector.appendChild(opt);
    return;
  }

  config.PRODUCTS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    if (p.name === selectedProduct) opt.selected = true;
    productSelector.appendChild(opt);
  });
}

/**
 * Select date range and update dashboard
 * Keeps currentRange and filteredData in app-level state
 */
export function selectRange(range) {
  if (!range) return;
  currentRange = range;
  // dataLoader.filterDataByRange expects (data, range)
  try {
    filteredData = dataLoader.filterDataByRange(allData, range) || [];
  } catch (err) {
    console.error('app.selectRange: error filtering data', err);
    filteredData = allData || [];
  }
  updateDashboard();
}

/**
 * Update dashboard displays (UI + chart + stats)
 */
export function updateDashboard() {
  try {
    ui.updateRangeButtons(currentRange);
    ui.updatePriceCards(allData, filteredData);

    // update last update using utils.parseDate on last record (if present)
    const lastRecord = filteredData[filteredData.length - 1];
    const lastDate = lastRecord ? utils.parseDate(lastRecord.date) : null;
    ui.updateLastUpdate(lastDate);

    updateStatistics();

    // update chart via charts.updateChart
    if (typeof charts.updateChart === 'function') {
      try {
        charts.updateChart(filteredData, chartInstance);
      } catch (err) {
        console.warn('app.updateDashboard: charts.updateChart threw', err);
      }
    }
  } catch (err) {
    console.error('app.updateDashboard error:', err);
  }
}

/**
 * Update statistics for the selected product
 */
export function updateStatistics() {
  try {
    ui.updateStatistics(filteredData, selectedProduct);
  } catch (err) {
    console.error('app.updateStatistics error:', err);
  }
}

/**
 * Public API
 */
export default {
  initApp,
  selectRange,
  updateDashboard,
  updateStatistics
};

// Auto-initialize on module load
// (keeps behavior same as your previous setup)
initApp();
