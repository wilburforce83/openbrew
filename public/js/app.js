
const socket = io();
const tempEl = document.getElementById('temp');
const pressureEl = document.getElementById('pressure');
const sgEl = document.getElementById('sg');
const abvEl = document.getElementById('abv');
const elapsedEl = document.getElementById('elapsed');
const timeToCompEl = document.getElementById('timeToComp');

let startTime = null;
let startSG = null;

function calcABV(originalSG, currentSG) {
    return ((originalSG - currentSG) * 131).toFixed(2);
}

async function loadHistory() {
    const res = await fetch('/api/readings/history');
    const data = await res.json();
    if (data.length > 0) {
        startTime = new Date(data[0].timestamp);
        startSG = data[0].sg;
    }
    updateChart(data);
}

function updateChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const labels = data.map(r => new Date(r.timestamp).toLocaleTimeString());
    const tempData = data.map(r => r.temp);
    const pressureData = data.map(r => r.pressure);
    const sgData = data.map(r => r.sg);

    if (window.trendChart) window.trendChart.destroy();
    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Temperature (°C)', data: tempData, borderColor: 'red', yAxisID: 'y1' },
                { label: 'Pressure (bar)', data: pressureData, borderColor: 'blue', yAxisID: 'y1' },
                { label: 'SG', data: sgData, borderColor: 'green', yAxisID: 'y2' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y1: {
                    type: 'linear',
                    position: 'left'
                },
                y2: {
                    type: 'linear',
                    position: 'right'
                }
            }
        }
    });
}

socket.on('reading', (reading) => {
    tempEl.textContent = reading.temp.toFixed(2);
    pressureEl.textContent = reading.pressure.toFixed(2);
    sgEl.textContent = reading.sg.toFixed(4);
    if (startSG) abvEl.textContent = calcABV(startSG, reading.sg);
    if (startTime) {
        const elapsedMs = new Date() - startTime;
        elapsedEl.textContent = (elapsedMs / 3600000).toFixed(1) + " hrs";
    }
    loadHistory();
});

loadHistory();
