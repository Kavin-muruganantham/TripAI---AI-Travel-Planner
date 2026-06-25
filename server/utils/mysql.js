const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const dataDir = path.join(__dirname, '..', 'data');
const localUsersPath = path.join(dataDir, 'auth-users.json');
const localTripsPath = path.join(dataDir, 'trips.json');

let pool = null;
let initialized = false;

const hasMySqlConfig = () => Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);

const getBaseConnectionConfig = () => ({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const getPool = () => {
  if (!hasMySqlConfig()) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      ...getBaseConnectionConfig(),
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  return pool;
};

const toJson = (value) => (value == null ? null : JSON.stringify(value));

const fromJson = (value, fallback) => {
  if (value == null || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return new Date();
  }

  return new Date(value);
};

const readJsonFile = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

async function query(sql, params = []) {
  const db = getPool();
  if (!db) {
    throw new Error('MySQL configuration is missing.');
  }

  const [rows] = await db.execute(sql, params);
  return rows;
}

async function findOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function initializeDatabase() {
  if (!hasMySqlConfig()) {
    throw new Error('MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE are required');
  }

  if (initialized) {
    return true;
  }

  const baseConfig = getBaseConnectionConfig();
  const databaseName = process.env.MYSQL_DATABASE;
  const bootstrapConnection = await mysql.createConnection(baseConfig);

  try {
    await bootstrapConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await bootstrapConnection.end();
  }

  pool = null;
  const db = getPool();
  const connection = await db.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        destination VARCHAR(255) NOT NULL,
        budget INT NOT NULL,
        days INT NOT NULL,
        travel_type VARCHAR(50) NOT NULL,
        mood VARCHAR(100) NOT NULL,
        season VARCHAR(50) NULL,
        budget_breakdown LONGTEXT NULL,
        itinerary LONGTEXT NULL,
        hotels LONGTEXT NULL,
        weather LONGTEXT NULL,
        attractions LONGTEXT NULL,
        local_food LONGTEXT NULL,
        packing_tips LONGTEXT NULL,
        important_notes LONGTEXT NULL,
        tips LONGTEXT NULL,
        estimated_cost VARCHAR(100) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_trips_user_created (user_id, created_at),
        CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    const [userCountRows] = await connection.query('SELECT COUNT(*) AS count FROM users');
    const [tripCountRows] = await connection.query('SELECT COUNT(*) AS count FROM trips');
    const userCount = userCountRows[0];
    const tripCount = tripCountRows[0];

    if ((userCount?.count || 0) === 0) {
      const localUsers = await readJsonFile(localUsersPath);
      for (const user of localUsers) {
        await connection.query(
          'INSERT INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
          [
            user.id,
            user.name,
            user.email.toLowerCase().trim(),
            user.password,
            formatDateTime(user.createdAt),
          ]
        );
      }
    }

    if ((tripCount?.count || 0) === 0) {
      const localTrips = await readJsonFile(localTripsPath);
      for (const trip of localTrips) {
        await connection.query(
          `INSERT INTO trips (
            id, user_id, start_date, end_date, destination, budget, days, travel_type, mood, season,
            budget_breakdown, itinerary, hotels, weather, attractions, local_food, packing_tips,
            important_notes, tips, estimated_cost, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
          [
            trip.id,
            trip.userId,
            trip.startDate ? new Date(trip.startDate) : null,
            trip.endDate ? new Date(trip.endDate) : null,
            trip.destination,
            Number(trip.budget) || 0,
            Number(trip.days) || 0,
            trip.travelType,
            trip.mood,
            trip.season || null,
            toJson(trip.budgetBreakdown || {}),
            toJson(trip.itinerary || []),
            toJson(trip.hotels || []),
            toJson(trip.weather || {}),
            toJson(trip.attractions || []),
            toJson(trip.localFood || []),
            toJson(trip.packingTips || []),
            toJson(trip.importantNotes || []),
            toJson(trip.tips || []),
            trip.estimatedCost || null,
            formatDateTime(trip.createdAt),
          ]
        );
      }
    }

    initialized = true;
    return true;
  } finally {
    connection.release();
  }
}

async function getStatus() {
  if (!hasMySqlConfig()) {
    return { connected: false, database: process.env.MYSQL_DATABASE || null, error: 'MySQL config missing' };
  }

  try {
    const rows = await query('SELECT 1 AS ok');
    return {
      connected: Boolean(rows?.[0]?.ok === 1),
      database: process.env.MYSQL_DATABASE,
      host: process.env.MYSQL_HOST,
    };
  } catch (error) {
    return {
      connected: false,
      database: process.env.MYSQL_DATABASE || null,
      host: process.env.MYSQL_HOST || null,
      error: error.message,
    };
  }
}

async function getTrendingTripStats() {
  if (!hasMySqlConfig()) {
    return [];
  }

  const rows = await query(
    `SELECT
      destination AS name,
      COUNT(*) AS tripCount,
      AVG(budget) AS avgBudget,
      MAX(created_at) AS latestTripDate,
      MAX(season) AS latestSeason
     FROM trips
     GROUP BY destination
     ORDER BY tripCount DESC, latestTripDate DESC`
  );

  return rows.map((row) => ({
    name: row.name,
    tripCount: Number(row.tripCount),
    avgBudget: row.avgBudget !== null ? Number(row.avgBudget) : null,
    latestTripDate: row.latestTripDate ? new Date(row.latestTripDate).toISOString() : null,
    latestSeason: row.latestSeason || null,
  }));
}

module.exports = {
  query,
  findOne,
  initializeDatabase,
  getStatus,
  getTrendingTripStats,
  toJson,
  fromJson,
};