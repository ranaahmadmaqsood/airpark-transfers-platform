import React, { useState, useEffect, Component } from 'react';
import { 
  getAdminLots, saveAdminLot, removeAdminLot, getAdminBookings, changeBookingStatus,
  authenticateOperator, getOperatorSession, logoutOperator, subscribeToParkingLots,
  getCoupons, saveCoupon, removeCoupon, toggleCouponStatus,
  getAllAdminAirports, saveAirport, toggleAirportStatus, removeAirport, dispatchVoucherEmail,
  getPlatformSettings, updatePlatformSettings, addBookingServiceCharge, removeBookingServiceCharge, updateBookingOperations,
  changeOperatorPassword,
  getExtraServices, saveExtraService, toggleExtraServiceStatus, removeExtraService
} from '../services/apiClient';
import { 
  Building2, MapPin, DollarSign, Users, Plus, Trash2, Edit3, CheckCircle, CheckCircle2,
  XCircle, Clock, ShieldCheck, ArrowLeft, RefreshCw, X, Eye, Phone, Mail, Car, Plane, 
  Lock, KeyRound, AlertTriangle, LogOut, Tag, Download, Filter, Search, TrendingUp, 
  Check, Percent, Send, Sliders, Receipt, PlusCircle, History, Sparkles, Key, FileSpreadsheet,
  LayoutDashboard, Menu, ChevronRight
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
    console.error('Admin Dashboard Error Caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">Operator Portal Encountered an Issue</h1>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            An unexpected error occurred in the dashboard interface. Your session and PostgreSQL records are safe.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#061F75] hover:bg-[#0B2EA2] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
            >
              Reload Dashboard
            </button>
            <button
              onClick={() => {
                logoutOperator();
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-red-600/80 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Reset Session
            </button>
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

  // Portal tabs & data: 'dashboard' | 'orders' | 'lots' | 'airports' | 'coupons' | 'settings' | 'security'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [lots, setLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [airports, setAirports] = useState([]);
  const [extraServices, setExtraServices] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({ bookingFee: '1.95', platformCommissionRate: '28' });
  const [savingSettings, setSavingSettings] = useState(false);

  // Password & Security Management
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Extra Add-on Services Form
  const [newExtraForm, setNewExtraForm] = useState({ name: '', description: '', price: '', isActive: true });
  const [savingExtra, setSavingExtra] = useState(false);

  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);

  // Filters
  const [lotAirportFilter, setLotAirportFilter] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderAirportFilter, setOrderAirportFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderParkingFilter, setOrderParkingFilter] = useState('ALL');

  // Modal states for Location Add / Edit
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [lotFormData, setLotFormData] = useState({
    airportCode: 'LHR',
    name: '',
    operatorName: 'Airport Parking Deals Express',
    type: 'park_and_ride',
    baseDailyRate: '8.50',
    operatorNetRate: '3.50',
    transferDurationMinutes: 10,
    transferFrequencyMinutes: 15,
    distanceMiles: 1.5,
    parkMarkAccredited: true,
    features: ['24/7 Security CCTV', 'Barrier Control ANPR', 'Fenced Compound']
  });
  const [savingLot, setSavingLot] = useState(false);

  // Modal states for Coupons Add
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [newCouponData, setNewCouponData] = useState({
    code: '',
    discountPercentage: '10',
    description: '',
    minDays: '1',
    isActive: true
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Modal states for Airport Add / Edit
  const [airportModalOpen, setAirportModalOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState(null);
  const [airportFormData, setAirportFormData] = useState({
    code: '',
    name: '',
    city: '',
    terminalDropoffFee: '5.00',
    terminals: ['Main Terminal'],
    isActive: true
  });
  const [newTerminalInput, setNewTerminalInput] = useState('');
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
      const unsub = subscribeToParkingLots((updatedLots) => {
        setLots(updatedLots);
        setRealtimeActive(true);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
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
      setAuthError('Please enter both operator email and password.');
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
      setAuthError(res?.error || 'Invalid operator email or password. Access denied.');
    }
  };

  const handleLogout = () => {
    logoutOperator();
    setOperatorUser(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lotsData, bookingsData, couponsData, airportsData, settingsData, extrasData] = await Promise.all([
        getAdminLots(),
        getAdminBookings(),
        getCoupons(),
        getAllAdminAirports(),
        getPlatformSettings(),
        getExtraServices(false)
      ]);
      setLots(Array.isArray(lotsData) ? lotsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setCoupons(Array.isArray(couponsData) ? couponsData : []);
      setAirports(Array.isArray(airportsData) ? airportsData : []);
      setExtraServices(Array.isArray(extrasData) ? extrasData : []);
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
        type: lot.type || 'park_and_ride',
        baseDailyRate: String(lot.baseDailyRate || '8.50'),
        operatorNetRate: String(lot.operatorNetRate || '3.50'),
        transferDurationMinutes: lot.transferDurationMinutes || 10,
        transferFrequencyMinutes: lot.transferFrequencyMinutes || 15,
        distanceMiles: lot.distanceMiles || 1.5,
        parkMarkAccredited: lot.parkMarkAccredited !== false,
        features: Array.isArray(lot.features) ? lot.features : ['24/7 Security CCTV', 'Barrier Control ANPR']
      });
    } else {
      setEditingLot(null);
      setLotFormData({
        airportCode: 'LHR',
        name: '',
        operatorName: 'Airport Parking Deals Express',
        type: 'park_and_ride',
        baseDailyRate: '8.50',
        operatorNetRate: '3.50',
        transferDurationMinutes: 10,
        transferFrequencyMinutes: 15,
        distanceMiles: 1.5,
        parkMarkAccredited: true,
        features: ['24/7 Security CCTV', 'Barrier Control ANPR', 'Fenced Compound']
      });
    }
    setLotModalOpen(true);
  };

  const handleSaveLot = async (e) => {
    e.preventDefault();
    if (!lotFormData.name.trim() || !lotFormData.baseDailyRate) {
      alert('Please fill in required fields (Compound Name, Daily Rate)');
      return;
    }

    setSavingLot(true);
    try {
      const payload = {
        id: editingLot ? editingLot.id : undefined,
        airportCode: lotFormData.airportCode,
        name: lotFormData.name,
        operatorName: lotFormData.operatorName,
        type: lotFormData.type,
        baseDailyRate: parseFloat(lotFormData.baseDailyRate),
        operatorNetRate: parseFloat(lotFormData.operatorNetRate) || 3.50,
        transferDurationMinutes: parseInt(lotFormData.transferDurationMinutes, 10),
        transferFrequencyMinutes: parseInt(lotFormData.transferFrequencyMinutes, 10),
        distanceMiles: parseFloat(lotFormData.distanceMiles),
        parkMarkAccredited: lotFormData.parkMarkAccredited,
        features: lotFormData.features
      };

      await saveAdminLot(payload);
      setLotModalOpen(false);
      setEditingLot(null);
      await fetchData();
    } catch (err) {
      alert('Error saving compound lot: ' + err.message);
    } finally {
      setSavingLot(false);
    }
  };

  const handleDeleteLot = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from live comparison search?`)) return;
    try {
      await removeAdminLot(id);
      setLots(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert('Error deleting compound lot: ' + err.message);
    }
  };

  // Status Change for Bookings
  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      await changeBookingStatus(bookingId, newStatus);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      if (selectedCustomerOrder && selectedCustomerOrder.id === bookingId) {
        setSelectedCustomerOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Error updating reservation status: ' + err.message);
    }
  };

  // Save Coupon
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponData.code.trim() || !newCouponData.discountPercentage) {
      alert('Please enter promo code and discount percentage');
      return;
    }

    setSavingCoupon(true);
    try {
      await saveCoupon({
        code: newCouponData.code,
        discountPercentage: parseFloat(newCouponData.discountPercentage),
        description: newCouponData.description,
        minDays: parseInt(newCouponData.minDays, 10) || 1,
        isActive: newCouponData.isActive
      });
      setCouponModalOpen(false);
      setNewCouponData({ code: '', discountPercentage: '10', description: '', minDays: '1', isActive: true });
      await fetchData();
    } catch (err) {
      alert('Error saving coupon: ' + err.message);
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (code, currentStatus) => {
    try {
      await toggleCouponStatus(code, !currentStatus);
      setCoupons(prev => prev.map(c => c.code === code ? { ...c, isActive: !currentStatus } : c));
    } catch (err) {
      alert('Error updating coupon: ' + err.message);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      await removeCoupon(code);
      setCoupons(prev => prev.filter(c => c.code !== code));
    } catch (err) {
      alert('Error deleting coupon: ' + err.message);
    }
  };

  // Airport Management (Full Editable Support with Terminals)
  const handleOpenAirportModal = (airport = null) => {
    if (airport) {
      setEditingAirport(airport);
      setAirportFormData({
        code: airport.code || '',
        name: airport.name || '',
        city: airport.city || '',
        terminalDropoffFee: String(airport.terminalDropoffFee ?? '5.00'),
        terminals: Array.isArray(airport.terminals) ? [...airport.terminals] : ['Main Terminal'],
        isActive: airport.isActive !== false
      });
    } else {
      setEditingAirport(null);
      setAirportFormData({
        code: '',
        name: '',
        city: '',
        terminalDropoffFee: '5.00',
        terminals: ['Main Terminal'],
        isActive: true
      });
    }
    setNewTerminalInput('');
    setAirportModalOpen(true);
  };

  const handleAddTerminal = () => {
    const term = newTerminalInput.trim();
    if (!term) return;
    if (airportFormData.terminals.includes(term)) {
      alert('This terminal is already added.');
      return;
    }
    setAirportFormData(prev => ({
      ...prev,
      terminals: [...prev.terminals, term]
    }));
    setNewTerminalInput('');
  };

  const handleRemoveTerminal = (termToRemove) => {
    setAirportFormData(prev => ({
      ...prev,
      terminals: prev.terminals.filter(t => t !== termToRemove)
    }));
  };

  const handleSaveAirport = async (e) => {
    e.preventDefault();
    if (!airportFormData.code || !airportFormData.name) {
      alert('Please enter IATA Code and Airport Name');
      return;
    }
    setSavingAirport(true);
    try {
      await saveAirport({
        code: airportFormData.code,
        name: airportFormData.name,
        city: airportFormData.city,
        terminalDropoffFee: parseFloat(airportFormData.terminalDropoffFee) || 5.00,
        terminals: airportFormData.terminals.length > 0 ? airportFormData.terminals : ['Main Terminal'],
        isActive: airportFormData.isActive
      });
      alert(editingAirport ? 'Airport & Terminals updated successfully!' : 'New airport added successfully!');
      setAirportModalOpen(false);
      setEditingAirport(null);
      await fetchData();
    } catch (err) {
      alert('Error saving airport: ' + err.message);
    } finally {
      setSavingAirport(false);
    }
  };

  const handleToggleAirport = async (code, currentStatus) => {
    try {
      await toggleAirportStatus(code, !currentStatus);
      setAirports(prev => prev.map(a => a.code === code ? { ...a, isActive: !currentStatus } : a));
    } catch (err) {
      alert('Error toggling airport status: ' + err.message);
    }
  };

  const handleDeleteAirport = async (code) => {
    if (!window.confirm(`Are you sure you want to remove airport "${code}" from the database?`)) return;
    try {
      await removeAirport(code);
      setAirports(prev => prev.filter(a => a.code !== code));
    } catch (err) {
      alert('Error deleting airport: ' + err.message);
    }
  };

  // Platform Fees & Config Save
  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updatePlatformSettings({
        bookingFee: parseFloat(platformSettings.bookingFee) || 1.95,
        platformCommissionRate: (parseFloat(platformSettings.platformCommissionRate) || 28) / 100
      });
      alert('Platform settings saved successfully! All live customer quotes will now calculate with the new booking fee.');
      await fetchData();
    } catch (err) {
      alert('Error saving platform settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Password & Security Management
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

  // Extra Add-on Services Handlers
  const handleSaveExtraService = async (e) => {
    e.preventDefault();
    if (!newExtraForm.name.trim() || !newExtraForm.price) {
      alert('Please enter service name and price in £.');
      return;
    }
    setSavingExtra(true);
    try {
      await saveExtraService({
        name: newExtraForm.name,
        description: newExtraForm.description,
        price: parseFloat(newExtraForm.price) || 0,
        isActive: newExtraForm.isActive
      });
      setNewExtraForm({ name: '', description: '', price: '', isActive: true });
      const updated = await getExtraServices(false);
      setExtraServices(updated);
      alert('Extra service saved to database and live on platform!');
    } catch (err) {
      alert('Error saving extra service: ' + err.message);
    } finally {
      setSavingExtra(false);
    }
  };

  const handleToggleExtraStatus = async (service) => {
    try {
      await toggleExtraServiceStatus(service.id, !service.isActive);
      setExtraServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !s.isActive } : s));
    } catch (err) {
      alert('Error updating service status: ' + err.message);
    }
  };

  const handleDeleteExtraService = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await removeExtraService(id);
      setExtraServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Error deleting service: ' + err.message);
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
        operatorNote: operationsForm.operatorNote,
        operatorUser: operatorUser?.username || 'Operator'
      });
      setSelectedCustomerOrder(updated);
      setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
      alert('Vehicle tracking and compound status saved successfully!');
    } catch (err) {
      alert('Error saving operations status: ' + err.message);
    } finally {
      setSavingOperations(false);
    }
  };

  // Add / Subtract Service Charge to Invoice
  const handleAddCharge = async (bookingId) => {
    if (!newChargeForm.description.trim() || !newChargeForm.amount) {
      alert('Please enter charge description and amount');
      return;
    }
    setAddingCharge(true);
    try {
      const updated = await addBookingServiceCharge(bookingId, {
        description: newChargeForm.description,
        amount: parseFloat(newChargeForm.amount)
      });
      setSelectedCustomerOrder(updated);
      setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
      setNewChargeForm({ description: '', amount: '' });
      alert('Invoice updated! Total recalculated and voucher refreshed.');
    } catch (err) {
      alert('Error adding service charge: ' + err.message);
    } finally {
      setAddingCharge(false);
    }
  };

  const handleRemoveCharge = async (bookingId, chargeId) => {
    if (!confirm('Remove this charge item from invoice?')) return;
    try {
      const updated = await removeBookingServiceCharge(bookingId, chargeId);
      setSelectedCustomerOrder(updated);
      setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
    } catch (err) {
      alert('Error removing charge: ' + err.message);
    }
  };

  // Resend Email Voucher from Admin
  const handleAdminResendEmail = async (order) => {
    setAdminEmailStatus('sending');
    try {
      const res = await dispatchVoucherEmail(order);
      if (res && res.success) {
        setAdminEmailStatus('sent');
        setTimeout(() => setAdminEmailStatus(null), 4000);
      } else {
        setAdminEmailStatus('error');
      }
    } catch (e) {
      setAdminEmailStatus('error');
    }
  };

  // CSV Exports
  const handleExportFullLedger = () => {
    if (bookings.length === 0) return alert('No booking records to export');
    const headers = ['Booking ID', 'Created Date', 'Airport', 'Service Name', 'Customer Name', 'Email', 'Phone', 'Plate Number', 'Flight No', 'Status', 'Parking Status', 'Bay', 'Key Tag', 'Duration Days', 'Base Fare (£)', 'Booking Fee (£)', 'Total Charged (£)'];
    const rows = bookings.map(b => [
      b.id,
      b.createdAt || '',
      b.airport || '',
      `"${(b.serviceName || '').replace(/"/g, '""')}"`,
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      b.customerEmail || '',
      b.customerPhone || '',
      b.vehicleReg || '',
      b.flightNumber || '',
      b.status || '',
      b.parkingStatus || '',
      b.compoundBay || '',
      b.keyTagNumber || '',
      b.dateDetails?.durationDays || '',
      (parseFloat(b.totalCharged || 0) - parseFloat(b.bookingFee || 1.95)).toFixed(2),
      parseFloat(b.bookingFee || 1.95).toFixed(2),
      parseFloat(b.totalCharged || 0).toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `APD_Full_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBarrierManifest = () => {
    if (bookings.length === 0) return alert('No booking records to export');
    const headers = ['Vehicle Plate (ANPR)', 'Customer Name', 'Mobile Phone', 'Airport', 'Terminal / Service', 'Flight Number', 'Parking Status', 'Compound Bay', 'Key Tag Locker', 'Reference'];
    const rows = bookings.map(b => [
      b.vehicleReg || 'N/A',
      `"${(b.customerName || '').replace(/"/g, '""')}"`,
      b.customerPhone || '',
      b.airport || '',
      `"${(b.serviceName || '').replace(/"/g, '""')}"`,
      b.flightNumber || '',
      b.parkingStatus || 'booked',
      b.compoundBay || 'Unassigned',
      b.keyTagNumber || 'None',
      b.id
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Compound_Barrier_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFinancialReconciliation = () => {
    if (bookings.length === 0) return alert('No financial records to export');
    const headers = ['Booking ID', 'Customer', 'Airport', 'Gross Charged (£)', 'Booking & Admin Fee (£)', 'Net Parking Fare (£)', 'Yard Operator Pool (£)', 'Platform Commission (£)', 'Payment Status'];
    const rate = (parseFloat(platformSettings.platformCommissionRate) || 28) / 100;
    const rows = bookings.map(b => {
      const gross = parseFloat(b.totalCharged || 0);
      const fee = parseFloat(b.bookingFee || 1.95);
      const netFare = Math.max(0, gross - fee);
      const comm = gross * rate;
      const yardPool = gross - comm;
      return [
        b.id,
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        b.airport || '',
        gross.toFixed(2),
        fee.toFixed(2),
        netFare.toFixed(2),
        yardPool.toFixed(2),
        comm.toFixed(2),
        b.status || ''
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `APD_Financial_Reconciliation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const safeLots = Array.isArray(lots) ? lots : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeCoupons = Array.isArray(coupons) ? coupons : [];
  const safeAirports = Array.isArray(airports) ? airports : [];

  // Financial KPI calculations
  const totalGrossRevenue = safeBookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + parseFloat(b.totalCharged || 0), 0);
  const platformCommissionEstimate = totalGrossRevenue * ((parseFloat(platformSettings.platformCommissionRate) || 28) / 100);
  const totalOperatorYardPool = totalGrossRevenue - platformCommissionEstimate;
  const activeVehiclesCount = safeBookings.filter(b => b.status === 'confirmed').length;

  // Operational Funnel Counts
  const funnelCounts = {
    booked: safeBookings.filter(b => (!b.parkingStatus || b.parkingStatus === 'booked') && b.status !== 'cancelled').length,
    vehicle_received: safeBookings.filter(b => b.parkingStatus === 'vehicle_received').length,
    parked_compound: safeBookings.filter(b => b.parkingStatus === 'parked_compound').length,
    ready_for_return: safeBookings.filter(b => b.parkingStatus === 'ready_for_return').length,
    picked_up: safeBookings.filter(b => b.parkingStatus === 'picked_up').length
  };

  // Filtered lots
  const filteredLots = safeLots.filter(l => {
    if (lotAirportFilter === 'ALL') return true;
    return l.airportCode === lotAirportFilter;
  });

  // Filtered orders with search & status & airport & parking status filters
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
    const matchParking = orderParkingFilter === 'ALL' || (b.parkingStatus || 'booked') === orderParkingFilter;

    return matchQuery && matchAirport && matchStatus && matchParking;
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

  const navItems = [
    { id: 'dashboard', label: 'Operations Hub', icon: LayoutDashboard },
    { id: 'orders', label: 'Bookings & ANPR', icon: Users, badge: safeBookings.length },
    { id: 'lots', label: 'Compound Lots', icon: Building2, badge: safeLots.length },
    { id: 'airports', label: 'Airports & Terminals', icon: Plane, badge: safeAirports.length },
    { id: 'coupons', label: 'Promo Codes', icon: Tag, badge: safeCoupons.length },
    { id: 'settings', label: 'Fees & Add-ons', icon: Sliders },
    { id: 'security', label: 'Interface Security', icon: KeyRound }
  ];

  // --- 1. RENDER AUTHENTICATION FORM IF NOT LOGGED IN ---
  if (!operatorUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#061F75] to-slate-900 text-white flex flex-col justify-center items-center p-4 selection:bg-[#C8102E] selection:text-white">
        <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl p-7 sm:p-9 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-[#C8102E] selection:text-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#061F75] text-white shadow-md border-b-2 border-[#C8102E]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={onBackToStorefront}
              className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer items-center gap-1.5 text-xs font-bold"
              title="Return to customer comparison site"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Storefront</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-white/20" />

            <div>
              <span className="text-sm sm:text-base font-black tracking-wide text-white">
                Airport Parking <span className="text-[#C8102E]">Deals</span>
              </span>
              <span className="ml-1.5 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#C8102E] text-white tracking-wider">
                Operator Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {realtimeActive && (
              <span className="hidden lg:flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-1 rounded-full font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL Realtime Sync
              </span>
            )}
            <span className="hidden md:inline text-blue-200 font-medium text-[11px] truncate max-w-[150px]">
              {operatorUser.username}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-600/90 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs shadow-sm"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Horizontal Sub-Navigation */}
      <nav className="hidden md:block bg-white border-b border-slate-200 px-4 sm:px-8 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-extrabold whitespace-nowrap ${
                  isActive
                    ? 'bg-[#061F75] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFB400]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {typeof item.badge === 'number' && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Slide-Out Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-4/5 max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-[#061F75] text-sm">Dashboard Navigation</h3>
                  <p className="text-[10px] text-slate-500">{operatorUser?.username}</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs font-bold ${
                        isActive
                          ? 'bg-[#061F75] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFB400]' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.badge === 'number' && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={onBackToStorefront}
                className="w-full py-2.5 rounded-xl bg-blue-50 text-[#061F75] text-xs font-bold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Storefront</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-5 pb-28 md:pb-12">
        {loading ? (
          <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-[#061F75]" />
            <span className="text-sm font-semibold">Synchronizing PostgreSQL Operations Data...</span>
          </div>
        ) : (
          <div>
            {/* TAB 1: OPERATIONS HUB & INTERNAL DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                {/* Executive Financial & Operations KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Gross Booking Volume</span>
                    <div className="text-xl sm:text-2xl font-black text-[#061F75]">£{formatPrice(totalGrossRevenue)}</div>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      Total Prepayments
                    </span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                      Platform Share ({platformSettings.platformCommissionRate}%)
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-[#C8102E]">£{formatPrice(platformCommissionEstimate)}</div>
                    <span className="text-[10px] text-slate-500 block mt-1">Net Commission Take</span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Yard Operator Pool</span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700">£{formatPrice(totalOperatorYardPool)}</div>
                    <span className="text-[10px] text-slate-500 block mt-1">Payable Compound Funds</span>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Active Passes (ANPR)</span>
                    <div className="text-xl sm:text-2xl font-black text-slate-900">{activeVehiclesCount}</div>
                    <span className="text-[10px] text-slate-500 block mt-1">Confirmed Vehicle Bookings</span>
                  </div>
                </div>

                {/* Compound Vehicle Operations Pipeline Funnel */}
                <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#061F75] flex items-center gap-2">
                        <Car className="w-5 h-5 text-[#C8102E]" />
                        <span>Compound Vehicle Operations Pipeline</span>
                      </h2>
                      <p className="text-xs text-slate-500">Live operational stages across all airport compounds</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#061F75] hover:text-[#C8102E] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Reservations</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div
                      onClick={() => { setOrderParkingFilter('booked'); setActiveTab('orders'); }}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all"
                    >
                      <span className="text-[10px] uppercase font-black text-slate-500 block">1. Awaiting Arrival</span>
                      <div className="text-2xl font-black text-slate-800 mt-1">{funnelCounts.booked}</div>
                      <span className="text-[10px] text-slate-400">Incoming forecourt flights</span>
                    </div>

                    <div
                      onClick={() => { setOrderParkingFilter('vehicle_received'); setActiveTab('orders'); }}
                      className="p-3.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 cursor-pointer transition-all"
                    >
                      <span className="text-[10px] uppercase font-black text-[#061F75] block">2. Checked In</span>
                      <div className="text-2xl font-black text-[#061F75] mt-1">{funnelCounts.vehicle_received}</div>
                      <span className="text-[10px] text-blue-600">Keys tagged in lockers</span>
                    </div>

                    <div
                      onClick={() => { setOrderParkingFilter('parked_compound'); setActiveTab('orders'); }}
                      className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 cursor-pointer transition-all"
                    >
                      <span className="text-[10px] uppercase font-black text-amber-900 block">3. In Compound</span>
                      <div className="text-2xl font-black text-amber-900 mt-1">{funnelCounts.parked_compound}</div>
                      <span className="text-[10px] text-amber-700">Parked in security bay</span>
                    </div>

                    <div
                      onClick={() => { setOrderParkingFilter('ready_for_return'); setActiveTab('orders'); }}
                      className="p-3.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 cursor-pointer transition-all"
                    >
                      <span className="text-[10px] uppercase font-black text-purple-900 block">4. At Forecourt</span>
                      <div className="text-2xl font-black text-purple-900 mt-1">{funnelCounts.ready_for_return}</div>
                      <span className="text-[10px] text-purple-700">Ready for landing flight</span>
                    </div>

                    <div
                      onClick={() => { setOrderParkingFilter('picked_up'); setActiveTab('orders'); }}
                      className="p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 cursor-pointer transition-all col-span-2 sm:col-span-1"
                    >
                      <span className="text-[10px] uppercase font-black text-emerald-900 block">5. Picked Up</span>
                      <div className="text-2xl font-black text-emerald-800 mt-1">{funnelCounts.picked_up}</div>
                      <span className="text-[10px] text-emerald-700">Handover completed</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Shortcuts & Airport Volume */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-black uppercase text-[#061F75] tracking-wider">Operational Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={handleExportBarrierManifest}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-amber-600" />
                          <span>Export Barrier ANPR Manifest (CSV)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleOpenLotModal()}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-[#061F75] flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[#061F75]" />
                          <span>Add New Compound Location</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => handleOpenAirportModal()}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-emerald-600" />
                          <span>Add / Configure Airport & Terminals</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => setActiveTab('security')}
                        className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-[#C8102E] flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#C8102E]" />
                          <span>Update Master Password & PIN</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase text-[#061F75] tracking-wider">UK Airport Booking Volume Share</h3>
                      <span className="text-[11px] font-bold text-slate-400">{safeBookings.length} Total Bookings</span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {safeAirports.slice(0, 5).map(ap => {
                        const count = safeBookings.filter(b => b.airport === ap.code).length;
                        const pct = safeBookings.length > 0 ? Math.round((count / safeBookings.length) * 100) : 0;
                        return (
                          <div key={ap.code} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-800">{ap.name} ({ap.code})</span>
                              <span className="text-slate-500 font-mono">{count} bookings ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#061F75] to-[#C8102E] rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CUSTOMER BOOKINGS & ANPR */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Search, Filter & Quick Export Bar */}
                <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search passenger, yellow plate, bay, tag, ref..."
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#061F75] focus:bg-white"
                      />
                    </div>

                    {/* Export Actions (Responsive Buttons) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      <button
                        onClick={handleExportFullLedger}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#061F75] text-xs font-bold border border-blue-200 cursor-pointer shadow-sm whitespace-nowrap"
                        title="Export complete customer ledger"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Ledger (CSV)</span>
                      </button>

                      <button
                        onClick={handleExportBarrierManifest}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 cursor-pointer shadow-sm whitespace-nowrap"
                        title="Export barrier manifest for security guards"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-600" />
                        <span>Barrier Manifest (CSV)</span>
                      </button>

                      <button
                        onClick={handleExportFinancialReconciliation}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-pointer shadow-sm whitespace-nowrap"
                        title="Export financial accounting breakdown"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Audit (CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <select
                        value={orderAirportFilter}
                        onChange={(e) => setOrderAirportFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 outline-none"
                      >
                        <option value="ALL">All UK Airports</option>
                        {safeAirports.map(ap => (
                          <option key={ap.code} value={ap.code}>{ap.name} ({ap.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 outline-none"
                      >
                        <option value="ALL">All Payment Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <select
                        value={orderParkingFilter}
                        onChange={(e) => setOrderParkingFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 outline-none"
                      >
                        <option value="ALL">All Compound Stages</option>
                        <option value="booked">1. Awaiting Arrival</option>
                        <option value="vehicle_received">2. Checked In</option>
                        <option value="parked_compound">3. In Compound</option>
                        <option value="ready_for_return">4. At Forecourt</option>
                        <option value="picked_up">5. Picked Up</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mobile Cards View (Visible on < md screens) */}
                <div className="md:hidden space-y-3">
                  {filteredBookings.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                      No reservations match your filters.
                    </div>
                  ) : (
                    filteredBookings.map((b) => {
                      const pStatus = parkingStatusConfig[b.parkingStatus] || parkingStatusConfig.booked;
                      return (
                        <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="bg-amber-100 border border-amber-300 text-slate-900 px-2 py-0.5 rounded font-mono font-black text-xs">
                              {b.vehicleReg || 'N/A'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-[#061F75]">{b.id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="font-extrabold text-slate-900 text-sm">{b.customerName || 'Passenger'}</div>
                            <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-[#061F75]" />
                              <span>{b.customerEmail}</span>
                            </div>
                            <div className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{b.customerPhone}</span>
                            </div>
                            <div className="text-slate-700 font-semibold text-[11px] pt-1">
                              {b.airport} • {b.serviceName}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full font-bold border ${pStatus.bg}`}>
                              {pStatus.label}
                            </span>
                            {b.compoundBay && (
                              <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                                Bay: {b.compoundBay}
                              </span>
                            )}
                            {b.keyTagNumber && (
                              <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                                Locker: {b.keyTagNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase block">Total Paid</span>
                              <span className="text-base font-black text-emerald-700">£{formatPrice(b.totalCharged)}</span>
                            </div>
                            <button
                              onClick={() => setSelectedCustomerOrder(b)}
                              className="px-4 py-2 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open Dossier</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table View (Visible on >= md screens) */}
                <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
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
                                    onChange={(e) => handleBookingStatusChange(b.id, e.target.value)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border outline-none ${
                                      b.status === 'confirmed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : b.status === 'completed'
                                        ? 'bg-blue-50 text-[#061F75] border-blue-300'
                                        : 'bg-red-50 text-red-800 border-red-300'
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
                                    className="px-3.5 py-1.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 ml-auto"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Dossier</span>
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

            {/* TAB 3: COMPOUND LOCATIONS */}
            {activeTab === 'lots' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Filter Airport:</span>
                    <select
                      value={lotAirportFilter}
                      onChange={(e) => setLotAirportFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none"
                    >
                      <option value="ALL">All Airports ({safeLots.length})</option>
                      {safeAirports.map(ap => (
                        <option key={ap.code} value={ap.code}>{ap.name} ({ap.code})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleOpenLotModal()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Compound Location</span>
                  </button>
                </div>

                {/* Compound Lots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLots.map((lot) => (
                    <div key={lot.id} className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-blue-100 text-[#061F75] px-2.5 py-0.5 rounded-lg font-mono font-black text-xs border border-blue-200">
                            {lot.airportCode}
                          </span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            £{formatPrice(lot.baseDailyRate)}/day
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900">{lot.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{lot.operatorName}</p>

                        <div className="flex flex-wrap gap-1 mt-3">
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {lot.type === 'meet_and_greet' ? 'Meet & Greet' : 'Park & Ride'}
                          </span>
                          {lot.parkMarkAccredited && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                              ✓ Park Mark
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {lot.transferDurationMinutes}m transfer
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-mono">
                          Net Pay: £{formatPrice(lot.operatorNetRate || 3.50)}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenLotModal(lot)}
                            className="p-2 rounded-xl bg-blue-50 text-[#061F75] hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Edit Compound Lot"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLot(lot.id, lot.name)}
                            className="p-2 rounded-xl bg-red-50 text-[#C8102E] hover:bg-red-100 transition-colors cursor-pointer"
                            title="Delete Compound Lot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: AIRPORTS & TERMINALS (FULLY EDITABLE) */}
            {activeTab === 'airports' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-[#061F75]">UK Airports &amp; Terminals Directory</h2>
                    <p className="text-xs text-slate-500">
                      Configure airports, terminal drop-off fees, and active flight terminals served.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAirportModal()}
                    className="px-4 py-2.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Airport</span>
                  </button>
                </div>

                {/* Mobile Cards for Airports */}
                <div className="md:hidden space-y-3">
                  {safeAirports.map(a => (
                    <div key={a.code} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-100 text-[#061F75] px-3 py-1 rounded-lg font-mono font-black text-xs border border-blue-200">
                          {a.code}
                        </span>
                        <button
                          onClick={() => handleToggleAirport(a.code, a.isActive)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer border ${
                            a.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}
                        >
                          {a.isActive ? '● Active' : '○ Disabled'}
                        </button>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{a.name}</h4>
                        <p className="text-xs text-slate-500">{a.city} • Dropoff Fee: £{formatPrice(a.terminalDropoffFee)}</p>
                      </div>

                      {Array.isArray(a.terminals) && a.terminals.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Served Terminals:</span>
                          <div className="flex flex-wrap gap-1">
                            {a.terminals.map(term => (
                              <span key={term} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                {term}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenAirportModal(a)}
                          className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#061F75] text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Airport &amp; Terminals</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAirport(a.code)}
                          className="p-2 rounded-xl bg-red-50 text-[#C8102E] hover:bg-red-100 border border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table for Airports */}
                <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-4 px-5">IATA Code</th>
                          <th className="py-4 px-5">Airport Name</th>
                          <th className="py-4 px-5">City / Region</th>
                          <th className="py-4 px-5">Dropoff Fee</th>
                          <th className="py-4 px-5">Terminals</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {safeAirports.map((a) => (
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
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {Array.isArray(a.terminals) && a.terminals.map(term => (
                                  <span key={term} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                    {term}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <button
                                onClick={() => handleToggleAirport(a.code, a.isActive)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                  a.isActive
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {a.isActive ? '● Active' : '○ Disabled'}
                              </button>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenAirportModal(a)}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-[#061F75] hover:bg-blue-100 font-bold text-xs flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                                  title="Edit Airport and Terminals"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteAirport(a.code)}
                                  className="p-1.5 rounded-xl bg-red-50 text-[#C8102E] hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Delete Airport"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PROMO CODES & COUPONS */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-[#061F75]">Promotional Discount Codes</h2>
                    <p className="text-xs text-slate-500">Manage promotional discount vouchers applied by travellers at checkout.</p>
                  </div>
                  <button
                    onClick={() => setCouponModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] text-white text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create New Promo Code</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {safeCoupons.map((c) => (
                    <div key={c.code} className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-amber-50 text-[#061F75] border border-amber-300 font-mono font-black text-sm">
                          {c.code}
                        </span>
                        <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {c.discountPercentage}% OFF
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{c.description || 'Promotional Discount'}</p>
                      <div className="text-[11px] text-slate-500">Min. Duration: <strong>{c.minDays || 1} days</strong></div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleToggleCoupon(c.code, c.isActive)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer border ${
                            c.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {c.isActive ? '● Active' : '○ Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: PLATFORM FEES & OPTIONAL ADD-ONS */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Fee Configuration */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm max-w-3xl">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
                    <div className="p-2.5 rounded-2xl bg-blue-50 text-[#061F75]">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#061F75]">Platform Fee &amp; Commission Configuration</h2>
                      <p className="text-xs text-slate-500">
                        Universal booking fee and operator commission rates applied to all live quotes.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePlatformSettings} className="space-y-5 text-xs font-bold text-slate-700">
                    <div>
                      <label className="block mb-1 text-slate-900 text-sm">
                        Booking &amp; Administration Fee (£) *
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2 font-normal">
                        Added to every quote and checkout to cover payment infrastructure and 24/7 customer support.
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
                      <label className="block mb-1 text-slate-900 text-sm">
                        Platform Commission Rate (%) *
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2 font-normal">
                        Percentage retained by the platform from each compound yard reservation gross total.
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

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-6 py-3 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{savingSettings ? 'Saving...' : 'Save Platform Settings'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Optional Add-on Services Catalog */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm max-w-3xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-[#061F75]">Optional Add-on Services (Storefront Upsells)</h2>
                        <p className="text-xs text-slate-500">
                          Services customers can check or uncheck in their invoice before paying at checkout.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {extraServices.length} Active
                    </span>
                  </div>

                  {/* Add New Service Form */}
                  <form onSubmit={handleSaveExtraService} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 mb-6 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#061F75] tracking-wider">
                      <PlusCircle className="w-4 h-4 text-[#C8102E]" />
                      <span>Create New Add-on Service</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Service Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Valet Exterior Hand Wash & Wax"
                          value={newExtraForm.name}
                          onChange={(e) => setNewExtraForm({ ...newExtraForm, name: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#061F75]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Price in £ (Customer Charge) *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-slate-500 font-bold text-xs">£</span>
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            required
                            placeholder="e.g. 25.00"
                            value={newExtraForm.price}
                            onChange={(e) => setNewExtraForm({ ...newExtraForm, price: e.target.value })}
                            className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 outline-none focus:border-[#061F75]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Customer Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Full hand wash, wheel shine and wax coat before return flight."
                        value={newExtraForm.description}
                        onChange={(e) => setNewExtraForm({ ...newExtraForm, description: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#061F75]"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={newExtraForm.isActive}
                          onChange={(e) => setNewExtraForm({ ...newExtraForm, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-[#061F75] focus:ring-[#061F75]"
                        />
                        <span>Enable immediately on Storefront Checkout</span>
                      </label>

                      <button
                        type="submit"
                        disabled={savingExtra}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{savingExtra ? 'Saving...' : 'Add Extra Service'}</span>
                      </button>
                    </div>
                  </form>

                  {/* List of Extras */}
                  <div className="space-y-3">
                    {extraServices.map((service) => (
                      <div
                        key={service.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          service.isActive
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-xs text-slate-900">{service.name}</h4>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                              +£{service.price.toFixed(2)}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{service.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggleExtraStatus(service)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                              service.isActive
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {service.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExtraService(service.id, service.name)}
                            className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: INTERFACE SECURITY & PASSWORDS */}
            {activeTab === 'security' && (
              <div className="space-y-6 max-w-3xl">
                {/* Operator Password Change Card */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
                    <div className="p-2.5 rounded-2xl bg-red-50 text-[#C8102E]">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#061F75]">Master Operator Credentials (PostgreSQL)</h2>
                      <p className="text-xs text-slate-500">
                        Update your master operator password or PIN code stored in Supabase PostgreSQL.
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

                {/* System Security & RLS Status */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">Database &amp; Session Protection</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Row-Level Security (RLS)</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Enabled on admin_credentials
                      </span>
                      <p className="text-[11px] text-slate-500">Anon REST queries cannot view credentials.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Authentication Engine</span>
                      <span className="font-bold text-[#061F75]">SECURITY DEFINER RPC</span>
                      <p className="text-[11px] text-slate-500">Bcrypt $2a$ salt verification on server.</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-[#C8102E] border border-red-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Terminate Current Operator Session</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed Native-Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg md:hidden">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'dashboard' ? 'text-[#061F75] font-black' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative ${
              activeTab === 'orders' ? 'text-[#061F75] font-black' : 'text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Bookings</span>
            {safeBookings.length > 0 && (
              <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-[#C8102E]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('lots')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'lots' ? 'text-[#061F75] font-black' : 'text-slate-400'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px]">Lots</span>
          </button>

          <button
            onClick={() => setActiveTab('airports')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'airports' ? 'text-[#061F75] font-black' : 'text-slate-400'
            }`}
          >
            <Plane className="w-5 h-5" />
            <span className="text-[10px]">Airports</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeTab === 'security' ? 'text-[#061F75] font-black' : 'text-slate-400'
            }`}
          >
            <KeyRound className="w-5 h-5" />
            <span className="text-[10px]">Security</span>
          </button>
        </div>
      </div>

      {/* MODAL: ADD / EDIT COMPOUND LOT */}
      {lotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  COMPOUND MANAGEMENT
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#061F75]">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Airport Code *</label>
                  <select
                    value={lotFormData.airportCode}
                    onChange={(e) => setLotFormData({ ...lotFormData, airportCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  >
                    {safeAirports.map(ap => (
                      <option key={ap.code} value={ap.code}>{ap.name} ({ap.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Service Type *</label>
                  <select
                    value={lotFormData.type}
                    onChange={(e) => setLotFormData({ ...lotFormData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  >
                    <option value="park_and_ride">Park &amp; Ride (Shuttle)</option>
                    <option value="meet_and_greet">Meet &amp; Greet (Terminal Forecourt)</option>
                    <option value="on_airport">On-Airport Official</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Compound Parking Lot Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heathrow Express Park & Ride"
                  value={lotFormData.name}
                  onChange={(e) => setLotFormData({ ...lotFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              <div>
                <label className="block mb-1">Operating Company *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maple Manor Parking Ltd"
                  value={lotFormData.operatorName}
                  onChange={(e) => setLotFormData({ ...lotFormData, operatorName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Customer Daily Rate (£) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={lotFormData.baseDailyRate}
                    onChange={(e) => setLotFormData({ ...lotFormData, baseDailyRate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>

                <div>
                  <label className="block mb-1">Operator Net Rate (£)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    value={lotFormData.operatorNetRate}
                    onChange={(e) => setLotFormData({ ...lotFormData, operatorNetRate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1">Transfer (Mins)</label>
                  <input
                    type="number"
                    value={lotFormData.transferDurationMinutes}
                    onChange={(e) => setLotFormData({ ...lotFormData, transferDurationMinutes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
                <div>
                  <label className="block mb-1">Frequency (Mins)</label>
                  <input
                    type="number"
                    value={lotFormData.transferFrequencyMinutes}
                    onChange={(e) => setLotFormData({ ...lotFormData, transferFrequencyMinutes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
                <div>
                  <label className="block mb-1">Distance (Miles)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={lotFormData.distanceMiles}
                    onChange={(e) => setLotFormData({ ...lotFormData, distanceMiles: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lotFormData.parkMarkAccredited}
                    onChange={(e) => setLotFormData({ ...lotFormData, parkMarkAccredited: e.target.checked })}
                    className="w-4 h-4 rounded text-[#061F75]"
                  />
                  <span>Park Mark Accredited Police Safety Scheme</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
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
                  {savingLot ? 'Saving...' : editingLot ? 'Save Changes' : 'Create Compound Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT AIRPORT & TERMINALS */}
      {airportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  AIRPORT DIRECTORY &amp; TERMINALS
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#061F75]">
                  {editingAirport ? `Edit ${editingAirport.name} (${editingAirport.code})` : 'Add New UK Airport'}
                </h3>
              </div>
              <button
                onClick={() => setAirportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAirport} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">IATA Code (3 Letters) *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    disabled={!!editingAirport}
                    placeholder="e.g. LHR"
                    value={airportFormData.code}
                    onChange={(e) => setAirportFormData({ ...airportFormData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-black uppercase outline-none focus:border-[#061F75] disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block mb-1">Dropoff Fee (£)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={airportFormData.terminalDropoffFee}
                    onChange={(e) => setAirportFormData({ ...airportFormData, terminalDropoffFee: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-black outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Airport Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. London Heathrow Airport"
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
                  placeholder="e.g. London / Middlesex"
                  value={airportFormData.city}
                  onChange={(e) => setAirportFormData({ ...airportFormData, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              {/* Terminals Manager */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-slate-900 text-xs">
                  Active Terminals (Selectable in Quotes &amp; Bookings)
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {airportFormData.terminals.length === 0 ? (
                    <span className="text-slate-400 text-[11px]">No terminals added yet.</span>
                  ) : (
                    airportFormData.terminals.map(term => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-[#061F75] font-bold text-xs border border-blue-200"
                      >
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTerminal(term)}
                          className="hover:text-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Terminal 2 or North Terminal"
                    value={newTerminalInput}
                    onChange={(e) => setNewTerminalInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#061F75]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTerminal}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
                  >
                    + Add Terminal
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={airportFormData.isActive}
                    onChange={(e) => setAirportFormData({ ...airportFormData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#061F75]"
                  />
                  <span>Active &amp; Visible in Customer Comparison Search</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
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
                  {savingAirport ? 'Saving...' : editingAirport ? 'Save Changes' : 'Add Airport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PROMO CODE */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <h3 className="text-base font-black text-[#061F75]">Create New Promo Code</h3>
              <button onClick={() => setCouponModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER20"
                    value={newCouponData.code}
                    onChange={(e) => setNewCouponData({ ...newCouponData, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-black uppercase outline-none focus:border-[#061F75]"
                  />
                </div>
                <div>
                  <label className="block mb-1">Discount (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newCouponData.discountPercentage}
                    onChange={(e) => setNewCouponData({ ...newCouponData, discountPercentage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Long Stay 20% Discount"
                  value={newCouponData.description}
                  onChange={(e) => setNewCouponData({ ...newCouponData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              <div>
                <label className="block mb-1">Min. Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={newCouponData.minDays}
                  onChange={(e) => setNewCouponData({ ...newCouponData, minDays: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#061F75]"
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="w-1/2 py-2.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {savingCoupon ? 'Saving...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER DOSSIER & OPERATIONS / INVOICE CONTROL CENTER */}
      {selectedCustomerOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-8 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] uppercase font-black text-[#C8102E] tracking-wider block">
                  CUSTOMER RESERVATION DOSSIER
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#061F75]">
                  Reservation Ref: {selectedCustomerOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Customer Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Passenger</span>
                  <div className="font-bold text-slate-900 mt-0.5 text-sm">{selectedCustomerOrder.customerName}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#061F75]" />
                    <span>{selectedCustomerOrder.customerEmail}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{selectedCustomerOrder.customerPhone || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ANPR Plate &amp; Flight</span>
                  <div className="mt-1">
                    <span className="bg-amber-100 border border-amber-300 text-slate-900 px-2 py-0.5 rounded font-mono font-black text-sm">
                      {selectedCustomerOrder.vehicleReg || 'N/A'}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-1.5 flex items-center gap-1">
                    <Plane className="w-3 h-3 text-slate-400" />
                    <span>Flight: {selectedCustomerOrder.flightNumber || 'None'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Airport Service</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedCustomerOrder.airport}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{selectedCustomerOrder.serviceName}</div>
                  <div className="mt-1.5">
                    <span className="text-emerald-700 font-extrabold text-sm">
                      £{formatPrice(selectedCustomerOrder.totalCharged)} Total Paid
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: VEHICLE OPERATIONS & COMPOUND TRACKER */}
              <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#061F75]" />
                    <span className="font-extrabold text-xs uppercase text-[#061F75]">Vehicle Compound Tracker</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    Yard Operations
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Compound Parking Status *
                    </label>
                    <select
                      value={operationsForm.parkingStatus}
                      onChange={(e) => setOperationsForm({ ...operationsForm, parkingStatus: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#061F75]"
                    >
                      <option value="booked">1. Awaiting Arrival</option>
                      <option value="vehicle_received">2. Checked In / Keys Handed</option>
                      <option value="parked_compound">3. Parked in Compound</option>
                      <option value="ready_for_return">4. Ready at Forecourt</option>
                      <option value="picked_up">5. Customer Picked Up</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Compound Bay Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bay C-14"
                      value={operationsForm.compoundBay}
                      onChange={(e) => setOperationsForm({ ...operationsForm, compoundBay: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 outline-none focus:border-[#061F75]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Key Tag Locker #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Box #42"
                      value={operationsForm.keyTagNumber}
                      onChange={(e) => setOperationsForm({ ...operationsForm, keyTagNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 outline-none focus:border-[#061F75]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Mileage In (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 45,210 mi"
                      value={operationsForm.mileageIn}
                      onChange={(e) => setOperationsForm({ ...operationsForm, mileageIn: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#061F75]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                      Add Handover Note to Audit Log
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Scratched left bumper noted on arrival"
                      value={operationsForm.operatorNote}
                      onChange={(e) => setOperationsForm({ ...operationsForm, operatorNote: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#061F75]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={savingOperations}
                  onClick={() => handleSaveOperationsTracker(selectedCustomerOrder.id)}
                  className="w-full py-2.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {savingOperations ? 'Saving Vehicle Status...' : 'Save Vehicle Status & Compound Bay'}
                </button>
              </div>

              {/* SECTION: INVOICE ADJUSTMENTS & SERVICE CHARGES */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-xs uppercase text-[#061F75] flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#C8102E]" />
                    <span>Invoice Adjustments &amp; Service Charges</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Updates Customer Voucher</span>
                </div>

                {/* Existing Service Charges Table */}
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 text-slate-600 font-mono text-xs">
                    <span>Base Parking Fare:</span>
                    <span>£{formatPrice(parseFloat(selectedCustomerOrder.totalCharged || 0) - parseFloat(selectedCustomerOrder.bookingFee || 1.95))}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 font-mono text-xs">
                    <span>Booking &amp; Security Administration Fee:</span>
                    <span>£{formatPrice(selectedCustomerOrder.bookingFee || 1.95)}</span>
                  </div>

                  {Array.isArray(selectedCustomerOrder.serviceCharges) && selectedCustomerOrder.serviceCharges.map((sc) => (
                    <div key={sc.id} className="flex items-center justify-between py-1 font-mono text-xs text-slate-800 border-t border-slate-200/60">
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveCharge(selectedCustomerOrder.id, sc.id)}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span>{sc.description}:</span>
                      </span>
                      <span className={sc.amount >= 0 ? 'text-[#061F75] font-bold' : 'text-emerald-700 font-bold'}>
                        {sc.amount >= 0 ? '+' : ''}£{formatPrice(sc.amount)}
                      </span>
                    </div>
                  ))}

                  <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-black text-[#061F75]">
                    <span>Total Prepaid Amount:</span>
                    <span className="text-emerald-700">£{formatPrice(selectedCustomerOrder.totalCharged)}</span>
                  </div>
                </div>

                {/* Add New Surcharge / Discount Form */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-black uppercase text-slate-700 block">
                    + Add / Subtract Surcharge or Goodwill Discount
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="e.g. Valet Wash or Out of Hours Fee"
                        value={newChargeForm.description}
                        onChange={(e) => setNewChargeForm({ ...newChargeForm, description: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#061F75]"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.50"
                        placeholder="Amount £ (+/-)"
                        value={newChargeForm.amount}
                        onChange={(e) => setNewChargeForm({ ...newChargeForm, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono outline-none focus:border-[#061F75]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={addingCharge}
                    onClick={() => handleAddCharge(selectedCustomerOrder.id)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#061F75] to-[#C8102E] text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
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
                  <span>
                    {adminEmailStatus === 'sending' ? 'Sending Email...' : adminEmailStatus === 'sent' ? '✓ Voucher Sent!' : 'Email Updated Voucher'}
                  </span>
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
