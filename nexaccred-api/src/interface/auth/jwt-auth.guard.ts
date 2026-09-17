import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtClaims } from '../../application/auth/jwt-claims';

export interface AuthenticatedRequest extends Request {
  user: JwtClaims;
}

/**
 * Verifies the bearer token's signature and expiry, then attaches its claims
 * to the request as `req.user` — nothing more. This guard establishes *who*
 * the caller is; PermissionsGuard (which always runs after it, see
 * @UseGuards ordering on each controller) decides *what* they're allowed to
 * do. Keeping the two guards separate means a route can require
 * authentication without a specific permission (rare) without duplicating
 * token-verification logic.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.slice('Bearer '.length);
    try {
      request.user = await this.jwt.verifyAsync<JwtClaims>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}
