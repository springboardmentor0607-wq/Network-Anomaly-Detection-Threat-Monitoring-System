import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [countdown, setCountdown] = useState(30);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerManualRefresh = useCallback(() => {
    setCountdown(30);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh((prev) => !prev);
  }, []);

  useEffect(() => {
    let timer = null;
    if (isAutoRefresh) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setRefreshTrigger((trigger) => trigger + 1);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoRefresh]);

  return (
    <RefreshContext.Provider
      value={{
        countdown,
        isAutoRefresh,
        toggleAutoRefresh,
        triggerManualRefresh,
        refreshTrigger
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
