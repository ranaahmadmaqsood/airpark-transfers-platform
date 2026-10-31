const { PARKING_LOTS } = require('../../server/data/parkingLots');
const { AIRPORTS } = require('../../server/data/airports');
const { supabase } = require('../../server/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { airport = 'LHR', fromDate, toDate, type, sortBy = 'recommended' } = req.query;

  let durationDays = 7;
  if (fromDate && toDate) {
    const diffTime = Math.abs(new Date(toDate) - new Date(fromDate));
    durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  let results = [];

  try {
    let query = supabase.from('parking_lots').select('*').eq('airport_code', airport.toUpperCase());
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      results = data.map(item => ({
        id: item.id,
        airportCode: item.airport_code,
        name: item.name,
        operatorName: item.operator_name,
        type: item.type,
        baseDailyRate: parseFloat(item.base_daily_rate),
        operatorNetRate: parseFloat(item.operator_net_rate),
        commissionRate: parseFloat(item.commission_rate),
        transferDurationMinutes: item.transfer_duration_minutes,
        transferFrequencyMinutes: item.transfer_frequency_minutes,
        distanceMiles: parseFloat(item.distance_miles),
        rating: parseFloat(item.rating),
        reviewCount: item.review_count,
        parkMarkAccredited: item.park_mark_accredited,
        securityBadges: item.security_badges || [],
        features: item.features || [],
        cancellationPolicy: item.cancellation_policy,
        instructions: item.instructions
      }));
    }
  } catch (e) {
    console.error('Supabase query failed, falling back', e);
  }

  if (results.length === 0) {
    results = PARKING_LOTS.filter(lot => lot.airportCode.toUpperCase() === airport.toUpperCase());
    if (type && type !== 'all') {
      results = results.filter(lot => lot.type === type);
    }
  }

  const quotes = results.map(lot => {
    const totalDailyRate = Math.round(lot.baseDailyRate * durationDays * 100) / 100;
    const operatorNet = Math.round(lot.operatorNetRate * durationDays * 100) / 100;
    const platformCommission = Math.round((totalDailyRate - operatorNet) * 100) / 100;
    const bookingFee = (lot.airportCode === 'JFK' || lot.airportCode === 'EWR' || lot.airportCode === 'LAX') ? 3.99 : 2.99;
    const customerTotal = Math.round((totalDailyRate + bookingFee) * 100) / 100;

    const airportMeta = AIRPORTS.find(a => a.code === lot.airportCode) || { currency: 'GBP', symbol: '£' };

    return {
      ...lot,
      durationDays,
      pricing: {
        dailyRate: lot.baseDailyRate,
        subtotal: totalDailyRate,
        bookingFee,
        totalPayable: customerTotal,
        operatorNet,
        platformCommission,
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
  } else if (sortBy === 'transfer_time') {
    quotes.sort((a, b) => a.transferDurationMinutes - b.transferDurationMinutes);
  }

  return res.status(200).json({
    airport,
    durationDays,
    totalFound: quotes.length,
    results: quotes
  });
};
