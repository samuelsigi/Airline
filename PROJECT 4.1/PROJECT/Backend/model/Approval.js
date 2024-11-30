const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
    serviceProvider: { type: String, required: true },

    name: { type: String, required: true }, //flight or seatClass
    updatingId: { type: String, required: true, unique: true },
    approval: { type: String },

    requestedOn:{type: Date, default: Date.now },
    approvedOn:{type: Date }
});

module.exports = mongoose.model('Approval', approvalSchema);
