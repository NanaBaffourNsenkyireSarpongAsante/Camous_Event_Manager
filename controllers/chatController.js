const { Mistral } = require('@mistralai/mistralai');
const Event = require('../models/event');

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

// POST /api/chat  — streams Claude's reply back as SSE
const chat = async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    // Pull live events so the bot always has current context
    let eventsContext = 'No events are currently listed on the platform.';
    try {
        const events = await Event.find()
            .select('title date time venue category ticket description')
            .sort({ date: 1 })
            .limit(30);

        if (events.length > 0) {
            eventsContext = events.map(e =>
                `• ${e.title} — ${e.date} at ${e.time} | Venue: ${e.venue} | Category: ${e.category} | ${e.ticket > 0 ? '₵' + e.ticket : 'Free'}`
            ).join('\n');
        }
    } catch (err) {
        console.error('Failed to fetch events for chat context:', err.message);
    }

    const systemPrompt = `You are KEM Assistant, a friendly and helpful chatbot built into KEM — the KNUST Campus Event Manager.

Your job is to help students:
- Discover and learn about upcoming campus events
- Understand how to book tickets (browse Events → click an event → click "Get Ticket" → fill in the form)
- Navigate the KEM platform
- Answer general questions about campus life at KNUST

Here are the current events on the platform:
${eventsContext}

Rules:
- Be friendly, warm, and concise — you're talking to KNUST students
- Keep replies short (2–4 sentences) unless the student asks for more detail
- If asked about events not listed above, say you only have info on the events currently published
- Never make up event details — only use what's listed above
- If you don't know something, say so honestly and suggest they check the Events page`;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const stream = await client.chat.stream({
            model: 'mistral-small-latest',
            max_tokens: 1024,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
        });

        for await (const chunk of stream) {
            const text = chunk.data.choices[0]?.delta?.content;
            if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err) {
        console.error('Chat stream error:', err);
        res.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
        res.end();
    }
};

module.exports = { chat };
