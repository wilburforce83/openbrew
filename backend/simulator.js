const settings = require('./settings');

// Simulation parameters
let cycleStart = Date.now();
let initialSG = 1.050;

function start(io, db) {
  settings.load(db).then(cfg => {
    setInterval(() => {
      const now = Date.now();
      const elapsed = (now - cycleStart) / 1000;
      // Simulate temperature: diurnal cycle around 20±3°C
      const ambient = 20 + 3 * Math.sin(elapsed / 3600 * Math.PI);
      const temp = 20 + 2 * Math.sin(elapsed / 1800);
      // SG drop: logistic or exponential decay
      const sg = initialSG - (initialSG - 1.010) * (1 - Math.exp(-elapsed / 86400));
      // pH: slight drift 4.5±0.1
      const pH = 4.5 + 0.1 * Math.sin(elapsed / 7200);
      // Pressure proxy for SG: bar
      const pressure = 1 + (initialSG - sg) * 2;
      // Bubbles: pulses per minute, peak mid-fermentation
      const phase = Math.min(elapsed / 86400, 1);
      const bubbles = Math.round(phase * 60 * Math.exp(-phase*3));
      // Relays
      const heating = temp < cfg.temp_setpoint_low;
      const cooling = temp > cfg.temp_setpoint_high;
      const reading = { 
        timestamp: new Date(),
        temp, ambient, sg, pH, pressure, bubbles, heating, cooling
      };
      // Emit and store
      io.emit('reading', reading);
    }, 5000);
  });
}

module.exports = { start };