import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '../services/websocket';

// Real-time collaboration for a single PDF: joins a room, tracks who else is
// viewing, and relays highlight changes so collaborators stay in sync live.
export const useCollaboration = (pdfId, userName) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [lastChange, setLastChange] = useState(null);

  useEffect(() => {
    if (!pdfId) return;

    // Ensure a connection exists (lazy connect on first PDF opened).
    const token = localStorage.getItem('token');
    if (token) websocketService.connect(token);

    websocketService.emit('pdf:join', { pdfId, name: userName });

    const handlePresence = (data) => {
      if (data.pdfId === pdfId) setActiveUsers(data.users || []);
    };
    const handleChange = (data) => {
      if (data.pdfId === pdfId) setLastChange({ ...data, at: Date.now() });
    };

    websocketService.on('presence:update', handlePresence);
    websocketService.on('highlight:changed', handleChange);

    return () => {
      websocketService.emit('pdf:leave', { pdfId });
      websocketService.off('presence:update');
      websocketService.off('highlight:changed');
    };
  }, [pdfId, userName]);

  // Broadcast a local highlight change to other collaborators in this room.
  const notifyHighlightChange = useCallback(
    (action) => {
      if (pdfId) websocketService.emit('highlight:changed', { pdfId, action });
    },
    [pdfId]
  );

  return { activeUsers, lastChange, notifyHighlightChange };
};
