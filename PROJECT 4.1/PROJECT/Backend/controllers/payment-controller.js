const Payment = require('../model/Payment');
const Booking = require('../model/Booking');
const HttpError = require('../model/http-error');

// Create a new payment
const createPayment = async (req, res, next) => {
    const { bookingId, paymentMethod } = req.body;

    const existingPayment = await Payment.findOne({ bookingId });
        if (existingPayment) {
            return next(new HttpError('Payment for this booking already exists.', 400));
        }


    try {
        // Check if booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return next(new HttpError('Booking not found.', 404));
        }

        // Calculate the platform fee
        const platformFee = booking.totalPrice * 0.05 ;
        // Calculate total amount (booking price + platform fee)
        const amount = booking.totalPrice + platformFee;

        // Create new payment
        const newPayment = new Payment({
            bookingId,
            user: booking.user._id,
            amount,
            paymentMethod,
            status: 'Paid'
        });

        await newPayment.save();

        // Update the booking status to 'Paid'
        booking.status = 'Paid'; // Change the booking status to 'Paid'
        booking.totalPrice = amount ; // Change the booking TotalCost to 'Amount'
        await booking.save(); // Save the updated booking

        res.status(201).json({ payment: newPayment });
    } catch (err) {
        console.error(err);
        return next(new HttpError('Confirming payment failed, please try again.', 500));
    }
};


// Delete a payment
const deletePayment = async (req, res, next) => {
    const paymentId = req.params.pid;

    try {
        const payment = await Payment.findByIdAndDelete(paymentId);
        if (!payment) {
            return next(new HttpError('Payment not found.', 404));
        }

        res.status(200).json({ message: 'Payment deleted successfully.' });
    } catch (err) {
        console.error(err);
        return next(new HttpError('Deleting payment failed, please try again.', 500));
    }
};

// Get all payments for a specific user
const getPaymentsByUser = async (req, res, next) => {
    const userId = req.params.uid;

    try {
        const payments = await Payment.find({ user: userId });
        // Check if the payments array is empty
        if (payments.length === 0) {
            return res.status(200).json({ message: 'No payments done.' });
        }

        res.status(200).json({ payments });
    } catch (err) {
        console.error(err);
        return next(new HttpError('Fetching payments failed, please try again.', 500));
    }
};

// Get all payments
const getAllPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find();

        // Check if the payments array is empty
        if (payments.length === 0) {
            return res.status(200).json({ message: 'No payments found.' });
        }

        res.status(200).json({ payments });
    } catch (err) {
        console.error(err);
        return next(new HttpError('Fetching all payments failed, please try again.', 500));
    }
};

module.exports = {
    createPayment,
    deletePayment,
    getPaymentsByUser,
    getAllPayments
};
