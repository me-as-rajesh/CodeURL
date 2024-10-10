import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sendId, setSendId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const MESSAGE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Memoize the function to avoid unnecessary re-renders
  const isMessageExpired = useCallback((timestamp) => {
    return (Date.now() - timestamp) >= MESSAGE_EXPIRATION_TIME;
  }, [MESSAGE_EXPIRATION_TIME]);

  const removeExpiredMessages = useCallback(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));

    setMessages(validMessages); // Update state with only valid messages
    localStorage.setItem('messages', JSON.stringify(validMessages)); // Update localStorage
  }, [isMessageExpired]);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));

    setMessages(validMessages);
    localStorage.setItem('messages', JSON.stringify(validMessages));

    const pusher = new Pusher('673ad43ec9062d1735b2', {
      cluster: 'ap2',
    });

    const channel = pusher.subscribe('my-channel');
    channel.bind('my-event', (data) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, data];
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        return updatedMessages;
      });
      notify(`New message received with ID: ${data.id}`);
    });

    // Set interval to check and remove expired messages every minute
    const interval = setInterval(() => {
      removeExpiredMessages();
    }, 60000); // Check every minute

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      clearInterval(interval); // Cleanup the interval on unmount
    };
  }, [isMessageExpired, removeExpiredMessages]); // Add the memoized functions as dependencies

  const validateMessage = (msg) => {
    if (!msg || msg.trim().length === 0) {
      return 'Message cannot be empty.';
    }
    return null;
  };

  const validateId = (id) => {
    if (!id || id.trim().length === 0) {
      return 'ID cannot be empty.';
    }
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      return 'ID must be alphanumeric.';
    }
    return null;
  };

  const notify = (message) => toast.dark(message);

  const sendMessage = async () => {
    const messageError = validateMessage(message);
    const idError = validateId(sendId);

    if (messageError) {
      notify(messageError);
      return;
    }

    if (idError) {
      notify(idError);
      return;
    }

    setIsSending(true);

    try {
      await axios.post('http://localhost:3001/api/trigger-message', {
        message,
        id: sendId,
      });

      const existingMessageIndex = messages.findIndex((msg) => msg.id === sendId);
      let updatedMessages;

      const newMessage = { id: sendId, message, timestamp: Date.now() }; // Add timestamp

      if (existingMessageIndex !== -1) {
        updatedMessages = [...messages];
        updatedMessages[existingMessageIndex].message = message;
        updatedMessages[existingMessageIndex].timestamp = Date.now(); // Update timestamp on message change
        notify(`Message with ID: ${sendId} updated successfully!`);
      } else {
        updatedMessages = [...messages, newMessage];
        notify(`Message sent with ID: ${sendId}`);
      }

      setMessages(updatedMessages);
      localStorage.setItem('messages', JSON.stringify(updatedMessages));

      setMessage('');
      setSendId('');
    } catch (error) {
      console.error('Error sending message:', error);
      notify('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const searchMessage = () => {
    const idError = validateId(searchId);

    if (idError) {
      notify(idError);
      return;
    }

    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));

    const messageToFetch = validMessages.find((msg) => msg.id === searchId);
    if (messageToFetch) {
      setMessage(messageToFetch.message);
      notify('Message retrieved successfully!');
    } else {
      setMessage('');
      notify('Message not found.');
    }
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-center" />
      <div className="top-section">
        <div className="search-id">
          <label>Search ID</label>
          <input
            type="text"
            placeholder="Enter ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button onClick={searchMessage} className="search-button">Search</button>
        </div>
        <h1 className="app-title">Real-Time Messenger</h1>
        <div className="create-id">
          <label>Create ID</label>
          <input
            type="text"
            placeholder="Enter ID"
            value={sendId}
            onChange={(e) => setSendId(e.target.value)}
          />
          <button onClick={sendMessage} className="send-button" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      <div className="message-section">
        <label>Message:</label>
        <textarea
          placeholder="Type your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows="4"
        />
      </div>
    </div>
  );
};

export default App;
