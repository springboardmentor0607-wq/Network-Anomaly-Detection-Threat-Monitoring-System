import React from 'react';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import NotificationToast from './components/NotificationToast';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <NotificationToast />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
