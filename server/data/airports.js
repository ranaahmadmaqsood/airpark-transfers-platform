const AIRPORTS = [
  {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    terminals: ['Terminal 2', 'Terminal 3', 'Terminal 4', 'Terminal 5'],
    terminalDropoffFee: 5.00
  },
  {
    code: 'LGW',
    name: 'London Gatwick Airport',
    city: 'London / Crawley',
    country: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    terminals: ['North Terminal', 'South Terminal'],
    terminalDropoffFee: 5.00
  },
  {
    code: 'STN',
    name: 'London Stansted Airport',
    city: 'London / Essex',
    country: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    terminals: ['Main Terminal'],
    terminalDropoffFee: 7.00
  },
  {
    code: 'LTN',
    name: 'London Luton Airport',
    city: 'London / Luton',
    country: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    terminals: ['Main Terminal'],
    terminalDropoffFee: 5.00
  },
  {
    code: 'MAN',
    name: 'Manchester Airport',
    city: 'Manchester',
    country: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3'],
    terminalDropoffFee: 5.00
  },
  {
    code: 'BHX',
    name: 'Birmingham Airport',
    city: 'Birmingham',
    country: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    terminals: ['Main Terminal'],
    terminalDropoffFee: 4.00
  },
  {
    code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    currency: 'USD',
    symbol: '$',
    terminals: ['Terminal 1', 'Terminal 4', 'Terminal 5', 'Terminal 7', 'Terminal 8'],
    terminalDropoffFee: 0.00
  },
  {
    code: 'EWR',
    name: 'Newark Liberty International Airport',
    city: 'Newark / New York',
    country: 'United States',
    currency: 'USD',
    symbol: '$',
    terminals: ['Terminal A', 'Terminal B', 'Terminal C'],
    terminalDropoffFee: 0.00
  },
  {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    currency: 'USD',
    symbol: '$',
    terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3', 'Tom Bradley', 'Terminal 5', 'Terminal 6', 'Terminal 7'],
    terminalDropoffFee: 0.00
  }
];

module.exports = { AIRPORTS };
