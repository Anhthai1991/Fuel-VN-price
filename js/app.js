// Main App Module - Orchestrator that coordinates all modules
// Responsibilities: Initialize app, coordinate module interactions, manage application state

import config from './config.js';
import * as utils from './utils.js';
import * as dataLoader from './dataLoader.js';
import * as ui from './ui.js';
import * as charts from './charts.js';

let allData = [];
let filteredData = [];
let currentRange = 'ALL';
let selectedProduct = config.PRODUCTS[0]?.name || 'Xăng RON 95-III';

// Initialize dashboard
export async function initApp() {
  try {
    ui.showLoading(true);
    
    // Load data
    allData = await dataLoader.loadData();
    filteredData = allData;
    
    // Initialize chart
    const chartCanvas = document.getElementById('priceChart');
    if (chartCanvas) {
      charts.initChart(chartCanvas, allData, filteredData);
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial display
    updateDashboard();
    
    ui.hideError();
    ui.showLoading(false);
  } catch (error) {
    console.error('Error initializing app:', error);
    ui.showError('Failed to load data. Please refresh the page.');
    ui.showLoading(false);
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Date range buttons
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', e => {
      const range = e.target.getAttribute('data-range');
      selectRange(range);
    });
  });
  
  // Product selector if it exists
  const productSelector = document.getElementById('productSelector');
  if (productSelector) {
    productSelector.addEventListener('change', e => {
      selectedProduct = e.target.value;
      updateStatistics();
    });
  }
}

// Select date range and update dashboard
function selectRange(range) {
  currentRange = range;
  filteredData = dataLoader.filterDataByRange(allData, range);
  updateDashboard();
}

// Update dashboard displays
function updateDashboard() {
  ui.updateRangeButtons(currentRange);
  ui.updatePriceCards(allData, filteredData);
  ui.updateLastUpdate(utils.parseDate(filteredData[filteredData.length - 1]?.date));
  updateStatistics();
  charts.updateChart(filteredData);
}

// Update statistics panel
function updateStatistics() {
  ui.updateStatistics(filteredData, selectedProduct);
}

// Export public API
export default {
  initApp,
  selectRange,
  updateDashboard
};


// Initialize the app on page load
initApp();
