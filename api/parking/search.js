const { PARKING_LOTS } = require('../../server/data/parkingLots');
const { AIRPORTS } = require('../../server/data/airports');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  // Duration in days (default 7 days)
  let durationDays = 7;
  if (fromDate && toDate) {
    const diffTime = Math.abs(new Date(toDate) - new Date(fromDate));
    durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Filter by airport code
  let results = PARKING_LOTS.filter((lot) => lot.airportCode.toUpperCase() === airport.toUpperCase());

  // Filter by type
  if (type && type !== 'all') {
    results = results.filter((lot) => lot.type === type);
  }

  // Promo code discount resolution
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
    // Official Airport Gate price anchor (shows 50%-60% savings)
    const gateAnchorRate = lot.baseDailyRate * 2.2;
    const gateTotal = Math.round(gateAnchorRate * durationDays * 100) / 100;

    // Base subtotal
    const subtotal = Math.round(lot.baseDailyRate * durationDays * 100) / 100;
    
    // Promo discount deduction
    const discountAmount = Math.round(subtotal * discountPercentage * 100) / 100;
    const discountedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;

    // Platform booking fee (£1.95)
    const bookingFee = 1.95;
    
    // Final customer total
    const customerTotal = Math.round((discountedSubtotal + bookingFee) * 100) / 100;

    // Operator net payout & platform margin
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

  // Sorting
  if (sortBy === 'price_asc') {
    quotes.sort((a, b) => a.pricing.totalPayable - b.pricing.totalPayable);
  } else if (sortBy === 'rating_desc') {
    quotes.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'distance_asc') {
    quotes.sort((a, b) => a.distanceMiles - b.distanceMiles);
  }

  return res.status(200).json({
    airport,
    durationDays,
    promoCode: promoCode || '',
    promoMessage,
    discountPercentage: Math.round(discountPercentage * 100),
    totalFound: quotes.length,
    results: quotes
  });
};
