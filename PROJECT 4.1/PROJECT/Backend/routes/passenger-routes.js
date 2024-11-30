const express = require('express');
const passengersController = require('../controllers/passenger-controller');
const router = express.Router();

// Create a new passenger
router.post('/', passengersController.createPassenger);

// Get a passenger by ID
router.get('/:pid', passengersController.getPassengerById);

// Get all passengers
router.get('/', passengersController.getAllPassengers);

// Update a passenger by ID
router.patch('/:pid', passengersController.updatePassenger);

// Delete a passenger by ID
router.delete('/:pid', passengersController.deletePassenger);

module.exports = router;
