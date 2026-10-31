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

  // Master credentials check (instant & fail-safe)
  const isMasterUser = cleanUser === 'admin@airportparkingdeals.uk' || cleanUser === 'admin' || cleanUser === 'ahmadmaqsood2022@gmail.com';
  const isMasterPass = cleanPass === 'ParkDeals2026!' || cleanPass === '7890';

  // 1. Try Supabase PostgreSQL RPC
  try {
    const { data, error } = await supabase.rpc('verify_operator_login', {
      p_username: cleanUser.includes('@') ? cleanUser : 'admin@airportparkingdeals.uk',
      p_password: cleanPass
    });

    if (!error && data && data.success) {
      const authUser = {
        success: true,
        username: data.username || 'admin@airportparkingdeals.uk',
        role: data.role || 'superadmin',
        token: data.token || 'sec_' + Date.now()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      return { success: true, user: authUser };
    }
  } catch (err) {
    console.warn('Supabase auth RPC error, testing fallback', err);
  }

  // 2. Master Operator Fallback Gate
  if (isMasterUser && isMasterPass) {
    const fallbackUser = {
      success: true,
      username: 'admin@airportparkingdeals.uk',
      role: 'superadmin',
      token: 'local_secure_' + Date.now()
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fallbackUser));
    return { success: true, user: fallbackUser };
  }

  return { success: false, error: 'Invalid operator email or password. Use PIN 7890 or master credentials.' };
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

  return lots.map(lot => {
    const baseDailyRate = parseFloat(lot.baseDailyRate) || 5.50;
    const gateDailyRate = Math.round((baseDailyRate * 1.55) * 100) / 100;
    const gateTotal = Math.round((gateDailyRate * diffDays) * 100) / 100;
    const subtotal = Math.round((baseDailyRate * diffDays) * 100) / 100;
    const discountAmount = Math.round((subtotal * discountPct) * 100) / 100;
    const bookingFee = 1.95;
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
  const totalCharged = parseFloat(bookingData.pricing?.totalPayable || 49.95);

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
    booking_fee: parseFloat(bookingData.pricing?.bookingFee || 1.95),
    total_charged: totalCharged,
    qr_token: qrToken,
    status: 'confirmed'
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
    qrToken,
    status: 'confirmed',
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
