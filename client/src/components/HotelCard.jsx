import React from 'react';
import { Star } from 'lucide-react';

export default function HotelCard({ hotel }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
      {/* Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-orange-400 via-pink-400 to-red-400 relative overflow-hidden flex items-end justify-start p-4">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">{hotel.name}</h3>
          <p className="text-white/80 text-sm">{hotel.image}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < Math.floor(hotel.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
          <span className="text-gray-700 font-semibold ml-2">{hotel.rating}</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
            {hotel.price}
          </span>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Amenities</p>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities && hotel.amenities.map((amenity, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Button */}
        <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-lg transition-all duration-300">
          View Details
        </button>
      </div>
    </div>
  );
}
