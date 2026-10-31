import React from 'react';
import { Plane, Phone, Mail, ShieldCheck, Star, Search, FileText } from 'lucide-react';

export default function Navbar({ onOpenLookup, onAirportQuickSelect, selectedAirport }) {
  const quickAirports = [
    { code: 'LHR', label: 'Heathrow' },
    { code: 'LGW', label: 'Gatwick' },
    { code: 'MAN', label: 'Manchester' },
    { code: 'STN', label: 'Stansted' },
    { code: 'LTN', label: 'Luton' },
    { code: 'BHX', label: 'Birmingham' },
    { code: 'BRS', label: 'Bristol' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Utility Bar (Royal Navy) */}
      <div className="bg-[#061F75] text-white text-xs py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left info */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-sky-200">
              <span className="text-base leading-none">🇬🇧</span> UK Airport Parking Comparison
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-slate-200">
              Save up to 60% on Meet & Greet and Park & Ride
            </span>
          </div>

          {/* Right contact info */}
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <a
              href="tel:03301332989"
              className="flex items-center gap-1.5 font-bold text-white hover:text-amber-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>0330 133 2989</span>
            </a>
            <span className="text-slate-400">|</span>
            <a
              href="mailto:helpdesk@airportparkingdeals.uk"
              className="hidden sm:flex items-center gap-1 text-slate-200 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>helpdesk@airportparkingdeals.uk</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#061F75] via-[#0B2EA2] to-[#C8102E] p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Plane className="w-7 h-7 text-[#061F75] -rotate-45 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#061F75]">
                Airport Parking <span className="text-[#C8102E]">Deals</span>
              </span>
              <span className="bg-[#C8102E] text-white text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider">
                UK
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Compare & Book Secured Airport Car Parks
            </p>
          </div>
        </div>

        {/* Airport Shortcuts */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
          {quickAirports.map((ap) => (
            <button
              key={ap.code}
              onClick={() => onAirportQuickSelect(ap.code)}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedAirport === ap.code
                  ? 'bg-blue-50 text-[#061F75] font-bold border border-blue-200'
                  : 'hover:text-[#061F75] hover:bg-slate-100'
              }`}
            >
              {ap.label}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Trustpilot pill */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800">
            <div className="flex text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span>4.7/5 Excellent</span>
          </div>

          <button
            onClick={onOpenLookup}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#061F75] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4 text-[#061F75]" />
            <span className="hidden sm:inline">Find My Booking</span>
            <span className="sm:hidden">Lookup</span>
          </button>
        </div>
      </div>
    </header>
  );
}
