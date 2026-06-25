const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('../server/routes/auth');
const tripRoutes = require('../server/routes/trip');
const weatherRoutes = require('../server/routes/weather');
const destinationRoutes = require('../server/routes/destinations');
const chatRoutes = require('../server/routes/chat');

const app = express();

app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ server: '✅ Running', status: 'ok' });
});

module.exports = serverless(app);
module.exports.handler = serverless(app);
