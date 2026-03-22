const Event = require('../models/event');

// GET /api/events — public, returns all events sorted newest first
const getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });
        res.json({ success: true, events });
    } catch (err) {
        console.error('Get events error:', err);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};

// POST /api/events — organizer only (auth middleware applied in route)
const createEvent = async (req, res) => {
    try {
        const { title, date, time, venue, category, ticket, description, image } = req.body;

        if (!title || !date || !time || !venue || !category || !description) {
            return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
        }

        const event = new Event({
            title,
            date,
            time,
            venue,
            category,
            ticket: parseFloat(ticket) || 0,
            description,
            image: image || null,
            organizer: req.userId,
        });

        await event.save();
        res.status(201).json({ success: true, event });
    } catch (err) {
        console.error('Create event error:', err);
        res.status(500).json({ success: false, message: 'Error creating event' });
    }
};

// PUT /api/events/:id — only the organizer who created it can edit
const updateEvent = async (req, res) => {
    try {
        const { title, date, time, venue, category, ticket, description, image } = req.body;

        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, organizer: req.userId },
            { title, date, time, venue, category, ticket: parseFloat(ticket) || 0, description, image: image || null },
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or not authorized' });
        }

        res.json({ success: true, event });
    } catch (err) {
        console.error('Update event error:', err);
        res.status(500).json({ success: false, message: 'Error updating event' });
    }
};

// DELETE /api/events/:id — only the organizer who created it can delete
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({ _id: req.params.id, organizer: req.userId });

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or not authorized' });
        }

        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Delete event error:', err);
        res.status(500).json({ success: false, message: 'Error deleting event' });
    }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
