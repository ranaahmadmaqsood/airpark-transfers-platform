import React, { useState } from 'react';
import { Shield, Clock, Bus, MapPin, CheckCircle2, ChevronDown, ChevronUp, Star } from 'lucide-react';

export default function ParkingCard({ lot, onSelect }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getTypeName = (type) => {
    switch (type) {
      case 'park_and_ride':
        return 'Park & Ride Shuttle';
      case 'meet_and_greet':
        return 'Valet / Meet & Greet';
      case 'park_sleep_fly':
        return 'Hotel + Parking Package';
      case 'on_site':
        return 'Official On-Airport Long Stay';
      default:
        return 'Airport Parking';
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'meet_and_greet':
        return 'bg-amber-950/70 text-amber-300 border-amber-800';
      case 'park_sleep_fly':
        return 'bg-purple-950/70 text-purple-300 border-purple-800';
      case 'on_site':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
      default:
        return 'bg-sky-950/70 text-sky-300 border-sky-800';
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-sky-500/5 flex flex-col justify-between">
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getTypeBadgeClass(lot.type)}`}>
              {getTypeName(lot.type)}
            </span>
            {lot.parkMarkAccredited && (
              <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
                <Shield className="w-3 h-3 text-emerald-400" />
                Park Mark®
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-900/40">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold">{lot.rating}</span>
            <span className="text-slate-400">({lot.reviewCount})</span>
          </div>
        </div>

        {/* Title and Operator */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-400 transition-colors">
          {lot.name}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Operated by: <span className="text-slate-300 font-medium">{lot.operatorName}</span>
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Transfer Time</p>
              <p className="font-medium">{lot.transferDurationMinutes} mins to terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Bus className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Shuttle Frequency</p>
              <p className="font-medium">
                {lot.transferFrequencyMinutes > 0 ? `Every ${lot.transferFrequencyMinutes}m` : 'Direct Valet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300 col-span-2 sm:col-span-1">
            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Distance</p>
              <p className="font-medium">{lot.distanceMiles} miles from airfield</p>
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-1.5 mb-4">
          {lot.features.slice(0, 3).map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Cancellation policy banner */}
        <div className="text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/60 mb-4">
          🛡️ {lot.cancellationPolicy}
        </div>
      </div>

      {/* Footer / Price & Book */}
      <div className="border-t border-slate-800/80 pt-4 mt-2">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-xs text-slate-400 block">Total for {lot.durationDays} days</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white">
                {lot.pricing.symbol}{lot.pricing.totalPayable.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">
                ({lot.pricing.symbol}{lot.pricing.dailyRate.toFixed(2)} / day)
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelect(lot)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Reserve Spot
          </button>
        </div>

        {/* Business Model Transparency Accordion */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors pt-2 border-t border-slate-800/40"
        >
          <span>Marketplace commission & fee breakdown</span>
          {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showBreakdown && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950 text-[11px] font-mono text-slate-300 space-y-1 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Operator Net Payout:</span>
              <span>{lot.pricing.symbol}{lot.pricing.operatorNet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OTA Commission ({(lot.commissionRate * 100).toFixed(0)}%):</span>
              <span className="text-emerald-400">+{lot.pricing.symbol}{lot.pricing.platformCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Platform Booking / Service Fee:</span>
              <span className="text-indigo-400">+{lot.pricing.symbol}{lot.pricing.bookingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
              <span>Gross Total Charged:</span>
              <span className="text-white">{lot.pricing.symbol}{lot.pricing.totalPayable.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
