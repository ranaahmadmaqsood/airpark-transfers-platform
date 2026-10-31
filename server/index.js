const express = require('express');
const cors = require('cors');
const path = require('path');
const { AIRPORTS } = require('./data/airports');
const { PARKING_LOTS } = require('./data/parkingLots');
const revenueLedger = require('./services/revenueLedger');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// 1. Airports Endpoint
app.get('/api/airports', (req, res) => {
  res.json({ airports: AIRPORTS });
});

// 2. Parking Search & Comparison Engine
app.get('/api/parking/search', (req, res) => {
  const {
    airport = 'LHR',
    fromDate,
    toDate,
    fromTime = '10:00',
    toTime = '12:00',
    type = 'all',
    promoCode = 'apd10',
    sortBy = 'recommended'
  } = req.query;

  let durationDays = 7;
  if (fromDate && toDate) {
    const diffTime = Math.abs(new Date(toDate) - new Date(fromDate));
    durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  let results = PARKING_LOTS.filter((lot) => lot.airportCode.toUpperCase() === airport.toUpperCase());

  if (type && type !== 'all') {
    results = results.filter((lot) => lot.type === type);
  }

  const normPromo = (promoCode || '').trim().toLowerCase();
  let discountPercentage = 0;
  let promoMessage = '';
  if (normPromo === 'apd10' || normPromo === 'cpd10') {
    discountPercentage = 0.10;
    promoMessage = '10% Discount Applied (Code: ' + promoCode.toUpperCase() + ')';
  } else if (normPromo === 'wlcme' || normPromo === 'cmpwlcme') {
    discountPercentage = 0.15;
    promoMessage = '15% Welcome Discount Applied (Code: ' + promoCode.toUpperCase() + ')';
  } else if (normPromo === 'save20') {
    discountPercentage = 0.20;
    promoMessage = '20% Super Saver Applied (Code: ' + promoCode.toUpperCase() + ')';
  }

  const airportMeta = AIRPORTS.find((a) => a.code === airport.toUpperCase()) || {
    currency: 'GBP',
    symbol: '£',
    terminalDropoffFee: 5.00
  };

  const quotes = results.map((lot) => {
    const gateAnchorRate = lot.baseDailyRate * 2.2;
    const gateTotal = Math.round(gateAnchorRate * durationDays * 100) / 100;
    const subtotal = Math.round(lot.baseDailyRate * durationDays * 100) / 100;
    const discountAmount = Math.round(subtotal * discountPercentage * 100) / 100;
    const discountedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;
    const bookingFee = 1.95;
    const customerTotal = Math.round((discountedSubtotal + bookingFee) * 100) / 100;
    const operatorNet = Math.round(lot.operatorNetRate * durationDays * 100) / 100;
    const platformMargin = Math.round((customerTotal - operatorNet) * 100) / 100;

    return {
      ...lot,
      durationDays,
      pricing: {
        dailyRate: lot.baseDailyRate,
        gateTotal,
        subtotal,
        discountAmount,
        discountPercentage: Math.round(discountPercentage * 100),
        bookingFee,
        totalPayable: customerTotal,
        terminalDropoffFee: airportMeta.terminalDropoffFee,
        operatorNet,
        platformMargin,
        currency: airportMeta.currency,
        symbol: airportMeta.symbol
      }
    };
  });

  if (sortBy === 'price_asc') {
    quotes.sort((a, b) => a.pricing.totalPayable - b.pricing.totalPayable);
  } else if (sortBy === 'rating_desc') {
    quotes.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'distance_asc') {
    quotes.sort((a, b) => a.distanceMiles - b.distanceMiles);
  }

  res.json({
    airport,
    durationDays,
    promoCode: promoCode || '',
    promoMessage,
    discountPercentage: Math.round(discountPercentage * 100),
    totalFound: quotes.length,
    results: quotes
  });
});

// 3. Create Booking
app.post('/api/bookings', (req, res) => {
  const {
    serviceName,
    operatorName,
    airport,
    customerName,
    customerEmail,
    customerPhone,
    flightNumber,
    vehicleReg,
    dateDetails,
    pricing,
    promoCode
  } = req.body;

  if (!customerName || !customerEmail) {
    return res.status(400).json({ error: 'Customer name and email are required' });
  }

  const bookingFee = pricing?.bookingFee || 1.95;
  const totalCharged = pricing?.totalPayable || 49.95;
  const operatorNet = pricing?.operatorNet || (totalCharged - 14.00);
  const commissionEarned = Math.round((totalCharged - operatorNet) * 100) / 100;

  const newBooking = revenueLedger.recordBooking({
    type: 'parking',
    serviceName: serviceName || 'Airport Parking',
    operatorName: operatorName || 'Airport Parking Deals Express',
    customerName,
    customerEmail,
    customerPhone: customerPhone || 'N/A',
    flightNumber: flightNumber || 'N/A',
    vehicleReg: vehicleReg || 'N/A',
    airport: airport || 'LHR',
    dateDetails: dateDetails || {},
    promoCode: promoCode || 'apd10',
    operatorNet: Math.round(operatorNet * 100) / 100,
    commissionEarned,
    bookingFee,
    totalCharged: Math.round(totalCharged * 100) / 100,
    status: 'confirmed'
  });

  res.status(201).json({
    success: true,
    message: 'Booking confirmed successfully',
    booking: newBooking
  });
});

// 4. Retrieve Booking by ID or QR Token
app.get('/api/bookings', (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.json({ bookings: revenueLedger.bookings });
  }
  const booking = revenueLedger.findBooking(id);
  if (!booking) return res.status(404).json({ error: 'Booking voucher not found' });
  res.json({ booking });
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = revenueLedger.findBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking voucher not found' });
  }
  res.json({ booking });
});

