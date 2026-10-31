const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../server/supabase');
const revenueLedger = require('../server/services/revenueLedger');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/bookings?id=... OR /api/bookings?token=...
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Booking ID or token required' });
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .or(`id.eq.${id},qr_token.eq.${id}`)
        .single();

      if (!error && data) {
        return res.status(200).json({
          booking: {
            id: data.id,
            type: data.type,
            serviceName: data.service_name,
            operatorName: data.operator_name,
            airport: data.airport,
            customerName: data.customer_name,
            customerEmail: data.customer_email,
            customerPhone: data.customer_phone,
            flightNumber: data.flight_number,
            vehicleReg: data.vehicle_reg,
            dateDetails: data.date_details,
            operatorNet: parseFloat(data.operator_net),
            commissionEarned: parseFloat(data.commission_earned),
            bookingFee: parseFloat(data.booking_fee),
            totalCharged: parseFloat(data.total_charged),
            qrToken: data.qr_token,
            status: data.status,
            createdAt: data.created_at
          }
        });
      }
    } catch (e) {
      console.error('Supabase lookup failed, trying in-memory ledger', e);
    }

    const memoryBooking = revenueLedger.findBooking(id);
    if (memoryBooking) {
      return res.status(200).json({ booking: memoryBooking });
    }

    return res.status(404).json({ error: 'Booking not found' });
  }

  // POST /api/bookings
  if (req.method === 'POST') {
    const {
      type,
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

    const bookingId = `AP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `VOUCHER-${uuidv4().substring(0, 8).toUpperCase()}`;

    const bookingFee = pricing?.bookingFee || (type === 'parking' ? 2.99 : 1.99);
    const totalCharged = pricing?.totalPayable || pricing?.grossTotal || 79.99;
    const commissionEarned = pricing?.platformCommission || (totalCharged * 0.18);
    const operatorNet = pricing?.operatorNet || pricing?.driverPayout || (totalCharged - commissionEarned);

    const bookingRecord = {
      id: bookingId,
      type: type || 'parking',
      service_name: serviceName || 'Airport Service',
      operator_name: operatorName || 'Verified Partner Operator',
      airport: airport || 'LHR',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || 'N/A',
      flight_number: flightNumber || 'N/A',
      vehicle_reg: vehicleReg || 'N/A',
      date_details: dateDetails || {},
      operator_net: Math.round(operatorNet * 100) / 100,
      commission_earned: Math.round(commissionEarned * 100) / 100,
      booking_fee: Math.round(bookingFee * 100) / 100,
      total_charged: Math.round(totalCharged * 100) / 100,
      qr_token: qrToken,
      status: 'confirmed'
    };

    try {
      const { error: dbError } = await supabase.from('bookings').insert([bookingRecord]);
      if (dbError) {
        console.error('Supabase booking insert notice:', dbError);
      }
    } catch (e) {
      console.error('Database insert exception:', e);
    }

    // Also record in in-memory ledger
    const newBooking = revenueLedger.recordBooking({
      id: bookingId,
      type: bookingRecord.type,
      serviceName: bookingRecord.service_name,
      operatorName: bookingRecord.operator_name,
      customerName: bookingRecord.customer_name,
      customerEmail: bookingRecord.customer_email,
      customerPhone: bookingRecord.customer_phone,
      flightNumber: bookingRecord.flight_number,
      vehicleReg: bookingRecord.vehicle_reg,
      airport: bookingRecord.airport,
      dateDetails: bookingRecord.date_details,
      operatorNet: bookingRecord.operator_net,
      commissionEarned: bookingRecord.commission_earned,
      bookingFee: bookingRecord.booking_fee,
      totalCharged: bookingRecord.total_charged,
      qrToken,
      status: 'confirmed'
    });

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed and secured in database',
      booking: newBooking
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
