const express = require('express');
const { initializePayment, verifyPayment, getPublicKey } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/public-key', getPublicKey);                         // no auth — frontend needs the key on load
router.post('/initialize', authMiddleware, initializePayment);   // start a Paystack transaction
router.post('/verify', authMiddleware, verifyPayment);           // verify + create booking

module.exports = router;
