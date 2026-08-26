import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';

/**
 * A bcrypt hash used only when no admin password is configured at all.
 *
 * It is the hash of a fixed string nobody will type, so a comparison against it
 * always fails — which is the correct outcome when a deployment has no password
 * set. It is a literal rather than something hashed at boot because hashing
 * costs a third of a second, and a serverless cold start should not spend that
 * computing a value which is identical every time.
 */
const NO_PASSWORD_CONFIGURED =
  '$2b$12$ujDWKbvSBdwtIZIjVX/Wiehqjzc.TM3B76f6nLBAi/lCfd5.p7Pum';

/**
 * The single admin account.
 *
 * One account, from the environment, rather than a users table. This is the
 * admin panel for one product's own marketing site — there is nobody to invite,
 * no roles to separate, and a user table would be a database of one row plus a
 * whole registration surface to keep secure for no benefit.
 *
 * The interesting part is making a wrong username and a wrong password
 * indistinguishable, so nobody can discover the username by watching how long
 * the server takes to say no. See `signIn`.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly username: string;
  private readonly passwordHash: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.username = this.config.get<string>('admin.username') ?? 'admin';

    const hash = this.config.get<string>('admin.passwordHash');
    const plain = this.config.get<string>('admin.password');

    if (hash) {
      this.passwordHash = hash;
    } else if (plain) {
      // A convenience for local runs only. It costs a few hundred milliseconds,
      // and on serverless it pays that on *every cold start* — which is the
      // practical reason to set ADMIN_PASSWORD_HASH in production, quite apart
      // from not wanting the plaintext in the environment at all.
      this.passwordHash = bcrypt.hashSync(plain, 12);
      this.logger.warn(
        'ADMIN_PASSWORD is set in plaintext and is being hashed at startup. ' +
          'Generate a hash with `npm run hash-password` and set ' +
          'ADMIN_PASSWORD_HASH instead.',
      );
    } else {
      this.passwordHash = '';
      this.logger.error(
        'No admin password configured. The admin panel is unreachable until ' +
          'ADMIN_PASSWORD_HASH or ADMIN_PASSWORD is set.',
      );
    }
  }

  async signIn(username: string, password: string) {
    /*
      Both halves are checked in a way that takes the same time whatever is
      wrong, and neither short-circuits the other.

      The password is always compared against the *real* configured hash, even
      when the username is wrong. An earlier version compared against a separate
      decoy hash instead, which quietly defeated its own purpose: the decoy was
      generated at bcrypt cost 10 while a real hash is cost 12, so a wrong
      username came back nearly four times faster than a wrong password and the
      username could be recovered by timing alone. Using one hash on both paths
      removes the possibility of that mismatch, rather than relying on someone
      remembering to keep two costs in step.

      The username is compared over SHA-256 digests, which are always the same
      length — `timingSafeEqual` throws on differing lengths, and a plain `===`
      on strings stops at the first byte that differs.
    */
    const target = this.passwordHash || NO_PASSWORD_CONFIGURED;
    const passwordMatches = await bcrypt.compare(password ?? '', target);
    const usernameMatches = constantTimeEquals(username ?? '', this.username);

    if (!usernameMatches || !passwordMatches || !this.passwordHash) {
      // One message for both failures: telling an attacker which half they got
      // right halves their work.
      throw new UnauthorizedException('Incorrect username or password.');
    }

    const token = await this.jwt.signAsync({ sub: username, role: 'admin' });
    return { token, username, expiresIn: this.config.get<string>('jwtExpiresIn') };
  }
}

/** Compares two strings without leaking where they first differ. */
function constantTimeEquals(a: string, b: string): boolean {
  const left = createHash('sha256').update(a, 'utf8').digest();
  const right = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(left, right);
}
