const express = require('express');
const { createBooking, deleteBooking, getBookingById, getAllBookings } = require('../controllers/booking-controller');
const router = express.Router();

router.post('/', createBooking); // Create a new booking
router.delete('/:bid', deleteBooking); // Delete a booking
router.get('/:bid', getBookingById); // Get booking by ID
router.get('/', getAllBookings); // Get all bookings for the user

module.exports = router;
