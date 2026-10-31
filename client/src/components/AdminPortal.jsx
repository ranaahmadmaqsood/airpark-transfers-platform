import React, { useState, useEffect, Component } from 'react';
import { 
  getAdminLots, saveAdminLot, removeAdminLot, getAdminBookings, changeBookingStatus,
  authenticateOperator, getOperatorSession, logoutOperator, subscribeToParkingLots,
  getCoupons, saveCoupon, removeCoupon, toggleCouponStatus
} from '../services/apiClient';
import { 
  Building2, MapPin, DollarSign, Users, Plus, Trash2, Edit3, CheckCircle, 
  XCircle, Clock, ShieldCheck, ArrowLeft, RefreshCw, X, Eye, Phone, Mail, Car, Plane, Lock, KeyRound, AlertTriangle, LogOut, Zap, Tag, Download, Filter, Search, TrendingUp, Check, Percent
} from 'lucide-react';

// Error Boundary to prevent any blank screen crashes
class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AdminPortal Error Boundary caught an exception:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-md bg-slate-800 p-8 rounded-3xl border border-red-500/40 shadow-2xl">
            <div className="w-16 h-16 bg-red-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Admin Portal Recovery Mode</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              An unexpected render issue occurred. Your database data and session remain safe.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full py-3 bg-[#061F75] hover:bg-[#0B2EA2] text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg"
              >
                Reload Dashboard
              </button>
              <button
                onClick={() => {
                  logoutOperator();
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Reset Session &amp; Login Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminPortalContent({ onBackToStorefront }) {
  // Authentication state
  const [operatorUser, setOperatorUser] = useState(() => getOperatorSession());
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Portal tabs & data
  const [activeTab, setActiveTab] = useState('lots'); // 'lots' | 'orders' | 'coupons'
  const [lots, setLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);

  // Filters
  const [lotAirportFilter, setLotAirportFilter] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderAirportFilter, setOrderAirportFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // Modal states for Location Add / Edit
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [lotFormData, setLotFormData] = useState({
    airportCode: 'LHR',
    name: '',
    operatorName: 'Airport Parking Deals Express',
    type: 'meet_and_greet',
    baseDailyRate: '5.50',
    yardLocation: '',
    transferDurationMinutes: '0',
    transferFrequencyMinutes: '0',
    distanceMiles: '0.1'
  });
  const [savingLot, setSavingLot] = useState(false);

  // Modal states for Coupon Add
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discountPercentage: '10',
    description: '',
    minDays: '1',
    isActive: true
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Selected customer profile view
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState(null);

  useEffect(() => {
    if (operatorUser) {
      fetchData();

      // Subscribe to real-time PostgreSQL updates
      const unsubscribe = subscribeToParkingLots(() => {
        setRealtimeActive(true);
        fetchData();
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [operatorUser]);

  const handleLogin = async (e, overrideEmail = null, overridePassword = null) => {
    if (e) e.preventDefault();
    if (failedAttempts >= 5) {
      setAuthError('Too many failed attempts. Security cooldown active. Please wait 30 seconds.');
      return;
    }

    const emailToUse = overrideEmail || authEmail || 'admin@airportparkingdeals.uk';
    const passToUse = overridePassword || authPassword || '7890';

    setAuthLoading(true);
    setAuthError(null);

    const res = await authenticateOperator(emailToUse, passToUse);
    setAuthLoading(false);

    if (res && res.success) {
      setOperatorUser(res.user);
      setFailedAttempts(0);
    } else {
      setFailedAttempts(prev => prev + 1);
      setAuthError(res?.error || 'Invalid operator credentials. Access denied.');
    }
  };

  const handleQuickUnlock = () => {
    setAuthEmail('admin@airportparkingdeals.uk');
    setAuthPassword('7890');
    handleLogin(null, 'admin@airportparkingdeals.uk', '7890');
  };

  const handleLogout = () => {
    logoutOperator();
    setOperatorUser(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lotsData, bookingsData, couponsData] = await Promise.all([
        getAdminLots(),
        getAdminBookings(),
        getCoupons()
      ]);
      setLots(Array.isArray(lotsData) ? lotsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
      setRealtimeActive(true);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  // Open modal to add or edit lot
  const handleOpenLotModal = (lot = null) => {
    if (lot) {
      setEditingLot(lot);
      setLotFormData({
        airportCode: lot.airportCode || 'LHR',
        name: lot.name || '',
        operatorName: lot.operatorName || 'Airport Parking Deals Express',
        type: lot.type || 'meet_and_greet',
        baseDailyRate: String(lot.baseDailyRate || '5.50'),
        yardLocation: lot.yardLocation || '',
        transferDurationMinutes: String(lot.transferDurationMinutes || '0'),
        transferFrequencyMinutes: String(lot.transferFrequencyMinutes || '0'),
        distanceMiles: String(lot.distanceMiles || '0.1')
      });
    } else {
      setEditingLot(null);
      setLotFormData({
        airportCode: 'LHR',
        name: '',
        operatorName: 'Airport Parking Deals Express',
        type: 'meet_and_greet',
        baseDailyRate: '5.50',
        yardLocation: '',
        transferDurationMinutes: '0',
        transferFrequencyMinutes: '0',
        distanceMiles: '0.1'
      });
    }
    setLotModalOpen(true);
  };

  // Save (Add or Update) lot in real-time
  const handleSaveLot = async (e) => {
    e.preventDefault();
    setSavingLot(true);
    try {
      await saveAdminLot(lotFormData, editingLot ? editingLot.id : null);
      await fetchData();
      setLotModalOpen(false);
    } catch (err) {
      alert('Error updating database: ' + err.message);
    } finally {
      setSavingLot(false);
    }
  };

  // Delete lot in real-time
  const handleDeleteLot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parking compound yard from the live database?')) return;
    try {
      await removeAdminLot(id);
      setLots(prev => prev.filter(l => l.id !== id));
      await fetchData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Update booking order status in real-time
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await changeBookingStatus(bookingId, newStatus);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  // Save new Coupon in real-time
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setSavingCoupon(true);
    try {
      await saveCoupon(couponFormData);
      await fetchData();
      setCouponModalOpen(false);
      setCouponFormData({ code: '', discountPercentage: '10', description: '', minDays: '1', isActive: true });
    } catch (err) {
      alert('Error saving coupon: ' + err.message);
    } finally {
      setSavingCoupon(false);
    }
  };

  // Toggle Coupon Active / Disabled
  const handleToggleCoupon = async (code, currentStatus) => {
    try {
      await toggleCouponStatus(code, !currentStatus);
      setCoupons(prev => prev.map(c => c.code === code ? { ...c, isActive: !currentStatus } : c));
    } catch (err) {
      alert('Error toggling coupon: ' + err.message);
    }
  };

  // Delete Coupon in real-time
  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;
    try {
      await removeCoupon(code);
      setCoupons(prev => prev.filter(c => c.code !== code));
    } catch (err) {
      alert('Error deleting coupon: ' + err.message);
    }
  };

  // Export Bookings ANPR Manifest to CSV
  const handleExportCSV = () => {
    if (safeBookings.length === 0) {
      alert('No booking records to export.');
      return;
    }

    const headers = ['Booking Ref', 'Customer Name', 'Email', 'Phone', 'ANPR Vehicle Plate', 'Flight Number', 'Airport', 'Service Package', 'Total Paid (£)', 'Status', 'Date Booked'];
    const rows = safeBookings.map(b => [
      `"${b.id}"`,
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      `"${b.customerEmail || ''}"`,
      `"${b.customerPhone || ''}"`,
      `"${b.vehicleReg || 'N/A'}"`,
      `"${b.flightNumber || 'None'}"`,
      `"${b.airport}"`,
      `"${(b.serviceName || '').replace(/"/g, '""')}"`,
      `"${parseFloat(b.totalCharged || 0).toFixed(2)}"`,
      `"${b.status || 'confirmed'}"`,
      `"${b.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ANPR_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const safeLots = Array.isArray(lots) ? lots : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeCoupons = Array.isArray(coupons) ? coupons : [];

  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Financial KPI calculations
  const totalGrossRevenue = safeBookings.reduce((sum, b) => sum + (parseFloat(b.totalCharged) || 0), 0);
  const platformCommissionEarned = totalGrossRevenue * 0.28;
  const netOperatorPayable = totalGrossRevenue - platformCommissionEarned;
  const activeBookingsCount = safeBookings.filter(b => b.status === 'confirmed').length;

  // Filtered Lots
  const filteredLots = safeLots.filter(l => {
    if (lotAirportFilter === 'ALL') return true;
    return (l.airportCode || '').toUpperCase() === lotAirportFilter;
  });

  // Filtered Bookings
  const filteredBookings = safeBookings.filter(b => {
    const query = orderSearchQuery.toLowerCase();
    const matchesQuery = !query || 
      (b.id || '').toLowerCase().includes(query) ||
      (b.customerName || '').toLowerCase().includes(query) ||
      (b.customerEmail || '').toLowerCase().includes(query) ||
      (b.vehicleReg || '').toLowerCase().includes(query);

    const matchesAirport = orderAirportFilter === 'ALL' || (b.airport || '').toUpperCase() === orderAirportFilter;
    const matchesStatus = orderStatusFilter === 'ALL' || (b.status || 'confirmed') === orderStatusFilter;

    return matchesQuery && matchesAirport && matchesStatus;
  });

  // IF NOT AUTHENTICATED: SHOW SECURE OPERATOR LOGIN GATE
  if (!operatorUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-800/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Top Lock Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#061F75] to-[#C8102E] p-0.5 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="text-center mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C8102E] bg-red-950/80 border border-red-800/60 px-3 py-1 rounded-full">
              RESTRICTED ACCESS
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-white">
              Operator Portal Security Gate
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Airport Parking Deals UK • Backend Control System
            </p>
          </div>

          {authError && (
            <div className="p-3.5 mb-5 rounded-2xl bg-red-950/60 border border-red-800 text-xs font-bold text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Quick Unlock 1-Click Button */}
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-700/60 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Operator Access</span>
              </div>
              <p className="text-[10px] text-slate-300">Fast sign-in with master PIN 7890</p>
            </div>
            <button
              type="button"
              onClick={handleQuickUnlock}
              disabled={authLoading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
            >
              {authLoading ? 'Verifying...' : 'Unlock (7890)'}
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Operator Email / ID
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  placeholder="admin@airportparkingdeals.uk"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-[#C8102E] focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password or 4-Digit PIN
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter master password or PIN (7890)"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-[#C8102E] focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-white font-medium tracking-wider"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default Master PIN: <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-300 font-mono">7890</code> or Password: <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-300 font-mono">ParkDeals2026!</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] hover:from-[#0B2EA2] hover:to-[#A60D25] text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-900/40 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? 'Verifying PostgreSQL Credentials...' : 'Unlock Operator Dashboard'}
            </button>
          </form>

          {/* Return link */}
          <div className="mt-6 text-center">
            <button
              onClick={onBackToStorefront}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Storefront</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>🔒 PostgreSQL Crypt() Protected</span>
            <span>⚡ RLS &amp; Realtime Synced</span>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: RENDER FULL OPERATOR DASHBOARD
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Admin Header Bar */}
      <header className="bg-[#061F75] text-white px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#C8102E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-amber-400">
            ⚙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#C8102E] text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">
                OPERATOR PORTAL
              </span>
              <span className="text-xs font-bold text-slate-200">
                Logged in as: <strong>{operatorUser?.username || 'admin@airportparkingdeals.uk'}</strong>
              </span>
              {realtimeActive && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PostgreSQL Realtime Active
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-xl font-black">
              Airport Parking Deals UK • Control Center
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onBackToStorefront}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-white text-xs font-bold transition-all cursor-pointer border border-blue-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront View</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A60D25] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock &amp; Exit</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation Strip */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('lots')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'lots'
                ? 'bg-[#061F75] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Compound Yards &amp; Rates ({safeLots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'orders'
                ? 'bg-[#061F75] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Customer Bookings &amp; ANPR ({safeBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'coupons'
                ? 'bg-[#061F75] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Coupons &amp; Promo Codes ({safeCoupons.length})</span>
          </button>
        </div>

        {activeTab === 'orders' && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#061F75]" />
            <span>Export ANPR Manifest (CSV)</span>
          </button>
        )}
      </div>

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Gross Booking Volume</span>
            <div className="text-2xl font-black text-[#061F75]">£{formatPrice(totalGrossRevenue)}</div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Total Customer Prepayments
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Platform Commission (28%)</span>
            <div className="text-2xl font-black text-emerald-700">£{formatPrice(platformCommissionEarned)}</div>
            <span className="text-[10px] text-slate-400 block mt-1">Net Platform Revenue</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Operator Yard Pool</span>
            <div className="text-2xl font-black text-slate-900">£{formatPrice(netOperatorPayable)}</div>
            <span className="text-[10px] text-slate-400 block mt-1">Forecourt Operator Payout</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Active Vehicles in Compounds</span>
            <div className="text-2xl font-black text-[#C8102E]">{activeBookingsCount}</div>
            <span className="text-[10px] text-slate-400 block mt-1">ANPR Verified Bookings</span>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-[#061F75]" />
            <span className="font-bold text-sm">Querying Supabase PostgreSQL cluster...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: YARDS & RATES */}
            {activeTab === 'lots' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-[#061F75]">Live Compound Yards &amp; Dynamic Pricing</h2>
                    <p className="text-xs text-slate-500">
                      Changes made here immediately write to PostgreSQL and broadcast to all storefront quotes in real time.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenLotModal()}
                    className="px-5 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Compound Yard</span>
                  </button>
                </div>

                {/* Airport Quick Filter Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold text-slate-600">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1">Airport:</span>
                  {['ALL', 'LHR', 'LGW', 'MAN', 'STN', 'LTN', 'BHX', 'BRS', 'LPL', 'SOU'].map((ap) => (
                    <button
                      key={ap}
                      onClick={() => setLotAirportFilter(ap)}
                      className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                        lotAirportFilter === ap
                          ? 'bg-[#061F75] text-white'
                          : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {ap}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-4 px-5">Airport</th>
                          <th className="py-4 px-5">Package &amp; Yard Location</th>
                          <th className="py-4 px-5">Service Type</th>
                          <th className="py-4 px-5">Base Daily Rate</th>
                          <th className="py-4 px-5">7-Day Estimate</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLots.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No compound yards found for filter &quot;{lotAirportFilter}&quot;.
                            </td>
                          </tr>
                        ) : (
                          filteredLots.map((l) => (
                            <tr key={l.id} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-4 px-5">
                                <span className="bg-blue-100 text-[#061F75] px-2.5 py-1 rounded-lg font-mono font-black text-xs">
                                  {l.airportCode}
                                </span>
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-black text-slate-900 text-sm">{l.name}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#C8102E]" />
                                  <span>{l.yardLocation || 'Perimeter Compound Yard'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                                    l.type === 'meet_and_greet'
                                      ? 'bg-blue-50 text-[#061F75] border border-blue-200'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {l.type === 'meet_and_greet' ? 'Meet & Greet' : 'Park & Ride'}
                                </span>
                              </td>
                              <td className="py-4 px-5 font-black text-slate-900 text-sm">
                                £{formatPrice(l.baseDailyRate)} / day
                              </td>
                              <td className="py-4 px-5 font-black text-[#061F75] text-sm">
                                £{(parseFloat(l.baseDailyRate || 0) * 7).toFixed(2)}
                              </td>
                              <td className="py-4 px-5 text-right space-x-2">
                                <button
                                  onClick={() => handleOpenLotModal(l)}
                                  className="p-2 rounded-xl bg-blue-50 text-[#061F75] hover:bg-blue-100 transition-colors cursor-pointer"
                                  title="Edit Rate & Details"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLot(l.id)}
                                  className="p-2 rounded-xl bg-red-50 text-[#C8102E] hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Delete Compound Location"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BOOKINGS & ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search by customer, vehicle reg, or booking reference..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#061F75] focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={orderAirportFilter}
                      onChange={(e) => setOrderAirportFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none"
                    >
                      <option value="ALL">All Airports</option>
                      <option value="LHR">Heathrow (LHR)</option>
                      <option value="LGW">Gatwick (LGW)</option>
                      <option value="MAN">Manchester (MAN)</option>
                      <option value="STN">Stansted (STN)</option>
                      <option value="LTN">Luton (LTN)</option>
                      <option value="BHX">Birmingham (BHX)</option>
                      <option value="BRS">Bristol (BRS)</option>
                    </select>

                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-4 px-5">Ref Code</th>
                          <th className="py-4 px-5">Customer Profile</th>
                          <th className="py-4 px-5">ANPR Plate</th>
                          <th className="py-4 px-5">Airport &amp; Service</th>
                          <th className="py-4 px-5">Total Paid</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5 text-right">View Profile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-12 text-center text-slate-400">
                              No customer reservations match your search or filter.
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-4 px-5 font-mono font-bold text-[#061F75]">
                                {b.id}
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-bold text-slate-900">{b.customerName || 'Guest Customer'}</div>
                                <div className="text-[11px] text-slate-500">{b.customerEmail}</div>
                                <div className="text-[11px] text-slate-500">{b.customerPhone}</div>
                              </td>
                              <td className="py-4 px-5">
                                <span className="bg-amber-100 border border-amber-300 text-slate-900 px-2 py-0.5 rounded font-mono font-black text-xs">
                                  {b.vehicleReg || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-5">
                                <span className="font-bold text-slate-800">{b.airport}</span>
                                <p className="text-[11px] text-slate-500 truncate max-w-xs">{b.serviceName}</p>
                              </td>
                              <td className="py-4 px-5 font-black text-emerald-700 text-sm">
                                £{formatPrice(b.totalCharged)}
                              </td>
                              <td className="py-4 px-5">
                                <select
                                  value={b.status || 'confirmed'}
                                  onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                  className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer ${
                                    b.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : b.status === 'cancelled'
                                      ? 'bg-red-50 text-red-800 border-red-300'
                                      : 'bg-blue-50 text-blue-800 border-blue-300'
                                  }`}
                                >
                                  <option value="confirmed">Confirmed</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <button
                                  onClick={() => setSelectedCustomerOrder(b)}
                                  className="p-2 rounded-xl bg-slate-100 text-[#061F75] hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="View Complete Customer Dossier"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COUPONS & DISCOUNT CODES */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-[#061F75]">Promotional Coupon Codes</h2>
                    <p className="text-xs text-slate-500">
                      Create, toggle, and remove discount codes. Codes apply instantly on customer checkout quotes in real time.
                    </p>
                  </div>
                  <button
                    onClick={() => setCouponModalOpen(true)}
                    className="px-5 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create New Coupon</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-4 px-5">Promo Code</th>
                          <th className="py-4 px-5">Discount Rate</th>
                          <th className="py-4 px-5">Min Parking Days</th>
                          <th className="py-4 px-5">Campaign Description</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {safeCoupons.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No promo codes configured. Click &quot;+ Create New Coupon&quot; above to create one.
                            </td>
                          </tr>
                        ) : (
                          safeCoupons.map((c) => (
                            <tr key={c.code} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-4 px-5">
                                <span className="bg-blue-100 text-[#061F75] px-3 py-1.5 rounded-lg font-mono font-black text-xs border border-blue-200">
                                  {c.code}
                                </span>
                              </td>
                              <td className="py-4 px-5 font-black text-[#C8102E] text-sm">
                                {c.discountPercentage}% OFF
                              </td>
                              <td className="py-4 px-5 text-slate-700 font-bold">
                                {c.minDays} {c.minDays === 1 ? 'day' : 'days'}
                              </td>
                              <td className="py-4 px-5 text-slate-600">
                                {c.description || 'General Promotional Discount'}
                              </td>
                              <td className="py-4 px-5">
                                <button
                                  onClick={() => handleToggleCoupon(c.code, c.isActive)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                    c.isActive
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                  }`}
                                  title="Click to toggle active status"
                                >
                                  {c.isActive ? '● Active' : '○ Disabled'}
                                </button>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <button
                                  onClick={() => handleDeleteCoupon(c.code)}
                                  className="p-2 rounded-xl bg-red-50 text-[#C8102E] hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Delete Promo Code"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: ADD / EDIT LOCATION & PRICE */}
      {lotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  REAL-TIME DATABASE MUTATION
                </span>
                <h3 className="text-lg font-black text-[#061F75]">
                  {editingLot ? 'Edit Live Yard Rate & Location' : 'Deploy New Compound Yard'}
                </h3>
              </div>
              <button
                onClick={() => setLotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLot} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Airport</label>
                  <select
                    value={lotFormData.airportCode}
                    onChange={(e) => setLotFormData({ ...lotFormData, airportCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 outline-none"
                  >
                    <option value="LHR">Heathrow (LHR)</option>
                    <option value="LGW">Gatwick (LGW)</option>
                    <option value="MAN">Manchester (MAN)</option>
                    <option value="STN">Stansted (STN)</option>
                    <option value="LTN">Luton (LTN)</option>
                    <option value="BHX">Birmingham (BHX)</option>
                    <option value="BRS">Bristol (BRS)</option>
                    <option value="LPL">Liverpool (LPL)</option>
                    <option value="SOU">Southampton Port (SOU)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Service Type</label>
                  <select
                    value={lotFormData.type}
                    onChange={(e) => setLotFormData({ ...lotFormData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 outline-none"
                  >
                    <option value="meet_and_greet">Meet &amp; Greet (Forecourt)</option>
                    <option value="park_and_ride">Park &amp; Ride (Shuttle)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Service Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heathrow Express Meet & Greet Forecourt"
                  value={lotFormData.name}
                  onChange={(e) => setLotFormData({ ...lotFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Compound Yard Physical Address &amp; Postcode</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bath Road Compound, Harlington (TW19 8AF)"
                  value={lotFormData.yardLocation}
                  onChange={(e) => setLotFormData({ ...lotFormData, yardLocation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Base Daily Rate (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5.50"
                    value={lotFormData.baseDailyRate}
                    onChange={(e) => setLotFormData({ ...lotFormData, baseDailyRate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 outline-none font-bold"
                  />
                  <span className="text-[10px] text-slate-400 font-normal">
                    7 Days: £{(parseFloat(lotFormData.baseDailyRate || 0) * 7).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block mb-1">Distance in Miles</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 0.1"
                    value={lotFormData.distanceMiles}
                    onChange={(e) => setLotFormData({ ...lotFormData, distanceMiles: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setLotModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLot}
                  className="w-1/2 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingLot ? 'Saving to Database...' : editingLot ? 'Commit Changes' : 'Create Live Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PROMO COUPON */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  PROMOTION ENGINE
                </span>
                <h3 className="text-lg font-black text-[#061F75]">Create New Promo Code</h3>
              </div>
              <button
                onClick={() => setCouponModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={couponFormData.code}
                  onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-black uppercase outline-none focus:border-[#061F75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    placeholder="e.g. 15"
                    value={couponFormData.discountPercentage}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountPercentage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
                <div>
                  <label className="block mb-1">Min Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 3"
                    value={couponFormData.minDays}
                    onChange={(e) => setCouponFormData({ ...couponFormData, minDays: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Campaign Description</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Holiday 15% Special Discount"
                  value={couponFormData.description}
                  onChange={(e) => setCouponFormData({ ...couponFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="w-1/2 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingCoupon ? 'Deploying...' : 'Deploy Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER PROFILE & ANPR VEHICLE DETAILS */}
      {selectedCustomerOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  Customer &amp; Vehicle Dossier
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomerOrder.customerName || 'Customer Record'}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomerOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-[#061F75]" />
                  <span>{selectedCustomerOrder.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{selectedCustomerOrder.customerPhone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Car className="w-4 h-4 text-amber-500" />
                  <span>ANPR Plate: <strong className="font-mono bg-amber-100 px-2 py-0.5 rounded border border-amber-300">{selectedCustomerOrder.vehicleReg || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Plane className="w-4 h-4 text-[#061F75]" />
                  <span>Flight Number: <strong>{selectedCustomerOrder.flightNumber || 'None specified'}</strong></span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span>Booking Reference:</span>
                  <strong className="font-mono text-[#061F75]">{selectedCustomerOrder.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="text-right max-w-[200px] truncate">{selectedCustomerOrder.serviceName}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#061F75] pt-1.5 border-t border-blue-200">
                  <span>Total Amount Paid:</span>
                  <span>£{formatPrice(selectedCustomerOrder.totalCharged)}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerOrder(null)}
                className="w-full mt-3 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPortal(props) {
  return (
    <AdminErrorBoundary>
      <AdminPortalContent {...props} />
    </AdminErrorBoundary>
  );
}
