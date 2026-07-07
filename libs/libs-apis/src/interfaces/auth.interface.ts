export interface JwtPayload {
  /** Subject: User ID */
  sub: string;

  /** Session ID key in cache */
  sid: string;

  /** Target tenant code scope */
  tenantCode: string;

  /** Token type: must be 'access' */
  type: 'access';
}

export interface AuthenticatedUser {
  id: string;
  tenantCode: string;
  email: string;
  roles: string[];
}
