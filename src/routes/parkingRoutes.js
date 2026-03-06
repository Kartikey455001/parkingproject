const express = require('express');
const { checkIn, checkOut, simulatePayment, getActiveSessions } = require('../controllers/parkingController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/checkin', protect, authorize('ParkingStaff', 'Admin'), checkIn);
router.post('/checkout', protect, authorize('ParkingStaff', 'Admin'), checkOut);
router.post('/pay', protect, simulatePayment);
router.get('/active', protect, authorize('ParkingStaff', 'Admin'), getActiveSessions);

module.exports = router;
