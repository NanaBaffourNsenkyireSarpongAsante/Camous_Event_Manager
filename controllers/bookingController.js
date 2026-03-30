const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Event = require('../models/event');
const sendEmail = require('../utils/mailer');

// POST /api/bookings — logged-in user books a ticket for an event
const createBooking = async (req, res) => {
    try {
        const { eventId, name, email, studentId, quantity } = req.body;

        if (!eventId || !name || !email || !studentId) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
        }

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        // Make sure the event actually exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const booking = new Booking({
            event: eventId,
            user: req.userId,
            name: name.trim(),
            email: email.toLowerCase(),
            studentId,
            quantity: parseInt(quantity) || 1,
        });

        await booking.save();

        // Populate event details for the response and email
        await booking.populate('event', 'title date time venue ticket');

        // Send confirmation email (non-blocking — don't fail the booking if email fails)
        const ticketLabel = event.ticket > 0 ? `₵${event.ticket} x ${booking.quantity}` : 'Free';
        sendEmail({
            to: booking.email,
            subject: `Booking Confirmed – ${event.title}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
                    <div style="background:#1e3a8a;padding:32px 24px;text-align:center;">
                        <div style="display:inline-flex;align-items:center;gap:12px;">
                            <img src="${process.env.CLIENT_URL}/uem-logo.jpeg" alt="UEM Logo" style="width:48px;height:48px;border-radius:50%;object-fit:cover;background:white;padding:3px;">
                            <h1 style="color:white;margin:0;font-size:1.8rem;">UEM</h1>
                        </div>
                        <p style="color:rgba(255,255,255,0.8);margin:10px 0 0;">University Events Manager</p>
                    </div>
                    <div style="padding:32px 24px;">
                        <h2 style="color:#1e3a8a;margin-top:0;">Booking Confirmed! 🎉</h2>
                        <p style="color:#374151;">Hi <strong>${booking.name}</strong>, your spot is reserved. Here are your booking details:</p>

                        <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #1e3a8a;">
                            <table style="width:100%;border-collapse:collapse;">
                                <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Event</td><td style="padding:8px 0;color:#111827;font-weight:600;">${event.title}</td></tr>
                                <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Date</td><td style="padding:8px 0;color:#111827;">${event.date}</td></tr>
                                <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Time</td><td style="padding:8px 0;color:#111827;">${event.time}</td></tr>
                                <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Venue</td><td style="padding:8px 0;color:#111827;">${event.venue}</td></tr>
                                <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Ticket</td><td style="padding:8px 0;color:#111827;">${ticketLabel}</td></tr>
                                <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Student ID</td><td style="padding:8px 0;color:#111827;">${booking.studentId}</td></tr>
                            </table>
                        </div>

                        <p style="color:#374151;">Please bring your Student ID to the event for verification.</p>
                        <p style="color:#6b7280;font-size:0.85rem;margin-top:32px;">This is an automated message from UEM – University Events Manager. Please do not reply.</p>
                    </div>
                </div>
            `,
        }).catch(err => console.error('Booking confirmation email failed:', err));

        res.status(201).json({ success: true, booking });
    } catch (err) {
        console.error('Create booking error:', err);
        res.status(500).json({ success: false, message: 'Error creating booking' });
    }
};

// GET /api/bookings/mine — student sees their own bookings (for Tickets view)
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.userId })
            .populate('event', 'title date time venue ticket image category')
            .sort({ bookedAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        console.error('Get my bookings error:', err);
        res.status(500).json({ success: false, message: 'Error fetching bookings' });
    }
};

// GET /api/bookings/organizer — organizer sees bookings for all their events
const getOrganizerBookings = async (req, res) => {
    try {
        // Find all events created by this organizer
        const organizerEvents = await Event.find({ organizer: req.userId }).select('_id');
        const eventIds = organizerEvents.map(e => e._id);

        const bookings = await Booking.find({ event: { $in: eventIds } })
            .populate('event', 'title date')
            .sort({ bookedAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        console.error('Get organizer bookings error:', err);
        res.status(500).json({ success: false, message: 'Error fetching bookings' });
    }
};

module.exports = { createBooking, getMyBookings, getOrganizerBookings };
