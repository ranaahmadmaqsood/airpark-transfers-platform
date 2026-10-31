const adminService = require('../../server/services/adminService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: return all lots for management
  if (req.method === 'GET') {
    const lots = adminService.getAllLots();
    return res.status(200).json({ lots });
  }

  // POST: add a new compound yard / location
  if (req.method === 'POST') {
    const newLot = adminService.addLot(req.body);
    return res.status(201).json({ success: true, lot: newLot });
  }

  // PUT: update existing yard / price
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Lot ID required' });
    const updated = adminService.updateLot(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Lot not found' });
    return res.status(200).json({ success: true, lot: updated });
  }

  // DELETE: remove a location
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Lot ID required' });
    const deleted = adminService.deleteLot(id);
    if (!deleted) return res.status(404).json({ error: 'Lot not found' });
    return res.status(200).json({ success: true, message: 'Location deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
