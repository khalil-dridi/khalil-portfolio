export interface LoginRequest {
  email: string;
  password: string;
}

export interface AdminUser {
  id?: number | string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  admin: AdminUser;
}

export interface CsrfResponse {
  token?: string;
  csrfToken?: string;
  headerName?: string;
}
