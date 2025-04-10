// @ts-types="npm:@types/express@4.17.15"
import express from "express";
import { createServer } from "node:http";
import { Server } from "npm:socket.io@4.8.1";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const rooms: Map<string, Set<string>> = new Map();

app.get("/", (req, res) => {
  res.send("🦖 Welcome to the Dinosaur Game API with Rooms!");
});

io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] A user connected: ${socket.id}`);

  // Create Room
  socket.on("createRoom", (roomCode: string) => {
    if (rooms.has(roomCode)) {
      socket.emit("errorMessage", "Room already exists.");
      return;
    }

    rooms.set(roomCode, new Set([socket.id]));
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
    console.log(`Room ${roomCode} created by ${socket.id}`);
  });

  // Join Room
  socket.on("joinRoom", (roomCode: string) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit("errorMessage", "Room does not exist.");
      return;
    }

    if (room.size >= 5) {
      socket.emit("errorMessage", "Room is full.");
      return;
    }

    room.add(socket.id);
    socket.join(roomCode);
    socket.emit("roomJoined", roomCode);
    io.to(roomCode).emit("playerJoined", socket.id);
    console.log(`${socket.id} joined room ${roomCode}`);
  });

  socket.on("dinoRoar", ({ roomCode, message }) => {
    if (rooms.has(roomCode)) {
      console.log(`Roar from ${socket.id} in room ${roomCode}: ${message}`);
      io.to(roomCode).emit(
        "dinoRoarBack",
        `🦖 Roar from ${socket.id}: ${message}`
      );
    } else {
      socket.emit("errorMessage", "You're not in a valid room.");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(
      `[${new Date().toISOString()}] User disconnected: ${socket.id}`
    );
    for (const [roomCode, players] of rooms.entries()) {
      if (players.has(socket.id)) {
        players.delete(socket.id);
        io.to(roomCode).emit("playerLeft", socket.id);

        if (players.size === 0) {
          rooms.delete(roomCode);
          console.log(`Room ${roomCode} deleted (empty).`);
        }

        break;
      }
    }
  });
});

httpServer.listen(8085, () => {
  console.log(`🚀 Server running at http://localhost:8085`);
});
