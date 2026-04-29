import type { AuthIdentity, AuthRole, AuthResponse } from '../types/api';
import type { StoredAuthSession } from './authStorage';

const DEFAULT_OAUTH_BASE_URL = 'http://localhost:8080';

interface JwtPayload {
  sub?: string;
  exp?: number;
  email?: string;
  name?: string;
  picture?: string;
  provider?: string;
  role?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
  userId?: string;
  id?: string;
  displayName?: string;
  avatarUrl?: string;
}

function resolveOAuthBaseUrl() {
  const configured =
    (import.meta.env.VITE_OAUTH_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    DEFAULT_OAUTH_BASE_URL;

  return configured.replace(/\/$/, '');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return window.atob(padded);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function firstString(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null;
}

function normalizeRole(role: string | null | undefined, payload: JwtPayload | null): AuthRole {
  const candidates = [
    role,
    payload?.role,
    ...(Array.isArray(payload?.roles) ? payload.roles : [payload?.roles]),
    ...(Array.isArray(payload?.authorities) ? payload.authorities : [payload?.authorities]),
  ];

  return candidates.some((candidate) => candidate === 'ROLE_GUEST') ? 'ROLE_GUEST' : 'ROLE_USER';
}

function parseStructuredIdentity(params: URLSearchParams): Partial<AuthIdentity> | null {
  const structuredIdentity = firstString(params.get('identity'));
  if (!structuredIdentity) {
    return null;
  }

  try {
    return JSON.parse(structuredIdentity) as Partial<AuthIdentity>;
  } catch {
    return null;
  }
}

function buildIdentity(params: URLSearchParams, payload: JwtPayload | null): AuthIdentity {
  const structuredIdentity = parseStructuredIdentity(params);
  const id =
    firstString(
      structuredIdentity?.id,
      params.get('id'),
      params.get('userId'),
      payload?.id,
      payload?.userId,
      payload?.sub
    ) ??
    'google-oauth-user';

  return {
    id,
    email: firstString(structuredIdentity?.email, params.get('email'), payload?.email),
    displayName:
      firstString(
        structuredIdentity?.displayName,
        params.get('displayName'),
        params.get('name'),
        payload?.displayName,
        payload?.name
      ) ??
      'Google User',
    avatarUrl: firstString(
      structuredIdentity?.avatarUrl,
      params.get('avatarUrl'),
      params.get('picture'),
      payload?.avatarUrl,
      payload?.picture
    ),
    provider: firstString(structuredIdentity?.provider, params.get('provider'), payload?.provider) ?? 'google',
  };
}

function buildSessionFromAuthResponse(response: AuthResponse): StoredAuthSession {
  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresAt: response.expiresAt,
    role: response.role,
    identity: response.identity,
  };
}

function parseStructuredSession(params: URLSearchParams): StoredAuthSession | null {
  const structured = firstString(params.get('auth'), params.get('session'));
  if (!structured) {
    return null;
  }

  try {
    const parsed = JSON.parse(structured) as Partial<AuthResponse>;
    if (
      !parsed.accessToken ||
      !parsed.tokenType ||
      !parsed.expiresAt ||
      !parsed.role ||
      !parsed.identity?.id ||
      !parsed.identity.displayName ||
      !parsed.identity.provider
    ) {
      return null;
    }

    return buildSessionFromAuthResponse(parsed as AuthResponse);
  } catch {
    return null;
  }
}

export function getGoogleOAuthStartUrl() {
  return `${resolveOAuthBaseUrl()}/oauth2/authorization/google`;
}

export function getOAuthErrorMessage(params: URLSearchParams) {
  const backendError = firstString(params.get('error_description'), params.get('error'), params.get('message'));
  return backendError ? `Authentication failed: ${backendError}` : 'Authentication failed';
}

export function parseOAuthSessionFromUrl(search: string): StoredAuthSession | null {
  const params = new URLSearchParams(search);
  const structuredSession = parseStructuredSession(params);
  if (structuredSession) {
    return structuredSession;
  }

  const accessToken = firstString(params.get('token'), params.get('accessToken'), params.get('jwt'));
  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  const expiresAt =
    firstString(params.get('expiresAt'), params.get('expires_at')) ??
    (payload?.exp ? new Date(payload.exp * 1000).toISOString() : null);

  if (!expiresAt) {
    return null;
  }

  return {
    accessToken,
    tokenType: firstString(params.get('tokenType'), params.get('token_type')) ?? 'Bearer',
    expiresAt,
    role: normalizeRole(params.get('role'), payload),
    identity: buildIdentity(params, payload),
  };
}
