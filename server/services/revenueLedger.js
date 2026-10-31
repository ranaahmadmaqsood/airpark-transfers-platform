const { v4: uuidv4 } = require('uuid');

class RevenueLedger {
  constructor() {
    this.bookings = [];
    this.operatorPayables = new Map();
    this.stats = {
      totalGrossBookings: 0,
      totalPlatformCommissions: 0,
      totalBookingFees: 0,
      totalNetRevenue: 0,
      parkingBookingsCount: 0,
      transferBookingsCount: 0
    };
    this.seedHistoricalData();
  }

  seedHistoricalData() {
    // Populate realistic initial business metrics demonstrating the revenue model
    const mockDates = ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'];
    const sampleBookings = [
      {
        id: 'AP-2026-1042',
        type: 'parking',
        serviceName: 'Apex Park & Ride Express Heathrow',
        operatorName: 'Apex Secure Parking Ltd',
        customerName: 'Sarah Jenkins',
        airport: 'LHR',
        days: 7,
        operatorNet: 64.40,
        commissionEarned: 16.10,
        bookingFee: 2.99,
        totalCharged: 83.49,
        date: mockDates[0],
        status: 'confirmed'
      },
      {
        id: 'AP-2026-1043',
        type: 'transfer',
        serviceName: 'Executive Chauffeur (Mercedes E-Class)',
        operatorName: 'Royal Chauffeur Fleet',
        customerName: 'Marcus Sterling',
        airport: 'LGW',
        operatorNet: 82.50,
        commissionEarned: 14.50,
        bookingFee: 1.99,
        totalCharged: 98.99,
        date: mockDates[1],
        status: 'completed'
      },
      {
        id: 'AP-2026-1044',
        type: 'parking',
        serviceName: 'Terminal Valet Meet & Greet VIP',
        operatorName: 'Skyline Chauffeur Valet',
        customerName: 'David H. Walker',
        airport: 'LHR',
        days: 10,
        operatorNet: 135.00,
        commissionEarned: 34.00,
        bookingFee: 2.99,
        totalCharged: 171.99,
        date: mockDates[2],
        status: 'confirmed'
      },
      {
        id: 'AP-2026-1045',
        type: 'parking',
        serviceName: 'Maple Park & Ride Gatwick',
        operatorName: 'Maple Parking Group',
        customerName: 'Claire Beaumont',
        airport: 'LGW',
        days: 5,
        operatorNet: 39.20,
        commissionEarned: 9.80,
        bookingFee: 2.99,
        totalCharged: 51.99,
        date: mockDates[3],
        status: 'confirmed'
      },
      {
        id: 'AP-2026-1046',
        type: 'transfer',
        serviceName: 'MPV 8-Seater Minibus',
        operatorName: 'South East Transfer Network',
        customerName: 'The Patel Family',
        airport: 'STN',
        operatorNet: 110.50,
        commissionEarned: 19.50,
        bookingFee: 1.99,
        totalCharged: 131.99,
        date: mockDates[4],
        status: 'completed'
      }
    ];

    sampleBookings.forEach(b => this.recordBooking(b, false));
  }

  recordBooking(bookingData, isNew = true) {
    const booking = {
      ...bookingData,
      id: bookingData.id || `AP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: bookingData.date || new Date().toISOString().split('T')[0],
      qrToken: `VOUCHER-${uuidv4().substring(0, 8).toUpperCase()}`
    };

    this.bookings.unshift(booking);

    // Update global aggregate KPIs
    this.stats.totalGrossBookings = Math.round((this.stats.totalGrossBookings + booking.totalCharged) * 100) / 100;
    this.stats.totalPlatformCommissions = Math.round((this.stats.totalPlatformCommissions + booking.commissionEarned) * 100) / 100;
    this.stats.totalBookingFees = Math.round((this.stats.totalBookingFees + booking.bookingFee) * 100) / 100;
    this.stats.totalNetRevenue = Math.round((this.stats.totalPlatformCommissions + this.stats.totalBookingFees) * 100) / 100;

    if (booking.type === 'parking') {
      this.stats.parkingBookingsCount++;
    } else {
      this.stats.transferBookingsCount++;
    }

    // Update operator reconciliation sub-ledger
    const op = booking.operatorName || 'Default Operator';
    const currentOp = this.operatorPayables.get(op) || {
      operatorName: op,
      totalBookings: 0,
      totalGross: 0,
      totalNetPayable: 0,
      commissionPaidToPlatform: 0
    };

    currentOp.totalBookings += 1;
    currentOp.totalGross = Math.round((currentOp.totalGross + booking.totalCharged) * 100) / 100;
    currentOp.totalNetPayable = Math.round((currentOp.totalNetPayable + booking.operatorNet) * 100) / 100;
    currentOp.commissionPaidToPlatform = Math.round((currentOp.commissionPaidToPlatform + booking.commissionEarned) * 100) / 100;

    this.operatorPayables.set(op, currentOp);

    return booking;
  }

  getMetrics() {
    return {
      kpis: this.stats,
      takeRatePercentage: this.stats.totalGrossBookings > 0
        ? Math.round((this.stats.totalNetRevenue / this.stats.totalGrossBookings) * 1000) / 10
        : 0,
      recentBookings: this.bookings.slice(0, 10),
      operatorReconciliation: Array.from(this.operatorPayables.values())
    };
  }

  findBooking(id) {
    return this.bookings.find(b => b.id === id || b.qrToken === id);
  }
}

const ledger = new RevenueLedger();
module.exports = ledger;
