import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../common/auth-user.interface';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  organizationId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role as AuthUser['role'],
      organizationId: payload.organizationId,
    };
  }
}
