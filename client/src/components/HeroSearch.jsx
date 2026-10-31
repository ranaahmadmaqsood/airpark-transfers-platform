import React, { useState, useEffect } from 'react';
import { getAirports } from '../services/apiClient';
import { Plane, Calendar, Clock, Tag, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

export default function HeroSearch({ onSearch, selectedAirport, setSelectedAirport }) {
  const [airports, setAirports] = useState([]);
  const [fromDate, setFromDate] = useState(() => getFutureDate(7));
  const [fromTime, setFromTime] = useState('10:00');
  const [toDate, setToDate] = useState(() => getFutureDate(14));
  const [toTime, setToTime] = useState('12:00');
  const [promoCode, setPromoCode] = useState('');
  const [parkingType, setParkingType] = useState('all');

  useEffect(() => {
    getAirports()
      .then((data) => {
        const activeList = data || [];
        setAirports(activeList);
        if (activeList.length > 0 && !activeList.some(a => a.code === selectedAirport)) {
          setSelectedAirport(activeList[0].code);
        }
      })
      .catch((err) => console.error('Failed to load airports', err));
  }, []);

  // Generate 15-minute time intervals (00:00, 00:15, 00:30, 00:45, ... 23:45)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      timeOptions.push(`${hh}:${mm}`);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({
      airport: selectedAirport,
      fromDate,
      fromTime,
      toDate,
      toTime,
      promoCode,
      type: parkingType
    });
  };

  return (
    <div className="relative bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Title & Value Proposition */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-[#061F75] text-xs font-extrabold uppercase tracking-wider mb-3">
            <span className="text-sm">🇬🇧</span>
            <span>Stress-Free UK Airport Parking Starts Here</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#061F75] tracking-tight mb-3">
            Compare UK Airport Parking Deals <span className="text-[#C8102E]">&amp; Save Up To 60%</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Find the cheapest secured parking spots at Heathrow, Gatwick, Manchester, Stansted, and all major UK airports. Meet &amp; Greet and Park &amp; Ride available with instant booking confirmation.
          </p>
        </div>

        {/* Competitor Style Quotation Box */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl shadow-blue-900/5 border border-slate-200 relative overflow-hidden"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#061F75] via-[#C8102E] to-[#061F75]" />

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
            {/* 1. Airport Selection */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-[#061F75]" />
                Select Airport
              </label>
              <select
                value={selectedAirport}
                onChange={(e) => setSelectedAirport(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-[#061F75] focus:bg-white rounded-xl px-4 py-3 text-sm font-bold text-[#061F75] outline-none transition-all cursor-pointer shadow-sm"
              >
                {airports.map((ap) => (
                  <option key={ap.code} value={ap.code}>
                    {ap.name} ({ap.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Drop-off Date & Time */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#061F75]" />
                Drop-off (Departure)
              </label>
              <div className="grid grid-cols-5 gap-2">
                <input
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="col-span-3 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-[#061F75] focus:bg-white rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all"
                />
                <select
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="col-span-2 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-[#061F75] focus:bg-white rounded-xl px-2 py-2.5 text-xs font-semibold text-slate-900 outline-none transition-all cursor-pointer"
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Pick-up Date & Time */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#061F75]" />
                Pick-up (Arrival)
              </label>
              <div className="grid grid-cols-5 gap-2">
                <input
                  type="date"
                  required
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="col-span-3 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-[#061F75] focus:bg-white rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all"
                />
                <select
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="col-span-2 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-[#061F75] focus:bg-white rounded-xl px-2 py-2.5 text-xs font-semibold text-slate-900 outline-none transition-all cursor-pointer"
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Controls: Promo Code & Red CTA */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Promo Code Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex items-center w-full sm:w-64">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Promo code (optional)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-300 hover:border-slate-400 focus:border-[#061F75] focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Union Jack Red CTA Button */}
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl bg-[#C8102E] hover:bg-[#A60D25] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-red-700/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
              <span>Get Quote &amp; Compare Deals</span>
            </button>
          </div>
        </form>

        {/* Trust Badges Strip Under Search Box */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Park Mark® Safer Parking Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#061F75]" />
            <span>British Parking Association (BPA) Members</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <span>Free Cancellation Up to 24h Before Travel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
