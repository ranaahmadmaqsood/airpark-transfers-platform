// Universal API client: calls backend /api if available, otherwise seamlessly
// handles in-browser with localStorage persistence (for GitHub Pages static hosting)

import { AIRPORTS } from '../data/airports.js';
import { PARKING_LOTS } from '../data/parkingLots.js';

const STORAGE_KEY_LOTS = 'apd_admin_lots_v1';
const STORAGE_KEY_BOOKINGS = 'apd_bookings_v1';

// Initial seed
function getStoredLots() {
  const local = localStorage.getItem(STORAGE_KEY_LOTS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem(STORAGE_KEY_LOTS, JSON.stringify(PARKING_LOTS));
  return PARKING_LOTS;
}

function setStoredLots(lots) {
  localStorage.setItem(STORAGE_KEY_LOTS, JSON.stringify(lots));
}

function getStoredBookings() {
  const local = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  const initial = [
    {
      id: 'AP-2026-1042',
      type: 'parking',
      airport: 'LHR',
      serviceName: 'Heathrow Meet & Greet Premium Forecourt',
      customerName: 'James Henderson',
      customerEmail: 'j.henderson@outlook.com',
      customerPhone: '07700 900123',
      vehicleReg: 'LD71 KZM',
      flightNumber: 'BA175',
      dateDetails: { fromDate: '2026-11-07', fromTime: '10:00', toDate: '2026-11-14', toTime: '12:00' },
      totalCharged: 37.94,
      status: 'confirmed',
      createdAt: '2026-10-31T14:20:00Z'
    },
    {
      id: 'AP-2026-1043',
      type: 'parking',
      airport: 'LGW',
      serviceName: 'Gatwick Park & Ride Shuttle Yard',
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah.j@gmail.com',
      customerPhone: '07890 123456',
      vehicleReg: 'GF22 XLT',
      flightNumber: 'EZY8401',
      dateDetails: { fromDate: '2026-11-10', fromTime: '06:00', toDate: '2026-11-17', toTime: '18:00' },
      totalCharged: 28.50,
      status: 'completed',
      createdAt: '2026-10-31T15:10:00Z'
    }
  ];
  localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(initial));
  return initial;
}

function setStoredBookings(bookings) {
  localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
}

// 1. Fetch Airports
export async function getAirports() {
  try {
    const res = await fetch('/api/airports');
    if (res.ok) {
      const data = await res.json();
      if (data.airports) return data.airports;
    }
  } catch (e) {
    // fallback
  }
  return AIRPORTS;
}

// 2. Search Parking Quotes
export async function searchParkingLots(params) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/parking/search?${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results) return data.results;
    }
  } catch (e) {
    // fallback
  }

  // Client-side fallback computation
  const lots = getStoredLots();
  const airport = (params.airport || 'LHR').toUpperCase();
  const type = params.type || 'all';
  const promoCode = (params.promoCode || '').toLowerCase();

  const d1 = new Date(params.fromDate || '2026-11-07');
  const d2 = new Date(params.toDate || '2026-11-14');
  const diffDays = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));

  let filtered = lots.filter(l => l.airportCode === airport);
  if (type !== 'all') {
    filtered = filtered.filter(l => l.type === type);
  }

  let discountPct = 0;
  if (promoCode === 'apd10' || promoCode === 'deals10') discountPct = 0.10;
  else if (promoCode === 'wlcme' || promoCode === 'welcome15') discountPct = 0.15;

  return filtered.map(lot => {
    const gateDailyRate = Math.round((lot.baseDailyRate * 1.55) * 100) / 100;
    const gateTotal = Math.round((gateDailyRate * diffDays) * 100) / 100;
    const subtotal = Math.round((lot.baseDailyRate * diffDays) * 100) / 100;
    const discountAmount = Math.round((subtotal * discountPct) * 100) / 100;
    const bookingFee = 1.95;
    const totalPayable = Math.round((subtotal - discountAmount + bookingFee) * 100) / 100;

    return {
      ...lot,
      pricing: {
        durationDays: diffDays,
        baseDailyRate: lot.baseDailyRate,
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

// 3. Create Booking
export async function createNewBooking(bookingData) {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.booking) return data.booking;
    }
  } catch (e) {
    // fallback
  }

  // Client-side fallback
  const bookings = getStoredBookings();
  const id = `AP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const record = {
    ...bookingData,
    id,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    totalCharged: bookingData.pricing?.totalPayable || 49.95
  };
  bookings.unshift(record);
  setStoredBookings(bookings);
  return record;
}

// 4. Lookup Booking
export async function findBookingByRef(ref) {
  try {
    const res = await fetch(`/api/bookings?id=${ref.toUpperCase()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.booking) return data.booking;
    }
  } catch (e) {
    // fallback
  }

  const bookings = getStoredBookings();
  const found = bookings.find(b => b.id.toUpperCase() === ref.toUpperCase());
  if (found) return found;
  throw new Error(`Booking reference "${ref}" not found`);
}

