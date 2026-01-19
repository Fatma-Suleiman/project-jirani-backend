const express = require('express');
const { protect } = require('../controllers/authController');
const { createBooking,
     getMyBookings,
     cancelBooking 
     } = require('../controllers/bookings');

const router = express.Router();
router.post('/', protect, createBooking);
router.get('/',  protect, getMyBookings);
router.patch('/:id/cancel', protect, cancelBooking);
module.exports = router;
