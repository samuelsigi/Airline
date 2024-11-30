const { genSalt } = require('bcryptjs');
const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    phone: { type: String },
    gender: { type: String, required: true },
    seatClass: { type: String, enum: ['Economy', 'Business', 'First'], required: true },
    food: { type: String, enum: ['Yes', 'No'], required: true },
    type: { type: String, enum: ['Normal', 'Student', 'Senior Citizen', 'Disabled', 'Army', 'Doctor'], default: 'Normal' }
});

module.exports = mongoose.model('Passenger', passengerSchema);
