import React, { useState, useEffect } from 'react';
import { Plane, Calendar, Search, Filter, ShieldCheck, ArrowRight, Clock } from 'lucide-react';

export default function HeroSearch({ onSearch, selectedAirport, setSelectedAirport }) {
  const [airports, setAirports] = useState([]);
  const [fromDate, setFromDate] = useState('2026-11-05');
  const [toDate, setToDate] = useState('2026-11-12');
  const [parkingType, setParkingType] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    fetch('/api/airports')
      .then((res) => res.json())
      .then((data) => {
        setAirports(data.airports || []);
      })
      .catch((err) => console.error('Failed to load airports', err));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch({
      airport: selectedAirport,
      fromDate,
      toDate,
      type: parkingType,
      sortBy
    });
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-950/60 border border-sky-800/80 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Plane className="w-3.5 h-3.5" />
          <span>Save up to 70% vs Airport Gate Rates</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
          Compare Airport Parking <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">&</span> Private Transfers
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Pre-book verified Park & Ride, VIP Meet & Greet, On-Airport Long Stay, and executive private hire chauffeur transfers across the UK & North America.
        </p>
      </div>

      {/* Search Filter Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative z-10 bg-slate-950/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl max-w-5xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Airport Select */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Departure Airport
            </label>
            <div className="relative">
              <select
                value={selectedAirport}
                onChange={(e) => setSelectedAirport(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              >
                {airports.map((ap) => (
                  <option key={ap.code} value={ap.code}>
                    {ap.city} - {ap.name} ({ap.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop-off Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Drop-off Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Pick-up Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Pick-up Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search Available Lots</span>
            </button>
          </div>
        </div>

        {/* Filter & Sort Chips Row */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Parking Type Quick Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase text-[10px] mr-1">Filter:</span>
            {[
              { id: 'all', label: 'All Lots' },
              { id: 'park_and_ride', label: 'Park & Ride' },
              { id: 'meet_and_greet', label: 'Meet & Greet / Valet' },
              { id: 'on_site', label: 'On-Airport Long Stay' },
              { id: 'park_sleep_fly', label: 'Hotel + Parking' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setParkingType(f.id);
                  onSearch({
                    airport: selectedAirport,
                    fromDate,
                    toDate,
                    type: f.id,
                    sortBy
                  });
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  parkingType === f.id
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                onSearch({
                  airport: selectedAirport,
                  fromDate,
                  toDate,
                  type: parkingType,
                  sortBy: e.target.value
                });
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="recommended">Best Value (Recommended)</option>
              <option value="price_asc">Price: Lowest First</option>
              <option value="rating_desc">Highest Customer Rating</option>
              <option value="distance_asc">Nearest to Terminal</option>
              <option value="transfer_time">Shortest Transfer Time</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
