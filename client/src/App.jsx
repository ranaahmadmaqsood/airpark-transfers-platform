import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';
import ParkingCard from './components/ParkingCard';
import TransferSection from './components/TransferSection';
import BookingModal from './components/BookingModal';
import VoucherModal from './components/VoucherModal';
import RevenueDashboard from './components/RevenueDashboard';
import { Plane, Car, Shield, Award, CheckCircle, RefreshCw, Search } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('parking');
  const [selectedAirport, setSelectedAirport] = useState('LHR');
  const [parkingLots, setParkingLots] = useState([]);
  const [loadingParking, setLoadingParking] = useState(false);
  const [searchParams, setSearchParams] = useState({
    airport: 'LHR',
    fromDate: '2026-11-05',
    toDate: '2026-11-12',
    type: 'all',
    sortBy: 'recommended'
  });

  // Modal states
  const [bookingModalItem, setBookingModalItem] = useState(null);
  const [bookingModalType, setBookingModalType] = useState('parking');
  const [voucherData, setVoucherData] = useState(null);

  // Voucher lookup modal
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupRef, setLookupRef] = useState('');
  const [lookupError, setLookupError] = useState(null);

  useEffect(() => {
    fetchParkingLots(searchParams);
  }, []);

  const fetchParkingLots = async (params) => {
    setLoadingParking(true);
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`/api/parking/search?${query}`);
      const data = await res.json();
      setParkingLots(data.results || []);
    } catch (err) {
      console.error('Failed to load parking search', err);
    } finally {
      setLoadingParking(false);
    }
  };

  const handleSearch = (newParams) => {
    setSearchParams(newParams);
    fetchParkingLots(newParams);
  };

  const handleSelectParking = (lot) => {
    setBookingModalItem(lot);
    setBookingModalType('parking');
  };

  const handleSelectTransfer = (transferItem) => {
    setBookingModalItem(transferItem);
    setBookingModalType('transfer');
  };

  const handleBookingSuccess = (newBooking) => {
    setBookingModalItem(null);
    setVoucherData(newBooking);
  };

  const handleLookupSubmit = async (e) => {
    e.preventDefault();
    if (!lookupRef.trim()) return;
    setLookupError(null);
    try {
      const res = await fetch(`/api/bookings/${lookupRef.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Voucher not found');
      setLookupOpen(false);
      setVoucherData(data.booking);
    } catch (err) {
      setLookupError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLookup={() => setLookupOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* PARKING TAB */}
        {activeTab === 'parking' && (
          <div className="space-y-8">
            {/* Search Hero */}
            <HeroSearch
              onSearch={handleSearch}
              selectedAirport={selectedAirport}
              setSelectedAirport={setSelectedAirport}
            />

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plane className="w-5 h-5 text-sky-400" />
                  <span>Available Parking Options at {selectedAirport}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Showing {parkingLots.length} verified secure lots for {searchParams.fromDate} to {searchParams.toDate}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Free Cancellation
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  Best Price Guarantee
                </span>
              </div>
            </div>

            {/* Cards Grid */}
            {loadingParking ? (
              <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                <span>Searching real-time parking inventory...</span>
              </div>
            ) : parkingLots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parkingLots.map((lot) => (
                  <ParkingCard
                    key={lot.id}
                    lot={lot}
                    onSelect={handleSelectParking}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                <p className="text-base font-semibold text-white">No parking lots matched your filter</p>
                <p className="text-xs">Try selecting "All Lots" or switching airports.</p>
              </div>
            )}
          </div>
        )}

        {/* TRANSFERS TAB */}
        {activeTab === 'transfers' && (
          <TransferSection
            onSelectTransfer={handleSelectTransfer}
            selectedAirport={selectedAirport}
          />
        )}

        {/* METRICS & BUSINESS MODEL DASHBOARD */}
        {activeTab === 'metrics' && <RevenueDashboard />}
      </main>

      {/* Booking Checkout Modal */}
      {bookingModalItem && (
        <BookingModal
          item={bookingModalItem}
          type={bookingModalType}
          onClose={() => setBookingModalItem(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Voucher Confirmation Modal */}
      {voucherData && (
        <VoucherModal
          booking={voucherData}
          onClose={() => setVoucherData(null)}
        />
      )}

      {/* Voucher Lookup Modal */}
      {lookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Find Your Voucher</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your booking reference code (e.g. AP-2026-1042) to retrieve your boarding voucher.
            </p>

            {lookupError && (
              <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300">
                {lookupError}
              </div>
            )}

            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="e.g. AP-2026-1042"
                value={lookupRef}
                onChange={(e) => setLookupRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 uppercase font-mono"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLookupOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
                >
                  Search Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-sky-400" />
            <span className="font-mono text-slate-400 font-bold">AirPark & Ride Direct</span>
            <span>• Built for Airport Ground Travel Aggregation & Chauffeur Clearing</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <span>Park Mark® Safer Parking</span>
            <span>TfL PHV Licensed Operator Network</span>
            <span>256-Bit SSL Secured</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
