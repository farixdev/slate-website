import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Expired tokens are rejected rather than tolerated: an admin session
      // that never ends is a session that outlives the laptop it was opened on.
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwtSecret')!,
    });
  }

  validate(payload: { sub: string; role: string }) {
    return { username: payload.sub, role: payload.role };
  }
}
