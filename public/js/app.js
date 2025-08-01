document.addEventListener('DOMContentLoaded', () => {
  console.log('Frontend starting…');
  const socket = io();
  const loginScreen = document.getElementById('login-screen');
  const mainUI       = document.getElementById('main-ui');
  const loginForm    = document.getElementById('loginForm');
  const loginError   = document.getElementById('loginError');
  const content      = document.getElementById('content');

  // LOGIN
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const pwd = document.getElementById('password').value;
    const res = await fetch('/api/login', {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({password:pwd})
    });
    const { success } = await res.json();
    if (success) {
      loginScreen.classList.add('uk-hidden');
      mainUI.classList.remove('uk-hidden');
      loadView('scada');
    } else {
      loginError.classList.remove('uk-hidden');
    }
  });

  // NAVIGATION
  document.getElementById('navButtons').addEventListener('click', e => {
    if (e.target.dataset.view) loadView(e.target.dataset.view);
  });

  // LOAD VIEWS
  function loadView(view) {
    content.innerHTML = '';
    if (view === 'scada') {
      content.innerHTML = `
        <div class="uk-grid-match uk-child-width-1-3@m" uk-grid>
          <div><div class="uk-card uk-card-default uk-card-body uk-height-medium">
            <p class="uk-text-center">Fermenter</p><svg id="fermenterSvg" width="100%" height="150px"></svg>
          </div></div>
          <div><div class="uk-card uk-card-default uk-card-body uk-height-medium">
            <p class="uk-text-center">Kettle</p><svg id="kettleSvg" width="100%" height="150px"></svg>
          </div></div>
          <div><div class="uk-card uk-card-primary uk-card-body uk-height-medium uk-overflow-auto">
            <ul class="uk-list uk-list-divider" id="readingsList"></ul>
          </div></div>
        </div>
        <div class="uk-margin-top"><canvas id="trendChart" height="150"></canvas></div>
      `;
      initSCADA();
    }
    // TODO: other views
  }

  // SCADA INIT
  function initSCADA() {
    const listEl = document.getElementById('readingsList');
    const ctx    = document.getElementById('trendChart').getContext('2d');
    const chart  = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        animation: false,
        responsive: true,
        scales: {
          y1:{type:'linear',position:'left',title:{display:true,text:'Temp (°C)'}},
          y2:{type:'linear',position:'right',title:{display:true,text:'SG'}}
        }
      }
    });

    socket.on('reading', r => {
      console.log('Reading:', r);
      listEl.innerHTML = `
        <li>Temp: ${r.temp.toFixed(2)} °C</li>
        <li>Ambient: ${r.ambient.toFixed(2)} °C</li>
        <li>SG: ${r.sg.toFixed(4)}</li>
        <li>pH: ${r.pH.toFixed(2)}</li>
        <li>Pressure: ${r.pressure.toFixed(2)} bar</li>
        <li>Bubbles/min: ${r.bubbles}</li>
        <li>Heating: ${r.heating}</li>
        <li>Cooling: ${r.cooling}</li>
      `;

      const t = new Date(r.timestamp).toLocaleTimeString();
      if (chart.data.labels.length > 100) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(ds => ds.data.shift());
      }
      if (!chart.data.datasets.length) {
        chart.data.datasets.push(
          {label:'Temp',data:[],borderColor:'cyan',yAxisID:'y1'},
          {label:'SG',data:[],borderColor:'lime',yAxisID:'y2'}
        );
      }
      chart.data.labels.push(t);
      chart.data.datasets.find(ds=>ds.label==='Temp').data.push(r.temp);
      chart.data.datasets.find(ds=>ds.label==='SG').data.push(r.sg);
      chart.update();
    });
  }
});
