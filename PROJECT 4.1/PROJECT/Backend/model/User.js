const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    image: { type: String }, // URL or file path to the user's profile picture
    isRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    createdOn:{type: Date, default: Date.now },
    lastLogin:{type: Date, default: Date.now },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }]
});

module.exports = mongoose.model('User', userSchema);
