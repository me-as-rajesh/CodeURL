const express = require('express');
const bodyParser = require('body-parser');
const Pusher = require('pusher');
const cors = require('cors'); // Import the cors package
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// In-memory storage
const messages = {}; // Object to store messages keyed by ID

// Pusher setup
const pusher = new Pusher({
    appId: "1877328",
    key: "673ad43ec9062d1735b2",
    secret: "f8561c5bcc1222e976f7",
    cluster: "ap2",
    useTLS: true
});

// Trigger message endpoint
app.post('/api/trigger-message', async (req, res) => {
    try {
        const { message, id } = req.body;

        if (!message || !id) {
            return res.status(400).json({ error: 'Message and ID are required' });
        }

        // Store the message
        messages[id] = { message, id };

        // Trigger the event with Pusher
        await pusher.trigger("my-channel", "my-event", { message, id });

        return res.status(200).json({ success: 'Message sent' });
    } catch (error) {
        console.error('Error triggering message:', error); // Log error for debugging
        return res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get messages by ID endpoint
app.get('/api/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the message exists in memory
        if (!messages[id]) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Return the message as an array
        return res.status(200).json([messages[id]]);
    } catch (error) {
        console.error('Error retrieving message:', error); // Log error for debugging
        return res.status(500).json({ error: 'Failed to retrieve message' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack); // Log the error stack for debugging
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
