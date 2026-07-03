const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let io;

// Tracks who is currently viewing each PDF room: pdfId -> Map(userId -> {name})
const presence = new Map();

const roomName = (pdfId) => `pdf:${pdfId}`;

const emitPresence = (pdfId) => {
  const users = Array.from((presence.get(pdfId) || new Map()).values());
  io.to(roomName(pdfId)).emit('presence:update', { pdfId, users });
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate every socket connection with the same JWT used by the REST API.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger?.info?.(`Socket connected: ${socket.userEmail || socket.userId}`);

    // Join a PDF room to receive live highlight + presence updates for it.
    socket.on('pdf:join', ({ pdfId, name } = {}) => {
      if (!pdfId) return;
      socket.join(roomName(pdfId));
      socket.data.pdfId = pdfId;
      socket.data.name = name || socket.userEmail;

      if (!presence.has(pdfId)) presence.set(pdfId, new Map());
      presence.get(pdfId).set(socket.userId, { name: socket.data.name });
      emitPresence(pdfId);
    });

    socket.on('pdf:leave', ({ pdfId } = {}) => {
      leaveRoom(socket, pdfId);
    });

    // A client changed a highlight via REST; tell everyone else in the room to refetch.
    socket.on('highlight:changed', ({ pdfId, action } = {}) => {
      if (!pdfId) return;
      socket.to(roomName(pdfId)).emit('highlight:changed', {
        pdfId,
        action: action || 'updated',
        by: socket.data.name || socket.userEmail,
      });
    });

    socket.on('disconnect', () => {
      leaveRoom(socket, socket.data.pdfId);
    });
  });

  return io;
};

const leaveRoom = (socket, pdfId) => {
  if (!pdfId) return;
  socket.leave(roomName(pdfId));
  const room = presence.get(pdfId);
  if (room) {
    room.delete(socket.userId);
    if (room.size === 0) presence.delete(pdfId);
    emitPresence(pdfId);
  }
};

const getIO = () => io;

module.exports = { initSocket, getIO };
