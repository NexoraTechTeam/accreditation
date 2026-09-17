import { api, storeSession, clearSession } from './client';

/**
 * Maps the prototype's 6 role cards to the demo users seeded by
 * nexaccred-api/prisma/seed.ts. The login screen stays a role picker (the
 * deliberate prototype UX — see Login.jsx's own comment) but now performs a
 * real authenticated login against the backend instead of just setting
 * local state, using the fixed demo credentials the backend seeds.
 */
export const ROLE_DEMO_EMAIL = {
  head: 'joan.marsh@nexaccred.io',
  auditor: 'm.santos@nexaccred.io',
  impartiality: 'k.devi@nexaccred.io',
  staff: 'rahayu.ningsih@nexaccred.io',
  doccontrol: 'helda.mutiara@nexaccred.io',
  admin: 'r.alvi@nexaccred.io',
};

const DEMO_PASSWORD = 'NexAccred123!';

export async function loginAsRole(roleId) {
  const email = ROLE_DEMO_EMAIL[roleId];
  if (!email) throw new Error(`No demo login mapped for role "${roleId}"`);

  const result = await api.post('/auth/login', { email, password: DEMO_PASSWORD });
  storeSession(result.accessToken, result.user);
  return result.user;
}

export function logout() {
  clearSession();
}
