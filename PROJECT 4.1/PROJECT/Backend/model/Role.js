const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    role: { type: String, required: true, unique: true } // e.g. Admin, Service Provider, Customer.
});

module.exports = mongoose.model('Role', roleSchema);
