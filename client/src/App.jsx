import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Container,
  Stack,
} from "@mui/material";

function Bubble({ message, from, name }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: from === "me" ? "flex-end" : "flex-start",
      }}
    >
      <Typography variant="caption" sx={{ mb: 0.2 }}>
        {name || "Anonymous"}
      </Typography>
      <Paper
        sx={{
          backgroundColor: (theme) =>
            from === "me" ? theme.palette.primary.main : theme.palette.grey[300],
          color: (theme) =>
            from === "me"
              ? theme.palette.primary.contrastText
              : theme.palette.text.primary,
          padding: "8px 12px",
          borderRadius: 2,
          maxWidth: "70%",
        }}
      >
        {message}
      </Paper>
    </Box>
  );
}

function App() {
  const [socket, setSocket] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socketId, setSocketId] = useState("");
  const [name] = useState("Anonymous"); // Always "Anonymous"

  // Handle login and connect socket
  const handleLogin = async () => {
    try {
      await fetch("http://localhost:3000/login", { credentials: "include" });
      const s = io("http://localhost:3000", {
        withCredentials: true,
        reconnection: true,
      });

      s.on("connect", () => {
        setSocketId(s.id);
        setLoggedIn(true);
      });

      s.on("receive-message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      setSocket(s);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // Join the specified room
  const handleJoin = (e) => {
    e.preventDefault();
    if (room && socket) {
      socket.emit("join-room", room);
      setMessages([]);
    }
  };

  // Send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const msgObj = { room, message, name };
    socket.emit("message", msgObj);
    setMessages((prev) => [...prev, { from: "me", message, name }]);
    setMessage("");
  };

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      {!loggedIn ? (
        <Button fullWidth variant="contained" onClick={handleLogin}>
          Login & Connect
        </Button>
      ) : (
        <>
          <Typography sx={{ mb: 1 }}>Socket ID: {socketId}</Typography>

          <Stack spacing={2}>
            {/* Room input + Join button */}
            <Box component="form" onSubmit={handleJoin} sx={{ display: "flex", gap: 1 }}>
              <TextField
                label="Room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                fullWidth
              />
              <Button variant="outlined" type="submit">
                Join
              </Button>
            </Box>

            {/* Messages display */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                height: 300,
                overflowY: "auto",
                p: 2,
                border: "1px solid",
                borderColor: "grey.300",
                borderRadius: 1,
              }}
            >
              {messages.map((m, i) => (
                <Bubble key={i} from={m.from} message={m.message} name={m.name || "Anonymous"} />
              ))}
            </Box>

            {/* Message input */}
            <Box component="form" onSubmit={handleSend} sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button variant="contained" type="submit">
                Send
              </Button>
            </Box>
          </Stack>
        </>
      )}
    </Container>
  );
}

export default App;
