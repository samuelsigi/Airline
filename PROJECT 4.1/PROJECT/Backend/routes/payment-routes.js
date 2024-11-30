const express = require('express');
const paymentController = require('../controllers/payment-controller');
const router = express.Router();

// Create a new payment
router.post('/', paymentController.createPayment);

// Delete a payment
router.delete('/:pid', paymentController.deletePayment);

// Get all payments for a specific user
router.get('/user/:uid', paymentController.getPaymentsByUser);

// Get all payments
router.get('/', paymentController.getAllPayments);

module.exports = router;
