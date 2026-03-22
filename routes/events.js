const express = require('express');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', getEvents);                           // public
router.post('/', authMiddleware, createEvent);        // organizer auth required
router.put('/:id', authMiddleware, updateEvent);      // organizer auth required
router.delete('/:id', authMiddleware, deleteEvent);   // organizer auth required

module.exports = router;
