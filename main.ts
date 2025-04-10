// @ts-types="npm:@types/express@4.17.15"
import express from "express";
import { createServer } from "node:http";
import { Server } from "npm:socket.io@4.8.1";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins (or set to your frontend URL)
  },
});

// HTTP route
app.get("/", (req, res) => {
  res.send("Welcome to the Dinosaur API with Socket.IO!");
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("dinoRoar", (msg) => {
    console.log("Roar received:", msg);
    io.emit("dinoRoarBack", `🦖 Roar back: ${msg}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the HTTP server (with socket.io support)
httpServer.listen(8085, () => {
  console.log(`🚀 Server running at http://localhost:8085`);
});
