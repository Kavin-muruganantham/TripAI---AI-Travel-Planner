const { analyzeItinerary } = require('../utils/foundryClient');

exports.generateAdvisory = async (req, res) => {
  try {
    const { itinerary, destination, startDate, endDate, budget } = req.body;

    if (!itinerary) {
      return res.status(400).json({ success: false, message: 'Itinerary JSON is required' });
    }

    const meta = { destination, startDate, endDate, budget };

    const advisory = await analyzeItinerary(itinerary, meta);

    res.json({ success: true, advisory });
  } catch (err) {
    console.error('❌ Advisory generation failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate advisory', advisory: {
      riskLevel: 'unknown',
      keyAlerts: ['Advisory temporarily unavailable'],
      packingChecklist: [],
      healthPrecautions: [],
      budgetWarnings: [],
      transportWarnings: [],
      recommendations: [],
    }});
  }
};
