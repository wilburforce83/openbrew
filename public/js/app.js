document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  const loginForm = document.getElementById('loginForm');
  const loginScreen = document.getElementById('login-screen');
  const mainUI = document.getElementById('main-ui');
  const content = document.getElementById('content');

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const pwd = document.getElementById('password').value;
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    });
    const json = await res.json();
    if (json.success) {
      loginScreen.classList.add('uk-hidden');
      mainUI.classList.remove('uk-hidden');
      loadView('scada');
    } else {
      document.getElementById('loginError').classList.remove('uk-hidden');
    }
  });

  document.getElementById('navButtons').addEventListener('click', e => {
    if (e.target.dataset.view) {
      loadView(e.target.dataset.view);
    }
  });

  let chart;
  function loadView(view) {
    content.innerHTML = '';
    if (view === 'scada') {
      content.innerHTML = `
        <div class="uk-grid uk-grid-small">
          <div class="uk-width-1-3">
            <div class="uk-card uk-card-default uk-card-body">
              <div>Fermenter SVG here</div>
            </div>
          </div>
          <div class="uk-width-1-3">
            <div class="uk-card uk-card-default uk-card-body">
              <div>Kettle SVG here</div>
            </div>
          </div>
          <div class="uk-width-1-3">
            <div class="uk-card uk-card-primary uk-card-body">
              <ul class="uk-list uk-list-divider" id="readingsList"></ul>
            </div>
          </div>
        </div>
        <canvas id="trendChart" height="100"></canvas>
      `;
      initSCADA();
    }
    // TODO: settings, setpoints, recipes, history
  }

  function initSCADA() {
    const list = document.getElementById('readingsList');
    const ctx = document.getElementById('trendChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
    socket.on('reading', r => {
      // Update list
      list.innerHTML = `
        <li>Temp: ${r.temp.toFixed(2)} °C</li>
        <li>Ambient: ${r.ambient.toFixed(2)} °C</li>
        <li>SG: ${r.sg.toFixed(4)}</li>
        <li>pH: ${r.pH.toFixed(2)}</li>
        <li>Pressure: ${r.pressure.toFixed(2)} bar</li>
        <li>Bubbles/min: ${r.bubbles}</li>
        <li>Heating: ${r.heating}</li>
        <li>Cooling: ${r.cooling}</li>
      `;
      // Update chart
      const time = new Date(r.timestamp).toLocaleTimeString();
      if (chart.data.labels.length > 50) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(ds => ds.data.shift());
      }
      if (!chart.data.datasets.length) {
        chart.data.datasets.push(
          { label: 'Temp', data: [], borderColor: 'cyan', yAxisID: 'y1' },
          { label: 'SG', data: [], borderColor: 'lime', yAxisID: 'y2' }
        );
        chart.options.scales = {
          y1: { type: 'linear', position: 'left' },
          y2: { type: 'linear', position: 'right' }
        };
      }
      chart.data.labels.push(time);
      chart.data.datasets[0].data.push(r.temp);
      chart.data.datasets[1].data.push(r.sg);
      chart.update();
    });
  }
});