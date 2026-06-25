const axios = require('axios');

const getWeather = async (req, res) => {
  try {
    const { city } = req.params;

    if (!process.env.OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY is missing from .env file');
    }

    if (!city) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }

    console.log('🌤️ Fetching weather for:', city);

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);

    console.log('✅ OpenWeather API responded for:', city);
    console.log('🌡️ Temperature:', response.data.main.temp, '°C');
    console.log('☁️ Condition:', response.data.weather[0].description);

    const weatherData = {
      city: response.data.name,
      country: response.data.sys.country,
      temp: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
      windSpeed: response.data.wind.speed,
      visibility: response.data.visibility / 1000,
      source: 'OpenWeatherMap API - Live Data',
    };

    res.json({ success: true, weather: weatherData });
  } catch (err) {
    console.error('❌ Weather API failed:', err.message);

    if (err.response?.status === 401) {
      return res.status(401).json({ success: false, message: 'Invalid OpenWeather API key' });
    }

    if (err.response?.status === 404) {
      return res.status(404).json({ success: false, message: `City "${req.params.city}" not found` });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWeather };
