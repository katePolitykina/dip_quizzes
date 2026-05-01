const DEFAULT_BACKEND_HTTP_URL = 'http://localhost:8080';

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function readEnvValue(value: string | undefined) {
  return value?.trim() ? trimTrailingSlash(value.trim()) : undefined;
}

function toWebSocketBaseUrl(httpUrl: string) {
  return httpUrl.replace(/^http/, 'ws');
}

const apiBaseUrl = readEnvValue(import.meta.env.VITE_API_BASE_URL) ?? '';
const backendHttpUrl = apiBaseUrl || DEFAULT_BACKEND_HTTP_URL;

export const appConfig = {
  apiBaseUrl,
  oauthBaseUrl: readEnvValue(import.meta.env.VITE_OAUTH_BASE_URL) ?? backendHttpUrl,
  wsBaseUrl: readEnvValue(import.meta.env.VITE_WS_BASE_URL) ?? toWebSocketBaseUrl(backendHttpUrl),
};
