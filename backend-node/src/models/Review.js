const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    productId: Number,
    userId: Number,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    reviewDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);

