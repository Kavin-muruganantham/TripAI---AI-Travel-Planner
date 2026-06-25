const { getTrendingTripStats } = require('../utils/mysql');

exports.getTrendingDestinations = async (req, res) => {
  try {
    const destinations = await getTrendingTripStats();

    res.status(200).json({
      success: true,
      destinations,
    });
  } catch (error) {
    console.error('❌ Failed to load trending destinations:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
