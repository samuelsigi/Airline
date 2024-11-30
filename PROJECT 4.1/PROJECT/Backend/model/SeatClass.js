const mongoose = require('mongoose');

const seatClassSchema = new mongoose.Schema({
    seatClassName:{type: String, required: true, unique: true },

    economySeats: { type: Number, default: 0 },
    economySeatPrice: { type: Number, default: 0 },
    economyFoodPrice: { type: Number, default: 0 },
    economyavailableSeats: { type: Number, required: true },

    businessSeats: { type: Number, default: 0 },
    businessSeatPrice: { type: Number, default: 0 },
    businessFoodPrice: { type: Number, default: 0 },
    businessavailableSeats: { type: Number, required: true },


    firstClassSeats: { type: Number, default: 0 },
    firstClassSeatPrice: { type: Number, default: 0 },
    firstClassFoodPrice: { type: Number, default: 0 },
    firstClassavailableSeats: { type: Number, required: true },

    totalSeats:{ type: Number, default: 0 },
    totalAvailableSeats:{type: Number, default: 0},

    status:{type: String, default: 'Approved'},
});

module.exports = mongoose.model('SeatClass', seatClassSchema);
