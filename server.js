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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));

// Serve static files from KEM frontend
app.use(express.static(path.join(__dirname, 'KEM frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'KEM frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
