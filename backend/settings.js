async function load(db) {
  const cfg = await db.collection('settings').findOne({});
  return cfg || {
    temp_setpoint_low: 18,
    temp_setpoint_high: 22
  };
}

module.exports = { load };