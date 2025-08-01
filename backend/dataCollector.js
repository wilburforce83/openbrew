const settings = require('./settings');

function start(io, db) {
  settings.load(db).then(cfg => {
    const brewCol = db.collection('brew_cycles');
    let current;
    // initialize current brew cycle
    current = { start: new Date(), readings: [] };
    brewCol.insertOne(current).then(doc => {
      current._id = doc.insertedId;
    });
    // on each reading
    io.on('connection', (socket) => {
      socket.on('reading', async (r) => {
        current.readings.push(r);
        await brewCol.updateOne({ _id: current._id }, { $set: { readings: current.readings } });
      });
    });
  });
}

module.exports = { start };