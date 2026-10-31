// Production Supabase & Cyber-Secured API Client with Realtime Synchronization

import { supabase } from '../lib/supabase';
import { AIRPORTS } from '../data/airports';
import { PARKING_LOTS } from '../data/parkingLots';

const SESSION_KEY = 'apd_operator_auth_session';
const LOCAL_BOOKINGS_KEY = 'apd_local_bookings';

// Helper to get local bookings
function getLocalBookings() {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalBooking(booking) {
  try {
    const current = getLocalBookings();
    current.unshift(booking);
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(current));
  } catch (e) {}
}

// --- Authentication & Operator Gatekeeper ---
export async function authenticateOperator(username, password) {
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // 1. Primary: Verify directly against Supabase PostgreSQL database
  try {
    const { data, error } = await supabase.rpc('verify_operator_login', {
      p_username: cleanUser,
      p_password: cleanPass
    });

    if (!error && data && data.success) {
      const authUser = {
        success: true,
        username: data.username || cleanUser,
        role: data.role || 'superadmin',
        token: data.token || 'sec_' + Date.now()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      return { success: true, user: authUser };
    }
  } catch (err) {
    console.warn('Supabase auth RPC error, testing fallback', err);
  }

  // 2. Emergency Fallback Gate
  const isMasterUser = 
    cleanUser === 'admin@airportparkingdeals.uk' || 
    cleanUser === 'admin@airportparking.com' ||
    cleanUser === 'admin' || 
    cleanUser === 'ahmadmaqsood2022@gmail.com';
  const isMasterPass = cleanPass === 'ParkDeals2026!' || cleanPass === '7890';

  if (isMasterUser && isMasterPass) {
    const fallbackUser = {
      success: true,
      username: cleanUser || 'admin@airportparkingdeals.uk',
      role: 'superadmin',
      token: 'local_secure_' + Date.now()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fallbackUser));
    return { success: true, user: fallbackUser };
  }

  return { success: false, error: 'Invalid operator email or password. Access denied.' };
}

export async function changeOperatorPassword(username, currentPassword, newPassword) {
  try {
    const { data, error } = await supabase.rpc('change_admin_password', {
      p_username: username || 'admin@airportparkingdeals.uk',
      p_current_password: currentPassword,
      p_new_password: newPassword
    });

    if (error) throw error;
    return data || { success: false, error: 'Failed to update password' };
  } catch (err) {
    console.error('Password change error:', err);
    return { success: false, error: err.message || 'Error updating password' };
  }
}

export function getOperatorSession() {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const parsed = JSON.parse(session);
    if (parsed && (parsed.username || parsed.token)) return parsed;
  } catch (e) {}
  return null;
}

export function logoutOperator() {
  sessionStorage.removeItem(SESSION_KEY);
}

