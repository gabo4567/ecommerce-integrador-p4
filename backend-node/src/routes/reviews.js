const express = require('express');
const router = express.Router();
const Review = require('../models/Review'); // ruta correcta desde routes al modelo

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new review
router.post('/', async (req, res) => {
  const review = new Review({
    productId: req.body.productId,
    userId: req.body.userId,
    rating: req.body.rating,
    comment: req.body.comment
  });

  try {
    const newReview = await review.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
