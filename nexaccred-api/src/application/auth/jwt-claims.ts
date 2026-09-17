import { UserPermission } from '../../domain/ports/user.repository.port';

/**
 * The signed JWT payload. Permissions are embedded at issue time so every
 * request can be authorized from the token alone, with no DB round-trip —
 * this still satisfies RBAC §5 "session role is re-validated server-side on
 * every request, never trusted from the client": the client cannot alter
 * these claims without invalidating the signature, so the guard is trusting
 * NexAccred's own prior server-side lookup, not anything the client asserts.
 *
 * Trade-off, stated plainly: a mid-session permission change (System
 * Administrator edits a role) does not take effect until the affected users
 * re-authenticate. Acceptable for this stage; a production hardening pass
 * would shorten token TTL or add a revocation check.
 */
export interface JwtClaims {
  sub: string; // userId
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  permissions: UserPermission[];
}
