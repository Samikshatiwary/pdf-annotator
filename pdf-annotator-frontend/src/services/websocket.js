import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5000';

let socket = null;

export const websocketService = {
  connect: (token) => {
    // Idempotent: reuse the existing connection instead of stacking sockets.
    if (socket) return socket;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('connect_error', (err) => {
      console.warn('WebSocket connection error:', err.message);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  emit: (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  },

  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event) => {
    if (socket) {
      socket.off(event);
    }
  },
};