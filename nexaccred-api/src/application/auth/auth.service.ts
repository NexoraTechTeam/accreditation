import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY_PORT, UserRepositoryPort, UserPermission } from '../../domain/ports/user.repository.port';
import { PasswordHasher } from '../../infrastructure/auth/password-hasher';
import { JwtClaims } from './jwt-claims';

export interface LoginResult {
  accessToken: string;
  expiresInMinutes: number;
  // `permissions` is included here as well as inside the JWT itself — not a
  // new disclosure, just handing the client the same facts already signed
  // into its own token, so it doesn't need to base64-decode the JWT payload
  // just to know what it's allowed to see. Consumed by
  // nexaccred-react/src/api/permissions.js to decide whether to render a
  // gated UI section AT ALL, never to bypass a 403 — the backend's
  // PermissionsGuard remains the actual enforcement (interface/auth/permissions.guard.ts).
  user: { id: string; fullName: string; email: string; roleName: string; permissions: UserPermission[] };
}

const TOKEN_TTL_MINUTES = 480; // 8h — a work-session length, not AIHCM's convention specifically

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly users: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    // Deliberately identical error for "no such user" and "wrong password" —
    // distinguishing them lets an attacker enumerate valid emails.
    if (!user || user.status !== 'Active') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.users.recordLogin(user.id);

    const claims: JwtClaims = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      roleName: user.roleName,
      permissions: user.permissions,
    };

    const accessToken = await this.jwt.signAsync(claims, { expiresIn: `${TOKEN_TTL_MINUTES}m` });

    return {
      accessToken,
      expiresInMinutes: TOKEN_TTL_MINUTES,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleName: user.roleName,
        permissions: user.permissions,
      },
    };
  }
}
