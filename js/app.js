// js/app.js (orchestrator)
import config from './config.js';
import * as utils from './utils.js';
import * as dataLoader from './dataLoader.js';
import * as ui from './ui.js';
import * as charts from './charts.js';

let allData = [];
let filteredData = [];
let currentRange = 'ALL';
let selectedProduct = (config.PRODUCTS && config.PRODUCTS[0]) ? config.PRODUCTS[0].name : null;
let chartInstance = null;

async function initApp() {
  try {
    ui.showLoading(true);
    ui.hideError();

    allData = await dataLoader.loadData();
    filteredData = allData;

    // build UI containers
    ui.ensureProductContainers();
    ui.renderEventsList();

    // populate product selector
    const sel = document.getElementById('productSelector');
    if (sel) {
      sel.innerHTML = '';
      (config.PRODUCTS || []).forEach(p => {
        const o = document.createElement('option'); o.value = p.name; o.textContent = p.name;
        if (p.name===selectedProduct) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', e => {
        selectedProduct = e.target.value;
        ui.updateStatistics(filteredData);
      });
    }

    // init chart
    const canvas = document.getElementById('priceChart');
    chartInstance = charts.initChart(canvas, filteredData);

    // setup buttons
    document.querySelectorAll('[data-range]').forEach(btn => {
      btn.addEventListener('click', e => {
        const r = btn.getAttribute('data-range');
        selectRange(r);
      });
    });

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      const csv = toCsv(filteredData);
      downloadFile('export.csv', csv, 'text/csv');
    });
    document.getElementById('exportJsonBtn').addEventListener('click', () => {
      downloadFile('export.json', JSON.stringify(filteredData, null, 2), 'application/json');
    });

    document.getElementById('showTableBtn').addEventListener('click', () => {
      const w = document.getElementById('dataTableWrapper');
      if (!w) return;
      w.style.display = w.style.display === 'block' ? 'none' : 'block';
      if (w.style.display === 'block') renderDataTable(filteredData);
    });

    // initial render
    updateDashboard();

    document.getElementById('dashboardContent').style.display = 'block';
    ui.showLoading(false);
  } catch (err) {
    console.error(err);
    ui.showError('Failed to load data');
    ui.showLoading(false);
  }
}

function selectRange(range) {
  currentRange = range;
  filteredData = dataLoader.filterDataByRange(allData, range);
  updateDashboard();
}

function updateDashboard() {
  ui.updateRangeButtons(currentRange);
  ui.updatePriceCards(allData, filteredData);
  ui.updateSummary(filteredData);
  ui.updateStatistics(filteredData);
  ui.updateLastUpdate(filteredData.length ? filteredData[filteredData.length-1].date : null);
  charts.updateChart(filteredData);
}

// helpers: CSV / download / table render
function toCsv(rows) {
  if (!rows || !rows.length) return '';
  const header = ['Date','Product','Price'];
  const lines = [header.join(',')];
  rows.forEach(r => {
    lines.push(`"${r.date}","${r.product}",${Number(r.price)}`);
  });
  return lines.join('\n');
}
function downloadFile(name, content, mime='text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function renderDataTable(rows) {
  const tbody = document.querySelector('#dataTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  (rows || []).slice().reverse().forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date}</td><td>${r.product}</td><td>${new Intl.NumberFormat('vi-VN').format(r.price)}</td>`;
    tbody.appendChild(tr);
  });
}

initApp();

export default { initApp, selectRange, updateDashboard };
