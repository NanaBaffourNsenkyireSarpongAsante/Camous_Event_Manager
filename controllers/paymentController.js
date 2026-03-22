const https = require('https');
const Booking = require('../models/booking');
const Event = require('../models/event');

// Helper: make a request to Paystack's API using Node's built-in https
function paystackRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path,
            method,
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON from Paystack'));
                }
            });
        });

        req.on('error', reject);

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// POST /api/payments/initialize
// Frontend calls this first to get a transaction reference from Paystack
const initializePayment = async (req, res) => {
    try {
        const { eventId, name, email, quantity } = req.body;

        if (!eventId || !email) {
            return res.status(400).json({ success: false, message: 'Event and email are required' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.ticket <= 0) {
            return res.status(400).json({ success: false, message: 'This event is free — no payment needed' });
        }

        const qty = parseInt(quantity) || 1;
        const amountInPesewas = event.ticket * qty * 100; // Paystack uses smallest currency unit

        const paystackRes = await paystackRequest('POST', '/transaction/initialize', {
            email,
            amount: amountInPesewas,
            currency: 'GHS',
            metadata: {
                eventId: eventId.toString(),
                eventTitle: event.title,
                name,
                quantity: qty,
            },
        });

        if (!paystackRes.status) {
            return res.status(500).json({ success: false, message: 'Payment initialization failed' });
        }

        res.json({
            success: true,
            reference: paystackRes.data.reference,
            amount: amountInPesewas,
        });
    } catch (err) {
        console.error('Initialize payment error:', err);
        res.status(500).json({ success: false, message: 'Error initializing payment' });
    }
};

// POST /api/payments/verify
// Called after the Paystack popup closes with a success — verifies the transaction and creates the booking
const verifyPayment = async (req, res) => {
    try {
        const { reference, eventId, name, email, studentId, quantity } = req.body;

        if (!reference || !eventId || !name || !email || !studentId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Verify with Paystack
        const paystackRes = await paystackRequest('GET', `/transaction/verify/${reference}`);

        if (!paystackRes.status || paystackRes.data.status !== 'success') {
            return res.status(402).json({ success: false, message: 'Payment verification failed — transaction not successful' });
        }

        // Guard: make sure amount paid matches expected amount
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const qty = parseInt(quantity) || 1;
        const expectedAmount = event.ticket * qty * 100;

        if (paystackRes.data.amount < expectedAmount) {
            return res.status(402).json({ success: false, message: 'Amount paid does not match ticket price' });
        }

        // Create the booking
        const booking = new Booking({
            event: eventId,
            user: req.userId,
            name: name.trim(),
            email: email.toLowerCase(),
            studentId,
            quantity: qty,
        });

        await booking.save();
        await booking.populate('event', 'title date time venue');

        res.status(201).json({ success: true, booking });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ success: false, message: 'Error verifying payment' });
    }
};

// GET /api/payments/public-key
// Safely exposes the Paystack public key to the frontend
const getPublicKey = (req, res) => {
    res.json({ success: true, publicKey: process.env.PAYSTACK_PUBLIC_KEY });
};

module.exports = { initializePayment, verifyPayment, getPublicKey };
