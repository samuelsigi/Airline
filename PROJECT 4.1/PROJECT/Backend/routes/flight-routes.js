const express = require('express');
const flightController = require('../controllers/flight-controller');
const router = express.Router();
const flightImageUpload = require('../middleware/flightimage-upload')

// Create a flight
router.post('/',flightImageUpload.single('image'), flightController.createFlight);

// Get flight by ID
router.get('/:fid', flightController.getFlightById);

// Get all flights
router.get('/', flightController.getAllFlights);

// Update flight
router.patch('/:fid', flightController.updateFlight);

// Delete flight
router.delete('/:fid', flightController.deleteFlight);

// Search flight
router.post('/search', flightController.searchFlights);

module.exports = router;
