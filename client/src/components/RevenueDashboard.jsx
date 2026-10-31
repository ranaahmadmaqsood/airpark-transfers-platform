import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, ShieldAlert, FileText, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react';

export default function RevenueDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
        <span>Loading revenue model financial ledger...</span>
      </div>
    );
  }

  const { kpis, takeRatePercentage, recentBookings, operatorReconciliation } = metrics || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-semibold mb-2">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Platform Economics & Financial Clearinghouse</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Marketplace Revenue Model & Partner Reconciliation
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time ledger tracking Gross Booking Value (GBV), commissions, convenience fees, and operator net payables across parking and private hire transfers.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Bookings */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Gross Booking Value (GBV)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              £{kpis?.totalGrossBookings?.toFixed(2)}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
            Total transaction throughput from {kpis?.parkingBookingsCount + kpis?.transferBookingsCount} bookings
          </p>
        </div>

        {/* Platform Net Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-800/80 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block mb-1">
              Net Platform Take
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              £{kpis?.totalNetRevenue?.toFixed(2)}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80 flex justify-between">
            <span>Effective Take Rate:</span>
            <strong className="text-white font-bold">{takeRatePercentage}%</strong>
          </p>
        </div>

        {/* Commission Split */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Partner Commissions
            </span>
            <div className="text-2xl font-black text-sky-400 font-mono">
              £{kpis?.totalPlatformCommissions?.toFixed(2)}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
            Averaging 15%–20% wholesale margin cut
          </p>
        </div>

        {/* Consumer Fees */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Booking & Service Fees
            </span>
            <div className="text-2xl font-black text-purple-400 font-mono">
              £{kpis?.totalBookingFees?.toFixed(2)}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
            Direct consumer checkout fees (£1.99 - £2.99)
          </p>
        </div>
      </div>

      {/* Operator Settlement & Reconciliation Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          Operator Payables & Settlement Sub-Ledger
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Shows net payments owed to third-party car parks (e.g. Apex, Maple) and private hire fleets (e.g. Royal Chauffeurs) after deducting platform take.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3 font-semibold">Operator Partner</th>
                <th className="pb-3 font-semibold text-center">Bookings</th>
                <th className="pb-3 font-semibold text-right">Gross GMV</th>
                <th className="pb-3 font-semibold text-right">Commission Retained</th>
                <th className="pb-3 font-semibold text-right text-emerald-400">Net Payable to Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {operatorReconciliation?.map((op, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-sans font-medium text-white">{op.operatorName}</td>
                  <td className="py-3 text-center text-slate-300">{op.totalBookings}</td>
                  <td className="py-3 text-right text-slate-300">£{op.totalGross.toFixed(2)}</td>
                  <td className="py-3 text-right text-sky-400 font-semibold">
                    -£{op.commissionPaidToPlatform.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-emerald-400 font-bold">
                    £{op.totalNetPayable.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transaction Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Recent Transaction Audit Trail
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3 font-semibold">Reference</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Service</th>
                <th className="pb-3 font-semibold text-right">Charged</th>
                <th className="pb-3 font-semibold text-right text-sky-400">Net Take</th>
                <th className="pb-3 font-semibold text-right text-emerald-400">Operator Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentBookings?.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-bold text-sky-400">{b.id}</td>
                  <td className="py-3 uppercase text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        b.type === 'parking'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}
                    >
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 font-sans text-white">{b.customerName}</td>
                  <td className="py-3 font-sans text-slate-300 max-w-xs truncate">{b.serviceName}</td>
                  <td className="py-3 text-right font-bold text-white">£{b.totalCharged?.toFixed(2)}</td>
                  <td className="py-3 text-right text-sky-400">
                    £{(b.commissionEarned + b.bookingFee)?.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-emerald-400 font-medium">
                    £{b.operatorNet?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
