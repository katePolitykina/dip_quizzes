import type { AuthResponse } from '../types/api';

const STORAGE_KEY = 'quizzly.auth.session';

export interface StoredAuthSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  role: AuthResponse['role'];
  identity: AuthResponse['identity'];
}

export function readAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeAuthSession(session: StoredAuthSession | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function isSessionExpired(session: Pick<StoredAuthSession, 'expiresAt'> | null) {
  if (!session?.expiresAt) {
    return true;
  }

  return new Date(session.expiresAt).getTime() <= Date.now();
}
