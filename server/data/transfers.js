const VEHICLE_TIERS = [
  {
    tierId: 'standard_saloon',
    name: 'Standard Saloon',
    exampleVehicles: 'Toyota Prius / Skoda Superb / VW Passat',
    maxPassengers: 4,
    maxLuggage: 2,
    baseFare: 15.00,
    ratePerMile: 2.30,
    hourlyWaitRate: 20.00,
    imageIcon: 'Car'
  },
  {
    tierId: 'estate',
    name: 'Estate / Station Wagon',
    exampleVehicles: 'Skoda Octavia Estate / Mercedes C-Class Estate',
    maxPassengers: 4,
    maxLuggage: 4,
    baseFare: 20.00,
    ratePerMile: 2.60,
    hourlyWaitRate: 22.00,
    imageIcon: 'Truck'
  },
  {
    tierId: 'executive_chauffeur',
    name: 'Executive Chauffeur',
    exampleVehicles: 'Mercedes-Benz E-Class / BMW 5-Series / Audi A6',
    maxPassengers: 3,
    maxLuggage: 2,
    baseFare: 30.00,
    ratePerMile: 3.40,
    hourlyWaitRate: 35.00,
    imageIcon: 'Shield'
  },
  {
    tierId: 'mpv_minibus',
    name: 'MPV / 8-Seater Minivan',
    exampleVehicles: 'Mercedes-Benz Vito / VW Transporter Shuttle',
    maxPassengers: 8,
    maxLuggage: 8,
    baseFare: 35.00,
    ratePerMile: 3.80,
    hourlyWaitRate: 30.00,
    imageIcon: 'Users'
  }
];

// Distance estimation matrix (miles) between key London/Kent hubs and airports
const POPULAR_ROUTES = {
  'Central London (WC1/EC1)': { LHR: 16, LGW: 30, STN: 38, LTN: 34, MAN: 210, BHX: 115, JFK: 0 },
  'Mayfair & Westminster (W1/SW1)': { LHR: 14, LGW: 28, STN: 40, LTN: 33, MAN: 212, BHX: 116, JFK: 0 },
  'Canary Wharf / Docklands (E14)': { LHR: 22, LGW: 32, STN: 34, LTN: 38, MAN: 220, BHX: 125, JFK: 0 },
  'Tunbridge Wells / Sevenoaks (Kent)': { LHR: 48, LGW: 24, STN: 60, LTN: 70, MAN: 245, BHX: 150, JFK: 0 },
  'Heathrow Airport Terminals': { LHR: 0, LGW: 42, STN: 63, LTN: 35, MAN: 195, BHX: 105, JFK: 0 }
};

function calculateTransferQuote(pickupLocation, airportCode, vehicleTierId, options = {}) {
  const { meetAndGreet = false, childSeats = 0, flightTracking = true } = options;
  
  const tier = VEHICLE_TIERS.find(v => v.tierId === vehicleTierId) || VEHICLE_TIERS[0];
  
  // Find distance from lookup or default to estimated 20 miles
  let estimatedMiles = 20;
  if (POPULAR_ROUTES[pickupLocation] && POPULAR_ROUTES[pickupLocation][airportCode]) {
    estimatedMiles = POPULAR_ROUTES[pickupLocation][airportCode];
  } else {
    // Generate a realistic distance based on string length hash for custom addresses
    const hash = Array.from(pickupLocation || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    estimatedMiles = 15 + (hash % 30);
  }

  // Base journey cost
  const distanceCost = estimatedMiles * tier.ratePerMile;
  const journeyFare = tier.baseFare + distanceCost;

  // Terminal drop-off / access charge (e.g. £5 at Heathrow/Gatwick, £7 at Stansted)
  const airportDropoffFee = (airportCode === 'STN') ? 7.00 : (airportCode === 'BHX' ? 4.00 : 5.00);

  // Meet & Greet inside arrivals (driver with name board + 45 min parking & waiting)
  const meetAndGreetFee = meetAndGreet ? 12.00 : 0.00;

  // Child safety seats (£5 each)
  const childSeatFee = (childSeats || 0) * 5.00;

  const grossFare = Math.round((journeyFare + airportDropoffFee + meetAndGreetFee + childSeatFee) * 100) / 100;
  
  // Platform fee (Private hire dispatch broker margin: 15%)
  const platformCommission = Math.round(grossFare * 0.15 * 100) / 100;
  const driverPayout = Math.round((grossFare - platformCommission) * 100) / 100;

  return {
    pickupLocation,
    airportCode,
    estimatedMiles,
    estimatedDurationMinutes: Math.round(estimatedMiles * 1.8 + 15),
    vehicle: tier,
    pricingBreakdown: {
      baseFare: tier.baseFare,
      distanceFare: Math.round(distanceCost * 100) / 100,
      airportDropoffFee,
      meetAndGreetFee,
      childSeatFee,
      grossTotal: grossFare,
      driverPayout,
      platformCommission
    },
    flightTrackingIncluded: flightTracking,
    currency: (airportCode === 'JFK' || airportCode === 'EWR' || airportCode === 'LAX') ? 'USD' : 'GBP',
    symbol: (airportCode === 'JFK' || airportCode === 'EWR' || airportCode === 'LAX') ? '$' : '£'
  };
}

module.exports = {
  VEHICLE_TIERS,
  POPULAR_ROUTES,
  calculateTransferQuote
};
