let { PARKING_LOTS } = require('../data/parkingLots');
const revenueLedger = require('./revenueLedger');

function getAllLots() {
  return PARKING_LOTS;
}

function addLot(newLotData) {
  const lot = {
    ...newLotData,
    id: newLotData.id || `${newLotData.airportCode.toLowerCase()}-${newLotData.type === 'meet_and_greet' ? 'mg' : 'pr'}-${Date.now().toString(36)}`,
    baseDailyRate: parseFloat(newLotData.baseDailyRate) || 4.50,
    operatorNetRate: parseFloat(newLotData.operatorNetRate) || 3.30,
    commissionRate: parseFloat(newLotData.commissionRate) || 0.28,
    transferDurationMinutes: parseInt(newLotData.transferDurationMinutes, 10) || 0,
    transferFrequencyMinutes: parseInt(newLotData.transferFrequencyMinutes, 10) || 0,
    distanceMiles: parseFloat(newLotData.distanceMiles) || 0.1,
    rating: parseFloat(newLotData.rating) || 4.8,
    reviewCount: parseInt(newLotData.reviewCount, 10) || 10,
    parkMarkAccredited: newLotData.parkMarkAccredited !== false,
    securityBadges: newLotData.securityBadges || ['Park Mark® Safer Parking', '24/7 Monitored Compound'],
    features: newLotData.features || ['Secure perimeter fence', 'CCTV surveillance'],
    cancellationPolicy: newLotData.cancellationPolicy || 'Free cancellation up to 24h before travel',
    instructions: newLotData.instructions || 'Follow signs for airport passenger drop-off.'
  };
  PARKING_LOTS.unshift(lot);
  return lot;
}

function updateLot(id, updatedFields) {
  const idx = PARKING_LOTS.findIndex(l => l.id === id);
  if (idx === -1) return null;
  PARKING_LOTS[idx] = {
    ...PARKING_LOTS[idx],
    ...updatedFields,
    baseDailyRate: updatedFields.baseDailyRate ? parseFloat(updatedFields.baseDailyRate) : PARKING_LOTS[idx].baseDailyRate,
    operatorNetRate: updatedFields.operatorNetRate ? parseFloat(updatedFields.operatorNetRate) : PARKING_LOTS[idx].operatorNetRate
  };
  return PARKING_LOTS[idx];
}

function deleteLot(id) {
  const idx = PARKING_LOTS.findIndex(l => l.id === id);
  if (idx === -1) return false;
  PARKING_LOTS.splice(idx, 1);
  return true;
}

function updateBookingStatus(id, newStatus) {
  const booking = revenueLedger.bookings.find(b => b.id === id);
  if (booking) {
    booking.status = newStatus;
    return booking;
  }
  return null;
}

module.exports = {
  getAllLots,
  addLot,
  updateLot,
  deleteLot,
  updateBookingStatus
};
