/**
 * Client-side reflection of the SAME permission check nexaccred-api's
 * PermissionsGuard runs server-side (interface/auth/permissions.guard.ts) —
 * same domain vocabulary, same NoAccess < View < Edit < Approve ordering.
 *
 * This is deliberately NOT a security boundary — the backend guard is the
 * only thing that actually protects data (RBAC §5: "every API endpoint
 * validates role_permission server-side"). What this IS for: deciding
 * whether to render a gated UI section at all, so an unauthorized role
 * never sees a "you don't have permission" error for something it was never
 * going to be shown in the first place — see App.jsx's readiness strip. A
 * user forging or editing this check client-side gains nothing: every real
 * request still goes through the server guard.
 */
const LEVEL_RANK = { NoAccess: 0, View: 1, Edit: 2, Approve: 3 };

/** `user` is the object stored by src/api/client.js's storeSession — see
 *  nexaccred-api's LoginResult, whose `user.permissions` comes straight
 *  from the same Role/RolePermission rows the JWT itself was signed with. */
export function hasPermission(user, entityDomain, minLevel) {
  const grant = user?.permissions?.find((p) => p.entityDomain === entityDomain);
  const grantedLevel = grant ? LEVEL_RANK[grant.accessLevel] : LEVEL_RANK.NoAccess;
  return grantedLevel >= LEVEL_RANK[minLevel];
}
