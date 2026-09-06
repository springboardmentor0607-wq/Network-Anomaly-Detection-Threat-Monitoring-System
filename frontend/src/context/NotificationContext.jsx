import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToasts, setActiveToasts] = useState([]);
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [livePackets, setLivePackets] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearLivePackets = useCallback(() => {
    setLivePackets([]);
  }, []);

  const dismissToast = useCallback((id) => {
    setActiveToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const connectWebSocket = useCallback(() => {
    // Clear any existing reconnect timeout first
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // If there is already an active socket, do not create another one
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN) {
        return;
      }
      try {
        socketRef.current.close();
      } catch (e) {}
      socketRef.current = null;
    }

    let wsHost = import.meta.env.VITE_WS_HOST;
    let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    if (!wsHost && import.meta.env.VITE_API_URL) {
      try {
        const parsedUrl = new URL(import.meta.env.VITE_API_URL);
        wsHost = parsedUrl.host;
        protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
      } catch (e) {
        wsHost = 'localhost:8000';
      }
    }
    if (!wsHost) {
      wsHost = 'localhost:8000';
    }

    const wsUrl = `${protocol}//${wsHost}/api/v1/ws/alerts`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (ws === socketRef.current) {
          setIsConnected(true);
          console.log('Real-Time Threat Notifications WebSocket connected.');
        }
      };

      ws.onmessage = (event) => {
        if (ws !== socketRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'LIVE_PACKET' && payload.data) {
            setLivePackets((prev) => [payload.data, ...prev].slice(0, 100));
          } else if (payload.type === 'NEW_ALERT' && payload.data) {
            const newAlert = payload.data;
            const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const toastItem = {
              id: toastId,
              ...newAlert,
              receivedAt: new Date().toISOString(),
            };

            // 1. Show live toast notification
            setActiveToasts((prev) => [toastItem, ...prev].slice(0, 5));

            // 2. Increment badge count
            setUnreadCount((count) => count + 1);

            // 3. Store in real-time alerts stream
            setRealtimeAlerts((prev) => [newAlert, ...prev].slice(0, 100));

            // Auto-dismiss toast after 6 seconds
            setTimeout(() => {
              dismissToast(toastId);
            }, 6000);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        if (ws === socketRef.current) {
          setIsConnected(false);
          socketRef.current = null;
          console.log('WebSocket connection closed. Reconnecting in 3s...');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (err) => {
        if (ws !== socketRef.current) return;
        if (ws.readyState === WebSocket.OPEN) {
          console.warn('WebSocket connection error:', err);
        }
        try {
          ws.close();
        } catch (e) {}
      };
    } catch (err) {
      console.error('WebSocket connection setup failed:', err);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  }, [dismissToast]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        const ws = socketRef.current;
        socketRef.current = null; // Clear reference BEFORE closing to prevent onclose reconnect timer
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        try {
          ws.close();
        } catch (e) {}
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectWebSocket]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        clearUnreadCount,
        activeToasts,
        dismissToast,
        realtimeAlerts,
        livePackets,
        clearLivePackets,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
