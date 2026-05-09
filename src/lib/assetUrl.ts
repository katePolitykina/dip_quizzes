import { appConfig } from '../config/appConfig';

export function resolveAssetUrl(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }
  if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${appConfig.backendHttpUrl}${value}`;
  }
  return value;
}
