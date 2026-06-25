import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plane, Cloud, Compass, Heart, Users, Backpack, Map } from 'lucide-react';
import axios from 'axios';
import DestinationCard from '../components/DestinationCard';

const fallbackTrendingDestinations = [
  {
    name: 'Goa',
    state: 'Goa',
    bestSeason: 'Nov - Feb',
    tripCount: 0,
    latestSeason: 'Live',
    avgBudget: 0,
  },
  {
    name: 'Manali',
    state: 'Himachal Pradesh',
    bestSeason: 'Oct - Jun',
    tripCount: 0,
    latestSeason: 'Live',
    avgBudget: 0,
  },
  {
    name: 'Kerala',
    state: 'Kerala',
    bestSeason: 'Sep - Mar',
    tripCount: 0,
    latestSeason: 'Live',
    avgBudget: 0,
  },
];

const fallbackGradients = [
  'from-cyan-400 to-blue-500',
  'from-blue-400 to-indigo-600',
  'from-green-400 to-teal-500',
];

export default function Home() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [trendingDestinations, setTrendingDestinations] = useState([]);
  const [destinationError, setDestinationError] = useState('');
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/destinations/trending');
        setTrendingDestinations(response.data.destinations || []);
      } catch (error) {
        setDestinationError(error.response?.data?.message || error.message || 'Failed to load live destinations');
      } finally {
        setLoadingDestinations(false);
      }
    };

    loadDestinations();
  }, []);

  const handleSearch = () => {
    if (destination.trim()) {
      navigate(`/planner?destination=${encodeURIComponent(destination)}`);
    }
  };

  const moods = [
    { emoji: '🏔️', label: 'Adventure' },
    { emoji: '🏖️', label: 'Relaxing' },
    { emoji: '💕', label: 'Romantic' },
    { emoji: '🎒', label: 'Solo' },
  ];

  const features = [
    {
      icon: <Plane className="w-12 h-12" />,
      title: 'AI Itinerary',
      description: 'Get personalized day-by-day plans',
    },
    {
      icon: <Cloud className="w-12 h-12" />,
      title: 'Live Weather',
      description: 'Real-time weather updates',
    },
    {
      icon: <Compass className="w-12 h-12" />,
      title: 'Hotel Finder',
      description: 'Best deals on accommodations',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-sky-900 via-blue-800 to-cyan-700 text-white overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 particle"
              style={{
                width: Math.random() * 100 + 50 + 'px',
                height: Math.random() * 100 + 50 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center min-h-screen">
          <h1 className="text-6xl md:text-7xl font-bold text-center mb-6 drop-shadow-lg">
            Explore the World with AI 🌍
          </h1>
          <p className="text-2xl md:text-3xl text-center mb-12 text-blue-100 drop-shadow">
            Tell us your destination. We'll plan the perfect trip.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl">
            <div className="flex gap-2 bg-white/20 backdrop-blur-lg rounded-full p-2 border border-white/30">
              <input
                type="text"
                placeholder="Enter destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-6 py-3 bg-white/10 text-white placeholder-white/60 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-full transition-all duration-300 flex items-center gap-2 hover:shadow-lg"
              >
                <MapPin className="w-5 h-5" />
                Plan My Trip
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">
            Trending Destinations
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Explore the most popular destinations loved by travelers
          </p>

          {loadingDestinations ? (
            <div className="text-center text-gray-500">Loading live destinations...</div>
          ) : trendingDestinations.length === 0 ? (
            <div className="space-y-4">
              {fallbackTrendingDestinations.map((dest, idx) => (
                <DestinationCard
                  key={dest.name}
                  destination={dest}
                  color={fallbackGradients[idx % fallbackGradients.length]}
                />
              ))}
              {destinationError && (
                <div className="text-center text-sm text-gray-500">{destinationError}</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingDestinations.map((dest, idx) => (
                <DestinationCard
                  key={dest.name}
                  destination={dest}
                  color={[
                    'from-yellow-400 to-orange-500',
                    'from-blue-400 to-cyan-500',
                    'from-green-400 to-emerald-500',
                    'from-purple-400 to-pink-500',
                    'from-rose-400 to-orange-500',
                    'from-amber-400 to-yellow-500',
                  ][idx % 6]}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Travel Mood Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Choose Your Travel Mood
          </h2>

          <div className="flex flex-wrap justify-center gap-6">
            {moods.map((mood, idx) => (
              <div
                key={idx}
                className="px-8 py-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full text-white font-semibold text-lg hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
              >
                <span className="text-2xl mr-3">{mood.emoji}</span>
                {mood.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Why Choose TripAI?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-8 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl text-center border border-blue-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-center mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">✈️ TripAI</h3>
          <p className="text-gray-400 mb-6">
            Powered by AI. Crafted for travelers.
          </p>
          <div className="flex justify-center gap-6 mb-8">
            <a href="#" className="hover:text-blue-400 transition-colors">Facebook</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Instagram</a>
          </div>
          <p className="text-gray-500">© 2024 TripAI. All rights reserved.</p>
        </div>
      </section>
    </div>
  );
}
