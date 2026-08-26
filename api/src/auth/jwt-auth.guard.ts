import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards every write endpoint. Read endpoints stay open — the site is public. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
