
const express = require('express');
const { MongoClient } = require('mongodb');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'brew_scada';
let db;

const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Connect to Mongo
MongoClient.connect(mongoUrl)
    .then(client => {
        db = client.db(dbName);
        console.log('Connected to MongoDB');
        startMockDataGenerator();
    })
    .catch(err => console.error('MongoDB connection failed', err));

// API endpoint to fetch latest readings
app.get('/api/readings/latest', async (req, res) => {
    try {
        const latest = await db.collection('readings').find().sort({timestamp: -1}).limit(1).toArray();
        res.json(latest[0] || {});
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest readings' });
    }
});

// API endpoint to fetch historical data
app.get('/api/readings/history', async (req, res) => {
    try {
        const history = await db.collection('readings').find().sort({timestamp: 1}).toArray();
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected');
});

// Mock data generator (simulates ADS1115 + SG)
function startMockDataGenerator() {
    setInterval(async () => {
        const now = new Date();
        const last = await db.collection('readings').find().sort({timestamp: -1}).limit(1).toArray();
        const lastSG = last[0]?.sg || 1.050;
        const newSG = lastSG > 1.010 ? lastSG - 0.0005 : lastSG;
        const reading = {
            timestamp: now,
            temp: 20 + Math.sin(now.getTime()/60000)*1.5,
            pressure: 1 + Math.random()*0.05,
            sg: parseFloat(newSG.toFixed(4))
        };
        await db.collection('readings').insertOne(reading);
        io.emit('reading', reading);
    }, 5000);
}

server.listen(PORT, () => console.log(`Brew SCADA server running on port ${PORT}`));
