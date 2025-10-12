const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    productId: Number,
    userId: Number,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentSchema);
