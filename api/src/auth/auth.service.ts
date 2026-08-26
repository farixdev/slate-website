import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

/**
 * The single admin account.
 *
 * One account, from the environment, rather than a users table. This is the
 * admin panel for one product's own marketing site — there is nobody to invite,
 * no roles to separate, and a user table would be a database of one row plus a
 * whole registration surface to keep secure for no benefit.
 *
 * The password is compared with bcrypt, and a wrong *username* still runs the
 * comparison against a dummy hash so that guessing the username cannot be done
 * by timing the response.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** Compared against when the username is wrong, purely to burn the same time. */
  private readonly decoyHash = bcrypt.hashSync('decoy-password-never-matches', 10);

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
      // Hashing at boot is a convenience for local runs. In production set
      // ADMIN_PASSWORD_HASH so the plaintext is never in the environment.
      this.passwordHash = bcrypt.hashSync(plain, 12);
      this.logger.warn(
        'ADMIN_PASSWORD is set in plaintext. Generate a hash with ' +
          '`npm run hash-password` and use ADMIN_PASSWORD_HASH instead.',
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
    const usernameMatches = username === this.username;

    // Always run a comparison, even when the username is wrong, so the two
    // failure paths take the same time.
    const target = usernameMatches && this.passwordHash
      ? this.passwordHash
      : this.decoyHash;
    const passwordMatches = await bcrypt.compare(password ?? '', target);

    if (!usernameMatches || !passwordMatches || !this.passwordHash) {
      // One message for both failures: telling an attacker which half they got
      // right halves the work.
      throw new UnauthorizedException('Incorrect username or password.');
    }

    const token = await this.jwt.signAsync({ sub: username, role: 'admin' });
    return { token, username, expiresIn: this.config.get<string>('jwtExpiresIn') };
  }
}
