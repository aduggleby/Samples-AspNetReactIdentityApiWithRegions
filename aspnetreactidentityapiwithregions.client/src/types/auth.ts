export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserData;
}

export interface UserData {
  id: string;
  email: string;
  // Add other user fields as needed
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  title?: string;
  errors?: Record<string, string[]>;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly errors?: string[],
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
