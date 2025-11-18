require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Inicializar app
const app = express();
app.use(cors());
app.use(express.json());

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ Error connecting to MongoDB:', err));
}

const reviewsRoutes = require('./routes/reviews');
const commentsRoutes = require('./routes/comments');

app.use('/api/reviews', reviewsRoutes);
app.use('/api/comments', commentsRoutes);

app.get('/', (req, res) => {
  res.send('Node server running 🚀');
});

module.exports = app;
