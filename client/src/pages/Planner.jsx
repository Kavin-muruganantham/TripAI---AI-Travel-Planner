import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MapPin, DollarSign, Calendar, Users, Smile, Loader, Save, Utensils, Package, Fuel, Sparkles, Star, Building2 } from 'lucide-react';
import WeatherCard from '../components/WeatherCard';
import TravelRiskAdvisor from '../components/TravelRiskAdvisor';

const formatDateLabel = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDayLabel = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const addDays = (dateString, numberOfDays) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + numberOfDays);
  return date.toISOString().split('T')[0];
};

export default function Planner() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [advisoryData, setAdvisoryData] = useState(null);
  const [savedTrip, setSavedTrip] = useState(false);
  const [formError, setFormError] = useState('');
  const [errorToRetry, setErrorToRetry] = useState(null);

  const [formData, setFormData] = useState({
    destination: searchParams.get('destination') || '',
    budget: 30000,
    days: 3,
    travelType: 'Solo',
    mood: 'Adventure',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const today = getTodayString();
    const defaultStart = formData.startDate || today;
    const defaultEnd = formData.endDate || addDays(defaultStart, 1);

    if (!formData.startDate) {
      setFormData((prev) => ({ ...prev, startDate: today, endDate: addDays(today, 1), days: 1 }));
      return;
    }

    if (formData.startDate && !formData.endDate) {
      setFormData((prev) => ({ ...prev, endDate: addDays(prev.startDate, 1), days: 1 }));
      return;
    }

    if (defaultStart && defaultEnd && formData.startDate && formData.endDate) {
      const diff = Math.ceil((new Date(defaultEnd).getTime() - new Date(defaultStart).getTime()) / 86400000);
      if (diff > 0 && diff !== formData.days) {
        setFormData((prev) => ({ ...prev, days: diff }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormError('');

    if (name === 'startDate') {
      const nextEndDate = formData.endDate && new Date(formData.endDate) > new Date(value) ? formData.endDate : addDays(value, 1);
      const diff = nextEndDate ? Math.ceil((new Date(nextEndDate).getTime() - new Date(value).getTime()) / 86400000) : 0;
      setFormData((prev) => ({
        ...prev,
        startDate: value,
        endDate: nextEndDate,
        days: diff > 0 ? diff : 1,
      }));
      return;
    }

    if (name === 'endDate') {
      const diff = Math.ceil((new Date(value).getTime() - new Date(formData.startDate).getTime()) / 86400000);
      setFormData((prev) => ({
        ...prev,
        endDate: value,
        days: diff > 0 ? diff : 1,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateTrip = async (e) => {
    e.preventDefault?.();
    if (loading) return; // prevent duplicate submissions
    if (!formData.destination.trim()) {
      alert('Please enter a destination');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setFormError('Please select both a start date and an end date.');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('End date must be after start date.');
      return;
    }

    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token') || token;
    if (!storedToken) {
      alert('Please log in to generate a trip');
      return;
    }

    setLoading(true);
    setSavedTrip(false);
    setFormError('');
    setErrorToRetry(null);
    
    try {
      const requestId = `g-${Date.now()}`;
      console.log(`[${requestId}] Sending trip generation request`);
      const response = await axios.post(`${API_BASE}/trip/generate`, {
        destination: formData.destination,
        budget: formData.budget,
        days: formData.days,
        travelType: formData.travelType,
        mood: formData.mood,
        startDate: formData.startDate,
        endDate: formData.endDate,
      }, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      console.log('Trip generation response data:', response.data);
      setTripData(response.data.trip);
      setAdvisoryData(response.data.advisory || null);

      const weatherResponse = await axios.get(`${API_BASE}/weather/${encodeURIComponent(formData.destination)}`);
      console.log('Weather response data:', weatherResponse.data);
      setWeatherData(weatherResponse.data.weather);
    } catch (error) {
      console.error('Error generating trip:', error);
      
      const isServiceUnavailable = 
        error.response?.status === 503 || 
        error.message?.includes('503') ||
        error.response?.data?.message?.includes('503') ||
        error.response?.data?.message?.includes('Service Unavailable') ||
        error.response?.data?.message?.includes('temporarily');
      
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to generate trip. Please try again.';
      
      if (isServiceUnavailable) {
        setErrorToRetry({
          message: 'AI service is temporarily busy. Retrying automatically...',
          originalError: errorMsg,
        });
        // Auto-retry after 3 seconds (if not already loading)
        setTimeout(() => {
          handleGenerateTrip({ preventDefault: () => {} });
        }, 3000);
      } else {
        setFormError(errorMsg);
        alert(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    setSavedTrip(true);
    // Trip is already saved via the generateTrip endpoint
    setTimeout(() => {
      alert('Trip saved successfully!');
      setSavedTrip(false);
    }, 1000);
  };

  const tripDates = useMemo(() => {
    return {
      start: formatDateLabel(formData.startDate),
      end: formatDateLabel(formData.endDate),
    };
  }, [formData.startDate, formData.endDate]);

  const budgetBreakdown = tripData?.budgetBreakdown || {
    hotels: '₹0',
    food: '₹0',
    transport: '₹0',
    activities: '₹0',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold text-center mb-2 text-gray-900">Plan Your Perfect Trip</h1>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Customize your journey with our AI-powered planner
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 sticky top-24 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Trip Details</h2>

              <form onSubmit={handleGenerateTrip} className="space-y-6">
                {/* Destination */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Destination
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="e.g., Paris, Tokyo, Goa"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Budget: ₹{formData.budget.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    name="budget"
                    min="5000"
                    max="500000"
                    step="5000"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>₹5K</span>
                    <span>₹500K</span>
                  </div>
                </div>

                {/* Days */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Tour Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    min={getTodayString()}
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Tour End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    min={formData.startDate ? addDays(formData.startDate, 1) : addDays(getTodayString(), 1)}
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Days */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Number of Days: {formData.days}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          days: Math.max(1, prev.days - 1),
                        }))
                      }
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      name="days"
                      min="1"
                      max="14"
                      value={formData.days}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          days: Math.min(14, prev.days + 1),
                        }))
                      }
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Travel Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Travel Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Solo', 'Couple', 'Family', 'Group'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, travelType: type }))}
                        className={`py-2 px-3 rounded-lg font-semibold transition-all duration-300 ${
                          formData.travelType === type
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Smile className="w-4 h-4 inline mr-2" />
                    Travel Mood
                  </label>
                  <select
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option>Adventure</option>
                    <option>Relaxing</option>
                    <option>Romantic</option>
                    <option>Solo Backpacker</option>
                    <option>Cultural</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Planning Your Trip...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Generate AI Trip
                    </>
                  )}
                </button>
                {errorToRetry && (
                  <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <strong>{errorToRetry.message}</strong>
                    </div>
                    <p className="text-xs text-amber-700 ml-6">{errorToRetry.originalError}</p>
                  </div>
                )}
                {formError && (
                  <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
                    {formError}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right: Results Panel */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white/95 backdrop-blur rounded-2xl p-16 text-center shadow-xl">
                <Loader className="w-16 h-16 animate-spin mx-auto mb-6 text-blue-500" />
                <p className="text-xl font-semibold text-gray-700">
                  AI is planning your perfect trip...
                </p>
              </div>
            ) : tripData ? (
              <div className="space-y-6">
                <div className="flex gap-2 flex-wrap mb-4">
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                    🤖 AI: Gemini 2.5 Flash
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                    🌤️ Weather: OpenWeatherMap Live
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">
                    💾 Saved to: MySQL Database
                  </span>
                </div>

                <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl border border-blue-100">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Trip Overview</p>
                      <h2 className="text-3xl font-bold text-gray-900 mt-2">{tripData.destination || formData.destination}</h2>
                      <p className="text-gray-600 mt-2">
                        Start: {tripDates.start} → End: {tripDates.end} | {tripData.totalDays || formData.days} days
                      </p>
                      {tripData.bestTimeToVisit && (
                        <p className="mt-2 text-gray-700">{tripData.bestTimeToVisit}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 md:items-end">
                      {tripData.season && (
                        <span className="inline-flex w-fit px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-bold capitalize">
                          {tripData.season} season
                        </span>
                      )}
                      {tripData.estimatedCost && (
                        <span className="inline-flex w-fit px-4 py-2 rounded-full bg-green-100 text-green-800 font-bold">
                          Estimated: {tripData.estimatedCost}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Weather Card */}
                {weatherData && <WeatherCard weather={weatherData} />}

                {tripData.budgetBreakdown && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Budget Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Hotels', icon: <Building2 className="w-5 h-5" />, value: tripData.budgetBreakdown.hotels || budgetBreakdown.hotels },
                        { label: 'Food', icon: <Utensils className="w-5 h-5" />, value: tripData.budgetBreakdown.food || budgetBreakdown.food },
                        { label: 'Transport', icon: <Fuel className="w-5 h-5" />, value: tripData.budgetBreakdown.transport || budgetBreakdown.transport },
                        { label: 'Activities', icon: <Sparkles className="w-5 h-5" />, value: tripData.budgetBreakdown.activities || budgetBreakdown.activities },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itinerary Timeline */}
                {tripData.itinerary && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Your Itinerary</h2>
                    <div className="space-y-8">
                      {tripData.itinerary.map((dayItem) => (
                        <div key={dayItem.day} className="border border-blue-100 rounded-2xl p-6 bg-white">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">
                                Day {dayItem.day} — {dayItem.date ? formatDayLabel(dayItem.date) : ''} — {dayItem.theme}
                              </h3>
                            </div>
                            {dayItem.estimatedDailyCost && (
                              <span className="inline-flex w-fit px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                                {dayItem.estimatedDailyCost} daily cost
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4">
                              <p className="font-semibold text-amber-800 mb-2">🌅 Morning</p>
                              <p className="text-gray-800">{dayItem.morning}</p>
                            </div>
                            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl p-4">
                              <p className="font-semibold text-orange-800 mb-2">☀️ Afternoon</p>
                              <p className="text-gray-800">{dayItem.afternoon}</p>
                            </div>
                            <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-xl p-4">
                              <p className="font-semibold text-indigo-800 mb-2">🌙 Evening</p>
                              <p className="text-gray-800">{dayItem.evening}</p>
                            </div>
                          </div>

                          {dayItem.places && dayItem.places.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Places</p>
                              <div className="flex flex-wrap gap-2">
                                {dayItem.places.map((place) => (
                                  <span key={place} className="px-3 py-1 rounded-full bg-blue-500 text-white text-sm font-semibold">
                                    {place}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {dayItem.meals && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-500 mb-1">🍳 Breakfast</p>
                                <p className="text-gray-800">{dayItem.meals.breakfast}</p>
                              </div>
                              <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-500 mb-1">🍽️ Lunch</p>
                                <p className="text-gray-800">{dayItem.meals.lunch}</p>
                              </div>
                              <div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-500 mb-1">🌙 Dinner</p>
                                <p className="text-gray-800">{dayItem.meals.dinner}</p>
                              </div>
                            </div>
                          )}

                          {dayItem.transport && (
                            <p className="mt-4 text-sm text-gray-700">
                              <span className="font-semibold">Transport:</span> {dayItem.transport}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotels */}
                {tripData.hotels && tripData.hotels.length > 0 && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Recommended Hotels</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {tripData.hotels.map((hotel) => (
                        <div key={hotel.name} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">{hotel.name}</h3>
                              <p className="text-gray-600">{hotel.area}</p>
                            </div>
                            {hotel.category && (
                              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">
                                {hotel.category}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-1 text-yellow-500">
                            {[...Array(5)].map((_, index) => (
                              <Star key={index} className={`w-4 h-4 ${index < Math.floor(hotel.rating || 0) ? 'fill-current' : ''}`} />
                            ))}
                            <span className="ml-2 text-gray-700 font-semibold">{hotel.rating}</span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                              {hotel.pricePerNight || hotel.price}
                            </span>
                            {hotel.totalCost && (
                              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
                                {hotel.totalCost}
                              </span>
                            )}
                          </div>

                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {hotel.amenities.map((amenity) => (
                                <span key={amenity} className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}

                          {hotel.whyRecommended && (
                            <p className="mt-4 text-gray-700">{hotel.whyRecommended}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attractions */}
                {tripData.attractions && tripData.attractions.length > 0 && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Top Attractions</h2>
                    <div className="flex flex-wrap gap-3">
                      {tripData.attractions.map((attraction, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-full text-sm font-semibold"
                        >
                          {attraction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Local Food */}
                {tripData.localFood && tripData.localFood.length > 0 && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Local Food</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {tripData.localFood.map((dish) => (
                        <div key={dish} className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <p className="font-semibold text-orange-800">{dish}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Packing Tips */}
                {tripData.packingTips && tripData.packingTips.length > 0 && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Packing Tips</h2>
                    <ul className="space-y-3">
                      {tripData.packingTips.map((tip) => (
                        <li key={tip} className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-blue-500 mt-1" />
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Important Notes */}
                {tripData.importantNotes && tripData.importantNotes.length > 0 && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Important Notes</h2>
                    <ul className="space-y-3">
                      {tripData.importantNotes.map((note) => (
                        <li key={note} className="flex items-start gap-3">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-700">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {tripData.tips && tripData.tips.length > 0 && (
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-8 shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900">Travel Tips</h2>
                    <ul className="space-y-3">
                      {tripData.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-2xl">💡</span>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Foundry Advisory */}
                {advisoryData ? (
                  <TravelRiskAdvisor advisory={advisoryData} />
                ) : (
                  // If no advisory returned, show a small notice
                  tripData && (
                    <div className="mt-6 text-sm text-gray-500">Travel advisory not available for this itinerary.</div>
                  )
                )}

                {/* Estimated Cost */}
                {tripData.estimatedCost && (
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-8 text-white shadow-xl">
                    <p className="text-lg font-semibold mb-2">Estimated Total Cost</p>
                    <p className="text-4xl font-bold">{tripData.estimatedCost}</p>
                  </div>
                )}

                {/* Save Trip Button */}
                <button
                  onClick={handleSaveTrip}
                  disabled={savedTrip}
                  className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  {savedTrip ? 'Trip Saved!' : 'Save This Trip'}
                </button>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur rounded-2xl p-16 text-center shadow-xl">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-gray-500">
                  Fill in the form and click "Generate AI Trip" to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
