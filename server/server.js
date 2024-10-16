// Import required modules
const express = require("express");
const bodyParser = require('body-parser');
const Pusher = require('pusher');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Create an Express application
const app = express();

// Set the port
const PORT = process.env.PORT || 3001;

// Load environment variables from config.env
dotenv.config({ path: path.join(__dirname, './config.env') });

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Store messages in-memory
const messages = {};

// Initialize Pusher with your credentials from environment variables
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

// API route to trigger a message
app.post('/api/trigger-message', async (req, res) => {
    try {
        const { message, id } = req.body;

        // Validate input
        if (!message || !id) {
            return res.status(400).json({ error: 'Message and ID are required' });
        }

        // Store the message
        messages[id] = { message, id };

        // Trigger an event in Pusher
        await pusher.trigger("my-channel", "my-event", { message, id });

        return res.status(200).json({ success: 'Message sent' });
    } catch (error) {
        console.error('Error triggering message:', error);
        return res.status(500).json({ error: 'Failed to send message' });
    }
});

// API route to get a message by ID
app.get('/api/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the message exists
        if (!messages[id]) {
            return res.status(404).json({ error: 'Message not found' });
        }

        return res.status(200).json([messages[id]]);
    } catch (error) {
        console.error('Error retrieving message:', error);
        return res.status(500).json({ error: 'Failed to retrieve message' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
