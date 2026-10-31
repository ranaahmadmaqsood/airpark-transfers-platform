import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Plane, Car, Lock, Calendar } from 'lucide-react';

export default function BookingModal({ item, type, onClose, onBookingSuccess }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    flightNumber: '',
    vehicleReg: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!item) return null;

  const isParking = type === 'parking';

  const priceDetails = isParking
    ? {
        subtotal: item.pricing.subtotal,
        bookingFee: item.pricing.bookingFee,
        totalPayable: item.pricing.totalPayable,
        commission: item.pricing.platformCommission,
        operatorNet: item.pricing.operatorNet,
        symbol: item.pricing.symbol
      }
    : {
        subtotal: item.quote.pricingBreakdown.grossTotal - 1.99,
        bookingFee: 1.99,
        totalPayable: item.quote.pricingBreakdown.grossTotal,
        commission: item.quote.pricingBreakdown.platformCommission,
        operatorNet: item.quote.pricingBreakdown.driverPayout,
        symbol: item.quote.symbol
      };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail) {
      setError('Please provide your name and email address');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        type,
        serviceName: isParking ? item.name : item.serviceName,
        operatorName: isParking ? item.operatorName : item.operatorName,
        airport: isParking ? item.airportCode : item.airport,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        flightNumber: formData.flightNumber,
        vehicleReg: formData.vehicleReg,
        dateDetails: isParking
          ? { days: item.durationDays, fromDate: '2026-11-05', toDate: '2026-11-12' }
          : { pickupTime: '08:00 AM', pickupAddress: item.quote?.pickupLocation },
        pricing: priceDetails
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete booking');

      onBookingSuccess(data.booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              {isParking ? <Plane className="w-5 h-5" /> : <Car className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Complete Reservation</h3>
              <p className="text-xs text-slate-400">Guaranteed Spot & Instant Confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Service Summary */}
        <div className="p-6 pb-2">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-sky-400 block mb-1">
                  Selected Service
                </span>
                <h4 className="text-sm font-bold text-white">
                  {isParking ? item.name : item.serviceName}
                </h4>
                <p className="text-xs text-slate-400">
                  {isParking ? item.operatorName : `Operator: ${item.operatorName}`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-white">
                  {priceDetails.symbol}{priceDetails.totalPayable.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block">Total amount</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {isParking ? `${item.durationDays} Days Duration` : item.quote?.pickupLocation}
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Free cancellation
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  placeholder="+44 7700 900077"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Flight Number (For Tracking)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BA 1478 / AA 100"
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Vehicle Registration / License Plate
              </label>
              <input
                type="text"
                placeholder="e.g. AB24 CDE (Used for automatic ANPR barrier entry)"
                value={formData.vehicleReg}
                onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase font-mono"
              />
            </div>

            {/* Financial ledger breakdown notice */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Base Service Rate:</span>
                <span>{priceDetails.symbol}{priceDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Booking / Protection Fee:</span>
                <span className="text-indigo-400">+{priceDetails.symbol}{priceDetails.bookingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white text-xs">
                <span>Total Due Now:</span>
                <span>{priceDetails.symbol}{priceDetails.totalPayable.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {submitting ? 'Generating Booking...' : `Confirm & Pay ${priceDetails.symbol}${priceDetails.totalPayable.toFixed(2)}`}
                </span>
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                <CreditCard className="w-3 h-3" />
                256-bit encrypted checkout. No debit/credit card surcharge.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
