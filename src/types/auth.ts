export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK';

export interface AuthenticatedUser {
  id: number;
  email: string;
  password: string;
  authProvider: AuthProvider;
  name: string;
  enabled: boolean;
  role: string;
}

export interface LoginResponse {
  refreshToken: string;
  accessToken: string;
  user: AuthenticatedUser;
}
