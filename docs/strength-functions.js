// Element symbols for parsing
const ELEMENTS = [
    '', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
    'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
    'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
    'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
    'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
    'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
    'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
    'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
    'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
    'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
    'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds'
];

// Available nuclei - extracted from strength_functions directory
const NUCLEI = [
    'Ac256', 'Ac295', 'Ag131', 'Am247', 'Am249', 'Am255', 'Am260', 'Am304', 'Am313',
    'As102', 'As112', 'At220', 'At227', 'At253', 'Au213', 'Au215', 'Bi218', 'Bi226',
    'Bk255', 'Br88', 'Cd123', 'Cf261', 'Cf269', 'Cf317', 'Cr57', 'Cu69', 'Cu78',
    'Db319', 'Ds369', 'Dy171', 'Er179', 'Es275', 'Es280', 'Es282', 'Es285', 'Es306',
    'Eu160', 'Eu164', 'Eu184', 'Fe60', 'Fe61', 'Fe62', 'Fe63', 'Fe64', 'Fm325',
    'Fr236', 'Ga87', 'Gd167', 'Gd201', 'Hg211', 'Ho185', 'Hs335', 'In153', 'Ir240',
    'Lr300', 'Lr329', 'Lu184', 'Lu188', 'Lu193', 'Md289', 'Mn60', 'Mt299', 'Nb98',
    'Ni69', 'Ni73', 'Ni77', 'Np244', 'Np256', 'Os203', 'Pa274', 'Pr151', 'Pr153',
    'Pt229', 'Pu271', 'Pu291', 'Ra239', 'Rb90', 'Re202', 'Re221', 'Rh113', 'Rh135',
    'Rn235', 'Sb132', 'Se103', 'Se113', 'Ta193', 'Tb170', 'Tc105', 'Tc141', 'Th243',
    'Th247', 'Th297', 'Tl216', 'Tl220', 'Tm200', 'Tm220', 'Xe139', 'Xe171', 'Yb211',
    'Zn99', '_U249', '_U297', '_V53', '_W233', '_Y109'
];

let selectedNucleus = null;
let chart = null;
let loadedData = {};

function parseNucleus(name) {
    // Handle special cases with underscore
    if (name.startsWith('_')) {
        const match = name.match(/_([A-Z][a-z]?)(\d+)/);
        if (match) {
            const element = match[1];
            const A = parseInt(match[2]);
            const Z = ELEMENTS.indexOf(element);
            return { element, A, Z, N: A - Z, name };
        }
    }
    
    // Normal case: Element followed by mass number
    const match = name.match(/([A-Z][a-z]?)(\d+)/);
    if (match) {
        const element = match[1];
        const A = parseInt(match[2]);
        const Z = ELEMENTS.indexOf(element);
        return { element, A, Z, N: A - Z, name };
    }
    return null;
}

function displayNuclei() {
    const grid = document.getElementById('nucleusGrid');
    grid.innerHTML = '';
    
    for (let nucleus of NUCLEI) {
        const button = document.createElement('div');
        button.className = 'nucleus-button';
        button.textContent = nucleus.replace('_', '');
        button.onclick = () => selectNucleus(nucleus);
        grid.appendChild(button);
    }
}

function filterNuclei() {
    const search = document.getElementById('searchNucleus').value.toLowerCase();
    const buttons = document.querySelectorAll('.nucleus-button');
    
    buttons.forEach(button => {
        const nucleus = button.textContent;
        const info = parseNucleus(nucleus);
        
        let matches = true;
        if (search) {
            // Check if search matches nucleus name
            if (nucleus.toLowerCase().includes(search)) {
                matches = true;
            }
            // Check if search is Z=number
            else if (search.startsWith('z=') && info) {
                const targetZ = parseInt(search.substring(2));
                matches = info.Z === targetZ;
            }
            // Check if search is N=number
            else if (search.startsWith('n=') && info) {
                const targetN = parseInt(search.substring(2));
                matches = info.N === targetN;
            }
            // Check if search matches element symbol
            else if (info && info.element.toLowerCase().includes(search)) {
                matches = true;
            }
            else {
                matches = false;
            }
        }
        
        button.style.display = matches ? 'block' : 'none';
    });
}

