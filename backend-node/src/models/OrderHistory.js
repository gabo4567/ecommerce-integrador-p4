const mongoose = require('mongoose');

const OrderHistorySchema = new mongoose.Schema({
    orderId: Number,
    previousStatus: String,
    newStatus: String,
    changedAt: { type: Date, default: Date.now },
    userId: Number
});

module.exports = mongoose.model('OrderHistory', OrderHistorySchema);

