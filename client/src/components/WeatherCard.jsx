import React from 'react';
import { Cloud, Droplets, Wind, Eye } from 'lucide-react';

export default function WeatherCard({ weather }) {
  const iconUrl = weather.icon && weather.icon.startsWith('http')
    ? weather.icon
    : `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

  return (
    <div className="bg-gradient-to-br from-sky-400 via-cyan-400 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">{weather.city}{weather.country ? `, ${weather.country}` : ''}</h2>
          <p className="text-lg capitalize opacity-90">{weather.description}</p>
        </div>
        <div className="text-6xl">
          {weather.icon ? (
            <img
              src={iconUrl}
              alt="weather"
              className="w-20 h-20 drop-shadow-lg"
            />
          ) : (
            <Cloud className="w-20 h-20" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Temperature */}
        <div className="bg-white/20 backdrop-blur rounded-lg p-4">
          <p className="text-sm opacity-80 mb-2">Temperature</p>
          <p className="text-3xl font-bold">{Math.round(weather.temp)}°C</p>
        </div>

        {/* Feels Like */}
        <div className="bg-white/20 backdrop-blur rounded-lg p-4">
          <p className="text-sm opacity-80 mb-2">Feels Like</p>
          <p className="text-3xl font-bold">{Math.round(weather.feelsLike)}°C</p>
        </div>

        {/* Humidity */}
        <div className="bg-white/20 backdrop-blur rounded-lg p-4 flex flex-col items-center justify-center">
          <Droplets className="w-6 h-6 mb-2" />
          <p className="text-2xl font-bold">{weather.humidity}%</p>
        </div>
      </div>

      {(weather.windSpeed !== undefined || weather.visibility !== undefined || weather.source) && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {weather.windSpeed !== undefined && (
            <div className="bg-white/15 backdrop-blur rounded-lg p-3 flex items-center gap-2">
              <Wind className="w-4 h-4" />
              <span>{weather.windSpeed} m/s wind</span>
            </div>
          )}
          {weather.visibility !== undefined && (
            <div className="bg-white/15 backdrop-blur rounded-lg p-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{weather.visibility} km visibility</span>
            </div>
          )}
          {weather.source && (
            <div className="bg-white/15 backdrop-blur rounded-lg p-3 flex items-center gap-2 md:col-span-1">
              <span>Source: {weather.source}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
