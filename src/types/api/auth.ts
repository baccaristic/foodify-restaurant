export type UserRole =
  | 'RESTAURANT_ADMIN'
  | 'CLIENT'
  | 'DRIVER'
  | 'SUPER_ADMIN'
  | string;

export interface UserDTO {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  restaurantId?: number;
  avatarUrl?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: UserDTO;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse extends AuthTokens {}

export interface HeartbeatResponse {
  status: 'active' | 'inactive';
}
