const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { randomUUID } = require('crypto');
const { saveTrip, findTripsByUser } = require('../utils/tripStore');
const { analyzeItinerary } = require('../utils/foundryClient');

const { generateWithRetry } = require('../utils/geminiClient');

// In-memory map to prevent duplicate concurrent trip generation per user
const generationInProgress = new Map();

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split('T')[0];
};

const getSeason = (startDateValue, endDateValue) => {
  const startMonth = new Date(startDateValue).getMonth();
  const endMonth = new Date(endDateValue).getMonth();
  const peakMonths = [9, 10, 11, 0, 1];

  if (peakMonths.includes(startMonth) || peakMonths.includes(endMonth)) {
    return 'peak';
  }

  if ([2, 3, 8].includes(startMonth) || [2, 3, 8].includes(endMonth)) {
    return 'shoulder';
  }

  return 'off-peak';
};

const buildPrompt = ({ destination, budget, totalDays, travelType, mood, startDate, endDate }) => `You are an expert Indian travel planner with deep knowledge of every city, town, and tourist destination in India.
Create a highly detailed and UNIQUE ${totalDays}-day trip itinerary for ${destination}, India.
- Tour Start Date: ${startDate}
- Tour End Date: ${endDate}
- Budget: ₹${budget} total for the entire trip
- Travel Type: ${travelType}
- Travel Mood: ${mood}
STRICT RULES:
1. Every single day MUST have completely DIFFERENT activities, places, and experiences - NO repetition
2. Use REAL, SPECIFIC place names that actually exist in ${destination}
3. Morning/Afternoon/Evening plans must be UNIQUE per day and suited to the travel mood (${mood})
4. Hotels must be REAL hotels that exist in ${destination} with realistic pricing based on the travel dates and season
5. Account for seasonal pricing: if dates are in peak season (Oct-Feb for most Indian cities), hotel rates will be higher
6. Budget ₹${budget} must be distributed realistically across hotels, food, transport, and entry fees
Return ONLY this valid JSON (no markdown, no code blocks, no extra text):
{
  "destination": "${destination}",
  "startDate": "${startDate}",
  "endDate": "${endDate}",
  "totalDays": ${totalDays},
  "travelMood": "${mood}",
  "travelType": "${travelType}",
  "estimatedCost": "₹XXXX",
  "budgetBreakdown": {
    "hotels": "₹XXXX",
    "food": "₹XXXX",
    "transport": "₹XXXX",
    "activities": "₹XXXX"
  },
  "season": "peak/off-peak/shoulder",
  "bestTimeToVisit": "reason based on the given dates",
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Unique theme for this day e.g. Heritage & History",
      "morning": "Specific detailed activity with real place name and why it suits ${mood} mood",
      "afternoon": "Specific detailed activity with real place name - completely different from morning",
      "evening": "Specific detailed activity with real place name - completely different from morning/afternoon",
      "places": ["Real Place 1", "Real Place 2", "Real Place 3"],
      "meals": {"breakfast": "specific local restaurant/cafe", "lunch": "specific local restaurant", "dinner": "specific local restaurant"},
      "transport": "how to get around that day",
      "estimatedDailyCost": "₹XXXX"
    }
  ],
  "hotels": [
    {
      "name": "Real Hotel Name that exists in ${destination}",
      "area": "specific area/locality in ${destination}",
      "pricePerNight": "₹XXXX (based on ${startDate} to ${endDate} season)",
      "totalCost": "₹XXXX for ${totalDays} nights",
      "rating": 4.2,
      "category": "Budget/Mid-range/Luxury",
      "amenities": ["WiFi", "AC", "Breakfast Included"],
      "whyRecommended": "reason this hotel suits the trip"
    }
  ],
  "attractions": ["Real Attraction 1 in ${destination}", "Real Attraction 2", "Real Attraction 3", "Real Attraction 4", "Real Attraction 5"],
  "localFood": ["must-try dish 1", "must-try dish 2", "must-try dish 3"],
  "packingTips": ["tip based on season and dates", "tip 2"],
  "importantNotes": ["note about visiting ${destination} during these dates"]
}`;

