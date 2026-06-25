require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase, getStatus } = require('./utils/mysql');

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trip');
const weatherRoutes = require('./routes/weather');
const destinationRoutes = require('./routes/destinations');
const chatRoutes = require('./routes/chat');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

initializeDatabase()
  .then(() => {
    console.log('✅ MySQL initialized and ready');
  })
  .catch((error) => {
    console.error('❌ MySQL initialization failed:', error.message);
    console.warn('⚠️ Continuing without MySQL so static routes and health checks can still run.');
    console.warn('ℹ️ Check MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE.');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  const mysqlStatus = await getStatus();
  const status = {
    server: '✅ Running',
    mysql: mysqlStatus.connected ? '✅ Connected' : '❌ Disconnected',
    gemini: process.env.GEMINI_API_KEY ? '✅ API Key Present' : '❌ API Key Missing',
    openweather: process.env.OPENWEATHER_API_KEY ? '✅ API Key Present' : '❌ API Key Missing',
    timestamp: new Date().toISOString(),
  };
  console.log('🏥 Health Check:', status);
  res.json(status);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
