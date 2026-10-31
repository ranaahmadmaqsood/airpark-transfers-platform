import React from 'react';
import { X, CheckCircle2, Printer, MapPin, Phone, Calendar, Car, Shield, QrCode } from 'lucide-react';

export default function VoucherModal({ booking, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Booking Confirmed & Guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Boarding-Pass Voucher Body */}
        <div className="p-6 space-y-6">
          {/* Header Ticket Banner */}
          <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-sky-200 block">
                    Official Travel Voucher
                  </span>
                  <h2 className="text-xl font-black tracking-tight">{booking.serviceName}</h2>
                  <p className="text-xs text-sky-100">{booking.operatorName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-sky-200">Reference No.</span>
                  <div className="text-lg font-mono font-black tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                    {booking.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/20 text-xs text-sky-100">
                <span>Airport: <strong className="text-white">{booking.airport}</strong></span>
                <span>Customer: <strong className="text-white">{booking.customerName}</strong></span>
                <span>Date: <strong className="text-white">{booking.createdAt}</strong></span>
              </div>
            </div>
          </div>

          {/* QR Code and Gate Verification Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
            <div className="p-3 bg-white rounded-xl shadow-md shrink-0 flex flex-col items-center">
              {/* Simulated high-res QR code block */}
              <div className="w-28 h-28 bg-slate-950 p-1.5 rounded flex items-center justify-center">
                <QrCode className="w-24 h-24 text-white" />
              </div>
              <span className="text-[9px] font-mono text-slate-900 font-bold mt-1 tracking-tighter">
                {booking.qrToken || 'VOUCHER-TOKEN'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-[11px]">
                <Shield className="w-4 h-4" />
                <span>Gate Entry & Barrier Instructions</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Present this digital QR token at the entry barrier or to your chauffeur. If number plate recognition (ANPR) is active, your plate{' '}
                <strong className="text-amber-300 font-mono">[{booking.vehicleReg || 'UNREGISTERED'}]</strong>{' '}
                will trigger automatic entry.
              </p>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>24/7 Operator Helpline: <strong>+44 (0) 20 8123 4567</strong></span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Lead Passenger</span>
              <p className="font-bold text-white mt-0.5">{booking.customerName}</p>
              <p className="text-slate-400 text-[11px]">{booking.customerEmail}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Flight / ANPR Record</span>
              <p className="font-mono font-bold text-white mt-0.5">Flight: {booking.flightNumber || 'None'}</p>
              <p className="font-mono text-amber-300 text-[11px]">Reg: {booking.vehicleReg || 'N/A'}</p>
            </div>
          </div>

          {/* Payment Receipt Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Net Service Cost:</span>
              <span>£{booking.operatorNet?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Marketplace Booking & Guarantee Fee:</span>
              <span>£{booking.bookingFee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
              <span>Total Paid (Prepaid Voucher):</span>
              <span className="text-emerald-400">£{booking.totalCharged?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-center">
          <p className="text-[11px] text-slate-500">
            AirPark & Ride Direct • Powered by Verified OTA & Chauffeur Clearing Engine
          </p>
        </div>
      </div>
    </div>
  );
}
