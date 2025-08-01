const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const { MongoClient } = require('mongodb');
const socketIo = require('socket.io');

const simulator = require('./simulator');
const collector = require('./dataCollector');
const settings = require('./settings');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'brew_scada';
let db;

// Session for login
app.use(session({
  secret: 'scada-secret',
  resave: false,
  saveUninitialized: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Connect to Mongo
MongoClient.connect(mongoUrl).then(client => {
  db = client.db(dbName);
  console.log('Connected to MongoDB');
  // Initialize collections if needed
  ['recipes', 'settings', 'brew_cycles'].forEach(col => {
    db.collection(col);
  });
  // Start simulator and collector
  simulator.start(io, db);
  collector.start(io, db);
}).catch(err => console.error(err));

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === 'brewmaster') {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Middleware to protect routes
app.use('/api', (req, res, next) => {
  if (req.session.authenticated) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

// API endpoints
app.get('/api/recipes', async (req, res) => {
  const recipes = await db.collection('recipes').find().toArray();
  res.json(recipes);
});

app.post('/api/recipes', async (req, res) => {
  const recipe = req.body;
  await db.collection('recipes').insertOne(recipe);
  res.json({ success: true });
});

app.get('/api/brew_cycles', async (req, res) => {
  const cycles = await db.collection('brew_cycles').find().sort({ start: -1 }).toArray();
  res.json(cycles);
});

// Serve index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));