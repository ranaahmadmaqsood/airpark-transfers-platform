import React from 'react';
import { X, CheckCircle2, Printer, MapPin, Phone, Calendar, Car, Shield, QrCode } from 'lucide-react';

export default function VoucherModal({ booking, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

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
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Boarding-Pass Voucher Body */}
        <div className="p-6 space-y-6">
          {/* Header Ticket Banner (Royal Navy & Red Stripe) */}
          <div className="bg-[#061F75] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8102E]/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-sky-200 block">
                    🇬🇧 Official Airport Parking Voucher
                  </span>
                  <h2 className="text-xl font-black tracking-tight">{booking.serviceName}</h2>
                  <p className="text-xs text-blue-200">{booking.operatorName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-blue-200">Booking Reference</span>
                  <div className="text-lg font-mono font-black tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white">
                    {booking.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/20 text-xs text-blue-100">
                <span>Airport: <strong className="text-white">{booking.airport}</strong></span>
                <span>Customer: <strong className="text-white">{booking.customerName}</strong></span>
                <span>Date: <strong className="text-white">{booking.createdAt}</strong></span>
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
                {booking.qrToken || 'VOUCHER-TOKEN'}
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
                  [{booking.vehicleReg || 'REGISTERED'}]
                </strong>{' '}
                is registered with the compound ANPR camera system for automatic barrier access.
              </p>
              <div className="flex items-center gap-2 text-slate-700 text-[11px] font-semibold pt-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>24/7 Operations Helpline: <strong className="text-[#061F75]">0330 133 2989</strong></span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Lead Passenger</span>
              <p className="font-bold text-slate-900 mt-0.5">{booking.customerName}</p>
              <p className="text-slate-500 text-[11px]">{booking.customerEmail}</p>
              <p className="text-slate-500 text-[11px]">{booking.customerPhone}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">ANPR Plate &amp; Flight</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">Plate: {booking.vehicleReg || 'N/A'}</p>
              <p className="font-mono text-slate-600 text-[11px]">Flight: {booking.flightNumber || 'None'}</p>
              <p className="text-emerald-700 font-bold text-[11px] mt-0.5">✓ Forecourt Levy Paid</p>
            </div>
          </div>

          {/* Payment Receipt */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Parking Service ({booking.serviceName}):</span>
              <span>£{booking.operatorNet?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Booking &amp; Administration Fee:</span>
              <span>£{booking.bookingFee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-[#061F75]">
              <span>Total Paid (Prepaid Online Voucher):</span>
              <span className="text-emerald-700">£{booking.totalCharged?.toFixed(2)}</span>
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
