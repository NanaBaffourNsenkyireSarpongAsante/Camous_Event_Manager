const express = require('express');
const { createBooking, getMyBookings, getOrganizerBookings } = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, createBooking);                    // book a ticket
router.get('/mine', authMiddleware, getMyBookings);                 // student: my tickets
router.get('/organizer', authMiddleware, getOrganizerBookings);     // organizer: all bookings for their events

module.exports = router;
