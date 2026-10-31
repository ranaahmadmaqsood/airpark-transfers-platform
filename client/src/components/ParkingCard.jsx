import React, { useState } from 'react';
import { Shield, Clock, Bus, MapPin, CheckCircle2, ChevronDown, ChevronUp, Star, ArrowRight } from 'lucide-react';

export default function ParkingCard({ lot, onSelect }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isMeetAndGreet = lot.type === 'meet_and_greet';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 transition-all hover:border-[#061F75]/40 hover:shadow-xl hover:shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden group">
      {/* Top promotional ribbon for highest rated */}
      {lot.rating >= 4.8 && (
        <div className="absolute top-0 right-0 bg-[#FFB400] text-slate-900 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-sm">
          ★ Customer Favourite
        </div>
      )}

      <div>
        {/* Service Type & Safety Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3 pr-28">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
              isMeetAndGreet
                ? 'bg-[#061F75] text-white border-[#061F75]'
                : 'bg-blue-50 text-[#061F75] border-blue-200'
            }`}
          >
            {isMeetAndGreet ? 'Meet & Greet (Terminal Forecourt)' : 'Park & Ride (Yard Shuttle)'}
          </span>

          {lot.parkMarkAccredited && (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Park Mark®
            </span>
          )}
        </div>

        {/* Title & Operator Yard */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#061F75] transition-colors mb-1">
          {lot.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Compound Yard: <strong className="text-slate-700">{lot.yardLocation || 'Airport Perimeter Compound'}</strong></span>
        </p>

        {/* Ratings & Reviews */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-800">{lot.rating}</span>
          <span className="text-xs text-slate-400">({lot.reviewCount} verified reviews)</span>
        </div>

        {/* Transfer & Distance Box */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#061F75] shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Transfer</p>
              <p className="font-bold text-slate-800">
                {isMeetAndGreet ? '0 min (At Terminal)' : `${lot.transferDurationMinutes} mins to terminal`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Shuttle</p>
              <p className="font-bold text-slate-800">
                {isMeetAndGreet ? 'Direct Valet' : `Every ${lot.transferFrequencyMinutes}m`}
              </p>
            </div>
          </div>
        </div>

        {/* Key Features Bullet List */}
        <div className="space-y-1.5 mb-4">
          {lot.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Free cancellation notice */}
        <div className="text-[11px] text-slate-600 bg-emerald-50/60 border border-emerald-100 px-3 py-1.5 rounded-lg mb-4 flex items-center gap-1.5">
          <span className="text-emerald-700 font-bold">✓</span>
          <span>{lot.cancellationPolicy}</span>
        </div>
      </div>

      {/* Pricing & CTA Block */}
      <div className="border-t border-slate-200 pt-4 mt-2">
        <div className="flex items-end justify-between mb-3">
          <div>
            {/* Strikethrough gate price & discount pill */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-slate-400 line-through">
                £{lot.pricing.gateTotal.toFixed(2)}
              </span>
              {lot.pricing.discountPercentage > 0 && (
                <span className="text-[10px] font-extrabold uppercase bg-red-100 text-[#C8102E] px-2 py-0.5 rounded">
                  Save {lot.pricing.discountPercentage}%
                </span>
              )}
            </div>

            {/* Big price display */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#061F75]">
                £{lot.pricing.totalPayable.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({lot.durationDays} days)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Includes all booking &amp; terminal levies
            </span>
          </div>

          {/* Union Jack Red CTA */}
          <button
            onClick={() => onSelect(lot)}
            className="px-6 py-3 rounded-xl bg-[#C8102E] hover:bg-[#A60D25] text-white font-extrabold text-sm shadow-md shadow-red-700/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
          >
            <span>Book Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Transparent Price Breakdown Accordion */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-800 transition-colors pt-2 border-t border-slate-100"
        >
          <span>View itemized quote &amp; coupon savings</span>
          {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showBreakdown && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 text-[11px] text-slate-700 space-y-1.5 border border-slate-200">
            <div className="flex justify-between">
              <span>Standard Parking ({lot.durationDays} days @ £{lot.pricing.dailyRate.toFixed(2)}/day):</span>
              <span>£{lot.pricing.subtotal.toFixed(2)}</span>
            </div>
            {lot.pricing.discountAmount > 0 && (
              <div className="flex justify-between text-[#C8102E] font-bold">
                <span>Promo Code Discount ({lot.pricing.discountPercentage}% off):</span>
                <span>-£{lot.pricing.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Booking &amp; Administration Fee:</span>
              <span>+£{lot.pricing.bookingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Terminal Forecourt Drop-off Levy:</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-black text-xs text-[#061F75]">
              <span>Total Payable Now:</span>
              <span>£{lot.pricing.totalPayable.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
