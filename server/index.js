const express = require('express');
const cors = require('cors');
const path = require('path');
const { AIRPORTS } = require('./data/airports');
const { PARKING_LOTS } = require('./data/parkingLots');
const { VEHICLE_TIERS, POPULAR_ROUTES, calculateTransferQuote } = require('./data/transfers');
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
  const { airport = 'LHR', fromDate, toDate, type, sortBy = 'recommended' } = req.query;

  // Calculate duration in days
  let durationDays = 7;
  if (fromDate && toDate) {
    const diffTime = Math.abs(new Date(toDate) - new Date(fromDate));
    durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Filter by airport code
  let results = PARKING_LOTS.filter(lot => lot.airportCode.toUpperCase() === airport.toUpperCase());

  // Filter by type if provided
  if (type && type !== 'all') {
    results = results.filter(lot => lot.type === type);
  }

  // Compute pricing quote with transparent business model breakdown
  const quotes = results.map(lot => {
    const totalDailyRate = Math.round(lot.baseDailyRate * durationDays * 100) / 100;
    const operatorNet = Math.round(lot.operatorNetRate * durationDays * 100) / 100;
    const platformCommission = Math.round((totalDailyRate - operatorNet) * 100) / 100;
    
    // Fixed platform booking fee (OTA model: £2.99 / $3.99)
    const bookingFee = (lot.airportCode === 'JFK' || lot.airportCode === 'EWR' || lot.airportCode === 'LAX') ? 3.99 : 2.99;
    const customerTotal = Math.round((totalDailyRate + bookingFee) * 100) / 100;

    // Currency metadata
    const airportMeta = AIRPORTS.find(a => a.code === lot.airportCode) || { currency: 'GBP', symbol: '£' };

    return {
      ...lot,
      durationDays,
      pricing: {
        dailyRate: lot.baseDailyRate,
        subtotal: totalDailyRate,
        bookingFee,
        totalPayable: customerTotal,
        // Business model transparency data:
        operatorNet,
        platformCommission,
        currency: airportMeta.currency,
        symbol: airportMeta.symbol
      }
    };
  });

  // Sorting
  if (sortBy === 'price_asc') {
    quotes.sort((a, b) => a.pricing.totalPayable - b.pricing.totalPayable);
  } else if (sortBy === 'rating_desc') {
    quotes.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'distance_asc') {
    quotes.sort((a, b) => a.distanceMiles - b.distanceMiles);
  } else if (sortBy === 'transfer_time') {
    quotes.sort((a, b) => a.transferDurationMinutes - b.transferDurationMinutes);
  }

  res.json({
    airport,
    durationDays,
    totalFound: quotes.length,
    results: quotes
  });
});

// 3. Private Hire / Chauffeur Transfers Quote (Royal Cars model)
app.get('/api/transfers/quote', (req, res) => {
  const {
    pickup = 'Central London (WC1/EC1)',
    airport = 'LHR',
    vehicle = 'standard_saloon',
    meetAndGreet = 'false',
    childSeats = '0'
  } = req.query;

  const quote = calculateTransferQuote(pickup, airport, vehicle, {
    meetAndGreet: meetAndGreet === 'true',
    childSeats: parseInt(childSeats, 10) || 0,
    flightTracking: true
  });

  res.json({
    quote,
    availableTiers: VEHICLE_TIERS,
    popularPickupLocations: Object.keys(POPULAR_ROUTES)
  });
});

// 4. Create Booking (processes both Parking and Transfers)
app.post('/api/bookings', (req, res) => {
  const {
    type, // 'parking' | 'transfer'
    serviceName,
    operatorName,
    airport,
    customerName,
    customerEmail,
    customerPhone,
    flightNumber,
    vehicleReg,
    dateDetails,
    pricing
  } = req.body;

  if (!customerName || !customerEmail) {
    return res.status(400).json({ error: 'Customer name and email are required' });
  }

  const bookingFee = pricing?.bookingFee || (type === 'parking' ? 2.99 : 1.99);
  const totalCharged = pricing?.totalPayable || pricing?.grossTotal || 79.99;
  const commissionEarned = pricing?.platformCommission || (totalCharged * 0.18);
  const operatorNet = pricing?.operatorNet || pricing?.driverPayout || (totalCharged - commissionEarned);

  const newBooking = revenueLedger.recordBooking({
    type,
    serviceName: serviceName || 'Airport Service',
    operatorName: operatorName || 'Verified Partner Operator',
    customerName,
    customerEmail,
    customerPhone: customerPhone || 'N/A',
    flightNumber: flightNumber || 'N/A',
    vehicleReg: vehicleReg || 'N/A',
    airport: airport || 'LHR',
    dateDetails: dateDetails || {},
    operatorNet: Math.round(operatorNet * 100) / 100,
    commissionEarned: Math.round(commissionEarned * 100) / 100,
    bookingFee: Math.round(bookingFee * 100) / 100,
    totalCharged: Math.round(totalCharged * 100) / 100,
    status: 'confirmed'
  });

  res.status(201).json({
    success: true,
    message: 'Booking confirmed successfully',
    booking: newBooking
  });
});

// 5. Retrieve Booking by ID or QR Token (supports both /api/bookings?id=... and /api/bookings/:id)
app.get('/api/bookings', (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.json({ bookings: revenueLedger.bookings });
  }
  const booking = revenueLedger.findBooking(id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking voucher not found' });
  }
  res.json({ booking });
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = revenueLedger.findBooking(req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking voucher not found' });
  }
  res.json({ booking });
});

// 6. Admin Revenue Model Metrics & Ledgers
app.get('/api/admin/metrics', (req, res) => {
  const metrics = revenueLedger.getMetrics();
  res.json(metrics);
});

// Serve frontend if built
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), err => {
    if (err) {
      res.send('AirPark Transfers API Server running on port ' + PORT);
    }
  });
});

app.listen(PORT, () => {
  console.log(`✈️ AirPark Transfers Platform Backend running on http://localhost:${PORT}`);
});
