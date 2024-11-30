const mongoose = require('mongoose');

// Payment Schema
const paymentSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['Card', 'UPI', 'Net Banking'], required: true },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
});

module.exports = mongoose.model('Payment', paymentSchema);