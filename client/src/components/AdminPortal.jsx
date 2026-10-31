import React, { useState, useEffect } from 'react';
import { 
  getAdminLots, saveAdminLot, removeAdminLot, getAdminBookings, changeBookingStatus 
} from '../services/apiClient';
import { 
  Building2, MapPin, DollarSign, Users, Plus, Trash2, Edit3, CheckCircle, 
  XCircle, Clock, ShieldCheck, ArrowLeft, RefreshCw, X, Eye, Phone, Mail, Car, Plane
} from 'lucide-react';

export default function AdminPortal({ onClose }) {
  const [activeTab, setActiveTab] = useState('lots'); // 'lots' | 'orders' | 'revenue'
  const [lots, setLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Selected customer profile view
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lotsData, bookingsData] = await Promise.all([
        getAdminLots(),
        getAdminBookings()
      ]);
      setLots(lotsData || []);
      setBookings(bookingsData || []);
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
        airportCode: lot.airportCode,
        name: lot.name,
        operatorName: lot.operatorName,
        type: lot.type,
        baseDailyRate: String(lot.baseDailyRate),
        yardLocation: lot.yardLocation || '',
        transferDurationMinutes: String(lot.transferDurationMinutes),
        transferFrequencyMinutes: String(lot.transferFrequencyMinutes),
        distanceMiles: String(lot.distanceMiles)
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

  // Save (Add or Update) lot
  const handleSaveLot = async (e) => {
    e.preventDefault();
    try {
      await saveAdminLot(lotFormData, editingLot ? editingLot.id : null);
      fetchData();
      setLotModalOpen(false);
    } catch (err) {
      console.error('Failed to save lot', err);
    }
  };

  // Delete lot
  const handleDeleteLot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parking location?')) return;
    try {
      await removeAdminLot(id);
      setLots(lots.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete lot', err);
    }
  };

  // Update booking order status
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await changeBookingStatus(bookingId, newStatus);
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl mx-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden animate-in fade-in">
        
        {/* Top Admin Header Bar */}
        <div className="bg-[#061F75] text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-amber-400">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#C8102E] text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">
                  OPERATOR PORTAL
                </span>
                <span className="text-sm font-bold text-slate-200">Backend Control Center</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black">
                Yard Locations, Pricing &amp; Orders Manager
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A60D25] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('lots')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'lots'
                ? 'bg-white text-[#061F75] shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#C8102E]" />
            <span>Yard Locations &amp; Pricing ({lots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-white text-[#061F75] shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#061F75]" />
            <span>Customer Orders &amp; Profiles ({bookings.length})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {loading ? (
            <div className="py-20 text-center text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#061F75]" />
              <span className="font-semibold text-sm">Loading backend database records...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: YARD LOCATIONS & PRICING */}
              {activeTab === 'lots' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Manage Compound Yards &amp; Rates</h3>
                      <p className="text-xs text-slate-500">
                        Add, remove, or modify daily prices and compound addresses across all UK airport corridors.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenLotModal()}
                      className="px-4 py-2.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Location / Yard</span>
                    </button>
                  </div>

                  {/* Responsive Cards / Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-3.5 px-4">Airport</th>
                            <th className="py-3.5 px-4">Service &amp; Yard Location</th>
                            <th className="py-3.5 px-4">Type</th>
                            <th className="py-3.5 px-4">Base Daily Rate</th>
                            <th className="py-3.5 px-4">7-Day Estimate</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lots.map((l) => (
                            <tr key={l.id} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-3.5 px-4 font-black text-[#061F75]">
                                <span className="bg-blue-100 text-[#061F75] px-2 py-1 rounded text-xs">
                                  {l.airportCode}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{l.name}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-[#C8102E]" />
                                  <span>{l.yardLocation || 'Perimeter Yard'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    l.type === 'meet_and_greet'
                                      ? 'bg-blue-50 text-[#061F75] border border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {l.type === 'meet_and_greet' ? 'Meet & Greet' : 'Park & Ride'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                                £{parseFloat(l.baseDailyRate).toFixed(2)} / day
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#061F75] text-sm">
                                £{(parseFloat(l.baseDailyRate) * 7).toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  onClick={() => handleOpenLotModal(l)}
                                  className="p-1.5 rounded-lg bg-blue-50 text-[#061F75] hover:bg-blue-100 transition-colors cursor-pointer"
                                  title="Edit Rate & Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLot(l.id)}
                                  className="p-1.5 rounded-lg bg-red-50 text-[#C8102E] hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Delete Location"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOMER ORDERS & PROFILES */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <h3 className="text-base font-bold text-slate-900">Live Customer Orders &amp; Status</h3>
                    <p className="text-xs text-slate-500">
                      View full customer profiles, vehicle registration numbers for ANPR cameras, and update order statuses.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-3.5 px-4">Booking Ref</th>
                            <th className="py-3.5 px-4">Customer Profile</th>
                            <th className="py-3.5 px-4">Vehicle Reg (ANPR)</th>
                            <th className="py-3.5 px-4">Airport &amp; Service</th>
                            <th className="py-3.5 px-4">Total Paid</th>
                            <th className="py-3.5 px-4">Order Status</th>
                            <th className="py-3.5 px-4 text-right">View Profile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bookings.map((b) => (
                            <tr key={b.id} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-[#061F75]">
                                {b.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{b.customerName}</div>
                                <div className="text-[11px] text-slate-500">{b.customerEmail}</div>
                                <div className="text-[11px] text-slate-500">{b.customerPhone}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="bg-amber-100 border border-amber-300 text-slate-900 px-2 py-0.5 rounded font-mono font-black text-xs">
                                  {b.vehicleReg || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-slate-800">{b.airport}</span>
                                <p className="text-[11px] text-slate-500 truncate max-w-xs">{b.serviceName}</p>
                              </td>
                              <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                                £{parseFloat(b.totalCharged || 0).toFixed(2)}
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  value={b.status || 'confirmed'}
                                  onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                  className={`text-xs font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
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
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedCustomerOrder(b)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-[#061F75] hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="View Full Customer Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT LOCATION & PRICE */}
      {lotModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-[#061F75]">
                {editingLot ? 'Edit Yard Location & Pricing' : 'Add New Compound Yard Location'}
              </h3>
              <button
                onClick={() => setLotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  >
                    <option value="meet_and_greet">Meet &amp; Greet (Valet)</option>
                    <option value="park_and_ride">Park &amp; Ride (Shuttle)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Service / Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heathrow Express Meet & Greet Forecourt"
                  value={lotFormData.name}
                  onChange={(e) => setLotFormData({ ...lotFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Compound Yard Address &amp; Postcode</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bath Road Compound, Harlington (TW19 8AF)"
                  value={lotFormData.yardLocation}
                  onChange={(e) => setLotFormData({ ...lotFormData, yardLocation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1">Distance in Miles</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 1.5"
                    value={lotFormData.distanceMiles}
                    onChange={(e) => setLotFormData({ ...lotFormData, distanceMiles: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setLotModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#061F75] hover:bg-[#0B2EA2] text-white font-bold transition-all shadow-md"
                >
                  {editingLot ? 'Save Changes' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER PROFILE & ORDER DETAILS */}
      {selectedCustomerOrder && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] uppercase font-black text-[#061F75] tracking-wider block">Customer Profile</span>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomerOrder.customerName}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomerOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-[#061F75]" />
                  <span>{selectedCustomerOrder.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedCustomerOrder.customerPhone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Car className="w-3.5 h-3.5 text-amber-500" />
                  <span>ANPR Plate: <strong className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">{selectedCustomerOrder.vehicleReg || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Plane className="w-3.5 h-3.5 text-[#061F75]" />
                  <span>Flight Number: <strong>{selectedCustomerOrder.flightNumber || 'None'}</strong></span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Order Reference:</span>
                  <strong className="font-mono text-[#061F75]">{selectedCustomerOrder.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span>{selectedCustomerOrder.serviceName}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#061F75] pt-1 border-t border-blue-200">
                  <span>Amount Charged:</span>
                  <span>£{parseFloat(selectedCustomerOrder.totalCharged || 0).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerOrder(null)}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#061F75] text-white font-bold text-xs"
              >
                Close Customer Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
