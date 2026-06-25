import React from 'react';

export default function ItineraryTimeline({ itinerary }) {
  return (
    <div className="space-y-8">
      {itinerary.map((dayItem, idx) => (
        <div key={idx} className="relative">
          {/* Timeline Line */}
          {idx < itinerary.length - 1 && (
            <div className="absolute left-4 top-16 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-cyan-400" />
          )}

          {/* Day Marker */}
          <div className="flex gap-6 items-start">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg z-10 relative">
                {dayItem.day}
              </div>
            </div>

            {/* Day Content */}
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Day {dayItem.day}</h3>

              {/* Morning */}
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-l-4 border-yellow-400">
                <p className="text-sm font-semibold text-yellow-800 mb-2">🌅 Morning</p>
                <p className="text-gray-800">{dayItem.morning}</p>
              </div>

              {/* Afternoon */}
              <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 border-l-4 border-orange-400">
                <p className="text-sm font-semibold text-orange-800 mb-2">☀️ Afternoon</p>
                <p className="text-gray-800">{dayItem.afternoon}</p>
              </div>

              {/* Evening */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 border-l-4 border-purple-400">
                <p className="text-sm font-semibold text-purple-800 mb-2">🌙 Evening</p>
                <p className="text-gray-800">{dayItem.evening}</p>
              </div>

              {/* Places */}
              {dayItem.places && dayItem.places.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">📍 Places to Visit</p>
                  <div className="flex flex-wrap gap-2">
                    {dayItem.places.map((place, placeIdx) => (
                      <span
                        key={placeIdx}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
