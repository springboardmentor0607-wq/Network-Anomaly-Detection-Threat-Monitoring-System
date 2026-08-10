import axios from 'axios';
import { LoginPayload, TokenResponse, User } from '../types/auth';

const API_BASE = '/api/v1';

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const res = await axios.post<TokenResponse>(`${API_BASE}/auth/login`, payload);
    return res.data;
  },

  getMe: async (token: string): Promise<User> => {
    const res = await axios.get<User>(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  logout: async (token: string): Promise<void> => {
    await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
