import React, { useState } from 'react';
import { createNewBooking } from '../services/apiClient';
import { X, ShieldCheck, Lock, CreditCard, Calendar, Plane, MapPin, CheckCircle } from 'lucide-react';

export default function BookingModal({ item, onClose, onBookingSuccess, promoCode = 'apd10' }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    flightNumber: '',
    vehicleReg: '',
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '888',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail || !formData.vehicleReg) {
      setError('Please provide your name, email address, and vehicle registration');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        serviceName: item.name,
        operatorName: item.operatorName,
        airport: item.airportCode,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        flightNumber: formData.flightNumber,
        vehicleReg: formData.vehicleReg,
        promoCode: promoCode,
        dateDetails: {
          durationDays: item.durationDays || item.pricing?.durationDays || 1,
          yardLocation: item.yardLocation
        },
        pricing: item.pricing
      };

      const booking = await createNewBooking(payload);
      onBookingSuccess(booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const durationDays = item.durationDays || item.pricing?.durationDays || 1;
  const totalPayable = item.pricing?.totalPayable || 49.95;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative">
        {/* Header (Royal Navy) */}
        <div className="bg-[#061F75] text-white p-5 sm:p-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm">🇬🇧</span>
              <h3 className="text-lg font-bold">Secure Online Reservation</h3>
            </div>
            <p className="text-xs text-blue-200">Instant Confirmation &amp; Guaranteed Space</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Service Card */}
        <div className="p-6">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#061F75] block mb-0.5">
                  Selected Airport Service
                </span>
                <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.yardLocation || 'Verified Compound Yard'}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-[#061F75]">
                  £{totalPayable.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">Total for {durationDays} days</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 text-xs text-slate-600">
              <span className="font-semibold">{durationDays} Days Duration</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Free 24h Cancellation
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lead Passenger Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Smith"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#061F75] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (For Voucher) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. david.smith@gmail.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#061F75] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UK Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 07700 900123"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#061F75] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Return Flight Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BA 1482 / EZY 890"
                  value={formData.flightNumber}
                  onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#061F75] focus:bg-white transition-colors uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Registration (Plate Number) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AB24 CDE (Required for automatic barrier ANPR camera entry)"
                value={formData.vehicleReg}
                onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#061F75] focus:bg-white transition-colors uppercase font-mono"
              />
            </div>

            {/* Secure Payment Card Details (Pre-filled test card or user input) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-[#061F75] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Payment Card Details</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  🔒 256-Bit SSL Encrypted
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Card Number</label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                  placeholder="4242 •••• •••• 4242"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={formData.cardExpiry}
                    onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                    placeholder="12/28"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Security Code (CVC)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={formData.cardCvc}
                    onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                    placeholder="888"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Price Breakdown Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Standard Parking Charge:</span>
                <span>£{item.pricing?.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {item.pricing?.discountAmount > 0 && (
                <div className="flex justify-between text-[#C8102E] font-bold">
                  <span>Promo Code Savings ({item.pricing.discountPercentage}% off):</span>
                  <span>-£{item.pricing.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Booking &amp; Security Administration Fee:</span>
                <span>+£{item.pricing?.bookingFee?.toFixed(2) || '1.95'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-[#061F75]">
                <span>Total Due Now:</span>
                <span>£{totalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-[#C8102E] hover:bg-[#A60D25] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-red-700/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {submitting ? 'Confirming Reservation & Payment...' : `Authorize & Pay £${totalPayable.toFixed(2)}`}
                </span>
              </button>
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 text-center mt-2.5">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Stripe 256-bit SSL Encrypted
                </span>
                <span>•</span>
                <span>No Credit Card Surcharge</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
