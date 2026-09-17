/**
 * Thin fetch wrapper for nexaccred-api. Every screen that needs backend data
 * goes through this — one place to attach the bearer token, one place to
 * normalize errors into a shape screens can render without each of them
 * re-deriving "what does a 403 look like."
 *
 * Session token lives in localStorage rather than an httpOnly cookie —
 * acceptable for this stage (same trade-off class as the rest of this
 * prototype's "known limitations"), not something to mistake for a
 * production-hardened session model.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'nexaccred.accessToken';
const USER_STORAGE_KEY = 'nexaccred.user';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ? String(body.message) : `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeSession(accessToken, user) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't
    // survive a refresh; not fatal to the current tab's usage.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    /* see storeSession */
  }
}

/**
 * `onUnauthorized` fires on a 401 (expired/invalid token) so the caller
 * (App.jsx) can clear the session and drop back to the login screen —
 * this module doesn't own routing, so it can't do that itself.
 */
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const token = getStoredToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    throw new ApiError(0, { message: `Could not reach the NexAccred API at ${API_BASE_URL} — is it running?` });
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (response.status === 401) {
    onUnauthorized();
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
