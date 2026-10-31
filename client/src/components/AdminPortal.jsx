import React, { useState, useEffect, Component } from 'react';
import { 
  getAdminLots, saveAdminLot, removeAdminLot, getAdminBookings, changeBookingStatus,
  authenticateOperator, getOperatorSession, logoutOperator, subscribeToParkingLots,
  getCoupons, saveCoupon, removeCoupon, toggleCouponStatus,
  getAllAdminAirports, saveAirport, toggleAirportStatus, removeAirport, dispatchVoucherEmail,
  getPlatformSettings, updatePlatformSettings, addBookingServiceCharge, removeBookingServiceCharge, updateBookingOperations,
  changeOperatorPassword
} from '../services/apiClient';
import { 
  Building2, MapPin, DollarSign, Users, Plus, Trash2, Edit3, CheckCircle, 
  XCircle, Clock, ShieldCheck, ArrowLeft, RefreshCw, X, Eye, Phone, Mail, Car, Plane, 
  Lock, KeyRound, AlertTriangle, LogOut, Tag, Download, Filter, Search, TrendingUp, 
  Check, Percent, Send, Sliders, Receipt, PlusCircle, History, Sparkles, Key, FileSpreadsheet
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
                className="w-full py-3 bg-red-600/80 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Reset Session
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
  // Authentication states
  const [operatorUser, setOperatorUser] = useState(() => getOperatorSession());
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Portal tabs & data
  const [activeTab, setActiveTab] = useState('lots'); // 'lots' | 'orders' | 'coupons' | 'airports' | 'settings'
  const [lots, setLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [airports, setAirports] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({ bookingFee: '1.95', platformCommissionRate: '28' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);
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

  // Modal states for Airport Add
  const [airportModalOpen, setAirportModalOpen] = useState(false);
  const [airportFormData, setAirportFormData] = useState({
    code: '',
    name: '',
    city: '',
    terminalDropoffFee: '5.00',
    isActive: true
  });
  const [savingAirport, setSavingAirport] = useState(false);

  // Selected customer profile view & operations tracker
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState(null);
  const [adminEmailStatus, setAdminEmailStatus] = useState(null);
  const [operationsForm, setOperationsForm] = useState({
    parkingStatus: 'booked',
    compoundBay: '',
    keyTagNumber: '',
    mileageIn: '',
    operatorNote: ''
  });
  const [savingOperations, setSavingOperations] = useState(false);

  // Service Charges Form (Add / Subtract on invoice)
  const [newChargeForm, setNewChargeForm] = useState({ description: '', amount: '' });
  const [addingCharge, setAddingCharge] = useState(false);

  useEffect(() => {
    if (selectedCustomerOrder) {
      setOperationsForm({
        parkingStatus: selectedCustomerOrder.parkingStatus || 'booked',
        compoundBay: selectedCustomerOrder.compoundBay || '',
        keyTagNumber: selectedCustomerOrder.keyTagNumber || '',
        mileageIn: selectedCustomerOrder.mileageIn || '',
        operatorNote: ''
      });
      setNewChargeForm({ description: '', amount: '' });
    }
  }, [selectedCustomerOrder]);

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

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (failedAttempts >= 5) {
      setAuthError('Too many failed attempts. Security cooldown active. Please wait 30 seconds.');
      return;
    }

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter both operator ID and password.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    const res = await authenticateOperator(authEmail, authPassword);
    setAuthLoading(false);

    if (res && res.success) {
      setOperatorUser(res.user);
      setFailedAttempts(0);
    } else {
      setFailedAttempts(prev => prev + 1);
      setAuthError(res?.error || 'Invalid operator credentials. Access denied.');
    }
  };

  const handleLogout = () => {
    logoutOperator();
    setOperatorUser(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lotsData, bookingsData, couponsData, airportsData, settingsData] = await Promise.all([
        getAdminLots(),
        getAdminBookings(),
        getCoupons(),
        getAllAdminAirports(),
        getPlatformSettings()
      ]);
      setLots(Array.isArray(lotsData) ? lotsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
      setAirports(Array.isArray(airportsData) ? airportsData : []);
      if (settingsData) {
        setPlatformSettings({
          bookingFee: String(settingsData.bookingFee ?? '1.95'),
          platformCommissionRate: String(Math.round((settingsData.platformCommissionRate ?? 0.28) * 100))
        });
      }
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
      await fetchData();
    } catch (err) {
      alert('Error deleting compound lot: ' + err.message);
    }
  };

  // Update Booking Status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await changeBookingStatus(id, newStatus);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
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

  // Toggle Coupon Active/Inactive
  const handleToggleCoupon = async (code, currentStatus) => {
    try {
      await toggleCouponStatus(code, !currentStatus);
      setCoupons(prev => prev.map(c => c.code === code ? { ...c, isActive: !currentStatus } : c));
    } catch (err) {
      alert('Error toggling coupon status: ' + err.message);
    }
  };

  // Delete Coupon in real-time
  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to delete promo coupon "${code}"?`)) return;
    try {
      await removeCoupon(code);
      setCoupons(prev => prev.filter(c => c.code !== code));
    } catch (err) {
      alert('Error deleting coupon: ' + err.message);
    }
  };

  // Save new Airport in real-time
  const handleSaveAirport = async (e) => {
    e.preventDefault();
    setSavingAirport(true);
    try {
      await saveAirport(airportFormData);
      await fetchData();
      setAirportModalOpen(false);
      setAirportFormData({ code: '', name: '', city: '', terminalDropoffFee: '5.00', isActive: true });
    } catch (err) {
      alert('Error saving airport: ' + err.message);
    } finally {
      setSavingAirport(false);
    }
  };

  // Toggle Airport Active
  const handleToggleAirport = async (code, currentStatus) => {
    try {
      await toggleAirportStatus(code, !currentStatus);
      setAirports(prev => prev.map(a => a.code === code ? { ...a, isActive: !currentStatus } : a));
    } catch (err) {
      alert('Error toggling airport status: ' + err.message);
    }
  };

  // Delete Airport in real-time
  const handleDeleteAirport = async (code) => {
    if (!window.confirm(`Are you sure you want to remove airport "${code}" from the database?`)) return;
    try {
      await removeAirport(code);
      setAirports(prev => prev.filter(a => a.code !== code));
    } catch (err) {
      alert('Error deleting airport: ' + err.message);
    }
  };

  // Save Platform Settings (Booking Fee & Commission)
  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updatePlatformSettings({
        bookingFee: parseFloat(platformSettings.bookingFee) || 1.95,
        platformCommissionRate: (parseFloat(platformSettings.platformCommissionRate) || 28) / 100
      });
      alert('Platform settings saved successfully! All live quotes will now calculate with the new booking fee.');
      await fetchData();
    } catch (err) {
      alert('Error saving platform settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordStatus({ success: false, message: 'Please enter current and new password.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ success: false, message: 'New password and confirmation do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordStatus({ success: false, message: 'Password or PIN must be at least 4 characters.' });
      return;
    }

    setSavingPassword(true);
    const res = await changeOperatorPassword(
      operatorUser?.username || 'admin@airportparkingdeals.uk',
      passwordForm.currentPassword,
      passwordForm.newPassword
    );
    setSavingPassword(false);

    if (res && res.success) {
      setPasswordStatus({ success: true, message: 'Password updated in database successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordStatus({ success: false, message: res?.error || 'Failed to update password.' });
    }
  };

  // Save Vehicle Operations Status (Check-in, Bay, Key Tag, Mileage)
  const handleSaveOperationsTracker = async (bookingId) => {
    setSavingOperations(true);
    try {
      const updated = await updateBookingOperations(bookingId, {
        parkingStatus: operationsForm.parkingStatus,
        compoundBay: operationsForm.compoundBay,
        keyTagNumber: operationsForm.keyTagNumber,
        mileageIn: operationsForm.mileageIn,
        note: operationsForm.operatorNote
      });
      setSelectedCustomerOrder(updated);
      setOperationsForm(prev => ({ ...prev, operatorNote: '' }));
      await fetchData();
      alert('Vehicle operations status, bay location, and key tag updated!');
    } catch (err) {
      alert('Failed to update operations: ' + err.message);
    } finally {
      setSavingOperations(false);
    }
  };

  // Add Service Charge or Courtesy Credit
  const handleAddCharge = async (bookingId) => {
    if (!newChargeForm.description.trim() || !newChargeForm.amount) {
      alert('Please provide a description and amount.');
      return;
    }
    setAddingCharge(true);
    try {
      const updated = await addBookingServiceCharge(bookingId, {
        description: newChargeForm.description,
        amount: parseFloat(newChargeForm.amount)
      });
      setSelectedCustomerOrder(updated);
      setNewChargeForm({ description: '', amount: '' });
      await fetchData();
    } catch (err) {
      alert('Failed to add service charge: ' + err.message);
    } finally {
      setAddingCharge(false);
    }
  };

  // Remove Service Charge
  const handleRemoveCharge = async (bookingId, chargeId) => {
    if (!window.confirm('Are you sure you want to remove this charge adjustment?')) return;
    try {
      const updated = await removeBookingServiceCharge(bookingId, chargeId);
      setSelectedCustomerOrder(updated);
      await fetchData();
    } catch (err) {
      alert('Failed to remove charge: ' + err.message);
    }
  };

  // Resend email to customer from Admin
  const handleAdminResendEmail = async (booking) => {
    setAdminEmailStatus('Dispatching updated voucher via Resend...');
    try {
      const res = await dispatchVoucherEmail(booking);
      if (res && res.success) {
        setAdminEmailStatus(`✓ Dispatched to ${res.recipient || booking.customerEmail}`);
      } else {
        setAdminEmailStatus(`Notice: ${res?.message || 'Queued'}`);
      }
      setTimeout(() => setAdminEmailStatus(null), 5000);
    } catch (err) {
      setAdminEmailStatus('Dispatch failed: ' + err.message);
    }
  };

  // Helper to trigger CSV download
  const downloadCSV = (headers, rows, filename) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export Full Booking Ledger
  const handleExportFullLedger = () => {
    if (safeBookings.length === 0) {
      alert('No booking records to export.');
      return;
    }
    const headers = [
      'Booking Ref', 'Customer Name', 'Email', 'Phone', 'ANPR Vehicle Plate',
      'Flight Number', 'Airport', 'Service Package', 'Parking Lifecycle Status',
      'Compound Bay', 'Key Tag Locker', 'Mileage In', 'Booking Admin Fee (£)',
      'Total Charged (£)', 'Booking Status', 'Booking Timestamp'
    ];
    const rows = safeBookings.map(b => [
      `"${b.id}"`,
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      `"${b.customerEmail || ''}"`,
      `"${b.customerPhone || ''}"`,
      `"${b.vehicleReg || 'N/A'}"`,
      `"${b.flightNumber || 'None'}"`,
      `"${b.airport}"`,
      `"${(b.serviceName || '').replace(/"/g, '""')}"`,
      `"${b.parkingStatus || 'booked'}"`,
      `"${b.compoundBay || 'Unassigned'}"`,
      `"${b.keyTagNumber || 'N/A'}"`,
      `"${b.mileageIn || 'N/A'}"`,
      `"${parseFloat(b.bookingFee || 1.95).toFixed(2)}"`,
      `"${parseFloat(b.totalCharged || 0).toFixed(2)}"`,
      `"${b.status || 'confirmed'}"`,
      `"${b.createdAt || ''}"`
    ]);
    downloadCSV(headers, rows, `AirPark_Full_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 2. Export Gate Barrier ANPR Manifest
  const handleExportBarrierManifest = () => {
    if (safeBookings.length === 0) {
      alert('No booking records to export.');
      return;
    }
    const headers = ['Vehicle Plate (ANPR)', 'Compound Bay', 'Key Tag', 'Parking Status', 'Customer Name', 'Customer Phone', 'Flight Number', 'Airport', 'Booking Reference'];
    const rows = safeBookings.map(b => [
      `"${b.vehicleReg || 'N/A'}"`,
      `"${b.compoundBay || 'Unassigned'}"`,
      `"${b.keyTagNumber || 'N/A'}"`,
      `"${(b.parkingStatus || 'booked').toUpperCase()}"`,
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      `"${b.customerPhone || ''}"`,
      `"${b.flightNumber || 'None'}"`,
      `"${b.airport}"`,
      `"${b.id}"`
    ]);
    downloadCSV(headers, rows, `Gate_Barrier_ANPR_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 3. Export Financial Reconciliation
  const handleExportFinancialReconciliation = () => {
    if (safeBookings.length === 0) {
      alert('No booking records to export.');
      return;
    }
    const headers = ['Booking Date', 'Booking Ref', 'Airport', 'Service Package', 'Gross Charged (£)', 'Booking Admin Fee (£)', 'Operator Yard Net (£)', 'Platform Commission (£)', 'Payment Status'];
    const rows = safeBookings.map(b => {
      const gross = parseFloat(b.totalCharged || 0);
      const fee = parseFloat(b.bookingFee || 1.95);
      const net = parseFloat(b.operatorNet || (gross * 0.72));
      const comm = parseFloat(b.commissionEarned || (gross * 0.28));
      return [
        `"${b.createdAt?.split('T')[0] || ''}"`,
        `"${b.id}"`,
        `"${b.airport}"`,
        `"${(b.serviceName || '').replace(/"/g, '""')}"`,
        `"${gross.toFixed(2)}"`,
        `"${fee.toFixed(2)}"`,
        `"${net.toFixed(2)}"`,
        `"${comm.toFixed(2)}"`,
        `"${b.status || 'confirmed'}"`
      ];
    });
    downloadCSV(headers, rows, `Financial_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Safe Fallbacks
  const safeLots = Array.isArray(lots) ? lots : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeCoupons = Array.isArray(coupons) ? coupons : [];
  const safeAirports = Array.isArray(airports) ? airports : [];

  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Financial KPI calculations
  const totalGrossRevenue = safeBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + parseFloat(b.totalCharged || 0), 0);
  const platformCommissionEstimate = totalGrossRevenue * ((parseFloat(platformSettings.platformCommissionRate) || 28) / 100);
  const totalOperatorYardPool = totalGrossRevenue - platformCommissionEstimate;
  const activeVehiclesCount = safeBookings.filter(b => b.status === 'confirmed').length;

  // Filtered lots
  const filteredLots = safeLots.filter(l => {
    if (lotAirportFilter === 'ALL') return true;
    return l.airportCode === lotAirportFilter;
  });

  // Filtered orders with search & status & airport filters
  const filteredBookings = safeBookings.filter(b => {
    const query = orderSearchQuery.trim().toLowerCase();
    const matchQuery = !query || 
      (b.customerName || '').toLowerCase().includes(query) ||
      (b.customerEmail || '').toLowerCase().includes(query) ||
      (b.customerPhone || '').toLowerCase().includes(query) ||
      (b.vehicleReg || '').toLowerCase().includes(query) ||
      (b.flightNumber || '').toLowerCase().includes(query) ||
      (b.compoundBay || '').toLowerCase().includes(query) ||
      (b.keyTagNumber || '').toLowerCase().includes(query) ||
      (b.id || '').toLowerCase().includes(query);

    const matchAirport = orderAirportFilter === 'ALL' || b.airport === orderAirportFilter;
    const matchStatus = orderStatusFilter === 'ALL' || b.status === orderStatusFilter;

    return matchQuery && matchAirport && matchStatus;
  });

  // Status visual map
  const parkingStatusConfig = {
    booked: { label: 'Awaiting Arrival', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
    vehicle_received: { label: 'Checked In', bg: 'bg-blue-100 text-[#061F75] border-blue-300' },
    parked_compound: { label: 'In Compound', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
    ready_for_return: { label: 'At Forecourt', bg: 'bg-purple-100 text-purple-900 border-purple-300' },
    picked_up: { label: 'Picked Up', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100 text-red-900 border-red-300' }
  };

  // --- 1. RENDER AUTHENTICATION FORM IF NOT LOGGED IN ---
  if (!operatorUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#061F75] to-slate-900 text-white flex flex-col justify-center items-center p-4 selection:bg-[#C8102E] selection:text-white">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#061F75] via-[#C8102E] to-[#FFB400]" />

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#061F75] to-[#C8102E] p-0.5 mx-auto mb-3 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Lock className="w-8 h-8 text-[#FFB400]" />
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#C8102E] block">
              AUTHORISED OPERATOR PORTAL
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Airport Parking Deals UK</h1>
            <p className="text-xs text-slate-400 mt-1">Enter your operator credentials to access compound controls</p>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-700/60 text-xs font-semibold text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Secure Login Form (Zero displayed passwords) */}
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
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-[#C8102E] focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Security Password or PIN
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-[#C8102E] focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-white font-medium tracking-wider"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] hover:from-[#0B2EA2] hover:to-[#A60D25] text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-900/40 cursor-pointer disabled:opacity-50 mt-2"
            >
              {authLoading ? 'Verifying PostgreSQL Credentials...' : 'Sign In to Operator Dashboard'}
            </button>
          </form>

          {/* Return link */}
          <div className="mt-6 text-center">
            <button
              onClick={onBackToStorefront}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Comparison Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. RENDER AUTHENTICATED OPERATOR PORTAL ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#C8102E] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#061F75] text-white shadow-md border-b-2 border-[#C8102E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStorefront}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Return to customer comparison site"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <span className="text-sm font-black tracking-wide text-white">
                Airport Parking <span className="text-[#C8102E]">Deals</span>
              </span>
              <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#C8102E] text-white tracking-wider">
                Operator Master Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {realtimeActive && (
              <span className="hidden md:flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-1 rounded-full font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL Realtime Sync
              </span>
            )}
            <span className="hidden sm:inline text-blue-200 font-medium">
              Signed in as: <strong className="text-white">{operatorUser.username}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-600/80 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs shadow-sm"
              title="Logout from operator dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Navigation & Tab Controls */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm sticky top-16 z-30">
        <div className="flex flex-wrap items-center gap-2">
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

          <button
            onClick={() => setActiveTab('airports')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'airports'
                ? 'bg-[#061F75] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plane className="w-4 h-4 text-amber-400" />
            <span>Airports &amp; Terminals ({safeAirports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
              activeTab === 'settings'
                ? 'bg-[#061F75] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Platform Fees &amp; Config</span>
          </button>
        </div>

        {/* Global Action on Orders: 3 Quick Export Options */}
        {activeTab === 'orders' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportFullLedger}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#061F75] text-xs font-bold transition-all border border-blue-200 cursor-pointer shadow-sm"
              title="Export complete reservations database with passenger details and payment breakdown"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#061F75]" />
              <span>Full Ledger (CSV)</span>
            </button>
            <button
              onClick={handleExportBarrierManifest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 cursor-pointer shadow-sm"
              title="Export ANPR vehicle roster for compound security barrier guards"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Gate Barrier Manifest (CSV)</span>
            </button>
            <button
              onClick={handleExportFinancialReconciliation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 cursor-pointer shadow-sm"
              title="Export financial accounting reconciliation of yard payouts and commissions"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Financial Audit (CSV)</span>
            </button>
          </div>
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
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Platform Commission ({platformSettings.platformCommissionRate}%)
            </span>
            <div className="text-2xl font-black text-[#C8102E]">£{formatPrice(platformCommissionEstimate)}</div>
            <span className="text-[10px] text-slate-500 block mt-1">Net Platform Retained Share</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Operator Compound Pool</span>
            <div className="text-2xl font-black text-emerald-700">£{formatPrice(totalOperatorYardPool)}</div>
            <span className="text-[10px] text-slate-500 block mt-1">Yard Operator Payable Funds</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Active Bookings (ANPR)</span>
            <div className="text-2xl font-black text-slate-900">{activeVehiclesCount}</div>
            <span className="text-[10px] text-slate-500 block mt-1">Confirmed Compound Passes</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-[#061F75]" />
            <span className="font-bold text-sm">Querying Supabase PostgreSQL cluster...</span>
          </div>
        ) : (
          <div>
            {/* TAB 1: PARKING LOTS & RATES */}
            {activeTab === 'lots' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-[#061F75]">Compound Parking Locations &amp; Daily Tariffs</h2>
                    <p className="text-xs text-slate-500">
                      Manage operator compound rates, terminal valet forecourts, and shuttle frequencies.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenLotModal(null)}
                    className="px-5 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Compound Location</span>
                  </button>
                </div>

                {/* Airport Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-500 px-2 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Airport:
                  </span>
                  <button
                    onClick={() => setLotAirportFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                      lotAirportFilter === 'ALL' ? 'bg-[#061F75] text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ALL
                  </button>
                  {safeAirports.filter(a => a.isActive).map((ap) => (
                    <button
                      key={ap.code}
                      onClick={() => setLotAirportFilter(ap.code)}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                        lotAirportFilter === ap.code ? 'bg-[#061F75] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {ap.name} ({ap.code})
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-4 px-5">Airport</th>
                          <th className="py-4 px-5">Service Name &amp; Yard Location</th>
                          <th className="py-4 px-5">Type</th>
                          <th className="py-4 px-5">Base Daily Rate</th>
                          <th className="py-4 px-5">7-Day Total</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredLots.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No parking lots found matching your filter. Click &quot;+ Add New Compound Location&quot; to add one.
                            </td>
                          </tr>
                        ) : (
                          filteredLots.map((l) => (
                            <tr key={l.id} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-4 px-5 font-bold text-[#061F75]">
                                <span className="bg-blue-100 px-2 py-1 rounded text-xs">{l.airportCode}</span>
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-black text-slate-900 text-sm">{l.name}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#C8102E]" />
                                  <span>{l.yardLocation || 'Perimeter Compound Yard'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
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

            {/* TAB 2: BOOKINGS, ORDERS & PARKING STATUS TRACKER */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search by customer, plate, bay, tag, or reference..."
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
                      {safeAirports.map(ap => (
                        <option key={ap.code} value={ap.code}>{ap.name} ({ap.code})</option>
                      ))}
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
                          <th className="py-4 px-5">Vehicle &amp; Parking Status</th>
                          <th className="py-4 px-5">Airport &amp; Service</th>
                          <th className="py-4 px-5">Total Paid</th>
                          <th className="py-4 px-5">Booking Status</th>
                          <th className="py-4 px-5 text-right">Dossier / Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-12 text-center text-slate-400">
                              No customer reservations match your search or filter.
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((b) => {
                            const pStatus = parkingStatusConfig[b.parkingStatus] || parkingStatusConfig.booked;
                            return (
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
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${pStatus.bg}`}>
                                      {pStatus.label}
                                    </span>
                                    {b.compoundBay && (
                                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                        Bay: {b.compoundBay}
                                      </span>
                                    )}
                                  </div>
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
                                    onClick={() => { setSelectedCustomerOrder(b); setAdminEmailStatus(null); }}
                                    className="p-2 rounded-xl bg-blue-50 text-[#061F75] hover:bg-blue-100 transition-colors cursor-pointer"
                                    title="Open Customer Dossier & Manage Operations"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
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
                      Create, toggle, and remove discount codes. Disabled codes are immediately rejected on storefront quotes.
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

            {/* TAB 4: AIRPORTS & TERMINALS */}
            {activeTab === 'airports' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-[#061F75]">Served UK Airports &amp; Port Locations</h2>
                    <p className="text-xs text-slate-500">
                      Add new airports or disable airports you do not currently serve. Disabled airports are immediately hidden from customer search.
                    </p>
                  </div>
                  <button
                    onClick={() => setAirportModalOpen(true)}
                    className="px-5 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Airport</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-4 px-5">IATA Code</th>
                          <th className="py-4 px-5">Airport Name</th>
                          <th className="py-4 px-5">City / Region</th>
                          <th className="py-4 px-5">Terminal Dropoff Fee</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {safeAirports.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No airports loaded. Click &quot;+ Add New Airport&quot; above to add one.
                            </td>
                          </tr>
                        ) : (
                          safeAirports.map((a) => (
                            <tr key={a.code} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-4 px-5">
                                <span className="bg-blue-100 text-[#061F75] px-3 py-1.5 rounded-lg font-mono font-black text-xs border border-blue-200">
                                  {a.code}
                                </span>
                              </td>
                              <td className="py-4 px-5 font-bold text-slate-900 text-sm">
                                {a.name}
                              </td>
                              <td className="py-4 px-5 text-slate-600 font-medium">
                                {a.city}
                              </td>
                              <td className="py-4 px-5 font-bold text-slate-800">
                                £{formatPrice(a.terminalDropoffFee)}
                              </td>
                              <td className="py-4 px-5">
                                <button
                                  onClick={() => handleToggleAirport(a.code, a.isActive)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                    a.isActive
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                  }`}
                                  title="Click to toggle active status"
                                >
                                  {a.isActive ? '● Active (Serving)' : '○ Disabled (Hidden)'}
                                </button>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <button
                                  onClick={() => handleDeleteAirport(a.code)}
                                  className="p-2 rounded-xl bg-red-50 text-[#C8102E] hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Delete Airport"
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

            {/* TAB 5: PLATFORM FEES & GLOBAL SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
                    <div className="p-2.5 rounded-2xl bg-blue-50 text-[#061F75]">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#061F75]">Platform Fee &amp; Commission Configuration</h2>
                      <p className="text-xs text-slate-500">
                        Configure universal booking &amp; administration fees and platform commission rates.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePlatformSettings} className="space-y-5 text-xs font-bold text-slate-700">
                    <div>
                      <label className="block mb-1.5 text-slate-900 text-sm">
                        Booking &amp; Administration Fee (£) *
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2 font-normal">
                        Added to every reservation during quotation and checkout to cover payment gateways, operational infrastructure, and customer support.
                      </p>
                      <div className="relative flex items-center max-w-xs">
                        <span className="absolute left-3.5 text-slate-500 font-bold text-sm">£</span>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          required
                          value={platformSettings.bookingFee}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, bookingFee: e.target.value })}
                          className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-black text-sm outline-none focus:border-[#061F75] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="block mb-1.5 text-slate-900 text-sm">
                        Platform Commission Rate (%) *
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2 font-normal">
                        Percentage retained by the platform from each compound yard booking gross total.
                      </p>
                      <div className="relative flex items-center max-w-xs">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          required
                          value={platformSettings.platformCommissionRate}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, platformCommissionRate: e.target.value })}
                          className="w-full pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-black text-sm outline-none focus:border-[#061F75] focus:bg-white"
                        />
                        <span className="absolute right-3.5 text-slate-500 font-bold text-sm">%</span>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-6 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{savingSettings ? 'Saving to Database...' : 'Save Platform Settings'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Operator Password & Database Credentials Management */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
                    <div className="p-2.5 rounded-2xl bg-red-50 text-[#C8102E]">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#061F75]">Operator Security Credentials (PostgreSQL)</h2>
                      <p className="text-xs text-slate-500">
                        Update your master password or PIN securely in the database.
                      </p>
                    </div>
                  </div>

                  {passwordStatus && (
                    <div className={`mb-5 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                      passwordStatus.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {passwordStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                      <span>{passwordStatus.message}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-bold text-slate-700">
                    <div>
                      <label className="block mb-1 text-slate-900 text-xs">
                        Logged-in Operator ID
                      </label>
                      <input
                        type="text"
                        disabled
                        value={operatorUser?.username || 'admin@airportparkingdeals.uk'}
                        className="w-full max-w-xs px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono text-xs cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-slate-900 text-xs">
                        Current Password or PIN *
                      </label>
                      <input
                        type="password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter current password or PIN"
                        className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-[#061F75]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                      <div>
                        <label className="block mb-1 text-slate-900 text-xs">
                          New Password or PIN *
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="At least 4 characters"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-[#061F75]"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-slate-900 text-xs">
                          Confirm New Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Re-enter new password"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-[#061F75]"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] hover:from-[#0B2EA2] hover:to-[#A60D25] text-white font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{savingPassword ? 'Updating Database...' : 'Update Password in PostgreSQL'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT LOCATION LOT */}
      {lotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  COMPOUND MANAGEMENT
                </span>
                <h3 className="text-lg font-black text-[#061F75]">
                  {editingLot ? 'Edit Compound Location & Tariff' : 'Add New Airport Compound Location'}
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
                    {safeAirports.map(a => (
                      <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
                    ))}
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
                    step="1"
                    min="1"
                    max="90"
                    required
                    placeholder="e.g. 15"
                    value={couponFormData.discountPercentage}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountPercentage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold outline-none focus:border-[#061F75]"
                  />
                </div>

                <div>
                  <label className="block mb-1">Min Duration (Days) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 1"
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

              <div className="pt-4 flex gap-3">
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
                  {savingCoupon ? 'Creating...' : 'Activate Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW AIRPORT */}
      {airportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  AIRPORT NETWORK
                </span>
                <h3 className="text-lg font-black text-[#061F75]">Add New Served Airport</h3>
              </div>
              <button
                onClick={() => setAirportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAirport} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">IATA Code (3 Letters) *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. CWL"
                    value={airportFormData.code}
                    onChange={(e) => setAirportFormData({ ...airportFormData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-black uppercase outline-none focus:border-[#061F75]"
                  />
                </div>

                <div>
                  <label className="block mb-1">Dropoff Fee (£)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    placeholder="5.00"
                    value={airportFormData.terminalDropoffFee}
                    onChange={(e) => setAirportFormData({ ...airportFormData, terminalDropoffFee: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Airport Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiff International Airport"
                  value={airportFormData.name}
                  onChange={(e) => setAirportFormData({ ...airportFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              <div>
                <label className="block mb-1">City / Region *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiff, Wales"
                  value={airportFormData.city}
                  onChange={(e) => setAirportFormData({ ...airportFormData, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAirportModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAirport}
                  className="w-1/2 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingAirport ? 'Saving...' : 'Add Airport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER DOSSIER & OPERATIONS / INVOICE CONTROL CENTER */}
      {selectedCustomerOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  OPERATIONS &amp; INVOICE DOSSIER
                </span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{selectedCustomerOrder.customerName || 'Customer Record'}</span>
                  <span className="text-xs font-mono font-bold text-[#061F75] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedCustomerOrder.id}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Status Notification */}
            {adminEmailStatus && (
              <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[#061F75] font-bold text-xs flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#061F75]" />
                <span>{adminEmailStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Left Column: Customer Profile & Vehicle Operations Tracker */}
              <div className="space-y-4">
                {/* Contact Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-xs mb-1 flex items-center justify-between">
                    <span>Passenger Information</span>
                    <span className="text-[10px] uppercase font-mono bg-blue-100 text-[#061F75] px-2 py-0.5 rounded">
                      Airport: {selectedCustomerOrder.airport}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-[#061F75] shrink-0" />
                    <span>{selectedCustomerOrder.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{selectedCustomerOrder.customerPhone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Car className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>ANPR Plate: <strong className="font-mono bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-slate-900">{selectedCustomerOrder.vehicleReg || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Plane className="w-4 h-4 text-[#061F75] shrink-0" />
                    <span>Flight: <strong>{selectedCustomerOrder.flightNumber || 'None specified'}</strong></span>
                  </div>
                </div>

                {/* Operations Tracker Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-[#061F75] text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#061F75]" />
                      <span>Yard &amp; Vehicle Status Tracker</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Live Yard Synchronization</span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Vehicle Lifecycle Status
                    </label>
                    <select
                      value={operationsForm.parkingStatus}
                      onChange={(e) => setOperationsForm({ ...operationsForm, parkingStatus: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#061F75]"
                    >
                      <option value="booked">Awaiting Arrival (Customer Traveling)</option>
                      <option value="vehicle_received">Vehicle Checked-In (Keys Handed Over)</option>
                      <option value="parked_compound">Safely Parked in Compound Bay</option>
                      <option value="ready_for_return">Dispatched to Terminal Forecourt for Pickup</option>
                      <option value="picked_up">Vehicle Picked Up &amp; Customer Departed</option>
                      <option value="cancelled">Cancelled / No Show</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Compound Bay
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bay A-14"
                        value={operationsForm.compoundBay}
                        onChange={(e) => setOperationsForm({ ...operationsForm, compoundBay: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none focus:border-[#061F75]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Key Tag Locker #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tag #204"
                        value={operationsForm.keyTagNumber}
                        onChange={(e) => setOperationsForm({ ...operationsForm, keyTagNumber: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none focus:border-[#061F75]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Vehicle Mileage In (Check-in)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 45,210 miles"
                      value={operationsForm.mileageIn}
                      onChange={(e) => setOperationsForm({ ...operationsForm, mileageIn: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#061F75]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Add Event Log / Handover Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Keys safely tagged in locker 12"
                      value={operationsForm.operatorNote}
                      onChange={(e) => setOperationsForm({ ...operationsForm, operatorNote: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#061F75]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={savingOperations}
                    onClick={() => handleSaveOperationsTracker(selectedCustomerOrder.id)}
                    className="w-full py-2.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {savingOperations ? 'Updating Operations...' : 'Save Operations Status'}
                  </button>

                  {/* Activity History Audit Trail */}
                  {Array.isArray(selectedCustomerOrder.statusHistory) && selectedCustomerOrder.statusHistory.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2 flex items-center gap-1">
                        <History className="w-3 h-3 text-slate-400" />
                        Audit History Timeline
                      </span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedCustomerOrder.statusHistory.map((item, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] space-y-0.5">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span className="uppercase text-[#061F75]">{item.status}</span>
                              <span className="text-slate-400 font-mono">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-600">{item.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Invoice, Service Charges (Add/Subtract), and Dispatch */}
              <div className="space-y-4">
                {/* Invoice Breakdown Card */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-slate-700 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                    <span className="font-extrabold text-[#061F75] text-xs flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#061F75]" />
                      <span>Invoice &amp; Surcharges Breakdown</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Prepaid
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Base Parking Rate:</span>
                      <strong className="text-slate-900">
                        £{(parseFloat(selectedCustomerOrder.totalCharged || 0) - parseFloat(selectedCustomerOrder.bookingFee || 1.95) - (Array.isArray(selectedCustomerOrder.serviceCharges) ? selectedCustomerOrder.serviceCharges.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0) : 0)).toFixed(2)}
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600">Booking &amp; Administration Fee:</span>
                      <strong className="text-slate-900">£{formatPrice(selectedCustomerOrder.bookingFee || platformSettings.bookingFee || 1.95)}</strong>
                    </div>

                    {/* Surcharges and Adjustments List */}
                    {Array.isArray(selectedCustomerOrder.serviceCharges) && selectedCustomerOrder.serviceCharges.map((sc) => (
                      <div key={sc.id} className="flex justify-between items-center py-1 border-t border-blue-200/60 font-sans">
                        <div>
                          <span className="font-bold text-slate-800">{sc.description}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Added: {new Date(sc.addedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${sc.amount >= 0 ? 'text-[#061F75]' : 'text-emerald-700'}`}>
                            {sc.amount >= 0 ? '+' : ''}£{parseFloat(sc.amount).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCharge(selectedCustomerOrder.id, sc.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                            title="Remove surcharge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between font-black text-sm text-[#061F75] pt-2 border-t-2 border-blue-300">
                      <span>Total Amount Prepaid:</span>
                      <span className="text-emerald-700 font-mono text-base">£{formatPrice(selectedCustomerOrder.totalCharged)}</span>
                    </div>
                  </div>
                </div>

                {/* Form to Add or Subtract Surcharge / Service Fee */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                  <div className="font-extrabold text-[#061F75] text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4 text-[#C8102E]" />
                      <span>Add / Subtract Surcharge or Service Fee</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Updates Customer Voucher</span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Add optional service items (e.g. Valet Wash +£25.00, EV Fast Charge +£10.00, Out of Hours +£15.00) or subtract goodwill discount (-£10.00).
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Charge Description *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Valet Exterior Wash or Out of Hours Fee"
                        value={newChargeForm.description}
                        onChange={(e) => setNewChargeForm({ ...newChargeForm, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#061F75]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Amount in £ (Positive to Add, Negative to Subtract) *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-500 font-bold text-xs">£</span>
                        <input
                          type="number"
                          step="0.50"
                          placeholder="e.g. 15.00 or -10.00"
                          value={newChargeForm.amount}
                          onChange={(e) => setNewChargeForm({ ...newChargeForm, amount: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono outline-none focus:border-[#061F75]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={addingCharge}
                      onClick={() => handleAddCharge(selectedCustomerOrder.id)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {addingCharge ? 'Applying Adjustment...' : '+ Apply Adjustment to Invoice'}
                    </button>
                  </div>
                </div>

                {/* Dispatch Controls */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdminResendEmail(selectedCustomerOrder)}
                    className="w-1/2 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#061F75] border border-blue-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Email Updated Voucher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerOrder(null)}
                    className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
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
