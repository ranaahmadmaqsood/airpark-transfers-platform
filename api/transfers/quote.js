const { VEHICLE_TIERS, POPULAR_ROUTES, calculateTransferQuote } = require('../../server/data/transfers');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  return res.status(200).json({
    quote,
    availableTiers: VEHICLE_TIERS,
    popularPickupLocations: Object.keys(POPULAR_ROUTES)
  });
};
