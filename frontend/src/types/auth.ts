export type RoleType = 'ADMIN' | 'SOC_MANAGER' | 'SECURITY_ANALYST' | 'VIEWER';

export interface Role {
  id: string;
  name: RoleType;
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: Role;
  team?: Team;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}
