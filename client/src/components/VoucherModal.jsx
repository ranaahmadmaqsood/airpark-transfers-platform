import React, { useState } from 'react';
import { X, CheckCircle2, Printer, MapPin, Phone, Calendar, Car, Shield, QrCode, Edit3, Check, Plane, Mail } from 'lucide-react';
import { updateBookingDetails, dispatchVoucherEmail } from '../services/apiClient';

export default function VoucherModal({ booking, onClose }) {
  const [currentBooking, setCurrentBooking] = useState(booking);
  const [isEditing, setIsEditing] = useState(false);
  const [amendName, setAmendName] = useState(booking?.customerName || '');
  const [amendEmail, setAmendEmail] = useState(booking?.customerEmail || '');
  const [amendPhone, setAmendPhone] = useState(booking?.customerPhone || '');
  const [amendReg, setAmendReg] = useState(booking?.vehicleReg || '');
  const [amendFlight, setAmendFlight] = useState(booking?.flightNumber || '');
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!currentBooking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleResendEmail = async () => {
    setSendingEmail(true);
    setSuccessMsg(null);
    try {
      const res = await dispatchVoucherEmail(currentBooking);
      setSuccessMsg(`Voucher email dispatched to ${currentBooking.customerEmail}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      alert('Could not dispatch email: ' + e.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveAmendment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const updated = await updateBookingDetails(currentBooking.id, {
        customerName: amendName,
        customerEmail: amendEmail,
        customerPhone: amendPhone,
        vehicleReg: amendReg,
        flightNumber: amendFlight
      });
      setCurrentBooking(updated);
      setIsEditing(false);
      setSuccessMsg(`Passenger information, ANPR registration and voucher updated successfully in database! Confirmation sent to ${amendEmail}.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalCharged = parseFloat(currentBooking.totalCharged || 0);
  const bookingFee = parseFloat(currentBooking.bookingFee || 1.95);
  const operatorNet = parseFloat(currentBooking.operatorNet || (totalCharged > bookingFee ? totalCharged - bookingFee : 30.00));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Booking Confirmed &amp; Guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResendEmail}
              disabled={sendingEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#061F75] border border-blue-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              title="Resend confirmation email voucher"
            >
              <Mail className="w-3.5 h-3.5 text-[#061F75]" />
              <span>{sendingEmail ? 'Dispatching...' : 'Email Voucher'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Boarding-Pass Voucher Body */}
        <div className="p-6 space-y-5">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Header Ticket Banner (Royal Navy & Red Stripe) */}
          <div className="bg-[#061F75] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8102E]/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-sky-200 block">
                    🇬🇧 Official Airport Parking Voucher
                  </span>
                  <h2 className="text-xl font-black tracking-tight">{currentBooking.serviceName}</h2>
                  <p className="text-xs text-blue-200">{currentBooking.operatorName || 'Airport Parking Deals Express'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-blue-200">Booking Reference</span>
                  <div className="text-lg font-mono font-black tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white">
                    {currentBooking.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/20 text-xs text-blue-100">
                <span>Airport: <strong className="text-white">{currentBooking.airport}</strong></span>
                <span>Customer: <strong className="text-white">{currentBooking.customerName}</strong></span>
                <span>Status: <strong className="text-emerald-300 uppercase">{currentBooking.status || 'CONFIRMED'}</strong></span>
              </div>
            </div>
          </div>

          {/* QR Code and Gate Verification Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
            <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200 shrink-0 flex flex-col items-center">
              <div className="w-24 h-24 bg-white p-1 rounded flex items-center justify-center">
                <QrCode className="w-20 h-20 text-slate-900" />
              </div>
              <span className="text-[9px] font-mono text-[#061F75] font-black mt-1 tracking-wider">
                {currentBooking.qrToken || currentBooking.id}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#061F75] font-black uppercase tracking-wider text-[11px]">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Barrier Entry &amp; Forecourt Instructions</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Present this voucher on your mobile or paper printout. Your vehicle registration{' '}
                <strong className="text-slate-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-mono font-black">
                  [{currentBooking.vehicleReg || 'REGISTERED'}]
                </strong>{' '}
                is registered with the compound ANPR camera system for automatic barrier access.
              </p>
              <div className="flex items-center gap-2 text-slate-700 text-[11px] font-semibold pt-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>24/7 Operations Helpline: <strong className="text-[#061F75]">0330 133 2989</strong></span>
              </div>
            </div>
          </div>

          {/* Details Grid & Self-Service Amendment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Lead Passenger</span>
                <p className="font-bold text-slate-900 mt-0.5 text-sm">{currentBooking.customerName}</p>
                <p className="text-slate-600 text-xs mt-0.5 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#061F75]" />
                  <span>{currentBooking.customerEmail}</span>
                </p>
                <p className="text-slate-600 text-xs mt-0.5 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{currentBooking.customerPhone || 'Not provided'}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">ANPR Plate &amp; Flight</span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[11px] font-bold text-[#061F75] bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-[#061F75]" />
                    <span>{isEditing ? 'Close Edit' : 'Edit Passenger & Vehicle'}</span>
                  </button>
                </div>
                <p className="font-mono font-bold text-slate-900 mt-1">
                  Plate: <span className="bg-amber-100 text-slate-900 px-2 py-0.5 rounded border border-amber-300 font-black">{currentBooking.vehicleReg || 'N/A'}</span>
                </p>
                <p className="font-mono text-slate-600 text-[11px] mt-1.5 flex items-center gap-1">
                  <Plane className="w-3 h-3 text-slate-400" />
                  <span>Flight: {currentBooking.flightNumber || 'None specified'}</span>
                </p>
              </div>
              <p className="text-emerald-700 font-bold text-[11px] mt-2">✓ Forecourt Levy Paid &amp; Covered</p>
            </div>
          </div>

          {/* Amendment Form (when user clicks Edit Passenger & Vehicle) */}
          {isEditing && (
            <form onSubmit={handleSaveAmendment} className="p-4 sm:p-5 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                <span className="font-extrabold text-[#061F75] text-sm flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-[#061F75]" />
                  <span>Update Passenger &amp; Vehicle Information</span>
                </span>
                <span className="text-[10px] text-slate-500">Instant Supabase Sync</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Passenger Name *</label>
                  <input
                    type="text"
                    required
                    value={amendName}
                    onChange={(e) => setAmendName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={amendEmail}
                    onChange={(e) => setAmendEmail(e.target.value)}
                    placeholder="e.g. john@example.co.uk"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Mobile / Phone *</label>
                  <input
                    type="tel"
                    value={amendPhone}
                    onChange={(e) => setAmendPhone(e.target.value)}
                    placeholder="e.g. 07700 900123"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Vehicle Plate (ANPR Barrier) *</label>
                  <input
                    type="text"
                    required
                    value={amendReg}
                    onChange={(e) => setAmendReg(e.target.value.toUpperCase())}
                    placeholder="e.g. AB24 CDE"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-black uppercase text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-700 mb-1">Return Flight Number</label>
                  <input
                    type="text"
                    value={amendFlight}
                    onChange={(e) => setAmendFlight(e.target.value.toUpperCase())}
                    placeholder="e.g. BA 175"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold uppercase text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#061F75] text-white font-extrabold text-xs hover:bg-[#0B2EA2] transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {saving ? 'Saving to Database...' : 'Save & Update Voucher'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Payment Receipt */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Parking Service ({currentBooking.serviceName}):</span>
              <span>£{operatorNet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Booking &amp; Administration Fee:</span>
              <span>£{bookingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-[#061F75]">
              <span>Total Paid (Prepaid Online Voucher):</span>
              <span className="text-emerald-700">£{totalCharged.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-[11px] text-slate-500">
          Airport Parking Deals UK • Customer Support 0330 133 2989 • Unit 124, 10 London Road, Morden, SM4 5BQ
        </div>
      </div>
    </div>
  );
}