// 5. Admin: Fetch Lots
export async function getAdminLots() {
  try {
    const res = await fetch('/api/admin/lots');
    if (res.ok) {
      const data = await res.json();
      if (data.lots) return data.lots;
    }
  } catch (e) {
    // fallback
  }
  return getStoredLots();
}

// 6. Admin: Save (Add or Update) Lot
export async function saveAdminLot(lotFormData, editingId = null) {
  try {
    if (editingId) {
      const res = await fetch(`/api/admin/lots?id=${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lotFormData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.lot;
      }
    } else {
      const res = await fetch('/api/admin/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lotFormData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.lot;
      }
    }
  } catch (e) {
    // fallback
  }

  const lots = [...getStoredLots()];
  if (editingId) {
    const idx = lots.findIndex(l => l.id === editingId);
    if (idx !== -1) {
      lots[idx] = {
        ...lots[idx],
        ...lotFormData,
        baseDailyRate: parseFloat(lotFormData.baseDailyRate) || lots[idx].baseDailyRate
      };
      setStoredLots(lots);
      return lots[idx];
    }
  } else {
    const newLot = {
      ...lotFormData,
      id: `${lotFormData.airportCode.toLowerCase()}-${lotFormData.type === 'meet_and_greet' ? 'mg' : 'pr'}-${Date.now().toString(36)}`,
      baseDailyRate: parseFloat(lotFormData.baseDailyRate) || 5.50,
      operatorNetRate: 3.50,
      commissionRate: 0.28,
      transferDurationMinutes: parseInt(lotFormData.transferDurationMinutes, 10) || 0,
      transferFrequencyMinutes: parseInt(lotFormData.transferFrequencyMinutes, 10) || 0,
      distanceMiles: parseFloat(lotFormData.distanceMiles) || 0.1,
      rating: 4.8,
      reviewCount: 12,
      parkMarkAccredited: true,
      securityBadges: ['Park Mark® Safer Parking', '24/7 Monitored Compound'],
      features: ['Secure perimeter fence', 'CCTV surveillance'],
      cancellationPolicy: 'Free cancellation up to 24h before travel',
      instructions: 'Follow signs for airport passenger drop-off.'
    };
    lots.unshift(newLot);
    setStoredLots(lots);
    return newLot;
  }
}

// 7. Admin: Delete Lot
export async function removeAdminLot(id) {
  try {
    const res = await fetch(`/api/admin/lots?id=${id}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch (e) {
    // fallback
  }
  const lots = getStoredLots().filter(l => l.id !== id);
  setStoredLots(lots);
  return true;
}

// 8. Admin: Fetch Bookings
export async function getAdminBookings() {
  try {
    const res = await fetch('/api/admin/bookings');
    if (res.ok) {
      const data = await res.json();
      if (data.bookings) return data.bookings;
    }
  } catch (e) {
    // fallback
  }
  return getStoredBookings();
}

// 9. Admin: Update Booking Status
export async function changeBookingStatus(bookingId, newStatus) {
  try {
    const res = await fetch(`/api/admin/bookings?id=${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      const data = await res.json();
      return data.booking;
    }
  } catch (e) {
    // fallback
  }

  const bookings = [...getStoredBookings()];
  const idx = bookings.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    bookings[idx].status = newStatus;
    setStoredBookings(bookings);
    return bookings[idx];
  }
  return null;
}
