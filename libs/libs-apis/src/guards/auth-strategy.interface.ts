import { AuthContext } from '@new-hros/libs-core';

export interface AuthenticationStrategy {
  authenticate(token: string): Promise<AuthContext>;
}
