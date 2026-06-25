import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Filter, Loader2, MapPin, RefreshCw, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categoryGradients = {
  Beach: 'from-cyan-400 to-blue-500',
  Mountains: 'from-blue-400 to-indigo-600',
  Heritage: 'from-orange-400 to-red-500',
  Nature: 'from-green-400 to-teal-500',
  'Hill Station': 'from-purple-400 to-pink-500',
  Adventure: 'from-yellow-400 to-orange-500',
  City: 'from-gray-400 to-slate-600',
  Temple: 'from-amber-400 to-rose-500',
  Wildlife: 'from-lime-400 to-emerald-600',
};

export default function Destinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const loadDestinations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get('http://localhost:5000/api/destinations');
      setDestinations(response.data.destinations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Network error while loading destinations. Please retry.');
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  const filteredDestinations = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    return destinations.filter((destination) => {
      const matchesSearch =
        !searchTerm ||
        destination.name.toLowerCase().includes(searchTerm) ||
        destination.state.toLowerCase().includes(searchTerm) ||
        destination.category.toLowerCase().includes(searchTerm);

      const matchesFilter = activeFilter === 'All' || destination.category === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [destinations, query, activeFilter]);

  const filters = useMemo(() => {
    const uniqueCategories = Array.from(new Set(destinations.map((destination) => destination.category))).sort();

    return ['All', ...uniqueCategories];
  }, [destinations]);

  const renderStars = (rating) => {
    const fullStars = Math.round(rating);

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${index < fullStars ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-white">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.45),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef7ff_100%)] pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
            <MapPin className="h-4 w-4" /> Live destinations
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">India Tourist Places</h1>
          <p className="mt-4 text-lg text-slate-600">
            Browse the major tourist spots across India, with a dedicated set of Tamil Nadu highlights.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-blue-100/40 backdrop-blur">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by destination, state, or category"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={loadDestinations}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Load
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              <Filter className="h-4 w-4" /> Filter
            </span>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">Showing {filteredDestinations.length} destinations</p>
          {!loading && !error && destinations.length > 0 && (
            <p className="text-sm text-slate-500">{destinations.length} total loaded from the API</p>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/70 bg-white/80 shadow-lg backdrop-blur">
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading destinations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl shadow-red-100">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Unable to load destinations</h2>
            <p className="mt-3 text-slate-600">{error}</p>
            <button
              type="button"
              onClick={loadDestinations}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-lg backdrop-blur">
            <h2 className="text-2xl font-bold text-slate-900">No destinations found</h2>
            <p className="mt-3 text-slate-600">Try a different search term or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDestinations.map((destination) => {
              const gradient = categoryGradients[destination.category] || 'from-slate-400 to-slate-600';

              return (
                <article
                  key={destination.id}
                  className={`group relative overflow-hidden rounded-[28px] bg-gradient-to-br ${gradient} p-[1px] shadow-2xl shadow-slate-200 transition hover:-translate-y-1`}
                >
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[27px] bg-slate-950/20 p-6 text-white backdrop-blur-sm">
                    <div className="absolute inset-0 bg-black/15 transition group-hover:bg-black/10" />
                    <div className="relative flex h-full flex-col">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90">
                            {destination.category}
                          </span>
                          <h2 className="mt-3 text-3xl font-black leading-tight">{destination.name}</h2>
                          <p className="mt-1 text-sm font-medium text-white/85">{destination.state}</p>
                        </div>
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white/90">
                          {destination.bestSeason}
                        </span>
                      </div>

                      <p className="mb-5 text-sm leading-6 text-white/90">{destination.description}</p>

                      <div className="mb-5">{renderStars(destination.rating)}</div>

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold text-white/95">
                          Best season: {destination.bestSeason}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/planner?destination=${encodeURIComponent(destination.name)}`)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-blue-50"
                        >
                          Plan Trip
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
