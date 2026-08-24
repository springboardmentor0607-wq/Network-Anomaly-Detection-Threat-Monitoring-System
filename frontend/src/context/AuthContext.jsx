import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token')
  );
};

const clearStoredToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('jwt');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('jwt');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;

      try {
        const profileResponse = await api.get('/auth/me');
        setUser(profileResponse.data);
        setToken(storedToken);
      } catch (error) {
        console.warn('Session validation failed:', error);
        clearStoredToken();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const persistToken = (authToken, rememberMe) => {
    clearStoredToken();

    if (rememberMe) {
      localStorage.setItem('token', authToken);
      localStorage.setItem('access_token', authToken);
    } else {
      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('access_token', authToken);
    }

    setToken(authToken);
  };

  const login = async ({ email, password, rememberMe = false }) => {
    const response = await api.post('/auth/login', { email, password });
    const authToken = response.data.access_token;

    persistToken(authToken, rememberMe);
    // Ensure axios instance uses the token immediately to avoid race conditions
    try {
      api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
    } catch (e) {
      // ignore
    }

    const profileResponse = await api.get('/auth/me');
    setUser(profileResponse.data);
    return profileResponse.data;
  };

  const register = async ({ fullName, email, password, confirmPassword, role, rememberMe = false }) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
      role,
    });

    return login({ email, password, rememberMe });
  };

  const logout = async () => {
    // Call the backend logout endpoint first so an audit log is written.
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network/auth errors — we still clear the session locally.
    }
    clearStoredToken();
    try {
      delete api.defaults.headers.common.Authorization;
    } catch (e) {}
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
