export interface AuthRequest {
  token: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}
