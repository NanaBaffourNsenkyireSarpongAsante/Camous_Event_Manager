const express = require('express');
const { register, login, updateRole } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// delegate to controller methods
router.post('/register', register);
router.post('/login', login);
router.put('/role', authMiddleware, updateRole);

module.exports = router;
