import React, { useState, useEffect } from 'react';
import { Car, Users, Luggage, Shield, Check, Info, ArrowRight, PlaneTakeoff, Navigation } from 'lucide-react';

export default function TransferSection({ onSelectTransfer, selectedAirport }) {
  const [pickup, setPickup] = useState('Central London (WC1/EC1)');
  const [airport, setAirport] = useState(selectedAirport || 'LHR');
  const [vehicleTier, setVehicleTier] = useState('executive_chauffeur');
  const [meetAndGreet, setMeetAndGreet] = useState(true);
  const [childSeats, setChildSeats] = useState(0);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [pickup, airport, vehicleTier, meetAndGreet, childSeats]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/transfers/quote?pickup=${encodeURIComponent(pickup)}&airport=${airport}&vehicle=${vehicleTier}&meetAndGreet=${meetAndGreet}&childSeats=${childSeats}`
      );
      const data = await res.json();
      setQuoteData(data);
    } catch (err) {
      console.error('Failed to fetch transfer quote', err);
    } finally {
      setLoading(false);
    }
  };

  const popularLocations = [
    'Central London (WC1/EC1)',
    'Mayfair & Westminster (W1/SW1)',
    'Canary Wharf / Docklands (E14)',
    'Tunbridge Wells / Sevenoaks (Kent)'
  ];

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Car className="w-3.5 h-3.5 text-indigo-400" />
            Executive & Private Hire Dispatch (Royal Cars Model)
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Fixed-Rate Airport Chauffeur & Private Hire Transfers
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Direct door-to-terminal transfers with professional vetted drivers. No surge pricing, guaranteed flight tracking with 45 minutes complimentary wait time, and terminal drop-off toll fees included.
          </p>
        </div>
      </div>

      {/* Booking Matrix & Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Route & Options Config */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-400" />
            Trip Route Configuration
          </h3>

          {/* Pickup Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Pickup Address / Region
            </label>
            <select
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              {popularLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Airport */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Destination Airport
            </label>
            <select
              value={airport}
              onChange={(e) => setAirport(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="LHR">London Heathrow (LHR)</option>
              <option value="LGW">London Gatwick (LGW)</option>
              <option value="STN">London Stansted (STN)</option>
              <option value="LTN">London Luton (LTN)</option>
              <option value="MAN">Manchester Airport (MAN)</option>
              <option value="BHX">Birmingham Airport (BHX)</option>
            </select>
          </div>

          {/* Extras: Meet & Greet & Child seats */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <label className="text-xs font-semibold uppercase text-slate-400 block">
              Chauffeur Service Options
            </label>

            <div
              onClick={() => setMeetAndGreet(!meetAndGreet)}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                meetAndGreet
                  ? 'bg-sky-950/40 border-sky-600/80'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                  meetAndGreet ? 'bg-sky-500 border-sky-400 text-white' : 'border-slate-700'
                }`}
              >
                {meetAndGreet && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">VIP Meet & Greet Inside Arrivals (+£12.00)</p>
                <p className="text-[11px] text-slate-400">
                  Driver greets passenger inside terminal with name board + includes 45m parking & flight monitoring.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-medium text-slate-300">Child Booster / Safety Seats (+£5)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChildSeats(Math.max(0, childSeats - 1))}
                  className="w-7 h-7 rounded bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center text-sm font-bold"
                >
                  -
                </button>
                <span className="text-sm font-bold text-white px-1">{childSeats}</span>
                <button
                  type="button"
                  onClick={() => setChildSeats(Math.min(3, childSeats + 1))}
                  className="w-7 h-7 rounded bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Vehicle Fleet Tiers & Quote Summary */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-400" />
            Select Vehicle Class & Review Instant Quote
          </h3>

          {/* Vehicle Tier Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quoteData?.availableTiers?.map((tier) => {
              const isSelected = vehicleTier === tier.tierId;
              return (
                <div
                  key={tier.tierId}
                  onClick={() => setVehicleTier(tier.tierId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-sky-500 ring-2 ring-sky-500/30 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white">{tier.name}</span>
                      {tier.tierId === 'executive_chauffeur' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{tier.exampleVehicles}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-300 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        {tier.maxPassengers} Pass
                      </span>
                      <span className="flex items-center gap-1">
                        <Luggage className="w-3.5 h-3.5 text-emerald-400" />
                        {tier.maxLuggage} Bags
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Base + £{tier.ratePerMile}/mi</span>
                    <span className={`font-semibold ${isSelected ? 'text-sky-400' : 'text-slate-400'}`}>
                      {isSelected ? '✓ Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Quote Breakdown Card */}
          {quoteData && quoteData.quote && (
            <div className="bg-slate-950 rounded-2xl border border-indigo-900/60 p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Estimated Transit
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-white">
                      ~{quoteData.quote.estimatedMiles} Miles
                    </span>
                    <span className="text-xs text-slate-400">
                      ({quoteData.quote.estimatedDurationMinutes} mins depending on traffic)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Guaranteed Fixed Fare
                  </span>
                  <div className="text-3xl font-extrabold text-white">
                    {quoteData.quote.symbol}
                    {quoteData.quote.pricingBreakdown.grossTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="py-3 text-xs space-y-1.5 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Journey Base Fare:</span>
                  <span>{quoteData.quote.symbol}{quoteData.quote.pricingBreakdown.baseFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mileage Charge ({quoteData.quote.estimatedMiles} mi):</span>
                  <span>{quoteData.quote.symbol}{quoteData.quote.pricingBreakdown.distanceFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mandatory Airport Drop-off Charge:</span>
                  <span>{quoteData.quote.symbol}{quoteData.quote.pricingBreakdown.airportDropoffFee.toFixed(2)}</span>
                </div>
                {meetAndGreet && (
                  <div className="flex justify-between text-sky-400">
                    <span>Terminal Meet & Greet (Arrivals):</span>
                    <span>+{quoteData.quote.symbol}{quoteData.quote.pricingBreakdown.meetAndGreetFee.toFixed(2)}</span>
                  </div>
                )}
                {childSeats > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Child Booster Seats ({childSeats}x):</span>
                    <span>+{quoteData.quote.symbol}{quoteData.quote.pricingBreakdown.childSeatFee.toFixed(2)}</span>
                  </div>
                )}

                {/* Dispatch margin transparency */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>Driver Payout / Dispatch Fee (85% / 15%):</span>
                  <span>
                    {quoteData.quote.symbol}{quoteData.quote.pricingBreakdown.driverPayout.toFixed(2)} driver / {quoteData.quote.symbol}{quoteData.quote.pricingBreakdown.platformCommission.toFixed(2)} broker
                  </span>
                </div>
              </div>

              {/* Book CTA */}
              <button
                onClick={() =>
                  onSelectTransfer({
                    serviceName: `${quoteData.quote.vehicle.name} Transfer to ${airport}`,
                    operatorName: 'Royal Chauffeur Fleet Kent & London',
                    airport,
                    quote: quoteData.quote
                  })
                }
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Reserve Private Transfer Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
