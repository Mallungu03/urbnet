export interface IJwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  jti: string; // JWT unique ID (para blacklist)
  exp?: number;
}