exports.generateTrip = async (req, res) => {
  try {
    console.log('🤖 Calling Gemini AI API...');
    console.log('📍 Destination:', req.body.destination);
    console.log('📅 Dates:', req.body.startDate, 'to', req.body.endDate);
    console.log('Generate trip request body:', req.body);
    console.log('Generate trip user:', req.user);

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing from .env file');
    }

    const { destination, budget, days, travelType, mood, startDate, endDate } = req.body;
    const userId = req.user.userId;

    const normalizedStartDate = formatDate(startDate);
    const normalizedEndDate = formatDate(endDate);

    if (!destination || !budget || !travelType || !mood || !normalizedStartDate || !normalizedEndDate) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const start = new Date(normalizedStartDate);
    const end = new Date(normalizedEndDate);
    const dayDiff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || dayDiff <= 0) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const totalDays = Number(days) || dayDiff;
    const season = getSeason(start, end);

    const requestId = randomUUID();

    // Prevent duplicate concurrent generation for the same user
    if (generationInProgress.has(userId)) {
      console.warn(`⛔ Duplicate generation request blocked for user ${userId}`);
      return res.status(429).json({ success: false, message: 'Trip generation already in progress for this account. Please wait.' });
    }
    generationInProgress.set(userId, requestId);

    const prompt = buildPrompt({
      destination,
      budget,
      totalDays,
      travelType,
      mood,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    });
    console.log('📍 Destination:', destination);
    console.log('📅 Dates:', normalizedStartDate, 'to', normalizedEndDate);
    console.log(`🧾 [${requestId}] Prompt length: ${prompt.length} characters`);

    let result;
    try {
      result = await generateWithRetry(process.env.GEMINI_API_KEY, 'gemini-2.5-flash', prompt, { maxRetries: 5, requestId });
    } catch (genErr) {
      console.error('❌ Gemini generation final error:', genErr.message);
      generationInProgress.delete(userId);
      if (genErr.isQuota || genErr.status === 429) {
        return res.status(429).json({ success: false, message: 'Gemini API quota temporarily exceeded. Please wait 30 seconds and try again.' });
      }
      return res.status(500).json({ success: false, message: 'Failed to generate itinerary. Please try again later.' });
    }

    const text = result.response.text();
    console.log(`📝 [${requestId}] Raw Gemini response length: ${text.length} characters`);

    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    let tripData;

    try {
      tripData = JSON.parse(cleaned);
      console.log('✅ Gemini JSON parsed successfully');
      console.log('📊 Itinerary days received:', tripData.itinerary?.length);
      console.log('🏨 Hotels received:', tripData.hotels?.length);
    } catch (parseErr) {
      console.error('❌ Gemini JSON parse failed:', parseErr.message);
      console.error('Raw response:', text.substring(0, 500));
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    if (!tripData?.itinerary || !tripData?.hotels || !tripData?.attractions) {
      throw new Error('AI response is missing required trip fields. Please try again.');
    }

    let weatherData = {};
    try {
      if (process.env.OPENWEATHER_API_KEY) {
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)},IN&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );
        weatherData = {
          city: weatherResponse.data.name,
          country: weatherResponse.data.sys.country,
          temp: Math.round(weatherResponse.data.main.temp),
          feelsLike: Math.round(weatherResponse.data.main.feels_like),
          humidity: weatherResponse.data.main.humidity,
          description: weatherResponse.data.weather[0].description,
          icon: `https://openweathermap.org/img/wn/${weatherResponse.data.weather[0].icon}@2x.png`,
          windSpeed: weatherResponse.data.wind.speed,
          visibility: weatherResponse.data.visibility / 1000,
          source: 'OpenWeatherMap API - Live Data',
        };
        console.log('✅ OpenWeather API responded for:', destination);
        console.log('🌡️ Temperature:', weatherData.temp, '°C');
      }
    } catch (weatherError) {
      console.error('❌ Weather API error:', weatherError.message);
    }

    const tripRecord = {
      id: randomUUID(),
      userId,
      startDate: new Date(normalizedStartDate).toISOString(),
      endDate: new Date(normalizedEndDate).toISOString(),
      destination,
      budget: Number(budget),
      days: Number(totalDays),
      travelType,
      mood,
      season: tripData.season || season,
      budgetBreakdown: tripData.budgetBreakdown || {},
      itinerary: tripData.itinerary,
      hotels: tripData.hotels,
      weather: weatherData,
      attractions: tripData.attractions,
      localFood: tripData.localFood,
      packingTips: tripData.packingTips,
      importantNotes: tripData.importantNotes,
      tips: tripData.tips,
      advisory: null,
      estimatedCost: tripData.estimatedCost,
      createdAt: new Date().toISOString(),
    };
    // Attempt Foundry advisory analysis (non-blocking for trip saving) 
    try {
      console.log('🔎 Sending itinerary to Foundry AI for advisory analysis...');
      const advisory = await analyzeItinerary(tripData.itinerary, {
        destination,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        budget,
      });
      tripRecord.advisory = advisory;
      // Also attach advisory into tips for persistence compatibility
      tripRecord.tips = tripRecord.tips || [];
      tripRecord.tips = Array.isArray(tripRecord.tips) ? tripRecord.tips : [String(tripRecord.tips || '')];
      tripRecord.tips.push({ advisoryGeneratedAt: new Date().toISOString(), advisorySummary: advisory });
      console.log('✅ Foundry advisory received:', advisory.riskLevel);
    } catch (adErr) {
      console.error('❌ Foundry advisory failed (non-fatal):', adErr.message);
    }

    const savedTrip = await saveTrip(tripRecord);
    console.log('✅ Trip saved to MySQL with ID:', savedTrip.id);
    console.log('📋 Trip data saved:', {
      destination: savedTrip.destination,
      days: savedTrip.days,
      userId: savedTrip.userId,
      createdAt: savedTrip.createdAt,
    });

    // Clear in-progress flag for this user
    generationInProgress.delete(userId);

    res.status(200).json({
      success: true,
      trip: tripData,
      advisory: tripRecord.advisory || null,
      source: 'mysql',
    });
  } catch (err) {
    console.error('❌ Trip generation failed:', err.message);
    // Clear in-progress if set
    try { if (typeof userId !== 'undefined' && generationInProgress.has(userId)) generationInProgress.delete(userId); } catch(e) {}
    
    // Check if it's a Gemini API service unavailability error
    const isGeminiUnavailable = err.message?.includes('503') || err.message?.includes('Service Unavailable');
    const statusCode = isGeminiUnavailable ? 503 : 500;
    const errorMsg = isGeminiUnavailable ? 
      'AI service is temporarily unavailable due to high demand. Please try again in a few moments.' : 
      err.message;
    
    res.status(statusCode).json({ success: false, message: errorMsg });
  }
};

exports.getTripHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const trips = await findTripsByUser(userId);

    res.status(200).json({
      message: 'Trips retrieved successfully',
      trips,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve trips', error: error.message });
  }
};
