const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    venue: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Academic', 'Social', 'Tech', 'Arts', 'Music', 'Sports', 'Other'],
    },
    ticket: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: null,
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Expose _id as id in JSON responses so the frontend can use event.id
eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
