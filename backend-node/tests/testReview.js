require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./src/models/Review');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ Error connecting to MongoDB:', err));

// Crear una review de prueba
const testReview = new Review({
  productId: 1,
  userId: 1,
  rating: 5,
  comment: "¡Excelente producto!"
});

testReview.save()
  .then(() => {
    console.log('✅ Test review saved');
    mongoose.disconnect();
  })
  .catch(err => console.error('❌ Error saving test review:', err));
