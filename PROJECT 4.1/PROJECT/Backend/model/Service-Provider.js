const mongoose = require('mongoose');

const serviceProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    logo: { type: String },

    isRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    
    createdOn:{type: Date, default: Date.now },
    lastLogin:{type: Date, default: Date.now },


    seatClass: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SeatClass' }],
    flights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flight' }]
});

module.exports = mongoose.model('Service-Provider', serviceProviderSchema);
