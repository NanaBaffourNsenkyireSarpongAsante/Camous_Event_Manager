const cron    = require('node-cron');
const Booking = require('../models/booking');
const Event   = require('../models/event');
const sendEmail = require('./mailer');

function getTomorrowString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

async function sendReminders() {
    try {
        const tomorrow = getTomorrowString();
        const events   = await Event.find({ date: tomorrow });
        if (events.length === 0) return;

        const bookings = await Booking.find({ event: { $in: events.map(e => e._id) } })
            .populate('event', 'title date time venue ticket');

        if (bookings.length === 0) return;

        await Promise.all(bookings.map(booking => {
            const ev          = booking.event;
            const ticketLabel = ev.ticket > 0 ? `₵${ev.ticket}` : 'Free';

            return sendEmail({
                to:      booking.email,
                subject: `⏰ Reminder: "${ev.title}" is tomorrow!`,
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
                        <div style="background:#1e3a8a;padding:32px 24px;text-align:center;">
                            <div style="display:inline-flex;align-items:center;gap:12px;">
                                <img src="https://th.bing.com/th/id/R.6d634fffb880acc7313e962fb3c1bdfd?rik=Y%2bTjwLY3kvg%2fcQ&pid=ImgRaw&r=0"
                                     alt="KEM Logo" style="width:48px;height:48px;border-radius:50%;object-fit:cover;background:white;padding:3px;">
                                <h1 style="color:white;margin:0;font-size:1.8rem;">KEM</h1>
                            </div>
                            <p style="color:rgba(255,255,255,0.8);margin:10px 0 0;">Campus Event Manager</p>
                        </div>
                        <div style="padding:32px 24px;">
                            <h2 style="color:#1e3a8a;margin-top:0;">Your event is tomorrow! 🎉</h2>
                            <p style="color:#374151;">Hi <strong>${booking.name}</strong>, just a reminder that you have an event coming up tomorrow.</p>

                            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #f59e0b;">
                                <table style="width:100%;border-collapse:collapse;">
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;width:110px;">Event</td><td style="padding:8px 0;color:#111827;font-weight:600;">${ev.title}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Date</td><td style="padding:8px 0;color:#111827;">${ev.date}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Time</td><td style="padding:8px 0;color:#111827;">${ev.time}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Venue</td><td style="padding:8px 0;color:#111827;">${ev.venue}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:0.85rem;text-transform:uppercase;font-weight:600;">Ticket</td><td style="padding:8px 0;color:#111827;">${ticketLabel}</td></tr>
                                </table>
                            </div>

                            <p style="color:#374151;">Don't forget to bring your Student ID for verification.</p>
                            <p style="color:#6b7280;font-size:0.85rem;margin-top:32px;">This is an automated reminder from KEM – Campus Event Manager.</p>
                        </div>
                    </div>
                `,
            }).catch(err => console.error(`Reminder failed for ${booking.email}:`, err));
        }));

        console.log(`[Reminders] Sent ${bookings.length} reminder(s) for ${events.length} event(s) on ${tomorrow}.`);
    } catch (err) {
        console.error('[Reminders] Job error:', err);
    }
}

function startReminderJob() {
    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', sendReminders);
    console.log('[Reminders] Daily reminder job scheduled at 08:00 AM.');
}

module.exports = startReminderJob;
