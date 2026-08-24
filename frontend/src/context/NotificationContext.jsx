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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_HOST || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/api/v1/ws/alerts`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Real-Time Threat Notifications WebSocket connected.');
      };

      ws.onmessage = (event) => {
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

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 3 seconds without spamming poll requests
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection setup failed:', err);
    }
  }, [dismissToast]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
