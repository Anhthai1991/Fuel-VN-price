/** CSV Data Loading & Processing Module */
import { CSV_FILE } from './config.js';
import { showError } from './ui.js';

let allData = [];
let filteredData = [];
let currentRange = 'ALL';

// Load CSV using Papa Parse
function loadData() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_FILE, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.data && results.data.length > 0) {
          allData = results.data
            .map(row => ({
              date: row['Ngày'] || row['Date'],
              product: row['Mặt hàng'] || row['Product'],
              price: parseFloat(row['Giá (VND)'] || row['Price'])
            }))
            .filter(d => d.date && d.product && !isNaN(d.price));

          if (allData.length > 0) {
            const totalEl = document.getElementById('totalRecords');
            const loadingEl = document.getElementById('loadingMessage');
            const dashEl = document.getElementById('dashboardContent');

            if (totalEl) totalEl.textContent = `${allData.length} entries`;
            if (loadingEl) loadingEl.style.display = 'none';
            if (dashEl) dashEl.style.display = 'block';

            getLastDate();
            selectRange('ALL');
            resolve(allData);
            return;
          } else {
            showError('No valid data found');
            reject('No valid data found');
            return;
          }
        } else {
          showError('Failed to parse CSV');
          reject('Failed to parse CSV');
          return;
        }
      },
      error: function(error) {
        showError('Error loading CSV: ' + (error && error.message ? error.message : error));
        reject(error);
      }
    });
  });
}

// Helper functions for date parsing and formatting
function parseDate(dateStr) {
  if (!dateStr) return new Date(0);
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    // parts: [DD, MM, YYYY] -> construct ISO YYYY-MM-DD
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date(dateStr);
}

function formatDate(dateStr) {
  const date = parseDate(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Get last update date
function getLastDate() {
  if (!allData || allData.length === 0) return;
  const sorted = [...allData].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  if (sorted.length > 0) {
    const lastEl = document.getElementById('last-update');
    if (lastEl) lastEl.textContent = formatDate(sorted[0].date);
  }
}

// Filter by date range
// Filter by date range — now pure: accepts data array + range
function filterDataByRange(data, range) {
  if (!data || data.length === 0) return [];
  const sorted = [...data].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const lastDate = parseDate(sorted[sorted.length - 1].date);
  let startDate;

  switch (range) {
    case '1M':
      startDate = new Date(lastDate);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3M':
      startDate = new Date(lastDate);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6M':
      startDate = new Date(lastDate);
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1Y':
      startDate = new Date(lastDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '3Y':
      startDate = new Date(lastDate);
      startDate.setFullYear(startDate.getFullYear() - 3);
      break;
    default:
      return sorted;
  }

  return sorted.filter(d => parseDate(d.date) >= startDate);
}


// Select date range
function selectRange(range) {
  currentRange = range;
  filteredData = filterDataByRange(range);

  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-range') === range) btn.classList.add('active');
  });

  // updateDashboard should be defined elsewhere
  if (typeof updateDashboard === 'function') {
    updateDashboard();
  } else {
    // safe fallback for debugging
    console.warn('updateDashboard() not found — make sure it is defined and imported where needed.');
  }
}

export { loadData, selectRange, filterDataByRange, getLastDate, formatDate, parseDate };
export default { loadData };

