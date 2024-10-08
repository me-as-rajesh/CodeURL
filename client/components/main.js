import React, { useState, useEffect } from "react";
import Pusher from "pusher-js";
import "./App.css";

const App = () => {
  const [message, setMessage] = useState("");
  const [messageId, setMessageId] = useState("");
  const [displayMessage, setDisplayMessage] = useState("No message found.");

  // Initialize Pusher once when the component mounts
  useEffect(() => {
    const pusher = new Pusher("YOUR_APP_KEY", {
      cluster: "YOUR_APP_CLUSTER",
      encrypted: true,
    });

    const channel = pusher.subscribe("message-channel");

    // When a new message is received, update the displayMessage state
    channel.bind("new-message", function (data) {
      setDisplayMessage(`Message: ${data.message}`);
    });

    return () => {
      pusher.unsubscribe("message-channel");
    };
  }, []);

  // Function to create a message and trigger Pusher event
  const createMessage = async () => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessageId(id);

    await fetch("https://your-serverless-url.com/trigger-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, id: id }),
    });

    alert(`Message created with ID: ${id}`);
  };

  const searchMessage = () => {
    // Logic to search message from serverless backend could be here if needed
    alert("Search functionality will be tied to the backend");
  };

  return (
    <div className="container">
      <div className="section">
        <label htmlFor="search-id">Search ID</label>
        <input type="text" id="search-id" placeholder="Enter ID" />
        <button onClick={searchMessage}>Search</button>
      </div>

      <div className="section">
        <label htmlFor="message">Message Box</label>
        <textarea
          id="message"
          rows="4"
          cols="50"
          placeholder="Type your message here"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={createMessage}>Create ID</button>
      </div>

      <div className="section">
        <h3>Message Display</h3>
        <p id="display-message">{displayMessage}</p>
      </div>
    </div>
  );
};

export default App;
