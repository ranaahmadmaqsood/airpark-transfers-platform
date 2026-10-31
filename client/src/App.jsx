import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSearch from './components/HeroSearch';
import ParkingCard from './components/ParkingCard';
import BookingModal from './components/BookingModal';
import VoucherModal from './components/VoucherModal';
import AdminPortal from './components/AdminPortal';
import FaqSection from './components/FaqSection';
import { searchParkingLots, findBookingByRef, subscribeToParkingLots } from './services/apiClient';
import { Plane, Shield, Award, CheckCircle, RefreshCw, Star, Phone, Mail, MapPin, Tag, AlertCircle } from 'lucide-react';

export default function App() {
  const [selectedAirport, setSelectedAirport] = useState('LHR');
  const [parkingLots, setParkingLots] = useState([]);
  const [loadingParking, setLoadingParking] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return window.location.hash === '#/admin' || window.location.search.includes('admin=true');
  });
  const [searchParams, setSearchParams] = useState({
    airport: 'LHR',
    fromDate: '2026-11-07',
    fromTime: '10:00',
    toDate: '2026-11-14',
    toTime: '12:00',
    promoCode: '',
    type: 'all',
    sortBy: 'recommended'
  });

  // Modal states
  const [bookingModalItem, setBookingModalItem] = useState(null);
  const [voucherData, setVoucherData] = useState(null);

  // Voucher lookup modal
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupRef, setLookupRef] = useState('');
  const [lookupError, setLookupError] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminRoute(window.location.hash === '#/admin' || window.location.search.includes('admin=true'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    fetchParkingLots(searchParams);

    // Real-time synchronization: listen for any live database mutations
    const unsubscribe = subscribeToParkingLots(() => {
      console.log('⚡ Storefront received live PostgreSQL update: refreshing deals...');
      fetchParkingLots(searchParams);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchParkingLots = async (params) => {
    setLoadingParking(true);
    try {
      const results = await searchParkingLots(params);
      setParkingLots(results || []);
    } catch (err) {
      console.error('Failed to load parking search', err);
    } finally {
      setLoadingParking(false);
    }
  };

  const scrollToQuotes = () => {
    setTimeout(() => {
      const el = document.getElementById('quotes-results-section');
      if (el) {
        const yOffset = -80; // account for sticky navbar
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSearch = (newParams) => {
    if (newParams.airport) setSelectedAirport(newParams.airport);
    setSearchParams(newParams);
    fetchParkingLots(newParams);
    scrollToQuotes();
  };

  const handleQuickAirportSelect = (airportCode) => {
    setSelectedAirport(airportCode);
    const updated = { ...searchParams, airport: airportCode };
    setSearchParams(updated);
    fetchParkingLots(updated);
    scrollToQuotes();
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    const updated = { ...searchParams, type: filterType };
    setSearchParams(updated);
    fetchParkingLots(updated);
  };

  const handleSelectParking = (lot) => {
    setBookingModalItem(lot);
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
      const ref = lookupRef.trim().toUpperCase();
      const booking = await findBookingByRef(ref);
      setLookupOpen(false);
      setVoucherData(booking);
    } catch (err) {
      setLookupError(err.message);
    }
  };

  // If navigating to separate admin URL, render dedicated secure operator portal
  if (isAdminRoute) {
    return (
      <AdminPortal
        onBackToStorefront={() => {
          window.location.hash = '';
          setIsAdminRoute(false);
          fetchParkingLots(searchParams);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#C8102E] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenLookup={() => setLookupOpen(true)}
        onAirportQuickSelect={handleQuickAirportSelect}
        selectedAirport={selectedAirport}
      />

      {/* Hero & Search Widget */}
      <HeroSearch
        onSearch={handleSearch}
        selectedAirport={selectedAirport}
        setSelectedAirport={setSelectedAirport}
      />

      {/* Main Results Container */}
      <main id="quotes-results-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 scroll-mt-24">
        {/* Results Header & Filter Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🇬🇧</span>
              <h2 className="text-xl font-black text-[#061F75]">
                Available Parking Deals at {selectedAirport}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Showing {parkingLots.length} verified secure yard compounds for {searchParams.fromDate} to {searchParams.toDate} (7 days)
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Deals' },
              { id: 'meet_and_greet', label: 'Meet & Greet (Forecourt)' },
              { id: 'park_and_ride', label: 'Park & Ride (Shuttle)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-[#061F75] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Promo Code Notification Banner - Only shown if an active promo code is applied */}
        {searchParams.promoCode && parkingLots.some(l => (l.pricing?.discountPercentage || 0) > 0) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Promo code <strong>&quot;{searchParams.promoCode.toUpperCase()}&quot;</strong> active: <strong>{parkingLots.find(l => (l.pricing?.discountPercentage || 0) > 0)?.pricing?.discountPercentage}% Discount</strong> successfully deducted from all quoted rates!
              </span>
            </div>
            <span className="hidden sm:inline font-bold bg-emerald-200/80 px-2.5 py-1 rounded text-emerald-800 text-[11px]">
              Voucher Applied
            </span>
          </div>
        )}

        {/* Promo Code Inactive / Expired Notice - Only shown if customer entered a code that was rejected/disabled */}
        {searchParams.promoCode && !loadingParking && parkingLots.length > 0 && !parkingLots.some(l => (l.pricing?.discountPercentage || 0) > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Promo code <strong>&quot;{searchParams.promoCode.toUpperCase()}&quot;</strong> is currently disabled or expired. Standard online advance rates are displayed below.
              </span>
            </div>
            <span className="hidden sm:inline font-bold bg-amber-200/80 px-2.5 py-1 rounded text-amber-800 text-[11px]">
              Standard Advance Rates
            </span>
          </div>
        )}

        {/* Parking Cards Grid */}
        {loadingParking ? (
          <div className="py-20 text-center text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#061F75]" />
            <span className="font-semibold text-sm">Searching real-time compound yard availability...</span>
          </div>
        ) : parkingLots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {parkingLots.map((lot) => (
              <ParkingCard
                key={lot.id}
                lot={lot}
                onSelect={handleSelectParking}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
            <p className="text-base font-bold text-slate-900">No parking deals matched your filter</p>
            <p className="text-xs">Try selecting "All Deals" or switching airport terminals.</p>
          </div>
        )}

        {/* Operational Highlights Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#061F75] flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Park Mark® Accredited Yards</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every compound features perimeter security fencing, continuous CCTV surveillance, high-res ANPR entry barriers, and 24/7 security patrol.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C8102E] flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Price Match Guarantee</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We benchmark daily rates against gate fees across all major UK terminals to ensure you always get the lowest genuine price online.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">UK Customer Helpline</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our UK-based support team is available 7 days a week on <strong>0330 133 2989</strong> to answer queries, modify bookings, or assist with gate access.
            </p>
          </div>
        </div>
      </main>

      {/* FAQ Section */}
      <FaqSection />

      {/* Booking Checkout Modal */}
      {bookingModalItem && (
        <BookingModal
          item={bookingModalItem}
          promoCode={searchParams.promoCode}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#061F75] mb-1">Find Your Booking Voucher</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your booking reference number (e.g. AP-2026-1042) to view and reprint your boarding voucher.
            </p>

            {lookupError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#061F75] focus:bg-white uppercase font-mono"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLookupOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-extrabold transition-all shadow-md shadow-blue-900/10"
                >
                  Find Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer (Royal Navy Strip) */}
      <footer className="bg-[#061F75] text-white py-12 mt-12 border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-blue-200">
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-amber-400" />
                <span className="font-black text-white text-base">Airport Parking Deals UK</span>
              </div>
              <p className="leading-relaxed text-[11px] text-blue-100">
                UK airport parking comparison tool helping travellers compare cheap secured parking across Heathrow, Gatwick, Manchester, Stansted, and all major terminals.
              </p>
              <p className="text-[11px] text-blue-300">
                Unit 124, 10 London Road, Morden, SM4 5BQ
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Popular Airports</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => handleQuickAirportSelect('LHR')} className="hover:text-white">Heathrow Airport Parking</button></li>
                <li><button onClick={() => handleQuickAirportSelect('LGW')} className="hover:text-white">Gatwick Airport Parking</button></li>
                <li><button onClick={() => handleQuickAirportSelect('MAN')} className="hover:text-white">Manchester Airport Parking</button></li>
                <li><button onClick={() => handleQuickAirportSelect('STN')} className="hover:text-white">Stansted Airport Parking</button></li>
                <li><button onClick={() => handleQuickAirportSelect('LTN')} className="hover:text-white">Luton Airport Parking</button></li>
                <li><button onClick={() => handleQuickAirportSelect('BHX')} className="hover:text-white">Birmingham Airport Parking</button></li>
                <li><button onClick={() => handleQuickAirportSelect('BRS')} className="hover:text-white">Bristol Airport Parking</button></li>
              </ul>
            </div>

            {/* Parking types */}
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Services</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>Meet &amp; Greet Forecourt Valet</li>
                <li>Park &amp; Ride Compound Shuttle</li>
                <li>On-Airport Long Stay Parking</li>
                <li>Southampton Cruise Port Parking</li>
                <li>24/7 Security &amp; CCTV Monitoring</li>
                <li>Park Mark® Safer Parking Scheme</li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Customer Support</h4>
              <p className="mb-2 text-white font-bold text-sm">📞 0330 133 2989</p>
              <p className="mb-3 text-blue-200 text-[11px]">Mon – Sun: 08:00 to 20:00</p>
              <p className="text-[11px]">Email: <a href="mailto:helpdesk@airportparkingdeals.uk" className="underline text-white">helpdesk@airportparkingdeals.uk</a></p>
            </div>
          </div>

          <div className="pt-8 border-t border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-blue-300">
            <p>© 2026 Airport Parking Deals UK. All Rights Reserved.</p>
            <div className="flex items-center gap-6">
              <span>Park Mark® Safer Parking</span>
              <span>BPA Member</span>
              <span>256-Bit SSL Stripe Protected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
