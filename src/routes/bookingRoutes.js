const express = require('express');
const { createBooking, getMyBookings, cancelBooking, getAllBookings } = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
    .post(protect, createBooking)
    .get(protect, getMyBookings);

router.get('/all', protect, authorize('Admin', 'ParkingStaff'), getAllBookings);

router.route('/:id/cancel')
    .put(protect, cancelBooking);

module.exports = router;
