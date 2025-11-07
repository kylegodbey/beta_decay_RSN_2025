// Element symbols for Z lookup
const ELEMENTS = [
    '', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', // 0-10
    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca', // 11-20
    'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', // 21-30
    'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr', // 31-40
    'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', // 41-50
    'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', // 51-60
    'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', // 61-70
    'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', // 71-80
    'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', // 81-90
    'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', // 91-100
    'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', // 101-110
    'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og' // 111-118
];

let allData = [];
let filteredData = [];
let currentSort = { column: -1, ascending: true };
let chart = null;

function getElementSymbol(z) {
    return ELEMENTS[z] || '?';
}

function getElementZ(symbol) {
    const sym = symbol.trim();
    return ELEMENTS.findIndex(el => el.toLowerCase() === sym.toLowerCase());
}

async function loadData() {
    const interaction = document.getElementById('interaction').value;
    const filename = `../data/beta_decay/data_${interaction}.txt`;
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('dataSection').style.display = 'none';
    document.getElementById('chartSection').style.display = 'none';
    
    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        
        const text = await response.text();
        const lines = text.split('\n');
        
        allData = [];
        for (let line of lines) {
            // Skip comments and empty lines
            if (line.startsWith('#') || line.trim() === '') continue;
            
            const parts = line.trim().split(/\s+/);
            if (parts.length < 7) continue;
            
            const N = parseInt(parts[0]);
            const Z = parseInt(parts[1]);
            const E_beta = parseFloat(parts[2]);
            const beta2 = parseFloat(parts[3]);
            const Q = parseFloat(parts[4]);
            const HL_log10 = parseFloat(parts[5]);
            const FF_percent = parseFloat(parts[6]);
            
            allData.push({
                N, Z,
                element: getElementSymbol(Z),
                A: N + Z,
                E_beta, beta2, Q, HL_log10, FF_percent
            });
        }
        
        filteredData = [...allData];
        updateStats();
        applyFilters();
        
        document.getElementById('stats').style.display = 'grid';
        document.getElementById('dataSection').style.display = 'block';
        document.getElementById('chartSection').style.display = 'block';
        
        updateChart();
        
    } catch (error) {
        document.getElementById('error').textContent = `Error: ${error.message}`;
        document.getElementById('error').style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function updateStats() {
    const Zs = allData.map(d => d.Z);
    const Ns = allData.map(d => d.N);
    
    document.getElementById('totalNuclei').textContent = allData.length;
    document.getElementById('minZ').textContent = Math.min(...Zs);
    document.getElementById('maxZ').textContent = Math.max(...Zs);
    document.getElementById('minN').textContent = Math.min(...Ns);
    document.getElementById('maxN').textContent = Math.max(...Ns);
}

function applyFilters() {
    const searchZ = document.getElementById('searchZ').value;
    const searchN = document.getElementById('searchN').value;
    const searchElement = document.getElementById('searchElement').value.trim();
    
    filteredData = allData.filter(row => {
        if (searchZ && row.Z !== parseInt(searchZ)) return false;
        if (searchN && row.N !== parseInt(searchN)) return false;
        if (searchElement) {
            const targetZ = getElementZ(searchElement);
            if (targetZ > 0 && row.Z !== targetZ) return false;
            if (targetZ <= 0 && !row.element.toLowerCase().includes(searchElement.toLowerCase())) return false;
        }
        return true;
    });
    
    displayData();
}

function clearFilters() {
    document.getElementById('searchZ').value = '';
    document.getElementById('searchN').value = '';
    document.getElementById('searchElement').value = '';
    filteredData = [...allData];
    displayData();
}

function displayData() {
    const tbody = document.getElementById('dataBody');
    const maxRows = parseInt(document.getElementById('maxRows').value);
    
    tbody.innerHTML = '';
    
    const dataToShow = filteredData.slice(0, maxRows);
    
    for (let row of dataToShow) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.N}</td>
            <td>${row.Z}</td>
            <td>${row.element}</td>
            <td>${row.A}</td>
            <td>${row.E_beta.toFixed(2)}</td>
            <td>${row.beta2.toFixed(6)}</td>
            <td>${row.Q.toFixed(3)}</td>
            <td>${row.HL_log10.toFixed(3)}</td>
            <td>${row.FF_percent.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    }
    
    const pagination = document.getElementById('pagination');
    if (filteredData.length > maxRows) {
        pagination.textContent = `Showing ${dataToShow.length} of ${filteredData.length} nuclei (filtered from ${allData.length} total)`;
    } else {
        pagination.textContent = `Showing all ${filteredData.length} nuclei (filtered from ${allData.length} total)`;
    }
}

function sortTable(columnIndex) {
    const headers = document.querySelectorAll('#dataTable th');
    
    // Remove sort indicators from all headers
    headers.forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Toggle sort direction if clicking same column
    if (currentSort.column === columnIndex) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = columnIndex;
        currentSort.ascending = true;
    }
    
    // Add sort indicator to current header
    const currentHeader = headers[columnIndex];
    currentHeader.classList.add(currentSort.ascending ? 'sort-asc' : 'sort-desc');
    
    // Map column index to data field
    const fields = ['N', 'Z', 'element', 'A', 'E_beta', 'beta2', 'Q', 'HL_log10', 'FF_percent'];
    const field = fields[columnIndex];
    
    filteredData.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        // Handle string comparison for element
        if (field === 'element') {
            return currentSort.ascending ? 
                valA.localeCompare(valB) : 
                valB.localeCompare(valA);
        }
        
        // Numeric comparison
        if (currentSort.ascending) {
            return valA - valB;
        } else {
            return valB - valA;
        }
    });
    
    displayData();
}

function updateChart() {
    const chartType = document.getElementById('chartType').value;
    const canvas = document.getElementById('dataChart');
    const ctx = canvas.getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    let dataPoints, label, yAxisLabel;
    
    // Sample data for visualization - take every 10th point to avoid overcrowding
    const sampledData = filteredData.filter((_, i) => i % 10 === 0);
    
    switch (chartType) {
        case 'halflife':
            dataPoints = sampledData.map(d => ({ x: d.A, y: d.HL_log10 }));
            label = 'log₁₀(T½) [s]';
            yAxisLabel = 'log₁₀(Half-life) [s]';
            break;
        case 'qvalue':
            dataPoints = sampledData.map(d => ({ x: d.A, y: d.Q }));
            label = 'Q-value';
            yAxisLabel = 'Q-value [MeV]';
            break;
        case 'deformation':
            dataPoints = sampledData.map(d => ({ x: d.A, y: d.beta2 }));
            label = 'β₂';
            yAxisLabel = 'Deformation β₂';
            break;
        case 'ff':
            dataPoints = sampledData.map(d => ({ x: d.A, y: d.FF_percent }));
            label = 'FF%';
            yAxisLabel = 'FF Contribution [%]';
            break;
    }
    
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: label,
                data: dataPoints,
                backgroundColor: 'rgba(102, 126, 234, 0.5)',
                borderColor: 'rgba(102, 126, 234, 1)',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `${label} vs Mass Number (sampled data)`
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mass Number A'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            }
        }
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    // Auto-load DD-PCX data by default
    loadData();
});
