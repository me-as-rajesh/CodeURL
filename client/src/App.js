import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const pusher = new Pusher('673ad43ec9062d1735b2', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe('my-channel');
    channel.bind('my-event', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

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

  const notify = (message) => toast.dark(message, {
   
  });

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
      await axios.post('http://localhost:3000/api/trigger-message', {
        message,
        id: sendId,
      });
      notify(`Message sent with ID: ${sendId}`);
      setMessage('');
      setSendId('');
    } catch (error) {
      console.error('Error sending message:', error);
      notify('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const searchMessage = async () => {
    const idError = validateId(searchId);

    if (idError) {
      notify(idError);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/messages/${searchId}`);
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        setMessages([response.data]);
      }
      notify('Message retrieved successfully!');
    } catch (error) {
      console.error('Error searching for messages:', error);
      notify('Failed to retrieve message. Please try again.');
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

      <div className="message-display">
        <h2>Messages</h2>
        <ul className="message-list">
          {messages.map((msg, index) => (
            <li key={index} className="message-item">
              <strong>ID:</strong> {msg.id} <strong>Message:</strong> {msg.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