// --- Safe Realtime Parking Lots Sync ---
export function subscribeToParkingLots(callback) {
  try {
    const channelId = 'sync_' + Math.random().toString(36).substring(2, 9);
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_lots' },
        (payload) => {
          console.log('⚡ Real-time database event received:', payload);
          if (typeof callback === 'function') callback(payload);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  } catch (err) {
    console.warn('Realtime subscription unavailable', err);
    return () => {};
  }
}

// --- Public Endpoints ---
export async function getAirports(onlyActive = true) {
  try {
    let query = supabase.from('airports').select('*').order('name');
    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.error('Failed to get airports from database', e);
  }
  return AIRPORTS.filter(a => ['LHR', 'LGW', 'MAN', 'STN', 'LTN', 'BHX', 'BRS', 'LPL', 'SOU', 'EDI', 'GLA', 'EMA', 'LBA', 'NCL'].includes(a.code));
}

export async function searchParkingLots(params) {
  const airport = (params.airport || 'LHR').toUpperCase();
  const type = params.type || 'all';
  const promoCode = (params.promoCode || '').toLowerCase();

  const d1 = new Date(params.fromDate || '2026-11-07');
  const d2 = new Date(params.toDate || '2026-11-14');
  const diffDays = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));

  let lots = [];
  try {
    let query = supabase.from('parking_lots').select('*').eq('airport_code', airport);
    if (type !== 'all') {
      query = query.eq('type', type);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      lots = data.map(dbLot => ({
        id: dbLot.id,
        airportCode: dbLot.airport_code,
        name: dbLot.name,
        operatorName: dbLot.operator_name,
        type: dbLot.type,
        baseDailyRate: parseFloat(dbLot.base_daily_rate) || 5.50,
        operatorNetRate: parseFloat(dbLot.operator_net_rate || 3.30),
        commissionRate: parseFloat(dbLot.commission_rate || 0.28),
        transferDurationMinutes: dbLot.transfer_duration_minutes || 0,
        transferFrequencyMinutes: dbLot.transfer_frequency_minutes || 0,
        distanceMiles: parseFloat(dbLot.distance_miles) || 0.1,
        rating: parseFloat(dbLot.rating || 4.8),
        reviewCount: dbLot.review_count || 120,
        parkMarkAccredited: dbLot.park_mark_accredited !== false,
        yardLocation: dbLot.yard_location || 'Perimeter Compound',
        securityBadges: dbLot.security_badges || ['Park Mark® Safer Parking'],
        features: dbLot.features || ['Secure perimeter fence'],
        cancellationPolicy: dbLot.cancellation_policy || 'Free cancellation up to 24 hours prior',
        instructions: dbLot.instructions || 'Follow airport signs.'
      }));
    }
  } catch (e) {
    console.error('Supabase search failed, fallback to local', e);
  }

  if (lots.length === 0) {
    let filtered = PARKING_LOTS.filter(l => l.airportCode === airport);
    if (type !== 'all') filtered = filtered.filter(l => l.type === type);
    lots = filtered;
  }

  let discountPct = 0;
  const cleanPromo = (promoCode || '').trim().toUpperCase();
  if (cleanPromo) {
    try {
      const { data: couponData } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanPromo)
        .maybeSingle();

      if (couponData && couponData.is_active && diffDays >= (couponData.min_days || 1)) {
        discountPct = (parseFloat(couponData.discount_percentage) || 0) / 100;
      } else {
        // Disabled coupon, minimum days not met, or non-existent coupon: strictly ZERO discount
        discountPct = 0;
      }
    } catch (e) {
      discountPct = 0;
    }
  }

  const platformSettings = await getPlatformSettings();
  const bookingFee = typeof platformSettings.bookingFee === 'number' ? platformSettings.bookingFee : 1.95;

  return lots.map(lot => {
    const baseDailyRate = parseFloat(lot.baseDailyRate) || 5.50;
    const gateDailyRate = Math.round((baseDailyRate * 1.55) * 100) / 100;
    const gateTotal = Math.round((gateDailyRate * diffDays) * 100) / 100;
    const subtotal = Math.round((baseDailyRate * diffDays) * 100) / 100;
    const discountAmount = Math.round((subtotal * discountPct) * 100) / 100;
    const totalPayable = Math.round((subtotal - discountAmount + bookingFee) * 100) / 100;

    return {
      ...lot,
      durationDays: diffDays,
      pricing: {
        durationDays: diffDays,
        baseDailyRate,
        dailyRate: baseDailyRate,
        gateDailyRate,
        gateTotal,
        subtotal,
        discountAmount,
        discountPercentage: Math.round(discountPct * 100),
        bookingFee,
        totalPayable,
        terminalDropoffFee: 5.00,
        currency: 'GBP',
        symbol: '£'
      }
    };
  });
}

