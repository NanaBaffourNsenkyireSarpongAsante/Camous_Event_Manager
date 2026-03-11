const mongoose = require('mongoose');

// MongoDB connection
const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/campus_event_manager';

mongoose.connect(url)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;