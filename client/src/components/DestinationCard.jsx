import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DestinationCard({ destination, color }) {
  const navigate = useNavigate();
  const tripCount = destination.tripCount || 0;
  const avgBudget = destination.avgBudget ? Math.round(destination.avgBudget) : null;

  return (
    <div
      className={`group relative bg-gradient-to-br ${color} rounded-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl`}
      onClick={() => navigate(`/planner?destination=${encodeURIComponent(destination.name)}`)}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />

      {/* Content */}
      <div className="relative p-8 h-64 flex flex-col justify-between">
        <div>
          <h3 className="text-4xl font-bold text-white drop-shadow-lg mb-2">{destination.name}</h3>
          <p className="text-white/90 text-lg drop-shadow">
            {tripCount} live trip{tripCount === 1 ? '' : 's'} planned
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-white">
            <span className="font-semibold">Latest season</span>
            <span className="font-bold capitalize">{destination.latestSeason || 'Live'}</span>
          </div>

          {avgBudget !== null && (
            <div className="flex items-center justify-between text-white">
              <span className="font-semibold">Avg. budget</span>
              <span className="font-bold">₹{avgBudget.toLocaleString()}</span>
            </div>
          )}

          {/* Button */}
          <button className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg backdrop-blur transition-all duration-300 border border-white/30 hover:border-white/50">
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}