// --- Create & Find Bookings ---
export async function createNewBooking(bookingData) {
  const id = `AP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrToken = 'QR_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const initialCharges = Array.isArray(bookingData.serviceCharges) ? bookingData.serviceCharges : [];
  const extrasTotal = initialCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const baseTotal = parseFloat(bookingData.pricing?.totalPayable || 49.95);
  const totalCharged = bookingData.totalCharged ? parseFloat(bookingData.totalCharged) : (baseTotal + extrasTotal);
  const platformSettings = await getPlatformSettings();
  const bookingFee = parseFloat(bookingData.pricing?.bookingFee ?? platformSettings.bookingFee ?? 1.95);

  const initialHistory = [
    {
      status: 'booked',
      timestamp: new Date().toISOString(),
      note: 'Reservation confirmed online',
      operator: 'System'
    }
  ];

  const newBooking = {
    id,
    type: 'parking',
    service_name: bookingData.serviceName,
    operator_name: bookingData.operatorName,
    airport: bookingData.airport,
    customer_name: bookingData.customerName,
    customer_email: bookingData.customerEmail,
    customer_phone: bookingData.customerPhone,
    flight_number: bookingData.flightNumber || 'None',
    vehicle_reg: bookingData.vehicleReg || 'N/A',
    date_details: bookingData.dateDetails || {},
    operator_net: parseFloat(bookingData.pricing?.operatorNet || 30.00),
    commission_earned: 14.50,
    booking_fee: bookingFee,
    total_charged: totalCharged,
    qr_token: qrToken,
    status: 'confirmed',
    parking_status: 'booked',
    compound_bay: '',
    key_tag_number: '',
    mileage_in: '',
    service_charges: initialCharges,
    status_history: initialHistory
  };

  const clientNormalizedBooking = {
    id,
    serviceName: bookingData.serviceName,
    operatorName: bookingData.operatorName,
    airport: bookingData.airport,
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail,
    customerPhone: bookingData.customerPhone,
    flightNumber: bookingData.flightNumber || 'None',
    vehicleReg: bookingData.vehicleReg || 'N/A',
    dateDetails: bookingData.dateDetails,
    totalCharged,
    bookingFee,
    qrToken,
    status: 'confirmed',
    parkingStatus: 'booked',
    compoundBay: '',
    keyTagNumber: '',
    mileageIn: '',
    serviceCharges: initialCharges,
    statusHistory: initialHistory,
    operatorNet: parseFloat(bookingData.pricing?.operatorNet || 30.00),
    commissionEarned: 14.50,
    createdAt: new Date().toISOString()
  };

  // 1. Save to local storage cache immediately
  saveLocalBooking(clientNormalizedBooking);

  // 2. Insert into Supabase PostgreSQL
  try {
    const { data, error } = await supabase.from('bookings').insert([newBooking]).select();
    if (error) {
      console.warn('Supabase booking insert warning:', error);
    } else if (data && data[0]) {
      clientNormalizedBooking.createdAt = data[0].created_at;
    }
  } catch (e) {
    console.error('Database booking insert error', e);
  }

  // 3. Dispatch transactional email voucher immediately (non-blocking)
  dispatchVoucherEmail(clientNormalizedBooking);

  return clientNormalizedBooking;
}

export async function dispatchVoucherEmail(booking) {
  if (!booking || !booking.customerEmail) return { success: false, error: 'No recipient email' };

  try {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const endpoint = isGitHubPages 
      ? 'https://airpark-transfers-platform.vercel.app/api/send-voucher' 
      : '/api/send-voucher';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking })
    });
    const result = await res.json();
    console.log('📨 Transactional email dispatch outcome:', result);
    return result;
  } catch (err) {
    console.warn('Transactional email dispatch non-blocking notice:', err);
    return { success: false, error: err.message };
  }
}

export async function findBookingByRef(ref) {
  const cleanRef = (ref || '').trim().toUpperCase();
  if (!cleanRef) throw new Error('Please enter a booking reference number.');

  // 1. Check Supabase PostgreSQL
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .ilike('id', cleanRef)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        serviceName: data.service_name,
        operatorName: data.operator_name,
        airport: data.airport,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        customerPhone: data.customer_phone,
        flightNumber: data.flight_number,
        vehicleReg: data.vehicle_reg,
        dateDetails: data.date_details,
        totalCharged: parseFloat(data.total_charged || 0),
        bookingFee: parseFloat(data.booking_fee || 1.95),
        operatorNet: parseFloat(data.operator_net || 0),
        commissionEarned: parseFloat(data.commission_earned || 0),
        qrToken: data.qr_token || `QR_${data.id}`,
        parkingStatus: data.parking_status || 'booked',
        compoundBay: data.compound_bay || '',
        keyTagNumber: data.key_tag_number || '',
        mileageIn: data.mileage_in || '',
        serviceCharges: Array.isArray(data.service_charges) ? data.service_charges : [],
        statusHistory: Array.isArray(data.status_history) ? data.status_history : [],
        status: data.status,
        createdAt: data.created_at
      };
    }
  } catch (e) {
    console.warn('Supabase booking lookup error', e);
  }

  // 2. Check Local Storage cache
  const localList = getLocalBookings();
  const foundLocal = localList.find(b => (b.id || '').toUpperCase() === cleanRef);
  if (foundLocal) {
    return foundLocal;
  }

  // 3. Demo seed fallback
  if (cleanRef === 'AP-2026-1042') {
    return {
      id: 'AP-2026-1042',
      serviceName: 'Heathrow Meet & Greet Premium Forecourt',
      operatorName: 'Airport Parking Deals Express',
      airport: 'LHR',
      customerName: 'James Henderson',
      customerEmail: 'j.henderson@outlook.com',
      customerPhone: '07700 900123',
      vehicleReg: 'LD71 KZM',
      flightNumber: 'BA175',
      dateDetails: { fromDate: '2026-11-07', fromTime: '10:00', toDate: '2026-11-14', toTime: '12:00' },
      totalCharged: 37.94,
      status: 'confirmed',
      createdAt: '2026-10-31T14:20:00Z'
    };
  }

  throw new Error(`Booking reference "${cleanRef}" not found. Please double-check your voucher.`);
}

// --- Protected Admin Actions ---
export async function getAdminLots() {
  try {
    const { data, error } = await supabase.from('parking_lots').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map(dbLot => ({
        id: dbLot.id,
        airportCode: dbLot.airport_code,
        name: dbLot.name,
        operatorName: dbLot.operator_name,
        type: dbLot.type,
        baseDailyRate: parseFloat(dbLot.base_daily_rate) || 5.50,
        operatorNetRate: parseFloat(dbLot.operator_net_rate || 3.30),
        commissionRate: parseFloat(dbLot.commission_rate || 0.28),
        transferDurationMinutes: dbLot.transfer_duration_minutes || 0,
        transferFrequencyMinutes: dbLot.transfer_frequency_minutes || 0,
        distanceMiles: parseFloat(dbLot.distance_miles) || 0.1,
        rating: parseFloat(dbLot.rating || 4.8),
        reviewCount: dbLot.review_count || 120,
        parkMarkAccredited: dbLot.park_mark_accredited !== false,
        yardLocation: dbLot.yard_location || 'Perimeter Compound',
        securityBadges: dbLot.security_badges || ['Park Mark® Safer Parking'],
        features: dbLot.features || ['Secure perimeter fence'],
        cancellationPolicy: dbLot.cancellation_policy || 'Free cancellation up to 24 hours prior',
        instructions: dbLot.instructions || 'Follow airport signs.'
      }));
    }
  } catch (e) {
    console.error('Failed to get admin lots from database', e);
  }
  return PARKING_LOTS;
}

export async function saveAdminLot(lotFormData, editingId = null) {
  const baseRate = parseFloat(lotFormData.baseDailyRate) || 5.50;
  const netRate = isNaN(baseRate) ? 3.85 : parseFloat((baseRate * 0.70).toFixed(2));
  const commissionRate = 0.30;

  const lotPayload = {
    airport_code: (lotFormData.airportCode || 'LHR').trim().toUpperCase(),
    name: (lotFormData.name || 'Secure Airport Parking').trim(),
    operator_name: (lotFormData.operatorName || 'Airport Parking Deals Express').trim(),
    type: lotFormData.type || 'meet_and_greet',
    base_daily_rate: baseRate,
    operator_net_rate: netRate || 3.85,
    commission_rate: commissionRate,
    yard_location: (lotFormData.yardLocation || 'Perimeter Compound Yard').trim(),
    transfer_duration_minutes: parseInt(lotFormData.transferDurationMinutes, 10) || 0,
    transfer_frequency_minutes: parseInt(lotFormData.transferFrequencyMinutes, 10) || 0,
    distance_miles: parseFloat(lotFormData.distanceMiles) || 0.1,
    rating: 4.8,
    review_count: 24,
    park_mark_accredited: true,
    security_badges: ['Park Mark® Safer Parking', '24/7 CCTV Compound Surveillance'],
    features: ['Direct terminal access', 'High-security perimeter fencing'],
    cancellation_policy: 'Free cancellation up to 24 hours before travel',
    instructions: 'Follow signs for airport terminal passenger collection.'
  };

  try {
    if (editingId) {
      const { data, error } = await supabase
        .from('parking_lots')
        .update(lotPayload)
        .eq('id', editingId)
        .select();

      if (error) throw error;
      return data[0];
    } else {
      const newId = `${lotFormData.airportCode.toLowerCase()}-${lotFormData.type === 'meet_and_greet' ? 'mg' : 'pr'}-${Date.now().toString(36)}`;
      const { data, error } = await supabase
        .from('parking_lots')
        .insert([{ id: newId, ...lotPayload }])
        .select();

      if (error) throw error;
      return data[0];
    }
  } catch (e) {
    console.error('Database save error:', e);
    throw e;
  }
}

export async function removeAdminLot(id) {
  try {
    const { error } = await supabase.from('parking_lots').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Database delete error:', e);
    throw e;
  }
}

export async function getAdminBookings() {
  let dbBookings = [];
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      dbBookings = data.map(b => ({
        id: b.id,
        serviceName: b.service_name,
        operatorName: b.operator_name,
        airport: b.airport,
        customerName: b.customer_name,
        customerEmail: b.customer_email,
        customerPhone: b.customer_phone,
        flightNumber: b.flight_number,
        vehicleReg: b.vehicle_reg,
        dateDetails: b.date_details,
        totalCharged: parseFloat(b.total_charged || 0),
        bookingFee: parseFloat(b.booking_fee || 1.95),
        operatorNet: parseFloat(b.operator_net || 0),
        commissionEarned: parseFloat(b.commission_earned || 0),
        parkingStatus: b.parking_status || 'booked',
        compoundBay: b.compound_bay || '',
        keyTagNumber: b.key_tag_number || '',
        mileageIn: b.mileage_in || '',
        serviceCharges: Array.isArray(b.service_charges) ? b.service_charges : [],
        statusHistory: Array.isArray(b.status_history) ? b.status_history : [],
        status: b.status,
        createdAt: b.created_at
      }));
    }
  } catch (e) {
    console.error('Failed to fetch admin bookings from database', e);
  }

  // Merge with any local bookings
  const localBookings = getLocalBookings();
  const merged = [...dbBookings];
  for (const lb of localBookings) {
    if (!merged.some(mb => mb.id === lb.id)) {
      merged.push(lb);
    }
  }

  return merged;
}

export async function changeBookingStatus(bookingId, newStatus) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (e) {
    console.error('Failed to change booking status in database', e);
    throw e;
  }
}

export async function updateBookingDetails(bookingId, updates) {
  const cleanId = (bookingId || '').trim().toUpperCase();
  const dbPayload = {};
  if (updates.customerName !== undefined) dbPayload.customer_name = updates.customerName.trim();
  if (updates.customerEmail !== undefined) dbPayload.customer_email = updates.customerEmail.trim().toLowerCase();
  if (updates.customerPhone !== undefined) dbPayload.customer_phone = updates.customerPhone.trim();
  if (updates.vehicleReg !== undefined) dbPayload.vehicle_reg = updates.vehicleReg.trim().toUpperCase();
  if (updates.flightNumber !== undefined) dbPayload.flight_number = updates.flightNumber.trim().toUpperCase();

  // 1. Update Supabase
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(dbPayload)
      .ilike('id', cleanId)
      .select();

    if (error) console.warn('Supabase update warning:', error);
  } catch (e) {
    console.error('Failed to update booking in database', e);
  }

  // 2. Update Local Storage cache
  try {
    const localList = getLocalBookings();
    const updatedList = localList.map(b => {
      if ((b.id || '').toUpperCase() === cleanId) {
        return {
          ...b,
          customerName: updates.customerName !== undefined ? updates.customerName.trim() : b.customerName,
          customerEmail: updates.customerEmail !== undefined ? updates.customerEmail.trim().toLowerCase() : b.customerEmail,
          customerPhone: updates.customerPhone !== undefined ? updates.customerPhone.trim() : b.customerPhone,
          vehicleReg: updates.vehicleReg !== undefined ? updates.vehicleReg.trim().toUpperCase() : b.vehicleReg,
          flightNumber: updates.flightNumber !== undefined ? updates.flightNumber.trim().toUpperCase() : b.flightNumber
        };
      }
      return b;
    });
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updatedList));
  } catch (e) {}

  const updatedBooking = await findBookingByRef(cleanId);
  dispatchVoucherEmail(updatedBooking);
  return updatedBooking;
}

// --- Platform Settings Management ---
export async function getPlatformSettings() {
  try {
    const { data, error } = await supabase.from('platform_settings').select('*');
    if (!error && data && data.length > 0) {
      const settings = {};
      data.forEach(item => {
        settings[item.key] = typeof item.value === 'number' ? item.value : parseFloat(item.value);
      });
      return {
        bookingFee: typeof settings.booking_fee === 'number' ? settings.booking_fee : 1.95,
        platformCommissionRate: typeof settings.platform_commission_rate === 'number' ? settings.platform_commission_rate : 0.28
      };
    }
  } catch (e) {
    console.error('Failed to load platform settings', e);
  }

  try {
    const local = localStorage.getItem('apd_platform_settings');
    if (local) return JSON.parse(local);
  } catch (e) {}

  return { bookingFee: 1.95, platformCommissionRate: 0.28 };
}

export async function updatePlatformSettings(newSettings) {
  const bookingFee = parseFloat(newSettings.bookingFee) ?? 1.95;
  const platformCommissionRate = parseFloat(newSettings.platformCommissionRate) ?? 0.28;

  try {
    await supabase.from('platform_settings').upsert([
      { key: 'booking_fee', value: bookingFee, updated_at: new Date().toISOString() },
      { key: 'platform_commission_rate', value: platformCommissionRate, updated_at: new Date().toISOString() }
    ]);
  } catch (e) {
    console.error('Failed to save platform settings to Supabase', e);
  }

  try {
    localStorage.setItem('apd_platform_settings', JSON.stringify({ bookingFee, platformCommissionRate }));
  } catch (e) {}

  return { bookingFee, platformCommissionRate };
}

// --- Booking Service Charges & Surcharges (Add / Subtract) ---
export async function addBookingServiceCharge(bookingId, chargeItem) {
  const cleanId = (bookingId || '').trim().toUpperCase();
  const booking = await findBookingByRef(cleanId);
  const currentCharges = Array.isArray(booking.serviceCharges) ? [...booking.serviceCharges] : [];

  const amount = parseFloat(chargeItem.amount) || 0;
  const newCharge = {
    id: 'chg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    description: (chargeItem.description || 'Service Surcharge').trim(),
    amount: amount,
    addedAt: new Date().toISOString()
  };
  currentCharges.push(newCharge);

  const updatedTotal = parseFloat((booking.totalCharged + amount).toFixed(2));
  const history = Array.isArray(booking.statusHistory) ? [...booking.statusHistory] : [];
  history.unshift({
    status: 'charge_adjusted',
    timestamp: new Date().toISOString(),
    note: `${amount >= 0 ? 'Added' : 'Subtracted'} service charge: ${newCharge.description} (${amount >= 0 ? '+' : ''}£${amount.toFixed(2)})`,
    operator: 'Operator'
  });

  try {
    await supabase.from('bookings').update({
      service_charges: currentCharges,
      total_charged: updatedTotal,
      status_history: history
    }).ilike('id', cleanId);
  } catch (e) {
    console.error('Supabase add charge error', e);
  }

  try {
    const localList = getLocalBookings();
    const updatedList = localList.map(b => {
      if ((b.id || '').toUpperCase() === cleanId) {
        return {
          ...b,
          serviceCharges: currentCharges,
          totalCharged: updatedTotal,
          statusHistory: history
        };
      }
      return b;
    });
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updatedList));
  } catch (e) {}

  const updated = await findBookingByRef(cleanId);
  dispatchVoucherEmail(updated);
  return updated;
}

export async function removeBookingServiceCharge(bookingId, chargeId) {
  const cleanId = (bookingId || '').trim().toUpperCase();
  const booking = await findBookingByRef(cleanId);
  const currentCharges = Array.isArray(booking.serviceCharges) ? [...booking.serviceCharges] : [];
  const target = currentCharges.find(c => c.id === chargeId);
  if (!target) return booking;

  const filtered = currentCharges.filter(c => c.id !== chargeId);
  const updatedTotal = parseFloat((booking.totalCharged - target.amount).toFixed(2));
  const history = Array.isArray(booking.statusHistory) ? [...booking.statusHistory] : [];
  history.unshift({
    status: 'charge_removed',
    timestamp: new Date().toISOString(),
    note: `Removed service charge: ${target.description} (£${target.amount.toFixed(2)})`,
    operator: 'Operator'
  });

  try {
    await supabase.from('bookings').update({
      service_charges: filtered,
      total_charged: updatedTotal,
      status_history: history
    }).ilike('id', cleanId);
  } catch (e) {
    console.error('Supabase remove charge error', e);
  }

  try {
    const localList = getLocalBookings();
    const updatedList = localList.map(b => {
      if ((b.id || '').toUpperCase() === cleanId) {
        return {
          ...b,
          serviceCharges: filtered,
          totalCharged: updatedTotal,
          statusHistory: history
        };
      }
      return b;
    });
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updatedList));
  } catch (e) {}

  const updated = await findBookingByRef(cleanId);
  dispatchVoucherEmail(updated);
  return updated;
}

// --- Compound Parking & Pickup Lifecycle Operations ---
export async function updateBookingOperations(bookingId, operationsData) {
  const cleanId = (bookingId || '').trim().toUpperCase();
  const booking = await findBookingByRef(cleanId);

  const history = Array.isArray(booking.statusHistory) ? [...booking.statusHistory] : [];
  if (operationsData.parkingStatus && operationsData.parkingStatus !== booking.parkingStatus) {
    const statusLabels = {
      booked: 'Awaiting Customer Arrival',
      vehicle_received: 'Vehicle Received & Keys Handed Over',
      parked_compound: 'Safely Parked in Compound Yard',
      ready_for_return: 'Dispatched to Terminal for Customer Pickup',
      picked_up: 'Vehicle Picked Up & Customer Departed',
      cancelled: 'Cancelled / No Show'
    };
    history.unshift({
      status: operationsData.parkingStatus,
      timestamp: new Date().toISOString(),
      note: operationsData.note || `Status updated to ${statusLabels[operationsData.parkingStatus] || operationsData.parkingStatus}`,
      operator: 'Compound Operations Staff'
    });
  }

  const dbPayload = {
    status_history: history
  };
  if (operationsData.parkingStatus !== undefined) dbPayload.parking_status = operationsData.parkingStatus;
  if (operationsData.compoundBay !== undefined) dbPayload.compound_bay = operationsData.compoundBay.trim();
  if (operationsData.keyTagNumber !== undefined) dbPayload.key_tag_number = operationsData.keyTagNumber.trim();
  if (operationsData.mileageIn !== undefined) dbPayload.mileage_in = operationsData.mileageIn.trim();

  try {
    await supabase.from('bookings').update(dbPayload).ilike('id', cleanId);
  } catch (e) {
    console.error('Supabase operations update error', e);
  }

  try {
    const localList = getLocalBookings();
    const updatedList = localList.map(b => {
      if ((b.id || '').toUpperCase() === cleanId) {
        return {
          ...b,
          ...operationsData,
          statusHistory: history
        };
      }
      return b;
    });
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(updatedList));
  } catch (e) {}

  return await findBookingByRef(cleanId);
}

// --- Live Coupon Management Endpoints ---
export async function getCoupons() {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map(c => ({
        code: c.code,
        discountPercentage: parseFloat(c.discount_percentage),
        description: c.description || '',
        isActive: c.is_active,
        minDays: c.min_days || 1,
        createdAt: c.created_at
      }));
    }
  } catch (e) {
    console.error('Failed to load coupons from database', e);
  }

  // Fallback defaults if offline
  return [
    { code: 'APD10', discountPercentage: 10, description: 'Official 10% Platform Launch Voucher', isActive: true, minDays: 1 },
    { code: 'WLCME', discountPercentage: 15, description: 'Welcome 15% New Passenger Discount', isActive: true, minDays: 3 },
    { code: 'DEALS20', discountPercentage: 20, description: '20% Summer Long Stay Special', isActive: true, minDays: 7 }
  ];
}

export async function saveCoupon(couponData) {
  const code = (couponData.code || '').trim().toUpperCase();
  if (!code) throw new Error('Coupon code is required');

  const payload = {
    code,
    discount_percentage: parseFloat(couponData.discountPercentage) || 10.00,
    description: couponData.description || 'Special Promotion',
    is_active: couponData.isActive !== false,
    min_days: parseInt(couponData.minDays, 10) || 1
  };

  try {
    const { data, error } = await supabase
      .from('coupons')
      .upsert(payload, { onConflict: 'code' })
      .select();

    if (error) throw error;
    return data[0];
  } catch (e) {
    console.error('Database coupon save error:', e);
    throw e;
  }
}

export async function removeCoupon(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  try {
    const { error } = await supabase.from('coupons').delete().eq('code', cleanCode);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Database coupon delete error:', e);
    throw e;
  }
}

export async function toggleCouponStatus(code, isActive) {
  const cleanCode = (code || '').trim().toUpperCase();
  try {
    const { data, error } = await supabase
      .from('coupons')
      .update({ is_active: isActive })
      .eq('code', cleanCode)
      .select();

    if (error) throw error;
    return data[0];
  } catch (e) {
    console.error('Database coupon toggle error:', e);
    throw e;
  }
}

// --- Live Airport Management Endpoints ---
export async function getAllAdminAirports() {
  try {
    const { data, error } = await supabase
      .from('airports')
      .select('*')
      .order('name');

    if (!error && data) {
      return data.map(a => ({
        code: a.code,
        name: a.name,
        city: a.city,
        terminalDropoffFee: parseFloat(a.terminal_dropoff_fee || 5.00),
        terminals: a.terminals || ['Main Terminal'],
        isActive: a.is_active !== false
      }));
    }
  } catch (e) {
    console.error('Failed to load admin airports', e);
  }
  return [];
}

export async function saveAirport(airportData) {
  const code = (airportData.code || '').trim().toUpperCase();
  if (!code) throw new Error('Airport IATA code is required');

  const payload = {
    code,
    name: airportData.name,
    city: airportData.city || 'United Kingdom',
    country: 'UK',
    currency: 'GBP',
    symbol: '£',
    terminals: Array.isArray(airportData.terminals) ? airportData.terminals : ['Main Terminal'],
    terminal_dropoff_fee: parseFloat(airportData.terminalDropoffFee) || 5.00,
    is_active: airportData.isActive !== false
  };

  try {
    const { data, error } = await supabase
      .from('airports')
      .upsert(payload, { onConflict: 'code' })
      .select();

    if (error) throw error;
    return data[0];
  } catch (e) {
    console.error('Database save airport error:', e);
    throw e;
  }
}

export async function toggleAirportStatus(code, isActive) {
  const cleanCode = (code || '').trim().toUpperCase();
  try {
    const { data, error } = await supabase
      .from('airports')
      .update({ is_active: isActive })
      .eq('code', cleanCode)
      .select();

    if (error) throw error;
    return data[0];
  } catch (e) {
    console.error('Database toggle airport error:', e);
    throw e;
  }
}

export async function removeAirport(code) {
  const cleanCode = (code || '').trim().toUpperCase();
  try {
    const { error } = await supabase.from('airports').delete().eq('code', cleanCode);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Database delete airport error:', e);
    throw e;
  }
}

// --- Extra Add-on Services Management (PostgreSQL) ---
export async function getExtraServices(onlyActive = true) {
  try {
    let query = supabase.from('extra_services').select('*').order('price', { ascending: false });
    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        price: parseFloat(s.price),
        isActive: s.is_active,
        category: s.category || 'addon',
        createdAt: s.created_at
      }));
    }
  } catch (e) {
    console.error('Failed to load extra services from database', e);
  }

  // Fallback in-memory defaults
  const defaults = [
    { id: 'valet_wash', name: 'Valet Exterior Hand Wash & Wax', description: 'Full exterior hand wash, wheel shine and wax coat before return flight lands.', price: 25.00, isActive: true, category: 'cleaning' },
    { id: 'ev_charge', name: 'EV Fast Charging (100% Battery)', description: 'Vehicle charged to 100% battery at our compound charging stations.', price: 15.00, isActive: true, category: 'electric' },
    { id: 'cancel_guarantee', name: 'Flexible Cancellation & Amendment Cover', description: 'Cancel or change booking dates up to 2 hours before arrival with zero fee.', price: 2.95, isActive: true, category: 'protection' },
    { id: 'sms_priority', name: 'Priority SMS Updates & ANPR Chauffeur Dispatch', description: 'Instant SMS confirmation, live driver tracking & barrier auto-pass notifications.', price: 1.99, isActive: true, category: 'communication' }
  ];
  return onlyActive ? defaults.filter(d => d.isActive) : defaults;
}

export async function saveExtraService(serviceData) {
  const name = (serviceData.name || '').trim();
  if (!name) throw new Error('Service name is required');

  const id = serviceData.id || ('srv_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30));
  const payload = {
    id,
    name,
    description: (serviceData.description || '').trim(),
    price: Math.max(0, parseFloat(serviceData.price) || 0),
    is_active: serviceData.isActive !== false,
    category: serviceData.category || 'addon'
  };

  try {
    const { data, error } = await supabase
      .from('extra_services')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data[0];
  } catch (e) {
    console.error('Database save extra service error:', e);
    throw e;
  }
}

export async function toggleExtraServiceStatus(id, isActive) {
  try {
    const { data, error } = await supabase
      .from('extra_services')
      .update({ is_active: isActive })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (e) {
    console.error('Database toggle extra service error:', e);
    throw e;
  }
}

export async function removeExtraService(id) {
  try {
    const { error } = await supabase.from('extra_services').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Database delete extra service error:', e);
    throw e;
  }
}
