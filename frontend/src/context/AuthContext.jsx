import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('netshield_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('netshield_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: tokenData } = response.data.data;
      
      setUser(userData);
      setToken(tokenData);
      localStorage.setItem('netshield_user', JSON.stringify(userData));
      localStorage.setItem('netshield_token', tokenData);
      
      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (name, email, password, role = 'analyst') => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { user: userData, token: tokenData } = response.data.data;

      setUser(userData);
      setToken(tokenData);
      localStorage.setItem('netshield_user', JSON.stringify(userData));
      localStorage.setItem('netshield_token', tokenData);

      setLoading(false);
      return userData;
    } catch (error) {
      setLoading(false);
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('netshield_user');
    localStorage.removeItem('netshield_token');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