function selectNucleus(nucleus) {
    selectedNucleus = nucleus;
    
    // Update button states
    document.querySelectorAll('.nucleus-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Show plot section
    document.getElementById('plotSection').style.display = 'block';
    
    // Update nucleus info
    const info = parseNucleus(nucleus);
    const infoDiv = document.getElementById('nucleusInfo');
    if (info) {
        infoDiv.innerHTML = `
            <strong>Selected Nucleus:</strong> <sup>${info.A}</sup>${info.element}
            (Z = ${info.Z}, N = ${info.N}, A = ${info.A})
        `;
    } else {
        infoDiv.innerHTML = `<strong>Selected Nucleus:</strong> ${nucleus}`;
    }
    
    // Update download links
    updateDownloadLinks();
    
    // Load and plot data
    updatePlot();
}

function updateDownloadLinks() {
    const buttonsDiv = document.getElementById('downloadButtons');
    buttonsDiv.innerHTML = '';
    
    const modes = ['GAMTGAMT', 'NSDRNSDR'];
    const components = ['K0', 'K1', 'Total'];
    
    for (let mode of modes) {
        for (let comp of components) {
            const filename = `${selectedNucleus}_DDPCX_${mode}_${comp}.txt`;
            const button = document.createElement('a');
            button.href = `../data/strength_functions/${filename}`;
            button.className = 'button button-secondary';
            button.textContent = `${mode === 'GAMTGAMT' ? 'GT' : 'FF'} ${comp}`;
            button.style.fontSize = '0.85rem';
            button.style.padding = '0.5rem 1rem';
            button.download = filename;
            buttonsDiv.appendChild(button);
        }
    }
}

async function loadStrengthData(nucleus, mode, component) {
    const filename = `../data/strength_functions/${nucleus}_DDPCX_${mode}_${component}.txt`;
    const cacheKey = `${nucleus}_${mode}_${component}`;
    
    // Return cached data if available
    if (loadedData[cacheKey]) {
        return loadedData[cacheKey];
    }
    
    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error(`File not found: ${filename}`);
        
        const text = await response.text();
        const lines = text.split('\n');
        
        const data = [];
        for (let line of lines) {
            if (line.startsWith('#') || line.trim() === '') continue;
            
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
                const energy = parseFloat(parts[0]);
                const strength = parseFloat(parts[1]);
                data.push({ energy, strength });
            }
        }
        
        loadedData[cacheKey] = data;
        return data;
        
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return null;
    }
}

async function updatePlot() {
    if (!selectedNucleus) return;
    
    const mode = document.getElementById('modeSelect').value;
    const component = document.getElementById('componentSelect').value;
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    
    try {
        const datasets = [];
        
        if (component === 'All') {
            // Load all three components
            const k0Data = await loadStrengthData(selectedNucleus, mode, 'K0');
            const k1Data = await loadStrengthData(selectedNucleus, mode, 'K1');
            const totalData = await loadStrengthData(selectedNucleus, mode, 'Total');
            
            if (k0Data) {
                datasets.push({
                    label: 'K = 0',
                    data: k0Data.map(d => ({ x: d.energy, y: d.strength })),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderWidth: 2,
                    pointRadius: 0
                });
            }
            
            if (k1Data) {
                datasets.push({
                    label: 'K = 1',
                    data: k1Data.map(d => ({ x: d.energy, y: d.strength })),
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderWidth: 2,
                    pointRadius: 0
                });
            }
            
            if (totalData) {
                datasets.push({
                    label: 'Total (K₀ + 2K₁)',
                    data: totalData.map(d => ({ x: d.energy, y: d.strength })),
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 3,
                    pointRadius: 0
                });
            }
        } else {
            // Load single component
            const data = await loadStrengthData(selectedNucleus, mode, component);
            if (data) {
                let label = component;
                if (component === 'K0') label = 'K = 0';
                else if (component === 'K1') label = 'K = 1';
                else if (component === 'Total') label = 'Total (K₀ + 2K₁)';
                
                datasets.push({
                    label: label,
                    data: data.map(d => ({ x: d.energy, y: d.strength })),
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                });
            }
        }
        
        if (datasets.length === 0) {
            throw new Error('No data could be loaded');
        }
        
        renderChart(datasets, mode);
        
    } catch (error) {
        document.getElementById('error').textContent = `Error: ${error.message}`;
        document.getElementById('error').style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function renderChart(datasets, mode) {
    const canvas = document.getElementById('strengthChart');
    const ctx = canvas.getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    const modeLabel = mode === 'GAMTGAMT' ? 'Gamow-Teller (GT)' : 'First-Forbidden (FF)';
    const info = parseNucleus(selectedNucleus);
    const nucleusLabel = info ? `<sup>${info.A}</sup>${info.element}` : selectedNucleus;
    
    chart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: `${modeLabel} Strength Function for ${selectedNucleus.replace('_', '')}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toExponential(3)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Excitation Energy E [MeV]'
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Strength S(E)'
                    }
                }
            }
        }
    });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    displayNuclei();
});
