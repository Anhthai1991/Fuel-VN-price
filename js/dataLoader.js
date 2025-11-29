/** CSV Data Loading & Processing Module */
import { CSV_FILE } from './config.js';


let allData = [];
let filteredData = [];
let currentRange = 'ALL';

// Load CSV using Papa Parse
function loadData() {
  Papa.parse(CSV_FILE, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (results.data && results.data.length > 0) {
        allData = results.data.map(row => ({
          date: row['Ngày'] || row['Date'],
          product: row['Mặt hàng'] || row['Product'],
          price: parseFloat(row['Giá (VND)'] || row['Price'])
        })).filter(d => d.date && d.product && !isNaN(d.price));
        
        if (allData.length > 0) {
          document.getElementById('totalRecords').textContent = `${allData.length} entries`;
          document.getElementById('loadingMessage').style.display = 'none';
          document.getElementById('dashboardContent').style.display = 'block';
          getLastDate();
          selectRange('ALL');
        } else {
          showError('No valid data found');
        }
      } else {
        showError('Failed to parse CSV');
      }
    },
    error: function(error) {
      showError('Error loading CSV: ' + error.message);
    }
  });
}

// Get last update date
function getLastDate() {
  const sorted = [...allData].sort((a, b) => parseDate(b.date) - parseDate(a.date));
  if (sorted.length > 0) {
    document.getElementById('lastUpdate').textContent = formatDate(sorted[0].date);
  }
}

// Filter by date range
function filterDataByRange(range) {
  if (allData.length === 0) return [];
  const sorted = [...allData].sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const lastDate = parseDate(sorted[sorted.length - 1].date);
  let startDate;
  
  switch(range) {
    case '1M': startDate = new Date(lastDate); startDate.setMonth(startDate.getMonth() - 1); break;
    case '3M': startDate = new Date(lastDate); startDate.setMonth(startDate.getMonth() - 3); break;
    case '6M': startDate = new Date(lastDate); startDate.setMonth(startDate.getMonth() - 6); break;
    case '1Y': startDate = new Date(lastDate); startDate.setFullYear(startDate.getFullYear() - 1); break;
    case '3Y': startDate = new Date(lastDate); startDate.setFullYear(startDate.getFullYear() - 3); break;
    default: return sorted;
  }
  return sorted.filter(d => parseDate(d.date) >= startDate);
}

// Select date range
function selectRange(range) {
  currentRange = range;
  filteredData = filterDataByRange(range);
  document.querySelectorAll('.date-range-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-range') === range) btn.classList.add('active');
  });
  updateDashboard();
}


export default { loadData };

export { loadData };
