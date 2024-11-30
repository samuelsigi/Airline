const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    airline: { type: String, required: true },
    flightNumber: { type: String, required: true, unique: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { 
        type: String, 
        required: true, 
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Ensures time format "HH:mm" (24-hour format)
    },
    arrivalTime: { 
        type: String, 
        required: true, 
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Ensures time format "HH:mm" (24-hour format)
    },
    image: { type: String }, // URL or file path for the image/logo
    duration: { type: String },
    seatModel: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatClass', required: true },
    luggageCapacity: { type: String },
    status: { type: String, default: 'Approved' },
    recurrence: { 
        type: String, 
        required: true,
        enum: [
            'Daily',          // For daily flights
            'Weekends',       // For weekends only
            'Weekly:All',     // For weekly only
            'Weekly:Monday',  // Weekly on Monday
            'Weekly:Tuesday', 
            'Weekly:Wednesday', // Weekly on Wednesday,
            'Weekly:Thursday', 
            'Weekly:Friday', 
        ]
    }
});

module.exports = mongoose.model('Flight', flightSchema);
