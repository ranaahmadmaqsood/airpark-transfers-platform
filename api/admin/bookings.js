const revenueLedger = require('../../server/services/revenueLedger');
const adminService = require('../../server/services/adminService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: return all bookings with customer details & status
  if (req.method === 'GET') {
    return res.status(200).json({
      bookings: revenueLedger.bookings,
      stats: revenueLedger.stats
    });
  }

  // PUT: update booking status (confirmed / completed / cancelled)
  if (req.method === 'PUT') {
    const { id } = req.query;
    const { status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Booking ID and status required' });

    const updated = adminService.updateBookingStatus(id, status);
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    return res.status(200).json({ success: true, booking: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
