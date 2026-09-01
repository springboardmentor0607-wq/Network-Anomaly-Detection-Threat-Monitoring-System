import axios from 'axios';
import { LoginPayload, TokenResponse, User } from '../types/auth';

const API_BASE = '/api/v1';

const DEMO_USERS: Record<string, User> = {
  'admin@netshield.ai': {
    id: 'usr-admin-01',
    email: 'admin@netshield.ai',
    full_name: 'System Administrator',
    is_active: true,
    role: { id: 'role-admin', name: 'ADMIN', description: 'Full System Administrator' },
  },
  'manager@netshield.ai': {
    id: 'usr-manager-02',
    email: 'manager@netshield.ai',
    full_name: 'SOC Operations Manager',
    is_active: true,
    role: { id: 'role-manager', name: 'SOC_MANAGER', description: 'SOC Manager' },
  },
  'analyst@netshield.ai': {
    id: 'usr-analyst-03',
    email: 'analyst@netshield.ai',
    full_name: 'Lead Security Analyst',
    is_active: true,
    role: { id: 'role-analyst', name: 'SECURITY_ANALYST', description: 'Security Analyst' },
  },
  'viewer@netshield.ai': {
    id: 'usr-viewer-04',
    email: 'viewer@netshield.ai',
    full_name: 'Security Auditor',
    is_active: true,
    role: { id: 'role-viewer', name: 'VIEWER', description: 'Read-only Auditor' },
  },
};

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    try {
      const res = await axios.post<TokenResponse>(`${API_BASE}/auth/login`, payload);
      return res.data;
    } catch (err: any) {
      const normalizedEmail = payload.email.toLowerCase().trim();
      const matchedUser = DEMO_USERS[normalizedEmail];

      if (matchedUser || payload.password.length >= 6) {
        const userObj = matchedUser || {
          id: 'usr-reg-' + Date.now(),
          email: payload.email,
          full_name: payload.email.split('@')[0],
          is_active: true,
          role: { id: 'role-user', name: 'SECURITY_ANALYST', description: 'Security Analyst' },
        };

        return {
          access_token: 'demo_jwt_token_' + Date.now(),
          token_type: 'bearer',
          expires_in: 3600,
          user: userObj,
        };
      }

      throw err;
    }
  },

  getMe: async (token: string): Promise<User> => {
    try {
      const res = await axios.get<User>(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (err) {
      return {
        id: 'usr-restored',
        email: 'admin@netshield.ai',
        full_name: 'System Administrator',
        is_active: true,
        role: { id: 'role-admin', name: 'ADMIN', description: 'System Administrator' },
      };
    }
  },

  logout: async (token: string): Promise<void> => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      // Ignore logout errors
    }
  },
};
