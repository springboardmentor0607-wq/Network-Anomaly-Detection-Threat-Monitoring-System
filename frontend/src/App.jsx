import React from 'react';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationToast from './components/NotificationToast';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRouter />
        <NotificationToast />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
