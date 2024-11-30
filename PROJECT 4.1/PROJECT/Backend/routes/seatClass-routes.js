const express = require('express');
const seatClassController = require('../controllers/seatClass-controller');

const router = express.Router();

// Route to create a new seat class
router.post('/', seatClassController.createSeatClass);

// Route to get all seat classes
router.get('/', seatClassController.getAllSeatClasses);

// Route to get a specific seat class by ID
router.get('/:id', seatClassController.getSeatClassById);

// Route to update a specific seat class by ID
router.patch('/:id', seatClassController.updateSeatClass);

// Route to delete a specific seat class by ID
router.delete('/:id', seatClassController.deleteSeatClass);

module.exports = router;