const adminService = require('./services/adminService');

// 5. Admin Endpoints for Pricing, Locations & Order Status
app.get('/api/admin/lots', (req, res) => {
  res.json({ lots: adminService.getAllLots() });
});

app.post('/api/admin/lots', (req, res) => {
  const newLot = adminService.addLot(req.body);
  res.status(201).json({ success: true, lot: newLot });
});

const handleLotUpdate = (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Lot ID required' });
  const updated = adminService.updateLot(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Lot not found' });
  res.json({ success: true, lot: updated });
};

const handleLotDelete = (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Lot ID required' });
  const deleted = adminService.deleteLot(id);
  if (!deleted) return res.status(404).json({ error: 'Lot not found' });
  res.json({ success: true, message: 'Lot deleted' });
};

app.put('/api/admin/lots', handleLotUpdate);
app.put('/api/admin/lots/:id', handleLotUpdate);

app.delete('/api/admin/lots', handleLotDelete);
app.delete('/api/admin/lots/:id', handleLotDelete);

app.get('/api/admin/bookings', (req, res) => {
  res.json({
    bookings: revenueLedger.bookings,
    stats: revenueLedger.stats
  });
});

const handleBookingUpdate = (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Booking ID required' });
  const updated = adminService.updateBookingStatus(id, req.body.status);
  if (!updated) return res.status(404).json({ error: 'Booking not found' });
  res.json({ success: true, booking: updated });
};

app.put('/api/admin/bookings', handleBookingUpdate);
app.put('/api/admin/bookings/:id', handleBookingUpdate);

// 6. Admin Metrics
app.get('/api/admin/metrics', (req, res) => {
  const metrics = revenueLedger.getMetrics();
  res.json(metrics);
});

// 7. Transactional Email Dispatch Endpoint
const sendVoucherHandler = require('../api/send-voucher');
app.post('/api/send-voucher', (req, res) => {
  sendVoucherHandler(req, res);
});

// Serve frontend build if available
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.send('Airport Parking Deals UK API Server running on port ' + PORT);
    }
  });
});

app.listen(PORT, () => {
  console.log(`🇬🇧 Airport Parking Deals UK Server running on http://localhost:${PORT}`);
});
