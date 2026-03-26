const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// initialize database connection
require('./models/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/chat',    require('./routes/chat'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'KEM frontend', 'landing.html'));
});

// Serve static files from KEM frontend
app.use(express.static(path.join(__dirname, 'KEM frontend')));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  require('./utils/reminderJob')();
});
