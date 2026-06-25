const { query, findOne, toJson, fromJson } = require('./mysql');

const mapTripRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  startDate: row.start_date ? new Date(row.start_date).toISOString() : null,
  endDate: row.end_date ? new Date(row.end_date).toISOString() : null,
  destination: row.destination,
  budget: Number(row.budget),
  days: Number(row.days),
  travelType: row.travel_type,
  mood: row.mood,
  season: row.season,
  budgetBreakdown: fromJson(row.budget_breakdown, {}),
  itinerary: fromJson(row.itinerary, []),
  hotels: fromJson(row.hotels, []),
  weather: fromJson(row.weather, {}),
  attractions: fromJson(row.attractions, []),
  localFood: fromJson(row.local_food, []),
  packingTips: fromJson(row.packing_tips, []),
  importantNotes: fromJson(row.important_notes, []),
  tips: fromJson(row.tips, []),
  estimatedCost: row.estimated_cost,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
});

async function saveTrip(trip) {
  await query(
    `INSERT INTO trips (
      id, user_id, start_date, end_date, destination, budget, days, travel_type, mood, season,
      budget_breakdown, itinerary, hotels, weather, attractions, local_food, packing_tips,
      important_notes, tips, estimated_cost, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trip.id,
      trip.userId,
      trip.startDate ? new Date(trip.startDate) : null,
      trip.endDate ? new Date(trip.endDate) : null,
      trip.destination,
      trip.budget,
      trip.days,
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
      trip.createdAt ? new Date(trip.createdAt) : new Date(),
    ]
  );

  return trip;
}

async function findTripsByUser(userId) {
  const rows = await query('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(mapTripRow);
}

async function findTripById(tripId) {
  const row = await findOne('SELECT * FROM trips WHERE id = ? LIMIT 1', [tripId]);
  return row ? mapTripRow(row) : null;
}

module.exports = {
  saveTrip,
  findTripsByUser,
  findTripById,
};