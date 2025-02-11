import { JwtDto } from '../dtos/jwt-dto';

export class User {
  id: string;
  username: string;
  cuit: string;
  authorities?: { authority: string }[];

  constructor(data: Partial<User>) {
    this.id = data.id || '';
    this.username = data.username || '';
    this.cuit = data.cuit || '';
    this.authorities = data.authorities || [];
  }

  static fromToken(tokenData: any): User {
    return new User({
      id: tokenData.userId || tokenData.sub || '',
      username: tokenData.sub || '',
      cuit: tokenData.cuit || '',
      authorities: tokenData.authorities || []
    });
  }

  hasRole(role: string): boolean {
    return this.authorities?.some(auth => auth.authority === role) || false;
  }
}
