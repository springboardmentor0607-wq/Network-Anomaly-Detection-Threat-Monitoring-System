/**
 * Auth API — uses apiClient so the correct backend URL is always used in production.
 * apiClient reads VITE_API_BASE_URL from env (set in render.yaml).
 */
import { apiClient } from './client';
import { LoginPayload, TokenResponse, User } from '../types/auth';

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    // POST JSON body — backend accepts LoginRequest (Pydantic JSON model)
    const res = await apiClient.post('/auth/login', payload);
    const data: TokenResponse = res.data;
    if (data?.access_token) {
      apiClient.setToken(data.access_token);
    }
    return data;
  },

  getMe: async (token: string): Promise<User> => {
    apiClient.setToken(token);
    const res = await apiClient.getCurrentUser();
    return res.data as User;
  },

  logout: async (_token: string): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore logout errors
    } finally {
      apiClient.clearToken();
    }
  },
};
